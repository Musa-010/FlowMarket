import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendWorkflowDto } from './dto/recommend-workflow.dto';
export declare class AiService {
    private readonly prisma;
    private readonly configService;
    private client;
    constructor(prisma: PrismaService, configService: ConfigService);
    recommendWorkflows(dto: RecommendWorkflowDto): Promise<{
        message: string;
        recommendations: import("../workflows/workflow.mapper").WorkflowResponse[];
    }>;
    private queryClaude;
    private parseClaudeJson;
    private getClient;
}
