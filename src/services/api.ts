import { generateSeed, type MockSnapshot, type MockUser } from './mockData';

// Backend giả (mock) chạy hoàn toàn trong trình duyệt: dữ liệu lưu ở localStorage,
// mọi hàm đều trả Promise với độ trễ nhỏ để giống gọi API thật. Không cần server.

const DB_KEY = 'coralhr:mock-db:v1';
const SESSION_KEY = 'coralhr:mock-session:v1';
const LATENCY_MS = 250;

const delay = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), LATENCY_MS));

const fail = (message: string): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), LATENCY_MS));

let memoryDb: MockSnapshot | null = null;

function loadDb(): MockSnapshot {
  if (memoryDb) return memoryDb;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      memoryDb = JSON.parse(raw) as MockSnapshot;
      return memoryDb;
    }
  } catch {
    // localStorage không dùng được -> rơi về dữ liệu seed trong bộ nhớ
  }
  memoryDb = generateSeed();
  saveDb();
  return memoryDb;
}

function saveDb() {
  try {
    if (memoryDb) localStorage.setItem(DB_KEY, JSON.stringify(memoryDb));
  } catch {
    // bỏ qua: dữ liệu vẫn còn trong bộ nhớ cho phiên hiện tại
  }
}

/** Xoá mọi thay đổi và nạp lại dữ liệu mẫu ban đầu. */
export function resetMockData() {
  memoryDb = generateSeed();
  saveDb();
}

const nextId = (rows: { id: number }[]) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;

function readSessionUser(): MockUser | undefined {
  try {
    const v = localStorage.getItem(SESSION_KEY);
    if (!v) return undefined;
    return loadDb().users.find((u) => u.id === Number(v));
  } catch {
    return undefined;
  }
}

function writeSession(userId: number | null) {
  try {
    if (userId === null) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, String(userId));
  } catch {
    // ignore
  }
}

// ===== Auth =====
export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

const toAuthUser = (u: MockUser): AuthUser => ({ id: u.id, email: u.email, fullName: u.fullName, role: u.role });

export const authApi = {
  login: (email: string, password: string) => {
    const user = loadDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) return fail('Email hoặc mật khẩu không đúng');
    writeSession(user.id);
    return delay({ accessToken: `mock-token-${user.id}`, user: toAuthUser(user) });
  },
  // Gọi lúc app khởi động để khôi phục phiên đăng nhập
  refresh: () => {
    const user = readSessionUser();
    if (!user) return fail('Chưa đăng nhập');
    return delay({ accessToken: `mock-token-${user.id}`, user: toAuthUser(user) });
  },
  logout: () => {
    writeSession(null);
    return delay({ ok: true });
  },
  me: () => {
    const user = readSessionUser();
    return user ? delay(toAuthUser(user)) : fail('Chưa đăng nhập');
  },
};

// ===== Kiểu dữ liệu =====

export type EmployeeStatus = 'active' | 'inactive';
export type TimeOffStatus = 'pending' | 'approved' | 'rejected';

export interface Department {
  id: number;
  name: string;
  description: string | null;
}

export interface Employee {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  position: string | null;
  status: EmployeeStatus;
  departmentId: number | null;
  department: Department | null;
}

export interface TimeOff {
  id: number;
  employeeId: number;
  fromDate: string;
  toDate: string;
  reason: string | null;
  status: TimeOffStatus;
  employee: Employee;
}

// ===== Helpers ghép quan hệ =====
function withDepartment(e: MockSnapshot['employees'][number]): Employee {
  const department = e.departmentId == null ? null : (loadDb().departments.find((d) => d.id === e.departmentId) ?? null);
  return { ...e, department };
}

function withEmployee(t: MockSnapshot['timeOffs'][number]): TimeOff {
  const emp = loadDb().employees.find((e) => e.id === t.employeeId);
  return { ...t, employee: withDepartment(emp!) };
}

// ===== Departments =====
export const departmentsApi = {
  getAll: () => delay([...loadDb().departments].sort((a, b) => a.id - b.id)),
  getOne: (id: number) => {
    const row = loadDb().departments.find((d) => d.id === id);
    return row ? delay(row) : fail('Không tìm thấy phòng ban');
  },
  create: (data: Partial<Department>) => {
    const db = loadDb();
    const row: Department = { id: nextId(db.departments), name: data.name ?? '', description: data.description || null };
    db.departments.push(row);
    saveDb();
    return delay(row);
  },
  update: (id: number, data: Partial<Department>) => {
    const row = loadDb().departments.find((d) => d.id === id);
    if (!row) return fail('Không tìm thấy phòng ban');
    Object.assign(row, data, { id });
    saveDb();
    return delay(row);
  },
  remove: (id: number) => {
    const db = loadDb();
    db.departments = db.departments.filter((d) => d.id !== id);
    // Nhân viên thuộc phòng này trở thành "chưa có phòng ban" (giống ON DELETE SET NULL)
    db.employees.forEach((e) => {
      if (e.departmentId === id) e.departmentId = null;
    });
    saveDb();
    return delay({ ok: true });
  },
};

// ===== Employees =====
export const employeesApi = {
  getAll: () => delay(loadDb().employees.map(withDepartment).sort((a, b) => a.id - b.id)),
  getOne: (id: number) => {
    const row = loadDb().employees.find((e) => e.id === id);
    return row ? delay(withDepartment(row)) : fail('Không tìm thấy nhân viên');
  },
  create: (data: Partial<Employee>) => {
    const db = loadDb();
    if (db.employees.some((e) => e.email === data.email)) return fail('Email đã tồn tại');
    const row: MockSnapshot['employees'][number] = {
      id: nextId(db.employees),
      fullName: data.fullName ?? '',
      email: data.email ?? '',
      phone: data.phone || null,
      position: data.position || null,
      status: data.status ?? 'active',
      departmentId: data.departmentId ?? null,
    };
    db.employees.push(row);
    saveDb();
    return delay(withDepartment(row));
  },
  update: (id: number, data: Partial<Employee>) => {
    const db = loadDb();
    const row = db.employees.find((e) => e.id === id);
    if (!row) return fail('Không tìm thấy nhân viên');
    if (data.email && db.employees.some((e) => e.id !== id && e.email === data.email)) return fail('Email đã tồn tại');
    const { department: _department, ...rest } = data;
    Object.assign(row, rest, { id });
    saveDb();
    return delay(withDepartment(row));
  },
  remove: (id: number) => {
    const db = loadDb();
    db.employees = db.employees.filter((e) => e.id !== id);
    // Xoá kèm các đơn nghỉ phép của nhân viên (giống ON DELETE CASCADE)
    db.timeOffs = db.timeOffs.filter((t) => t.employeeId !== id);
    saveDb();
    return delay({ ok: true });
  },
};

// ===== TimeOffs =====
export const timeOffsApi = {
  getAll: () => delay(loadDb().timeOffs.map(withEmployee).sort((a, b) => a.id - b.id)),
  getOne: (id: number) => {
    const row = loadDb().timeOffs.find((t) => t.id === id);
    return row ? delay(withEmployee(row)) : fail('Không tìm thấy đơn nghỉ phép');
  },
  create: (data: Partial<TimeOff>) => {
    const db = loadDb();
    if (!db.employees.some((e) => e.id === data.employeeId)) return fail('Nhân viên không tồn tại');
    const row: MockSnapshot['timeOffs'][number] = {
      id: nextId(db.timeOffs),
      employeeId: data.employeeId!,
      fromDate: data.fromDate ?? '',
      toDate: data.toDate ?? '',
      reason: data.reason || null,
      status: data.status ?? 'pending',
    };
    db.timeOffs.push(row);
    saveDb();
    return delay(withEmployee(row));
  },
  update: (id: number, data: Partial<TimeOff>) => {
    const row = loadDb().timeOffs.find((t) => t.id === id);
    if (!row) return fail('Không tìm thấy đơn nghỉ phép');
    const { employee: _employee, ...rest } = data;
    Object.assign(row, rest, { id });
    saveDb();
    return delay(withEmployee(row));
  },
  remove: (id: number) => {
    const db = loadDb();
    db.timeOffs = db.timeOffs.filter((t) => t.id !== id);
    saveDb();
    return delay({ ok: true });
  },
};
