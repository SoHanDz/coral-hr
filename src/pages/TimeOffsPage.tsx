import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CardSkeleton } from '@/components/common/CardSkeleton';
import { DataPagination } from '@/components/common/DataPagination';
import { TableRowSkeleton } from '@/components/common/TableRowSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  actionHoverClass,
  countBadgeClass,
  idBadgeClass,
  primaryButtonClass,
  timeOffStatusClass,
} from '@/lib/badge-styles';
import { cn } from '@/lib/utils';
import {
  employeesApi,
  timeOffsApi,
  type Employee,
  type TimeOff,
  type TimeOffStatus,
} from '@/services/api';

const emptyForm = {
  employeeId: '' as number | '',
  fromDate: '',
  toDate: '',
  reason: '',
  status: 'pending' as TimeOffStatus,
};

const statusLabel: Record<TimeOffStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

const PAGE_SIZE = 5;
const ALL = 'all';

// Trang quản lý Đơn xin nghỉ phép: danh sách (Table ở desktop, Card ở mobile) + form Thêm/Sửa trong Dialog
export default function TimeOffsPage() {
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TimeOff | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  const loadData = () => {
    setLoading(true);
    Promise.all([timeOffsApi.getAll(), employeesApi.getAll()])
      .then(([offs, emp]) => {
        setTimeOffs(offs);
        setEmployees(emp);
      })
      .catch(() => toast.error('Không tải được danh sách đơn nghỉ phép'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lọc theo từ khoá tìm kiếm và trạng thái đơn nghỉ phép
  const filteredTimeOffs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return timeOffs.filter((t) => {
      const matchesKeyword =
        !keyword ||
        t.employee?.fullName.toLowerCase().includes(keyword) ||
        (t.reason ?? '').toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === ALL || t.status === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [timeOffs, search, statusFilter]);

  // Reset về trang 1 mỗi khi điều kiện lọc thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTimeOffs.length / PAGE_SIZE));
  const pagedTimeOffs = filteredTimeOffs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // Số dòng trống cần chèn thêm để mọi trang luôn cao bằng nhau - tránh pagination bị nhảy vị trí
  const fillerCount = pagedTimeOffs.length > 0 ? PAGE_SIZE - pagedTimeOffs.length : 0;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (timeOff: TimeOff) => {
    setEditing(timeOff);
    setForm({
      employeeId: timeOff.employeeId,
      fromDate: timeOff.fromDate,
      toDate: timeOff.toDate,
      reason: timeOff.reason ?? '',
      status: timeOff.status,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const payload = { ...form, employeeId: Number(form.employeeId) };
    try {
      if (editing) {
        await timeOffsApi.update(editing.id, payload);
        toast.success('Cập nhật đơn nghỉ phép thành công');
      } else {
        await timeOffsApi.create(payload);
        toast.success('Tạo đơn nghỉ phép thành công');
      }
      setOpen(false);
      loadData();
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await timeOffsApi.remove(id);
      toast.success('Đã xoá đơn nghỉ phép');
      loadData();
    } catch {
      toast.error('Không thể xoá đơn nghỉ phép này');
    }
  };

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Đơn xin nghỉ phép</h1>
            <Badge variant="outline" className={countBadgeClass}>
              {timeOffs.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Theo dõi và xử lý đơn xin nghỉ phép.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo nhân viên, lý do..."
              className="w-full pl-8 sm:w-64"
            />
          </div>
          <Button onClick={openCreate} className={primaryButtonClass}>
            <Plus className="mr-2 h-4 w-4" /> Tạo đơn
          </Button>
        </div>
      </div>

      {/* Bộ lọc: trạng thái đơn nghỉ phép */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: dạng Table */}
      <div className="hidden rounded-md border bg-background md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Từ ngày</TableHead>
              <TableHead>Đến ngày</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRowSkeleton
                  key={`skeleton-${i}`}
                  columns={['badge', 'md', 'sm', 'sm', 'lg', 'badge', 'actions']}
                />
              ))}
            {!loading && pagedTimeOffs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Không tìm thấy đơn nghỉ phép nào.
                </TableCell>
              </TableRow>
            )}
            {pagedTimeOffs.map((timeOff) => (
              <TableRow key={timeOff.id}>
                <TableCell>
                  <Badge variant="outline" className={idBadgeClass}>
                    #{timeOff.id}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{timeOff.employee?.fullName}</TableCell>
                <TableCell>{timeOff.fromDate}</TableCell>
                <TableCell>{timeOff.toDate}</TableCell>
                <TableCell className="text-muted-foreground">{timeOff.reason}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={timeOffStatusClass[timeOff.status]}>
                    {statusLabel[timeOff.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={actionHoverClass.edit}
                    onClick={() => openEdit(timeOff)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={actionHoverClass.delete}
                    onClick={() => handleDelete(timeOff.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {Array.from({ length: fillerCount }).map((_, i) => (
              <TableRow key={`filler-${i}`} aria-hidden="true" className="invisible">
                <TableCell colSpan={7}>&nbsp;</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: dạng danh sách Card */}
      <div className="block space-y-3 md:hidden" style={{ minHeight: pagedTimeOffs.length > 0 ? PAGE_SIZE * 150 : undefined }}>
        {loading &&
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <CardSkeleton key={`skeleton-${i}`} withTopRightBadge />
          ))}
        {!loading && pagedTimeOffs.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Không tìm thấy đơn nghỉ phép nào.</p>
        )}
        {pagedTimeOffs.map((timeOff) => (
          <Card key={timeOff.id} className="border-slate-200">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="outline" className={cn('mb-1', idBadgeClass)}>
                    #{timeOff.id}
                  </Badge>
                  <p className="font-bold leading-tight">{timeOff.employee?.fullName}</p>
                  <p className="text-sm text-slate-500">
                    {timeOff.fromDate} &rarr; {timeOff.toDate}
                  </p>
                </div>
                <Badge variant="outline" className={timeOffStatusClass[timeOff.status]}>
                  {statusLabel[timeOff.status]}
                </Badge>
              </div>
              {timeOff.reason && <p className="text-sm text-slate-500">{timeOff.reason}</p>}
              <div className="flex justify-end gap-2 border-t pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={actionHoverClass.edit}
                  onClick={() => openEdit(timeOff)}
                >
                  <Pencil className="mr-1 h-4 w-4" /> Sửa
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={actionHoverClass.delete}
                  onClick={() => handleDelete(timeOff.id)}
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Xoá
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Sửa đơn nghỉ phép' : 'Tạo đơn nghỉ phép'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nhân viên</Label>
              <Select
                value={form.employeeId === '' ? undefined : String(form.employeeId)}
                onValueChange={(value) => setForm({ ...form, employeeId: Number(value) })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employee.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromDate">Từ ngày</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={form.fromDate}
                  onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toDate">Đến ngày</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={form.toDate}
                  onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Lý do</Label>
              <Textarea
                id="reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm({ ...form, status: value as TimeOffStatus })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
