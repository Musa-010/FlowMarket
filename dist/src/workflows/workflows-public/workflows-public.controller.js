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
exports.WorkflowsPublicController = void 0;
const common_1 = require("@nestjs/common");
const query_workflows_dto_1 = require("../dto/query-workflows.dto");
const workflows_service_1 = require("../workflows.service");
let WorkflowsPublicController = class WorkflowsPublicController {
    workflowsService;
    constructor(workflowsService) {
        this.workflowsService = workflowsService;
    }
    getPublicWorkflows(query) {
        return this.workflowsService.getPublicWorkflows(query);
    }
    getFeaturedWorkflows() {
        return this.workflowsService.getFeaturedWorkflows();
    }
    getWorkflowBySlug(slug) {
        return this.workflowsService.getWorkflowBySlug(slug);
    }
};
exports.WorkflowsPublicController = WorkflowsPublicController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_workflows_dto_1.QueryWorkflowsDto]),
    __metadata("design:returntype", void 0)
], WorkflowsPublicController.prototype, "getPublicWorkflows", null);
__decorate([
    (0, common_1.Get)('featured'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WorkflowsPublicController.prototype, "getFeaturedWorkflows", null);
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkflowsPublicController.prototype, "getWorkflowBySlug", null);
exports.WorkflowsPublicController = WorkflowsPublicController = __decorate([
    (0, common_1.Controller)('workflows'),
    __metadata("design:paramtypes", [workflows_service_1.WorkflowsService])
], WorkflowsPublicController);
//# sourceMappingURL=workflows-public.controller.js.map