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
exports.CheckoutController = void 0;
const common_1 = require("@nestjs/common");
const request_context_1 = require("../../common/request/request-context");
const create_customer_portal_dto_1 = require("../dto/create-customer-portal.dto");
const create_one_time_checkout_dto_1 = require("../dto/create-one-time-checkout.dto");
const create_subscription_checkout_dto_1 = require("../dto/create-subscription-checkout.dto");
const payments_service_1 = require("../payments.service");
let CheckoutController = class CheckoutController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    createOneTimeCheckout(req, dto) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['BUYER', 'SELLER', 'ADMIN']);
        return this.paymentsService.createOneTimeCheckout(context.userId, dto);
    }
    createSubscriptionCheckout(req, dto) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['BUYER', 'SELLER', 'ADMIN']);
        return this.paymentsService.createSubscriptionCheckout(context.userId, dto);
    }
    createCustomerPortal(req, dto) {
        const context = (0, request_context_1.getRequestContext)(req);
        (0, request_context_1.assertRole)(context, ['BUYER', 'SELLER', 'ADMIN']);
        return this.paymentsService.createCustomerPortal(context.userId, dto);
    }
    handleStripeWebhook(req, signature) {
        if (!signature) {
            throw new common_1.BadRequestException('Missing stripe-signature header');
        }
        const rawBody = Buffer.isBuffer(req.body)
            ? req.body
            : Buffer.from(JSON.stringify(req.body ?? {}));
        return this.paymentsService.handleStripeWebhook(signature, rawBody);
    }
};
exports.CheckoutController = CheckoutController;
__decorate([
    (0, common_1.Post)('one-time'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_one_time_checkout_dto_1.CreateOneTimeCheckoutDto]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "createOneTimeCheckout", null);
__decorate([
    (0, common_1.Post)('subscription'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_subscription_checkout_dto_1.CreateSubscriptionCheckoutDto]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "createSubscriptionCheckout", null);
__decorate([
    (0, common_1.Post)('portal'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_customer_portal_dto_1.CreateCustomerPortalDto]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "createCustomerPortal", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CheckoutController.prototype, "handleStripeWebhook", null);
exports.CheckoutController = CheckoutController = __decorate([
    (0, common_1.Controller)('checkout'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], CheckoutController);
//# sourceMappingURL=checkout.controller.js.map