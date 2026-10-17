import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  ArrowRight,
  Volume2,
  VolumeX,
  RotateCcw,
  Camera,
  Sparkles,
} from 'lucide-react';
import html2canvas from 'html2canvas';
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

export default function CardViewer() {
  const { cardId } = useParams<{ cardId: string }>();
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

  const template = resolveTemplate(activeTemplateId);

  // Fetch full card data with user-uploaded images from Oracle 19c
  useEffect(() => {
    let isCurrent = true;
    async function loadCardFromOracle() {
      if (resolvedCardId) {
        const remote = await fetchCardById(resolvedCardId);
        if (remote && isCurrent) {
          setActiveTemplateId(remote.templateId);
          setActiveConfig(remote.cardData);
        }
      }
    }
    loadCardFromOracle();
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
  }, [user, template.id]);

  // Auto-increment view count on mount & initialize background music
  useEffect(() => {
    if (resolvedCardId) {
      incrementCardViews(resolvedCardId);
    }
    if (template?.id) {
      incrementTemplateView(template.id);
    }

    // Start background music preset if configured
    if (activeConfig.musicPreset || activeConfig.audioUrl) {
      soundFx.startBackgroundMusic(activeConfig.musicPreset, activeConfig.audioUrl);
    }

    return () => {
      soundFx.stopBackgroundMusic();
    };
  }, [resolvedCardId, template?.id, activeConfig.musicPreset, activeConfig.audioUrl]);

  // Handle Mute/Unmute toggle
  const handleToggleMute = () => {
    const nextMuted = soundFx.toggleMute();
    setIsMuted(nextMuted);
  };

  // Handle Replay Effect
  const handleReplay = () => {
    soundFx.playPaperSwoosh();
    setReplayKey((prev) => prev + 1);
  };

  // Handle Recipient Heart Reaction (1 heart per user account, toggles like/unlike, saves to history)
  const handleHeartReaction = async () => {
    if (!user) {
      soundFx.playPinClick();
      openAuthModal();
      return;
    }

    const res = await toggleTemplateHeart(template.id, user.id);
    setHasLiked(res.isLiked);
    setHeartsCount(res.newHearts);

    if (res.isLiked) {
      soundFx.playHeartPop();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.8 },
      });
    } else {
      soundFx.playPinClick();
    }
  };

  // Handle Capture & Download Screenshot
  const handleCaptureCard = async () => {
    if (!cardContainerRef.current) return;
    setIsCapturing(true);
    soundFx.playSuccessChime();

    try {
      const canvas = await html2canvas(cardContainerRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: null,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `LoveCard-${activeConfig.recipientName || '20-10'}.png`;
      link.click();
    } catch (err) {
      console.error('Lỗi khi chụp màn hình thiệp:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between overflow-x-hidden">
      {/* Floating Ambient Controls Bar */}
      <header className="fixed top-4 inset-x-4 sm:inset-x-8 z-40 flex items-center justify-between pointer-events-none max-w-6xl mx-auto">
        <Link
          to="/"
          className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/15 text-xs sm:text-sm font-semibold transition-all shadow-lg active:scale-95"
        >
          <span className="text-rose-400">✨</span>
          <span>LoveCard 20/10</span>
        </Link>

        {/* Right utility buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Replay Effect */}
          <button
            onClick={handleReplay}
            title="Xem lại từ đầu"
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/15 text-white transition-all shadow-lg active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Sound Mute/Unmute */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/15 text-white transition-all shadow-lg active:scale-95"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Capture screenshot */}
          <button
            onClick={handleCaptureCard}
            disabled={isCapturing}
            title="Lưu ảnh kỷ niệm"
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/15 text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Camera className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </header>

      {/* Main Interactive Stage Area */}
      <main
        ref={cardContainerRef}
        key={replayKey}
        className="w-full flex-1 flex items-center justify-center pt-20 pb-28 px-2 sm:px-4"
      >
        <div className="w-full max-w-4xl mx-auto h-[78vh] min-h-[580px] max-h-[820px] rounded-3xl overflow-hidden shadow-2xl relative border border-white/10 bg-slate-900/50 backdrop-blur-sm">
          <EffectRenderer
            effectType={template.effectType}
            config={activeConfig}
            mode="recipient"
          />
        </div>
      </main>

      {/* Bottom Floating Action Dock */}
      <footer className="fixed bottom-4 inset-x-4 sm:inset-x-8 z-40 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto px-4 py-2.5 rounded-full bg-slate-900/80 backdrop-blur-2xl border border-white/15 shadow-2xl flex items-center gap-3 sm:gap-6">
          {/* Heart Button */}
          <button
            onClick={handleHeartReaction}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-90 ${
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

          {/* CTA: Make your own card */}
          <Link
            to="/templates"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Tự tạo thiệp của bạn</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400 ml-0.5" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
