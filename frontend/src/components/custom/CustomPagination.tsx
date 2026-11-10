import { useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface Props {
  totalPages: number;
}

export const CustomPagination = ({ totalPages }: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryPage = searchParams.get('page') ?? '1';
  const page = isNaN(+queryPage) ? 1 : Number(queryPage);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;

    searchParams.set('page', page.toString());

    setSearchParams(searchParams);
  };

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-2"
      aria-label="Paginación"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={() => {
          handlePageChange(page - 1);
        }}
      >
        <ChevronLeft className="h-4 w-4" />
        Anteriores
      </Button>

      {Array.from({ length: totalPages }).map((_, index) => (
        <Button
          key={index}
          variant={page === index + 1 ? 'default' : 'outline'}
          size="sm"
          className="w-9"
          onClick={() => {
            handlePageChange(index + 1);
          }}
        >
          {index + 1}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        disabled={page === totalPages}
        onClick={() => {
          handlePageChange(page + 1);
        }}
      >
        Siguientes
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
};
