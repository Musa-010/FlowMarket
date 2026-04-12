import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PayoutsService } from './payouts.service';

@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('seller/:sellerId')
  async listForSeller(@Param('sellerId') sellerId: string) {
    return this.payoutsService.listPayoutsForSeller(sellerId);
  }

  @Post('seller/:sellerId')
  async createForSeller(@Param('sellerId') sellerId: string, @Body() body: any) {
    const amount = Number(body.amount);
    const reference = body.reference;
    return this.payoutsService.createPayout(sellerId, amount, reference);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.payoutsService.getPayout(id);
  }
}
