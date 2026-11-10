import { Sentiment } from '../../articles/enums/sentiment.enum';

export class EnrichmentResultDto {
  summary: string;
  sentiment: Sentiment;
  topics: string[];
}
