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
exports.AdminWorkflowsController = void 0;
const common_1 = require("@nestjs/common");
const request_context_1 = require("../../common/request/request-context");
const admin_query_workflows_dto_1 = require("../dto/admin-query-workflows.dto");
const feature_workflow_dto_1 = require("../dto/feature-workflow.dto");
const moderate_workflow_dto_1 = require("../dto/moderate-workflow.dto");
const workflows_service_1 = require("../workflows.service");
let AdminWorkflowsController = class AdminWorkflowsController {
    workflowsService;
    constructor(workflowsService) {
        this.workflowsService = workflowsService;
    }
    getAdminWorkflows(req, query) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['ADMIN']);
        return this.workflowsService.getAdminWorkflows(query);
    }
    moderateWorkflow(req, id, dto) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['ADMIN']);
        return this.workflowsService.moderateWorkflow(id, dto);
    }
    featureWorkflow(req, id, dto) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['ADMIN']);
        return this.workflowsService.featureWorkflow(id, dto);
    }
};
exports.AdminWorkflowsController = AdminWorkflowsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_query_workflows_dto_1.AdminQueryWorkflowsDto]),
    __metadata("design:returntype", void 0)
], AdminWorkflowsController.prototype, "getAdminWorkflows", null);
__decorate([
    (0, common_1.Patch)(':id/moderate'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, moderate_workflow_dto_1.ModerateWorkflowDto]),
    __metadata("design:returntype", void 0)
], AdminWorkflowsController.prototype, "moderateWorkflow", null);
__decorate([
    (0, common_1.Patch)(':id/feature'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, feature_workflow_dto_1.FeatureWorkflowDto]),
    __metadata("design:returntype", void 0)
], AdminWorkflowsController.prototype, "featureWorkflow", null);
exports.AdminWorkflowsController = AdminWorkflowsController = __decorate([
    (0, common_1.Controller)('admin/workflows'),
    __metadata("design:paramtypes", [workflows_service_1.WorkflowsService])
], AdminWorkflowsController);
//# sourceMappingURL=admin-workflows.controller.js.map