import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  assertRole,
  getRequestContext,
} from '../../common/request/request-context';
import { AdminQueryWorkflowsDto } from '../dto/admin-query-workflows.dto';
import { FeatureWorkflowDto } from '../dto/feature-workflow.dto';
import { ModerateWorkflowDto } from '../dto/moderate-workflow.dto';
import { WorkflowsService } from '../workflows.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@Controller('admin/workflows')
@UseGuards(JwtAuthGuard)
export class AdminWorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  getAdminWorkflows(
    @Req() req: Request,
    @Query() query: AdminQueryWorkflowsDto,
  ) {
    const context = getRequestContext(req);
    assertRole(context, ['ADMIN']);
    return this.workflowsService.getAdminWorkflows(query);
  }

  @Patch(':id/moderate')
  moderateWorkflow(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ModerateWorkflowDto,
  ) {
    const context = getRequestContext(req);
    assertRole(context, ['ADMIN']);
    return this.workflowsService.moderateWorkflow(id, dto);
  }

  @Patch(':id/feature')
  featureWorkflow(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: FeatureWorkflowDto,
  ) {
    const context = getRequestContext(req);
    assertRole(context, ['ADMIN']);
    return this.workflowsService.featureWorkflow(id, dto);
  }
}
