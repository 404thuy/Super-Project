import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ArrowRight, Heart, Sparkles } from 'lucide-react';
import { TEMPLATES } from '../types';
import {
  formatStat,
  getTemplateLiveStats,
  getUserLikedTemplateIds,
  toggleTemplateHeart,
  fetchLiveTemplateStats,
} from '../utils/cardStorage';
import { soundFx } from '../utils/soundEffects';
import { useAuth } from '../context/AuthContext';

type Category = 'all' | '20-10' | 'love' | 'birthday' | 'gratitude' | 'friends';

const CATEGORY_TABS: { value: Category; label: string; icon: string }[] = [
  { value: 'all', label: 'Tất cả', icon: '✨' },
  { value: '20-10', label: '20/10 & 8/3', icon: '🌹' },
  { value: 'love', label: 'Tình yêu', icon: '💖' },
  { value: 'birthday', label: 'Sinh nhật', icon: '🎂' },
  { value: 'gratitude', label: 'Tri ân Mẹ & Cô', icon: '🏮' },
  { value: 'friends', label: 'Bạn bè', icon: '🎞️' },
];

export default function Templates() {
  const { user, openAuthModal } = useAuth();
  const [category, setCategory] = useState<Category>('all');
  const [likedTemplateIds, setLikedTemplateIds] = useState<string[]>(() =>
    getUserLikedTemplateIds(user ? user.id : null)
  );
  // Re-render trigger when hearts change
  const [, setHeartVersion] = useState(0);

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
    return () => {
      isCurrent = false;
    };
  }, [user]);

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

  const filteredTemplates =
    category === 'all'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === category);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden pt-24 sm:pt-28 pb-28 sm:pb-24 px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #fbcfe8, #ddd6fe, transparent 70%)' }}
        />
        <div
          className="absolute bottom-10 left-10 w-[400px] h-[400px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #bae6fd, #fed7aa, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8 sm:space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[11px] font-bold tracking-widest text-rose-600 uppercase px-3 py-1 rounded-full bg-rose-100">
            Kho Mẫu Thiệp 20/10
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Chọn Mẫu Thiệp Gửi Người Thương
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Chạm vào thiệp bạn thích để bắt đầu viết lời chúc, hoặc thả tim để lưu vào danh sách lịch sử.
          </p>
        </div>

        {/* Category Filter Pills (Horizontal scroll on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar justify-start sm:justify-center">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                category === tab.value
                  ? 'bg-slate-900 text-white shadow-md scale-[1.02]'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-sm'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Clean, Non-cluttered Template Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredTemplates.map((tmpl) => {
            const isLiked = likedTemplateIds.includes(tmpl.id);
            const stats = getTemplateLiveStats(tmpl.id);

            return (
              <div
                key={tmpl.id}
                className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Entire upper portion is clickable directly to Studio */}
                <Link to={`/studio/${tmpl.id}`} className="block relative">
                  {/* Hero Image Section (Chiếm diện tích lớn, tỉ lệ 4:3 đẹp mắt) */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                    <img
                      src={tmpl.thumbnail}
                      alt={tmpl.titleVi}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-black/25" />

                    {/* Category Pill */}
                    <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-extrabold text-slate-800 shadow-sm pointer-events-none">
                      {tmpl.category === '20-10'
                        ? '🌹 20/10'
                        : tmpl.category === 'love'
                        ? '💖 Tình yêu'
                        : tmpl.category === 'birthday'
                        ? '🎂 Sinh nhật'
                        : tmpl.category === 'gratitude'
                        ? '🏮 Tri ân'
                        : '🎞️ Bạn bè'}
                    </div>

                    {/* Action Controls: Preview & Heart Button */}
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10">
                      <Link
                        to={`/card/demo-${tmpl.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-black/50 hover:bg-black/75 backdrop-blur-md text-white p-2 rounded-full text-xs font-semibold shadow-sm flex items-center justify-center transition-all active:scale-90 hover:scale-105"
                        title="Xem thử thiệp mẫu"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => handleToggleHeart(tmpl.id, e)}
                        className={`p-2 rounded-full backdrop-blur-md transition-all active:scale-90 flex items-center justify-center cursor-pointer hover:scale-105 ${
                          isLiked
                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/40 ring-2 ring-white/70'
                            : 'bg-black/50 hover:bg-black/75 text-white hover:text-rose-300'
                        }`}
                        title={
                          isLiked
                            ? 'Bỏ thích mẫu này (Đã lưu trong Lịch Sử)'
                            : 'Thả tim & lưu mẫu vào Lịch Sử'
                        }
                      >
                        <Heart
                          className={`w-3.5 h-3.5 transition-transform ${
                            isLiked ? 'fill-white text-white scale-110' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Live Stats Pill ở góc dưới trái của ảnh */}
                    <div className="absolute bottom-3 left-3.5 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md text-[11px] font-medium text-white/90 pointer-events-none">
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
                </Link>

                {/* Bottom Compact Info: Tiêu đề nổi bật & Nút Tạo thiệp gọn gàng */}
                <div className="p-4 sm:p-4.5 flex items-center justify-between gap-3 bg-white">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/studio/${tmpl.id}`}
                      className="block font-extrabold text-sm sm:text-base text-slate-900 hover:text-purple-600 transition-colors truncate"
                      title={tmpl.titleVi}
                    >
                      {tmpl.icon} {tmpl.titleVi}
                    </Link>
                    <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      Hiệu ứng 3D • Mở khóa trải nghiệm
                    </p>
                  </div>

                  <Link
                    to={`/studio/${tmpl.id}`}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-rose-500 hover:from-purple-700 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md hover:shadow-purple-500/20 flex items-center gap-1.5 active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    <span>Tạo thiệp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
