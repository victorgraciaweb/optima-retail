import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../../articles/entities/article.entity';
import { LlmEnrichmentService } from '../../llm/services/llm-enrichment.service';
import * as sampleArticles from '../sample_articles.json';

interface SampleArticle {
  id: number;
  headline: string;
  body: string;
  source: string;
  published_at: string;
  language: string;
}

/**
 * Loads the 20 sample articles required by the assignment.
 *
 * Clear-and-reinsert: the sample set is fixed and re-running the seed
 * should not accumulate duplicates. Article.id is a plain PrimaryColumn
 * (not auto-generated), so the sample ids are inserted as-is.
 */
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly llmEnrichmentService: LlmEnrichmentService,
  ) {}

  async execute(): Promise<void> {
    await this.ensureSearchIndex();

    await this.articleRepository.clear();

    const articles = this.loadSampleArticles();

    await this.articleRepository.save(articles);

    await this.enrichArticles();

    this.logger.log(`Seeded ${articles.length} articles`);

    this.llmEnrichmentService.logUsageSummary();
  }

  private async ensureSearchIndex(): Promise<void> {
    /**
     * Ensure the GIN index used by PostgreSQL Full Text Search exists.
     *
     * In a production application this would typically be managed
     * through database migrations.
     */
    await this.articleRepository.query(`
    CREATE INDEX IF NOT EXISTS idx_articles_search_vector
    ON articles
    USING GIN (search_vector)
  `);
  }

  private loadSampleArticles(): Article[] {
    return (sampleArticles as SampleArticle[]).map((sample) =>
      this.articleRepository.create({
        id: sample.id,
        headline: sample.headline,
        body: sample.body,
        source: sample.source,
        // The sample data contains full ISO timestamps, while the entity
        // stores only the date (YYYY-MM-DD).
        publishedAt: sample.published_at.slice(0, 10),
        language: sample.language,
      }),
    );
  }

  private async enrichArticles(): Promise<void> {
    const articles = await this.articleRepository.find();

    for (const article of articles) {
      /**
       * A failure on one article (network, rate limit, malformed response)
       * leaves that article unenriched rather than aborting the whole seed
       * and leaving the database half-populated. The enrichment columns are
       * nullable precisely so this degrades instead of breaking.
       */
      try {
        const enrichment = await this.llmEnrichmentService.enrich(article);

        await this.articleRepository.save({
          ...article,
          ...enrichment,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';

        this.logger.warn(
          `Enrichment failed for article ${article.id}: ${message}`,
        );
      }
    }
  }
}
