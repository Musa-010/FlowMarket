export interface EmailTemplateContent {
    subject: string;
    html: string;
    text: string;
}
export interface WelcomeEmailPayload {
    recipientName: string;
    appUrl: string;
}
export interface PurchaseConfirmationEmailPayload {
    recipientName: string;
    workflowTitle: string;
    amountPaid: number;
    purchaseId: string;
    purchasedAt: Date;
    appUrl: string;
}
export interface DeploymentActiveEmailPayload {
    recipientName: string;
    workflowTitle: string;
    deploymentId: string;
    appUrl: string;
}
export interface DeploymentFailedEmailPayload {
    recipientName: string;
    workflowTitle: string;
    deploymentId: string;
    failureReason: string;
    appUrl: string;
}
export interface SellerWorkflowApprovedEmailPayload {
    recipientName: string;
    workflowTitle: string;
    appUrl: string;
}
export interface SellerWorkflowRejectedEmailPayload {
    recipientName: string;
    workflowTitle: string;
    rejectionReason: string;
    appUrl: string;
}
export interface PayoutProcessedEmailPayload {
    recipientName: string;
    workflowTitle: string;
    amount: number;
    payoutReference: string;
    processedAt: Date;
    appUrl: string;
}
export interface SubscriptionRenewalEmailPayload {
    recipientName: string;
    planTier: string;
    amount: number;
    renewedAt: Date;
    portalUrl: string;
}
export interface PaymentFailedEmailPayload {
    recipientName: string;
    planTier: string;
    amountDue: number;
    retryAt: Date;
    portalUrl: string;
}
export declare function buildWelcomeTemplate(payload: WelcomeEmailPayload): EmailTemplateContent;
export declare function buildPurchaseConfirmationTemplate(payload: PurchaseConfirmationEmailPayload): EmailTemplateContent;
export declare function buildDeploymentActiveTemplate(payload: DeploymentActiveEmailPayload): EmailTemplateContent;
export declare function buildDeploymentFailedTemplate(payload: DeploymentFailedEmailPayload): EmailTemplateContent;
export declare function buildSellerWorkflowApprovedTemplate(payload: SellerWorkflowApprovedEmailPayload): EmailTemplateContent;
export declare function buildSellerWorkflowRejectedTemplate(payload: SellerWorkflowRejectedEmailPayload): EmailTemplateContent;
export declare function buildPayoutProcessedTemplate(payload: PayoutProcessedEmailPayload): EmailTemplateContent;
export declare function buildSubscriptionRenewalTemplate(payload: SubscriptionRenewalEmailPayload): EmailTemplateContent;
export declare function buildPaymentFailedTemplate(payload: PaymentFailedEmailPayload): EmailTemplateContent;
