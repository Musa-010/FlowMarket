"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const workflows_module_1 = require("./workflows/workflows.module");
const purchases_module_1 = require("./purchases/purchases.module");
const storage_module_1 = require("./storage/storage.module");
const payments_module_1 = require("./payments/payments.module");
const ai_module_1 = require("./ai/ai.module");
const deployments_module_1 = require("./deployments/deployments.module");
const reviews_module_1 = require("./reviews/reviews.module");
const notifications_module_1 = require("./notifications/notifications.module");
const email_module_1 = require("./email/email.module");
const agencies_module_1 = require("./agencies/agencies.module");
const admin_module_1 = require("./admin/admin.module");
const payouts_module_1 = require("./payouts/payouts.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            workflows_module_1.WorkflowsModule,
            purchases_module_1.PurchasesModule,
            storage_module_1.StorageModule,
            payments_module_1.PaymentsModule,
            ai_module_1.AiModule,
            deployments_module_1.DeploymentsModule,
            reviews_module_1.ReviewsModule,
            notifications_module_1.NotificationsModule,
            email_module_1.EmailModule,
            agencies_module_1.AgenciesModule,
            admin_module_1.AdminModule,
            payouts_module_1.PayoutsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map