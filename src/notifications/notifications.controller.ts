import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  assertRole,
  getRequestContext,
} from '../common/request/request-context';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listNotifications(@Req() req: Request, @Query() query: PaginationQueryDto) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.notificationsService.listNotifications(context.userId, query);
  }

  @Post('mark-read')
  markRead(@Req() req: Request, @Body() dto: MarkReadDto) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.notificationsService.markRead(context.userId, dto);
  }

  @Post('device-token')
  registerDeviceToken(
    @Req() req: Request,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.notificationsService.registerDeviceToken(context.userId, dto);
  }
}
