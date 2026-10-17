# 🌹 LoveCard — Nền Tảng Thiết Kế & Gửi Thiệp Tương Tác (Đặc Biệt 20/10)

Ứng dụng web hiện đại, thẩm mỹ và giàu tính tương tác cho phép tạo thiệp chúc mừng điện tử cá nhân hóa và thư tình lãng mạn, được tối ưu đặc biệt cho ngày Phụ nữ Việt Nam 20/10, Valentine, ngày kỷ niệm và sinh nhật.

Khác biệt với các công cụ tạo thiệp ảnh tĩnh thông thường, **LoveCard** mang lại trải nghiệm sống động thông qua mini-game giải mã mật mã, hiệu ứng canvas 3D ngân hà, mô phỏng vật lý mưa cánh hoa rơi, đĩa than cổ điển phát nhạc và thiệp cào may mắn.

---

## ✨ Điểm Nổi Bật & Hiệu Ứng Độc Quyền

1. **💌 Thư Mật Mã Tình Yêu (Love Passcode Envelope):**
   - Phong bì niêm phong phong cách Glassmorphism 3D.
   - Bàn phím số bảo mật yêu cầu nhập đúng PIN / ngày kỷ niệm để mở.
   - Pháo hoa trái tim rực rỡ và kích hoạt nhạc tự động khi mở khóa thành công.

2. **✨ Thiên Hà Lời Chúc 3D (Galaxy of Memories):**
   - Bầu trời sao Three.js 3D chân thực với các chùm sao lơ lửng.
   - Nhấp vào từng vì sao để camera zoom mượt mà vào khung ảnh kỷ niệm và lời chúc yêu thương.

3. **🌸 Mưa Hoa & Mùa Xuân Rực Rỡ (Blossom & Spring Rain):**
   - Mô phỏng vật lý HTML5 Canvas với cánh hoa hồng và hoa anh đào rơi theo gió.
   - Hiệu ứng sóng nước tương tác khi chạm/click trên mặt kính.
   - Mở thiệp qua hiệu ứng dải ruy băng mượt mà.

4. **🎵 Đĩa Hát Kỷ Niệm (Retro Vinyl & Mixtape Letter):**
   - Máy hát đĩa than cổ điển quay tròn sống động kèm cần đọc đĩa.
   - Hiệu ứng Equalizer nhảy theo điệu nhạc và chữ hiển thị dạng máy đánh chữ (Typewriter).

5. **🎁 Thiệp Cào Bất Ngờ (Interactive Scratch & Surprise):**
   - Lớp tráng bạc ánh kim trên Canvas với cơ chế cào tay thực tế.
   - Tự động kích hoạt cơn mưa pháo hoa (confetti) khi cào hơn 70% diện tích.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** React 19 + TypeScript + Vite
- **Giao diện & Chuyển động:** Tailwind CSS v4, Framer Motion, Lucide Icons, Canvas-Confetti
- **Hiệu ứng & Canvas:** Three.js, @react-three/fiber, @react-three/drei, HTML5 Canvas 2D
- **Điều hướng:** React Router v7
- **Phông chữ:** Dancing Script (chữ viết tay lãng mạn), Playfair Display (sang trọng), Plus Jakarta Sans (hiện đại)

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử

### Yêu cầu môi trường
- [Node.js](https://nodejs.org/) (phiên bản 18 trở lên)
- Trình quản lý gói `npm`

### Các bước khởi chạy

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Chạy máy chủ phát triển (Development):**
   ```bash
   npm run dev
   ```
   Sau đó mở trình duyệt theo địa chỉ `http://localhost:5173` (hoặc cổng hiển thị trên terminal).

3. **Đóng gói dự án (Build Production):**
   ```bash
   npm run build
   ```

---

## 📁 Cấu Trúc Thư Mục

```text
├── index.html                   # Trang HTML gốc với Google Fonts & SEO tags
├── src/
│   ├── components/
│   │   ├── Navbar.tsx           # Thanh điều hướng Glassmorphism
│   │   └── effects/             # 5 bộ hiệu ứng tương tác độc quyền
│   │       ├── PasscodeEnvelopeFX.tsx
│   │       ├── GalaxyMemoriesFX.tsx
│   │       ├── BlossomPetalRainFX.tsx
│   │       ├── VinylPlayerFX.tsx
│   │       ├── ScratchCardFX.tsx
│   │       └── EffectRenderer.tsx
│   ├── pages/
│   │   ├── Landing.tsx          # Trang chủ giới thiệu & live preview
│   │   ├── Templates.tsx        # Danh mục chọn mẫu thiệp
│   │   ├── Studio.tsx           # Phòng thiết kế & tuỳ chỉnh thiệp
│   │   ├── CardViewer.tsx       # Trải nghiệm toàn màn hình cho người nhận
│   │   └── Dashboard.tsx        # Quản lý thiệp đã tạo & thống kê
│   ├── types.ts                 # Định nghĩa kiểu dữ liệu & danh sách mẫu
│   ├── App.tsx                  # Thiết lập điều hướng (Routing)
│   ├── index.css                # Hệ thống Glassmorphic Design System
│   └── main.tsx                 # Điểm khởi chạy ứng dụng
└── package.json
```

---

## 💖 Tôn Vinh Ngày Phụ Nữ Việt Nam 20/10

Ứng dụng được thiết kế nhằm mang lại những khoảnh khắc bất ngờ và cảm xúc chân thành nhất tới những người phụ nữ tuyệt vời xung quanh bạn! 🌹
