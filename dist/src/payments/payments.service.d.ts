import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerPortalDto } from './dto/create-customer-portal.dto';
import { CreateOneTimeCheckoutDto } from './dto/create-one-time-checkout.dto';
import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';
export declare class PaymentsService {
    private readonly prisma;
    private readonly configService;
    private readonly emailService;
    private stripeClient;
    constructor(prisma: PrismaService, configService: ConfigService, emailService: EmailService);
    createOneTimeCheckout(userId: string, dto: CreateOneTimeCheckoutDto): Promise<{
        sessionId: string;
        checkoutUrl: string;
    }>;
    createSubscriptionCheckout(userId: string, dto: CreateSubscriptionCheckoutDto): Promise<{
        sessionId: string;
        checkoutUrl: string;
    }>;
    createCustomerPortal(userId: string, dto: CreateCustomerPortalDto): Promise<{
        url: string;
    }>;
    handleStripeWebhook(signature: string, rawBody: Buffer): Promise<{
        received: true;
        eventId: string;
        eventType: string;
        duplicate: boolean;
    }>;
    private dispatchStripeEvent;
    private handleCheckoutSessionCompleted;
    private createPurchaseFromCheckoutSession;
    private handleInvoicePaid;
    private handleInvoicePaymentFailed;
    private syncSubscriptionFromStripe;
    private findUserIdBySubscription;
    private resolvePlan;
    private resolvePlanTier;
    private mapStripeSubscriptionStatus;
    private getSuccessUrl;
    private getCancelUrl;
    private getPortalReturnUrl;
    private getAppBaseUrl;
    private getStripeClient;
    private ensureUser;
    private handleAsyncCheckoutPaymentFailed;
    private handlePaymentIntentFailed;
    private ensureStripeCustomer;
}
