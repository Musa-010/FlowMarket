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
exports.SellerWorkflowsController = void 0;
const common_1 = require("@nestjs/common");
const request_context_1 = require("../../common/request/request-context");
const create_workflow_dto_1 = require("../dto/create-workflow.dto");
const update_workflow_dto_1 = require("../dto/update-workflow.dto");
const workflows_service_1 = require("../workflows.service");
let SellerWorkflowsController = class SellerWorkflowsController {
    workflowsService;
    constructor(workflowsService) {
        this.workflowsService = workflowsService;
    }
    async getSellerWorkflows(req) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['SELLER']);
        return {
            data: await this.workflowsService.getSellerWorkflows(context.userId),
        };
    }
    createSellerWorkflow(req, dto) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['SELLER']);
        return this.workflowsService.createSellerWorkflow(context.userId, dto);
    }
    updateSellerWorkflow(req, id, dto) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['SELLER']);
        return this.workflowsService.updateSellerWorkflow(context.userId, id, dto);
    }
    submitSellerWorkflow(req, id) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['SELLER']);
        return this.workflowsService.submitSellerWorkflow(context.userId, id);
    }
};
exports.SellerWorkflowsController = SellerWorkflowsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SellerWorkflowsController.prototype, "getSellerWorkflows", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_workflow_dto_1.CreateWorkflowDto]),
    __metadata("design:returntype", void 0)
], SellerWorkflowsController.prototype, "createSellerWorkflow", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_workflow_dto_1.UpdateWorkflowDto]),
    __metadata("design:returntype", void 0)
], SellerWorkflowsController.prototype, "updateSellerWorkflow", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SellerWorkflowsController.prototype, "submitSellerWorkflow", null);
exports.SellerWorkflowsController = SellerWorkflowsController = __decorate([
    (0, common_1.Controller)('seller/workflows'),
    __metadata("design:paramtypes", [workflows_service_1.WorkflowsService])
], SellerWorkflowsController);
//# sourceMappingURL=seller-workflows.controller.js.map