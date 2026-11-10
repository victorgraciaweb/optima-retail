import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Article } from '../../articles/entities/article.entity';
import { mockEnrichment } from '../mock/mock-enrichment';
import {
  buildEnrichmentPrompt,
  ENRICHMENT_OUTPUT_SCHEMA,
  ENRICHMENT_SYSTEM_PROMPT,
} from '../prompts/enrichment.prompt';
import { EnrichmentResultDto } from '../dto/enrichment-result.dto';
import { validateEnrichment } from '../utils/validate-enrichment';

/**
 * Cost guardrail: caps the output side of every request. 400 tokens is well
 * above a 2-sentence summary plus 3 tags, but bounds a runaway generation.
 */
const MAX_OUTPUT_TOKENS = 400;

/**
 * Anthropic list price for the default model (claude-haiku-4-5), in USD per
 * million tokens. Hardcoded so the seed can report a measured cost; update if
 * the configured model changes. Source: Anthropic pricing.
 */
const INPUT_USD_PER_MTOK = 1.0;
const OUTPUT_USD_PER_MTOK = 5.0;

@Injectable()
export class LlmEnrichmentService implements OnModuleInit {
  private readonly logger = new Logger(LlmEnrichmentService.name);
  private readonly client?: Anthropic;
  private readonly model: string;
  private readonly maxBodyChars: number;

  // Cost accounting: totals over the articles that actually hit the API this
  // run (excludes the already-enriched and mock paths, which are free).
  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  private enrichedCount = 0;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('anthropicApiKey');

    this.client = apiKey ? new Anthropic({ apiKey }) : undefined;
    this.model = this.configService.get<string>('llmModel');
    this.maxBodyChars = this.configService.get<number>('llmMaxBodyChars');
  }

  onModuleInit(): void {
    if (this.client) {
      this.logger.log(`LLM enrichment enabled (model: ${this.model})`);
      return;
    }

    this.logger.warn(
      'ANTHROPIC_API_KEY not set - falling back to mock enrichment. ' +
        'Summaries, sentiment and topics are placeholders, not model output.',
    );
  }

  async enrich(article: Article): Promise<EnrichmentResultDto> {
    // Cost guardrail: never pay twice for an article that is already enriched.
    if (article.summary) {
      return {
        summary: article.summary,
        sentiment: article.sentiment,
        topics: article.topics ?? [],
      };
    }

    if (!this.client) return mockEnrichment(article);

    const raw = await this.requestEnrichment(article);

    return validateEnrichment(raw);
  }

  /**
   * Logs the measured token usage and estimated USD cost of this run. Feeds
   * the LLM Cost Analysis section of the README with real numbers.
   */
  logUsageSummary(): void {
    if (this.enrichedCount === 0) {
      this.logger.log(
        'LLM usage: no billable requests this run (mock or already enriched)',
      );
      return;
    }

    const inputCost = (this.totalInputTokens / 1_000_000) * INPUT_USD_PER_MTOK;
    const outputCost =
      (this.totalOutputTokens / 1_000_000) * OUTPUT_USD_PER_MTOK;
    const totalCost = inputCost + outputCost;

    this.logger.log(
      `LLM usage (${this.model}, ${this.enrichedCount} articles): ` +
        `${this.totalInputTokens} input + ${this.totalOutputTokens} output tokens | ` +
        `~$${totalCost.toFixed(4)} total | ` +
        `~$${(totalCost / this.enrichedCount).toFixed(4)}/article`,
    );
  }

  private async requestEnrichment(
    article: Article,
  ): Promise<Record<string, unknown>> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: ENRICHMENT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildEnrichmentPrompt({
            headline: article.headline,
            // Cost guardrail: bounds input tokens per article. No-op on the
            // sample data, relevant at ingestion scale.
            body: article.body.slice(0, this.maxBodyChars),
            language: article.language,
          }),
        },
      ],
      // Structured outputs guarantee parseable JSON, so there is no brittle
      // text scraping. The shape is guaranteed; the values still are not.
      output_config: {
        format: { type: 'json_schema', schema: ENRICHMENT_OUTPUT_SCHEMA },
      },
    });

    // Real usage reported by the API (not an estimate) — accumulated so the
    // seed can report the measured cost of enriching the sample set.
    this.totalInputTokens += response.usage.input_tokens;
    this.totalOutputTokens += response.usage.output_tokens;
    this.enrichedCount += 1;

    const textBlock = response.content.find((block) => block.type === 'text');

    if (!textBlock) {
      throw new Error(`Article ${article.id}: no text block in LLM response`);
    }

    try {
      return JSON.parse(textBlock.text) as Record<string, unknown>;
    } catch {
      throw new Error(
        `Article ${article.id}: invalid JSON returned by the LLM`,
      );
    }
  }
}
