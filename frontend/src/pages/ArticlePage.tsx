import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { isAxiosError } from 'axios';

import { useArticle } from '@/hooks/useArticle';
import { sentimentVariant } from '@/lib/sentiment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const ArticlePage = () => {
  const { data: article, isLoading, isError, error } = useArticle();

  const errorMessage =
    isAxiosError(error) && error.response?.status === 404
      ? 'Article not found'
      : 'Something went wrong';

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="outline" size="sm">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to search
        </Link>
      </Button>

      {isLoading && (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      )}

      {isError && <p className="mt-8 text-sm text-destructive">{errorMessage}</p>}

      {article && (
        // Untrusted content: headline/summary/body rendered as text so React
        // escapes any HTML/script injected in the source articles (sample 6/18).
        <article className="mt-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold">
              {article.headline || '(untitled)'}
            </h1>
            <Badge variant={sentimentVariant(article.sentiment)}>
              {article.sentiment}
            </Badge>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {article.source} · {article.publishedAt} · {article.language}
          </p>

          {article.topics?.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {article.topics.map((topic) => (
                <Badge key={topic} variant="outline">
                  {topic}
                </Badge>
              ))}
            </div>
          )}

          <p className="mt-6 text-sm text-muted-foreground">{article.summary}</p>

          <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
            {article.body}
          </p>
        </article>
      )}
    </main>
  );
};
