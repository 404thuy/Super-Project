import { useParams, Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  QrCode,
  Upload,
  Trash2,
  Sparkles,
  Music,
  Lock,
  Eye,
  Edit3,
  X,
  ExternalLink,
  Download,
  Globe,
  Palette,
  Layers,
  RotateCw,
  Plus,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { TEMPLATES, type CardConfig, type CreatedCard } from '../types';
import EffectRenderer from '../components/effects/EffectRenderer';
import { encodeCardData, saveCard, generateShortId, getCardById, incrementTemplateUse } from '../utils/cardStorage';
import { soundFx, MUSIC_PRESETS } from '../utils/soundEffects';
import { PRESET_WISHES } from '../utils/presetWishes';
import { useAuth } from '../context/AuthContext';
import MusicLibraryModal from '../components/MusicLibraryModal';
import {
  getSongById,
  getSongCoverUrl,
  VIETNAMESE_MUSIC_LIBRARY,
  type SongItem,
} from '../data/vietnameseMusic';
import { Play, Pause } from 'lucide-react';

function parseSongDurationToSeconds(durationStr?: string, defaultSec: number = 180): number {
  if (!durationStr) return defaultSec;
  const clean = durationStr.replace(/[^0-9:]/g, '');
  const parts = clean.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return defaultSec;
}

function formatSecondsToMMSS(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface PhotoSlotInfo {
  title: string;
  desc: string;
  icon: string;
}

export interface TemplatePhotoConfig {
  maxPhotos: number;
  title: string;
  desc: string;
  icon: string;
  badge: string;
  themeGradient: string;
  themeBorder: string;
  themeText: string;
  themeBadgeBg: string;
  slots: PhotoSlotInfo[];
}

export function getTemplatePhotoConfig(effectType: string): TemplatePhotoConfig {
  switch (effectType) {
    case 'LANTERN_3D':
    case 'LANTERN_FESTIVAL':
      return {
        maxPhotos: 2,
        title: '2 Mặt Ảnh Trên Thân Đèn Trời 3D',
        desc: 'Đèn trời 4 mặt gồm 2 mặt ảnh kỷ niệm đối xứng kết hợp 2 mặt tâm thư phát sáng bay lên',
        icon: '🏮',
        badge: '2 Mặt Đèn Trời',
        themeGradient: 'from-amber-50/70 via-orange-50/40 to-amber-100/50',
        themeBorder: 'border-amber-200/90',
        themeText: 'text-amber-800',
        themeBadgeBg: 'bg-amber-100/80 text-amber-800 border-amber-300',
        slots: [
          { title: 'Mặt Trước Đèn Trời', desc: 'Ảnh kỷ niệm chính thắp sáng màn đêm ấm áp', icon: '🏮' },
          { title: 'Mặt Sau Đèn Trời', desc: 'Ảnh kỷ niệm đối diện gửi gắm ước nguyện bình an', icon: '✨' },
        ],
      };

    case 'PETAL_RAIN':
    case 'CHERRY_BLOSSOM':
      return {
        maxPhotos: 3,
        title: '3 Khung Ảnh Ép Hoa Thủy Tinh Khô Hoàng Gia',
        desc: 'Các khung ảnh kỷ niệm ép cánh hoa đào khô nghệ thuật lơ lửng trong mặt kính thủy tinh',
        icon: '🌸',
        badge: 'Khung Thủy Tinh Ép Hoa',
        themeGradient: 'from-rose-50/80 via-pink-50/50 to-amber-50/60',
        themeBorder: 'border-rose-200/90',
        themeText: 'text-rose-900',
        themeBadgeBg: 'bg-rose-100/80 text-rose-900 border-rose-300',
        slots: [
          { title: 'Khung Ép Hoa Tiêu Điểm', desc: 'Ảnh chính trung tâm khung kính viền lá vàng', icon: '🌸' },
          { title: 'Khung Ép Hoa Cánh Đào 02', desc: 'Khung ảnh kỷ niệm viền hoa đào phai', icon: '✨' },
          { title: 'Khung Ép Hoa Cánh Đào 03', desc: 'Khung ảnh kỷ niệm viền hoa đào phai', icon: '✨' },
        ],
      };

    case 'VINYL_PLAYER':
      return {
        maxPhotos: 3,
        title: '3 Vị Trí Ảnh Đĩa Than & Vỏ Album Vintage',
        desc: '1 ảnh in giữa tâm đĩa than xoay tròn + 2 ảnh kỷ niệm kẹp vỏ bìa album retro',
        icon: '📻',
        badge: 'Đĩa Than & Bìa Album',
        themeGradient: 'from-stone-50/80 via-amber-50/40 to-orange-50/60',
        themeBorder: 'border-amber-200/90',
        themeText: 'text-amber-900',
        themeBadgeBg: 'bg-amber-100/80 text-amber-900 border-amber-300',
        slots: [
          { title: 'Tâm Đĩa Than Vinyl (Tròn)', desc: 'Ảnh in giữa tâm đĩa than xoay cùng kim máy hát', icon: '💿' },
          { title: 'Vỏ Bìa Album Vintage (Vuông)', desc: 'Ảnh đại diện bìa đĩa retro hoài niệm', icon: '🖼️' },
          { title: 'Ảnh Kỷ Niệm Kẹp Trong Album', desc: 'Ảnh tặng đính kèm gửi gắm người thương', icon: '📸' },
        ],
      };

    case 'BOUQUET_3D':
    case 'INTERACTIVE_BOUQUET':
      return {
        maxPhotos: 3,
        title: '3 Chiếc Thẻ Charm Ảnh Cài Trong Bó Hoa',
        desc: 'Những chiếc thẻ charm ảnh 2 mặt lấp lánh cài xen kẽ giữa các đóa hoa rực rỡ',
        icon: '💐',
        badge: '3 Thẻ Charm Bó Hoa',
        themeGradient: 'from-pink-50/80 via-rose-50/50 to-purple-50/60',
        themeBorder: 'border-rose-200/90',
        themeText: 'text-rose-800',
        themeBadgeBg: 'bg-rose-100/80 text-rose-800 border-rose-300',
        slots: [
          { title: 'Thẻ Charm Trái Tim Trọng Tâm', desc: 'Treo chính giữa bó hoa ngọt ngào', icon: '💖' },
          { title: 'Thẻ Charm Hoa Bên Trái', desc: 'Cài xen đóa hồng & hoa tulip nở rộ', icon: '🌸' },
          { title: 'Thẻ Charm Hoa Bên Phải', desc: 'Cài xen đóa mẫu đơn & cẩm chướng kiêu sa', icon: '🌷' },
        ],
      };

    case 'CRYSTAL_CAROUSEL':
      return {
        maxPhotos: 6,
        title: '6 Khung Ảnh & Lời Khắc Vòng Quay 3D',
        desc: 'Tải ảnh & tùy chỉnh câu khắc riêng cho từng mặt xoay của quả cầu pha lê',
        icon: '🎠',
        badge: '6 Mặt Xoay 360°',
        themeGradient: 'from-cyan-50/70 via-sky-50/40 to-purple-50/50',
        themeBorder: 'border-cyan-200/90',
        themeText: 'text-cyan-800',
        themeBadgeBg: 'bg-cyan-100/80 text-cyan-800 border-cyan-300',
        slots: [
          { title: 'Mặt Xoay 01 • Pha Lê', desc: 'Mặt xoay đầu tiên của hộp nhạc', icon: '💎' },
          { title: 'Mặt Xoay 02 • Pha Lê', desc: 'Mặt xoay thứ hai của hộp nhạc', icon: '💎' },
          { title: 'Mặt Xoay 03 • Pha Lê', desc: 'Mặt xoay thứ ba của hộp nhạc', icon: '💎' },
          { title: 'Mặt Xoay 04 • Pha Lê', desc: 'Mặt xoay thứ tư của hộp nhạc', icon: '💎' },
          { title: 'Mặt Xoay 05 • Pha Lê', desc: 'Mặt xoay thứ năm của hộp nhạc', icon: '💎' },
          { title: 'Mặt Xoay 06 • Pha Lê', desc: 'Mặt xoay thứ sáu của hộp nhạc', icon: '💎' },
        ],
      };

    case 'POLAROID_SWIPE':
      return {
        maxPhotos: 4,
        title: '4 Trang Ảnh Kỷ Niệm Polaroid Vuốt Lật',
        desc: 'Mỗi ảnh tương ứng 1 trang lật album theo thứ tự hành trình kỷ niệm ngọt ngào',
        icon: '📸',
        badge: 'Album 4 Trang Vuốt',
        themeGradient: 'from-amber-50/80 via-rose-50/40 to-amber-100/50',
        themeBorder: 'border-amber-200/90',
        themeText: 'text-amber-900',
        themeBadgeBg: 'bg-amber-100/80 text-amber-900 border-amber-300',
        slots: [
          { title: 'Trang 01 • Khoảnh Khắc Ban Đầu', desc: 'Ảnh mở đầu album — phút giây đầu gặp gỡ', icon: '✨' },
          { title: 'Trang 02 • Kỷ Niệm Tỏa Nắng', desc: 'Ảnh rạng rỡ, nụ cười thắp sáng không gian', icon: '☀️' },
          { title: 'Trang 03 • Ánh Sao Trong Mắt', desc: 'Ảnh dịu dàng, khoảnh khắc kiều diễm nhất', icon: '💫' },
          { title: 'Trang 04 • Tâm Thư Yêu Thương', desc: 'Ảnh cuối đính kèm thông điệp chúc 20/10', icon: '💌' },
        ],
      };

    case 'CINEMA_FILM':
      return {
        maxPhotos: 12,
        title: 'Phân Cảnh Cuộn Phim Điện Ảnh 35mm',
        desc: 'Tự do tùy chọn số lượng ảnh & kịch bản phụ đề riêng cho từng phân cảnh',
        icon: '🎞️',
        badge: 'Phim 35mm Tùy Chọn',
        themeGradient: 'from-stone-50/80 via-amber-50/40 to-stone-100/60',
        themeBorder: 'border-amber-300/80',
        themeText: 'text-stone-900',
        themeBadgeBg: 'bg-amber-100/90 text-amber-900 border-amber-300',
        slots: [
          { title: 'Phân Cảnh 1 • Định Mệnh Gặp Gỡ', desc: 'Mở đầu thước phim — khoảnh khắc tương phùng', icon: '🎬' },
          { title: 'Phân Cảnh 2 • Ánh Nắng Rạng Rỡ', desc: 'Nụ cười và những ngày tháng bình yên bên nhau', icon: '✨' },
          { title: 'Phân Cảnh 3 • Đồng Hành Kỷ Niệm', desc: 'Từng phút giây gắn bó, sẻ chia ngọt bùi', icon: '🎞️' },
          { title: 'Phân Cảnh 4 • Lời Chúc Bất Tận', desc: 'Phân cảnh kết phim — lời chúc 20/10 sâu lắng nhất', icon: '🌹' },
        ],
      };

    case 'SCRATCH_CARD':
      return {
        maxPhotos: 4,
        title: 'Ảnh Tem Thư & Khoảnh Khắc Dưới Lớp Cào Vàng',
        desc: '1 ảnh làm tem thư hoàng gia 20/10 + các ảnh kỷ niệm hé lộ sau khi cào sạch',
        icon: '🪙',
        badge: 'Tem Thư & Lớp Cào',
        themeGradient: 'from-amber-50/80 via-yellow-50/50 to-amber-100/60',
        themeBorder: 'border-amber-300',
        themeText: 'text-amber-900',
        themeBadgeBg: 'bg-amber-100/80 text-amber-900 border-amber-300',
        slots: [
          { title: 'Tem Thư Hoàng Gia 20/10', desc: 'Ảnh làm con tem bưu thiếp cổ điển góc trên bức thư', icon: '📮' },
          { title: 'Ảnh Kỷ Niệm Lộ Ra 01', desc: 'Ảnh ẩn giấu hé lộ dưới lớp nhũ vàng', icon: '✨' },
          { title: 'Ảnh Kỷ Niệm Lộ Ra 02', desc: 'Ảnh ẩn giấu hé lộ dưới lớp nhũ vàng', icon: '✨' },
          { title: 'Ảnh Kỷ Niệm Lộ Ra 03', desc: 'Ảnh ẩn giấu hé lộ dưới lớp nhũ vàng', icon: '✨' },
        ],
      };

    case 'FOGGY_MIRROR':
      return {
        maxPhotos: 4,
        title: 'Bộ Ảnh Ghép Mosaic Sau Mặt Gương Mờ',
        desc: 'Hiện rõ rực rỡ khi người nhận dùng ngón tay lau tan lớp hơi sương trên gương',
        icon: '🪞',
        badge: 'Mosaic Sau Lớp Sương',
        themeGradient: 'from-sky-50/70 via-indigo-50/40 to-slate-100/60',
        themeBorder: 'border-sky-200/90',
        themeText: 'text-sky-900',
        themeBadgeBg: 'bg-sky-100/80 text-sky-900 border-sky-300',
        slots: [
          { title: 'Ảnh Tiêu Điểm Trung Tâm Gương', desc: 'Ảnh lớn chiếm vị trí trang trọng nhất trên mặt gương', icon: '👑' },
          { title: 'Ảnh Mosaic Kỷ Niệm 01', desc: 'Khung ảnh nhỏ góc gương sáng bóng', icon: '✨' },
          { title: 'Ảnh Mosaic Kỷ Niệm 02', desc: 'Khung ảnh nhỏ góc gương sáng bóng', icon: '✨' },
          { title: 'Ảnh Mosaic Kỷ Niệm 03', desc: 'Khung ảnh nhỏ góc gương sáng bóng', icon: '✨' },
        ],
      };

    case 'PASSCODE_ENVELOPE':
      return {
        maxPhotos: 4,
        title: 'Ảnh Kỷ Niệm Kẹp Ghim Vàng Trong Thư',
        desc: 'Các tấm ảnh Polaroid kẹp ghim sang trọng cùng bức thư mật mã niêm phong sáp',
        icon: '💌',
        badge: 'Ảnh Ghim Trong Thư',
        themeGradient: 'from-rose-50/80 via-pink-50/50 to-amber-50/60',
        themeBorder: 'border-rose-200/90',
        themeText: 'text-rose-900',
        themeBadgeBg: 'bg-rose-100/80 text-rose-900 border-rose-300',
        slots: [
          { title: 'Ảnh Kẹp Ghim Đầu Thư', desc: 'Tấm ảnh đầu tiên mở ra cùng mật thư khi nhập đúng mã', icon: '📎' },
          { title: 'Ảnh Kỷ Niệm Kẹp Kèm 02', desc: 'Ảnh Polaroid đính kèm trong phong bì', icon: '📸' },
          { title: 'Ảnh Kỷ Niệm Kẹp Kèm 03', desc: 'Ảnh Polaroid đính kèm trong phong bì', icon: '📸' },
          { title: 'Ảnh Kỷ Niệm Kẹp Kèm 04', desc: 'Ảnh Polaroid đính kèm trong phong bì', icon: '📸' },
        ],
      };

    case 'GALAXY_MEMORIES':
      return {
        maxPhotos: 4,
        title: '4 Lăng Kính Pha Lê Tinh Tú Giữa Ngân Hà',
        desc: 'Khối pha lê lơ lửng quanh các chòm sao, chạm vào để xoay và phóng to ảnh',
        icon: '🌌',
        badge: '4 Tinh Tú Ngân Hà',
        themeGradient: 'from-indigo-50/70 via-purple-50/40 to-sky-50/60',
        themeBorder: 'border-indigo-200/90',
        themeText: 'text-indigo-900',
        themeBadgeBg: 'bg-indigo-100/80 text-indigo-900 border-indigo-300',
        slots: [
          { title: 'Tinh Tú Pha Lê 01', desc: 'Khối lăng kính đính trên chòm sao sáng nhất', icon: '💎' },
          { title: 'Tinh Tú Pha Lê 02', desc: 'Khối lăng kính lơ lửng giữa dải ngân hà', icon: '💎' },
          { title: 'Tinh Tú Pha Lê 03', desc: 'Khối lăng kính lơ lửng giữa dải ngân hà', icon: '💎' },
          { title: 'Tinh Tú Pha Lê 04', desc: 'Khối lăng kính lơ lửng giữa dải ngân hà', icon: '💎' },
        ],
      };

    default:
      return {
        maxPhotos: 4,
        title: 'Bộ Sưu Tập Ảnh Kỷ Niệm Nghệ Thuật',
        desc: 'Hiển thị trang trọng bên dưới lời chúc và bức thư khi mở khóa thiệp',
        icon: '🖼️',
        badge: 'Bộ 4 Ảnh Kỷ Niệm',
        themeGradient: 'from-purple-50/70 via-pink-50/40 to-rose-50/60',
        themeBorder: 'border-purple-200/90',
        themeText: 'text-purple-900',
        themeBadgeBg: 'bg-purple-100/80 text-purple-900 border-purple-300',
        slots: [
          { title: 'Ảnh Tiêu Điểm Chính (Hero)', desc: 'Khung ảnh lớn trang trọng nhất bức thiệp', icon: '⭐' },
          { title: 'Ảnh Kỷ Niệm 02', desc: 'Khoảnh khắc ngọt ngào đính kèm', icon: '📸' },
          { title: 'Ảnh Kỷ Niệm 03', desc: 'Khoảnh khắc ngọt ngào đính kèm', icon: '📸' },
          { title: 'Ảnh Kỷ Niệm 04', desc: 'Khoảnh khắc ngọt ngào đính kèm', icon: '📸' },
        ],
      };
  }
}

export default function Studio() {
  const { templateId } = useParams<{ templateId: string }>();
  const location = useLocation();
  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const { user } = useAuth();

  // Persistent card ID
  const [currentCardId] = useState<string>(() => generateShortId());
  const [config, setConfig] = useState<CardConfig>(() => {
    const existing = getCardById(template.id);
    const defaultPreset = template.defaultConfig?.musicPreset || 'anh-nang-cua-anh';
    const base = existing
      ? { ...existing.cardData, images: [] }
      : { ...template.defaultConfig, musicPreset: defaultPreset, images: [] };
    const navState = location.state as { wishText?: string; recipientName?: string } | null;
    if (navState?.wishText) {
      return {
        ...base,
        images: [],
        mainText: navState.wishText,
        recipientName: navState.recipientName || base.recipientName,
      };
    }
    return { ...base, images: [] };
  });

  // Mobile View Switch: 'edit' or 'preview'
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');

  // Preset Wishes Picker state
  const [wishTarget, setWishTarget] = useState<'mom' | 'wife' | 'crush' | 'teacher' | 'colleague'>('crush');
  const [showWishPresets, setShowWishPresets] = useState(false);
  const [wishAppliedNotice, setWishAppliedNotice] = useState<string | null>(null);

  // Share Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTab, setShareTab] = useState<'qr' | 'link'>('qr');
  const [copied, setCopied] = useState(false);

  const [fileInputRef] = useState(() => ({ current: null as HTMLInputElement | null }));

  // Music Modal State & Live Preview in Studio
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isStudioAudioPlaying, setIsStudioAudioPlaying] = useState(false);
  const [selectedOnlineSong, setSelectedOnlineSong] = useState<SongItem | null>(null);

  // Audio seek debouncing to completely eliminate scratching/stuttering while dragging sliders
  const seekDebounceRef = useRef<number | null>(null);

  const commitAudioSeek = (startSec: number, endSec?: number, jumpToStart: boolean = true) => {
    if (seekDebounceRef.current) {
      clearTimeout(seekDebounceRef.current);
      seekDebounceRef.current = null;
    }
    soundFx.seekPlayback(startSec, endSec, jumpToStart);
  };

  const scheduleAudioSeek = (startSec: number, endSec?: number, jumpToStart: boolean = true) => {
    if (seekDebounceRef.current) {
      clearTimeout(seekDebounceRef.current);
    }
    seekDebounceRef.current = window.setTimeout(() => {
      soundFx.seekPlayback(startSec, endSec, jumpToStart);
      seekDebounceRef.current = null;
    }, 150);
  };

  const handleSelectSongFromModal = (song: SongItem, startSeconds: number = 0) => {
    if (song.id.startsWith('online-')) {
      setSelectedOnlineSong(song);
    } else {
      setSelectedOnlineSong(null);
    }
    // Luôn phát full bài hát — người dùng tự tuỳ chỉnh đoạn phát qua thanh trượt sau
    const maxDur = parseSongDurationToSeconds(song.duration, 180);
    setConfig((prev) => ({
      ...prev,
      musicPreset: song.id,
      audioUrl: song.audioUrl,
      audioStartTime: startSeconds,
      audioEndTime: maxDur,  // Luôn để full thời lượng bài hát, không cắt
    }));
    soundFx.startBackgroundMusic(song.id, song.audioUrl, startSeconds, undefined);
    setIsStudioAudioPlaying(true);
  };

  const handleSelectCustomUrl = (url: string, startSeconds: number = 0) => {
    setSelectedOnlineSong(null);
    setConfig((prev) => ({
      ...prev,
      musicPreset: 'custom-mp3',
      audioUrl: url,
      audioStartTime: startSeconds,
      audioEndTime: undefined,
    }));
    soundFx.startBackgroundMusic('custom-mp3', url, startSeconds);
    setIsStudioAudioPlaying(true);
  };

  // Direct fast upload from Studio music card
  const handleStudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playPinClick();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        soundFx.playHeartPop();
        setConfig((prev) => ({
          ...prev,
          musicPreset: 'custom-mp3',
          audioUrl: dataUrl,
          audioStartTime: prev.audioStartTime || 0,
          audioEndTime: undefined,
        }));
        soundFx.startBackgroundMusic('custom-mp3', dataUrl, config.audioStartTime || 0);
        setIsStudioAudioPlaying(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleStudioMusic = () => {
    if (isStudioAudioPlaying) {
      soundFx.stopBackgroundMusic();
      setIsStudioAudioPlaying(false);
    } else {
      const isOnlineSong = config.musicPreset?.startsWith('online-');
      const song = isOnlineSong ? selectedOnlineSong : getSongById(config.musicPreset || 'anh-nang-cua-anh');
      const maxDur = parseSongDurationToSeconds(song?.duration, 180);
      const start = typeof config.audioStartTime === 'number' ? config.audioStartTime : 0;
      const end = config.audioEndTime && config.audioEndTime < maxDur ? config.audioEndTime : undefined;
      soundFx.startBackgroundMusic(
        config.musicPreset || 'anh-nang-cua-anh',
        config.audioUrl || song?.audioUrl,
        start,
        end
      );
      setIsStudioAudioPlaying(true);
    }
  };

  // Stop sound previews on unmount
  useEffect(() => {
    return () => {
      soundFx.stopBackgroundMusic();
    };
  }, []);

  // Khi modal nhạc đóng, nếu nhạc bị dừng bởi modal cleanup → tự động restart
  useEffect(() => {
    if (!isMusicModalOpen && isStudioAudioPlaying) {
      // Dùng timeout nhỏ để đảm bảo modal useEffect đã chạy xong (stop nhạc) trước khi restart
      const t = window.setTimeout(() => {
        if (!soundFx.getIsPlaying()) {
          const isOnlineSong = config.musicPreset?.startsWith('online-');
          const song = isOnlineSong ? selectedOnlineSong : getSongById(config.musicPreset || 'anh-nang-cua-anh');
          const maxDur = parseSongDurationToSeconds(song?.duration, 180);
          const start = typeof config.audioStartTime === 'number' ? config.audioStartTime : 0;
          const end = config.audioEndTime && config.audioEndTime < maxDur ? config.audioEndTime : undefined;
          soundFx.startBackgroundMusic(
            config.musicPreset || 'anh-nang-cua-anh',
            config.audioUrl || song?.audioUrl,
            start,
            end
          );
        }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isMusicModalOpen]);

  const encodedSlug = 'c_' + encodeCardData(template.id, config, currentCardId);
  const shareUrl = `${window.location.origin}/card/${encodedSlug}`;

  const updateConfig = (key: keyof CardConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Handle Preset Wish selection
  const handleSelectWish = (text: string, label: string) => {
    soundFx.playPinClick();
    updateConfig('mainText', text);
    setWishAppliedNotice(`Đã điền lời chúc: "${label}"`);
    setShowWishPresets(false);
    setTimeout(() => setWishAppliedNotice(null), 3000);
  };

  // Helper nén ảnh siêu nhẹ và mượt mà, chống lỗi ngắt stream FileReader trên iOS Safari
  const compressImageFile = (file: File, maxDim = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      // 1. Thử dùng Blob URL trực tiếp (không bị ảnh hưởng bởi e.target.value = '')
      try {
        const blobUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
          URL.revokeObjectURL(blobUrl);
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
            return;
          }
          fallbackRead(file, resolve);
        };

        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          fallbackRead(file, resolve);
        };

        img.src = blobUrl;
      } catch {
        fallbackRead(file, resolve);
      }
    });
  };

  const fallbackRead = (file: File, resolve: (val: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  };

  // Handle Batch Image Upload (tải hàng loạt an toàn, nén nhanh và cập nhật chuẩn xác)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    soundFx.playPinClick();
    const isCinema = template.effectType === 'CINEMA_FILM';
    const photoConfig = getTemplatePhotoConfig(template.effectType);
    const maxPhotos = isCinema ? 20 : photoConfig.maxPhotos;
    const fileList = Array.from(files).slice(0, maxPhotos);

    try {
      const base64List = await Promise.all(
        fileList.map((file) => compressImageFile(file))
      );

      const validBase64 = base64List.filter(Boolean);
      if (validBase64.length > 0) {
        soundFx.playHeartPop();
        setConfig((prev) => {
          const current = [...(prev.images || [])];
          if (isCinema) {
            validBase64.forEach((b64, idx) => {
              if (idx < current.length) {
                current[idx] = b64;
              } else {
                current.push(b64);
              }
            });
            return { ...prev, images: current };
          }

          while (current.length < maxPhotos) {
            current.push('');
          }

          let nextSlot = 0;
          validBase64.forEach((b64) => {
            let target = current.findIndex((img, i) => !img && i >= nextSlot);
            if (target === -1) {
              target = nextSlot;
            }
            if (target < maxPhotos) {
              current[target] = b64;
              nextSlot = target + 1;
            }
          });

          return {
            ...prev,
            images: current.slice(0, maxPhotos),
          };
        });
      }
    } catch (err) {
      console.warn('Batch image upload warning:', err);
    } finally {
      // Chỉ reset sau khi đã nạp và nén xong toàn bộ
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    soundFx.playPinClick();
    setConfig((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  // Specific slot image upload for template slot
  const handleSlotImageUpload = async (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundFx.playPinClick();

    try {
      const base64 = await compressImageFile(file);
      if (base64) {
        soundFx.playHeartPop();
        setConfig((prev) => {
          const photoConfig = getTemplatePhotoConfig(template.effectType);
          const current = [...(prev.images || [])];
          while (current.length <= slotIndex) {
            current.push('');
          }
          current[slotIndex] = base64;
          if (template.effectType === 'CINEMA_FILM') {
            return { ...prev, images: current };
          }
          return { ...prev, images: current.slice(0, photoConfig.maxPhotos) };
        });
      }
    } catch (err) {
      console.warn('Slot image upload warning:', err);
    } finally {
      // Chỉ reset value sau khi đã hoàn tất xử lý ảnh
      e.target.value = '';
    }
  };

  const handleRemoveSlotImage = (slotIndex: number) => {
    soundFx.playPinClick();
    setConfig((prev) => {
      const current = [...(prev.images || [])];
      if (slotIndex < current.length) {
        current[slotIndex] = '';
      }
      return { ...prev, images: current };
    });
  };

  const handleSlotQuoteChange = (slotIndex: number, quote: string) => {
    setConfig((prev) => {
      const defaultQuotes = [
        'Mỗi khoảnh khắc bên em đều lấp lánh như viên pha lê.',
        'Em là điều ngọt ngào nhất mà số phận đã sắp đặt.',
        'Chúc em ngày 20/10 ngập tràn niềm vui và bình yên.',
        'Nụ cười của em thắp sáng cả thế giới xung quanh.',
        'Mãi yêu thương và trân trọng từng phút giây bên nhau.',
        'Gửi tặng công chúa đóa hồng vĩnh cửu không tàn 🌹',
      ];
      const quotes = [...(prev.crystalQuotes || defaultQuotes)];
      quotes[slotIndex] = quote;
      return { ...prev, crystalQuotes: quotes };
    });
  };

  const handleAutoFillCrystalQuotes = () => {
    soundFx.playSuccessChime();
    const sweetQuotes = [
      'Mỗi khoảnh khắc bên em đều lấp lánh như viên pha lê ✨',
      'Em là điều ngọt ngào nhất mà định mệnh đã ban tặng 💖',
      'Chúc em ngày 20/10 rạng rỡ, bình yên và hạnh phúc 🌸',
      'Nụ cười của em thắp sáng cả bầu trời trong anh 🌟',
      'Mãi yêu thương và trân quý từng phút giây có em bên đời 💎',
      'Gửi tặng công chúa đóa hồng vĩnh cửu không bao giờ tàn 🌹',
    ];
    setConfig((prev) => ({ ...prev, crystalQuotes: sweetQuotes }));
    setWishAppliedNotice('Đã tự động điền 6 thông điệp pha lê ngọt ngào!');
    setTimeout(() => setWishAppliedNotice(null), 3000);
  };

  // Cinema Filmstrip Handlers (Flexible scenes & individual scene subtitles)
  const handleCinemaCaptionChange = (slotIndex: number, caption: string) => {
    setConfig((prev) => {
      const defaultCinemaCaptions = [
        'Phân cảnh 1: Ngày định mệnh ta gặp nhau giữa thế gian muôn màu.',
        'Phân cảnh 2: Nụ cười của bạn là ánh nắng rạng rỡ nhất trong đời.',
        'Phân cảnh 3: Dù cuộc đời có ra sao, chúng ta vẫn luôn đồng hành.',
        'Phân cảnh 4: Chúc bạn ngày 20/10 ngập tràn hạnh phúc và rạng rỡ! 🎬',
      ];
      const captions = [...(prev.cinemaCaptions || defaultCinemaCaptions)];
      while (captions.length <= slotIndex) {
        captions.push(`Phân cảnh ${captions.length + 1}: Kỷ niệm đáng nhớ`);
      }
      captions[slotIndex] = caption;
      return { ...prev, cinemaCaptions: captions };
    });
  };

  const handleAddCinemaScene = () => {
    soundFx.playPinClick();
    setConfig((prev) => {
      const defaultCinemaCaptions = [
        'Phân cảnh 1: Ngày định mệnh ta gặp nhau giữa thế gian muôn màu.',
        'Phân cảnh 2: Nụ cười của bạn là ánh nắng rạng rỡ nhất trong đời.',
        'Phân cảnh 3: Dù cuộc đời có ra sao, chúng ta vẫn luôn đồng hành.',
        'Phân cảnh 4: Chúc bạn ngày 20/10 ngập tràn hạnh phúc và rạng rỡ! 🎬',
      ];
      const currentImages = [...(prev.images || [])];
      const currentCaptions = [...(prev.cinemaCaptions || defaultCinemaCaptions)];
      const nextNum = Math.max(currentImages.length, currentCaptions.length) + 1;
      
      currentImages.push('');
      currentCaptions.push(`Phân cảnh ${nextNum}: Thước phim ngọt ngào tiếp theo.`);

      return {
        ...prev,
        images: currentImages,
        cinemaCaptions: currentCaptions,
      };
    });
  };

  const handleRemoveCinemaScene = (slotIndex: number) => {
    soundFx.playPinClick();
    setConfig((prev) => {
      const defaultCinemaCaptions = [
        'Phân cảnh 1: Ngày định mệnh ta gặp nhau giữa thế gian muôn màu.',
        'Phân cảnh 2: Nụ cười của bạn là ánh nắng rạng rỡ nhất trong đời.',
        'Phân cảnh 3: Dù cuộc đời có ra sao, chúng ta vẫn luôn đồng hành.',
        'Phân cảnh 4: Chúc bạn ngày 20/10 ngập tràn hạnh phúc và rạng rỡ! 🎬',
      ];
      const currentImages = [...(prev.images || [])];
      const currentCaptions = [...(prev.cinemaCaptions || defaultCinemaCaptions)];

      const newImages = currentImages.filter((_, i) => i !== slotIndex);
      const newCaptions = currentCaptions.filter((_, i) => i !== slotIndex);

      return {
        ...prev,
        images: newImages,
        cinemaCaptions: newCaptions,
      };
    });
  };

  const handleAutoFillCinemaCaptions = () => {
    soundFx.playSuccessChime();
    const cinematicIdeas = [
      'Phân cảnh 1: Ngày định mệnh ta gặp nhau giữa thế gian muôn màu 🌟',
      'Phân cảnh 2: Nụ cười của bạn là ánh nắng rạng rỡ nhất trong đời ☀️',
      'Phân cảnh 3: Dù cuộc đời có ra sao, chúng ta vẫn luôn đồng hành 💖',
      'Phân cảnh 4: Chúc người phụ nữ tuyệt vời ngày 20/10 ngập tràn hạnh phúc 🌹',
      'Phân cảnh 5: Từng khoảnh khắc bên nhau đều là một thước phim vô giá 🎞️',
      'Phân cảnh 6: Cảm ơn bạn đã luôn kề vai sát cánh và sẻ chia ngọt bùi ✨',
      'Phân cảnh 7: Cùng nhau bước tiếp những chặng đường rực rỡ phía trước 🥂',
      'Phân cảnh 8: Mãi mãi là những tri kỷ tuyệt vời nhất trong cuộc đời này 🎬',
    ];
    setConfig((prev) => {
      const count = Math.max(prev.images?.length || 0, prev.cinemaCaptions?.length || 0, 4);
      const newCaptions = Array.from({ length: count }).map((_, i) => {
        return cinematicIdeas[i % cinematicIdeas.length];
      });
      return { ...prev, cinemaCaptions: newCaptions };
    });
    setWishAppliedNotice('Đã tự động gợi ý kịch bản điện ảnh sâu lắng cho các phân cảnh!');
    setTimeout(() => setWishAppliedNotice(null), 3000);
  };

  const [isSaving, setIsSaving] = useState(false);

  // Save Card & Open Share to Oracle 19c (DA.CARDS & DA.CARD_IMAGES)
  const handleSaveAndShare = async () => {
    setIsSaving(true);
    soundFx.playSuccessChime();
    const newCard: CreatedCard = {
      id: currentCardId,
      creatorId: user ? user.id : null,
      templateId: template.id,
      title: `${template.titleVi} — Gửi ${config.recipientName || 'người thương'}`,
      cardData: config,
      viewsCount: 1,
      heartsCount: 0,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    };
    try {
      await saveCard(newCard);
      await incrementTemplateUse(template.id);
    } catch (err) {
      console.warn('Lỗi lưu thiệp:', err);
    } finally {
      setIsSaving(false);
      setShowShareModal(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      soundFx.playPinClick();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadQr = () => {
    soundFx.playSuccessChime();
    const svg = document.getElementById('studio-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 20, 20, 360, 360);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `LoveCard-QR-${config.recipientName || '20-10'}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pt-16">
      {/* Studio Header Bar */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 z-30 px-2 sm:px-6 lg:px-8 flex items-center justify-between gap-1.5 sm:gap-4 shadow-xs">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          <Link
            to="/templates"
            title="Quay lại danh sách mẫu thiệp"
            className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all active:scale-95 border border-transparent hover:border-slate-200"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xs sm:text-base text-slate-900 truncate max-w-[170px] xs:max-w-[240px] sm:max-w-none">
                {template.titleVi}
              </h1>
              <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 shrink-0">
                Mẫu {template.category || '20/10'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate hidden sm:block">
              {template.descriptionVi}
            </p>
          </div>
        </div>

        {/* Center: Mobile View Switcher (Edit vs Preview) */}
        <div className="flex md:hidden bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80 shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => setMobileTab('edit')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'edit'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Soạn</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'preview'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem</span>
          </button>
        </div>

        {/* Right: Primary Action Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleSaveAndShare}
            disabled={isSaving}
            className="h-8 sm:h-10 px-2.5 sm:px-5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-700 hover:via-pink-700 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md hover:shadow-purple-500/20 flex items-center gap-1 sm:gap-1.5 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
          >
            <Share2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>
              {isSaving ? (
                'Đang lưu...'
              ) : (
                <>
                  <span className="hidden sm:inline">Hoàn tất & </span>
                  <span>Gửi thiệp</span>
                </>
              )}
            </span>
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Streamlined Input Editor */}
        <div
          className={`md:col-span-5 lg:col-span-5 space-y-5 ${
            mobileTab === 'preview' ? 'hidden md:block' : 'block'
          }`}
        >
          {/* Section 1: Nội Dung Thiệp */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span>💌</span>
                <span>Nội Dung Lời Chúc</span>
              </h2>

              {/* Quick Wish Presets Modal Toggle */}
              <button
                type="button"
                onClick={() => setShowWishPresets(!showWishPresets)}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gợi ý lời chúc</span>
              </button>
            </div>

            {/* Notification when wish applied */}
            {wishAppliedNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-pulse">
                ✓ {wishAppliedNotice}
              </div>
            )}

            {/* Recipient & Sender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Người nhận
                </label>
                <input
                  type="text"
                  spellCheck={false}
                  value={config.recipientName}
                  onChange={(e) => updateConfig('recipientName', e.target.value)}
                  placeholder="VD: Em yêu, Mẹ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Người gửi
                </label>
                <input
                  type="text"
                  spellCheck={false}
                  value={config.senderName}
                  onChange={(e) => updateConfig('senderName', e.target.value)}
                  placeholder="VD: Anh, Con trai..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* Main Text / Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thông điệp gửi gắm
              </label>
              <textarea
                rows={4}
                spellCheck={false}
                value={config.mainText}
                onChange={(e) => updateConfig('mainText', e.target.value)}
                placeholder="Viết những lời chân thành nhất của bạn tại đây..."
                className="w-full p-3.5 rounded-xl border border-slate-200 text-sm leading-relaxed focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {/* Font Family Selector */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span>🔤</span>
                <span>Kiểu phông chữ thiệp</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'Be Vietnam Pro', label: 'Be Vietnam Pro', desc: 'Chuẩn tiếng Việt, mềm mại' },
                  { id: 'Playfair Display', label: 'Playfair Display', desc: 'Serif cổ điển sang trọng' },
                  { id: 'Plus Jakarta Sans', label: 'Plus Jakarta', desc: 'Hiện đại, sắc nét' },
                  { id: 'Dancing Script', label: 'Dancing Script', desc: 'Chữ viết tay nghệ thuật' },
                ].map((f) => {
                  const isSelected = (config.fontFamily || template.defaultConfig.fontFamily || 'Be Vietnam Pro') === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        soundFx.playPinClick();
                        updateConfig('fontFamily', f.id);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-400/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-800" style={{ fontFamily: f.id }}>
                        {f.label}
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{f.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Hình Ảnh & Nhạc Nền */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
            <h2 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <span>📸</span>
              <span>Hình Ảnh Kỷ Niệm & Nhạc</span>
            </h2>

            {/* Photos Upload Area - Template-Aware Customizer */}
            {(() => {
              const photoConfig = getTemplatePhotoConfig(template.effectType);
              const isCrystal = template.effectType === 'CRYSTAL_CAROUSEL';
              const isCinema = template.effectType === 'CINEMA_FILM';

              const defaultCinemaCaptions = [
                'Phân cảnh 1: Ngày định mệnh ta gặp nhau giữa thế gian muôn màu.',
                'Phân cảnh 2: Nụ cười của bạn là ánh nắng rạng rỡ nhất trong đời.',
                'Phân cảnh 3: Dù cuộc đời có ra sao, chúng ta vẫn luôn đồng hành.',
                'Phân cảnh 4: Chúc bạn ngày 20/10 ngập tràn hạnh phúc và rạng rỡ! 🎬',
              ];

              const currentCinemaCount = isCinema
                ? Math.max(config.images?.length || 0, config.cinemaCaptions?.length || 0, 4)
                : photoConfig.maxPhotos;

              const maxPhotos = isCinema ? currentCinemaCount : photoConfig.maxPhotos;
              const uploadedCount = (config.images || []).filter(Boolean).length;

              const activeSlots = isCinema
                ? Array.from({ length: currentCinemaCount }).map((_, i) => ({
                    title: `Phân Cảnh ${i + 1}`,
                    desc: `Thước phim thứ ${i + 1} của cuộn phim điện ảnh`,
                    icon: i % 4 === 0 ? '🎬' : i % 4 === 1 ? '✨' : i % 4 === 2 ? '🎞️' : '🌹',
                  }))
                : photoConfig.slots;

              return (
                <div className={`space-y-3.5 bg-gradient-to-br ${photoConfig.themeGradient} p-4 rounded-2xl border ${photoConfig.themeBorder}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <label className={`text-xs font-black ${photoConfig.themeText} flex items-center gap-1.5`}>
                        <span className="text-base">{photoConfig.icon}</span>
                        <span className="truncate">{photoConfig.title}</span>
                      </label>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {photoConfig.desc}
                      </p>
                    </div>
                    <span className={`text-[11px] font-bold ${photoConfig.themeBadgeBg} px-2.5 py-0.5 rounded-full border shrink-0 shadow-2xs`}>
                      {isCinema ? `${currentCinemaCount} cảnh (${uploadedCount} đã tải)` : `${uploadedCount}/${maxPhotos} ảnh`}
                    </span>
                  </div>

                  {/* Quick actions: Auto fill quotes (if Crystal) / Cinema scene controls & Batch upload */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {isCrystal && (
                      <button
                        type="button"
                        onClick={handleAutoFillCrystalQuotes}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-purple-100/80 hover:bg-purple-200/80 text-purple-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-purple-200 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>🎲 Gợi ý 6 câu chúc</span>
                      </button>
                    )}

                    {isCinema && (
                      <button
                        type="button"
                        onClick={handleAddCinemaScene}
                        className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm cảnh</span>
                      </button>
                    )}

                    {isCinema && (
                      <button
                        type="button"
                        onClick={handleAutoFillCinemaCaptions}
                        className="py-1.5 px-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-amber-300 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>🎲 Gợi ý kịch bản</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-rose-300" />
                      <span>{isCinema ? 'Tải nhanh nhiều ảnh' : `Tải nhanh ${maxPhotos} ảnh cùng lúc`}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Individual Template-Specific Photo Slots */}
                  <div className={`grid grid-cols-1 ${maxPhotos >= 3 ? 'sm:grid-cols-2' : ''} gap-2.5 max-h-[460px] overflow-y-auto pr-1`}>
                    {activeSlots.map((slotInfo, idx) => {
                      const img = config.images?.[idx];
                      const isVinylCenter = template.effectType === 'VINYL_PLAYER' && idx === 0;
                      const defaultQuotes = [
                        'Mỗi khoảnh khắc bên em đều lấp lánh như viên pha lê.',
                        'Em là điều ngọt ngào nhất mà số phận đã sắp đặt.',
                        'Chúc em ngày 20/10 ngập tràn niềm vui và bình yên.',
                        'Nụ cười của em thắp sáng cả thế giới xung quanh.',
                        'Mãi yêu thương và trân trọng từng phút giây bên nhau.',
                        'Gửi tặng công chúa đóa hồng vĩnh cửu không tàn 🌹',
                      ];
                      const quote = isCrystal ? (config.crystalQuotes?.[idx] ?? defaultQuotes[idx]) : null;
                      const cinemaCaption = isCinema
                        ? (config.cinemaCaptions?.[idx] ?? defaultCinemaCaptions[idx % defaultCinemaCaptions.length])
                        : null;

                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Photo thumbnail or upload button */}
                            <div className={`relative w-14 h-14 ${isVinylCenter ? 'rounded-full' : 'rounded-xl'} overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group`}>
                              {img ? (
                                <>
                                  <img
                                    src={img}
                                    alt={slotInfo.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSlotImage(idx)}
                                    className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    title="Xóa ảnh này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <label className={`w-full h-full flex flex-col items-center justify-center text-slate-400 hover:text-purple-600 hover:bg-purple-50/50 cursor-pointer transition-colors ${isVinylCenter ? 'rounded-full' : ''}`}>
                                  <Upload className="w-4 h-4 mb-0.5" />
                                  <span className="text-[8px] font-bold">Thêm</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleSlotImageUpload(idx, e)}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>

                            {/* Slot Info & Replace */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-bold text-slate-800 truncate flex items-center gap-1">
                                  <span>{slotInfo.icon}</span>
                                  <span className="truncate">{slotInfo.title}</span>
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {img && (
                                    <label className="text-[10px] text-purple-600 hover:underline cursor-pointer font-bold shrink-0">
                                      Đổi
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleSlotImageUpload(idx, e)}
                                        className="hidden"
                                      />
                                    </label>
                                  )}
                                  {isCinema && currentCinemaCount > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCinemaScene(idx)}
                                      className="text-[10px] text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-1 py-0.5 rounded cursor-pointer transition-colors"
                                      title="Xóa phân cảnh này"
                                    >
                                      Xóa cảnh
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                                {slotInfo.desc}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded ${img ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                                  {img ? '✓ Đã tải ảnh' : 'Dùng ảnh mẫu'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Editable Quote for this slot (if Crystal Carousel) */}
                          {isCrystal && quote !== null && (
                            <div>
                              <input
                                type="text"
                                value={quote}
                                onChange={(e) => handleSlotQuoteChange(idx, e.target.value)}
                                placeholder="Lời nhắn trên mặt xoay này..."
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:border-cyan-500 bg-slate-50/50"
                              />
                            </div>
                          )}

                          {/* Editable Subtitle for this slot (if Cinema Film) */}
                          {isCinema && cinemaCaption !== null && (
                            <div className="space-y-1 pt-1.5 border-t border-slate-100">
                              <div className="flex items-center justify-between text-[10px] text-stone-600 font-medium">
                                <span>Phụ đề phân cảnh {idx + 1}:</span>
                                <span className="text-[9px] text-amber-700 italic">Hiện trên thước phim</span>
                              </div>
                              <textarea
                                rows={2}
                                value={cinemaCaption}
                                onChange={(e) => handleCinemaCaptionChange(idx, e.target.value)}
                                placeholder={`Nhập lời bình / phụ đề phân cảnh ${idx + 1}...`}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300/80 text-[11px] focus:outline-none focus:border-amber-500 bg-amber-50/40 font-serif resize-none"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add scene bottom button for cinema */}
                  {isCinema && (
                    <button
                      type="button"
                      onClick={handleAddCinemaScene}
                      className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-amber-400/80 hover:border-amber-500 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-4 h-4 text-amber-700" />
                      <span>+ Thêm Phân Cảnh Mới (Hiện có {currentCinemaCount} cảnh)</span>
                    </button>
                  )}

                  {uploadedCount > 0 && (
                    <p className="text-[11px] text-emerald-800 bg-emerald-50/90 p-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 font-medium">
                      <span>✓</span>
                      <span>Đã gắn {uploadedCount}/{maxPhotos} ảnh kỷ niệm đúng vị trí thiết kế cho mẫu {template.titleVi}.</span>
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Background Music Selector & Modal Trigger */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-rose-500" />
                  <span>Nhạc nền lãng mạn & Điệp khúc hay</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsMusicModalOpen(true)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                >
                  <span>Kho {VIETNAMESE_MUSIC_LIBRARY.length} bài hot</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Current Active Song Card */}
              {(() => {
                const isOnlineSong = config.musicPreset?.startsWith('online-');
                const isCustomUpload = config.musicPreset === 'custom-mp3';
                const currentSong = isOnlineSong
                  ? selectedOnlineSong
                  : getSongById(config.musicPreset || 'anh-nang-cua-anh');
                const isSystemSong = !isOnlineSong && !isCustomUpload && !!currentSong;

                const displayTitle = isCustomUpload
                  ? 'Bài Hát Tải Lên Từ Máy'
                  : currentSong?.title || 'Ánh Nắng Của Anh';
                const displayArtist = !isCustomUpload ? currentSong?.artist : null;
                const displayCover = isCustomUpload
                  ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80'
                  : getSongCoverUrl(currentSong);

                return (
                  <div className="p-3.5 sm:p-4 rounded-2xl border border-rose-200/80 bg-gradient-to-r from-rose-50/70 via-pink-50/40 to-purple-50/60 shadow-xs space-y-3">
                    {/* Top Row: Cover + Song Info & Badges */}
                    <div className="flex items-start gap-3">
                      {/* Real Singer / Track Cover Image */}
                      <div
                        data-search-exclude="true"
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 shadow-md border border-rose-200/90 relative group/img bg-rose-100"
                      >
                        <div
                          className={`w-full h-full bg-gradient-to-tr ${currentSong?.color || 'from-rose-500 to-pink-500'} text-white flex items-center justify-center text-lg absolute inset-0`}
                        >
                          {isCustomUpload ? '🎵' : (currentSong?.icon || '🎵')}
                        </div>
                        <img
                          src={displayCover}
                          alt={displayTitle}
                          data-search-exclude="true"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105 relative z-10"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>

                      {/* Synchronized Metadata */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-extrabold text-slate-900 truncate">
                            {displayTitle}
                          </h4>
                          {displayArtist && (
                            <>
                              <span className="text-slate-400 text-xs">•</span>
                              <span className="text-xs font-semibold text-slate-600 truncate">
                                {displayArtist}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {isCustomUpload ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 whitespace-nowrap">
                              MP3 Tự Tải Lên
                            </span>
                          ) : isOnlineSong ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 flex items-center gap-1 shadow-2xs whitespace-nowrap">
                              <Globe className="w-2.5 h-2.5" />
                              <span>Internet Online</span>
                            </span>
                          ) : (
                            <>
                              {currentSong?.tag && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/95 text-slate-700 border border-slate-200/80 shadow-2xs whitespace-nowrap">
                                  {currentSong.tag}
                                </span>
                              )}
                              {currentSong?.hasVocals && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white flex items-center gap-1 shadow-xs whitespace-nowrap">
                                  <span>🎤</span>
                                  <span>Có lời ca sĩ</span>
                                </span>
                              )}
                            </>
                          )}
                          {currentSong?.duration && (
                            <span className="text-[10px] font-semibold text-slate-600 bg-white/95 px-2 py-0.5 rounded-full border border-slate-200/80 flex items-center gap-1 whitespace-nowrap">
                              ⏱️ {currentSong.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Row: Play/Pause & Đổi Bài */}
                    <div className="flex items-center gap-2 pt-2 border-t border-rose-200/60">
                      <button
                        type="button"
                        onClick={handleToggleStudioMusic}
                        title={isStudioAudioPlaying ? 'Dừng phát' : 'Phát bài hát'}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                          isStudioAudioPlaying
                            ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isStudioAudioPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-white" />
                            <span>Dừng Nhạc</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-slate-700" />
                            <span>Phát Nhạc</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsMusicModalOpen(true)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-rose-300" />
                        <span>Đổi Bài Khác</span>
                      </button>
                    </div>

                    {/* KHUNG GIỜ PHÁT: THANH TRƯỢT 2 MỐC KÉO GIỚI HẠN (START & END) + NÚT TINH CHỈNH GIÂY */}
                    {(() => {
                      const maxDuration = parseSongDurationToSeconds(currentSong?.duration, 180);
                      const startTime = Math.max(0, Math.min(config.audioStartTime || 0, maxDuration - 1));
                      const rawEndTime =
                        config.audioEndTime !== undefined && config.audioEndTime > 0
                          ? config.audioEndTime
                          : maxDuration;
                      const endTime = Math.max(startTime + 1, Math.min(rawEndTime, maxDuration));

                      const handleStartSliderChange = (val: number) => {
                        const cleanStart = Math.max(0, Math.min(val, endTime - 1));
                        setConfig((prev) => ({ ...prev, audioStartTime: cleanStart }));
                        scheduleAudioSeek(cleanStart, endTime, true);
                      };

                      const handleEndSliderChange = (val: number) => {
                        const cleanEnd = Math.max(startTime + 1, Math.min(val, maxDuration));
                        setConfig((prev) => ({ ...prev, audioEndTime: cleanEnd }));
                        scheduleAudioSeek(startTime, cleanEnd, false);
                      };

                      const handleStartSliderCommit = (val?: number) => {
                        const targetStart = val !== undefined ? Math.max(0, Math.min(val, endTime - 1)) : startTime;
                        commitAudioSeek(targetStart, endTime, true);
                      };

                      const handleEndSliderCommit = (val?: number) => {
                        const targetEnd = val !== undefined ? Math.max(startTime + 1, Math.min(val, maxDuration)) : endTime;
                        commitAudioSeek(startTime, targetEnd, false);
                      };

                      const handleDiscreteRangeChange = (newStart: number, newEnd: number, playPreview: boolean = true) => {
                        const cleanStart = Math.max(0, Math.min(newStart, maxDuration - 1));
                        const cleanEnd = Math.max(cleanStart + 1, Math.min(newEnd, maxDuration));

                        if (seekDebounceRef.current) {
                          clearTimeout(seekDebounceRef.current);
                          seekDebounceRef.current = null;
                        }

                        setConfig((prev) => ({
                          ...prev,
                          audioStartTime: cleanStart,
                          audioEndTime: cleanEnd,
                        }));

                        const endForEngine = cleanEnd >= maxDuration ? undefined : cleanEnd;

                        if (isStudioAudioPlaying || playPreview) {
                          if (!isStudioAudioPlaying) {
                            setIsStudioAudioPlaying(true);
                            // Bài chưa phát → khởi động từ đầu
                            soundFx.startBackgroundMusic(
                              config.musicPreset || 'anh-nang-cua-anh',
                              config.audioUrl || currentSong?.audioUrl,
                              cleanStart,
                              endForEngine
                            );
                          } else {
                            // Bài đang phát → chỉ seek để không restart lại từ đầu
                            soundFx.seekPlayback(cleanStart, endForEngine, true);
                          }
                        } else {
                          soundFx.seekPlayback(cleanStart, endForEngine, true);
                        }
                      };

                      return (
                        <div className="pt-2.5 border-t border-rose-200/60 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                              <span>✂️</span>
                              <span>Đoạn phát mong muốn:</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px] shadow-2xs">
                                {formatSecondsToMMSS(startTime)} ➔ {formatSecondsToMMSS(endTime)}
                              </span>
                              <span className="font-mono font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200 text-[10px]">
                                {endTime - startTime}s
                              </span>
                            </div>
                          </div>

                          {/* Dual-Handle Slider Track with 2 markers */}
                          <div className="relative w-full h-8 flex items-center select-none">
                            {/* Background base bar */}
                            <div className="absolute inset-x-0 h-2.5 bg-slate-200 rounded-full" />

                            {/* Highlighted active range */}
                            <div
                              className="absolute h-2.5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 rounded-full shadow-xs pointer-events-none"
                              style={{
                                left: `${(startTime / maxDuration) * 100}%`,
                                width: `${Math.max(1, ((endTime - startTime) / maxDuration) * 100)}%`,
                              }}
                            />

                            {/* Start Range Input (White circle thumb with rose border) */}
                            <input
                              type="range"
                              min={0}
                              max={maxDuration}
                              step={1}
                              value={startTime}
                              onChange={(e) => handleStartSliderChange(parseInt(e.target.value, 10))}
                              onPointerUp={(e) => handleStartSliderCommit(parseInt((e.target as HTMLInputElement).value, 10))}
                              onMouseUp={(e) => handleStartSliderCommit(parseInt((e.target as HTMLInputElement).value, 10))}
                              onTouchEnd={(e) => handleStartSliderCommit(parseInt((e.target as HTMLInputElement).value, 10))}
                              onKeyUp={(e) => handleStartSliderCommit(parseInt((e.target as HTMLInputElement).value, 10))}
                              className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none z-20
                                [&::-webkit-slider-thumb]:pointer-events-auto
                                [&::-webkit-slider-thumb]:w-5
                                [&::-webkit-slider-thumb]:h-5
                                [&::-webkit-slider-thumb]:rounded-full
                                [&::-webkit-slider-thumb]:bg-white
                                [&::-webkit-slider-thumb]:border-2
                                [&::-webkit-slider-thumb]:border-rose-500
                                [&::-webkit-slider-thumb]:shadow-md
                                [&::-webkit-slider-thumb]:cursor-grab
                                [&::-webkit-slider-thumb]:active:cursor-grabbing
                                [&::-webkit-slider-thumb]:active:scale-125
                                [&::-webkit-slider-thumb]:transition-transform
                                [&::-moz-range-thumb]:pointer-events-auto
                                [&::-moz-range-thumb]:w-5
                                [&::-moz-range-thumb]:h-5
                                [&::-moz-range-thumb]:rounded-full
                                [&::-moz-range-thumb]:bg-white
                                [&::-moz-range-thumb]:border-2
                                [&::-moz-range-thumb]:border-rose-500
                                [&::-moz-range-thumb]:shadow-md
                                [&::-moz-range-thumb]:cursor-grab"
                              title={`Kéo mốc Bắt đầu (${formatSecondsToMMSS(startTime)})`}
                            />

                            {/* End Range Input (Solid rose circle thumb) */}
                            <input
                              type="range"
                              min={0}
                              max={maxDuration}
                              step={1}
                              value={endTime}
                              onChange={(e) => handleEndSliderChange(parseInt(e.target.value, 10))}
                              onPointerUp={(e) => handleEndSliderCommit(parseInt((e.target as HTMLInputElement).value, 10))}
                              onMouseUp={(e) => handleEndSliderCommit(parseInt((e.target as HTMLInputElement).value, 10))}
                              onTouchEnd={(e) => handleEndSliderCommit(parseInt((e.target as HTMLInputElement).value, 10))}
                              onKeyUp={(e) => handleEndSliderCommit(parseInt((e.target as HTMLInputElement).value, 10))}
                              className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none z-30
                                [&::-webkit-slider-thumb]:pointer-events-auto
                                [&::-webkit-slider-thumb]:w-5
                                [&::-webkit-slider-thumb]:h-5
                                [&::-webkit-slider-thumb]:rounded-full
                                [&::-webkit-slider-thumb]:bg-rose-600
                                [&::-webkit-slider-thumb]:border-2
                                [&::-webkit-slider-thumb]:border-white
                                [&::-webkit-slider-thumb]:shadow-md
                                [&::-webkit-slider-thumb]:cursor-grab
                                [&::-webkit-slider-thumb]:active:cursor-grabbing
                                [&::-webkit-slider-thumb]:active:scale-125
                                [&::-webkit-slider-thumb]:transition-transform
                                [&::-moz-range-thumb]:pointer-events-auto
                                [&::-moz-range-thumb]:w-5
                                [&::-moz-range-thumb]:h-5
                                [&::-moz-range-thumb]:rounded-full
                                [&::-moz-range-thumb]:bg-rose-600
                                [&::-moz-range-thumb]:border-2
                                [&::-moz-range-thumb]:border-white
                                [&::-moz-range-thumb]:shadow-md
                                [&::-moz-range-thumb]:cursor-grab"
                              title={`Kéo mốc Kết thúc (${formatSecondsToMMSS(endTime)})`}
                            />
                          </div>

                          {/* Quick Micro-Stepper Adjusters: Tinh chỉnh từng giây cực kỳ chính xác */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {/* Bắt đầu */}
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1.5 justify-between">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
                                  <span className="w-2.5 h-2.5 rounded-full border-2 border-rose-500 bg-rose-50 inline-block shrink-0" />
                                  <span className="whitespace-nowrap">Bắt đầu</span>
                                </span>
                                <span className="font-mono font-black text-xs text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/80 shrink-0">
                                  {formatSecondsToMMSS(startTime)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDiscreteRangeChange(Math.max(0, startTime - 5), endTime, true)}
                                  className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] cursor-pointer active:scale-95 transition-all"
                                  title="Lùi 5 giây"
                                >
                                  -5s
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDiscreteRangeChange(Math.min(endTime - 1, startTime + 5), endTime, true)}
                                  className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] cursor-pointer active:scale-95 transition-all"
                                  title="Tiến 5 giây"
                                >
                                  +5s
                                </button>
                              </div>
                            </div>

                            {/* Kết thúc */}
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-1.5 justify-between">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
                                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block shrink-0" />
                                  <span className="whitespace-nowrap">Kết thúc</span>
                                </span>
                                <span className="font-mono font-black text-xs text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                  {formatSecondsToMMSS(endTime)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDiscreteRangeChange(startTime, Math.max(startTime + 1, endTime - 5), true)}
                                  className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] cursor-pointer active:scale-95 transition-all"
                                  title="Lùi 5 giây"
                                >
                                  -5s
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDiscreteRangeChange(startTime, Math.min(maxDuration, endTime + 5), true)}
                                  className="flex-1 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] cursor-pointer active:scale-95 transition-all"
                                  title="Tiến 5 giây"
                                >
                                  +5s
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Presets row: CHỈ NHỮNG BÀI CÓ SẴN TRÊN HỆ THỐNG MỚI CÓ NÚT "ĐIỆP KHÚC" */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleDiscreteRangeChange(0, maxDuration, true)}
                              className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center text-center shadow-2xs ${
                                startTime === 0 && endTime === maxDuration
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <span>Toàn bộ bài (0:00 ➔ {formatSecondsToMMSS(maxDuration)})</span>
                            </button>

                            {/* NÚT ĐIỆP KHÚC: CHỈ HIỂN THỊ CHO BÀI CÓ SẴN TRÊN HỆ THỐNG */}
                            {isSystemSong && currentSong?.startSeconds && (
                              <button
                                type="button"
                                onClick={() => {
                                  const sec = currentSong.startSeconds || 0;
                                  const end = Math.min(maxDuration, sec + 45);
                                  handleDiscreteRangeChange(sec, end, true);
                                }}
                                className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center shadow-2xs ${
                                  startTime === currentSong.startSeconds
                                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-xs'
                                    : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                <span className="truncate">
                                  Điệp khúc ({formatSecondsToMMSS(currentSong.startSeconds)} ➔{' '}
                                  {formatSecondsToMMSS(Math.min(maxDuration, currentSong.startSeconds + 45))})
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {currentSong?.chorusLyric && isSystemSong && (
                      <p className="text-[11px] text-slate-600 italic font-serif bg-white/80 p-2.5 rounded-xl border border-rose-100/70 line-clamp-2">
                        "{currentSong.chorusLyric}"
                      </p>
                    )}
                  </div>
                );
              })()}

              <MusicLibraryModal
                isOpen={isMusicModalOpen}
                onClose={() => setIsMusicModalOpen(false)}
                currentPreset={config.musicPreset || 'anh-nang-cua-anh'}
                currentAudioUrl={config.audioUrl}
                audioStartTime={config.audioStartTime}
                onSelectSong={handleSelectSongFromModal}
                onSelectCustomUrl={handleSelectCustomUrl}
                onChangeAudioStartTime={(sec) => setConfig((prev) => ({ ...prev, audioStartTime: sec }))}
              />
            </div>

            {/* Passcode (Only if Passcode Envelope) */}
            {template.effectType === 'PASSCODE_ENVELOPE' && (
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Mật mã bí mật (4 số)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      maxLength={4}
                      value={config.passcode || '2010'}
                      onChange={(e) => updateConfig('passcode', e.target.value)}
                      placeholder="VD: 2010"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest text-center font-bold text-rose-600 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={config.passcodeHint || ''}
                      onChange={(e) => updateConfig('passcodeHint', e.target.value)}
                      placeholder="Gợi ý: Ngày kỷ niệm..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Crystal Carousel Customizer Options */}
            {template.effectType === 'CRYSTAL_CAROUSEL' && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                    <span>🔮</span>
                    <span>Tùy Chỉnh Hộp Nhạc & Quả Cầu Pha Lê</span>
                  </h3>
                  <span className="text-[10px] text-cyan-600 font-bold bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                    Hiệu ứng 3D
                  </span>
                </div>

                {/* 1. Theme Color Palette */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Ánh Hào Quang Pha Lê:</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'cyan', name: 'Băng Tuyết Dạ Quang', color: 'from-cyan-400 to-sky-600', icon: '💎' },
                      { id: 'purple', name: 'Dạ Nguyệt Thạch Anh', color: 'from-purple-400 to-fuchsia-600', icon: '🔮' },
                      { id: 'rose', name: 'Hồng Ngọc Tình Yêu', color: 'from-rose-400 to-pink-600', icon: '🌸' },
                      { id: 'gold', name: 'Hoàng Kim Quý Tộc', color: 'from-amber-300 to-yellow-600', icon: '👑' },
                      { id: 'midnight', name: 'Ngân Hà Tinh Tú', color: 'from-indigo-400 to-slate-800', icon: '🌌' },
                    ].map((t) => {
                      const isSelected = (config.crystalTheme || 'cyan') === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            soundFx.playPinClick();
                            updateConfig('crystalTheme', t.id);
                          }}
                          className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-50/80 ring-2 ring-cyan-400/30 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center text-xs shadow-xs shrink-0`}>
                            {t.icon}
                          </div>
                          <p className="text-[10px] font-bold text-slate-800 leading-tight">
                            {t.name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Centerpiece Selection */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <span>🌹</span>
                    <span>Vật Phẩm Trung Tâm Quả Cầu:</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'rose', name: 'Đóa Hồng Vĩnh Cửu', icon: '🌹' },
                      { id: 'swans', name: 'Đôi Thiên Nga', icon: '🦢' },
                      { id: 'heart', name: 'Trái Tim Kim Cương', icon: '💎' },
                      { id: 'castle', name: 'Lâu Đài Cổ Tích', icon: '🏰' },
                      { id: 'teddy', name: 'Gấu Băng Tuyết', icon: '🧸' },
                    ].map((c) => {
                      const isSelected = (config.crystalCenterpiece || 'rose') === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            soundFx.playPinClick();
                            updateConfig('crystalCenterpiece', c.id);
                          }}
                          className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-400/30 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                          }`}
                        >
                          <span className="text-base shrink-0">{c.icon}</span>
                          <span className="text-[10px] font-bold text-slate-800 leading-tight">
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Weather Particles Inside Dome */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <span>❄️</span>
                    <span>Khí Quyển & Hạt Bay Trong Quả Cầu:</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'snow', name: 'Bão Tuyết Lấp Lánh', icon: '❄️' },
                      { id: 'sparkles', name: 'Bụi Sao Thần Thoại', icon: '✨' },
                      { id: 'petals', name: 'Cánh Hoa Hồng Rơi', icon: '🌸' },
                      { id: 'hearts', name: 'Trái Tim Lơ Lửng', icon: '💖' },
                      { id: 'notes', name: 'Nốt Nhạc Du Dương', icon: '🎵' },
                    ].map((w) => {
                      const isSelected = (config.crystalWeather || 'snow') === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            soundFx.playPinClick();
                            updateConfig('crystalWeather', w.id);
                          }}
                          className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-400/30 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                          }`}
                        >
                          <span className="text-base shrink-0">{w.icon}</span>
                          <span className="text-[10px] font-bold text-slate-800 leading-tight">
                            {w.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Base Engraved Plaque */}
                <div className="space-y-2 pt-1">
                  <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <span>🏷️</span>
                    <span>Biển Đồng Khắc Chữ Trên Đế Gỗ Hộp Nhạc:</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-400 block mb-0.5">Tiêu đề biển đồng:</span>
                      <input
                        type="text"
                        value={config.crystalBaseTitle ?? 'HỘP NHẠC PHA LÊ'}
                        onChange={(e) => updateConfig('crystalBaseTitle', e.target.value)}
                        placeholder="VD: HỘP NHẠC PHA LÊ"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-amber-900 bg-amber-50/40 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block mb-0.5">Dòng chữ tặng:</span>
                      <input
                        type="text"
                        value={config.crystalBaseSubtitle ?? `Dành tặng ${config.recipientName || 'Công Chúa Của Anh'}`}
                        onChange={(e) => updateConfig('crystalBaseSubtitle', e.target.value)}
                        placeholder="VD: Dành tặng Em Yêu..."
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Card Preview */}
        <div
          className={`md:col-span-7 lg:col-span-7 sticky top-24 ${
            mobileTab === 'edit' ? 'hidden md:block' : 'block'
          }`}
        >
          <div className="bg-slate-900 rounded-3xl p-3 sm:p-5 shadow-2xl border border-slate-800">
            {/* Header info bar */}
            <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-800/80 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>Xem trước trải nghiệm người nhận</span>
              </span>
              <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded-md text-slate-400">
                Tương tác trực tiếp bên dưới
              </span>
            </div>

            {/* Viewport Frame */}
            <div className="h-[620px] sm:h-[660px] md:h-[700px] rounded-2xl overflow-hidden mt-3 relative bg-slate-950 shadow-inner">
              <EffectRenderer
                effectType={template.effectType}
                config={config}
                mode="recipient"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preset Wishes Modal */}
      {showWishPresets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Kho Lời Chúc Mẫu 20/10</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowWishPresets(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'crush', label: 'Người yêu / Crush' },
                { id: 'mom', label: 'Mẹ kính yêu' },
                { id: 'wife', label: 'Vợ yêu' },
                { id: 'teacher', label: 'Cô giáo' },
                { id: 'colleague', label: 'Đồng nghiệp' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setWishTarget(t.id as any)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    wishTarget === t.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* List of Wishes */}
            <div className="space-y-2.5">
              {PRESET_WISHES.filter((w) => w.target === wishTarget).map((w) => (
                <div
                  key={w.id}
                  onClick={() => handleSelectWish(w.text, w.label)}
                  className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-purple-400 hover:bg-purple-50/50 cursor-pointer transition-all space-y-1 group"
                >
                  <p className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
                    {w.label}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{w.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share / Send Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-100 text-center relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-md">
              <Share2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Thiệp Của Bạn Đã Sẵn Sàng!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Gửi mã QR hoặc đường link này qua Zalo, Messenger hoặc iMessage cho người nhận.
              </p>
            </div>

            {/* Share Tab Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setShareTab('qr')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  shareTab === 'qr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Mã QR Thiệp</span>
              </button>
              <button
                onClick={() => setShareTab('link')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  shareTab === 'link' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Copy className="w-4 h-4" />
                <span>Đường Dẫn Trực Tiếp</span>
              </button>
            </div>

            {shareTab === 'qr' ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center space-y-3">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <QRCodeSVG id="studio-qr-svg" value={shareUrl} size={180} />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Người nhận quét camera là mở thiệp ngay lập tức
                </p>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải ảnh mã QR (PNG) về máy</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
                  <p className="text-[11px] font-mono text-slate-600 truncate">
                    {shareUrl}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Đã sao chép link!' : 'Sao chép đường link'}</span>
                </button>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <Link
                to={`/card/${encodedSlug}`}
                target="_blank"
                className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 mx-auto"
              >
                <span>Mở xem thử như người nhận</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
