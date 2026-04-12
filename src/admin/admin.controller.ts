import { Controller, Get, Query, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics')
  async analytics() {
    return this.adminService.analyticsOverview();
  }

  @Get('seller/:sellerId/earnings')
  async sellerEarnings(@Param('sellerId') sellerId: string) {
    return this.adminService.sellerEarningsReport(sellerId);
  }
}
