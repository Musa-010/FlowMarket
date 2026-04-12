import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  assertRole,
  getRequestContext,
} from '../common/request/request-context';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload-url')
  createUploadUrl(@Req() req: Request, @Body() dto: CreateUploadUrlDto) {
    const context = getRequestContext(req);
    assertRole(context, ['SELLER', 'ADMIN']);
    return this.storageService.createUploadUrl(dto);
  }
}
