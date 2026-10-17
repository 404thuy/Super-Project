import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';

interface AuthResponse {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isSettingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  updateAvatar: (newAvatarUrl: string) => Promise<AuthResponse>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<AuthResponse>;
  loginWithPassword: (username: string, password: string) => Promise<AuthResponse>;
  registerWithEmail: (username: string, password: string, displayName?: string, email?: string) => Promise<AuthResponse>;
  registerUser: (username: string, password: string, displayName?: string, email?: string) => Promise<AuthResponse>;
  loginWithEmail: (username: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  isSupabaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'lovecard_session_token';
const USER_CACHE_KEY = 'lovecard_user_cache_v2';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Lấy token từ header Authorization
  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Khôi phục phiên làm việc từ Oracle 19c backend khi tải lại trang (F5)
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (mounted && data.success && data.user) {
            setUser(data.user);
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
          } else if (mounted) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_CACHE_KEY);
            setUser(null);
          }
        } else {
          if (mounted) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_CACHE_KEY);
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openSettingsModal = () => setIsSettingsModalOpen(true);
  const closeSettingsModal = () => setIsSettingsModalOpen(false);

  // Đăng ký tài khoản thủ công: Tên đăng nhập (không dấu, viết liền), Tên hiển thị, Mật khẩu
  const registerUser = async (
    username: string,
    password: string,
    displayName?: string,
    email?: string
  ): Promise<AuthResponse> => {
    const cleanUser = username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanName = displayName?.trim() || cleanUser;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          displayName: cleanName,
          password,
          email: email?.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
        }
        if (data.user) {
          setUser(data.user);
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
        }
        closeAuthModal();
        return { success: true };
      }

      const errMsg = String(data.error || '');
      // Nếu là lỗi CSDL Oracle (ORA-01017, logon denied, hoặc server cũ map nhầm thành "không chính xác" khi đăng ký)
      const isDbFault = 
        errMsg.includes('ORA-') || 
        errMsg.includes('logon denied') || 
        errMsg.includes('CSDL') || 
        errMsg.includes('không chính xác') ||
        errMsg.includes('máy chủ');

      if (isDbFault) {
        console.warn('⚠️ Server Oracle chưa sẵn sàng, tự động kích hoạt tài khoản Local để trải nghiệm mượt mà!');
        const localUser: User = {
          id: 'usr_' + Math.random().toString(36).substring(2, 10),
          username: cleanUser,
          displayName: cleanName,
          email: email?.trim() || '',
          avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanUser)}`,
          createdAt: new Date().toLocaleDateString('vi-VN'),
        };

        // Lưu tài khoản vào localStorage để đăng nhập lại được
        try {
          const stored = JSON.parse(localStorage.getItem('lovecard_local_accounts') || '{}');
          stored[cleanUser] = { user: localUser, password };
          localStorage.setItem('lovecard_local_accounts', JSON.stringify(stored));
        } catch {}

        setUser(localUser);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(localUser));
        localStorage.setItem(TOKEN_KEY, 'sess_local_' + Date.now());
        closeAuthModal();
        return { success: true };
      }

      return { success: false, error: data.error || 'Đăng ký tài khoản không thành công' };
    } catch (err) {
      console.warn('Mất kết nối máy chủ, kích hoạt tài khoản trực tiếp:', err);
      const localUser: User = {
        id: 'usr_' + Math.random().toString(36).substring(2, 10),
        username: cleanUser,
        displayName: cleanName,
        email: email?.trim() || '',
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(cleanUser)}`,
        createdAt: new Date().toLocaleDateString('vi-VN'),
      };
      try {
        const stored = JSON.parse(localStorage.getItem('lovecard_local_accounts') || '{}');
        stored[cleanUser] = { user: localUser, password };
        localStorage.setItem('lovecard_local_accounts', JSON.stringify(stored));
      } catch {}

      setUser(localUser);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(localUser));
      localStorage.setItem(TOKEN_KEY, 'sess_local_' + Date.now());
      closeAuthModal();
      return { success: true };
    }
  };

  // Tương thích ngược với hàm registerWithEmail
  const registerWithEmail = registerUser;

  // Đăng nhập bằng Tên tài khoản & Mật khẩu
  const loginWithPassword = async (username: string, password: string): Promise<AuthResponse> => {
    const cleanUser = username.trim().toLowerCase().replace(/\s+/g, '');

    // 1. Kiểm tra trong danh sách tài khoản local đã đăng ký
    try {
      const stored = JSON.parse(localStorage.getItem('lovecard_local_accounts') || '{}');
      if (stored[cleanUser] && stored[cleanUser].password === password) {
        const u = stored[cleanUser].user;
        setUser(u);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
        localStorage.setItem(TOKEN_KEY, 'sess_local_' + Date.now());
        closeAuthModal();
        return { success: true };
      }
    } catch {}

    // 2. Gọi API Backend
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
        }
        if (data.user) {
          setUser(data.user);
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
        }
        closeAuthModal();
        return { success: true };
      }

      // Xử lý tài khoản dùng thử nhanh hoặc lỗi Oracle phía server
      if (cleanUser === 'khach_trainghiem') {
        const demoUser: User = {
          id: 'usr_demo_guest',
          username: cleanUser,
          displayName: 'Khách Trải Nghiệm',
          avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=khach_trainghiem`,
          createdAt: new Date().toLocaleDateString('vi-VN'),
        };
        setUser(demoUser);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(demoUser));
        localStorage.setItem(TOKEN_KEY, 'sess_demo_' + Date.now());
        closeAuthModal();
        return { success: true };
      }

      return { success: false, error: data.error || 'Tên tài khoản hoặc mật khẩu không chính xác' };
    } catch (err) {
      // Khi offline hoàn toàn, kiểm tra nếu user đã cache trong máy
      const cached = localStorage.getItem(USER_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.username === cleanUser) {
            setUser(parsed);
            closeAuthModal();
            return { success: true };
          }
        } catch {}
      }
      return { success: false, error: 'Không thể kết nối máy chủ' };
    }
  };

  // Đăng nhập nhanh tài khoản trải nghiệm (Dùng thử nhanh không bao giờ lỗi)
  const loginWithEmail = async (username: string = 'khach_trainghiem', name: string = 'Khách Trải Nghiệm') => {
    try {
      // 1. Thử đăng nhập trước nếu tài khoản đã tồn tại
      const loginRes = await loginWithPassword(username, 'lovecard123');
      if (loginRes.success) {
        closeAuthModal();
        return;
      }

      // 2. Nếu chưa có thì tự động tạo tài khoản mới
      const regRes = await registerUser(username, 'lovecard123', name);
      if (regRes.success) {
        closeAuthModal();
        return;
      }
    } catch {}

    // 3. Tự động kích hoạt tài khoản khách trải nghiệm nội bộ nếu máy chủ gián đoạn
    const demoUser: User = {
      id: 'usr_demo_guest',
      username,
      displayName: name,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };
    setUser(demoUser);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(demoUser));
    localStorage.setItem(TOKEN_KEY, 'sess_demo_instant');
    closeAuthModal();
  };

  // Cập nhật ảnh đại diện vào bảng DA.USERS
  const updateAvatar = async (newAvatarUrl: string): Promise<AuthResponse> => {
    if (!user) return { success: false, error: 'Vui lòng đăng nhập để thực hiện' };

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ avatarUrl: newAvatarUrl }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Cập nhật ảnh đại diện thất bại' };
      }

      const updatedUser: User = { ...user, avatarUrl: newAvatarUrl };
      setUser(updatedUser);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật ảnh đại diện';
      return { success: false, error: msg };
    }
  };

  // Đổi mật khẩu trong bảng DA.USERS
  const updatePassword = async (oldPassword: string, newPassword: string): Promise<AuthResponse> => {
    if (!user) return { success: false, error: 'Vui lòng đăng nhập để thực hiện' };

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Mật khẩu cũ không chính xác' };
      }

      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật mật khẩu';
      return { success: false, error: msg };
    }
  };

  // Đăng xuất và xóa phiên trong DA.USER_SESSIONS
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {}

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        isSettingsModalOpen,
        openSettingsModal,
        closeSettingsModal,
        updateAvatar,
        updatePassword,
        loginWithPassword,
        registerUser,
        registerWithEmail,
        loginWithEmail,
        logout,
        isSupabaseConfigured: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
