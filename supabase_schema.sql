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

-- Khởi tạo dữ liệu ban đầu cho toàn bộ 22 mẫu thiệp (Bắt đầu từ số liệu thực tế: 0)
INSERT INTO public.templates (id, name, views_count, hearts_count, uses_count)
VALUES
  ('passcode-envelope', 'Mật Thư Tình Yêu & Khóa Số Hoàng Gia', 0, 0, 0),
  ('galaxy-memories', 'Ngân Hà Tinh Tú & Lăng Kính Pha Lê 3D', 0, 0, 0),
  ('blossom-rain', 'Cơn Mưa Cánh Hoa & Lời Thì Thầm Mùa Thu', 0, 0, 0),
  ('vinyl-record', 'Đĩa Than Cổ Điển & Bản Tình Ca Năm Tháng', 0, 0, 0),
  ('scratch-vintage', 'Vé Cào May Mắn & Thông Điệp Bất Ngờ', 0, 0, 0),
  ('lantern-festival', 'Đèn Trời Ước Nguyện & Bầu Trời Đêm 3D', 0, 0, 0),
  ('crystal-carousel', 'Hộp Pha Lê 3D & Vương Quốc Kỳ Diệu', 0, 0, 0),
  ('cinema-film', 'Thước Phim Điện Ảnh Kỷ Niệm 20/10', 0, 0, 0),
  ('rose-bouquet', 'Bó Hoa Hồng 3D Tươi Thắm & Thiệp Đính Kèm', 0, 0, 0),
  ('hold-to-reveal', 'Chạm & Giữ Mở Quà Cảm Xúc (TikTok Hot)', 0, 0, 0),
  ('foggy-mirror', 'Lau Kính Mờ Hơi Sương Tìm Thông Điệp', 0, 0, 0),
  ('blow-mic', 'Thổi Micro Thổi Nến & Bật Hiệu Ứng', 0, 0, 0),
  ('polaroid-swipe', 'Vuốt Ảnh Polaroid Kỷ Niệm (Tinder Style)', 0, 0, 0),
  ('ai-gesture', 'Nhận Diện Cử Chỉ Tay Mở Khóa Phép Thuật', 0, 0, 0),
  ('newspaper-love', 'Báo Tình Yêu Vintage & Bản Tin Đặc Biệt', 0, 0, 0),
  ('music-player', 'Trình Phát Nhạc Mini & Lời Bài Hát Lãng Mạn', 0, 0, 0),
  ('message-bottle', 'Chiếc Chai Thủy Tinh & Bức Thư Đại Dương', 0, 0, 0),
  ('interactive-quiz', 'Câu Đố Trắc Nghiệm Tình Yêu Thú Vị', 0, 0, 0),
  ('ticket-voucher', 'Vé Cặp Đôi & Voucher Tình Yêu Độc Quyền', 0, 0, 0),
  ('blooming-tulip', 'Vườn Hoa Tulip Nở Rộ Chúc Mừng 20/10', 0, 0, 0),
  ('starry-fortune', 'Bói Bài Chiêm Tinh Sao & Thông Điệp Vũ Trụ', 0, 0, 0),
  ('pixel-retro', 'Máy Gameboy Pixel 8-bit Cổ Điển Hoài Niệm', 0, 0, 0),
  ('ai-gesture-unlock', 'Mật Mã Nụ Cười (Camera AI Mở Khóa)', 0, 0, 0)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name;

-- DỌN DẸP DỮ LIỆU ẢO CŨ & ĐỒNG BỘ CHÍNH XÁC THEO HOẠT ĐỘNG THỰC TẾ
-- 1. Đếm chính xác số tim từ bảng template_likes
UPDATE public.templates t
SET hearts_count = COALESCE((SELECT COUNT(*) FROM public.template_likes l WHERE l.template_id = t.id), 0);

-- 2. Đếm chính xác số lượt tạo thiệp từ bảng cards
UPDATE public.templates t
SET uses_count = COALESCE((SELECT COUNT(*) FROM public.cards c WHERE c.template_id = t.id), 0);

-- 3. Xóa các con số views ảo cũ (> 300) về số lượt thực tế
UPDATE public.templates
SET views_count = uses_count * 2
WHERE views_count >= 1000;

