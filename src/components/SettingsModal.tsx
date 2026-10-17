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
  ShieldCheck,
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundFx } from '../utils/soundEffects';

interface PresetAvatar {
  id: string;
  name: string;
  url: string;
  category: 'cute' | 'funny' | 'anime';
}

const PRESET_AVATARS: PresetAvatar[] = [
  // Cute Chibi Avatars
  {
    id: 'cute-1',
    name: 'Bé thỏ hồng',
    category: 'cute',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=PinkBunny',
  },
  {
    id: 'cute-2',
    name: 'Bé gấu nâu',
    category: 'cute',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=BrownBear',
  },
  {
    id: 'cute-3',
    name: 'Mèo con má đào',
    category: 'cute',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=KittenPeach',
  },
  {
    id: 'cute-4',
    name: 'Cún con vui vẻ',
    category: 'cute',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=HappyPuppy',
  },
  {
    id: 'cute-5',
    name: 'Panda dễ thương',
    category: 'cute',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=PandaSweet',
  },
  {
    id: 'cute-6',
    name: 'Vịt con vàng óng',
    category: 'cute',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Duckling',
  },

  // Hài Hước & Biểu Cảm Vui Nhộn
  {
    id: 'funny-1',
    name: 'Mặt cười ngầu',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=CoolEmoji',
  },
  {
    id: 'funny-2',
    name: 'Thả tim ngọt ngào',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=HeartEyes',
  },
  {
    id: 'funny-3',
    name: 'Cười tít mắt',
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
    name: 'Mặt ngơ ngác đáng yêu',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=SillyFace',
  },
  {
    id: 'funny-6',
    name: 'Biểu tượng lấp lánh',
    category: 'funny',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=SparkleFace',
  },

  // Chibi & Anime Trendy
  {
    id: 'anime-1',
    name: 'Bé dâu tây má hồng',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Strawberry',
  },
  {
    id: 'anime-2',
    name: 'Cô bé tai mèo',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=NekoChan',
  },
  {
    id: 'anime-3',
    name: 'Boy hoodie ngầu',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=LeoCool',
  },
  {
    id: 'anime-4',
    name: 'Hoa anh đào Sakura',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sakura',
  },
  {
    id: 'anime-5',
    name: 'Bé thỏ Chibi',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bunny',
  },
  {
    id: 'anime-6',
    name: 'Robot vui tính',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sparky',
  },
];

export default function SettingsModal() {
  const { user, isSettingsModalOpen, closeSettingsModal, updateAvatar, updatePassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'avatar' | 'password'>('avatar');
  const [avatarCategory, setAvatarCategory] = useState<'all' | 'cute' | 'funny' | 'anime'>('all');
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
      }, 1200);
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
      }, 1500);
    } else {
      setErrorMessage(res.error || 'Đổi mật khẩu thất bại');
    }
  };

  const filteredAvatars =
    avatarCategory === 'all'
      ? PRESET_AVATARS
      : PRESET_AVATARS.filter((a) => a.category === avatarCategory);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSettingsModal}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ y: '100%', opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-7 z-10 border border-slate-100 max-h-[92vh] overflow-y-auto"
        >
          {/* Mobile Drag Pill */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

          {/* Close Button */}
          <button
            onClick={closeSettingsModal}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-5">
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
              <p className="text-xs text-slate-500 truncate max-w-[240px] sm:max-w-xs">{user.email}</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => {
                soundFx.playPinClick();
                setErrorMessage(null);
                setSuccessMessage(null);
                setActiveTab('avatar');
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
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
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
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
              className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* TAB 1: AVATAR PICKER */}
          {activeTab === 'avatar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Chọn ảnh có sẵn (Cute, Hài hước, Hot)</span>
                </span>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'cute', label: '🐾 Cute Đáng Yêu' },
                  { id: 'funny', label: '😎 Hài Hước Meme' },
                  { id: 'anime', label: '🌸 Chibi Trendy' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setAvatarCategory(cat.id as typeof avatarCategory)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      avatarCategory === cat.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Avatar Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-60 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
                {filteredAvatars.map((preset) => {
                  const isSelected = selectedAvatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        soundFx.playPinClick();
                        setSelectedAvatarUrl(preset.url);
                      }}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group ${
                        isSelected
                          ? 'border-purple-600 ring-2 ring-purple-600/30 scale-105 shadow-md'
                          : 'border-slate-200 hover:border-purple-300 hover:scale-105'
                      }`}
                      title={preset.name}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Image URL input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Hoặc dán đường link ảnh tùy chọn:
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/anh-cua-ban.jpg"
                  value={selectedAvatarUrl}
                  onChange={(e) => setSelectedAvatarUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={loading || selectedAvatarUrl === user.avatarUrl}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-rose-500 hover:opacity-95 text-white font-bold text-sm shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu ảnh...</span>
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

          {/* TAB 2: CHANGE PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handleSavePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu mới <span className="text-slate-400 font-normal">(tối thiểu 6 ký tự)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-sm shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang cập nhật mật khẩu...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Cập Nhật Mật Khẩu</span>
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
