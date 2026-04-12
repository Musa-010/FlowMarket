import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryWorkflowsDto } from '../dto/query-workflows.dto';
import { WorkflowsService } from '../workflows.service';

@Controller('workflows')
export class WorkflowsPublicController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  getPublicWorkflows(@Query() query: QueryWorkflowsDto) {
    return this.workflowsService.getPublicWorkflows(query);
  }

  @Get('featured')
  getFeaturedWorkflows() {
    return this.workflowsService.getFeaturedWorkflows();
  }

  @Get(':slug')
  getWorkflowBySlug(@Param('slug') slug: string) {
    return this.workflowsService.getWorkflowBySlug(slug);
  }
}
