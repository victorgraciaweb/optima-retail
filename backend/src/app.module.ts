import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from './analytics/analytics.module';
import { ArticlesModule } from './articles/articles.module';
import { CommonModule } from './common/common.module';
import { EnvConfiguration } from './config/app.config';
import { HealthModule } from './health/health.module';
import { SearchModule } from './search/search.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [EnvConfiguration],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true,
    }),
    CommonModule,
    HealthModule,
    ArticlesModule,
    AnalyticsModule,
    SearchModule,
    SeedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
