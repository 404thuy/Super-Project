import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Server,
  KeyRound,
  Globe,
  Sparkles,
} from 'lucide-react';
import {
  isSupabaseReady,
  supabaseUrl,
  supabaseAnonKey,
  getSupabaseSource,
  saveLocalSupabaseConfig,
  clearLocalSupabaseConfig,
  testSupabaseConnection,
} from '../utils/supabaseClient';
import { soundFx } from '../utils/soundEffects';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DatabaseModal({ isOpen, onClose }: DatabaseModalProps) {
  const [url, setUrl] = useState(supabaseUrl);
  const [key, setKey] = useState(supabaseAnonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'guide'>('config');

  const source = getSupabaseSource();

  useEffect(() => {
    if (isOpen) {
      setUrl(supabaseUrl);
      setKey(supabaseAnonKey);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    soundFx.playPinClick();

    const res = await testSupabaseConnection();
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      soundFx.playSuccessChime();
    }
  };

  const handleSave = () => {
    soundFx.playPinClick();
    if (!url.trim() || !key.trim()) {
      setTestResult({
        success: false,
        message: 'Vui lòng điền đầy đủ cả Supabase URL và Anon Public Key.',
      });
      return;
    }
    saveLocalSupabaseConfig(url, key);
  };

  const handleReset = () => {
    soundFx.playPinClick();
    clearLocalSupabaseConfig();
  };

  const handleCopyGuide = () => {
    soundFx.playPinClick();
    navigator.clipboard.writeText(`VITE_SUPABASE_URL=${url || 'YOUR_SUPABASE_URL'}\nVITE_SUPABASE_ANON_KEY=${key || 'YOUR_SUPABASE_ANON_KEY'}`);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Database className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Cơ Sở Dữ Liệu Cloud</h3>
                <p className="text-xs text-white/70">Supabase Cloud PostgreSQL (Miễn Phí 100%)</p>
              </div>
            </div>

            {/* Live Status Badge */}
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-white/10 border border-white/15">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isSupabaseReady ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isSupabaseReady ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
              </span>
              <span>
                {isSupabaseReady
                  ? `Đang kết nối Cloud (${source === 'env' ? 'Biến môi trường' : 'Cấu hình trình duyệt'})`
                  : 'Chưa kết nối Cloud (Đang lưu tạm trên trình duyệt)'}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50 gap-2">
            <button
              onClick={() => setActiveTab('config')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
                activeTab === 'config'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Cấu Hình & Kiểm Tra
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
                activeTab === 'guide'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Hướng Dẫn Tạo Free (3 Phút)
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
            {activeTab === 'config' ? (
              <>
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 text-indigo-900 text-xs leading-relaxed">
                  <p className="font-bold flex items-center gap-1.5 mb-1 text-indigo-950">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Đồng bộ vĩnh viễn trên mọi thiết bị:
                  </p>
                  Khi kết nối Supabase Cloud, thiệp và ảnh của bạn sẽ được lưu trên Internet. Người nhận mở link trên điện thoại bất kỳ đều xem trọn vẹn hình ảnh, nhạc và lời chúc!
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Project URL (Supabase)
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://your-project.supabase.co"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Anon Public Key
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Test Feedback */}
                {testResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span className="font-medium leading-relaxed">{testResult.message}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={isTesting}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-xs text-white shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Lưu & Kích Hoạt Ngay</span>
                  </button>
                </div>

                {source === 'local' && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-[11px] text-slate-400 hover:text-rose-600 underline"
                    >
                      Xóa cấu hình trình duyệt & dùng lại mặc định
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Tạo tài khoản Supabase Free</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Truy cập{' '}
                        <a
                          href="https://supabase.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-600 font-bold hover:underline inline-flex items-center gap-0.5"
                        >
                          supabase.com <ExternalLink className="w-3 h-3" />
                        </a>{' '}
                        và đăng nhập bằng GitHub hoặc Email. Tạo New Project mới (đặt tên ví dụ: <code>lovecard</code>).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Chạy file SQL khởi tạo</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Trong bảng điều khiển Supabase, chọn mục <strong>SQL Editor</strong> ở thanh menu trái. Mở file <code>supabase_schema.sql</code> trong thư mục dự án của bạn, copy toàn bộ và dán vào rồi nhấn <strong>Run</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Lấy API Keys</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Vào mục <strong>Project Settings</strong> ➔ <strong>API</strong>. Copy <code>Project URL</code> và <code>anon public key</code> dán vào tab Cấu hình bên cạnh!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Cấu hình Vercel để chạy vĩnh viễn</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Trên trang Vercel: Chọn dự án của bạn ➔ <strong>Settings</strong> ➔ <strong>Environment Variables</strong>. Thêm 2 biến:
                      </p>
                      <div className="mt-1.5 p-2 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] flex items-center justify-between">
                        <span>VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY</span>
                        <button
                          type="button"
                          onClick={handleCopyGuide}
                          className="text-purple-300 hover:text-white flex items-center gap-1"
                        >
                          {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
