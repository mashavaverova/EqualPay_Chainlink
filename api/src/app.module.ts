import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportsModule } from './reports/reports.module';
import { OracleAdapterModule } from './oracle-adapter/oracle-adapter.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data.sqlite',
      autoLoadEntities: true,
      synchronize: true,
    }),
    ReportsModule,
    OracleAdapterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
