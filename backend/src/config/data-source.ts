import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * Standalone DataSource used exclusively by the TypeORM CLI (migration
 * generate/run/revert). The runtime connection lives in AppModule; keeping them
 * separate avoids booting the whole Nest application just to touch the schema.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  // Never let the CLI mutate the schema implicitly: migrations are the only
  // sanctioned path, so a drift shows up as a generated file to review.
  synchronize: false,
});
