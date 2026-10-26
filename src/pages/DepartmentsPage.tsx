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
import { actionHoverClass, countBadgeClass, idBadgeClass, primaryButtonClass } from '@/lib/badge-styles';
import { cn } from '@/lib/utils';
import { departmentsApi, type Department } from '@/services/api';

const emptyForm = { name: '', description: '' };
const PAGE_SIZE = 5;

type SortOption = 'name-asc' | 'name-desc' | 'newest';

// Trang quản lý Phòng ban: danh sách (Table ở desktop, Card ở mobile) + form Thêm/Sửa trong Dialog
export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [page, setPage] = useState(1);

  const loadData = () => {
    setLoading(true);
    departmentsApi
      .getAll()
      .then(setDepartments)
      .catch(() => toast.error('Không tải được danh sách phòng ban'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lọc theo tên/mô tả dựa trên ô Search, rồi sắp xếp theo bộ lọc
  const filteredDepartments = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = !keyword
      ? departments
      : departments.filter(
          (d) =>
            d.name.toLowerCase().includes(keyword) ||
            (d.description ?? '').toLowerCase().includes(keyword),
        );

    const sorted = [...filtered];
    if (sort === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name-desc') sorted.sort((a, b) => b.name.localeCompare(a.name));
    else sorted.sort((a, b) => b.id - a.id);
    return sorted;
  }, [departments, search, sort]);

  // Reset về trang 1 mỗi khi điều kiện lọc thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredDepartments.length / PAGE_SIZE));
  const pagedDepartments = filteredDepartments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // Số dòng trống cần chèn thêm để mọi trang luôn cao bằng nhau - tránh pagination bị nhảy vị trí
  const fillerCount = pagedDepartments.length > 0 ? PAGE_SIZE - pagedDepartments.length : 0;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (department: Department) => {
    setEditing(department);
    setForm({ name: department.name, description: department.description ?? '' });
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await departmentsApi.update(editing.id, form);
        toast.success('Cập nhật phòng ban thành công');
      } else {
        await departmentsApi.create(form);
        toast.success('Thêm phòng ban thành công');
      }
      setOpen(false);
      loadData();
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await departmentsApi.remove(id);
      toast.success('Đã xoá phòng ban');
      loadData();
    } catch {
      toast.error('Không thể xoá phòng ban này');
    }
  };

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Phòng ban</h1>
            <Badge variant="outline" className={countBadgeClass}>
              {departments.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Quản lý danh sách phòng ban trong công ty.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm phòng ban..."
              className="w-full pl-8 sm:w-56"
            />
          </div>
          <Button onClick={openCreate} className={primaryButtonClass}>
            <Plus className="mr-2 h-4 w-4" /> Thêm phòng ban
          </Button>
        </div>
      </div>

      {/* Bộ lọc: sắp xếp danh sách phòng ban */}
      <div className="flex items-center gap-2">
        <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sắp xếp theo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="name-asc">Tên A - Z</SelectItem>
            <SelectItem value="name-desc">Tên Z - A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: dạng Table */}
      <div className="hidden rounded-md border bg-background md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Tên phòng ban</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRowSkeleton key={`skeleton-${i}`} columns={['badge', 'md', 'lg', 'actions']} />
              ))}
            {!loading && pagedDepartments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Không tìm thấy phòng ban nào.
                </TableCell>
              </TableRow>
            )}
            {pagedDepartments.map((department) => (
              <TableRow key={department.id}>
                <TableCell>
                  <Badge variant="outline" className={idBadgeClass}>
                    #{department.id}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{department.name}</TableCell>
                <TableCell className="text-muted-foreground">{department.description}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={actionHoverClass.edit}
                    onClick={() => openEdit(department)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={actionHoverClass.delete}
                    onClick={() => handleDelete(department.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {Array.from({ length: fillerCount }).map((_, i) => (
              <TableRow key={`filler-${i}`} aria-hidden="true" className="invisible">
                <TableCell colSpan={4}>&nbsp;</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: dạng danh sách Card */}
      <div className="block space-y-3 md:hidden" style={{ minHeight: pagedDepartments.length > 0 ? PAGE_SIZE * 112 : undefined }}>
        {loading &&
          Array.from({ length: PAGE_SIZE }).map((_, i) => <CardSkeleton key={`skeleton-${i}`} />)}
        {!loading && pagedDepartments.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Không tìm thấy phòng ban nào.</p>
        )}
        {pagedDepartments.map((department) => (
          <Card key={department.id} className="border-slate-200">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="outline" className={cn('mb-1', idBadgeClass)}>
                    #{department.id}
                  </Badge>
                  <p className="font-bold leading-tight">{department.name}</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">{department.description || 'Không có mô tả'}</p>
              <div className="flex justify-end gap-2 border-t pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={actionHoverClass.edit}
                  onClick={() => openEdit(department)}
                >
                  <Pencil className="mr-1 h-4 w-4" /> Sửa
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={actionHoverClass.delete}
                  onClick={() => handleDelete(department.id)}
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
            <DialogTitle>{editing ? 'Sửa phòng ban' : 'Thêm phòng ban'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên phòng ban</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
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
