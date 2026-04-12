import { AiService } from './ai.service';
import { RecommendWorkflowDto } from './dto/recommend-workflow.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    recommend(dto: RecommendWorkflowDto): Promise<{
        message: string;
        recommendations: import("../workflows/workflow.mapper").WorkflowResponse[];
    }>;
}
