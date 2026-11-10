import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowRight, Search } from 'lucide-react';
import { isAxiosError } from 'axios';

import { useSearchArticles } from '@/hooks/useSearchArticles';
import { sentimentVariant } from '@/lib/sentiment';
import { CustomPagination } from '@/components/custom/CustomPagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Article } from '@/interfaces/article.interface';

// Untrusted content: headline/body/summary are rendered as text so React
// escapes any HTML/script injected in the source articles (see sample 6/18).
const ArticleCard = ({ article }: { article: Article }) => (
  <li className="rounded-lg border p-4">
    <div className="flex items-start justify-between gap-4">
      <Link
        to={`/articles/${article.id}`}
        className="font-semibold hover:underline"
      >
        {article.headline || '(untitled)'}
      </Link>
      <Badge variant={sentimentVariant(article.sentiment)}>
        {article.sentiment}
      </Badge>
    </div>

    <p className="mt-2 text-sm text-muted-foreground">{article.summary}</p>

    <div className="mt-3 flex flex-wrap items-center gap-2">
      {article.topics?.map((topic) => (
        <Badge key={topic} variant="outline">
          {topic}
        </Badge>
      ))}
    </div>

    <p className="mt-3 text-xs text-muted-foreground">
      {article.source} · {article.publishedAt} · {article.language}
    </p>

    <Button asChild variant="outline" size="sm" className="mt-4">
      <Link to={`/articles/${article.id}`}>
        View article
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  </li>
);

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [term, setTerm] = useState(q);

  const { data, isLoading, isError, error } = useSearchArticles();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = term.trim();

    if (value) {
      searchParams.set('q', value);
    } else {
      searchParams.delete('q');
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const errorMessage = isAxiosError(error)
    ? (error.response?.data?.message ?? error.message)
    : 'Something went wrong';

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Search articles</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/analytics">
            Analytics
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Boolean syntax: AND, OR, AND NOT, parentheses, "phrases" and wildcard*.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder='e.g. AI AND ("healthcare" OR renew*)'
        />
        <Button type="submit">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </form>

      <div className="mt-8">
        {!q && (
          <p className="text-sm text-muted-foreground">
            Enter a query to search articles.
          </p>
        )}

        {q && isLoading && (
          <p className="text-sm text-muted-foreground">Searching…</p>
        )}

        {q && isError && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        {q && data && (
          <>
            <p className="text-sm text-muted-foreground">
              {data.count} result{data.count === 1 ? '' : 's'}
            </p>

            {data.data.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No articles match this query.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {data.data.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </ul>
            )}

            {data.pages > 1 && <CustomPagination totalPages={data.pages} />}
          </>
        )}
      </div>
    </main>
  );
};
