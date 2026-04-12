import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  assertRole,
  getRequestContext,
} from '../common/request/request-context';
import { ConfigureDeploymentDto } from './dto/configure-deployment.dto';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { QueryDeploymentLogsDto } from './dto/query-deployment-logs.dto';
import { DeploymentsService } from './deployments.service';

@Controller('deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Get()
  getDeployments(@Req() req: Request) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.deploymentsService.getDeployments(context.userId);
  }

  @Get(':id')
  getDeploymentById(@Req() req: Request, @Param('id') id: string) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.deploymentsService.getDeploymentById(context.userId, id);
  }

  @Post()
  createDeployment(@Req() req: Request, @Body() dto: CreateDeploymentDto) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.deploymentsService.createDeployment(context.userId, dto);
  }

  @Post(':id/configure')
  configureDeployment(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ConfigureDeploymentDto,
  ) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.deploymentsService.configureDeployment(context.userId, id, dto);
  }

  @Post(':id/pause')
  pauseDeployment(@Req() req: Request, @Param('id') id: string) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.deploymentsService.pauseDeployment(context.userId, id);
  }

  @Post(':id/resume')
  resumeDeployment(@Req() req: Request, @Param('id') id: string) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.deploymentsService.resumeDeployment(context.userId, id);
  }

  @Post(':id/stop')
  stopDeployment(@Req() req: Request, @Param('id') id: string) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.deploymentsService.stopDeployment(context.userId, id);
  }

  @Get(':id/logs')
  getDeploymentLogs(
    @Req() req: Request,
    @Param('id') id: string,
    @Query() query: QueryDeploymentLogsDto,
  ) {
    const context = getRequestContext(req);
    assertRole(context, ['BUYER', 'SELLER', 'ADMIN']);
    return this.deploymentsService.getDeploymentLogs(context.userId, id, query);
  }
}
