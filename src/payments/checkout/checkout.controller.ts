import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  assertRole,
  getRequestContext,
} from '../../common/request/request-context';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { CreateCustomerPortalDto } from '../dto/create-customer-portal.dto';
import { CreateOneTimeCheckoutDto } from '../dto/create-one-time-checkout.dto';
import { CreateSubscriptionCheckoutDto } from '../dto/create-subscription-checkout.dto';
import { PaymentsService } from '../payments.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('payment-intent')
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(
    @Req() req: Request,
    @Body() dto: { workflowId: string },
  ) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.paymentsService.createPaymentIntent(context.userId, dto);
  }

  @Post('setup-intent')
  @UseGuards(JwtAuthGuard)
  createSetupIntent(@Req() req: Request) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.paymentsService.createSetupIntent(context.userId);
  }

  @Post('one-time')
  @UseGuards(JwtAuthGuard)
  createOneTimeCheckout(
    @Req() req: Request,
    @Body() dto: CreateOneTimeCheckoutDto,
  ) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.paymentsService.createOneTimeCheckout(context.userId, dto);
  }

  @Post('subscription')
  @UseGuards(JwtAuthGuard)
  createSubscriptionCheckout(
    @Req() req: Request,
    @Body() dto: CreateSubscriptionCheckoutDto,
  ) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.paymentsService.createSubscriptionCheckout(context.userId, dto);
  }

  @Post('subscription-intent')
  @UseGuards(JwtAuthGuard)
  createSubscriptionIntent(
    @Req() req: Request,
    @Body() dto: CreateSubscriptionCheckoutDto,
  ) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.paymentsService.createSubscriptionIntent(context.userId, dto);
  }

  @Post('subscribe-after-setup')
  @UseGuards(JwtAuthGuard)
  createSubscriptionAfterSetup(
    @Req() req: Request,
    @Body() body: { planId: string },
  ) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.paymentsService.createSubscriptionAfterSetup(context.userId, body.planId);
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  createCustomerPortal(
    @Req() req: Request,
    @Body() dto: CreateCustomerPortalDto,
  ) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.paymentsService.createCustomerPortal(context.userId, dto);
  }

  @Post('webhook')
  handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body ?? {}));

    return this.paymentsService.handleStripeWebhook(signature, rawBody);
  }
}
