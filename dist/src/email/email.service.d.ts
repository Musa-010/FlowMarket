import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class EmailService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private sesClient;
    constructor(prisma: PrismaService, configService: ConfigService);
    sendWelcomeEmail(userId: string): Promise<boolean>;
    sendPurchaseConfirmationEmail(params: {
        buyerId: string;
        workflowTitle: string;
        amountPaid: number;
        purchaseId: string;
        purchasedAt: Date;
    }): Promise<boolean>;
    sendDeploymentActiveEmail(params: {
        userId: string;
        workflowTitle: string;
        deploymentId: string;
    }): Promise<boolean>;
    sendDeploymentFailedEmail(params: {
        userId: string;
        workflowTitle: string;
        deploymentId: string;
        failureReason: string;
    }): Promise<boolean>;
    sendSellerWorkflowApprovedEmail(params: {
        sellerId: string;
        workflowTitle: string;
    }): Promise<boolean>;
    sendSellerWorkflowRejectedEmail(params: {
        sellerId: string;
        workflowTitle: string;
        rejectionReason: string;
    }): Promise<boolean>;
    sendPayoutProcessedEmail(params: {
        sellerId: string;
        workflowTitle: string;
        amount: number;
        payoutReference: string;
        processedAt: Date;
    }): Promise<boolean>;
    sendSubscriptionRenewalEmail(params: {
        userId: string;
        planTier: string;
        amount: number;
        renewedAt: Date;
    }): Promise<boolean>;
    sendPaymentFailedEmail(params: {
        userId: string;
        planTier: string;
        amountDue: number;
        retryAt: Date;
    }): Promise<boolean>;
    private sendEmail;
    private getSesClient;
    private findUserRecipient;
    private getAppUrl;
    private getPortalUrl;
}
