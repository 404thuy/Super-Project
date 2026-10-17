import { useState } from 'react';
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
  category: 'animal' | 'cute' | 'funny' | 'anime';
}

const PRESET_AVATARS: PresetAvatar[] = [
  // 🐾 ĐỘNG VẬT MEME NỔI TIẾNG & DỄ THƯƠNG (HOT MEME)
  {
    id: 'animal-capybara',
    name: 'Capybara thong dong (Bộ trưởng Ngoại giao)',
    category: 'animal',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CapybaraChill&backgroundColor=ffd5dc',
  },
  {
    id: 'animal-cheems',
    name: 'Chó Shiba Cheems Meme',
    category: 'animal',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CheemsDoge&backgroundColor=ffdfbf',
  },
  {
    id: 'animal-popcat',
    name: 'Mèo Meme há miệng Popcat',
    category: 'animal',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=PopCatSurprise&backgroundColor=d1d4f9',
  },
  {
    id: 'animal-politecat',
    name: 'Mèo cười gượng lịch sự (Polite Cat)',
    category: 'animal',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=PoliteCatOllie&backgroundColor=c0aede',
  },
  {
    id: 'animal-corgi',
    name: 'Cún Corgi mông quả đào ngơ ngác',
    category: 'animal',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CorgiHappy&backgroundColor=ffdfbf',
  },
  {
    id: 'animal-scared-hamster',
    name: 'Hamster hoảng sợ Meme',
    category: 'animal',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=ScaredHamster&backgroundColor=ffd5dc',
  },
  {
    id: 'animal-crying-cat',
    name: 'Mèo dỗi hờn khóc nhè Meme',
    category: 'animal',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=SadCryingCat&backgroundColor=ddd6fe',
  },
  {
    id: 'animal-smug-cat',
    name: 'Mèo đeo kính râm siêu ngầu',
    category: 'animal',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CoolSmugCat&backgroundColor=b6e3f4',
  },
  {
    id: 'animal-panda',
    name: 'Gấu trúc Panda lăn tròn lười biếng',
    category: 'animal',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=BabyPandaRoll&backgroundColor=e0f2fe',
  },
  {
    id: 'animal-duck',
    name: 'Vịt vàng bối rối',
    category: 'animal',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=DucklingMeme&backgroundColor=ffeb3b',
  },
  {
    id: 'animal-otter',
    name: 'Bé rái cá chắp tay xin xỏ',
    category: 'animal',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CuteOtterBeg&backgroundColor=fed7aa',
  },
  {
    id: 'animal-seal',
    name: 'Hải cẩu tròn xoe đáng yêu',
    category: 'animal',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=LazySealRound&backgroundColor=c7d2fe',
  },

  // 🎀 CUTE ĐÁNG YÊU
  {
    id: 'cute-1',
    name: 'Bé thỏ hồng má đào',
    category: 'cute',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=PinkBunny',
  },
  {
    id: 'cute-2',
    name: 'Bé gấu nâu bánh mật',
    category: 'cute',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=BrownBear',
  },
  {
    id: 'cute-3',
    name: 'Mèo con mắt to tròn',
    category: 'cute',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KittenPeach',
  },
  {
    id: 'cute-4',
    name: 'Cún con vui vẻ tai cụp',
    category: 'cute',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=HappyPuppy',
  },
  {
    id: 'cute-5',
    name: 'Cáo tuyết mỉm cười',
    category: 'cute',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SnowFox',
  },
  {
    id: 'cute-6',
    name: 'Chim cánh cụt lóng ngóng',
    category: 'cute',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=PenguinWaddle',
  },

  // 😎 HÀI HƯỚC & BIỂU CẢM
  {
    id: 'funny-1',
    name: 'Mặt cười ngầu đeo kính râm',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=CoolEmoji',
  },
  {
    id: 'funny-2',
    name: 'Bắn tim ngọt ngào',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=HeartEyes',
  },
  {
    id: 'funny-3',
    name: 'Cười tít mắt ha ha',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=JoySmile',
  },
  {
    id: 'funny-4',
    name: 'Nháy mắt tinh nghịch',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=WinkFun',
  },
  {
    id: 'funny-5',
    name: 'Mặt ngơ ngác vô tội',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=SillyFace',
  },
  {
    id: 'funny-6',
    name: 'Mắt lấp lánh ánh sao',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=SparkleFace',
  },

  // 🌸 CHIBI & ANIME TRENDY
  {
    id: 'anime-1',
    name: 'Bé dâu tây má hồng',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Strawberry',
  },
  {
    id: 'anime-2',
    name: 'Cô bé tai mèo Anime',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=NekoChan',
  },
  {
    id: 'anime-3',
    name: 'Cool boy áo hoodie',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=LeoCool',
  },
  {
    id: 'anime-4',
    name: 'Công chúa hoa anh đào',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sakura',
  },
  {
    id: 'anime-5',
    name: 'Robot vui tính thông thái',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sparky',
  },
  {
    id: 'anime-6',
    name: 'Phi hành gia du hành vũ trụ',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AstroKid',
  },
];

export default function SettingsModal() {
  const { user, isSettingsModalOpen, closeSettingsModal, updateAvatar, updatePassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'avatar' | 'password'>('avatar');
  const [avatarCategory, setAvatarCategory] = useState<'all' | 'animal' | 'cute' | 'funny' | 'anime'>('all');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(user?.avatarUrl || '');

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
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 sm:p-6 z-10 border border-slate-100 max-h-[90vh] flex flex-col"
        >
          {/* Close Button */}
          <button
            onClick={closeSettingsModal}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-5 shrink-0">
            <div className="relative">
              <img
                src={selectedAvatarUrl || user.avatarUrl}
                alt={user.displayName}
                className="w-14 h-14 rounded-full object-cover border-2 border-purple-500 shadow-md shadow-purple-500/20"
              />
              <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-purple-600 text-white text-[10px]">
                <Camera className="w-3 h-3" />
              </span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Cài Đặt Tài Khoản</h2>
              <p className="text-xs text-slate-500 font-medium">@{user.username || 'user'} • {user.displayName}</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl mb-4 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundFx.playPinClick();
                setErrorMessage(null);
                setSuccessMessage(null);
                setActiveTab('avatar');
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-4 h-4 text-rose-500" />
              <span>Đổi Mật Khẩu</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 shrink-0"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 shrink-0"
            >
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* TAB 1: AVATAR PICKER */}
          {activeTab === 'avatar' && (
            <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Chọn ảnh Meme & Động vật nổi tiếng:</span>
                </span>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'animal', label: '🐾 Động Vật Meme' },
                  { id: 'cute', label: '🎀 Cute Đáng Yêu' },
                  { id: 'funny', label: '😎 Hài Hước Meme' },
                  { id: 'anime', label: '🌸 Chibi Trendy' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      soundFx.playPinClick();
                      setAvatarCategory(cat.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      avatarCategory === cat.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Avatar Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
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
                          ? 'ring-2 ring-purple-600 bg-purple-50 scale-105'
                          : 'hover:bg-white hover:shadow-xs'
                      }`}
                      title={avatar.name}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-full h-full rounded-xl object-contain"
                      />
                      {isSelected && (
                        <span className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-purple-600 text-white shadow-xs">
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 font-mono text-slate-600"
                />
              </div>

              {/* Nút lưu ảnh đại diện */}
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={loading || selectedAvatarUrl === user.avatarUrl}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Lưu Ảnh Đại Diện</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: PASSWORD CHANGE */}
          {activeTab === 'password' && (
            <form onSubmit={handleSavePassword} className="space-y-3 flex-1">
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
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
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
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
