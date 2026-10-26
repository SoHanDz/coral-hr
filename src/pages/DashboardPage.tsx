import { Building2, CalendarClock, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { idBadgeClass, timeOffStatusClass } from '@/lib/badge-styles';
import {
  departmentsApi,
  employeesApi,
  timeOffsApi,
  type Department,
  type Employee,
  type TimeOff,
  type TimeOffStatus,
} from '@/services/api';

const statusLabel: Record<TimeOffStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

// Trang Tổng quan - số liệu nhanh, phân bổ nhân viên theo phòng ban, đơn nghỉ phép gần đây
export default function DashboardPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([departmentsApi.getAll(), employeesApi.getAll(), timeOffsApi.getAll()])
      .then(([dep, emp, offs]) => {
        setDepartments(dep);
        setEmployees(emp);
        setTimeOffs(offs);
      })
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = timeOffs.filter((t) => t.status === 'pending').length;

  const stats = [
    {
      label: 'Phòng ban',
      value: departments.length,
      icon: Building2,
      iconBg: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Nhân viên',
      value: employees.length,
      icon: Users,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Đơn chờ duyệt',
      value: pendingCount,
      icon: CalendarClock,
      iconBg: 'bg-amber-50 text-amber-600',
    },
  ];

  // Số nhân viên theo từng phòng ban, sắp xếp giảm dần
  const departmentBreakdown = departments
    .map((department) => ({
      department,
      count: employees.filter((e) => e.departmentId === department.id).length,
    }))
    .sort((a, b) => b.count - a.count);
  const maxDepartmentCount = Math.max(1, ...departmentBreakdown.map((d) => d.count));

  // 5 đơn nghỉ phép mới nhất (ID lớn nhất = tạo gần đây nhất)
  const recentTimeOffs = [...timeOffs].sort((a, b) => b.id - a.id).slice(0, 5);

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">
          Số liệu được gọi trực tiếp từ Backend NestJS.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, iconBg }) => (
          <Card key={label} size="sm" className="border-slate-200">
            <CardContent className="flex items-center justify-between gap-3">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {loading ? (
                  <Skeleton className="h-7 w-10" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight">{value}</p>
                )}
              </div>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Nhân viên theo phòng ban</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            {!loading && departmentBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có phòng ban nào.</p>
            )}
            {!loading &&
              departmentBreakdown.map(({ department, count }) => (
              <div key={department.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{department.name}</span>
                  <span className="text-muted-foreground">{count} người</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${(count / maxDepartmentCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Đơn nghỉ phép gần đây</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-10 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            {!loading && recentTimeOffs.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có đơn nghỉ phép nào.</p>
            )}
            {!loading &&
              recentTimeOffs.map((timeOff) => (
              <div key={timeOff.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{timeOff.employee?.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {timeOff.fromDate} &rarr; {timeOff.toDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={idBadgeClass}>
                    #{timeOff.id}
                  </Badge>
                  <Badge variant="outline" className={timeOffStatusClass[timeOff.status]}>
                    {statusLabel[timeOff.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
