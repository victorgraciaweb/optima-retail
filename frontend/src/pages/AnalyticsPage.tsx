import { Link, useSearchParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useArticlesOverTime } from '@/hooks/useArticlesOverTime';
import { Button } from '@/components/ui/button';

const SENTIMENTS = ['all', 'positive', 'negative', 'neutral', 'mixed'] as const;

export const AnalyticsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get('sentiment') ?? 'all';

  const { data, isLoading, isError } = useArticlesOverTime();

  const handleFilter = (sentiment: string) => {
    if (sentiment === 'all') {
      searchParams.delete('sentiment');
    } else {
      searchParams.set('sentiment', sentiment);
    }
    setSearchParams(searchParams);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="outline" size="sm">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to search
        </Link>
      </Button>

      <h1 className="mt-6 text-2xl font-semibold">Articles over time</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Article counts grouped by publication month, filterable by sentiment.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {SENTIMENTS.map((sentiment) => (
          <Button
            key={sentiment}
            variant={active === sentiment ? 'default' : 'outline'}
            size="sm"
            className="capitalize"
            onClick={() => handleFilter(sentiment)}
          >
            {sentiment}
          </Button>
        ))}
      </div>

      <div className="mt-8">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}

        {isError && (
          <p className="text-sm text-destructive">Something went wrong</p>
        )}

        {data &&
          (data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No articles for this filter.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="period" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar
                  dataKey="count"
                  fill="hsl(220 90% 56%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ))}
      </div>
    </main>
  );
};
