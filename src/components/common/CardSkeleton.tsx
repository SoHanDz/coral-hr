import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// 1 Card dạng skeleton cho danh sách mobile - giữ đúng hình dạng Card thật
export function CardSkeleton({ withTopRightBadge = false }: { withTopRightBadge?: boolean }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          {withTopRightBadge && <Skeleton className="h-5 w-20 rounded-full" />}
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex justify-end gap-2 border-t pt-2">
          <Skeleton className="h-8 w-14 rounded-md" />
          <Skeleton className="h-8 w-14 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
