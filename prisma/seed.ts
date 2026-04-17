import {
  PrismaClient,
  UserRole,
  WorkflowCategory,
  WorkflowDifficulty,
  WorkflowPlatform,
  WorkflowStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

const starterWorkflows = [
  {
    title: 'Automated Lead Nurture Sequence',
    slug: 'automated-lead-nurture-sequence',
    shortDescription:
      'Capture inbound leads, score intent, and trigger personalized follow-up messages.',
    platform: WorkflowPlatform.BOTH,
    category: WorkflowCategory.LEAD_GEN,
    difficulty: WorkflowDifficulty.INTERMEDIATE,
    oneTimePrice: 39,
    monthlyPrice: 12,
    tags: ['lead gen', 'crm sync', 'email automation'],
    requiredIntegrations: ['Typeform', 'HubSpot', 'Gmail'],
    steps: ['Connect form source', 'Map lead score rules', 'Enable outbound sequence'],
    setupTime: '30 minutes',
    isFeatured: true,
  },
  {
    title: 'Abandoned Cart Recovery + Winback',
    slug: 'abandoned-cart-recovery-winback',
    shortDescription:
      'Recover lost revenue with timed reminders and discount logic for high-intent shoppers.',
    platform: WorkflowPlatform.MAKE,
    category: WorkflowCategory.ECOM,
    difficulty: WorkflowDifficulty.BEGINNER,
    oneTimePrice: 29,
    monthlyPrice: 9,
    tags: ['shopify', 'revenue', 'retention'],
    requiredIntegrations: ['Shopify', 'Klaviyo', 'Stripe'],
    steps: ['Connect store', 'Customize reminder cadence', 'Publish conversion events'],
    setupTime: '15 minutes',
    isFeatured: true,
  },
  {
    title: 'Invoice Follow-up and Dunning',
    slug: 'invoice-follow-up-and-dunning',
    shortDescription:
      'Automatically remind clients of unpaid invoices and escalate by aging thresholds.',
    platform: WorkflowPlatform.N8N,
    category: WorkflowCategory.INVOICE,
    difficulty: WorkflowDifficulty.BEGINNER,
    oneTimePrice: 24,
    monthlyPrice: 7,
    tags: ['finance', 'invoices', 'collections'],
    requiredIntegrations: ['Stripe', 'Gmail', 'Slack'],
    steps: ['Connect invoicing source', 'Set reminder schedule', 'Enable escalation rules'],
    setupTime: '15 minutes',
    isFeatured: false,
  },
  {
    title: 'Weekly Executive KPI Report',
    slug: 'weekly-executive-kpi-report',
    shortDescription:
      'Compile sales, pipeline, and marketing KPIs into a single executive digest every week.',
    platform: WorkflowPlatform.BOTH,
    category: WorkflowCategory.REPORT,
    difficulty: WorkflowDifficulty.INTERMEDIATE,
    oneTimePrice: 49,
    monthlyPrice: 15,
    tags: ['reporting', 'dashboards', 'management'],
    requiredIntegrations: ['Google Sheets', 'Notion', 'Slack'],
    steps: ['Connect data sources', 'Define KPI mappings', 'Schedule weekly delivery'],
    setupTime: '30 minutes',
    isFeatured: true,
  },
  {
    title: 'Social Content Repurposer',
    slug: 'social-content-repurposer',
    shortDescription:
      'Turn long-form content into ready-to-post snippets for LinkedIn, X, and Instagram.',
    platform: WorkflowPlatform.N8N,
    category: WorkflowCategory.SOCIAL,
    difficulty: WorkflowDifficulty.BEGINNER,
    oneTimePrice: 19,
    monthlyPrice: 6,
    tags: ['social media', 'content', 'distribution'],
    requiredIntegrations: ['Notion', 'OpenAI', 'Buffer'],
    steps: ['Connect content source', 'Tune prompt templates', 'Approve and publish posts'],
    setupTime: '15 minutes',
    isFeatured: false,
  },
  {
    title: 'CRM Hygiene and Duplicate Cleanup',
    slug: 'crm-hygiene-and-duplicate-cleanup',
    shortDescription:
      'Normalize records, merge duplicates, and alert owners when data quality drops.',
    platform: WorkflowPlatform.BOTH,
    category: WorkflowCategory.CRM,
    difficulty: WorkflowDifficulty.ADVANCED,
    oneTimePrice: 79,
    monthlyPrice: 24,
    tags: ['crm', 'data quality', 'ops'],
    requiredIntegrations: ['HubSpot', 'Airtable', 'Slack'],
    steps: ['Define matching rules', 'Dry-run merge checks', 'Enable automated cleanup'],
    setupTime: '1 hour',
    isFeatured: false,
  },
  {
    title: 'Smart Email Triage Assistant',
    slug: 'smart-email-triage-assistant',
    shortDescription:
      'Prioritize and route incoming emails to the right team based on intent and urgency.',
    platform: WorkflowPlatform.N8N,
    category: WorkflowCategory.EMAIL,
    difficulty: WorkflowDifficulty.INTERMEDIATE,
    oneTimePrice: 34,
    monthlyPrice: 10,
    tags: ['inbox zero', 'routing', 'support'],
    requiredIntegrations: ['Gmail', 'Slack', 'OpenAI'],
    steps: ['Connect mailbox', 'Set routing labels', 'Publish escalation channel'],
    setupTime: '30 minutes',
    isFeatured: true,
  },
  {
    title: 'Customer Onboarding Checklist Automation',
    slug: 'customer-onboarding-checklist-automation',
    shortDescription:
      'Provision client workspaces and assign onboarding tasks automatically after signup.',
    platform: WorkflowPlatform.BOTH,
    category: WorkflowCategory.NOTIF,
    difficulty: WorkflowDifficulty.BEGINNER,
    oneTimePrice: 27,
    monthlyPrice: 8,
    tags: ['onboarding', 'customer success', 'tasks'],
    requiredIntegrations: ['Notion', 'Slack', 'Typeform'],
    steps: ['Connect signup trigger', 'Configure checklist templates', 'Enable notifications'],
    setupTime: '15 minutes',
    isFeatured: false,
  },
  {
    title: 'SaaS Churn Risk Monitor',
    slug: 'saas-churn-risk-monitor',
    shortDescription:
      'Detect churn signals from product and billing events, then trigger retention workflows.',
    platform: WorkflowPlatform.MAKE,
    category: WorkflowCategory.REPORT,
    difficulty: WorkflowDifficulty.ADVANCED,
    oneTimePrice: 89,
    monthlyPrice: 29,
    tags: ['churn', 'saas', 'retention'],
    requiredIntegrations: ['Stripe', 'Amplitude', 'Slack'],
    steps: ['Connect event streams', 'Define risk scoring', 'Launch rescue playbook'],
    setupTime: '1 hour',
    isFeatured: true,
  },
  {
    title: 'AI FAQ Responder for Support Tickets',
    slug: 'ai-faq-responder-for-support-tickets',
    shortDescription:
      'Draft first-response answers for support tickets using your knowledge base.',
    platform: WorkflowPlatform.N8N,
    category: WorkflowCategory.CUSTOM,
    difficulty: WorkflowDifficulty.INTERMEDIATE,
    oneTimePrice: 59,
    monthlyPrice: 18,
    tags: ['ai', 'support', 'knowledge base'],
    requiredIntegrations: ['Zendesk', 'Notion', 'OpenAI'],
    steps: ['Connect support inbox', 'Load KB source', 'Set confidence thresholds'],
    setupTime: '30 minutes',
    isFeatured: false,
  },
  {
    title: 'Automated Webinar Registration Funnel',
    slug: 'automated-webinar-registration-funnel',
    shortDescription:
      'Capture registrants, send reminders, and sync attendee behavior into CRM sequences.',
    platform: WorkflowPlatform.MAKE,
    category: WorkflowCategory.LEAD_GEN,
    difficulty: WorkflowDifficulty.BEGINNER,
    oneTimePrice: 22,
    monthlyPrice: 7,
    tags: ['webinar', 'events', 'pipeline'],
    requiredIntegrations: ['Zoom', 'HubSpot', 'Gmail'],
    steps: ['Connect webinar provider', 'Map contact fields', 'Enable reminder cadence'],
    setupTime: '15 minutes',
    isFeatured: false,
  },
  {
    title: 'Multi-channel Product Launch Notifier',
    slug: 'multi-channel-product-launch-notifier',
    shortDescription:
      'Coordinate launch announcements across email, Slack, and social channels in one flow.',
    platform: WorkflowPlatform.BOTH,
    category: WorkflowCategory.NOTIF,
    difficulty: WorkflowDifficulty.INTERMEDIATE,
    oneTimePrice: 32,
    monthlyPrice: 11,
    tags: ['launch', 'notifications', 'coordination'],
    requiredIntegrations: ['Gmail', 'Slack', 'Discord'],
    steps: ['Configure launch payload', 'Schedule channel fan-out', 'Track delivery status'],
    setupTime: '30 minutes',
    isFeatured: true,
  },
  {
    title: 'Affiliate Payout Reconciliation',
    slug: 'affiliate-payout-reconciliation',
    shortDescription:
      'Reconcile affiliate conversions and payouts with auditable monthly summaries.',
    platform: WorkflowPlatform.N8N,
    category: WorkflowCategory.INVOICE,
    difficulty: WorkflowDifficulty.ADVANCED,
    oneTimePrice: 74,
    monthlyPrice: 21,
    tags: ['affiliate', 'finance', 'reconciliation'],
    requiredIntegrations: ['Stripe', 'Google Sheets', 'Slack'],
    steps: ['Import conversion data', 'Validate payout rules', 'Export reconciliation report'],
    setupTime: '1 hour',
    isFeatured: false,
  },
  {
    title: 'Referral Program Tracker',
    slug: 'referral-program-tracker',
    shortDescription:
      'Track referral invites, conversions, and reward fulfillment automatically.',
    platform: WorkflowPlatform.MAKE,
    category: WorkflowCategory.CRM,
    difficulty: WorkflowDifficulty.BEGINNER,
    oneTimePrice: 25,
    monthlyPrice: 8,
    tags: ['referrals', 'growth', 'attribution'],
    requiredIntegrations: ['Typeform', 'Airtable', 'Stripe'],
    steps: ['Set referral source tracking', 'Map reward conditions', 'Enable payout triggers'],
    setupTime: '15 minutes',
    isFeatured: false,
  },
  {
    title: 'Pipeline Stage Alerting Bot',
    slug: 'pipeline-stage-alerting-bot',
    shortDescription:
      'Send contextual alerts whenever high-value opportunities move stages in CRM.',
    platform: WorkflowPlatform.BOTH,
    category: WorkflowCategory.NOTIF,
    difficulty: WorkflowDifficulty.BEGINNER,
    oneTimePrice: 18,
    monthlyPrice: 5,
    tags: ['sales ops', 'alerts', 'pipeline'],
    requiredIntegrations: ['HubSpot', 'Slack'],
    steps: ['Connect pipeline events', 'Define stage thresholds', 'Route alert recipients'],
    setupTime: '15 minutes',
    isFeatured: false,
  },
] as const;

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@flowmarket.local' },
    create: {
      email: 'admin@flowmarket.local',
      name: 'FlowMarket Admin',
      role: UserRole.ADMIN,
    },
    update: {},
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@flowmarket.local' },
    create: {
      email: 'seller@flowmarket.local',
      name: 'Demo Seller',
      role: UserRole.SELLER,
    },
    update: {},
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@flowmarket.local' },
    create: {
      email: 'buyer@flowmarket.local',
      name: 'Demo Buyer',
      role: UserRole.BUYER,
    },
    update: {},
  });

  await prisma.deviceToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.executionLog.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.stripeWebhookEvent.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.workflow.deleteMany();

  for (const workflow of starterWorkflows) {
    await prisma.workflow.create({
      data: {
        ...workflow,
        sellerId: seller.id,
        status: WorkflowStatus.APPROVED,
        avgRating: 4.2,
        reviewCount: 12,
        purchaseCount: 0,
        previewImages: [`https://picsum.photos/seed/${workflow.slug}/800/600`],
      },
    });
  }

  await prisma.workflow.updateMany({
    where: { isFeatured: true },
    data: { status: WorkflowStatus.APPROVED, rejectionReason: null },
  });

  console.log(
    `Seeded ${starterWorkflows.length} workflows for seller ${seller.email}, buyer ${buyer.email}, and admin ${admin.email}.`,
  );
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
