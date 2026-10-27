import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { tokenStore } from './tokenStore';

// Base URL của Backend NestJS - set VITE_API_URL khi deploy (vd: trên Vercel), mặc định chạy local
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // Bắt buộc để browser gửi kèm cookie refreshToken (httpOnly) cho các request sang backend
  withCredentials: true,
});

// Gắn access token vào header Authorization cho mọi request
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

// Khi access token hết hạn (401), tự gọi /auth/refresh 1 lần rồi lặp lại request gốc.
// Nếu refresh cũng thất bại (refresh token hết hạn/không hợp lệ) -> coi như đã đăng xuất.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const res = await axios.post<{ accessToken: string }>(
    `${API_BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true },
  );
  tokenStore.set(res.data.accessToken);
  return res.data.accessToken;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthRoute = originalRequest?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retried && !isAuthRoute) {
      originalRequest._retried = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newToken = await refreshPromise;
        originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
        return api(originalRequest);
      } catch {
        tokenStore.notifyAuthFailure();
      }
    }

    return Promise.reject(error);
  },
);

// ===== Auth =====
export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api
      .post<{ accessToken: string; user: AuthUser }>('/auth/login', { email, password })
      .then((res) => res.data),
  // Gọi lúc app khởi động để lấy lại access token từ refresh token (cookie) - không ném lỗi ra ngoài
  refresh: () =>
    api.post<{ accessToken: string; user: AuthUser }>('/auth/refresh', {}).then((res) => res.data),
  logout: () => api.post('/auth/logout', {}).then((res) => res.data),
  me: () => api.get<AuthUser>('/auth/me').then((res) => res.data),
};

// ===== Kiểu dữ liệu dùng chung với Backend =====

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

// ===== Departments =====
export const departmentsApi = {
  getAll: () => api.get<Department[]>('/departments').then((res) => res.data),
  getOne: (id: number) => api.get<Department>(`/departments/${id}`).then((res) => res.data),
  create: (data: Partial<Department>) =>
    api.post<Department>('/departments', data).then((res) => res.data),
  update: (id: number, data: Partial<Department>) =>
    api.patch<Department>(`/departments/${id}`, data).then((res) => res.data),
  remove: (id: number) => api.delete(`/departments/${id}`).then((res) => res.data),
};

// ===== Employees =====
export const employeesApi = {
  getAll: () => api.get<Employee[]>('/employees').then((res) => res.data),
  getOne: (id: number) => api.get<Employee>(`/employees/${id}`).then((res) => res.data),
  create: (data: Partial<Employee>) =>
    api.post<Employee>('/employees', data).then((res) => res.data),
  update: (id: number, data: Partial<Employee>) =>
    api.patch<Employee>(`/employees/${id}`, data).then((res) => res.data),
  remove: (id: number) => api.delete(`/employees/${id}`).then((res) => res.data),
};

// ===== TimeOffs =====
export const timeOffsApi = {
  getAll: () => api.get<TimeOff[]>('/time-offs').then((res) => res.data),
  getOne: (id: number) => api.get<TimeOff>(`/time-offs/${id}`).then((res) => res.data),
  create: (data: Partial<TimeOff>) =>
    api.post<TimeOff>('/time-offs', data).then((res) => res.data),
  update: (id: number, data: Partial<TimeOff>) =>
    api.patch<TimeOff>(`/time-offs/${id}`, data).then((res) => res.data),
  remove: (id: number) => api.delete(`/time-offs/${id}`).then((res) => res.data),
};
