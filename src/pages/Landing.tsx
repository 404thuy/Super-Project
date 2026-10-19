import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Sparkles,
  ArrowRight,
  Gift,
  Music,
  Lock,
  Eye,
  Share2,
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sparkle,
  ShieldCheck,
  QrCode,
  Volume2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TEMPLATES, type CardTemplate } from '../types';
import TemplateThumbnail from '../components/TemplateThumbnail';
import {
  formatStat,
  getTemplateLiveStats,
  getUserLikedTemplateIds,
  toggleTemplateHeart,
  fetchLiveTemplateStats,
} from '../utils/cardStorage';
import { soundFx } from '../utils/soundEffects';
import { PRESET_WISHES } from '../utils/presetWishes';
import { useAuth } from '../context/AuthContext';

type TemplateCategoryFilter = 'all' | '20-10' | 'love' | 'birthday' | 'gratitude' | 'friends';

export default function Landing() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const [likedTemplateIds, setLikedTemplateIds] = useState<string[]>(() =>
    getUserLikedTemplateIds(user ? user.id : null)
  );
  const [, setHeartVersion] = useState(0);

  // Template Category Filter State
  const [activeCategory, setActiveCategory] = useState<TemplateCategoryFilter>('all');

  // Hero Interactive Demo State
  const [heroTab, setHeroTab] = useState<'passcode' | 'blossom' | 'vinyl'>('passcode');

  // Hero Passcode State
  const [heroPin, setHeroPin] = useState('');
  const [heroUnlocked, setHeroUnlocked] = useState(false);
  const [heroShake, setHeroShake] = useState(false);

  // Hero Blossom State
  const [blossomCount, setBlossomCount] = useState(0);

  // Hero Vinyl State
  const [isVinylPlaying, setIsVinylPlaying] = useState(false);

  // Wish Generator State
  const [activeWishTarget, setActiveWishTarget] = useState<'mom' | 'wife' | 'crush' | 'teacher' | 'colleague'>('wife');
  const [copiedWishId, setCopiedWishId] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    async function syncStats() {
      const data = await fetchLiveTemplateStats();
      if (isCurrent) {
        setLikedTemplateIds(data.likedTemplateIds);
        setHeartVersion((v) => v + 1);
      }
    }
    syncStats();

    const handleStatsChange = () => {
      if (isCurrent) {
        setLikedTemplateIds(getUserLikedTemplateIds(user ? user.id : null));
        setHeartVersion((v) => v + 1);
      }
    };
    window.addEventListener('template_stats_changed', handleStatsChange);

    return () => {
      isCurrent = false;
      window.removeEventListener('template_stats_changed', handleStatsChange);
    };
  }, [user]);

  // Handle heart toggle with sound & auth check
  const handleToggleHeart = async (templateId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      soundFx.playPinClick();
      openAuthModal();
      return;
    }

    const res = await toggleTemplateHeart(templateId, user.id);
    if (res.isLiked) {
      soundFx.playHeartPop();
    } else {
      soundFx.playPinClick();
    }

    setLikedTemplateIds(getUserLikedTemplateIds(user.id));
    setHeartVersion((v) => v + 1);
  };

  // Hero Keypad Click
  const handleHeroKey = (num: string) => {
    if (heroUnlocked) return;
    soundFx.playPinClick();
    const nextPin = heroPin + num;
    setHeroPin(nextPin);

    if (nextPin.length === 4) {
      if (nextPin === '2010') {
        unlockHeroDemo();
      } else {
        setHeroShake(true);
        setTimeout(() => {
          setHeroShake(false);
          setHeroPin('');
        }, 500);
      }
    }
  };

  const unlockHeroDemo = () => {
    soundFx.playWaxSealBreak();
    soundFx.playHeartPop();
    setHeroPin('2010');
    setHeroUnlocked(true);
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#FB7185', '#F43F5E', '#C084FC', '#FBBF24', '#38BDF8'],
    });
  };

  const resetHeroDemo = () => {
    soundFx.playPinClick();
    setHeroUnlocked(false);
    setHeroPin('');
  };

  // Hero Blossom Burst
  const triggerBlossomBurst = () => {
    soundFx.playHeartPop();
    setBlossomCount((c) => c + 1);
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0.2, y: 0.7 },
      colors: ['#FDA4AF', '#FB7185', '#F472B6', '#FBCFE8'],
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 0.8, y: 0.7 },
      colors: ['#FDA4AF', '#FB7185', '#F472B6', '#FBCFE8'],
    });
  };

  // Hero Vinyl Preview Toggle
  const toggleHeroVinyl = () => {
    if (!isVinylPlaying) {
      soundFx.playHeartPop();
      soundFx.playMusicPreset('romantic-piano');
      setIsVinylPlaying(true);
    } else {
      soundFx.stopBackgroundMusic();
      setIsVinylPlaying(false);
    }
  };

  // Copy Wish Text
  const handleCopyWish = (wishId: string, text: string) => {
    soundFx.playPinClick();
    navigator.clipboard.writeText(text);
    setCopiedWishId(wishId);
    setTimeout(() => {
      setCopiedWishId(null);
    }, 2200);
  };

  // Use Wish in Studio
  const handleUseWish = (text: string, target: string) => {
    soundFx.playHeartPop();
    const recipientMap: Record<string, string> = {
      mom: 'Mẹ kính yêu',
      wife: 'Vợ yêu',
      crush: 'Em yêu',
      teacher: 'Cô giáo kính yêu',
      colleague: 'Bạn thân mến',
    };
    navigate('/studio/passcode-envelope', {
      state: {
        wishText: text,
        recipientName: recipientMap[target] || 'Người Phụ Nữ Tuyệt Vời',
      },
    });
  };

  // Filter Templates
  const filteredTemplates = TEMPLATES.filter((tmpl) => {
    if (activeCategory === 'all') return true;
    return tmpl.category === activeCategory;
  });

  // Wishes for current tab
  const currentWishes = PRESET_WISHES.filter((w) => w.target === activeWishTarget);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/70 via-slate-50 to-purple-50/50 relative overflow-x-hidden">
      {/* ========================================================
          AMBIENT LAYERED ROMANTIC GLOWS & FLOATING PARTICLES
          ======================================================== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full opacity-35 blur-3xl animate-pulse-subtle"
          style={{ background: 'radial-gradient(circle, #fecdd3, #e879f9, transparent 70%)' }}
        />
        <div
          className="absolute top-1/4 -right-36 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #bae6fd, #ddd6fe, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-[700px] h-[700px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #fed7aa, #fbcfe8, transparent 70%)' }}
        />
        {/* Subtle Floating Petals / Sparks */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-[15%] left-[8%] animate-float text-xl select-none">🌸</div>
          <div className="absolute top-[30%] right-[10%] animate-float [animation-delay:1.5s] text-lg select-none">✨</div>
          <div className="absolute top-[60%] left-[5%] animate-float [animation-delay:2.5s] text-base select-none">🌹</div>
          <div className="absolute top-[75%] right-[7%] animate-float [animation-delay:3.5s] text-xl select-none">💖</div>
          <div className="absolute top-[45%] right-[4%] animate-float [animation-delay:0.8s] text-sm select-none">🌷</div>
        </div>
      </div>

      {/* ========================================================
          HERO SECTION (High-Impact 2-Column Balanced Design)
          ======================================================== */}
      <section className="relative z-10 pt-20 pb-12 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Emotion, Hook & CTAs */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-8 text-center lg:text-left">
            
            {/* Festival Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full badge-festive shadow-sm"
            >
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-rose-600" />
              </span>
              <span className="text-[11px] sm:text-sm font-extrabold text-rose-700 tracking-wide flex items-center gap-1.5">
                <span>🌹 Chào Mừng 20/10 • Ngày Phụ Nữ Việt Nam</span>
              </span>
            </motion.div>

            {/* Headline */}
            <div className="space-y-2 sm:space-y-4">
              <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.25]">
                Gửi Lời Yêu Thương Qua{' '}
                <span className="bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Thiệp Tương Tác
                </span>{' '}
                Sống Động
              </h1>
              <p className="text-xs sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Đừng để ngày 20/10 trôi qua với những bức ảnh tĩnh vô hồn. Tạo thiệp kỹ thuật số đầy cảm xúc với{' '}
                <strong className="text-purple-700 font-bold">mật mã bí mật</strong>,{' '}
                <strong className="text-indigo-600 font-bold">ngân hà 3D 360°</strong>,{' '}
                <strong className="text-rose-600 font-bold">mưa cánh hoa</strong> và{' '}
                <strong className="text-amber-600 font-bold">đĩa than hoài niệm</strong>.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-3.5 pt-1">
              <Link to="/templates" className="w-full sm:w-auto">
                <button
                  onClick={() => soundFx.playHeartPop()}
                  className="w-full sm:w-auto px-5 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-extrabold text-xs sm:text-base shadow-xl shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 group"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
                  <span>Khám Phá Mẫu Thiệp 20/10</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/studio/passcode-envelope" className="w-full sm:w-auto">
                <button
                  onClick={() => soundFx.playPinClick()}
                  className="w-full sm:w-auto px-5 py-3 sm:px-7 sm:py-4 rounded-xl sm:rounded-2xl bg-white/90 hover:bg-white text-slate-800 font-bold text-xs sm:text-base border border-rose-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
                  <span>Tạo Thiệp Mật Mã Nhanh</span>
                </button>
              </Link>
            </div>

            {/* Trust & Real Features Ribbon - Compact & Overflow-Free on Mobile */}
            <div className="pt-3 sm:pt-4 border-t border-rose-100/80 grid grid-cols-3 gap-1.5 sm:gap-4 max-w-xl mx-auto lg:mx-0">
              <div className="bg-white/75 backdrop-blur-md p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-rose-100/70 shadow-xs flex flex-col justify-center items-center text-center min-h-[60px] sm:min-h-[86px] overflow-hidden">
                <p className="text-xs sm:text-base lg:text-lg font-black text-rose-600 truncate max-w-full">{TEMPLATES.length} Mẫu Thiệp</p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate max-w-full">Hiệu ứng 3D</p>
              </div>
              <div className="bg-white/75 backdrop-blur-md p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-purple-100/70 shadow-xs flex flex-col justify-center items-center text-center min-h-[60px] sm:min-h-[86px] overflow-hidden">
                <p className="text-xs sm:text-base lg:text-lg font-black text-purple-600 truncate max-w-full">100% Free</p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate max-w-full">Bảo mật riêng tư</p>
              </div>
              <div className="bg-white/75 backdrop-blur-md p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-indigo-100/70 shadow-xs flex flex-col justify-center items-center text-center min-h-[60px] sm:min-h-[86px] overflow-hidden">
                <p className="text-xs sm:text-base lg:text-lg font-black text-indigo-600 truncate max-w-full">Mã QR & Link</p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate max-w-full">Chia sẻ nhanh</p>
              </div>
            </div>
          </div>

          {/* Right Column: "Interactive Card Lab" Live Interactive Experience */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md">
              
              {/* Outer Card Box */}
              <div className="relative">
                {/* Top Corner Floating Tag */}
                <div className="absolute -top-3 right-2 sm:right-4 z-20 bg-gradient-to-r from-rose-500 to-pink-600 text-white px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg shadow-rose-500/30 flex items-center gap-1.5 animate-bounce">
                  <span>✨ Trải nghiệm tương tác ngay!</span>
                </div>

                {/* Main Glassmorphism Lab Container */}
                <div className="bg-white/90 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-rose-200/70 shadow-2xl shadow-rose-500/10">
                  
                  {/* Mode Selector Tabs */}
                  <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl mb-5">
                    <button
                      onClick={() => {
                        soundFx.playPinClick();
                        setHeroTab('passcode');
                      }}
                      className={`flex-1 py-2 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                        heroTab === 'passcode'
                          ? 'bg-white text-rose-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Thư Mật Mã</span>
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playPinClick();
                        setHeroTab('blossom');
                      }}
                      className={`flex-1 py-2 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                        heroTab === 'blossom'
                          ? 'bg-white text-pink-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>🌸</span>
                      <span>Mưa Hoa</span>
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playPinClick();
                        setHeroTab('vinyl');
                      }}
                      className={`flex-1 py-2 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                        heroTab === 'vinyl'
                          ? 'bg-white text-amber-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" />
                      <span>Đĩa Than</span>
                    </button>
                  </div>

                  {/* Tab 1: Passcode Envelope Demo */}
                  {heroTab === 'passcode' && (
                    <AnimatePresence mode="wait">
                      {!heroUnlocked ? (
                        <motion.div
                          key="locked-demo"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          className="space-y-5 text-center"
                        >
                          {/* 3D Wax Seal Envelope Mockup */}
                          <div className="relative w-48 h-32 mx-auto bg-gradient-to-br from-rose-300 via-rose-400 to-purple-400 rounded-2xl shadow-lg flex items-center justify-center overflow-hidden border border-white/60">
                            {/* Envelope Top Flap */}
                            <div
                              className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-rose-400 to-rose-300"
                              style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
                            />
                            {/* Glowing Stamped Wax Seal */}
                            <div
                              onClick={unlockHeroDemo}
                              title="Bấm để mở thư ngay!"
                              className="relative z-10 w-13 h-13 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/40 flex flex-col items-center justify-center cursor-pointer transform hover:scale-110 active:scale-95 transition-transform border-2 border-amber-200"
                            >
                              <Lock className="w-4 h-4 text-amber-200 mb-0.5" />
                              <span className="text-[9px] font-black tracking-widest text-amber-100 uppercase">
                                20/10
                              </span>
                            </div>
                          </div>

                          {/* Guidance */}
                          <div>
                            <h3 className="font-extrabold text-slate-800 text-base">
                              Thư Mật Mã Tình Yêu
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Nhập mã ngày <span className="font-black text-rose-600">2010</span> để mở thư
                            </p>
                          </div>

                          {/* PIN Input Slots */}
                          <motion.div
                            animate={heroShake ? { x: [-10, 10, -10, 10, 0] } : {}}
                            className="flex justify-center gap-3"
                          >
                            {[0, 1, 2, 3].map((idx) => (
                              <div
                                key={idx}
                                className={`w-11 h-11 rounded-2xl border-2 flex items-center justify-center font-black text-sm transition-all ${
                                  idx < heroPin.length
                                    ? 'border-rose-500 bg-rose-50 text-rose-600 scale-105 shadow-md shadow-rose-500/10'
                                    : 'border-slate-200 bg-slate-50 text-slate-300'
                                }`}
                              >
                                {idx < heroPin.length ? '♥' : '•'}
                              </div>
                            ))}
                          </motion.div>

                          {/* Numeric Keypad */}
                          <div className="grid grid-cols-3 gap-2 max-w-[230px] mx-auto">
                            {['2', '0', '1', '4', '5', '6'].map((k) => (
                              <button
                                key={k}
                                onClick={() => handleHeroKey(k)}
                                className="py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-extrabold text-sm transition-all active:scale-95 shadow-sm"
                              >
                                {k}
                              </button>
                            ))}
                          </div>

                          {/* Instant Unlock Button */}
                          <div className="pt-1">
                            <button
                              onClick={unlockHeroDemo}
                              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:opacity-80 flex items-center gap-1 mx-auto transition-opacity"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                              <span>Điền nhanh 2010 & mở thư ngay</span>
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="unlocked-demo"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center space-y-4 py-2"
                        >
                          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-100 to-pink-200 text-rose-500 flex items-center justify-center mx-auto text-2xl shadow-inner border border-rose-200">
                            🌹
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-100/80 px-2.5 py-0.5 rounded-full">
                              Thư Đã Được Giải Mã
                            </span>
                            <h3 className="font-black text-xl text-slate-800 mt-1">
                              Chúc Em 20/10 Rạng Rỡ!
                            </h3>
                          </div>
                          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed italic bg-rose-50/90 p-4 rounded-2xl border border-rose-200/80 font-serif shadow-sm text-left relative">
                            <span className="text-2xl text-rose-300 absolute -top-1 left-2 font-serif select-none">“</span>
                            <p className="relative z-10 pt-1">
                              Cảm ơn em vì đã luôn dịu dàng, kiên cường và là bông hoa đẹp nhất trong thế giới của anh. Chúc em ngày 20/10 tràn ngập nụ cười và hạnh phúc! 💕
                            </p>
                          </div>
                          <div className="pt-2 flex items-center justify-center gap-2.5">
                            <button
                              onClick={resetHeroDemo}
                              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Đóng lại</span>
                            </button>
                            <Link to="/studio/passcode-envelope">
                              <button
                                onClick={() => soundFx.playHeartPop()}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5"
                              >
                                <span>Tạo thiệp này ngay</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}

                  {/* Tab 2: Blossom Rain Interactive Demo */}
                  {heroTab === 'blossom' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-5 text-center py-3"
                    >
                      <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-gradient-to-tr from-rose-200 via-pink-100 to-purple-200 p-4 flex flex-col items-center justify-center border border-pink-200 shadow-inner">
                        <div className="text-3xl animate-bounce">🌸</div>
                        <h4 className="font-extrabold text-slate-800 text-base mt-2">
                          Mưa Cánh Hoa 20/10
                        </h4>
                        <p className="text-xs text-slate-600 max-w-[260px] mt-1 font-serif italic">
                          "Nguyện cầu mọi điều bình an và dịu dàng nhất sẽ luôn bao bọc lấy người phụ nữ tôi thương."
                        </p>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={triggerBlossomBurst}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <span>🌸 Chạm Để Thả Mưa Hoa Rơi ({blossomCount})</span>
                        </button>
                        <Link to="/studio/blossom-rain" className="block">
                          <button className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                            <span>Tạo thiệp Mưa Hoa này →</span>
                          </button>
                        </Link>
                      </div>
                    </motion.div>
                  )}

                  {/* Tab 3: Retro Vinyl Interactive Demo */}
                  {heroTab === 'vinyl' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-5 text-center py-3"
                    >
                      {/* Rotating Vinyl Disc */}
                      <div className="relative w-36 h-36 mx-auto rounded-full bg-slate-950 p-2 shadow-xl border-4 border-slate-800 flex items-center justify-center">
                        <div
                          className={`w-full h-full rounded-full bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center p-3 vinyl-grooves ${
                            isVinylPlaying ? 'animate-spin-slow' : ''
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full bg-white text-slate-900 flex flex-col items-center justify-center text-[9px] font-bold shadow-md">
                            <span>🎵</span>
                            <span>20/10</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 text-base">
                          Đĩa Hát Kỷ Niệm & Giai Điệu Piano
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Âm nhạc lãng mạn hòa quyện cùng từng câu chữ ngọt ngào
                        </p>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={toggleHeroVinyl}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          {isVinylPlaying ? (
                            <>
                              <Pause className="w-4 h-4" />
                              <span>Tạm Dừng Nhạc Nền</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 fill-white" />
                              <span>Nghe Thử Giai Điệu Piano</span>
                            </>
                          )}
                        </button>
                        <Link to="/studio/vinyl-player" className="block">
                          <button className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                            <span>Tạo thiệp Đĩa Than này →</span>
                          </button>
                        </Link>
                      </div>
                    </motion.div>
                  )}

                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          TEMPLATE CATALOG SECTION (With Live Category Filter & Realistic Stats)
          ======================================================== */}
      <section className="relative z-10 py-6 sm:py-20 px-2 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-rose-100/80 pb-28 sm:pb-24 overflow-hidden w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-8 space-y-2 sm:space-y-3 px-2">
          <span className="text-[10px] sm:text-xs font-bold tracking-widest text-rose-600 uppercase px-3 py-1 rounded-full bg-rose-100/80 border border-rose-200/50 inline-block">
            Kho Mẫu Thiệp 20/10 Đặc Sắc
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Chọn Phong Cách Thiệp Tương Tác
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Chạm vào thiệp bạn yêu thích để bắt đầu viết lời chúc, thêm ảnh kỷ niệm và gửi tặng người phụ nữ bạn trân quý.
          </p>
        </div>

        {/* Category Filter Pills (Cuộn mượt mà không bị lệch lề trên mobile, căn giữa trên desktop) */}
        <div className="w-full overflow-x-auto no-scrollbar pb-3 pt-1 mb-5 sm:mb-10">
          <div className="flex items-center gap-2 w-max sm:w-fit sm:mx-auto px-1 sm:px-0">
            {[
              { id: 'all', label: 'Tất cả mẫu', count: TEMPLATES.length, icon: '✨' },
              { id: '20-10', label: '20/10 & 8/3', count: TEMPLATES.filter((t) => t.category === '20-10').length, icon: '🌹' },
              { id: 'love', label: 'Tình yêu', count: TEMPLATES.filter((t) => t.category === 'love').length, icon: '💖' },
              { id: 'birthday', label: 'Sinh nhật', count: TEMPLATES.filter((t) => t.category === 'birthday').length, icon: '🎂' },
              { id: 'gratitude', label: 'Tri ân Mẹ & Cô', count: TEMPLATES.filter((t) => t.category === 'gratitude').length, icon: '🏮' },
              { id: 'friends', label: 'Bạn bè', count: TEMPLATES.filter((t) => t.category === 'friends').length, icon: '🎞️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playPinClick();
                  setActiveCategory(tab.id as TemplateCategoryFilter);
                }}
                className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeCategory === tab.id
                    ? 'bg-slate-900 text-white shadow-md scale-[1.02]'
                    : 'bg-white text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/80 shadow-2xs'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeCategory === tab.id ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid - Hiển thị FULL bề ngang trên di động, thoáng đạt, không bị cắt góc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full">
          {filteredTemplates.map((tmpl) => {
            const stats = getTemplateLiveStats(tmpl.id);
            const isLiked = likedTemplateIds.includes(tmpl.id);

            return (
              <div
                key={tmpl.id}
                className="group w-full mx-auto bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200/80 flex flex-col justify-between"
              >
                {/* Hero Image Section: Tỉ lệ 4:3 cao ráo trên mobile, hiển thị trọn vẹn 100% hình ảnh không bao giờ bị cắt góc */}
                <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-slate-900">
                  <Link to={`/studio/${tmpl.id}`} className="block w-full h-full">
                    <div className="w-full h-full group-hover:scale-[1.03] transition-transform duration-700 ease-out">
                      <TemplateThumbnail effectType={tmpl.effectType} thumbnailUrl={tmpl.thumbnail} className="w-full h-full" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                  </Link>

                  {/* Category Badge */}
                  <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold text-slate-800 shadow-sm flex items-center gap-1 pointer-events-none z-10">
                    <span>
                      {tmpl.category === '20-10'
                        ? '🌹 20/10'
                        : tmpl.category === 'love'
                        ? '💖 Tình yêu'
                        : tmpl.category === 'birthday'
                        ? '🎂 Sinh nhật'
                        : tmpl.category === 'gratitude'
                        ? '🏮 Tri ân'
                        : '🎞️ Bạn bè'}
                    </span>
                  </div>

                  {/* Top Right Actions: Preview Eye & Heart */}
                  <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 flex items-center gap-1.5 z-10">
                    <Link
                      to={`/card/demo-${tmpl.id}`}
                      className="bg-black/50 hover:bg-black/75 backdrop-blur-md text-white p-1.5 sm:p-2 rounded-full text-xs transition-all active:scale-90 flex items-center justify-center hover:scale-105"
                      title="Xem thử mẫu thiệp"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => handleToggleHeart(tmpl.id, e)}
                      className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all active:scale-90 flex items-center justify-center cursor-pointer hover:scale-105 ${
                        isLiked
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/40 ring-2 ring-white/80'
                          : 'bg-black/50 hover:bg-black/75 text-white hover:text-rose-300'
                      }`}
                      title={isLiked ? 'Bỏ thích mẫu này' : 'Thả tim & lưu mẫu'}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-transform ${
                          isLiked ? 'fill-white text-white scale-110' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Live Stats Pill ở góc dưới trái - Gọn gàng, kính mờ siêu thanh thoát */}
                  <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3.5 flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-black/45 backdrop-blur-md text-[10px] sm:text-[11px] font-medium text-white/90 pointer-events-none z-10 border border-white/10">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-purple-300" />
                      <span>{formatStat(stats.views)}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-300" />
                      <span>{formatStat(stats.hearts)}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{formatStat(stats.uses)}</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Compact Info: Tiêu đề nổi bật & Nút Tạo thiệp gọn gàng */}
                <div className="p-3.5 sm:p-4.5 flex items-center justify-between gap-3 bg-white">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/studio/${tmpl.id}`}
                      className="block font-black text-sm sm:text-base text-slate-900 hover:text-purple-600 transition-colors truncate"
                      title={tmpl.titleVi}
                    >
                      {tmpl.icon} {tmpl.titleVi}
                    </Link>
                    <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      Hiệu ứng 3D • Mở khóa trải nghiệm
                    </p>
                  </div>

                  {/* Nút Tạo thiệp */}
                  <Link
                    to={`/studio/${tmpl.id}`}
                    onClick={() => soundFx.playHeartPop()}
                    className="px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-purple-600 to-rose-500 hover:from-purple-700 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md hover:shadow-purple-500/20 flex items-center gap-1.5 active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    <span>Tạo thiệp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          WISH INSPIRATION & GENERATOR SECTION (Unique 20/10 Feature)
          ======================================================== */}
      <section className="relative z-10 py-10 sm:py-20 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-rose-100/80">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 space-y-2 sm:space-y-3">
          <span className="text-[10px] sm:text-xs font-bold tracking-widest text-purple-600 uppercase px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-purple-100/80 border border-purple-200/50">
            Cảm Hứng Viết Thiệp 20/10
          </span>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Gợi Ý Lời Chúc Chạm Đến Trái Tim
          </h2>
          <p className="text-[11px] sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Chưa biết viết gì cho hay? Chọn ngay đối tượng bạn muốn gửi để sao chép hoặc áp dụng trực tiếp vào thiệp chỉ với 1 chạm.
          </p>
        </div>

        {/* Target Selector Tabs (Sleek Horizontal Scroll on Mobile, Centered on Desktop) */}
        <div className="w-full overflow-x-auto no-scrollbar pb-3 pt-1 mb-6 sm:mb-10">
          <div className="flex items-center gap-1.5 sm:gap-2 w-fit mx-auto px-4 sm:px-6">
            {[
              { id: 'wife', label: 'Vợ & Người Yêu', icon: '💖' },
              { id: 'mom', label: 'Mẹ Kính Yêu', icon: '🌸' },
              { id: 'teacher', label: 'Cô Giáo Tri Ân', icon: '📚' },
              { id: 'colleague', label: 'Bạn Bè & Đồng Nghiệp', icon: '👭' },
              { id: 'crush', label: 'Crush & Tỏ Tình', icon: '💌' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playPinClick();
                  setActiveWishTarget(tab.id as any);
                }}
                className={`whitespace-nowrap shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeWishTarget === tab.id
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 scale-[1.02]'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-2xs'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Wish Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {currentWishes.slice(0, 4).map((wish) => {
            const isCopied = copiedWishId === wish.id;

            return (
              <div
                key={wish.id}
                className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-rose-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/50">
                      {wish.label}
                    </span>
                    <Heart className="w-4 h-4 text-rose-300 group-hover:text-rose-500 transition-colors" />
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed font-serif italic pt-1">
                    "{wish.text}"
                  </p>
                </div>

                {/* Actions: Copy or Use in Studio */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 gap-2">
                  <button
                    onClick={() => handleCopyWish(wish.id, wish.text)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Đã sao chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleUseWish(wish.text, wish.target)}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white text-xs font-extrabold hover:opacity-95 shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <span>Dùng câu chúc này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          BENTO GRID: 4 TÍNH NĂNG ĐỘC BẢN CỦA LOVECARD
          ======================================================== */}
      <section className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-rose-100/80">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase px-3 py-1 rounded-full bg-indigo-100/80 border border-indigo-200/50">
            Trải Nghiệm Khác Biệt
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Điều Gì Làm Cho Thiệp LoveCard Khắc Sâu Kỷ Niệm?
          </h2>
          <p className="text-xs sm:text-base text-slate-600">
            Không chỉ là một tấm thiệp điện tử thông thường, LoveCard được thiết kế như một tác phẩm nghệ thuật tương tác.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Bento Card 1: Passcode */}
          <div className="bg-white/80 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-rose-100 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-800">
                Mở Thư Bằng Mật Mã Bí Mật
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Người ấy phải nhập đúng 4 chữ số bí mật (ngày sinh nhật, ngày kỷ niệm, 2010) mới có thể mở phong bì giải mã bức thư.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-rose-600 flex items-center gap-1">
              <span>Bảo mật & Bất ngờ</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bento Card 2: 3D WebGL */}
          <div className="bg-white/80 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-indigo-100 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-800">
                Không Gian 3D WebGL Siêu Thực
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Ngân hà lơ lửng 360°, đèn trời lụa thả bay lên mây, quả cầu tuyết pha lê và cuộn phim điện ảnh xoay chuyển mượt mà.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-indigo-600 flex items-center gap-1">
              <span>Đồ họa Three.js chân thực</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bento Card 3: Music Synthesis */}
          <div className="bg-white/80 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-amber-100 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-800">
                Âm Nhạc Du Dương Tùy Chỉnh
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Tích hợp sẵn piano lãng mạn, hộp nhạc trong trẻo, giai điệu acoustic hoặc dán đường dẫn bài hát MP3 kỷ niệm của hai bạn.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-amber-600 flex items-center gap-1">
              <span>Tự động phát khi mở thiệp</span>
              <Volume2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bento Card 4: 1-Tap QR & Share */}
          <div className="bg-white/80 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-purple-100 shadow-sm hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-sm">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-800">
                Quét Mã QR & Chia Sẻ Trong 1 Chạm
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Tự động tạo mã QR sang trọng để tải về in thành thiệp giấy thật hoặc sao chép link gửi qua Zalo, Messenger, Facebook.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-purple-600 flex items-center gap-1">
              <span>Chia sẻ tức thì trong 5s</span>
              <Share2 className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          HOW IT WORKS (3 Simple Steps)
          ======================================================== */}
      <section className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-rose-100/80">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold tracking-widest text-rose-600 uppercase px-3 py-1 rounded-full bg-rose-100/80">
            Dễ Dàng Sử Dụng
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            3 Bước Tạo Thiệp 20/10 Trong 1 Phút
          </h2>
          <p className="text-xs sm:text-base text-slate-600">
            Không cần kỹ năng thiết kế, thao tác mượt mà ngay trên điện thoại hoặc máy tính.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              step: '01',
              title: 'Chọn Phong Cách Thiệp',
              desc: 'Chọn 1 trong 9+ phong cách tương tác: Thư mật mã PIN, Ngân hà 3D, Mưa cánh hoa, Đĩa than hoặc Đèn trời.',
              icon: <Sparkles className="w-6 h-6 text-purple-600" />,
            },
            {
              step: '02',
              title: 'Cá Nhân Hóa Lời Chúc & Ảnh',
              desc: 'Điền tên người nhận, chọn câu chúc tâm đắc (hoặc dùng gợi ý có sẵn), tải ảnh kỷ niệm và thiết lập mật mã.',
              icon: <Heart className="w-6 h-6 text-rose-600" />,
            },
            {
              step: '03',
              title: 'Gửi Link Hoặc In Mã QR',
              desc: 'Nhận ngay liên kết riêng tư hoặc tải mã QR thiệp sắc nét để gửi qua Zalo, Messenger hoặc in thành thiệp giấy thật.',
              icon: <Share2 className="w-6 h-6 text-indigo-600" />,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white/85 backdrop-blur-md p-7 sm:p-8 rounded-3xl border border-rose-100/80 shadow-sm relative space-y-4 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100 shadow-sm">
                  {item.icon}
                </div>
                <span className="text-4xl font-black text-rose-100/80 select-none">
                  {item.step}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{item.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          POLISHED FOOTER
          ======================================================== */}
      <footer className="relative z-10 pt-10 pb-24 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-rose-200/60 text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <span className="font-extrabold text-slate-800 text-sm">LoveCard 20/10</span>
            <span className="text-slate-400">— Nền tảng thiệp tương tác cảm xúc</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link to="/templates" className="hover:text-rose-600 transition-colors">
              Kho mẫu thiệp
            </Link>
            <Link to="/history" className="hover:text-rose-600 transition-colors">
              Lịch sử đã tạo
            </Link>
            <Link to="/studio/passcode-envelope" className="hover:text-rose-600 transition-colors">
              Tạo thiệp mới
            </Link>
          </div>

          <p className="text-slate-400">
            © 2026 LoveCard. Dành trọn yêu thương gửi đến một nửa thế giới 🌹
          </p>
        </div>
      </footer>
    </div>
  );
}
