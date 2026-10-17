import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  Heart,
  AlertCircle,
  Loader2,
  AtSign,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundFx } from '../utils/soundEffects';

// Chuyển đổi mọi lỗi kỹ thuật database thành thông báo tiếng Việt ngắn gọn, thân thiện
function formatFriendlyError(msg: string | null): string | null {
  if (!msg) return null;
  if (
    msg.includes('ORA-01017') ||
    msg.includes('logon denied') ||
    msg.includes('invalid username/password')
  ) {
    return 'Tên tài khoản hoặc mật khẩu không chính xác.';
  }
  if (msg.includes('ORA-00001') || msg.includes('unique constraint')) {
    return 'Tên tài khoản này đã tồn tại trong hệ thống. Vui lòng chọn tên khác.';
  }
  if (
    msg.includes('ORA-') ||
    msg.includes('docs.oracle.com') ||
    msg.includes('TNS') ||
    msg.includes('Lỗi máy chủ')
  ) {
    return 'Không thể kết nối đến máy chủ cơ sở dữ liệu Oracle. Vui lòng kiểm tra lại dịch vụ.';
  }
  return msg;
}

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    loginWithPassword,
    registerUser,
    loginWithEmail,
  } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  // Xử lý gửi biểu mẫu đăng nhập / đăng ký
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Chuẩn hóa tên tài khoản: viết thường, bỏ khoảng trắng thừa
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');

    if (!cleanUsername) {
      setErrorMessage('Vui lòng nhập tên tài khoản');
      return;
    }

    const usernameRegex = /^[a-z0-9_]{3,30}$/;
    if (!usernameRegex.test(cleanUsername)) {
      setErrorMessage('Tên tài khoản phải viết liền không dấu, từ 3-30 ký tự (chỉ gồm a-z, 0-9 và dấu _)');
      return;
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }

    if (tab === 'register' && password.length < 6) {
      setErrorMessage('Mật khẩu cần tối thiểu 6 ký tự để bảo mật');
      return;
    }

    setLoading(true);
    soundFx.playPinClick();

    if (tab === 'login') {
      const res = await loginWithPassword(cleanUsername, password);
      setLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Tên tài khoản hoặc mật khẩu không chính xác');
      } else {
        soundFx.playSuccessChime();
      }
    } else {
      const name = displayName.trim() || cleanUsername;
      const res = await registerUser(cleanUsername, password, name);
      setLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Đăng ký không thành công');
      } else {
        soundFx.playSuccessChime();
      }
    }
  };

  // Đăng nhập nhanh khách trải nghiệm
  const handleQuickDemo = async () => {
    setErrorMessage(null);
    setLoading(true);
    await loginWithEmail('khach_trainghiem', 'Khách Trải Nghiệm');
    setLoading(false);
    soundFx.playSuccessChime();
  };

  const friendlyError = formatFriendlyError(errorMessage);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window: Gọn gàng, thẩm mỹ cao */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl p-5 sm:p-6 z-10 border border-slate-100 overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center space-y-1 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-md shadow-rose-500/20">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 pt-1">
              {tab === 'login' ? 'Đăng nhập tài khoản' : 'Đăng ký tài khoản mới'}
            </h2>
            <p className="text-xs text-slate-500">
              {tab === 'login'
                ? 'Nhập tên tài khoản và mật khẩu để tiếp tục.'
                : 'Tạo tài khoản cá nhân để lưu trữ và quản lý thiệp 20/10.'}
            </p>
          </div>

          {/* Error Message Alert */}
          {friendlyError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{friendlyError}</span>
            </motion.div>
          )}

          {/* Form Đăng ký / Đăng nhập thủ công */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Tên tài khoản (chuẩn không dấu, viết liền) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">
                  {tab === 'register' ? 'Tên đăng ký / Tên tài khoản' : 'Tên tài khoản'}
                </label>
                {tab === 'register' && (
                  <span className="text-[10px] text-slate-400">viết liền, không dấu</span>
                )}
              </div>
              <div className="relative">
                <AtSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder={tab === 'register' ? 'VD: nguyenvana, lovecard2010...' : 'Nhập tên tài khoản của bạn...'}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Tên hiển thị (chỉ hiển thị khi Đăng ký) */}
            {tab === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Họ và tên hiển thị <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 placeholder:text-slate-400"
                  />
                </div>
              </motion.div>
            )}

            {/* Mật khẩu */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Mật khẩu
                </label>
                {tab === 'register' && (
                  <span className="text-[10px] text-slate-400">tối thiểu 6 ký tự</span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* Nút Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>{tab === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Chuyển đổi Đăng nhập / Đăng ký & Nút dùng thử */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={loading}
              className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Dùng thử nhanh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setTab(tab === 'login' ? 'register' : 'login');
              }}
              className="text-slate-600 hover:text-slate-900 font-bold hover:underline cursor-pointer"
            >
              {tab === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
