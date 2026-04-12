declare const uploadFolders: readonly ["workflow-files", "workflow-images", "workflow-previews"];
export declare class CreateUploadUrlDto {
    filename: string;
    folder?: (typeof uploadFolders)[number];
    contentType?: string;
}
export {};
