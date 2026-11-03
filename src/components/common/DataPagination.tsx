import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface DataPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Rút gọn danh sách trang: luôn hiện 2 trang đầu, 2 trang cuối, trang hiện tại và 1 trang lân cận.
// Ví dụ: 1 2 3 ... 23 24  hoặc  1 2 ... 11 12 13 ... 23 24  hoặc  1 2 ... 22 23 24
function getPageItems(page: number, total: number): (number | 'ellipsis')[] {
  const keep = new Set<number>([1, 2, total - 1, total, page - 1, page, page + 1]);
  if (page <= 3) keep.add(3);
  if (page >= total - 2) keep.add(total - 2);
  const sorted = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const items: (number | 'ellipsis')[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) items.push('ellipsis');
    items.push(n);
  });
  return items;
}

// Phân trang dùng chung cho các trang danh sách - client-side, không cần href thật
export function DataPagination({ page, totalPages, onPageChange }: DataPaginationProps) {
  if (totalPages <= 1) return null;

  const goTo = (p: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    onPageChange(Math.min(Math.max(p, 1), totalPages));
  };

  const pages = getPageItems(page, totalPages);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={goTo(page - 1)}
            className={page === 1 ? 'pointer-events-none opacity-40' : undefined}
          />
        </PaginationItem>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink href="#" isActive={p === page} onClick={goTo(p)}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={goTo(page + 1)}
            className={page === totalPages ? 'pointer-events-none opacity-40' : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
