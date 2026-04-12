import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  assertRole,
  getRequestContext,
} from '../common/request/request-context';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { QueryPurchasesDto } from './dto/query-purchases.dto';
import { PurchasesService } from './purchases.service';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  getPurchases(@Req() req: Request, @Query() query: QueryPurchasesDto) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.purchasesService.getPurchases(context.userId, query);
  }

  @Post()
  createPurchase(@Req() req: Request, @Body() dto: CreatePurchaseDto) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.purchasesService.createPurchase(context.userId, dto);
  }
}
