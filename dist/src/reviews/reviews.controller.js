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
exports.ReviewsController = void 0;
const common_1 = require("@nestjs/common");
const request_context_1 = require("../common/request/request-context");
const create_review_dto_1 = require("./dto/create-review.dto");
const query_reviews_dto_1 = require("./dto/query-reviews.dto");
const reviews_service_1 = require("./reviews.service");
let ReviewsController = class ReviewsController {
    reviewsService;
    constructor(reviewsService) {
        this.reviewsService = reviewsService;
    }
    getWorkflowReviews(workflowId, query) {
        return this.reviewsService.getWorkflowReviews(workflowId, query);
    }
    createOrUpdateReview(req, workflowId, dto) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['BUYER', 'SELLER', 'ADMIN']);
        return this.reviewsService.upsertWorkflowReview(context.userId, workflowId, dto);
    }
};
exports.ReviewsController = ReviewsController;
__decorate([
    (0, common_1.Get)('workflows/:workflowId'),
    __param(0, (0, common_1.Param)('workflowId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_reviews_dto_1.QueryReviewsDto]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "getWorkflowReviews", null);
__decorate([
    (0, common_1.Post)('workflows/:workflowId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('workflowId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_review_dto_1.CreateReviewDto]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "createOrUpdateReview", null);
exports.ReviewsController = ReviewsController = __decorate([
    (0, common_1.Controller)('reviews'),
    __metadata("design:paramtypes", [reviews_service_1.ReviewsService])
], ReviewsController);
//# sourceMappingURL=reviews.controller.js.map