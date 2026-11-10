export const EnvConfiguration = () => ({
  globalPrefix: process.env.GLOBAL_PREFIX || 'api',
  corsEnabled: process.env.CORS_ENABLED === 'true',
  port: parseInt(process.env.PORT, 10) || 3000,

  titleSwagger: process.env.TITLE_SWAGGER || 'API Documentation',
  descriptionSwagger:
    process.env.DESCRIPTION_SWAGGER || 'API description and usage',
  versionSwagger: process.env.VERSION_SWAGGER || '1.0',
  routeSwagger: process.env.ROUTE_SWAGGER || 'docs',

  jwtSecret: process.env.JWT_SECRET,

  // LLM enrichment. Without an API key the seed falls back to mock output,
  // so the project runs end-to-end with no API account.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  llmModel: process.env.LLM_MODEL || 'claude-haiku-4-5',
  llmMaxBodyChars: parseInt(process.env.LLM_MAX_BODY_CHARS, 10) || 2000,
});
