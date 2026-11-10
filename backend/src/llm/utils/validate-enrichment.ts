import { EnrichmentResultDto } from '../dto/enrichment-result.dto';
import { Sentiment } from '../../articles/enums/sentiment.enum';

const MAX_TOPICS = 3;
const MAX_SUMMARY_LENGTH = 500;

/**
 * Validates and sanitizes the LLM output before persisting it.
 *
 * LLM responses are treated as untrusted input. This function ensures
 * the output matches the expected schema and falls back to safe defaults
 * when necessary.
 */
export function validateEnrichment(raw: unknown): EnrichmentResultDto {
  const candidate = (raw ?? {}) as Record<string, unknown>;

  const summary =
    typeof candidate.summary === 'string'
      ? candidate.summary.trim().slice(0, MAX_SUMMARY_LENGTH)
      : '';

  const sentiment = Object.values(Sentiment).includes(
    candidate.sentiment as Sentiment,
  )
    ? (candidate.sentiment as Sentiment)
    : Sentiment.NEUTRAL;

  const topics = Array.isArray(candidate.topics)
    ? candidate.topics
        .filter(
          (topic): topic is string =>
            typeof topic === 'string' && topic.trim().length > 0,
        )
        .map((topic) => topic.trim())
        .slice(0, MAX_TOPICS)
    : [];

  return {
    summary,
    sentiment,
    topics,
  };
}
