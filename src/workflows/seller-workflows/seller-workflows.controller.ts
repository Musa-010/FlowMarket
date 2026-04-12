import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  assertRole,
  getRequestContext,
} from '../../common/request/request-context';
import { CreateWorkflowDto } from '../dto/create-workflow.dto';
import { UpdateWorkflowDto } from '../dto/update-workflow.dto';
import { WorkflowsService } from '../workflows.service';

@Controller('seller/workflows')
export class SellerWorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  async getSellerWorkflows(@Req() req: Request) {
    const context = getRequestContext(req);
    assertRole(context, ['SELLER']);

    return {
      data: await this.workflowsService.getSellerWorkflows(context.userId),
    };
  }

  @Post()
  createSellerWorkflow(@Req() req: Request, @Body() dto: CreateWorkflowDto) {
    const context = getRequestContext(req);
    assertRole(context, ['SELLER']);
    return this.workflowsService.createSellerWorkflow(context.userId, dto);
  }

  @Patch(':id')
  updateSellerWorkflow(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    const context = getRequestContext(req);
    assertRole(context, ['SELLER']);
    return this.workflowsService.updateSellerWorkflow(context.userId, id, dto);
  }

  @Post(':id/submit')
  submitSellerWorkflow(@Req() req: Request, @Param('id') id: string) {
    const context = getRequestContext(req);
    assertRole(context, ['SELLER']);
    return this.workflowsService.submitSellerWorkflow(context.userId, id);
  }
}
