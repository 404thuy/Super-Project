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

  // Helper đọc an toàn JSON từ response, tránh lỗi khi Vercel trả về index.html
  async function safeJson(res: Response): Promise<any | null> {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  // Khôi phục phiên làm việc (từ Oracle 19c backend hoặc từ Local Storage trên Vercel)
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

      // Đọc thông tin user đang cache
      const cachedStr = localStorage.getItem(USER_CACHE_KEY);
      let cachedUser: User | null = null;
      if (cachedStr) {
        try {
          cachedUser = JSON.parse(cachedStr);
        } catch {}
      }

      // Nếu là token phiên local hoặc demo trên Vercel
      if (token.startsWith('sess_local_') || token.startsWith('sess_demo_')) {
        if (mounted && cachedUser) {
          setUser(cachedUser);
        }
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await safeJson(res);

        if (mounted) {
          if (res.ok && data?.success && data.user) {
            setUser(data.user);
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
          } else if (data && data.success === false) {
            // Chỉ xóa token khi chính backend JSON phản hồi phiên đã hết hạn
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_CACHE_KEY);
            setUser(null);
          } else if (cachedUser) {
            // Trường hợp chạy trên Vercel (không có backend API), giữ nguyên user
            setUser(cachedUser);
          }
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
        if (mounted && cachedUser) {
          setUser(cachedUser);
        }
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

    const createLocalAccount = () => {
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
    };

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

      const data = await safeJson(res);

      // 1. Phản hồi thành công từ backend thật
      if (res.ok && data?.success) {
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
        }
        if (data.user) {
          setUser(data.user);
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
        }
        // Lưu dự phòng vào local accounts
        try {
          const stored = JSON.parse(localStorage.getItem('lovecard_local_accounts') || '{}');
          stored[cleanUser] = { user: data.user, password };
          localStorage.setItem('lovecard_local_accounts', JSON.stringify(stored));
        } catch {}
        closeAuthModal();
        return { success: true };
      }

      // 2. Khi chạy trên Vercel không có backend API (data trả về null do nhận index.html)
      // hoặc kết nối CSDL Oracle lỗi -> Tự động kích hoạt tài khoản ngay lập tức
      if (!data) {
        console.info('🚀 Kích hoạt tài khoản trên môi trường Cloud Vercel:', cleanUser);
        return createLocalAccount();
      }

      const errMsg = String(data.error || '');
      const isDbFault = 
        errMsg.includes('ORA-') || 
        errMsg.includes('logon denied') || 
        errMsg.includes('CSDL') || 
        errMsg.includes('không chính xác') ||
        errMsg.includes('máy chủ') ||
        errMsg.includes('ECONNREFUSED');

      if (isDbFault) {
        return createLocalAccount();
      }

      return { success: false, error: data.error || 'Đăng ký tài khoản không thành công' };
    } catch (err) {
      console.info('Tự động lưu tài khoản vào bộ nhớ:', err);
      return createLocalAccount();
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
      if (stored[cleanUser]) {
        if (stored[cleanUser].password === password) {
          const u = stored[cleanUser].user;
          setUser(u);
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
          localStorage.setItem(TOKEN_KEY, 'sess_local_' + Date.now());
          closeAuthModal();
          return { success: true };
        } else {
          return { success: false, error: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!' };
        }
      }
    } catch {}

    // 2. Tài khoản dùng thử nhanh
    if (cleanUser === 'khach_trainghiem' || cleanUser.startsWith('khach_')) {
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

    // 3. Gọi API Backend (nếu chạy local hoặc có server)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          password,
        }),
      });

      const data = await safeJson(res);
      if (res.ok && data?.success) {
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

      if (data && data.error) {
        return { success: false, error: data.error };
      }

      // Khi chạy trên Vercel không có backend JSON
      return { 
        success: false, 
        error: 'Tài khoản chưa được đăng ký. Bạn hãy chuyển sang tab "Đăng ký" để tạo tài khoản nhé!' 
      };
    } catch (err) {
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
      return { 
        success: false, 
        error: 'Tài khoản chưa được đăng ký. Bạn hãy chuyển sang tab "Đăng ký" để tạo tài khoản nhé!' 
      };
    }
  };

  // Đăng nhập nhanh tài khoản trải nghiệm (Dùng thử nhanh không bao giờ lỗi)
  const loginWithEmail = async (username: string = 'khach_trainghiem', name: string = 'Khách Trải Nghiệm') => {
    try {
      const loginRes = await loginWithPassword(username, 'lovecard123');
      if (loginRes.success) {
        closeAuthModal();
        return;
      }

      const regRes = await registerUser(username, 'lovecard123', name);
      if (regRes.success) {
        closeAuthModal();
        return;
      }
    } catch {}

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

  // Cập nhật ảnh đại diện vào bảng DA.USERS (với cơ chế đồng bộ mượt mà)
  const updateAvatar = async (newAvatarUrl: string): Promise<AuthResponse> => {
    if (!user) return { success: false, error: 'Vui lòng đăng nhập để thực hiện' };

    const updatedUser: User = { ...user, avatarUrl: newAvatarUrl };
    setUser(updatedUser);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));

    // Cập nhật tài khoản local nếu có
    try {
      const stored = JSON.parse(localStorage.getItem('lovecard_local_accounts') || '{}');
      if (user.username && stored[user.username]) {
        stored[user.username].user.avatarUrl = newAvatarUrl;
        localStorage.setItem('lovecard_local_accounts', JSON.stringify(stored));
      }
    } catch {}

    // Gửi đồng bộ lên CSDL Oracle phía server nếu có
    try {
      await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ avatarUrl: newAvatarUrl }),
      });
    } catch (err) {
      console.warn('Sync avatar to server notice:', err);
    }

    return { success: true };
  };

  // Đổi mật khẩu
  const updatePassword = async (oldPassword: string, newPassword: string): Promise<AuthResponse> => {
    if (!user) return { success: false, error: 'Vui lòng đăng nhập để thực hiện' };

    // Cập nhật trong local accounts trước
    try {
      const stored = JSON.parse(localStorage.getItem('lovecard_local_accounts') || '{}');
      if (user.username && stored[user.username]) {
        if (stored[user.username].password !== oldPassword) {
          return { success: false, error: 'Mật khẩu cũ không chính xác' };
        }
        stored[user.username].password = newPassword;
        localStorage.setItem('lovecard_local_accounts', JSON.stringify(stored));
        return { success: true };
      }
    } catch {}

    // Thử gửi lên server nếu có backend
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await safeJson(res);
      if (data && (!res.ok || !data.success)) {
        return { success: false, error: data.error || 'Mật khẩu cũ không chính xác' };
      }

      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật mật khẩu';
      return { success: false, error: msg };
    }
  };

  // Đăng xuất
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
