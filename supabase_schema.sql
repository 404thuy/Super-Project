-- ========================================================
-- SCHEMA CƠ SỞ DỮ LIỆU CLOUD DỰ ÁN THIỆP 20/10 (LOVECARD)
-- Chạy đoạn script này trong mục SQL Editor trên Supabase
-- ========================================================

-- 1. BẢNG NGƯỜI DÙNG (USERS)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG DANH THIỆP (CARDS)
CREATE TABLE IF NOT EXISTS public.cards (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  template_id TEXT NOT NULL,
  sender_name TEXT,
  recipient_name TEXT,
  wish_message TEXT,
  card_data JSONB NOT NULL,
  views_count INTEGER DEFAULT 1,
  hearts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG THỐNG KÊ MẪU THIỆP (TEMPLATES)
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  name TEXT,
  views_count INTEGER DEFAULT 0,
  hearts_count INTEGER DEFAULT 0,
  uses_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG THẢ TIM MẪU THIỆP (TEMPLATE_LIKES)
CREATE TABLE IF NOT EXISTS public.template_likes (
  user_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, template_id)
);

-- Bật tính năng Row Level Security (RLS) và cho phép truy cập công khai
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_likes ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách cho phép đọc/ghi công khai (Public Access)
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow public read cards" ON public.cards FOR SELECT USING (true);
CREATE POLICY "Allow public insert cards" ON public.cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update cards" ON public.cards FOR UPDATE USING (true);
CREATE POLICY "Allow public delete cards" ON public.cards FOR DELETE USING (true);

CREATE POLICY "Allow public read templates" ON public.templates FOR SELECT USING (true);
CREATE POLICY "Allow public all templates" ON public.templates FOR ALL USING (true);

CREATE POLICY "Allow public all template_likes" ON public.template_likes FOR ALL USING (true);
