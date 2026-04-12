"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsModule = void 0;
const common_1 = require("@nestjs/common");
const workflows_service_1 = require("./workflows.service");
const workflows_public_controller_1 = require("./workflows-public/workflows-public.controller");
const seller_workflows_controller_1 = require("./seller-workflows/seller-workflows.controller");
const admin_workflows_controller_1 = require("./admin-workflows/admin-workflows.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const email_module_1 = require("../email/email.module");
let WorkflowsModule = class WorkflowsModule {
};
exports.WorkflowsModule = WorkflowsModule;
exports.WorkflowsModule = WorkflowsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, email_module_1.EmailModule],
        providers: [workflows_service_1.WorkflowsService],
        controllers: [
            workflows_public_controller_1.WorkflowsPublicController,
            seller_workflows_controller_1.SellerWorkflowsController,
            admin_workflows_controller_1.AdminWorkflowsController,
        ],
    })
], WorkflowsModule);
//# sourceMappingURL=workflows.module.js.map