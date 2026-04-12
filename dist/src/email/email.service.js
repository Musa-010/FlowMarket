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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const client_sesv2_1 = require("@aws-sdk/client-sesv2");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const email_templates_1 = require("./email.templates");
let EmailService = EmailService_1 = class EmailService {
    prisma;
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    sesClient;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async sendWelcomeEmail(userId) {
        const recipient = await this.findUserRecipient(userId);
        if (!recipient) {
            return false;
        }
        const appUrl = this.getAppUrl();
        const content = (0, email_templates_1.buildWelcomeTemplate)({
            recipientName: recipient.name,
            appUrl,
        });
        return this.sendEmail(recipient.email, content, [
            { Name: 'template', Value: 'WELCOME' },
        ]);
    }
    async sendPurchaseConfirmationEmail(params) {
        const recipient = await this.findUserRecipient(params.buyerId);
        if (!recipient) {
            return false;
        }
        const content = (0, email_templates_1.buildPurchaseConfirmationTemplate)({
            recipientName: recipient.name,
            workflowTitle: params.workflowTitle,
            amountPaid: params.amountPaid,
            purchaseId: params.purchaseId,
            purchasedAt: params.purchasedAt,
            appUrl: this.getAppUrl(),
        });
        return this.sendEmail(recipient.email, content, [
            { Name: 'template', Value: 'PURCHASE_CONFIRMATION' },
        ]);
    }
    async sendDeploymentActiveEmail(params) {
        const recipient = await this.findUserRecipient(params.userId);
        if (!recipient) {
            return false;
        }
        const content = (0, email_templates_1.buildDeploymentActiveTemplate)({
            recipientName: recipient.name,
            workflowTitle: params.workflowTitle,
            deploymentId: params.deploymentId,
            appUrl: this.getAppUrl(),
        });
        return this.sendEmail(recipient.email, content, [
            { Name: 'template', Value: 'DEPLOYMENT_ACTIVE' },
        ]);
    }
    async sendDeploymentFailedEmail(params) {
        const recipient = await this.findUserRecipient(params.userId);
        if (!recipient) {
            return false;
        }
        const content = (0, email_templates_1.buildDeploymentFailedTemplate)({
            recipientName: recipient.name,
            workflowTitle: params.workflowTitle,
            deploymentId: params.deploymentId,
            failureReason: params.failureReason,
            appUrl: this.getAppUrl(),
        });
        return this.sendEmail(recipient.email, content, [
            { Name: 'template', Value: 'DEPLOYMENT_FAILED' },
        ]);
    }
    async sendSellerWorkflowApprovedEmail(params) {
        const recipient = await this.findUserRecipient(params.sellerId);
        if (!recipient) {
            return false;
        }
        const content = (0, email_templates_1.buildSellerWorkflowApprovedTemplate)({
            recipientName: recipient.name,
            workflowTitle: params.workflowTitle,
            appUrl: this.getAppUrl(),
        });
        return this.sendEmail(recipient.email, content, [
            { Name: 'template', Value: 'SELLER_WORKFLOW_APPROVED' },
        ]);
    }
    async sendSellerWorkflowRejectedEmail(params) {
        const recipient = await this.findUserRecipient(params.sellerId);
        if (!recipient) {
            return false;
        }
        const content = (0, email_templates_1.buildSellerWorkflowRejectedTemplate)({
            recipientName: recipient.name,
            workflowTitle: params.workflowTitle,
            rejectionReason: params.rejectionReason,
            appUrl: this.getAppUrl(),
        });
        return this.sendEmail(recipient.email, content, [
            { Name: 'template', Value: 'SELLER_WORKFLOW_REJECTED' },
        ]);
    }
    async sendPayoutProcessedEmail(params) {
        const recipient = await this.findUserRecipient(params.sellerId);
        if (!recipient) {
            return false;
        }
        const content = (0, email_templates_1.buildPayoutProcessedTemplate)({
            recipientName: recipient.name,
            workflowTitle: params.workflowTitle,
            amount: params.amount,
            payoutReference: params.payoutReference,
            processedAt: params.processedAt,
            appUrl: this.getAppUrl(),
        });
        return this.sendEmail(recipient.email, content, [
            { Name: 'template', Value: 'PAYOUT_PROCESSED' },
        ]);
    }
    async sendSubscriptionRenewalEmail(params) {
        const recipient = await this.findUserRecipient(params.userId);
        if (!recipient) {
            return false;
        }
        const content = (0, email_templates_1.buildSubscriptionRenewalTemplate)({
            recipientName: recipient.name,
            planTier: params.planTier,
            amount: params.amount,
            renewedAt: params.renewedAt,
            portalUrl: this.getPortalUrl(),
        });
        return this.sendEmail(recipient.email, content, [
            { Name: 'template', Value: 'SUBSCRIPTION_RENEWAL' },
        ]);
    }
    async sendPaymentFailedEmail(params) {
        const recipient = await this.findUserRecipient(params.userId);
        if (!recipient) {
            return false;
        }
        const content = (0, email_templates_1.buildPaymentFailedTemplate)({
            recipientName: recipient.name,
            planTier: params.planTier,
            amountDue: params.amountDue,
            retryAt: params.retryAt,
            portalUrl: this.getPortalUrl(),
        });
        return this.sendEmail(recipient.email, content, [
            { Name: 'template', Value: 'PAYMENT_FAILED' },
        ]);
    }
    async sendEmail(toEmail, content, tags) {
        const client = this.getSesClient();
        const fromEmail = this.configService.get('AWS_SES_FROM_EMAIL');
        if (!client || !fromEmail) {
            this.logger.warn('Email skipped because AWS SES is not fully configured (AWS_REGION and AWS_SES_FROM_EMAIL required).');
            return false;
        }
        try {
            await client.send(new client_sesv2_1.SendEmailCommand({
                FromEmailAddress: fromEmail,
                Destination: { ToAddresses: [toEmail] },
                Content: {
                    Simple: {
                        Subject: { Data: content.subject, Charset: 'UTF-8' },
                        Body: {
                            Html: { Data: content.html, Charset: 'UTF-8' },
                            Text: { Data: content.text, Charset: 'UTF-8' },
                        },
                    },
                },
                EmailTags: tags,
            }));
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send SES email to ${toEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    }
    getSesClient() {
        if (this.sesClient !== undefined) {
            return this.sesClient;
        }
        const region = this.configService.get('AWS_REGION');
        if (!region) {
            this.sesClient = null;
            return null;
        }
        const accessKeyId = this.configService.get('AWS_SES_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get('AWS_SES_SECRET_ACCESS_KEY');
        const credentials = accessKeyId && secretAccessKey
            ? { accessKeyId, secretAccessKey }
            : undefined;
        if ((accessKeyId && !secretAccessKey) ||
            (!accessKeyId && secretAccessKey)) {
            this.logger.warn('AWS SES credentials are partially configured. Falling back to default AWS credential chain.');
        }
        this.sesClient = new client_sesv2_1.SESv2Client({
            region,
            credentials,
        });
        return this.sesClient;
    }
    async findUserRecipient(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                email: true,
                name: true,
            },
        });
        if (!user) {
            this.logger.warn(`Email recipient user not found: ${userId}`);
            return null;
        }
        const email = user.email.trim();
        if (!email) {
            this.logger.warn(`Email recipient has empty email: ${userId}`);
            return null;
        }
        return {
            email,
            name: user.name || 'there',
        };
    }
    getAppUrl() {
        return this.configService.get('APP_URL') ?? 'http://localhost:3000';
    }
    getPortalUrl() {
        return (this.configService.get('STRIPE_PORTAL_RETURN_URL') ??
            `${this.getAppUrl()}/profile`);
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map