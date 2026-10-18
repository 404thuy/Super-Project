import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  Smile,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundFx } from '../utils/soundEffects';

interface PresetAvatar {
  id: string;
  name: string;
  url: string;
  category: 'meme' | 'animal' | 'anime' | 'funny' | 'pixel';
}

const PRESET_AVATARS: PresetAvatar[] = [
  // 🔥 TOP MEME HUYỀN THOẠI (VIRAL INTERNET MEMES)
  {
    id: 'meme-popcat',
    name: 'Mèo há miệng Popcat (Viral)',
    category: 'meme',
    url: 'https://popcat.click/twitter-card.jpg',
  },
  {
    id: 'meme-cheems',
    name: 'Chó Shiba Cheems trầm cảm',
    category: 'meme',
    url: 'https://api.memegen.link/images/cheems.png',
  },
  {
    id: 'meme-doge',
    name: 'Chó Shiba Doge liếc mắt huyền thoại',
    category: 'meme',
    url: 'https://api.memegen.link/images/doge.png',
  },
  {
    id: 'meme-fine',
    name: 'This Is Fine (Vẫn ổn trong biển lửa)',
    category: 'meme',
    url: 'https://api.memegen.link/images/fine.png',
  },
  {
    id: 'meme-smudge',
    name: 'Mèo Smudge ngồi bàn ăn bị mắng',
    category: 'meme',
    url: 'https://api.memegen.link/images/woman-cat.png',
  },
  {
    id: 'meme-grumpy',
    name: 'Grumpy Cat (Mèo quạu khó ở)',
    category: 'meme',
    url: 'https://api.memegen.link/images/grumpycat.png',
  },
  {
    id: 'meme-pepe',
    name: 'Ếch xanh Pepe cảm xúc (Feels Bad)',
    category: 'meme',
    url: 'https://api.memegen.link/images/sadfrog.png',
  },
  {
    id: 'meme-bongo',
    name: 'Mèo gõ trống Bongo Cat siêu quẩy',
    category: 'meme',
    url: 'https://api.memegen.link/images/bongo.png',
  },
  {
    id: 'meme-rollsafe',
    name: 'Roll Safe (Gõ trán thông minh)',
    category: 'meme',
    url: 'https://api.memegen.link/images/rollsafe.png',
  },
  {
    id: 'meme-ams',
    name: 'Hải cẩu ngượng ngùng (Awkward Seal)',
    category: 'meme',
    url: 'https://api.memegen.link/images/ams.png',
  },
  {
    id: 'meme-harold',
    name: 'Cụ ông Harold (Hide The Pain)',
    category: 'meme',
    url: 'https://api.memegen.link/images/harold.png',
  },
  {
    id: 'meme-success',
    name: 'Success Kid (Bé nắm chặt tay quyết tâm)',
    category: 'meme',
    url: 'https://api.memegen.link/images/success.png',
  },

  // 🐾 THÚ CƯNG & ĐỘNG VẬT SIÊU CUTE (CHỤP THẬT HD)
  {
    id: 'animal-capybara',
    name: 'Capybara thong dong (Bộ trưởng Ngoại giao)',
    category: 'animal',
    url: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=250&auto=format&fit=crop',
  },
  {
    id: 'animal-corgi',
    name: 'Cún Corgi mông đào tinh nghịch',
    category: 'animal',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=250&auto=format&fit=crop',
  },
  {
    id: 'animal-cat',
    name: 'Bé mèo mắt tròn xoe ngơ ngác',
    category: 'animal',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=250&auto=format&fit=crop',
  },
  {
    id: 'animal-panda',
    name: 'Gấu trúc Panda tròn ủm lười biếng',
    category: 'animal',
    url: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=250&auto=format&fit=crop',
  },
  {
    id: 'animal-rabbit',
    name: 'Bé thỏ bông trắng má hồng',
    category: 'animal',
    url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=250&auto=format&fit=crop',
  },
  {
    id: 'animal-hamster',
    name: 'Chuột Hamster ăn hạt dẻ',
    category: 'animal',
    url: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=250&auto=format&fit=crop',
  },
  {
    id: 'animal-shiba',
    name: 'Chó Shiba nụ cười tỏa nắng',
    category: 'animal',
    url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=250&auto=format&fit=crop',
  },
  {
    id: 'animal-cat-glasses',
    name: 'Mèo xám đeo kính ngầu',
    category: 'animal',
    url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=250&auto=format&fit=crop',
  },

  // 🌸 CHIBI ANIME & MANGA TRENDY (DICEBEAR LORELEI PASTEL)
  {
    id: 'anime-sakura',
    name: 'Cô bé Anime tóc hồng hoa anh đào',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=SakuraChan&backgroundColor=ffd5dc',
  },
  {
    id: 'anime-shadow',
    name: 'Cool Boy Anime tóc bạc lạnh lùng',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=ShadowKun&backgroundColor=d1d4f9',
  },
  {
    id: 'anime-neko',
    name: 'Neko Girl tai mèo nhí nhảnh',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=NekoMimi&backgroundColor=fed7aa',
  },
  {
    id: 'anime-magic',
    name: 'Pháp sư Chibi mắt biếc huyền bí',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=MagicLuna&backgroundColor=e0f2fe',
  },
  {
    id: 'anime-idol',
    name: 'Chibi Idol tóc vàng rạng rỡ',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=StarIdol&backgroundColor=fef08a',
  },
  {
    id: 'anime-kitsune',
    name: 'Nàng cáo Kitsune kiêu kỳ',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=KitsuneYuki&backgroundColor=fbcfe8',
  },

  // 😎 BIỂU CẢM HÀI HƯỚC & GEN Z (FUN EMOJI)
  {
    id: 'funny-cool',
    name: 'Mặt cười ngầu đeo kính râm đen',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=CoolEmoji&backgroundColor=bbf7d0',
  },
  {
    id: 'funny-heart',
    name: 'Bắn tim ngọt ngào mê đắm',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=HeartEyes&backgroundColor=fecdd3',
  },
  {
    id: 'funny-joy',
    name: 'Cười tít mắt haha nghiêng ngả',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=JoySmile&backgroundColor=fef08a',
  },
  {
    id: 'funny-wink',
    name: 'Nháy mắt thả thính tinh nghịch',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=WinkFun&backgroundColor=fed7aa',
  },
  {
    id: 'funny-sparkle',
    name: 'Mắt sao lấp lánh kinh ngạc',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=SparkleFace&backgroundColor=ddd6fe',
  },
  {
    id: 'funny-silly',
    name: 'Mặt đần ngơ ngác đang load dữ liệu',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=DumbFace&backgroundColor=e2e8f0',
  },

  // 👾 PIXEL ART & GAMING RETRO
  {
    id: 'pixel-cat',
    name: 'Mèo Pixel 8-Bit cổ điển',
    category: 'pixel',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=PixelCat&backgroundColor=fed7aa',
  },
  {
    id: 'pixel-knight',
    name: 'Hiệp sĩ dũng cảm Pixel Art',
    category: 'pixel',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=RetroKnight&backgroundColor=bfdbfe',
  },
  {
    id: 'pixel-cyber',
    name: 'Game thủ Cyberpunk tương lai',
    category: 'pixel',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=CyberHero&backgroundColor=e9d5ff',
  },
  {
    id: 'pixel-robot',
    name: 'Robot thám hiểm không gian',
    category: 'pixel',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AstroBot&backgroundColor=c7d2fe',
  },
];

export default function SettingsModal() {
  const { user, isSettingsModalOpen, closeSettingsModal, updateAvatar, updatePassword } = useAuth();

  const isGuest =
    user?.username === 'khach_trainghiem' ||
    user?.id === 'usr_demo_guest' ||
    Boolean(user?.username?.startsWith('khach_')) ||
    Boolean(user?.username?.startsWith('guest_'));

  const [activeTab, setActiveTab] = useState<'avatar' | 'password'>('avatar');
  const [avatarCategory, setAvatarCategory] = useState<'all' | 'meme' | 'animal' | 'anime' | 'funny' | 'pixel'>('all');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(user?.avatarUrl || '');

  // Reset tab về avatar nếu là tài khoản khách
  useEffect(() => {
    if (isGuest) {
      setActiveTab('avatar');
    }
  }, [isGuest, isSettingsModalOpen]);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isSettingsModalOpen || !user) return null;

  const handleSaveAvatar = async () => {
    if (!selectedAvatarUrl) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    soundFx.playPinClick();

    const res = await updateAvatar(selectedAvatarUrl);
    setLoading(false);

    if (res.success) {
      soundFx.playSuccessChime();
      setSuccessMessage('Đã cập nhật ảnh đại diện thành công!');
      setTimeout(() => {
        setSuccessMessage(null);
        closeSettingsModal();
      }, 1000);
    } else {
      setErrorMessage(res.error || 'Cập nhật ảnh đại diện thất bại');
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!oldPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    soundFx.playPinClick();

    const res = await updatePassword(oldPassword, newPassword);
    setLoading(false);

    if (res.success) {
      soundFx.playSuccessChime();
      setSuccessMessage('Đã đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccessMessage(null);
        closeSettingsModal();
      }, 1200);
    } else {
      setErrorMessage(res.error || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.');
    }
  };

  const filteredAvatars =
    avatarCategory === 'all'
      ? PRESET_AVATARS
      : PRESET_AVATARS.filter((a) => a.category === avatarCategory);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSettingsModal}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

          {/* Modal Window */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-4 sm:p-6 z-10 border border-slate-100 max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={closeSettingsModal}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-10"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-3 sm:mb-4 shrink-0 pr-8">
              <div className="relative shrink-0">
                <img
                  src={selectedAvatarUrl || user.avatarUrl}
                  alt={user.displayName}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-purple-500 shadow-md shadow-purple-500/20"
                />
                <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-purple-600 text-white text-[10px]">
                  <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-xl font-extrabold text-slate-900 truncate">Cài Đặt Tài Khoản</h2>
                  {isGuest && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                      Khách dùng thử
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium truncate">@{user.username || 'user'} • {user.displayName}</p>
              </div>
            </div>

            {/* Tab Selector - Chỉ hiển thị mục Đổi Mật Khẩu cho tài khoản đăng ký chính thức */}
            {!isGuest ? (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl mb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playPinClick();
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setActiveTab('avatar');
                  }}
                  className={`flex-1 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'avatar'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Smile className="w-4 h-4 text-purple-600" />
                  <span>Đổi Ảnh Đại Diện</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playPinClick();
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setActiveTab('password');
                  }}
                  className={`flex-1 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'password'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Lock className="w-4 h-4 text-rose-500" />
                  <span>Đổi Mật Khẩu</span>
                </button>
              </div>
            ) : (
              <div className="mb-3 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100/80 rounded-2xl flex items-center justify-between text-xs text-purple-800 shrink-0">
                <span className="flex items-center gap-1.5 font-bold">
                  <Smile className="w-4 h-4 text-purple-600" />
                  <span>Chọn Ảnh Đại Diện (Meme & Thú Cưng)</span>
                </span>
                <span className="text-[11px] font-medium text-purple-600 hidden sm:inline">
                  Chế độ trải nghiệm
                </span>
              </div>
            )}

            {/* Feedback Alerts */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 shrink-0"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 shrink-0"
              >
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </motion.div>
            )}

            {/* ── TAB 1: AVATAR PICKER ── */}
            {activeTab === 'avatar' && (
              <div className="flex-1 min-h-0 flex flex-col justify-between">
                {/* Scrollable Avatar Section */}
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 overscroll-contain">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Kho Ảnh Đại Diện (Top Meme, Thú Cưng, Anime & Gen Z):</span>
                    </span>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'meme', label: '🔥 Top Meme' },
                      { id: 'animal', label: '🐾 Thú Cưng Cute' },
                      { id: 'anime', label: '🌸 Chibi Anime' },
                      { id: 'funny', label: '😎 Hài Hước Gen Z' },
                      { id: 'pixel', label: '👾 Pixel Retro' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          soundFx.playPinClick();
                          setAvatarCategory(cat.id as any);
                        }}
                        className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          avatarCategory === cat.id
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Preview Avatar đang chọn */}
                  {(() => {
                    const currentAvatar = PRESET_AVATARS.find((a) => a.url === selectedAvatarUrl);
                    return (
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-purple-50/80 border border-purple-100 text-xs">
                        <span className="text-slate-600 font-medium truncate">
                          {currentAvatar ? (
                            <>
                              <span className="font-bold text-purple-700">Đã chọn: </span>
                              <span className="text-slate-800 font-semibold">{currentAvatar.name}</span>
                            </>
                          ) : (
                            <span className="text-slate-500 italic">Chọn một ảnh ở dưới hoặc dán link ảnh tùy chọn</span>
                          )}
                        </span>
                        <span className="text-[11px] text-purple-600 font-bold shrink-0 ml-2">
                          {filteredAvatars.length} ảnh
                        </span>
                      </div>
                    );
                  })()}

                  {/* Avatar Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-44 sm:max-h-56 overflow-y-auto p-1.5 border border-slate-100 rounded-2xl bg-slate-50/60 overscroll-contain">
                    {filteredAvatars.map((avatar) => {
                      const isSelected = selectedAvatarUrl === avatar.url;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => {
                            soundFx.playPinClick();
                            setSelectedAvatarUrl(avatar.url);
                          }}
                          className={`relative aspect-square rounded-2xl p-1 transition-all group cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-purple-600 bg-purple-100/70 shadow-md scale-105'
                              : 'bg-white hover:bg-purple-50/50 hover:shadow-xs border border-slate-100 hover:scale-102'
                          }`}
                          title={avatar.name}
                        >
                          <img
                            src={avatar.url}
                            alt={avatar.name}
                            loading="lazy"
                            className="w-full h-full rounded-xl object-cover"
                          />
                          {isSelected && (
                            <span className="absolute top-1 right-1 p-0.5 rounded-full bg-purple-600 text-white shadow-xs">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Hoặc dán link ảnh tùy chọn */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Hoặc dán đường link ảnh tùy chọn:
                    </label>
                    <input
                      type="url"
                      value={selectedAvatarUrl}
                      onChange={(e) => setSelectedAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 font-mono text-slate-600"
                    />
                  </div>
                </div>

                {/* 📌 PINNED STICKY FOOTER (Luôn cố định ở đáy, không bao giờ bị cắt trên mobile) */}
                <div className="shrink-0 pt-3 mt-2 border-t border-slate-100 bg-white">
                  <button
                    type="button"
                    onClick={handleSaveAvatar}
                    disabled={loading || selectedAvatarUrl === user.avatarUrl}
                    className={`w-full py-2.5 sm:py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer ${
                      selectedAvatarUrl !== user.avatarUrl
                        ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 text-white shadow-purple-500/25 hover:shadow-lg'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang cập nhật...</span>
                      </>
                    ) : selectedAvatarUrl === user.avatarUrl ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Đang sử dụng ảnh đại diện này</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Lưu Ảnh Đại Diện</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB 2: PASSWORD CHANGE (Chỉ dành cho tài khoản chính thức) ── */}
            {!isGuest && activeTab === 'password' && (
              <form onSubmit={handleSavePassword} className="flex-1 min-h-0 flex flex-col justify-between">
                <div className="space-y-3 flex-1 overflow-y-auto pr-1 overscroll-contain">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mật khẩu mới <span className="text-slate-400 font-normal">(tối thiểu 6 ký tự)</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
                    />
                  </div>
                </div>

                {/* 📌 PINNED STICKY FOOTER CHO TAB MẬT KHẨU */}
                <div className="shrink-0 pt-3 mt-2 border-t border-slate-100 bg-white">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang cập nhật...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Đổi Mật Khẩu</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
      </div>
    </AnimatePresence>
  );
}
