import { TableCell, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

type ColumnKind = 'badge' | 'sm' | 'md' | 'lg' | 'actions';

const widthByKind: Record<ColumnKind, string> = {
  badge: 'h-5 w-10 rounded-full',
  sm: 'h-4 w-16',
  md: 'h-4 w-28',
  lg: 'h-4 w-40',
  actions: '',
};

// 1 dòng Table dạng skeleton - dùng khi đang tải dữ liệu, giữ đúng hình dạng bảng thật
export function TableRowSkeleton({ columns }: { columns: ColumnKind[] }) {
  return (
    <TableRow>
      {columns.map((kind, i) =>
        kind === 'actions' ? (
          <TableCell key={i} className="text-right">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </TableCell>
        ) : (
          <TableCell key={i}>
            <Skeleton className={widthByKind[kind]} />
          </TableCell>
        ),
      )}
    </TableRow>
  );
}
