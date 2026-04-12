"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestContext = getRequestContext;
exports.assertRole = assertRole;
const common_1 = require("@nestjs/common");
const requestRoles = ['BUYER', 'SELLER', 'ADMIN'];
function readHeader(req, key) {
    const value = req.headers[key];
    if (Array.isArray(value)) {
        return value[0];
    }
    return typeof value === 'string' ? value : undefined;
}
function getRequestContext(req) {
    const userId = readHeader(req, 'x-user-id');
    if (!userId) {
        throw new common_1.UnauthorizedException('x-user-id header is required');
    }
    const roleHeader = readHeader(req, 'x-user-role')?.toUpperCase() ?? 'BUYER';
    if (!requestRoles.includes(roleHeader)) {
        throw new common_1.BadRequestException('x-user-role must be one of BUYER, SELLER, ADMIN');
    }
    return {
        userId,
        role: roleHeader,
    };
}
function assertRole(context, allowedRoles) {
    if (!allowedRoles.includes(context.role)) {
        throw new common_1.ForbiddenException('Insufficient permissions');
    }
}
//# sourceMappingURL=request-context.js.map