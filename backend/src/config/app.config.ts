/**
 * Environment-backed configuration.
 *
 * Every key has a default, so `ConfigService.getOrThrow` is safe at every call
 * site and the app boots with no .env at all (except the database, which is
 * read straight from `process.env` by the TypeORM options).
 */
export const EnvConfiguration = () => ({
  globalPrefix: process.env.GLOBAL_PREFIX || 'api',
  corsEnabled: process.env.CORS_ENABLED === 'true',
  port: Number(process.env.PORT) || 3000,

  titleSwagger: process.env.TITLE_SWAGGER || 'API Documentation',
  descriptionSwagger:
    process.env.DESCRIPTION_SWAGGER || 'API description and usage',
  versionSwagger: process.env.VERSION_SWAGGER || '1.0',
  routeSwagger: process.env.ROUTE_SWAGGER || 'docs',
});
