import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmEnrichmentService } from './services/llm-enrichment.service';

@Module({
  imports: [ConfigModule],
  providers: [LlmEnrichmentService],
  exports: [LlmEnrichmentService],
})
export class LlmModule {}
