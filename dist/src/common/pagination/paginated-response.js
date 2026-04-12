"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginatedResponse = buildPaginatedResponse;
function buildPaginatedResponse(data, total, page, limit) {
    return {
        data,
        total,
        page,
        limit,
        hasMore: page * limit < total,
    };
}
//# sourceMappingURL=paginated-response.js.map