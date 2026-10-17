import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Copy,
  Check,
  Trash2,
  Calendar,
  Heart,
  QrCode,
  X,
  History,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Download,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { TEMPLATES, type CreatedCard, type CardTemplate } from '../types';
import {
  getUserCards,
  fetchUserCards,
  deleteCard,
  encodeCardData,
  formatStat,
  getLikedTemplates,
  toggleTemplateHeart,
  fetchLiveTemplateStats,
  getTemplateLiveStats,
} from '../utils/cardStorage';
import { soundFx } from '../utils/soundEffects';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [cards, setCards] = useState<CreatedCard[]>(() => getUserCards(user ? user.id : null));
  const [likedTemplates, setLikedTemplates] = useState<CardTemplate[]>(() =>
    getLikedTemplates(user ? user.id : null)
  );
  const [activeTab, setActiveTab] = useState<'cards' | 'liked'>('cards');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQrCard, setActiveQrCard] = useState<CreatedCard | null>(null);

  // Sync history & liked templates from Oracle 19c whenever user logs in, logs out, or switches accounts
  useEffect(() => {
    let isCurrent = true;
    async function loadData() {
      if (user) {
        const remoteCards = await fetchUserCards();
        if (isCurrent) setCards(remoteCards);
        const statsData = await fetchLiveTemplateStats();
        if (isCurrent) {
          setLikedTemplates(TEMPLATES.filter((t) => statsData.likedTemplateIds.includes(t.id)));
        }
      } else {
        if (isCurrent) {
          setCards(getUserCards(null));
          setLikedTemplates([]);
        }
      }
    }
    loadData();
    return () => {
      isCurrent = false;
    };
  }, [user]);

  const handleCopyLink = (card: CreatedCard) => {
    soundFx.playPinClick();
    const encoded = 'c_' + encodeCardData(card.templateId, card.cardData, card.id);
    const url = `${window.location.origin}/card/${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(card.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDelete = async (cardId: string) => {
    soundFx.playPinClick();
    if (window.confirm('Bạn có chắc chắn muốn xóa thiệp này khỏi lịch sử của bạn?')) {
      await deleteCard(cardId);
      const updated = await fetchUserCards();
      setCards(updated);
    }
  };

  const handleRemoveLiked = async (templateId: string) => {
    if (!user) return;
    soundFx.playPinClick();
    await toggleTemplateHeart(templateId, user.id);
    const statsData = await fetchLiveTemplateStats();
    setLikedTemplates(TEMPLATES.filter((t) => statsData.likedTemplateIds.includes(t.id)));
  };

  const getCardShareUrl = (card: CreatedCard) => {
    const encoded = 'c_' + encodeCardData(card.templateId, card.cardData, card.id);
    return `${window.location.origin}/card/${encoded}`;
  };

  const handleDownloadQr = (card: CreatedCard) => {
    soundFx.playSuccessChime();
    const svg = document.getElementById('dashboard-qr-svg');
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
        downloadLink.download = `LoveCard-QR-${card.cardData.recipientName || '20-10'}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden pt-24 sm:pt-28 pb-28 sm:pb-24 px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-10 right-10 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #fbcfe8, #c084fc, transparent 70%)' }}
        />
        <div
          className="absolute bottom-10 left-10 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #bae6fd, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Title */}
        <div>
          <span className="text-xs font-bold tracking-widest text-purple-600 uppercase px-3 py-1 rounded-full bg-purple-100 flex items-center gap-1.5 w-fit">
            <History className="w-3.5 h-3.5" />
            <span>Lịch Sử Hoạt Động</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Lịch Sử{' '}
            <span className="bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
              Tài Khoản
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Lưu giữ riêng biệt các thiệp đã tạo và những mẫu thiệp bạn đã thả tim yêu thích.
          </p>
        </div>

        {/* Clean Tab Switcher: Thiệp Đã Dùng vs Mẫu Đã Thích */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => {
              soundFx.playPinClick();
              setActiveTab('cards');
            }}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'cards'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Thiệp đã dùng ({cards.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playPinClick();
              setActiveTab('liked');
            }}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'liked'
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${activeTab === 'liked' ? 'fill-white' : 'text-rose-500'}`}
            />
            <span>Mẫu đã thả tim ({likedTemplates.length})</span>
          </button>
        </div>

        {/* Tab 1: Created Cards List */}
        {activeTab === 'cards' && (
          <div className="space-y-4">
            {cards.length === 0 ? (
              <div className="bg-white p-10 sm:p-14 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-2xl text-slate-400">
                  <History className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-slate-700 font-bold text-base">Chưa có lịch sử thiệp nào</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Mỗi khi bạn tạo thiệp hoặc chia sẻ cho người thân, thiệp sẽ được lưu riêng tại đây.
                  </p>
                </div>
                <Link to="/templates">
                  <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition-opacity">
                    Khám phá mẫu thiệp ngay ✨
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cards.map((card) => {
                  const template = TEMPLATES.find((t) => t.id === card.templateId) || TEMPLATES[0];

                  return (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Thumbnail Header */}
                        <div className="relative h-36 bg-slate-900 overflow-hidden">
                          <img
                            src={template.thumbnail}
                            alt={card.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-800">
                            {template.icon} {template.titleVi}
                          </div>

                          <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-white text-xs font-bold">
                            <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px]">
                              <Eye className="w-3 h-3 text-purple-300" />
                              <span>{card.viewsCount || 0}</span>
                            </span>
                            <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px]">
                              <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                              <span>{card.heartsCount || 0}</span>
                            </span>
                          </div>
                        </div>

                        {/* Card Content Details */}
                        <div className="p-4 sm:p-5 space-y-2">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1">
                            {card.title || template.titleVi}
                          </h3>

                          <div className="text-xs text-slate-600 space-y-1">
                            <p>
                              <span className="text-slate-400">Gửi đến:</span>{' '}
                              <span className="font-bold text-rose-600">
                                {card.cardData.recipientName}
                              </span>
                            </p>
                            <p>
                              <span className="text-slate-400">Người gửi:</span>{' '}
                              <span className="font-semibold text-slate-700">
                                {card.cardData.senderName}
                              </span>
                            </p>
                            <p className="flex items-center gap-1 text-slate-400 pt-1 text-[11px]">
                              <Calendar className="w-3 h-3" />
                              <span>Lưu ngày: {card.createdAt}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyLink(card)}
                            title="Sao chép link gửi"
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                              copiedId === card.id
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {copiedId === card.id ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedId === card.id ? 'Đã chép' : 'Sao chép'}</span>
                          </button>

                          <button
                            onClick={() => setActiveQrCard(card)}
                            title="Mở mã QR"
                            className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(card.id)}
                            title="Xóa khỏi lịch sử"
                            className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <Link
                          to={`/card/${card.id}`}
                          target="_blank"
                          className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                          <span>Mở thiệp</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Liked Templates List (Saved in History) */}
        {activeTab === 'liked' && (
          <div className="space-y-4">
            {likedTemplates.length === 0 ? (
              <div className="bg-white p-10 sm:p-14 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-2xl text-rose-500">
                  <Heart className="w-8 h-8 fill-rose-500 text-rose-500" />
                </div>
                <div>
                  <p className="text-slate-700 font-bold text-base">
                    Chưa có mẫu thiệp nào được thả tim
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Hãy bấm nút thả tim (💖) ở bất kỳ mẫu thiệp nào bạn ưng ý để lưu nhanh vào đây.
                  </p>
                </div>
                <Link to="/templates">
                  <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition-opacity">
                    Khám phá mẫu thiệp ngay ✨
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {likedTemplates.map((tmpl) => {
                  const stats = getTemplateLiveStats(tmpl.id);

                  return (
                    <motion.div
                      key={tmpl.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Thumbnail Cover */}
                        <div className="relative h-44 bg-slate-900 overflow-hidden">
                          <img
                            src={tmpl.thumbnail}
                            alt={tmpl.titleVi}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-800">
                            {tmpl.icon} {tmpl.titleVi}
                          </div>

                          {/* Quick Remove Heart Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveLiked(tmpl.id)}
                            className="absolute top-3 right-3 bg-rose-500 text-white p-2 rounded-full shadow-md hover:scale-110 active:scale-90 transition-all"
                            title="Bỏ thích mẫu này"
                          >
                            <Heart className="w-3.5 h-3.5 fill-white text-white" />
                          </button>

                          {/* Title overlay */}
                          <div className="absolute bottom-2.5 left-3.5 right-3.5 text-white">
                            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest block">
                              {tmpl.title}
                            </span>
                            <h3 className="font-extrabold text-sm drop-shadow-sm leading-snug">
                              {tmpl.titleVi}
                            </h3>
                          </div>
                        </div>

                        {/* Description & Stats */}
                        <div className="p-4 sm:p-5 space-y-2">
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {tmpl.descriptionVi}
                          </p>

                          <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-purple-500" />
                              <span>{formatStat(stats.views)}</span>
                            </span>
                            <span className="flex items-center gap-1 text-rose-600 font-bold">
                              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                              <span>{formatStat(stats.hearts)}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span>{formatStat(stats.uses)} lượt tạo</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                        <Link
                          to={`/card/demo-${tmpl.id}`}
                          className="text-xs font-semibold text-slate-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem mẫu</span>
                        </Link>

                        <Link
                          to={`/studio/${tmpl.id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                        >
                          <span>Tạo thiệp này</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {activeQrCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          onClick={() => setActiveQrCard(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">
                Mã QR Thiệp: {activeQrCard.cardData.recipientName}
              </span>
              <button
                onClick={() => setActiveQrCard(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                <QRCodeSVG id="dashboard-qr-svg" value={getCardShareUrl(activeQrCard)} size={180} />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Quét camera để mở thiệp ngay
              </p>
              <button
                type="button"
                onClick={() => handleDownloadQr(activeQrCard)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Tải ảnh mã QR (PNG) về máy</span>
              </button>
            </div>

            <button
              onClick={() => handleCopyLink(activeQrCard)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép đường dẫn trực tiếp</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
