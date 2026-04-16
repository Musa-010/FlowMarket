import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            role: string;
            stripeCustomerId: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            role: string;
            stripeCustomerId: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(dto: RefreshDto): Promise<{
        accessToken: string;
    }>;
    getMe(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        id: string;
        email: string;
        fullName: string;
        role: string;
        stripeCustomerId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    forgotPassword(body: {
        email: string;
    }): Promise<void>;
}
