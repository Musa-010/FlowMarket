import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers } from '@nestjs/common';
import { AgenciesService } from './agencies.service';

@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Post()
  async create(@Body() body: any) {
    return this.agenciesService.createAgency(body);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.agenciesService.getAgencyById(id);
  }

  @Get()
  async list(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.agenciesService.listAgencies({ skip: Number(skip) || 0, take: Number(take) || 20 });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.agenciesService.updateAgency(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.agenciesService.deleteAgency(id);
  }
}
