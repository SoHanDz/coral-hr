import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CardSkeleton } from '@/components/common/CardSkeleton';
import { DataPagination } from '@/components/common/DataPagination';
import { TableRowSkeleton } from '@/components/common/TableRowSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  actionHoverClass,
  countBadgeClass,
  employeeStatusClass,
  idBadgeClass,
  primaryButtonClass,
} from '@/lib/badge-styles';
import { cn } from '@/lib/utils';
import { departmentsApi, employeesApi, type Department, type Employee, type EmployeeStatus } from '@/services/api';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  position: '',
  status: 'active' as EmployeeStatus,
  departmentId: '' as number | '',
};

const statusLabel: Record<EmployeeStatus, string> = {
  active: 'Đang làm việc',
  inactive: 'Ngừng làm việc',
};

const PAGE_SIZE = 5;
const ALL = 'all';

// Trang quản lý Nhân viên: danh sách (Table ở desktop, Card ở mobile) + form Thêm/Sửa trong Sheet
export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [departmentFilter, setDepartmentFilter] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  const loadData = () => {
    setLoading(true);
    Promise.all([employeesApi.getAll(), departmentsApi.getAll()])
      .then(([emp, dep]) => {
        setEmployees(emp);
        setDepartments(dep);
      })
      .catch(() => toast.error('Không tải được danh sách nhân viên'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lọc theo từ khoá tìm kiếm, trạng thái và phòng ban
  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return employees.filter((e) => {
      const matchesKeyword =
        !keyword ||
        e.fullName.toLowerCase().includes(keyword) ||
        e.email.toLowerCase().includes(keyword) ||
        (e.position ?? '').toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === ALL || e.status === statusFilter;
      const matchesDepartment =
        departmentFilter === ALL || String(e.departmentId ?? '') === departmentFilter;
      return matchesKeyword && matchesStatus && matchesDepartment;
    });
  }, [employees, search, statusFilter, departmentFilter]);

  // Reset về trang 1 mỗi khi điều kiện lọc thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, departmentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
  const pagedEmployees = filteredEmployees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // Số dòng trống cần chèn thêm để mọi trang luôn cao bằng nhau - tránh pagination bị nhảy vị trí
  const fillerCount = pagedEmployees.length > 0 ? PAGE_SIZE - pagedEmployees.length : 0;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setForm({
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone ?? '',
      position: employee.position ?? '',
      status: employee.status,
      departmentId: employee.departmentId ?? '',
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      departmentId: form.departmentId === '' ? null : Number(form.departmentId),
    };
    try {
      if (editing) {
        await employeesApi.update(editing.id, payload);
        toast.success('Cập nhật nhân viên thành công');
      } else {
        await employeesApi.create(payload);
        toast.success('Thêm nhân viên thành công');
      }
      setOpen(false);
      loadData();
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await employeesApi.remove(id);
      toast.success('Đã xoá nhân viên');
      loadData();
    } catch {
      toast.error('Không thể xoá nhân viên này');
    }
  };

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Nhân viên</h1>
            <Badge variant="outline" className={countBadgeClass}>
              {employees.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Quản lý danh sách nhân viên và phòng ban.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nhân viên..."
              className="w-full pl-8 sm:w-56"
            />
          </div>
          <Button onClick={openCreate} className={primaryButtonClass}>
            <Plus className="mr-2 h-4 w-4" /> Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Bộ lọc: trạng thái và phòng ban */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Đang làm việc</SelectItem>
            <SelectItem value="inactive">Ngừng làm việc</SelectItem>
          </SelectContent>
        </Select>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Phòng ban" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả phòng ban</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department.id} value={String(department.id)}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: dạng Table */}
      <div className="hidden rounded-md border bg-background md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Chức vụ</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRowSkeleton
                  key={`skeleton-${i}`}
                  columns={['badge', 'md', 'lg', 'sm', 'sm', 'badge', 'actions']}
                />
              ))}
            {!loading && pagedEmployees.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Không tìm thấy nhân viên nào.
                </TableCell>
              </TableRow>
            )}
            {pagedEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <Badge variant="outline" className={idBadgeClass}>
                    #{employee.id}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{employee.fullName}</TableCell>
                <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.department?.name ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={employeeStatusClass[employee.status]}>
                    {statusLabel[employee.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={actionHoverClass.edit}
                    onClick={() => openEdit(employee)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={actionHoverClass.delete}
                    onClick={() => handleDelete(employee.id)}
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
      <div className="block space-y-3 md:hidden" style={{ minHeight: pagedEmployees.length > 0 ? PAGE_SIZE * 160 : undefined }}>
        {loading &&
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <CardSkeleton key={`skeleton-${i}`} withTopRightBadge />
          ))}
        {!loading && pagedEmployees.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Không tìm thấy nhân viên nào.</p>
        )}
        {pagedEmployees.map((employee) => (
          <Card key={employee.id} className="border-slate-200">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="outline" className={cn('mb-1', idBadgeClass)}>
                    #{employee.id}
                  </Badge>
                  <p className="font-bold leading-tight">{employee.fullName}</p>
                  <p className="text-sm text-slate-500">{employee.position || 'Chưa có chức vụ'}</p>
                </div>
                <Badge variant="outline" className={employeeStatusClass[employee.status]}>
                  {statusLabel[employee.status]}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-slate-500">
                <p>{employee.email}</p>
                <p>{employee.department?.name ?? 'Chưa có phòng ban'}</p>
              </div>
              <div className="flex justify-end gap-2 border-t pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={actionHoverClass.edit}
                  onClick={() => openEdit(employee)}
                >
                  <Pencil className="mr-1 h-4 w-4" /> Sửa
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={actionHoverClass.delete}
                  onClick={() => handleDelete(employee.id)}
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Xoá
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="space-y-4 overflow-y-auto px-6 py-4">
          <SheetHeader>
            <SheetTitle>{editing ? 'Sửa nhân viên' : 'Thêm nhân viên'}</SheetTitle>
          </SheetHeader>

          <div className="space-y-2">
            <Label htmlFor="fullName">Họ tên</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Chức vụ</Label>
            <Input
              id="position"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Phòng ban</Label>
            <Select
              value={form.departmentId === '' ? undefined : String(form.departmentId)}
              onValueChange={(value) => setForm({ ...form, departmentId: Number(value) })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn phòng ban" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={String(department.id)}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm({ ...form, status: value as EmployeeStatus })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang làm việc</SelectItem>
                <SelectItem value="inactive">Ngừng làm việc</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SheetFooter>
            <Button onClick={handleSubmit}>Lưu</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
