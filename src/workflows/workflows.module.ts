import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsPublicController } from './workflows-public/workflows-public.controller';
import { SellerWorkflowsController } from './seller-workflows/seller-workflows.controller';
import { AdminWorkflowsController } from './admin-workflows/admin-workflows.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [WorkflowsService],
  controllers: [
    WorkflowsPublicController,
    SellerWorkflowsController,
    AdminWorkflowsController,
  ],
})
export class WorkflowsModule {}
