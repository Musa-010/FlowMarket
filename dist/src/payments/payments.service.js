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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const stripe_1 = __importDefault(require("stripe"));
const email_service_1 = require("../email/email.service");
const prisma_service_1 = require("../prisma/prisma.service");
let PaymentsService = class PaymentsService {
    prisma;
    configService;
    emailService;
    stripeClient = null;
    constructor(prisma, configService, emailService) {
        this.prisma = prisma;
        this.configService = configService;
        this.emailService = emailService;
    }
    async createOneTimeCheckout(userId, dto) {
        const stripe = this.getStripeClient();
        const user = await this.ensureUser(userId);
        const workflow = await this.prisma.workflow.findFirst({
            where: {
                id: dto.workflowId,
                status: client_1.WorkflowStatus.APPROVED,
            },
        });
        if (!workflow) {
            throw new common_1.NotFoundException('Approved workflow not found');
        }
        if (!workflow.oneTimePrice || workflow.oneTimePrice <= 0) {
            throw new common_1.BadRequestException('This workflow does not have a one-time purchase price');
        }
        const customerId = await this.ensureStripeCustomer(user);
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer: customerId,
            client_reference_id: user.id,
            success_url: this.getSuccessUrl(),
            cancel_url: this.getCancelUrl(),
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: 'usd',
                        unit_amount: Math.round(workflow.oneTimePrice * 100),
                        product_data: {
                            name: workflow.title,
                            description: workflow.shortDescription,
                        },
                    },
                },
            ],
            metadata: {
                type: 'ONE_TIME_WORKFLOW',
                userId: user.id,
                workflowId: workflow.id,
            },
            payment_intent_data: {
                metadata: {
                    type: 'ONE_TIME_WORKFLOW',
                    userId: user.id,
                    workflowId: workflow.id,
                },
            },
        });
        if (!session.url) {
            throw new common_1.InternalServerErrorException('Stripe did not return a checkout URL');
        }
        return {
            sessionId: session.id,
            checkoutUrl: session.url,
        };
    }
    async createSubscriptionCheckout(userId, dto) {
        const stripe = this.getStripeClient();
        const user = await this.ensureUser(userId);
        const customerId = await this.ensureStripeCustomer(user);
        const plan = this.resolvePlan(dto.planId);
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            client_reference_id: user.id,
            success_url: this.getSuccessUrl(),
            cancel_url: this.getCancelUrl(),
            line_items: [{ price: plan.priceId, quantity: 1 }],
            metadata: {
                type: 'SUBSCRIPTION',
                userId: user.id,
                planId: dto.planId,
                planTier: plan.tier,
            },
            subscription_data: {
                metadata: {
                    userId: user.id,
                    planTier: plan.tier,
                    planId: dto.planId,
                },
            },
        });
        if (!session.url) {
            throw new common_1.InternalServerErrorException('Stripe did not return a checkout URL');
        }
        return {
            sessionId: session.id,
            checkoutUrl: session.url,
        };
    }
    async createCustomerPortal(userId, dto) {
        const stripe = this.getStripeClient();
        const user = await this.ensureUser(userId);
        const customerId = await this.ensureStripeCustomer(user);
        const returnUrl = dto.returnUrl ?? this.getPortalReturnUrl();
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });
        return { url: portalSession.url };
    }
    async handleStripeWebhook(signature, rawBody) {
        const stripe = this.getStripeClient();
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new common_1.ServiceUnavailableException('Stripe webhook secret is not configured');
        }
        let event;
        try {
            event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown signature failure';
            throw new common_1.BadRequestException(`Invalid Stripe signature: ${message}`);
        }
        const existing = await this.prisma.stripeWebhookEvent.findUnique({
            where: { eventId: event.id },
            select: { id: true },
        });
        if (existing) {
            return {
                received: true,
                eventId: event.id,
                eventType: event.type,
                duplicate: true,
            };
        }
        await this.dispatchStripeEvent(event);
        await this.prisma.stripeWebhookEvent.create({
            data: {
                eventId: event.id,
                eventType: event.type,
                payload: event,
            },
        });
        return {
            received: true,
            eventId: event.id,
            eventType: event.type,
            duplicate: false,
        };
    }
    async dispatchStripeEvent(event) {
        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutSessionCompleted(event.data.object);
                return;
            case 'checkout.session.async_payment_succeeded':
                return;
            case 'checkout.session.async_payment_failed':
                await this.handleAsyncCheckoutPaymentFailed(event.data.object);
                return;
            case 'checkout.session.expired':
                return;
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                await this.syncSubscriptionFromStripe(event.data.object);
                return;
            case 'invoice.paid':
                await this.handleInvoicePaid(event.data.object);
                return;
            case 'invoice.payment_failed':
                await this.handleInvoicePaymentFailed(event.data.object);
                return;
            case 'payment_intent.succeeded':
                return;
            case 'payment_intent.payment_failed':
                await this.handlePaymentIntentFailed(event.data.object);
                return;
            default:
                return;
        }
    }
    async handleCheckoutSessionCompleted(session) {
        if (session.mode === 'payment') {
            await this.createPurchaseFromCheckoutSession(session);
            return;
        }
        if (session.mode === 'subscription') {
            const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
            if (!subscriptionId) {
                throw new common_1.BadRequestException('Checkout session is missing subscription id');
            }
            const stripe = this.getStripeClient();
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const fallbackUserId = session.metadata?.userId ?? session.client_reference_id;
            await this.syncSubscriptionFromStripe(subscription, fallbackUserId ?? undefined);
        }
    }
    async createPurchaseFromCheckoutSession(session) {
        const workflowId = session.metadata?.workflowId;
        const fallbackUserId = session.metadata?.userId ?? session.client_reference_id;
        if (!workflowId || !fallbackUserId) {
            throw new common_1.BadRequestException('Checkout session metadata missing workflowId or userId');
        }
        const existingPurchase = await this.prisma.purchase.findUnique({
            where: { stripeCheckoutSessionId: session.id },
            select: { id: true },
        });
        if (existingPurchase) {
            return;
        }
        const workflow = await this.prisma.workflow.findUnique({
            where: { id: workflowId },
            select: { id: true, title: true, sellerId: true },
        });
        if (!workflow) {
            throw new common_1.NotFoundException('Workflow for checkout session was not found');
        }
        const user = await this.ensureUser(fallbackUserId);
        const paymentIntentId = typeof session.payment_intent === 'string'
            ? session.payment_intent
            : null;
        const amountPaid = (session.amount_total ?? 0) / 100;
        const [purchase] = await this.prisma.$transaction([
            this.prisma.purchase.create({
                data: {
                    userId: user.id,
                    workflowId,
                    pricePaid: amountPaid,
                    stripePaymentId: paymentIntentId,
                    stripeCheckoutSessionId: session.id,
                },
            }),
            this.prisma.workflow.update({
                where: { id: workflowId },
                data: { purchaseCount: { increment: 1 } },
            }),
        ]);
        await this.emailService.sendPurchaseConfirmationEmail({
            buyerId: user.id,
            workflowTitle: workflow.title,
            amountPaid,
            purchaseId: purchase.id,
            purchasedAt: purchase.createdAt,
        });
        if (workflow.sellerId && workflow.sellerId !== user.id) {
            await this.emailService.sendPayoutProcessedEmail({
                sellerId: workflow.sellerId,
                workflowTitle: workflow.title,
                amount: amountPaid,
                payoutReference: purchase.id,
                processedAt: purchase.createdAt,
            });
        }
    }
    async handleInvoicePaid(invoice) {
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
        if (!subscriptionId) {
            return;
        }
        const existing = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscriptionId },
            select: { userId: true, plan: true },
        });
        const stripe = this.getStripeClient();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const synced = await this.syncSubscriptionFromStripe(subscription);
        const isRenewal = invoice.billing_reason === 'subscription_cycle' || existing !== null;
        if (isRenewal) {
            await this.emailService.sendSubscriptionRenewalEmail({
                userId: synced.userId,
                planTier: synced.planTier,
                amount: (invoice.amount_paid ?? 0) / 100,
                renewedAt: new Date(),
            });
        }
    }
    async handleInvoicePaymentFailed(invoice) {
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
        if (!subscriptionId) {
            return;
        }
        const existing = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscriptionId },
        });
        if (!existing) {
            return;
        }
        await this.prisma.subscription.update({
            where: { stripeSubscriptionId: subscriptionId },
            data: { status: client_1.SubscriptionStatus.PAST_DUE },
        });
        const nextPaymentAttemptTimestamp = invoice.next_payment_attempt;
        const retryAt = nextPaymentAttemptTimestamp
            ? new Date(nextPaymentAttemptTimestamp * 1000)
            : new Date(Date.now() + 24 * 60 * 60 * 1000);
        await this.emailService.sendPaymentFailedEmail({
            userId: existing.userId,
            planTier: existing.plan,
            amountDue: (invoice.amount_due ?? invoice.amount_remaining ?? 0) / 100,
            retryAt,
        });
    }
    async syncSubscriptionFromStripe(subscription, fallbackUserId) {
        const userId = subscription.metadata.userId ||
            fallbackUserId ||
            (await this.findUserIdBySubscription(subscription.id));
        if (!userId) {
            throw new common_1.BadRequestException('Unable to resolve user for Stripe subscription event');
        }
        const user = await this.ensureUser(userId);
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;
        const priceId = subscription.items.data[0]?.price?.id ?? null;
        const planTier = this.resolvePlanTier(subscription.metadata.planTier, priceId);
        if (customerId && user.stripeCustomerId !== customerId) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { stripeCustomerId: customerId },
            });
        }
        await this.prisma.subscription.upsert({
            where: { stripeSubscriptionId: subscription.id },
            create: {
                userId: user.id,
                plan: planTier,
                status: this.mapStripeSubscriptionStatus(subscription.status),
                stripeSubscriptionId: subscription.id,
                stripePriceId: priceId,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
            update: {
                userId: user.id,
                plan: planTier,
                status: this.mapStripeSubscriptionStatus(subscription.status),
                stripePriceId: priceId,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
        });
        return { userId: user.id, planTier };
    }
    async findUserIdBySubscription(stripeSubscriptionId) {
        const existing = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId },
            select: { userId: true },
        });
        return existing?.userId ?? null;
    }
    resolvePlan(planId) {
        const normalized = planId.trim().toUpperCase();
        const [tierToken, intervalToken] = normalized.split('_');
        let tier;
        switch (tierToken) {
            case 'STARTER':
                tier = client_1.PlanTier.STARTER;
                break;
            case 'PRO':
                tier = client_1.PlanTier.PRO;
                break;
            case 'AGENCY':
                tier = client_1.PlanTier.AGENCY;
                break;
            default:
                throw new common_1.BadRequestException('planId must be STARTER, PRO, AGENCY (optionally suffixed with _MONTHLY or _YEARLY)');
        }
        const interval = intervalToken === 'YEARLY' || intervalToken === 'ANNUAL'
            ? 'YEARLY'
            : 'MONTHLY';
        const directKey = `STRIPE_PRICE_${tier}`;
        const intervalKey = `STRIPE_PRICE_${tier}_${interval}`;
        const priceId = this.configService.get(intervalKey) ??
            this.configService.get(directKey);
        if (!priceId) {
            throw new common_1.ServiceUnavailableException(`Missing Stripe price configuration for ${tier} (${intervalKey} or ${directKey})`);
        }
        return { tier, priceId };
    }
    resolvePlanTier(metadataPlanTier, priceId) {
        if (metadataPlanTier) {
            const normalized = metadataPlanTier.trim().toUpperCase();
            if (normalized === client_1.PlanTier.STARTER) {
                return client_1.PlanTier.STARTER;
            }
            if (normalized === client_1.PlanTier.PRO) {
                return client_1.PlanTier.PRO;
            }
            if (normalized === client_1.PlanTier.AGENCY) {
                return client_1.PlanTier.AGENCY;
            }
        }
        const planMappings = [
            {
                tier: client_1.PlanTier.STARTER,
                keys: [
                    'STRIPE_PRICE_STARTER',
                    'STRIPE_PRICE_STARTER_MONTHLY',
                    'STRIPE_PRICE_STARTER_YEARLY',
                ],
            },
            {
                tier: client_1.PlanTier.PRO,
                keys: [
                    'STRIPE_PRICE_PRO',
                    'STRIPE_PRICE_PRO_MONTHLY',
                    'STRIPE_PRICE_PRO_YEARLY',
                ],
            },
            {
                tier: client_1.PlanTier.AGENCY,
                keys: [
                    'STRIPE_PRICE_AGENCY',
                    'STRIPE_PRICE_AGENCY_MONTHLY',
                    'STRIPE_PRICE_AGENCY_YEARLY',
                ],
            },
        ];
        for (const mapping of planMappings) {
            for (const key of mapping.keys) {
                const configured = this.configService.get(key);
                if (configured && configured === priceId) {
                    return mapping.tier;
                }
            }
        }
        return client_1.PlanTier.STARTER;
    }
    mapStripeSubscriptionStatus(status) {
        switch (status) {
            case 'active':
                return client_1.SubscriptionStatus.ACTIVE;
            case 'trialing':
                return client_1.SubscriptionStatus.TRIALING;
            case 'past_due':
            case 'unpaid':
                return client_1.SubscriptionStatus.PAST_DUE;
            case 'canceled':
                return client_1.SubscriptionStatus.CANCELED;
            case 'incomplete':
            case 'incomplete_expired':
            case 'paused':
                return client_1.SubscriptionStatus.INCOMPLETE;
            default:
                return client_1.SubscriptionStatus.INCOMPLETE;
        }
    }
    getSuccessUrl() {
        return (this.configService.get('STRIPE_CHECKOUT_SUCCESS_URL') ??
            `${this.getAppBaseUrl()}/payment-success?session_id={CHECKOUT_SESSION_ID}`);
    }
    getCancelUrl() {
        return (this.configService.get('STRIPE_CHECKOUT_CANCEL_URL') ??
            `${this.getAppBaseUrl()}/checkout-canceled`);
    }
    getPortalReturnUrl() {
        return (this.configService.get('STRIPE_PORTAL_RETURN_URL') ??
            `${this.getAppBaseUrl()}/profile`);
    }
    getAppBaseUrl() {
        return this.configService.get('APP_URL') ?? 'http://localhost:3000';
    }
    getStripeClient() {
        if (this.stripeClient) {
            return this.stripeClient;
        }
        const secretKey = this.configService.get('STRIPE_SECRET_KEY');
        if (!secretKey) {
            throw new common_1.ServiceUnavailableException('STRIPE_SECRET_KEY is not configured');
        }
        this.stripeClient = new stripe_1.default(secretKey);
        return this.stripeClient;
    }
    async ensureUser(userId) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (existing) {
            return existing;
        }
        const hash = (0, crypto_1.createHash)('sha256').update(userId).digest('hex').slice(0, 10);
        const slug = userId
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .slice(0, 24) || 'user';
        const email = `${slug}-${hash}@users.flowmarket.local`;
        const created = await this.prisma.user.create({
            data: {
                id: userId,
                email,
                name: `User ${userId.slice(0, 12)}`,
                role: client_1.UserRole.BUYER,
            },
        });
        await this.emailService.sendWelcomeEmail(created.id);
        return created;
    }
    async handleAsyncCheckoutPaymentFailed(session) {
        const fallbackUserId = session?.metadata?.userId ?? session?.client_reference_id;
        if (!fallbackUserId) {
            return;
        }
        await this.emailService.sendPaymentFailedEmail({
            userId: fallbackUserId,
            planTier: 'ONE_TIME_WORKFLOW',
            amountDue: (session?.amount_total ?? 0) / 100,
            retryAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
    }
    async handlePaymentIntentFailed(paymentIntent) {
        const userId = paymentIntent?.metadata?.userId;
        if (!userId) {
            return;
        }
        await this.emailService.sendPaymentFailedEmail({
            userId,
            planTier: paymentIntent?.metadata?.planTier ?? 'ONE_TIME_WORKFLOW',
            amountDue: (paymentIntent?.amount ?? 0) / 100,
            retryAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
    }
    async ensureStripeCustomer(user) {
        if (user.stripeCustomerId) {
            return user.stripeCustomerId;
        }
        const stripe = this.getStripeClient();
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.name,
            metadata: { userId: user.id },
        });
        await this.prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: customer.id },
        });
        return customer.id;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        email_service_1.EmailService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map