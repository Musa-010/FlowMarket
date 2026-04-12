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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgenciesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AgenciesService = class AgenciesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAgency(agencyData) {
        if (!agencyData.name || !agencyData.ownerId) {
            throw new common_1.BadRequestException('name and ownerId required');
        }
        return this.prisma.$transaction(async (tx) => {
            const agency = await tx.agency.create({ data: agencyData });
            return agency;
        });
    }
    async getAgencyById(id) {
        return this.prisma.agency.findUnique({ where: { id } });
    }
    async listAgencies({ skip = 0, take = 20 } = {}) {
        const [total, items] = await this.prisma.$transaction([
            this.prisma.agency.count(),
            this.prisma.agency.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
        ]);
        return { total, items };
    }
    async updateAgency(id, updates) {
        return this.prisma.agency.update({ where: { id }, data: updates });
    }
    async deleteAgency(id) {
        return this.prisma.agency.delete({ where: { id } });
    }
};
exports.AgenciesService = AgenciesService;
exports.AgenciesService = AgenciesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgenciesService);
//# sourceMappingURL=agencies.service.js.map