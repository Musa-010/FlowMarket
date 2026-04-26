/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PlanTier,
  Prisma,
  SubscriptionStatus,
  UserRole,
  WorkflowStatus,
} from '@prisma/client';
import { createHash } from 'crypto';
import Stripe from 'stripe';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerPortalDto } from './dto/create-customer-portal.dto';
import { CreateOneTimeCheckoutDto } from './dto/create-one-time-checkout.dto';
import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripeClient: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async createPaymentIntent(
    userId: string,
    dto: { workflowId: string },
  ): Promise<{ clientSecret: string; ephemeralKey: string; customerId: string }> {
    const stripe = this.getStripeClient();
    const user = await this.ensureUser(userId);
    const workflow = await this.prisma.workflow.findFirst({
      where: { id: dto.workflowId, status: WorkflowStatus.APPROVED },
    });

    if (!workflow) throw new NotFoundException('Approved workflow not found');
    if (!workflow.oneTimePrice || workflow.oneTimePrice <= 0) {
      throw new BadRequestException('This workflow does not have a one-time purchase price');
    }

    const customerId = await this.ensureStripeCustomer(user);

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' },
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(workflow.oneTimePrice * 100),
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: 'ONE_TIME_WORKFLOW',
        userId: user.id,
        workflowId: workflow.id,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      ephemeralKey: ephemeralKey.secret!,
      customerId,
    };
  }

  async createSetupIntent(
    userId: string,
  ): Promise<{ setupIntentClientSecret: string; ephemeralKey: string; customerId: string }> {
    const stripe = this.getStripeClient();
    const user = await this.ensureUser(userId);
    const customerId = await this.ensureStripeCustomer(user);

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' },
    );

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: { enabled: true },
    });

    return {
      setupIntentClientSecret: setupIntent.client_secret!,
      ephemeralKey: ephemeralKey.secret!,
      customerId,
    };
  }

  async createOneTimeCheckout(
    userId: string,
    dto: CreateOneTimeCheckoutDto,
  ): Promise<{ sessionId: string; checkoutUrl: string }> {
    try {
      this.logger.log(`Creating one-time checkout for user ${userId}, workflow ${dto.workflowId}`);
      const stripe = this.getStripeClient();
      const user = await this.ensureUser(userId);
      const workflow = await this.prisma.workflow.findFirst({
        where: {
          id: dto.workflowId,
          status: WorkflowStatus.APPROVED,
        },
      });

      if (!workflow) {
        this.logger.warn(`Approved workflow not found: ${dto.workflowId}`);
        throw new NotFoundException('Approved workflow not found');
      }
      if (!workflow.oneTimePrice || workflow.oneTimePrice <= 0) {
        throw new BadRequestException(
          'This workflow does not have a one-time purchase price',
        );
      }

      const customerId = await this.ensureStripeCustomer(user);
      this.logger.debug(`Stripe Customer ID resolved: ${customerId}`);

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
        throw new InternalServerErrorException(
          'Stripe did not return a checkout URL',
        );
      }

      return {
        sessionId: session.id,
        checkoutUrl: session.url,
      };
    } catch (error) {
      this.logger.error(`Checkout Session Creation Failed: ${error.message}`, error.stack);
      if (error instanceof Stripe.errors.StripeError) {
        this.logger.error(`Stripe specific error: ${error.type} - ${error.code}`);
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Checkout failed: ${error.message}`);
    }
  }

  async createSubscriptionCheckout(
    userId: string,
    dto: CreateSubscriptionCheckoutDto,
  ): Promise<{ sessionId: string; checkoutUrl: string }> {
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
      throw new InternalServerErrorException(
        'Stripe did not return a checkout URL',
      );
    }

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  }

  async createSubscriptionIntent(
    userId: string,
    dto: CreateSubscriptionCheckoutDto,
  ): Promise<{ clientSecret: string; ephemeralKey: string; customerId: string; planId: string }> {
    const stripe = this.getStripeClient();
    const user = await this.ensureUser(userId);
    const customerId = await this.ensureStripeCustomer(user);
    this.resolvePlan(dto.planId); // validate plan exists

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' },
    );

    // Use SetupIntent to collect card, then subscribe after payment method saved
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: { userId: user.id, planId: dto.planId },
    });

    if (!setupIntent.client_secret) {
      throw new InternalServerErrorException('Stripe did not return a setup intent');
    }

    return {
      clientSecret: setupIntent.client_secret,
      ephemeralKey: ephemeralKey.secret!,
      customerId,
      planId: dto.planId,
    };
  }

  async createSubscriptionAfterSetup(
    userId: string,
    planId: string,
  ): Promise<{ subscriptionId: string }> {
    const stripe = this.getStripeClient();
    const user = await this.ensureUser(userId);
    const plan = this.resolvePlan(planId);
    const customerId = await this.ensureStripeCustomer(user);

    // Get most recent payment method saved to customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
      limit: 1,
    });
    const paymentMethodId = paymentMethods.data[0]?.id;

    if (!paymentMethodId) {
      throw new BadRequestException('No payment method found. Please add a card first.');
    }

    // Set as default on customer
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.priceId }],
      default_payment_method: paymentMethodId,
      metadata: { userId: user.id, planTier: plan.tier, planId },
    });

    return { subscriptionId: subscription.id };
  }

  async createCustomerPortal(
    userId: string,
    dto: CreateCustomerPortalDto,
  ): Promise<{ url: string }> {
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

  async handleStripeWebhook(
    signature: string,
    rawBody: Buffer,
  ): Promise<{
    received: true;
    eventId: string;
    eventType: string;
    duplicate: boolean;
  }> {
    const stripe = this.getStripeClient();
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      throw new ServiceUnavailableException(
        'Stripe webhook secret is not configured',
      );
    }

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown signature failure';
      throw new BadRequestException(`Invalid Stripe signature: ${message}`);
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
        payload: event as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      received: true,
      eventId: event.id,
      eventType: event.type,
      duplicate: false,
    };
  }

  private async dispatchStripeEvent(event: any): Promise<void> {
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
        await this.handlePaymentIntentSucceeded(event.data.object);
        return;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        return;
      default:
        return;
    }
  }

  private async handleCheckoutSessionCompleted(session: any): Promise<void> {
    if (session.mode === 'payment') {
      await this.createPurchaseFromCheckoutSession(session);
      return;
    }

    if (session.mode === 'subscription') {
      const subscriptionId =
        typeof session.subscription === 'string' ? session.subscription : null;
      if (!subscriptionId) {
        throw new BadRequestException(
          'Checkout session is missing subscription id',
        );
      }

      const stripe = this.getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const fallbackUserId =
        session.metadata?.userId ?? session.client_reference_id;
      await this.syncSubscriptionFromStripe(
        subscription,
        fallbackUserId ?? undefined,
      );
    }
  }

  private async createPurchaseFromCheckoutSession(session: any): Promise<void> {
    const workflowId = session.metadata?.workflowId;
    const fallbackUserId =
      session.metadata?.userId ?? session.client_reference_id;
    if (!workflowId || !fallbackUserId) {
      throw new BadRequestException(
        'Checkout session metadata missing workflowId or userId',
      );
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
      throw new NotFoundException(
        'Workflow for checkout session was not found',
      );
    }

    const user = await this.ensureUser(fallbackUserId);
    const paymentIntentId =
      typeof session.payment_intent === 'string'
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

  private async handleInvoicePaid(invoice: any): Promise<void> {
    const subscriptionId =
      typeof invoice.subscription === 'string' ? invoice.subscription : null;
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

    const isRenewal =
      invoice.billing_reason === 'subscription_cycle' || existing !== null;
    if (isRenewal) {
      await this.emailService.sendSubscriptionRenewalEmail({
        userId: synced.userId,
        planTier: synced.planTier,
        amount: (invoice.amount_paid ?? 0) / 100,
        renewedAt: new Date(),
      });
    }
  }

  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    const subscriptionId =
      typeof invoice.subscription === 'string' ? invoice.subscription : null;
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
      data: { status: SubscriptionStatus.PAST_DUE },
    });

    const nextPaymentAttemptTimestamp = invoice.next_payment_attempt as
      | number
      | null
      | undefined;
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

  private async syncSubscriptionFromStripe(
    subscription: any,
    fallbackUserId?: string,
  ): Promise<{ userId: string; planTier: PlanTier }> {
    const userId =
      subscription.metadata.userId ||
      fallbackUserId ||
      (await this.findUserIdBySubscription(subscription.id));

    if (!userId) {
      throw new BadRequestException(
        'Unable to resolve user for Stripe subscription event',
      );
    }

    const user = await this.ensureUser(userId);
    const customerId =
      typeof subscription.customer === 'string' ? subscription.customer : null;
    const priceId = subscription.items.data[0]?.price?.id ?? null;
    const planTier = this.resolvePlanTier(
      subscription.metadata.planTier,
      priceId,
    );

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

  private async findUserIdBySubscription(
    stripeSubscriptionId: string,
  ): Promise<string | null> {
    const existing = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
      select: { userId: true },
    });

    return existing?.userId ?? null;
  }

  private resolvePlan(planId: string): {
    tier: PlanTier;
    priceId: string;
  } {
    const normalized = planId.trim().toUpperCase();
    const [tierToken, intervalToken] = normalized.split('_');

    let tier: PlanTier;
    switch (tierToken) {
      case 'STARTER':
        tier = PlanTier.STARTER;
        break;
      case 'PRO':
        tier = PlanTier.PRO;
        break;
      case 'AGENCY':
        tier = PlanTier.AGENCY;
        break;
      default:
        throw new BadRequestException(
          'planId must be STARTER, PRO, AGENCY (optionally suffixed with _MONTHLY or _YEARLY)',
        );
    }

    const interval =
      intervalToken === 'YEARLY' || intervalToken === 'ANNUAL'
        ? 'YEARLY'
        : 'MONTHLY';

    const directKey = `STRIPE_PRICE_${tier}`;
    const intervalKey = `STRIPE_PRICE_${tier}_${interval}`;

    const priceId =
      this.configService.get<string>(intervalKey) ??
      this.configService.get<string>(directKey);

    if (!priceId) {
      throw new ServiceUnavailableException(
        `Missing Stripe price configuration for ${tier} (${intervalKey} or ${directKey})`,
      );
    }

    return { tier, priceId };
  }

  private resolvePlanTier(
    metadataPlanTier: string | undefined,
    priceId: string | null,
  ): PlanTier {
    if (metadataPlanTier) {
      const normalized = metadataPlanTier.trim().toUpperCase();
      if (normalized === PlanTier.STARTER) {
        return PlanTier.STARTER;
      }
      if (normalized === PlanTier.PRO) {
        return PlanTier.PRO;
      }
      if (normalized === PlanTier.AGENCY) {
        return PlanTier.AGENCY;
      }
    }

    const planMappings: Array<{ tier: PlanTier; keys: string[] }> = [
      {
        tier: PlanTier.STARTER,
        keys: [
          'STRIPE_PRICE_STARTER',
          'STRIPE_PRICE_STARTER_MONTHLY',
          'STRIPE_PRICE_STARTER_YEARLY',
        ],
      },
      {
        tier: PlanTier.PRO,
        keys: [
          'STRIPE_PRICE_PRO',
          'STRIPE_PRICE_PRO_MONTHLY',
          'STRIPE_PRICE_PRO_YEARLY',
        ],
      },
      {
        tier: PlanTier.AGENCY,
        keys: [
          'STRIPE_PRICE_AGENCY',
          'STRIPE_PRICE_AGENCY_MONTHLY',
          'STRIPE_PRICE_AGENCY_YEARLY',
        ],
      },
    ];

    for (const mapping of planMappings) {
      for (const key of mapping.keys) {
        const configured = this.configService.get<string>(key);
        if (configured && configured === priceId) {
          return mapping.tier;
        }
      }
    }

    return PlanTier.STARTER;
  }

  private mapStripeSubscriptionStatus(status: string): SubscriptionStatus {
    switch (status) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'past_due':
      case 'unpaid':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'incomplete':
      case 'incomplete_expired':
      case 'paused':
        return SubscriptionStatus.INCOMPLETE;
      default:
        return SubscriptionStatus.INCOMPLETE;
    }
  }

  private getSuccessUrl(): string {
    return (
      this.configService.get<string>('STRIPE_CHECKOUT_SUCCESS_URL') ??
      `${this.getAppBaseUrl()}/payment-success?session_id={CHECKOUT_SESSION_ID}`
    );
  }

  private getCancelUrl(): string {
    return (
      this.configService.get<string>('STRIPE_CHECKOUT_CANCEL_URL') ??
      `${this.getAppBaseUrl()}/checkout-canceled`
    );
  }

  private getPortalReturnUrl(): string {
    return (
      this.configService.get<string>('STRIPE_PORTAL_RETURN_URL') ??
      `${this.getAppBaseUrl()}/profile`
    );
  }

  private getAppBaseUrl(): string {
    return this.configService.get<string>('APP_URL') ?? 'http://localhost:3000';
  }

  private getStripeClient(): any {
    if (this.stripeClient) {
      return this.stripeClient;
    }

    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new ServiceUnavailableException(
        'STRIPE_SECRET_KEY is not configured',
      );
    }

    this.stripeClient = new Stripe(secretKey);
    return this.stripeClient;
  }

  private async ensureUser(userId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (existing) {
      return existing;
    }

    const hash = createHash('sha256').update(userId).digest('hex').slice(0, 10);
    const slug =
      userId
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 24) || 'user';
    const email = `${slug}-${hash}@users.flowmarket.local`;

    const created = await this.prisma.user.create({
      data: {
        id: userId,
        email,
        name: `User ${userId.slice(0, 12)}`,
        role: UserRole.BUYER,
      },
    });
    await this.emailService.sendWelcomeEmail(created.id);
    return created;
  }

  private async handleAsyncCheckoutPaymentFailed(session: any): Promise<void> {
    const fallbackUserId =
      session?.metadata?.userId ?? session?.client_reference_id;
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

  private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
    const type = paymentIntent?.metadata?.type as string | undefined;
    if (type !== 'ONE_TIME_WORKFLOW') return;

    const userId = paymentIntent?.metadata?.userId as string | undefined;
    const workflowId = paymentIntent?.metadata?.workflowId as string | undefined;
    if (!userId || !workflowId) return;

    const existing = await this.prisma.purchase.findFirst({
      where: { userId, workflowId },
    });
    if (existing) return;

    const workflow = await this.prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) return;

    const amountPaid = (paymentIntent?.amount_received ?? paymentIntent?.amount ?? 0) / 100;

    await this.prisma.$transaction([
      this.prisma.purchase.create({
        data: {
          userId,
          workflowId,
          pricePaid: amountPaid,
          stripePaymentId: paymentIntent.id,
        },
      }),
      this.prisma.workflow.update({
        where: { id: workflowId },
        data: { purchaseCount: { increment: 1 } },
      }),
    ]);
  }

  private async handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
    const userId = paymentIntent?.metadata?.userId as string | undefined;
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

  private async ensureStripeCustomer(user: {
    id: string;
    email: string;
    name: string;
    stripeCustomerId: string | null;
  }): Promise<string> {
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    try {
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
    } catch (error) {
      this.logger.error(`Failed to ensure Stripe customer for user ${user.id}: ${error.message}`);
      throw error;
    }
  }
}
