import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  ArrowRight,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TEMPLATES, type CardConfig } from '../types';
import EffectRenderer from '../components/effects/EffectRenderer';
import {
  decodeCardData,
  incrementCardViews,
  getCardById,
  fetchCardById,
  incrementTemplateView,
  toggleTemplateHeart,
  isTemplateLikedByUser,
  getTemplateLiveStats,
  formatStat,
} from '../utils/cardStorage';
import { soundFx } from '../utils/soundEffects';
import { useAuth } from '../context/AuthContext';
import { getSongById, getSongCoverUrl } from '../data/vietnameseMusic';

export default function CardViewer() {
  const params = useParams();
  const cardId = params['*'] ? (params.cardId ? `${params.cardId}/${params['*']}` : params['*']) : params.cardId;
  const { user, openAuthModal } = useAuth();
  const [replayKey, setReplayKey] = useState(0);
  const [isMuted, setIsMuted] = useState(soundFx.isMuted);
  const [isCapturing, setIsCapturing] = useState(false);

  const cardContainerRef = useRef<HTMLDivElement>(null);

  const TEMPLATE_ALIASES: Record<string, string> = {
    'galaxy-3d': 'galaxy-memories',
    'galaxy': 'galaxy-memories',
    'blossom': 'blossom-rain',
    'petal-rain': 'blossom-rain',
    'scratch': 'scratch-vintage',
    'scratch-card': 'scratch-vintage',
    'lantern': 'lantern-festival',
    'lantern-3d': 'lantern-festival',
    'vinyl': 'vinyl-record',
    'vinyl-player': 'vinyl-record',
    'crystal': 'crystal-carousel',
    'carousel': 'crystal-carousel',
    'film': 'cinema-film',
    'cinema': 'cinema-film',
    'bouquet': 'rose-bouquet',
    'bouquet-3d': 'rose-bouquet',
  };

  const resolveTemplate = (rawId: string) => {
    const cleanId = (rawId || '').replace(/^demo-/, '');
    const mappedId = TEMPLATE_ALIASES[cleanId] || cleanId;
    return TEMPLATES.find((t) => t.id === mappedId || t.id === cleanId) || TEMPLATES[0];
  };

  // Check if viewing in demo mode (from template store) vs shared recipient card
  const isDemo = Boolean(cardId && cardId.startsWith('demo-'));

  // Initial synchronous decoding
  let initialTemplateId = 'passcode-envelope';
  let initialConfig: CardConfig = { ...TEMPLATES[0].defaultConfig, images: [] };
  let resolvedCardId = cardId || 'demo-passcode-envelope';

  if (cardId?.startsWith('c_')) {
    const decoded = decodeCardData(cardId, TEMPLATES[0]);
    initialTemplateId = decoded.templateId;
    initialConfig = decoded.config;
    if (decoded.cardId) resolvedCardId = decoded.cardId;
  } else if (cardId?.startsWith('lc_')) {
    const stored = getCardById(cardId);
    if (stored) {
      initialTemplateId = stored.templateId;
      initialConfig = stored.cardData;
      resolvedCardId = stored.id;
    }
  } else {
    const found = resolveTemplate(cardId || '');
    initialTemplateId = found.id;
    initialConfig = { ...found.defaultConfig, images: [] };
  }

  const [activeTemplateId, setActiveTemplateId] = useState<string>(initialTemplateId);
  const [activeConfig, setActiveConfig] = useState<CardConfig>(initialConfig);
  const [isLoadingCard, setIsLoadingCard] = useState<boolean>(() => {
    if (resolvedCardId?.startsWith('lc_')) {
      return !getCardById(resolvedCardId);
    }
    return false;
  });

  const template = resolveTemplate(activeTemplateId);

  // Fetch full card data with user-uploaded images from Supabase Cloud / Oracle 19c
  useEffect(() => {
    let isCurrent = true;
    async function loadCardFromRemote() {
      if (resolvedCardId) {
        try {
          const remote = await fetchCardById(resolvedCardId);
          if (remote && isCurrent) {
            setActiveTemplateId(remote.templateId);
            setActiveConfig(remote.cardData);
          }
        } finally {
          if (isCurrent) {
            setIsLoadingCard(false);
          }
        }
      }
    }
    loadCardFromRemote();
    return () => {
      isCurrent = false;
    };
  }, [resolvedCardId]);

  // Strictly controlled like state per user account
  const [hasLiked, setHasLiked] = useState<boolean>(() =>
    isTemplateLikedByUser(template.id, user ? user.id : null)
  );

  // Live real hearts count from storage
  const [heartsCount, setHeartsCount] = useState<number>(() =>
    getTemplateLiveStats(template.id).hearts
  );

  // Sync like state and live heart count when user or template changes
  useEffect(() => {
    setHasLiked(isTemplateLikedByUser(template.id, user ? user.id : null));
    setHeartsCount(getTemplateLiveStats(template.id).hearts);

    const handleStatsChange = () => {
      setHasLiked(isTemplateLikedByUser(template.id, user ? user.id : null));
      setHeartsCount(getTemplateLiveStats(template.id).hearts);
    };
    window.addEventListener('template_stats_changed', handleStatsChange);

    return () => {
      window.removeEventListener('template_stats_changed', handleStatsChange);
    };
  }, [user, template.id]);

  // Auto-increment view count on mount & initialize background music
  useEffect(() => {
    if (resolvedCardId) {
      incrementCardViews(resolvedCardId);
    }
    if (template?.id) {
      incrementTemplateView(template.id);
    }

    // Reset trạng thái mute để thiệp luôn có âm thanh và SFX sống động
    soundFx.setMuted(false);
    setIsMuted(false);

    // Start background music preset if configured
    if (activeConfig.musicPreset || activeConfig.audioUrl) {
      soundFx.startBackgroundMusic(
        activeConfig.musicPreset,
        activeConfig.audioUrl,
        activeConfig.audioStartTime || 0,
        activeConfig.audioEndTime
      );
    }

    return () => {
      soundFx.stopBackgroundMusic();
      soundFx.setMuted(false);
    };
  }, [
    resolvedCardId,
    template?.id,
    activeConfig.musicPreset,
    activeConfig.audioUrl,
    activeConfig.audioStartTime,
    activeConfig.audioEndTime,
  ]);

  // Handle Recipient Heart Reaction (Drops hearts with delightful confetti; syncs to account or guest storage)
  const handleHeartReaction = async () => {
    soundFx.playHeartPop();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.8 },
    });

    try {
      const res = await toggleTemplateHeart(template.id, user ? user.id : 'guest');
      setHasLiked(res.isLiked);
      setHeartsCount(res.newHearts);
    } catch (err) {
      console.warn('Lỗi lưu tim:', err);
    }
  };

  // Handle Mute/Unmute toggle for music pill
  const handleToggleMute = () => {
    const nextMuted = soundFx.toggleMute();
    setIsMuted(nextMuted);
  };

  if (isLoadingCard) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center text-white px-4">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
          <Sparkles className="w-6 h-6 text-rose-400 absolute inset-0 m-auto animate-pulse" />
        </div>
        <h2 className="text-lg font-bold bg-gradient-to-r from-rose-300 via-pink-200 to-amber-200 bg-clip-text text-transparent">
          Đang mở thiệp yêu thương...
        </h2>
        <p className="text-xs text-slate-400 mt-2">
          Đang tải lời chúc & khoảnh khắc ý nghĩa dành riêng cho bạn ✨
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between overflow-x-hidden">
      {/* Floating Ambient Controls Bar */}
      <header className="fixed top-4 inset-x-4 sm:inset-x-8 z-40 flex items-center justify-between pointer-events-none max-w-6xl mx-auto gap-2">
        {isDemo ? (
          <Link
            to="/templates"
            className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/15 text-xs sm:text-sm font-semibold transition-all shadow-lg active:scale-95 shrink-0"
            title="Quay lại danh sách mẫu"
          >
            <span className="text-rose-400">✨</span>
            <span className="hidden xs:inline">LoveCard 20/10</span>
          </Link>
        ) : (
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 text-xs sm:text-sm font-semibold shadow-lg select-none shrink-0">
            <span className="text-rose-400">✨</span>
            <span className="hidden xs:inline">LoveCard 20/10</span>
          </div>
        )}

        {/* Center Music Pill: Hiển thị đẹp mắt trên cả Mobile lẫn Máy tính */}
        {(() => {
          const song = soundFx.getCurrentSong() || getSongById(activeConfig.musicPreset || '');
          if (!song && !activeConfig.musicPreset) return null;
          return (
            <div
              onClick={handleToggleMute}
              className={`pointer-events-auto flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full backdrop-blur-xl border transition-all shadow-lg select-none cursor-pointer max-w-[210px] sm:max-w-none ${
                isMuted
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  : 'bg-black/60 hover:bg-black/80 border-white/20 text-white'
              }`}
              title={isMuted ? 'Bấm để bật nhạc' : 'Bấm để tắt âm'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <img
                src={getSongCoverUrl(song)}
                alt=""
                className="w-4 h-4 rounded-full object-cover shrink-0 border border-white/30 hidden xs:inline"
              />
              <span className="font-bold text-[11px] sm:text-xs truncate max-w-[90px] sm:max-w-[140px]">
                {activeConfig.audioUrl ? (song?.title ? `${song.title} (MP3)` : 'Bài Hát MP3') : (song?.title || 'Giai điệu lãng mạn')}
              </span>
              <span className="text-slate-400 text-[10px] hidden sm:inline">•</span>
              <span className="text-slate-300 text-[11px] truncate max-w-[100px] hidden sm:inline">
                {activeConfig.audioUrl ? 'Bản Thu Gốc' : (song?.artist || 'LoveCard')}
              </span>
              {!isMuted ? (
                <span className="flex items-end gap-0.5 h-2.5 ml-0.5 sm:ml-1 shrink-0">
                  <span className="w-0.5 h-full bg-rose-400 animate-bounce" />
                  <span className="w-0.5 h-1.5 bg-rose-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-0.5 h-2 bg-rose-400 animate-bounce [animation-delay:0.4s]" />
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-rose-300 shrink-0">Tắt</span>
              )}
            </div>
          );
        })()}
      </header>

      {/* Main Interactive Stage Area */}
      <main
        ref={cardContainerRef}
        key={replayKey}
        className={`w-full flex-1 flex items-center justify-center px-1 sm:px-4 ${
          isDemo ? 'pt-14 pb-16 sm:pt-20 sm:pb-28' : 'pt-14 pb-4 sm:pt-16 sm:pb-6'
        }`}
      >
        <div
          className={`w-full max-w-4xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative border border-white/10 bg-slate-950 transform-gpu ${
            isDemo
              ? 'h-[calc(100dvh-7.5rem)] sm:h-[84vh] min-h-[460px] sm:min-h-[580px] max-h-[860px]'
              : 'h-[calc(100dvh-4.5rem)] sm:h-[88vh] min-h-[480px] sm:min-h-[600px] max-h-[900px]'
          }`}
          style={{ contain: 'layout paint' }}
        >
          <EffectRenderer
            effectType={template.effectType}
            config={activeConfig}
            mode="recipient"
          />
        </div>
      </main>

      {/* Bottom Floating Action Dock: CHỈ hiển thị khi xem thử mẫu (Demo), KHÔNG hiển thị ở link gửi cho người nhận */}
      {isDemo && (
        <footer className="fixed bottom-4 inset-x-4 sm:inset-x-8 z-40 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto px-4 py-2 sm:py-2.5 rounded-full bg-slate-900/80 backdrop-blur-2xl border border-white/15 shadow-2xl flex items-center gap-3 sm:gap-6">
            {/* Heart Button */}
            <button
              onClick={handleHeartReaction}
              title="Thả tim yêu thương"
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-90 cursor-pointer ${
                hasLiked
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <motion.div whileTap={{ scale: 1.4 }}>
                <Heart
                  className={`w-4 h-4 ${
                    hasLiked ? 'text-rose-500 fill-rose-500' : 'text-slate-400'
                  }`}
                />
              </motion.div>
              <span>{formatStat(heartsCount)}</span>
            </button>

            <div className="h-4 w-px bg-white/20" />
            <Link
              to={`/studio/${template.id}`}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Tự tạo thiệp của bạn</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-400 ml-0.5" />
            </Link>
          </div>
        </footer>
      )}
    </div>
  );
}
