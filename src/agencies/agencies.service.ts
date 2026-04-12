import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgenciesService {
  constructor(private readonly prisma: PrismaService) {}

  async createAgency(agencyData: any) {
    // minimal fields: name, domain, ownerId
    if (!agencyData.name || !agencyData.ownerId) {
      throw new BadRequestException('name and ownerId required');
    }
    return this.prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({ data: agencyData });
      return agency;
    });
  }

  async getAgencyById(id: string) {
    return this.prisma.agency.findUnique({ where: { id } });
  }

  async listAgencies({ skip = 0, take = 20 } = {}) {
    const [total, items] = await this.prisma.$transaction([
      this.prisma.agency.count(),
      this.prisma.agency.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
    ]);
    return { total, items };
  }

  async updateAgency(id: string, updates: any) {
    return this.prisma.agency.update({ where: { id }, data: updates });
  }

  async deleteAgency(id: string) {
    return this.prisma.agency.delete({ where: { id } });
  }
}
