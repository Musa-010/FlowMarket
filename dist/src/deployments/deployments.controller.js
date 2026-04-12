"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentsController = void 0;
const common_1 = require("@nestjs/common");
const request_context_1 = require("../common/request/request-context");
const configure_deployment_dto_1 = require("./dto/configure-deployment.dto");
const create_deployment_dto_1 = require("./dto/create-deployment.dto");
const query_deployment_logs_dto_1 = require("./dto/query-deployment-logs.dto");
const deployments_service_1 = require("./deployments.service");
let DeploymentsController = class DeploymentsController {
    deploymentsService;
    constructor(deploymentsService) {
        this.deploymentsService = deploymentsService;
    }
    getDeployments(req) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['BUYER', 'SELLER', 'ADMIN']);
        return this.deploymentsService.getDeployments(context.userId);
    }
    getDeploymentById(req, id) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['BUYER', 'SELLER', 'ADMIN']);
        return this.deploymentsService.getDeploymentById(context.userId, id);
    }
    createDeployment(req, dto) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['BUYER', 'SELLER', 'ADMIN']);
        return this.deploymentsService.createDeployment(context.userId, dto);
    }
    configureDeployment(req, id, dto) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['BUYER', 'SELLER', 'ADMIN']);
        return this.deploymentsService.configureDeployment(context.userId, id, dto);
    }
    pauseDeployment(req, id) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['BUYER', 'SELLER', 'ADMIN']);
        return this.deploymentsService.pauseDeployment(context.userId, id);
    }
    resumeDeployment(req, id) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['BUYER', 'SELLER', 'ADMIN']);
        return this.deploymentsService.resumeDeployment(context.userId, id);
    }
    stopDeployment(req, id) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['BUYER', 'SELLER', 'ADMIN']);
        return this.deploymentsService.stopDeployment(context.userId, id);
    }
    getDeploymentLogs(req, id, query) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['BUYER', 'SELLER', 'ADMIN']);
        return this.deploymentsService.getDeploymentLogs(context.userId, id, query);
    }
};
exports.DeploymentsController = DeploymentsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeploymentsController.prototype, "getDeployments", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DeploymentsController.prototype, "getDeploymentById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_deployment_dto_1.CreateDeploymentDto]),
    __metadata("design:returntype", void 0)
], DeploymentsController.prototype, "createDeployment", null);
__decorate([
    (0, common_1.Post)(':id/configure'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, configure_deployment_dto_1.ConfigureDeploymentDto]),
    __metadata("design:returntype", void 0)
], DeploymentsController.prototype, "configureDeployment", null);
__decorate([
    (0, common_1.Post)(':id/pause'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DeploymentsController.prototype, "pauseDeployment", null);
__decorate([
    (0, common_1.Post)(':id/resume'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DeploymentsController.prototype, "resumeDeployment", null);
__decorate([
    (0, common_1.Post)(':id/stop'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DeploymentsController.prototype, "stopDeployment", null);
__decorate([
    (0, common_1.Get)(':id/logs'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, query_deployment_logs_dto_1.QueryDeploymentLogsDto]),
    __metadata("design:returntype", void 0)
], DeploymentsController.prototype, "getDeploymentLogs", null);
exports.DeploymentsController = DeploymentsController = __decorate([
    (0, common_1.Controller)('deployments'),
    __metadata("design:paramtypes", [deployments_service_1.DeploymentsService])
], DeploymentsController);
//# sourceMappingURL=deployments.controller.js.map