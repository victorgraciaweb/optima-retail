import { Article } from '../../articles/entities/article.entity';
import { Sentiment } from '../../articles/enums/sentiment.enum';
import { EnrichmentResultDto } from '../dto/enrichment-result.dto';
import { stripHtml } from '../prompts/enrichment.prompt';

const SUMMARY_WORDS = 20;

/**
 * Deterministic stand-in used when no ANTHROPIC_API_KEY is configured, so the
 * project can be seeded and demoed end-to-end without an API account.
 *
 * It is intentionally naive — it does not pretend to classify sentiment — so
 * mock output is never mistaken for real model output.
 */
export const mockEnrichment = (article: Article): EnrichmentResultDto => {
  const words = stripHtml(article.body).split(' ');
  const summary = words.slice(0, SUMMARY_WORDS).join(' ');

  return {
    summary: words.length > SUMMARY_WORDS ? `${summary}...` : summary,
    sentiment: Sentiment.NEUTRAL,
    topics: [article.source.toLowerCase(), article.language],
  };
};
