import { Body, Controller, Post, Param, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(@Body() body: unknown) {
    return this.reportsService.createReport(body);
  }

  @Get(':reportId')
  async getReport(@Param('reportId') reportId: string) {
    const report = await this.reportsService.getCanonicalReport(reportId);
    const parsed: unknown = JSON.parse(report?.canonicalJson ?? '{}');
    return parsed;
  }
  @Get(':reportId/meta')
  async getReportMeta(@Param('reportId') reportId: string) {
    return this.reportsService.getReportMeta(reportId);
  }
  @Get(':reportId/score')
  async getReportScore(@Param('reportId') reportId: string) {
    return this.reportsService.getReportScore(reportId);
  }
}
