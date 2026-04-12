"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentsModule = void 0;
const common_1 = require("@nestjs/common");
const deployments_service_1 = require("./deployments.service");
const deployments_controller_1 = require("./deployments.controller");
const encryption_service_1 = require("./encryption/encryption.service");
const n8n_service_1 = require("./n8n/n8n.service");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../prisma/prisma.module");
const notifications_module_1 = require("../notifications/notifications.module");
const deployment_processor_1 = require("./deployment.processor");
const email_module_1 = require("../email/email.module");
let DeploymentsModule = class DeploymentsModule {
};
exports.DeploymentsModule = DeploymentsModule;
exports.DeploymentsModule = DeploymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, prisma_module_1.PrismaModule, notifications_module_1.NotificationsModule, email_module_1.EmailModule],
        providers: [
            deployments_service_1.DeploymentsService,
            encryption_service_1.EncryptionService,
            n8n_service_1.N8nService,
            deployment_processor_1.DeploymentProcessor,
        ],
        controllers: [deployments_controller_1.DeploymentsController],
        exports: [deployments_service_1.DeploymentsService, encryption_service_1.EncryptionService, n8n_service_1.N8nService],
    })
], DeploymentsModule);
//# sourceMappingURL=deployments.module.js.map