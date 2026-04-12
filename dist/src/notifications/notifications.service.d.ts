import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
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
export declare class NotificationsService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private firebaseApp;
    constructor(prisma: PrismaService, configService: ConfigService);
    listNotifications(userId: string, query: PaginationQueryDto): Promise<import("../common/pagination/paginated-response").PaginatedResponse<{
        id: string;
        userId: string;
        title: string;
        body: string;
        type: import("@prisma/client").$Enums.NotificationType;
        data: Prisma.JsonValue;
        isRead: boolean;
        readAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    markRead(userId: string, dto: MarkReadDto): Promise<{
        updated: number;
    }>;
    registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto): Promise<{
        success: boolean;
    }>;
    createNotification(userId: string, payload: NotificationPayload, sendPush?: boolean): Promise<{
        id: string;
        userId: string;
        title: string;
        body: string;
        type: import("@prisma/client").$Enums.NotificationType;
        data: Prisma.JsonValue;
        isRead: boolean;
        readAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    sendPushNotification(userId: string, payload: NotificationPayload): Promise<void>;
    private mapNotification;
    private getFirebaseApp;
    private initFirebaseApp;
    private normalizeType;
    private serializePayloadData;
}
export {};
