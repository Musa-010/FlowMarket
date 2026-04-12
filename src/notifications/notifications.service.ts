import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { Notification, NotificationType, Prisma } from '@prisma/client';
import { buildPaginatedResponse } from '../common/pagination/paginated-response';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MarkReadDto } from './dto/mark-read.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

interface NotificationPayload {
  title: string;
  body: string;
  type?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: App | null | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async listNotifications(userId: string, query: PaginationQueryDto) {
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return buildPaginatedResponse(
      rows.map((row) => this.mapNotification(row)),
      total,
      query.page,
      query.limit,
    );
  }

  async markRead(userId: string, dto: MarkReadDto) {
    const where: Prisma.NotificationWhereInput =
      dto.notificationIds && dto.notificationIds.length
        ? { userId, id: { in: dto.notificationIds } }
        : { userId, isRead: false };

    const result = await this.prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { updated: result.count };
  }

  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
    const token = dto.token.trim();
    await this.prisma.deviceToken.upsert({
      where: { token },
      create: {
        userId,
        token,
        platform: dto.platform?.trim() || null,
      },
      update: {
        userId,
        platform: dto.platform?.trim() || null,
      },
    });

    return { success: true };
  }

  async createNotification(
    userId: string,
    payload: NotificationPayload,
    sendPush = false,
  ) {
    const type = this.normalizeType(payload.type);

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title: payload.title,
        body: payload.body,
        type,
        data: payload.data
          ? (payload.data as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });

    if (sendPush) {
      await this.sendPushNotification(userId, payload);
    }

    return this.mapNotification(notification);
  }

  async sendPushNotification(userId: string, payload: NotificationPayload) {
    const app = this.getFirebaseApp();
    if (!app) {
      return;
    }

    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });
    if (!tokens.length) {
      return;
    }

    const tokenValues = tokens.map((row) => row.token);
    const data = this.serializePayloadData(payload.data);

    const result = await getMessaging(app).sendEachForMulticast({
      tokens: tokenValues,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data,
    });

    if (result.failureCount > 0) {
      const invalidTokens: string[] = [];
      result.responses.forEach((response, index) => {
        if (!response.success) {
          const code = response.error?.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            invalidTokens.push(tokenValues[index] ?? '');
          }
        }
      });

      if (invalidTokens.length) {
        await this.prisma.deviceToken.deleteMany({
          where: { token: { in: invalidTokens.filter(Boolean) } },
        });
      }
    }
  }

  private mapNotification(notification: Notification) {
    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      data: notification.data,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  private getFirebaseApp(): App | null {
    if (this.firebaseApp !== undefined) {
      return this.firebaseApp;
    }

    try {
      const json = this.configService.get<string>(
        'FIREBASE_SERVICE_ACCOUNT_JSON',
      );

      if (json) {
        const parsed = JSON.parse(json) as {
          project_id: string;
          client_email: string;
          private_key: string;
        };

        this.firebaseApp = this.initFirebaseApp({
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key,
        });
        return this.firebaseApp;
      }

      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        this.firebaseApp = this.initFirebaseApp({
          projectId,
          clientEmail,
          privateKey,
        });
        return this.firebaseApp;
      }

      this.firebaseApp = null;
      this.logger.warn(
        'Firebase is not configured. Push notifications are disabled.',
      );
      return null;
    } catch (error) {
      this.firebaseApp = null;
      this.logger.error(
        `Failed to initialize Firebase app: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return null;
    }
  }

  private initFirebaseApp(params: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  }): App {
    const existing = getApps()[0];
    if (existing) {
      return existing;
    }

    return initializeApp({
      credential: cert({
        projectId: params.projectId,
        clientEmail: params.clientEmail,
        privateKey: params.privateKey,
      }),
      projectId: params.projectId,
    });
  }

  private normalizeType(type: NotificationPayload['type']): NotificationType {
    if (!type) {
      return NotificationType.SYSTEM;
    }
    const normalized = type.toString().trim().toUpperCase();

    if (normalized === NotificationType.PURCHASE) {
      return NotificationType.PURCHASE;
    }
    if (normalized === NotificationType.DEPLOYMENT) {
      return NotificationType.DEPLOYMENT;
    }
    if (normalized === NotificationType.REVIEW) {
      return NotificationType.REVIEW;
    }
    return NotificationType.SYSTEM;
  }

  private serializePayloadData(
    data: NotificationPayload['data'],
  ): Record<string, string> | undefined {
    if (!data) {
      return undefined;
    }

    const entries = Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ]);
    return Object.fromEntries(entries) as Record<string, string>;
  }
}
