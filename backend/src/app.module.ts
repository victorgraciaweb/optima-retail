import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvConfiguration } from './config/app.config';
import { HealthModule } from './health/health.module';
import { IncidentsModule } from './incidents/incidents.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [EnvConfiguration],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      // Schema changes travel in src/migrations only. See src/config/data-source.ts.
      synchronize: false,
    }),
    HealthModule,
    IncidentsModule,
    MaintenanceModule,
    SeedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
