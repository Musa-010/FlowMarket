import {
  MessageTag,
  SESv2Client,
  SendEmailCommand,
} from '@aws-sdk/client-sesv2';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildDeploymentActiveTemplate,
  buildDeploymentFailedTemplate,
  buildPaymentFailedTemplate,
  buildPayoutProcessedTemplate,
  buildPurchaseConfirmationTemplate,
  buildSellerWorkflowApprovedTemplate,
  buildSellerWorkflowRejectedTemplate,
  buildSubscriptionRenewalTemplate,
  buildWelcomeTemplate,
} from './email.templates';

interface UserRecipient {
  email: string;
  name: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private sesClient: SESv2Client | null | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async sendWelcomeEmail(userId: string): Promise<boolean> {
    const recipient = await this.findUserRecipient(userId);
    if (!recipient) {
      return false;
    }

    const appUrl = this.getAppUrl();
    const content = buildWelcomeTemplate({
      recipientName: recipient.name,
      appUrl,
    });
    return this.sendEmail(recipient.email, content, [
      { Name: 'template', Value: 'WELCOME' },
    ]);
  }

  async sendPurchaseConfirmationEmail(params: {
    buyerId: string;
    workflowTitle: string;
    amountPaid: number;
    purchaseId: string;
    purchasedAt: Date;
  }): Promise<boolean> {
    const recipient = await this.findUserRecipient(params.buyerId);
    if (!recipient) {
      return false;
    }

    const content = buildPurchaseConfirmationTemplate({
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

  async sendDeploymentActiveEmail(params: {
    userId: string;
    workflowTitle: string;
    deploymentId: string;
  }): Promise<boolean> {
    const recipient = await this.findUserRecipient(params.userId);
    if (!recipient) {
      return false;
    }

    const content = buildDeploymentActiveTemplate({
      recipientName: recipient.name,
      workflowTitle: params.workflowTitle,
      deploymentId: params.deploymentId,
      appUrl: this.getAppUrl(),
    });
    return this.sendEmail(recipient.email, content, [
      { Name: 'template', Value: 'DEPLOYMENT_ACTIVE' },
    ]);
  }

  async sendDeploymentFailedEmail(params: {
    userId: string;
    workflowTitle: string;
    deploymentId: string;
    failureReason: string;
  }): Promise<boolean> {
    const recipient = await this.findUserRecipient(params.userId);
    if (!recipient) {
      return false;
    }

    const content = buildDeploymentFailedTemplate({
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

  async sendSellerWorkflowApprovedEmail(params: {
    sellerId: string;
    workflowTitle: string;
  }): Promise<boolean> {
    const recipient = await this.findUserRecipient(params.sellerId);
    if (!recipient) {
      return false;
    }

    const content = buildSellerWorkflowApprovedTemplate({
      recipientName: recipient.name,
      workflowTitle: params.workflowTitle,
      appUrl: this.getAppUrl(),
    });
    return this.sendEmail(recipient.email, content, [
      { Name: 'template', Value: 'SELLER_WORKFLOW_APPROVED' },
    ]);
  }

  async sendSellerWorkflowRejectedEmail(params: {
    sellerId: string;
    workflowTitle: string;
    rejectionReason: string;
  }): Promise<boolean> {
    const recipient = await this.findUserRecipient(params.sellerId);
    if (!recipient) {
      return false;
    }

    const content = buildSellerWorkflowRejectedTemplate({
      recipientName: recipient.name,
      workflowTitle: params.workflowTitle,
      rejectionReason: params.rejectionReason,
      appUrl: this.getAppUrl(),
    });
    return this.sendEmail(recipient.email, content, [
      { Name: 'template', Value: 'SELLER_WORKFLOW_REJECTED' },
    ]);
  }

  async sendPayoutProcessedEmail(params: {
    sellerId: string;
    workflowTitle: string;
    amount: number;
    payoutReference: string;
    processedAt: Date;
  }): Promise<boolean> {
    const recipient = await this.findUserRecipient(params.sellerId);
    if (!recipient) {
      return false;
    }

    const content = buildPayoutProcessedTemplate({
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

  async sendSubscriptionRenewalEmail(params: {
    userId: string;
    planTier: string;
    amount: number;
    renewedAt: Date;
  }): Promise<boolean> {
    const recipient = await this.findUserRecipient(params.userId);
    if (!recipient) {
      return false;
    }

    const content = buildSubscriptionRenewalTemplate({
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

  async sendPaymentFailedEmail(params: {
    userId: string;
    planTier: string;
    amountDue: number;
    retryAt: Date;
  }): Promise<boolean> {
    const recipient = await this.findUserRecipient(params.userId);
    if (!recipient) {
      return false;
    }

    const content = buildPaymentFailedTemplate({
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

  private async sendEmail(
    toEmail: string,
    content: { subject: string; html: string; text: string },
    tags: MessageTag[],
  ): Promise<boolean> {
    const client = this.getSesClient();
    const fromEmail = this.configService.get<string>('AWS_SES_FROM_EMAIL');
    if (!client || !fromEmail) {
      this.logger.warn(
        'Email skipped because AWS SES is not fully configured (AWS_REGION and AWS_SES_FROM_EMAIL required).',
      );
      return false;
    }

    try {
      await client.send(
        new SendEmailCommand({
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
        }),
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send SES email to ${toEmail}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return false;
    }
  }

  private getSesClient(): SESv2Client | null {
    if (this.sesClient !== undefined) {
      return this.sesClient;
    }

    const region = this.configService.get<string>('AWS_REGION');
    if (!region) {
      this.sesClient = null;
      return null;
    }

    const accessKeyId = this.configService.get<string>('AWS_SES_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SES_SECRET_ACCESS_KEY',
    );

    const credentials =
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined;

    if (
      (accessKeyId && !secretAccessKey) ||
      (!accessKeyId && secretAccessKey)
    ) {
      this.logger.warn(
        'AWS SES credentials are partially configured. Falling back to default AWS credential chain.',
      );
    }

    this.sesClient = new SESv2Client({
      region,
      credentials,
    });
    return this.sesClient;
  }

  private async findUserRecipient(
    userId: string,
  ): Promise<UserRecipient | null> {
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

  private getAppUrl(): string {
    return this.configService.get<string>('APP_URL') ?? 'http://localhost:3000';
  }

  private getPortalUrl(): string {
    return (
      this.configService.get<string>('STRIPE_PORTAL_RETURN_URL') ??
      `${this.getAppUrl()}/profile`
    );
  }
}
