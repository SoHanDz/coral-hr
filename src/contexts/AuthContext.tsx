import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, type AuthUser } from '@/services/api';
import { tokenStore } from '@/services/tokenStore';

// AuthContext thật - không còn lưu user vào localStorage.
// Cách hoạt động (xem giải thích đầy đủ trong tin nhắn trả lời):
// - accessToken sống ngắn (15p), chỉ giữ trong bộ nhớ (tokenStore), KHÔNG lưu localStorage.
// - refreshToken sống dài (7 ngày), nằm trong cookie httpOnly do backend set, JS không đọc được.
// - Khi app khởi động: gọi /auth/refresh để "đổi" refreshToken (cookie) thành accessToken mới.
// - Khi gọi API mà accessToken hết hạn (401): api.ts tự refresh ngầm rồi gọi lại request.
interface AuthContextValue {
  user: AuthUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  // Thử lấy lại session từ refresh token (cookie) mỗi khi app khởi động / tải lại trang
  useEffect(() => {
    tokenStore.setOnAuthFailure(() => {
      setUser(null);
      setStatus('unauthenticated');
    });

    authApi
      .refresh()
      .then(({ accessToken, user }) => {
        tokenStore.set(accessToken);
        setUser(user);
        setStatus('authenticated');
      })
      .catch(() => {
        tokenStore.set(null);
        setStatus('unauthenticated');
      });

    return () => tokenStore.setOnAuthFailure(null);
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken, user } = await authApi.login(email, password);
    tokenStore.set(accessToken);
    setUser(user);
    setStatus('authenticated');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      tokenStore.set(null);
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  return <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng trong AuthProvider');
  return ctx;
}
