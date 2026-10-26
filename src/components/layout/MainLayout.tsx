import { Building2, CalendarClock, LayoutDashboard, LogOut, Menu, Users } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/departments', label: 'Phòng ban', icon: Building2 },
  { to: '/employees', label: 'Nhân viên', icon: Users },
  { to: '/time-offs', label: 'Đơn nghỉ phép', icon: CalendarClock },
];

// Nội dung sidebar - dùng chung cho bản cố định (desktop) và Drawer (mobile)
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-600 text-sm font-bold text-white">
          HR
        </div>
        <span className="text-lg font-semibold tracking-tight">CoralHR</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center justify-between rounded-md px-2 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="rounded-md p-2 text-muted-foreground hover:bg-slate-200/70 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Layout chung cho toàn bộ dashboard
// - Desktop (>= md): sidebar cố định bên trái, nền xám nhạt
// - Mobile (< md): header với nút hamburger, mở sidebar dạng Drawer (Sheet)
export function MainLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar cố định - chỉ hiện từ md trở lên */}
      <aside className="hidden w-64 flex-col border-r bg-slate-50 md:flex">
        <SidebarContent />
      </aside>

      {/* Sidebar dạng Drawer cho mobile */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 bg-slate-50 p-0">
          <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
          <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header mobile - chỉ hiện dưới md */}
        <header className="flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-600 text-xs font-bold text-white">
              HR
            </div>
            <span className="font-semibold tracking-tight">CoralHR</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-4 sm:p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
