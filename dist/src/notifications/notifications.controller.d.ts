import type { Request } from 'express';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    listNotifications(req: Request, query: PaginationQueryDto): Promise<import("../common/pagination/paginated-response").PaginatedResponse<{
        id: string;
        userId: string;
        title: string;
        body: string;
        type: import("@prisma/client").$Enums.NotificationType;
        data: import("@prisma/client/runtime/library").JsonValue;
        isRead: boolean;
        readAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    markRead(req: Request, dto: MarkReadDto): Promise<{
        updated: number;
    }>;
    registerDeviceToken(req: Request, dto: RegisterDeviceTokenDto): Promise<{
        success: boolean;
    }>;
}
