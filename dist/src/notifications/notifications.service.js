"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
const client_1 = require("@prisma/client");
const paginated_response_1 = require("../common/pagination/paginated-response");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    configService;
    logger = new common_1.Logger(NotificationsService_1.name);
    firebaseApp;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async listNotifications(userId, query) {
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.notification.count({ where: { userId } }),
            this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
        ]);
        return (0, paginated_response_1.buildPaginatedResponse)(rows.map((row) => this.mapNotification(row)), total, query.page, query.limit);
    }
    async markRead(userId, dto) {
        const where = dto.notificationIds && dto.notificationIds.length
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
    async registerDeviceToken(userId, dto) {
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
    async createNotification(userId, payload, sendPush = false) {
        const type = this.normalizeType(payload.type);
        const notification = await this.prisma.notification.create({
            data: {
                userId,
                title: payload.title,
                body: payload.body,
                type,
                data: payload.data
                    ? payload.data
                    : undefined,
            },
        });
        if (sendPush) {
            await this.sendPushNotification(userId, payload);
        }
        return this.mapNotification(notification);
    }
    async sendPushNotification(userId, payload) {
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
        const result = await (0, messaging_1.getMessaging)(app).sendEachForMulticast({
            tokens: tokenValues,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data,
        });
        if (result.failureCount > 0) {
            const invalidTokens = [];
            result.responses.forEach((response, index) => {
                if (!response.success) {
                    const code = response.error?.code;
                    if (code === 'messaging/registration-token-not-registered' ||
                        code === 'messaging/invalid-registration-token') {
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
    mapNotification(notification) {
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
    getFirebaseApp() {
        if (this.firebaseApp !== undefined) {
            return this.firebaseApp;
        }
        try {
            const json = this.configService.get('FIREBASE_SERVICE_ACCOUNT_JSON');
            if (json) {
                const parsed = JSON.parse(json);
                this.firebaseApp = this.initFirebaseApp({
                    projectId: parsed.project_id,
                    clientEmail: parsed.client_email,
                    privateKey: parsed.private_key,
                });
                return this.firebaseApp;
            }
            const projectId = this.configService.get('FIREBASE_PROJECT_ID');
            const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
            const privateKey = this.configService
                .get('FIREBASE_PRIVATE_KEY')
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
            this.logger.warn('Firebase is not configured. Push notifications are disabled.');
            return null;
        }
        catch (error) {
            this.firebaseApp = null;
            this.logger.error(`Failed to initialize Firebase app: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }
    initFirebaseApp(params) {
        const existing = (0, app_1.getApps)()[0];
        if (existing) {
            return existing;
        }
        return (0, app_1.initializeApp)({
            credential: (0, app_1.cert)({
                projectId: params.projectId,
                clientEmail: params.clientEmail,
                privateKey: params.privateKey,
            }),
            projectId: params.projectId,
        });
    }
    normalizeType(type) {
        if (!type) {
            return client_1.NotificationType.SYSTEM;
        }
        const normalized = type.toString().trim().toUpperCase();
        if (normalized === client_1.NotificationType.PURCHASE) {
            return client_1.NotificationType.PURCHASE;
        }
        if (normalized === client_1.NotificationType.DEPLOYMENT) {
            return client_1.NotificationType.DEPLOYMENT;
        }
        if (normalized === client_1.NotificationType.REVIEW) {
            return client_1.NotificationType.REVIEW;
        }
        return client_1.NotificationType.SYSTEM;
    }
    serializePayloadData(data) {
        if (!data) {
            return undefined;
        }
        const entries = Object.entries(data).map(([key, value]) => [
            key,
            typeof value === 'string' ? value : JSON.stringify(value),
        ]);
        return Object.fromEntries(entries);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map