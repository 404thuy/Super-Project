import { createClient } from '@supabase/supabase-js';

// Chuẩn hóa URL Supabase (tự động cắt bỏ /rest/v1/ hoặc dấu gạch chéo cuối nếu người dùng lỡ dán kèm)
function normalizeSupabaseUrl(raw: string): string {
  if (!raw) return '';
  let url = raw.trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1\/?$/, '');
  return url;
}

// 1. Đọc từ Environment Variables (Vercel / Vite .env)
const envUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '');
const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// 2. Đọc từ LocalStorage (cho phép người dùng nhập trực tiếp trên web nếu chưa kịp cấu hình biến môi trường)
const localUrl = typeof window !== 'undefined' ? normalizeSupabaseUrl(localStorage.getItem('lovecard_supabase_url') || '') : '';
const localAnonKey = typeof window !== 'undefined' ? (localStorage.getItem('lovecard_supabase_key') || '').trim() : '';

export const supabaseUrl = envUrl || localUrl;
export const supabaseAnonKey = envAnonKey || localAnonKey;

export const isSupabaseReady = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseReady 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Kiểm tra nguồn cấu hình
export function getSupabaseSource(): 'env' | 'local' | 'none' {
  if (envUrl && envAnonKey) return 'env';
  if (localUrl && localAnonKey) return 'local';
  return 'none';
}

// Lưu cấu hình Supabase thủ công vào trình duyệt
export function saveLocalSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    const cleanUrl = normalizeSupabaseUrl(url);
    localStorage.setItem('lovecard_supabase_url', cleanUrl);
    localStorage.setItem('lovecard_supabase_key', key.trim());
    window.location.reload();
  }
}

// Xóa cấu hình thủ công
export function clearLocalSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lovecard_supabase_url');
    localStorage.removeItem('lovecard_supabase_key');
    window.location.reload();
  }
}

// Hàm kiểm tra kết nối thực tế tới Supabase Cloud
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseReady || !supabase) {
    return {
      success: false,
      message: 'Chưa cấu hình URL hoặc Anon Key của Supabase.',
    };
  }

  try {
    const { error } = await supabase.from('templates').select('id').limit(1);
    if (error) {
      if (error.message?.includes('relation "public.templates" does not exist') || error.message?.includes('does not exist')) {
        return {
          success: false,
          message: 'Đã kết nối tới Supabase thành công, nhưng bạn chưa tạo bảng! Vui lòng copy file supabase_schema.sql vào SQL Editor trên Supabase và bấm RUN.',
        };
      }
      return {
        success: false,
        message: `Lỗi kết nối CSDL: ${error.message}`,
      };
    }
    return {
      success: true,
      message: 'Kết nối Supabase Cloud thành công 100%! Cơ sở dữ liệu đã sẵn sàng hoạt động 24/7.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Không thể kết nối đến máy chủ Supabase: ${err?.message || err}`,
    };
  }
}
