declare class ChatHistoryMessageDto {
    role: 'user' | 'assistant';
    content: string;
}
export declare class RecommendWorkflowDto {
    message: string;
    history?: ChatHistoryMessageDto[];
}
export {};
