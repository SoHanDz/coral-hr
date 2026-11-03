import type { Department, Employee, TimeOff, EmployeeStatus, TimeOffStatus } from './api';

// Dữ liệu giả sinh ra bằng bộ random có seed -> mỗi lần load đều giống nhau (deterministic).
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261103);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const DEPARTMENTS: ReadonlyArray<readonly [string, string, readonly string[]]> = [
  ['Phòng Nhân sự', 'Quản lý tuyển dụng, chính sách nhân sự', ['HR Executive', 'HR Manager', 'Recruiter', 'C&B Specialist', 'Training Coordinator']],
  ['Phòng Kỹ thuật', 'Phát triển và vận hành hệ thống phần mềm', ['Backend Developer', 'Frontend Developer', 'Fullstack Developer', 'DevOps Engineer', 'Tech Lead', 'Mobile Developer']],
  ['Phòng Kinh doanh', 'Phát triển khách hàng và doanh thu', ['Sales Executive', 'Sales Manager', 'Account Manager', 'Business Developer']],
  ['Phòng Marketing', 'Xây dựng thương hiệu và truyền thông', ['Marketing Executive', 'Content Creator', 'SEO Specialist', 'Brand Manager', 'Social Media Manager']],
  ['Phòng Kế toán', 'Quản lý tài chính, thuế và báo cáo', ['Kế toán viên', 'Kế toán trưởng', 'Kế toán thuế', 'Thủ quỹ']],
  ['Phòng Thiết kế', 'Thiết kế UI/UX và nhận diện thương hiệu', ['UI/UX Designer', 'Graphic Designer', 'Product Designer', 'Motion Designer']],
  ['Phòng Chăm sóc khách hàng', 'Hỗ trợ và duy trì quan hệ khách hàng', ['CS Executive', 'CS Lead', 'Support Specialist', 'Customer Success Manager']],
  ['Phòng Pháp chế', 'Tư vấn pháp lý và tuân thủ quy định', ['Chuyên viên pháp chế', 'Luật sư nội bộ', 'Compliance Officer']],
  ['Phòng Vận hành', 'Điều phối quy trình và hậu cần', ['Operations Executive', 'Operations Manager', 'Logistics Coordinator', 'Admin']],
  ['Phòng Sản phẩm', 'Định hướng và quản lý vòng đời sản phẩm', ['Product Manager', 'Product Owner', 'Business Analyst', 'Scrum Master']],
  ['Phòng QA', 'Kiểm thử và đảm bảo chất lượng phần mềm', ['QA Engineer', 'Automation Tester', 'QA Lead', 'Manual Tester']],
  ['Phòng Dữ liệu', 'Phân tích dữ liệu và trí tuệ nhân tạo', ['Data Analyst', 'Data Engineer', 'ML Engineer', 'BI Developer']],
];

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Lâm', 'Mai', 'Trương'];
const DEM_NAM = ['Văn', 'Hữu', 'Đức', 'Minh', 'Quang', 'Thanh', 'Công', 'Xuân', 'Anh', 'Gia', 'Tuấn', 'Quốc'];
const DEM_NU = ['Thị', 'Ngọc', 'Thùy', 'Minh', 'Khánh', 'Thu', 'Hồng', 'Phương', 'Bảo', 'Mỹ', 'Diệu', 'Kim'];
const TEN_NAM = ['An', 'Bình', 'Cường', 'Dũng', 'Hải', 'Hiếu', 'Hùng', 'Khoa', 'Khôi', 'Long', 'Nam', 'Phúc', 'Quân', 'Sơn', 'Tài', 'Thắng', 'Trung', 'Việt', 'Vinh', 'Đạt', 'Huy', 'Kiên', 'Lâm', 'Nghĩa'];
const TEN_NU = ['Anh', 'Châu', 'Dung', 'Hà', 'Hạnh', 'Hoa', 'Hương', 'Lan', 'Linh', 'Mai', 'My', 'Ngân', 'Nhi', 'Oanh', 'Phương', 'Quyên', 'Thảo', 'Trang', 'Uyên', 'Vy', 'Yến', 'Trâm', 'Thư', 'Nga'];

const REASONS = [
  'Nghỉ việc riêng', 'Khám bệnh', 'Nghỉ phép năm', 'Việc gia đình', 'Đưa con đi khám',
  'Về quê thăm gia đình', 'Đám cưới người thân', 'Nghỉ ốm', 'Giải quyết giấy tờ cá nhân',
  'Nghỉ du lịch', 'Chăm sóc người thân ốm', 'Đi học lớp bổ túc', 'Chuyển nhà', 'Nghỉ dưỡng sức',
  'Tham dự lễ tốt nghiệp', 'Việc đột xuất', null,
] as const;

const removeDiacritics = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export interface MockUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  password: string;
}

export interface MockSnapshot {
  users: MockUser[];
  departments: Department[];
  employees: Omit<Employee, 'department'>[];
  timeOffs: Omit<TimeOff, 'employee'>[];
}

export function generateSeed(): MockSnapshot {
  const users: MockUser[] = [
    { id: 1, email: 'admin@coralhr.vn', fullName: 'Quản trị viên', role: 'admin', password: '123456' },
  ];

  const departments: Department[] = DEPARTMENTS.map(([name, description], i) => ({ id: i + 1, name, description }));

  const employees: Omit<Employee, 'department'>[] = [];
  const usedEmails = new Set<string>();
  const TOTAL_EMPLOYEES = 120;

  for (let i = 0; i < TOTAL_EMPLOYEES; i++) {
    const male = rand() < 0.5;
    const ho = pick(HO);
    const dem = pick(male ? DEM_NAM : DEM_NU);
    const ten = pick(male ? TEN_NAM : TEN_NU);
    const fullName = `${ho} ${dem} ${ten}`;

    // Phân bổ nhân viên theo phòng ban (có một số nhân viên chưa có phòng)
    const unassigned = rand() < 0.04;
    const deptIdx = int(0, DEPARTMENTS.length - 1);
    const departmentId = unassigned ? null : deptIdx + 1;
    const position = unassigned ? null : pick(DEPARTMENTS[deptIdx][2]);

    let base = `${removeDiacritics(ten).toLowerCase()}.${removeDiacritics(ho).toLowerCase()}`;
    let email = `${base}@coralhr.vn`;
    let n = 2;
    while (usedEmails.has(email)) email = `${base}${n++}@coralhr.vn`;
    usedEmails.add(email);

    const phone = `0${pick(['90', '91', '93', '94', '96', '97', '98', '86', '88', '89'])}${int(1000000, 9999999)}`;
    const status: EmployeeStatus = rand() < 0.88 ? 'active' : 'inactive';

    employees.push({ id: i + 1, fullName, email, phone: rand() < 0.95 ? phone : null, position, status, departmentId });
  }

  const timeOffs: Omit<TimeOff, 'employee'>[] = [];
  const TOTAL_TIME_OFFS = 180;
  const start = Date.UTC(2026, 7, 1); // 01/08/2026
  const spanDays = 150; // đến cuối tháng 12/2026

  for (let i = 0; i < TOTAL_TIME_OFFS; i++) {
    const emp = pick(employees);
    const from = new Date(start + int(0, spanDays) * 86400000);
    const to = new Date(from.getTime() + int(0, 4) * 86400000);
    const r = rand();
    const status: TimeOffStatus = r < 0.4 ? 'pending' : r < 0.82 ? 'approved' : 'rejected';
    timeOffs.push({
      id: i + 1,
      employeeId: emp.id,
      fromDate: fmtDate(from),
      toDate: fmtDate(to),
      reason: pick(REASONS),
      status,
    });
  }

  return { users, departments, employees, timeOffs };
}
