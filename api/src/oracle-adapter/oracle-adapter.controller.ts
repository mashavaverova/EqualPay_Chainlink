import { Controller, Get, Param, Post } from '@nestjs/common';
import { OracleAdapterService } from './oracle-adapter.service';

@Controller('oracle')
export class OracleAdapterController {
  constructor(private readonly oracleAdapterService: OracleAdapterService) {}

  @Get('payload/:reportId')
  async getPublishPayload(@Param('reportId') reportId: string) {
    return this.oracleAdapterService.getPublishPayload(reportId);
  }
  @Post('publish/:reportId')
  async publishScore(@Param('reportId') reportId: string) {
    return this.oracleAdapterService.publishScore(reportId);
  }
}
