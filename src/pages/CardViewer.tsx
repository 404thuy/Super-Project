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
import { TEMPLATES, resolveTemplate, type CardConfig } from '../types';
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
import { resolvePlayableAudioUrl } from '../utils/userMusicStorage';

export default function CardViewer() {
  const params = useParams();
  const rawParam = params['*'] ? (params.cardId ? `${params.cardId}/${params['*']}` : params['*']) : params.cardId;
  // Bóc tách ID sạch sẽ: loại bỏ query params (?fbclid=...), hash (#...), trailing slashes
  const cleanParam = (rawParam || '').split('?')[0].split('#')[0].trim().replace(/\/+$/, '');
  const cardId = cleanParam ? decodeURIComponent(cleanParam) : '';

  const { user, openAuthModal } = useAuth();
  const [replayKey, setReplayKey] = useState(0);
  const [isMuted, setIsMuted] = useState(soundFx.isMuted);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lookupCode, setLookupCode] = useState<string>('');
  const [customTrackInfo, setCustomTrackInfo] = useState<{ title?: string; artist?: string } | null>(null);

  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Check if viewing in demo mode (from template store) vs shared recipient card
  const isDemo = Boolean(cardId && cardId.startsWith('demo-'));

  // Initial synchronous decoding
  let initialTemplateId = 'passcode-envelope';
  let initialConfig: CardConfig = { ...TEMPLATES[0].defaultConfig, images: [] };
  let resolvedCardId = cardId || 'demo-passcode-envelope';

  if (cardId?.startsWith('c_') || cardId?.includes('/')) {
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
    // Nếu là c_... (tự chứa toàn bộ dữ liệu & mẫu) hoặc demo/template trực tiếp -> KHÔNG BAO GIỜ BLOCK LOADING
    if (cardId?.startsWith('c_') || cardId?.startsWith('demo-') || !cardId?.startsWith('lc_')) {
      return false;
    }
    // Chỉ bật loading spinner nếu là mã ngắn lc_... và chưa có trong local cache
    return !getCardById(resolvedCardId);
  });

  const template = resolveTemplate(activeTemplateId);

  // Fetch full card data with user-uploaded images from Supabase Cloud / Oracle 19c
  useEffect(() => {
    let isCurrent = true;
    async function loadCardFromRemote() {
      // Chỉ fetch remote nếu có cardId cụ thể (lc_ hoặc id bên trong c_)
      if (resolvedCardId && (resolvedCardId.startsWith('lc_') || cardId?.startsWith('c_'))) {
        try {
          // Thử tối đa 3 lần với khoảng cách 1.2s để chống độ trễ mạng và độ trễ ghi Supabase
          let remote: CreatedCard | null = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            if (!isCurrent) break;
            remote = await Promise.race([
              fetchCardById(resolvedCardId),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 7000)),
            ]);
            if (remote) break;
            // Chờ trước khi thử lại
            await new Promise((r) => setTimeout(r, 1200));
          }

          if (remote && isCurrent) {
            setActiveTemplateId(remote.templateId);
            setActiveConfig((prev) => ({
              ...prev,
              ...remote.cardData,
              // Giữ lại hoặc hợp nhất ảnh từ database nếu có
              images: (remote.cardData?.images && remote.cardData.images.length > 0)
                ? remote.cardData.images
                : (remote.cardData?.images || prev.images || []),
            }));
            setLoadError(null);
          } else if (!remote && isCurrent) {
            // Nếu là dạng c_... đã decode lời chúc thành công, TUYỆT ĐỐI KHÔNG BÁO LỖI!
            if (!cardId?.startsWith('c_') && resolvedCardId.startsWith('lc_') && !getCardById(resolvedCardId)) {
              setLoadError('Không tìm thấy thông tin thiệp hoặc mã thẻ chưa sẵn sàng. Người gửi có thể chưa bấm "Hoàn tất & Gửi thiệp".');
            }
          }
        } catch {
          if (isCurrent && !cardId?.startsWith('c_') && resolvedCardId.startsWith('lc_') && !getCardById(resolvedCardId)) {
            setLoadError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
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
  }, [resolvedCardId, cardId]);

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

    // Không vội phát nhạc khi thẻ đang tải từ remote database để tránh phát nhầm mẫu mặc định
    if (isLoadingCard) return;

    let isCurrent = true;

    async function initMusic() {
      let finalAudioUrl = activeConfig.audioUrl;

      // Hồi sinh nhạc người dùng tải lên từ IndexedDB hoặc DataURL vĩnh viễn
      if (activeConfig.musicPreset?.startsWith('user-audio-') || activeConfig.audioUrl?.startsWith('blob:') || activeConfig.audioUrl?.startsWith('data:')) {
        const resolved = await resolvePlayableAudioUrl(activeConfig.musicPreset, activeConfig.audioUrl);
        if (isCurrent) {
          if (resolved.audioUrl) {
            finalAudioUrl = resolved.audioUrl;
          }
          if (resolved.songTitle || resolved.artist) {
            setCustomTrackInfo({ title: resolved.songTitle, artist: resolved.artist });
          }
        }
      }

      // Nếu không có audioUrl nhưng có musicPreset từ kho nhạc
      if (!finalAudioUrl && activeConfig.musicPreset) {
        const matched = getSongById(activeConfig.musicPreset);
        if (matched?.audioUrl) {
          finalAudioUrl = matched.audioUrl;
        }
      }

      // Cập nhật thông tin bài hát lên thanh phát nếu chưa có
      if (activeConfig.musicPreset) {
        const song = getSongById(activeConfig.musicPreset);
        if (song) {
          setCustomTrackInfo({ title: song.title, artist: song.artist });
        }
      }

      if (!isCurrent) return;

      if (activeConfig.musicPreset || finalAudioUrl) {
        soundFx.startBackgroundMusic(
          activeConfig.musicPreset,
          finalAudioUrl,
          activeConfig.audioStartTime || 0,
          activeConfig.audioEndTime
        );
      }
    }

    initMusic();

    return () => {
      isCurrent = false;
      soundFx.stopBackgroundMusic();
      soundFx.setMuted(false);
    };
  }, [
    isLoadingCard,
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
    soundFx.resumeAudioContext();
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

  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center text-white px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-2xl mb-4">
          💌
        </div>
        <h2 className="text-lg font-bold text-rose-300 max-w-md">
          {loadError}
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          Mã thẻ hoặc đường dẫn có thể chưa được kích hoạt hoặc đã bị thay đổi.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tải lại
          </button>
          <Link
            to="/templates"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
          >
            Xem kho mẫu thiệp
          </Link>
        </div>

        {/* Ô nhập mã thiệp trực tiếp để người nhận dễ dàng dán mã */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = lookupCode.trim().replace(/^.*\/card\//, '').split('?')[0].split('#')[0].replace(/\/+$/, '');
            if (val) {
              window.location.href = `/card/${encodeURIComponent(val)}`;
            }
          }}
          className="mt-6 w-full max-w-xs flex items-center gap-2"
        >
          <input
            type="text"
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value)}
            placeholder="Hoặc dán mã thiệp (VD: lc_...)"
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-rose-400 font-mono"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
          >
            Mở thiệp
          </button>
        </form>
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
          if (!song && !activeConfig.musicPreset && !activeConfig.audioUrl) return null;
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
                {customTrackInfo?.title || song?.title || 'Giai điệu lãng mạn'}
              </span>
              <span className="text-slate-400 text-[10px] hidden sm:inline">•</span>
              <span className="text-slate-300 text-[11px] truncate max-w-[100px] hidden sm:inline">
                {customTrackInfo?.artist || song?.artist || 'LoveCard'}
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
        className={`w-full flex-1 flex items-center justify-center px-2.5 sm:px-4 ${
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
