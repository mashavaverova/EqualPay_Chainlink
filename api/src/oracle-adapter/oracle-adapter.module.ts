import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports/reports.module';
import { OracleAdapterService } from './oracle-adapter.service';
import { OracleAdapterController } from './oracle-adapter.controller';

@Module({
  imports: [ReportsModule],
  providers: [OracleAdapterService],
  controllers: [OracleAdapterController],
})
export class OracleAdapterModule {}
