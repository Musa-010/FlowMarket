import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CheckoutController } from './checkout/checkout.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ConfigModule, PrismaModule, EmailModule],
  providers: [PaymentsService],
  controllers: [CheckoutController],
})
export class PaymentsModule {}
