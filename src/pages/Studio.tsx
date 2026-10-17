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
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { TEMPLATES, type CardConfig, type CreatedCard } from '../types';
import EffectRenderer from '../components/effects/EffectRenderer';
import { encodeCardData, saveCard, generateShortId, getCardById, incrementTemplateUse } from '../utils/cardStorage';
import { soundFx, MUSIC_PRESETS } from '../utils/soundEffects';
import { PRESET_WISHES } from '../utils/presetWishes';
import { useAuth } from '../context/AuthContext';

export default function Studio() {
  const { templateId } = useParams<{ templateId: string }>();
  const location = useLocation();
  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const { user } = useAuth();

  // Persistent card ID
  const [currentCardId] = useState<string>(() => generateShortId());
  const [config, setConfig] = useState<CardConfig>(() => {
    const existing = getCardById(template.id);
    const base = existing
      ? { ...existing.cardData, images: [] }
      : { ...template.defaultConfig, musicPreset: 'romantic-piano', images: [] };
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop sound previews on unmount
  useEffect(() => {
    return () => {
      soundFx.stopBackgroundMusic();
    };
  }, []);

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

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    soundFx.playPinClick();
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64 = event.target.result as string;
          setConfig((prev) => ({
            ...prev,
            images: [...(prev.images || []), base64].slice(0, 4),
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    soundFx.playPinClick();
    setConfig((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
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
    <div className="min-h-screen bg-slate-100 flex flex-col pt-16 sm:pt-20">
      {/* Studio Header Bar */}
      <header className="fixed top-0 inset-x-0 h-16 sm:h-20 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 z-30 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/templates"
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 line-clamp-1">
              {template.titleVi}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {template.descriptionVi}
            </p>
          </div>
        </div>

        {/* Mobile View Switcher (Edit vs Preview) */}
        <div className="flex md:hidden bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setMobileTab('edit')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'edit'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Soạn</span>
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'preview'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem</span>
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleSaveAndShare}
          disabled={isSaving}
          className="px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/25 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-70"
        >
          <Share2 className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
          <span>{isSaving ? 'Đang lưu vào Oracle...' : 'Hoàn tất & Gửi'}</span>
        </button>
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

            {/* Photos Upload Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">
                  Ảnh kỷ niệm (Tối đa 4 ảnh)
                </label>
                <span className="text-[11px] text-slate-400">
                  {config.images?.length || 0}/4 ảnh
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {config.images?.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group shadow-sm"
                  >
                    <img
                      src={img}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {(config.images?.length || 0) < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50/50 flex flex-col items-center justify-center text-slate-400 hover:text-purple-600 transition-colors"
                  >
                    <Upload className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px] font-bold">Thêm</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {(config.images?.length || 0) === 0 ? (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2 flex items-start gap-1.5 font-medium leading-relaxed">
                  <span className="text-sm">💡</span>
                  <span>Chưa có ảnh nào. Nhấn nút <strong>Thêm</strong> ở trên để tải ảnh từ máy tính/điện thoại của bạn. Hệ thống sẽ lưu trực tiếp ảnh vào bảng <code>DA.CARD_IMAGES</code> của Oracle 19c.</span>
                </p>
              ) : (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200 mt-2 flex items-center gap-1.5 font-medium">
                  <span>✓</span>
                  <span>Đã tải {config.images?.length} ảnh của bạn. Ảnh sẽ hiển thị trọn vẹn trên tất cả thiết bị.</span>
                </p>
              )}
            </div>

            {/* Background Music Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-purple-600" />
                <span>Giai điệu du dương</span>
              </label>
              <select
                value={config.musicPreset || 'romantic-piano'}
                onChange={(e) => updateConfig('musicPreset', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 bg-white"
              >
                {MUSIC_PRESETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.icon} {m.name}
                  </option>
                ))}
              </select>

              {/* Custom MP3 Audio URL Input */}
              {config.musicPreset === 'custom-mp3' && (
                <div className="mt-2.5 space-y-1">
                  <input
                    type="url"
                    spellCheck={false}
                    value={config.audioUrl || ''}
                    onChange={(e) => updateConfig('audioUrl', e.target.value)}
                    placeholder="Dán link bài hát MP3 online (https://...mp3)"
                    className="w-full px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-xs focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Đường dẫn trực tiếp tới tệp âm thanh định dạng .mp3 trên internet
                  </p>
                </div>
              )}
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
            <div className="h-[520px] sm:h-[580px] rounded-2xl overflow-hidden mt-3 relative bg-slate-950">
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
