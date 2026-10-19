import { useState } from 'react';
import type { EffectType } from '../types';
import { Sparkles } from 'lucide-react';

interface Props {
  effectType: EffectType;
  thumbnailUrl?: string;
  className?: string;
}

export interface RealTemplateVisual {
  image: string;
  badge: string;
  tagline: string;
  accentColor: string;
  badgeBg: string;
}

export const REAL_TEMPLATE_VISUALS: Record<EffectType, RealTemplateVisual> = {
  PASSCODE_ENVELOPE: {
    image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=85',
    badge: '💌 Phong Bì Sáp Niêm Phong',
    tagline: 'Nhập mật mã để mở thư & ảnh kỷ niệm',
    accentColor: 'from-rose-500 to-pink-600',
    badgeBg: 'bg-rose-500/80 border-rose-300/60',
  },
  GALAXY_3D: {
    image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=85',
    badge: '✨ Thiên Hà 3D Không Gian',
    tagline: 'Lăng kính pha lê lơ lửng 360°',
    accentColor: 'from-indigo-500 to-purple-600',
    badgeBg: 'bg-indigo-600/80 border-indigo-300/60',
  },
  PETAL_RAIN: {
    image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&auto=format&fit=crop&q=85',
    badge: '🌸 Cánh Hoa Rơi Bồng Bềnh',
    tagline: 'Khung kính hoa ép & mặt hồ sóng nước',
    accentColor: 'from-pink-500 to-rose-500',
    badgeBg: 'bg-pink-600/80 border-pink-300/60',
  },
  VINYL_PLAYER: {
    image: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=800&auto=format&fit=crop&q=85',
    badge: '🎵 Đĩa Than & Cần Kim Cơ Học',
    tagline: 'Lồng ảnh tâm đĩa, máy hát xoay phát nhạc',
    accentColor: 'from-amber-600 to-yellow-600',
    badgeBg: 'bg-amber-600/80 border-amber-300/60',
  },
  SCRATCH_CARD: {
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=85',
    badge: '🪙 Lớp Cào Nhũ Vàng Bạc',
    tagline: 'Cào lớp nhũ óng ánh hé lộ kỷ niệm bí mật',
    accentColor: 'from-yellow-500 to-amber-600',
    badgeBg: 'bg-amber-500/90 text-slate-950 font-black border-yellow-200',
  },
  LANTERN_3D: {
    image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=85',
    badge: '🏮 Đèn Trời Ước Nguyện 3D',
    tagline: 'Đèn lụa 4 mặt in ảnh thả bay lên bầu trời sao',
    accentColor: 'from-orange-500 to-amber-600',
    badgeBg: 'bg-orange-600/80 border-orange-300/60',
  },
  CRYSTAL_CAROUSEL: {
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=85',
    badge: '🔮 Quả Cầu Pha Lê Vòng Quay 3D',
    tagline: 'Hộp nhạc xoay quanh đóa hồng pha lê vĩnh cửu',
    accentColor: 'from-cyan-500 to-blue-600',
    badgeBg: 'bg-cyan-600/80 border-cyan-300/60',
  },
  CINEMA_FILM: {
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=85',
    badge: '🎞️ Cuộn Phim 35mm Điện Ảnh',
    tagline: 'Thước phim kỷ niệm uốn lượn kèm phụ đề',
    accentColor: 'from-amber-600 to-stone-700',
    badgeBg: 'bg-stone-800/90 border-amber-400/60 text-amber-300',
  },
  BOUQUET_3D: {
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&auto=format&fit=crop&q=85',
    badge: '💐 Bó Hoa Nở Rộ & Charm Ảnh',
    tagline: 'Từng đóa hoa tươi 3D lật mở charm ảnh 2 mặt',
    accentColor: 'from-rose-500 to-pink-600',
    badgeBg: 'bg-rose-600/80 border-rose-300/60',
  },
  HOLD_TO_REVEAL: {
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=85',
    badge: '🔋 Trạm Sạc Cảm Biến Yêu Thương',
    tagline: 'Nhấn giữ để sạc đầy 100% năng lượng mở thiệp',
    accentColor: 'from-purple-500 to-fuchsia-600',
    badgeBg: 'bg-purple-600/80 border-purple-300/60',
  },
  FOGGY_MIRROR: {
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=85',
    badge: '🪞 Lau Hơi Sương Mặt Gương',
    tagline: 'Dùng ngón tay lau tan sương để lộ bức thư bí mật',
    accentColor: 'from-blue-500 to-indigo-600',
    badgeBg: 'bg-blue-600/80 border-blue-300/60',
  },
  BLOW_MIC: {
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=85',
    badge: '🌬️ Thổi Micro Gửi Lời Chúc',
    tagline: 'Thổi vào mic làm bay cánh hoa bồ công anh',
    accentColor: 'from-emerald-500 to-teal-600',
    badgeBg: 'bg-emerald-600/80 border-emerald-300/60',
  },
  POLAROID_SWIPE: {
    image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800&auto=format&fit=crop&q=85',
    badge: '📸 Kẹp Ảnh Polaroid Vuốt Thẻ',
    tagline: 'Vuốt từng tấm ảnh Polaroid đọc từng dòng tâm sự',
    accentColor: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-600/80 border-amber-300/60',
  },
  AI_GESTURE: {
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800&auto=format&fit=crop&q=85',
    badge: '🤖 Nụ Cười & Cử Chỉ AI',
    tagline: 'Mỉm cười hoặc thả tim trước camera để mở hộp quà',
    accentColor: 'from-fuchsia-500 to-pink-600',
    badgeBg: 'bg-fuchsia-600/80 border-fuchsia-300/60',
  },
};

export default function TemplateThumbnail({ effectType, thumbnailUrl, className = '' }: Props) {
  const visual = REAL_TEMPLATE_VISUALS[effectType] || REAL_TEMPLATE_VISUALS.PASSCODE_ENVELOPE;
  const imageSrc = thumbnailUrl || visual.image;
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none bg-slate-950 ${className}`}>
      {/* 1. Realistic Photorealistic Background Image */}
      {!imgError ? (
        <img
          src={imageSrc}
          alt={visual.badge}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 filter brightness-[0.92] group-hover:brightness-100"
        />
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br ${visual.accentColor} opacity-90 transition-transform duration-700 group-hover:scale-105`}
        />
      )}

      {/* 2. Cinematic Multi-Layer Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-black/30 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-vignette opacity-40 pointer-events-none" />

      {/* 3. Central Interactive Preview Badge (Thu hút, Lôi cuốn, Chân thực) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center pointer-events-none z-10">
        <div
          className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl backdrop-blur-md border shadow-lg flex items-center gap-1.5 transform transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 ${visual.badgeBg}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse shrink-0" />
          <span className="text-xs sm:text-[13px] font-black tracking-wide drop-shadow-sm truncate">
            {visual.badge}
          </span>
        </div>

        <p className="mt-2 text-[10px] sm:text-[11px] font-semibold text-white/90 drop-shadow-md max-w-[85%] truncate transition-opacity duration-300 group-hover:text-white">
          {visual.tagline}
        </p>
      </div>

      {/* 4. Delicate Shimmer Glass Shine on Hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
    </div>
  );
}
