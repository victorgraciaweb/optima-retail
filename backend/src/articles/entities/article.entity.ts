import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';
import { Sentiment } from '../enums/sentiment.enum';

@Entity('articles')
export class Article {
  @PrimaryColumn({ type: 'integer' })
  id: number;

  @Column('text')
  headline: string;

  @Column('text')
  body: string;

  @Column('text')
  source: string;

  @Column('date')
  publishedAt: string;

  @Column('text')
  language: string;

  /**
   * AI-generated summary (1–2 sentences).
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  summary?: string;

  /**
   * AI-generated sentiment.
   */
  @Column({
    type: 'enum',
    enum: Sentiment,
    nullable: true,
  })
  sentiment?: Sentiment;

  /**
   * AI-generated topic tags.
   */
  @Column({
    type: 'text',
    array: true,
    nullable: true,
  })
  topics?: string[];

  /**
   * Pre-computed full-text vector, kept in sync by PostgreSQL itself.
   *
   * Stored (instead of computing `to_tsvector(...)` inside the WHERE clause)
   * so the search can use a GIN index rather than re-tokenizing every row.
   * `coalesce` covers the deliberately empty headline in the sample data.
   */
  @Column({
    name: 'search_vector',
    type: 'tsvector',
    select: false,
    asExpression: `to_tsvector('simple', coalesce(headline, '') || ' ' || coalesce(body, ''))`,
    generatedType: 'STORED',
  })
  searchVector: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
