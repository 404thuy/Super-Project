import React, { useState } from 'react';
import type { EffectType } from '../types';

interface Props {
  effectType: EffectType;
  thumbnailUrl?: string;
  className?: string;
  alt?: string;
}

const TEMPLATE_IMAGES: Record<EffectType, { img: string; badge: string; icon: string }> = {
  PASSCODE_ENVELOPE: {
    img: '/templates/passcode-envelope.jpg',
    badge: 'Mật mã PIN 4 số',
    icon: '💌',
  },
  GALAXY_3D: {
    img: '/templates/galaxy-memories.jpg',
    badge: 'Vũ trụ 3D pha lê xoay',
    icon: '✨',
  },
  PETAL_RAIN: {
    img: '/templates/blossom-rain.jpg',
    badge: 'Khung kính hoa ép & gợn sóng',
    icon: '🌸',
  },
  VINYL_PLAYER: {
    img: '/templates/vinyl-player.jpg',
    badge: 'Đĩa than cơ học & kim phát nhạc',
    icon: '🎵',
  },
  SCRATCH_CARD: {
    img: '/templates/scratch-card.jpg',
    badge: 'Cào lớp nhũ vàng bí mật',
    icon: '🪙',
  },
  LANTERN_3D: {
    img: '/templates/lantern-festival.jpg',
    badge: 'Đèn trời 3D bay lên vũ trụ',
    icon: '🏮',
  },
  CRYSTAL_CAROUSEL: {
    img: '/templates/crystal-carousel.jpg',
    badge: 'Quả cầu tuyết & hoa hồng 3D',
    icon: '🔮',
  },
  CINEMA_FILM: {
    img: '/templates/cinema-film.jpg',
    badge: 'Thước phim 35mm hoài niệm',
    icon: '🎞️',
  },
  BOUQUET_3D: {
    img: '/templates/bouquet-3d.jpg',
    badge: 'Bó hoa hồng 3D & charm locket',
    icon: '🌹',
  },
  HOLD_TO_REVEAL: {
    img: '/templates/hold-to-reveal.jpg',
    badge: 'Nhấn giữ cảm biến vân tay',
    icon: '🔋',
  },
  FOGGY_MIRROR: {
    img: '/templates/foggy-mirror.jpg',
    badge: 'Lau gương hơi nước giấu ảnh',
    icon: '🪞',
  },
  BLOW_MIC: {
    img: '/templates/blow-mic.jpg',
    badge: 'Thổi micro bay cánh hoa',
    icon: '💨',
  },
  POLAROID_SWIPE: {
    img: '/templates/polaroid-swipe.jpg',
    badge: 'Vuốt album ảnh Polaroid',
    icon: '📸',
  },
  AI_GESTURE: {
    img: '/templates/ai-gesture.jpg',
    badge: 'Nhận diện nụ cười AI',
    icon: '🤖',
  },
};

export default function TemplateThumbnail({ effectType, thumbnailUrl, className = '', alt }: Props) {
  const meta = TEMPLATE_IMAGES[effectType];
  const primarySrc = meta?.img || thumbnailUrl || '';
  const [imgSrc, setImgSrc] = useState<string>(primarySrc);
  const [loaded, setLoaded] = useState<boolean>(false);

  const handleImgError = () => {
    if (thumbnailUrl && imgSrc !== thumbnailUrl) {
      setImgSrc(thumbnailUrl);
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-950 select-none ${className}`}>
      {/* Background Glow / Ambient gradient placeholder while loading */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-rose-950/60 via-slate-900 to-indigo-950 transition-opacity duration-500 ${
          loaded ? 'opacity-0' : 'opacity-100 animate-pulse'
        }`}
      />

      {/* Actual Realistic Product Photography Image */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={alt || meta?.badge || 'Thiệp thực tế'}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={handleImgError}
          className={`w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : null}

      {/* Cinematic Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30 pointer-events-none" />

      {/* Interactive Feature Badge */}
      {meta && (
        <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 z-10 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-lg">
            <span className="text-xs">{meta.icon}</span>
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide text-rose-100 drop-shadow-sm">
              {meta.badge}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
