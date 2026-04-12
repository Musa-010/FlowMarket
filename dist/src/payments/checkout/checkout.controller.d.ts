import type { Request } from 'express';
import { CreateCustomerPortalDto } from '../dto/create-customer-portal.dto';
import { CreateOneTimeCheckoutDto } from '../dto/create-one-time-checkout.dto';
import { CreateSubscriptionCheckoutDto } from '../dto/create-subscription-checkout.dto';
import { PaymentsService } from '../payments.service';
export declare class CheckoutController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createOneTimeCheckout(req: Request, dto: CreateOneTimeCheckoutDto): Promise<{
        sessionId: string;
        checkoutUrl: string;
    }>;
    createSubscriptionCheckout(req: Request, dto: CreateSubscriptionCheckoutDto): Promise<{
        sessionId: string;
        checkoutUrl: string;
    }>;
    createCustomerPortal(req: Request, dto: CreateCustomerPortalDto): Promise<{
        url: string;
    }>;
    handleStripeWebhook(req: Request, signature?: string): Promise<{
        received: true;
        eventId: string;
        eventType: string;
        duplicate: boolean;
    }>;
}
