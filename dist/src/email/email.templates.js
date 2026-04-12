"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWelcomeTemplate = buildWelcomeTemplate;
exports.buildPurchaseConfirmationTemplate = buildPurchaseConfirmationTemplate;
exports.buildDeploymentActiveTemplate = buildDeploymentActiveTemplate;
exports.buildDeploymentFailedTemplate = buildDeploymentFailedTemplate;
exports.buildSellerWorkflowApprovedTemplate = buildSellerWorkflowApprovedTemplate;
exports.buildSellerWorkflowRejectedTemplate = buildSellerWorkflowRejectedTemplate;
exports.buildPayoutProcessedTemplate = buildPayoutProcessedTemplate;
exports.buildSubscriptionRenewalTemplate = buildSubscriptionRenewalTemplate;
exports.buildPaymentFailedTemplate = buildPaymentFailedTemplate;
function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}
function formatDate(date) {
    return date.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function wrapHtml(title, body) {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 12px;">${title}</h2>
      ${body}
      <p style="margin-top: 20px;">— FlowMarket Team</p>
    </div>
  `;
}
function buildWelcomeTemplate(payload) {
    const subject = 'Welcome to FlowMarket';
    const html = wrapHtml('Welcome to FlowMarket', `<p>Hi ${payload.recipientName},</p>
     <p>Your account is ready. Start exploring automation workflows and deploy faster with FlowMarket.</p>
     <p><a href="${payload.appUrl}" target="_blank" rel="noreferrer">Open FlowMarket</a></p>`);
    const text = `Hi ${payload.recipientName},\n\nWelcome to FlowMarket. Your account is ready.\nOpen FlowMarket: ${payload.appUrl}`;
    return { subject, html, text };
}
function buildPurchaseConfirmationTemplate(payload) {
    const subject = 'Purchase Confirmation';
    const html = wrapHtml('Purchase Confirmation', `<p>Hi ${payload.recipientName},</p>
     <p>Thanks for your purchase. Your workflow is now available.</p>
     <ul>
       <li><strong>Workflow:</strong> ${payload.workflowTitle}</li>
       <li><strong>Amount:</strong> ${formatMoney(payload.amountPaid)}</li>
       <li><strong>Purchase ID:</strong> ${payload.purchaseId}</li>
       <li><strong>Purchased At:</strong> ${formatDate(payload.purchasedAt)}</li>
     </ul>
     <p><a href="${payload.appUrl}/purchases" target="_blank" rel="noreferrer">View Purchases</a></p>`);
    const text = `Hi ${payload.recipientName},\n\n` +
        `Purchase confirmed.\n` +
        `Workflow: ${payload.workflowTitle}\n` +
        `Amount: ${formatMoney(payload.amountPaid)}\n` +
        `Purchase ID: ${payload.purchaseId}\n` +
        `Purchased At: ${formatDate(payload.purchasedAt)}\n` +
        `View purchases: ${payload.appUrl}/purchases`;
    return { subject, html, text };
}
function buildDeploymentActiveTemplate(payload) {
    const subject = 'Deployment Active';
    const html = wrapHtml('Deployment Active', `<p>Hi ${payload.recipientName},</p>
     <p>Your deployment is now running.</p>
     <ul>
       <li><strong>Workflow:</strong> ${payload.workflowTitle}</li>
       <li><strong>Deployment ID:</strong> ${payload.deploymentId}</li>
     </ul>
     <p><a href="${payload.appUrl}/deployments/${payload.deploymentId}" target="_blank" rel="noreferrer">View Deployment</a></p>`);
    const text = `Hi ${payload.recipientName},\n\n` +
        `Your deployment is active.\n` +
        `Workflow: ${payload.workflowTitle}\n` +
        `Deployment ID: ${payload.deploymentId}\n` +
        `View deployment: ${payload.appUrl}/deployments/${payload.deploymentId}`;
    return { subject, html, text };
}
function buildDeploymentFailedTemplate(payload) {
    const subject = 'Deployment Failed';
    const html = wrapHtml('Deployment Failed', `<p>Hi ${payload.recipientName},</p>
     <p>We could not complete your deployment.</p>
     <ul>
       <li><strong>Workflow:</strong> ${payload.workflowTitle}</li>
       <li><strong>Deployment ID:</strong> ${payload.deploymentId}</li>
       <li><strong>Reason:</strong> ${payload.failureReason}</li>
     </ul>
     <p><a href="${payload.appUrl}/deployments/${payload.deploymentId}/configure" target="_blank" rel="noreferrer">Reconfigure Deployment</a></p>`);
    const text = `Hi ${payload.recipientName},\n\n` +
        `Your deployment failed.\n` +
        `Workflow: ${payload.workflowTitle}\n` +
        `Deployment ID: ${payload.deploymentId}\n` +
        `Reason: ${payload.failureReason}\n` +
        `Reconfigure deployment: ${payload.appUrl}/deployments/${payload.deploymentId}/configure`;
    return { subject, html, text };
}
function buildSellerWorkflowApprovedTemplate(payload) {
    const subject = 'Seller Workflow Approved';
    const html = wrapHtml('Seller Workflow Approved', `<p>Hi ${payload.recipientName},</p>
     <p>Your workflow <strong>${payload.workflowTitle}</strong> has been approved and is now live in the marketplace.</p>
     <p><a href="${payload.appUrl}/seller/workflows" target="_blank" rel="noreferrer">Open Seller Dashboard</a></p>`);
    const text = `Hi ${payload.recipientName},\n\n` +
        `Your workflow "${payload.workflowTitle}" was approved and is now live.\n` +
        `Open seller dashboard: ${payload.appUrl}/seller/workflows`;
    return { subject, html, text };
}
function buildSellerWorkflowRejectedTemplate(payload) {
    const subject = 'Seller Workflow Rejected';
    const html = wrapHtml('Seller Workflow Rejected', `<p>Hi ${payload.recipientName},</p>
     <p>Your workflow <strong>${payload.workflowTitle}</strong> was not approved.</p>
     <p><strong>Reason:</strong> ${payload.rejectionReason}</p>
     <p><a href="${payload.appUrl}/seller/workflows" target="_blank" rel="noreferrer">Update and Resubmit</a></p>`);
    const text = `Hi ${payload.recipientName},\n\n` +
        `Your workflow "${payload.workflowTitle}" was rejected.\n` +
        `Reason: ${payload.rejectionReason}\n` +
        `Update and resubmit: ${payload.appUrl}/seller/workflows`;
    return { subject, html, text };
}
function buildPayoutProcessedTemplate(payload) {
    const subject = 'Payout Processed';
    const html = wrapHtml('Payout Processed', `<p>Hi ${payload.recipientName},</p>
     <p>Your payout has been processed.</p>
     <ul>
       <li><strong>Workflow:</strong> ${payload.workflowTitle}</li>
       <li><strong>Amount:</strong> ${formatMoney(payload.amount)}</li>
       <li><strong>Payout Reference:</strong> ${payload.payoutReference}</li>
       <li><strong>Processed At:</strong> ${formatDate(payload.processedAt)}</li>
     </ul>
     <p><a href="${payload.appUrl}/seller/earnings" target="_blank" rel="noreferrer">View Earnings</a></p>`);
    const text = `Hi ${payload.recipientName},\n\n` +
        `Payout processed.\n` +
        `Workflow: ${payload.workflowTitle}\n` +
        `Amount: ${formatMoney(payload.amount)}\n` +
        `Payout Reference: ${payload.payoutReference}\n` +
        `Processed At: ${formatDate(payload.processedAt)}\n` +
        `View earnings: ${payload.appUrl}/seller/earnings`;
    return { subject, html, text };
}
function buildSubscriptionRenewalTemplate(payload) {
    const subject = 'Subscription Renewal';
    const html = wrapHtml('Subscription Renewal', `<p>Hi ${payload.recipientName},</p>
     <p>Your subscription has been renewed successfully.</p>
     <ul>
       <li><strong>Plan:</strong> ${payload.planTier}</li>
       <li><strong>Amount:</strong> ${formatMoney(payload.amount)}</li>
       <li><strong>Renewed At:</strong> ${formatDate(payload.renewedAt)}</li>
     </ul>
     <p><a href="${payload.portalUrl}" target="_blank" rel="noreferrer">Manage Subscription</a></p>`);
    const text = `Hi ${payload.recipientName},\n\n` +
        `Subscription renewed.\n` +
        `Plan: ${payload.planTier}\n` +
        `Amount: ${formatMoney(payload.amount)}\n` +
        `Renewed At: ${formatDate(payload.renewedAt)}\n` +
        `Manage subscription: ${payload.portalUrl}`;
    return { subject, html, text };
}
function buildPaymentFailedTemplate(payload) {
    const subject = 'Payment Failed';
    const html = wrapHtml('Payment Failed', `<p>Hi ${payload.recipientName},</p>
     <p>We could not process your latest payment.</p>
     <ul>
       <li><strong>Plan:</strong> ${payload.planTier}</li>
       <li><strong>Amount Due:</strong> ${formatMoney(payload.amountDue)}</li>
       <li><strong>Retry At:</strong> ${formatDate(payload.retryAt)}</li>
     </ul>
     <p><a href="${payload.portalUrl}" target="_blank" rel="noreferrer">Update Billing Details</a></p>`);
    const text = `Hi ${payload.recipientName},\n\n` +
        `Payment failed.\n` +
        `Plan: ${payload.planTier}\n` +
        `Amount Due: ${formatMoney(payload.amountDue)}\n` +
        `Retry At: ${formatDate(payload.retryAt)}\n` +
        `Update billing details: ${payload.portalUrl}`;
    return { subject, html, text };
}
//# sourceMappingURL=email.templates.js.map