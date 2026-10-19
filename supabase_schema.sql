-- ========================================================
-- SCHEMA CƠ SỞ DỮ LIỆU CLOUD DỰ ÁN THIỆP 20/10 (LOVECARD)
-- Nền tảng: Supabase (PostgreSQL Cloud Miễn Phí 100%)
-- Hướng dẫn: Copy toàn bộ nội dung file này dán vào mục
-- "SQL Editor" trên bảng điều khiển Supabase và nhấn "RUN".
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
-- Chứa toàn bộ thông tin thiệp, lời chúc, mã khóa và hình ảnh (Base64 trong card_data JSONB)
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

-- Tạo chỉ mục (INDEX) để truy vấn nhanh hơn
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_template_id ON public.cards(template_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Bật tính năng Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_likes ENABLE ROW LEVEL SECURITY;

-- Xóa các policy cũ nếu có để tránh lỗi trùng lặp khi chạy lại
DROP POLICY IF EXISTS "Allow public all users" ON public.users;
DROP POLICY IF EXISTS "Allow public read users" ON public.users;
DROP POLICY IF EXISTS "Allow public insert users" ON public.users;
DROP POLICY IF EXISTS "Allow public update users" ON public.users;

DROP POLICY IF EXISTS "Allow public all cards" ON public.cards;
DROP POLICY IF EXISTS "Allow public read cards" ON public.cards;
DROP POLICY IF EXISTS "Allow public insert cards" ON public.cards;
DROP POLICY IF EXISTS "Allow public update cards" ON public.cards;
DROP POLICY IF EXISTS "Allow public delete cards" ON public.cards;

DROP POLICY IF EXISTS "Allow public all templates" ON public.templates;
DROP POLICY IF EXISTS "Allow public read templates" ON public.templates;

DROP POLICY IF EXISTS "Allow public all template_likes" ON public.template_likes;

-- Tạo chính sách phân quyền công khai (Public Access cho Web App)
CREATE POLICY "Allow public all users" ON public.users 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public all cards" ON public.cards 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public all templates" ON public.templates 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public all template_likes" ON public.template_likes 
  FOR ALL USING (true) WITH CHECK (true);

-- Khởi tạo dữ liệu ban đầu cho các mẫu thiệp (14 mẫu hot 20/10)
INSERT INTO public.templates (id, name, views_count, hearts_count, uses_count)
VALUES
  ('passcode-envelope', 'Mật Thư Tình Yêu & Khóa Số Hoàng Gia', 1520, 890, 420),
  ('galaxy-memories', 'Ngân Hà Tinh Tú & Lăng Kính Pha Lê 3D', 2410, 1680, 890),
  ('blossom-rain', 'Cơn Mưa Cánh Hoa & Lời Thì Thầm Mùa Thu', 1340, 780, 310),
  ('vinyl-record', 'Đĩa Than Cổ Điển & Bản Tình Ca Năm Tháng', 1890, 1120, 560),
  ('scratch-vintage', 'Vé Cào May Mắn & Thông Điệp Bất Ngờ', 1650, 930, 470),
  ('lantern-festival', 'Đèn Trời Ước Nguyện & Bầu Trời Đêm 3D', 2890, 1940, 980),
  ('crystal-carousel', 'Hộp Pha Lê 3D & Vương Quốc Kỳ Diệu', 3450, 2580, 1340),
  ('cinema-film', 'Thước Phim Điện Ảnh Kỷ Niệm 20/10', 2760, 1850, 910),
  ('rose-bouquet', 'Bó Hoa Hồng 3D Tươi Thắm & Thiệp Đính Kèm', 1980, 1340, 670),
  ('hold-to-reveal', 'Chạm & Giữ Mở Quà Cảm Xúc (TikTok Hot)', 2100, 1420, 720),
  ('foggy-mirror', 'Lau Kính Mờ Hơi Sương Tìm Thông Điệp', 1780, 1050, 540),
  ('blow-mic', 'Thổi Micro Thổi Nến & Bật Hiệu Ứng', 1920, 1260, 610),
  ('polaroid-swipe', 'Vuốt Ảnh Polaroid Kỷ Niệm (Tinder Style)', 2340, 1590, 830),
  ('ai-gesture', 'Nhận Diện Cử Chỉ Tay Mở Khóa Phép Thuật', 1850, 1180, 590)
ON CONFLICT (id) DO NOTHING;
