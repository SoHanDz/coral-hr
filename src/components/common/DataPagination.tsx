import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import {
  Pagination,
  PaginationContent,
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

// Hiển thị tối đa 5 số trang, phần còn lại thu vào dấu "..." (bấm vào để nhập số trang cần tới).
// Ví dụ: 1 2 3 ... 23 24  |  ... 3 4 5 ... 23 24 (trang 4)  |  ... 20 21 22 23 24 (gần cuối)
function getPageItems(page: number, total: number): (number | 'ellipsis')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  let nums: number[];
  if (page >= total - 2) {
    nums = Array.from({ length: 5 }, (_, i) => total - 4 + i);
  } else {
    const start = Math.max(1, page - 1);
    nums = [start, start + 1, start + 2, total - 1, total];
  }

  const items: (number | 'ellipsis')[] = [];
  if (nums[0] > 1) items.push('ellipsis');
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) items.push('ellipsis');
    items.push(n);
  });
  return items;
}

// Dấu "..." bấm vào chuyển thành ô nhập số trang; Enter để đi, Esc/blur để huỷ
function JumpEllipsis({ totalPages, onJump }: { totalPages: number; onJump: (p: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  const submit = () => {
    const n = Number(value);
    if (Number.isInteger(n) && n >= 1 && n <= totalPages) onJump(n);
    setEditing(false);
    setValue('');
  };

  if (!editing) {
    return (
      <button
        type="button"
        aria-label="Nhập số trang"
        title="Nhập số trang"
        onClick={() => setEditing(true)}
        className="flex size-9 items-center justify-center rounded-md hover:bg-muted"
      >
        <MoreHorizontal className="size-4" />
      </button>
    );
  }

  return (
    <input
      autoFocus
      type="number"
      min={1}
      max={totalPages}
      value={value}
      placeholder={`1-${totalPages}`}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        setEditing(false);
        setValue('');
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') submit();
        if (e.key === 'Escape') setEditing(false);
      }}
      className="h-9 w-16 rounded-md border bg-background px-2 text-center text-sm outline-none focus:ring-2 focus:ring-sky-500"
    />
  );
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
              <JumpEllipsis totalPages={totalPages} onJump={onPageChange} />
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
