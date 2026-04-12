import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { RecommendWorkflowDto } from './dto/recommend-workflow.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('recommend')
  recommend(@Body() dto: RecommendWorkflowDto) {
    return this.aiService.recommendWorkflows(dto);
  }
}
