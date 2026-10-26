// Bộ màu pastel dùng chung cho toàn site - khoá cố định để UI nhất quán,
// không trộn lẫn nhiều palette khác nhau giữa các trang.

// Badge hiển thị ID (#1, #2, ...) - dùng xám trung tính trên mọi bảng
export const idBadgeClass = 'border-slate-200 bg-slate-100 text-slate-600';

// Badge số lượng cạnh tiêu đề trang (ví dụ "Phòng ban (3)")
export const countBadgeClass = 'border-sky-200 bg-sky-50 text-sky-700';

// Trạng thái Nhân viên
export const employeeStatusClass: Record<'active' | 'inactive', string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  inactive: 'border-slate-200 bg-slate-100 text-slate-500',
};

// Trạng thái Đơn nghỉ phép
export const timeOffStatusClass: Record<'pending' | 'approved' | 'rejected', string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
};

// Class hover dùng chung cho nút Sửa / Xoá trên mọi bảng và Card
export const actionHoverClass = {
  edit: 'hover:bg-sky-50 hover:text-sky-600',
  delete: 'hover:bg-rose-50 hover:text-rose-600',
};

// Nút hành động chính (Thêm phòng ban / Thêm nhân viên / Tạo đơn) - dùng chung màu accent xanh sky
export const primaryButtonClass = 'bg-sky-600 text-white hover:bg-sky-700';
