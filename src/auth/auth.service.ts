import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private formatUser(user: { id: string; email: string; name: string; role: string; stripeCustomerId: string | null; createdAt: Date; updatedAt: Date }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.name,
      role: user.role,
      stripeCustomerId: user.stripeCustomerId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private signTokens(userId: string, role: string) {
    const payload = { sub: userId, role };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ?? '15m') as any,
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as any,
    });
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.fullName,
        passwordHash,
        role: dto.role,
      },
    });

    const tokens = this.signTokens(user.id, user.role);
    return { ...tokens, user: this.formatUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.signTokens(user.id, user.role);
    return { ...tokens, user: this.formatUser(user) };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      }) as { sub: string; role: string };

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();

      const accessToken = this.jwt.sign(
        { sub: user.id, role: user.role },
        {
          secret: this.config.get<string>('JWT_SECRET'),
          expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ?? '15m') as any,
        },
      );
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.formatUser(user);
  }

  async forgotPassword(email: string) {
    // Silently succeed even if email not found (security best practice)
    await this.prisma.user.findUnique({ where: { email } });
    // TODO: send reset email via EmailService
  }

  private getFirebaseApp() {
    if (getApps().length > 0) return getApps()[0];
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
    if (projectId && clientEmail && privateKey) {
      return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    }
    return initializeApp();
  }

  async socialLogin(idToken: string) {
    const app = this.getFirebaseApp();
    const decoded = await getAuth(app).verifyIdToken(idToken);
    const email = decoded.email;
    if (!email) throw new UnauthorizedException('No email in token');

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: decoded.name ?? email.split('@')[0],
          passwordHash: '',
          role: 'BUYER',
        },
      });
    }

    const tokens = this.signTokens(user.id, user.role);
    return { ...tokens, user: this.formatUser(user) };
  }
}
