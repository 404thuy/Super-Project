import { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Play,
  Pause,
  Check,
  Music,
  Sparkles,
  Link as LinkIcon,
  Upload,
  FileAudio,
  Globe,
  Loader2,
} from 'lucide-react';
import {
  VIETNAMESE_MUSIC_LIBRARY,
  MUSIC_CATEGORIES,
  getSongCoverUrl,
  type SongItem,
} from '../data/vietnameseMusic';
import { soundFx } from '../utils/soundEffects';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: string;
  currentAudioUrl?: string;
  audioStartTime?: number;
  onSelectSong: (song: SongItem, startSeconds?: number) => void;
  onSelectCustomUrl: (url: string, startSeconds?: number) => void;
  onChangeAudioStartTime?: (startSeconds: number) => void;
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MusicLibraryModal({
  isOpen,
  onClose,
  currentPreset,
  currentAudioUrl,
  onSelectSong,
  onSelectCustomUrl,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState(currentAudioUrl || '');

  // Online Search State
  const [onlineResults, setOnlineResults] = useState<SongItem[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    dataUrl: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset playing preview when modal closes
  useEffect(() => {
    if (isOpen) {
      soundFx.preloadAllMusic();
    } else {
      if (playingSongId) {
        soundFx.stopBackgroundMusic();
        setPlayingSongId(null);
      }
    }
  }, [isOpen]);

  // Online search with debouncing
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    setIsSearchingOnline(true);
    const timer = setTimeout(async () => {
      try {
        let items: SongItem[] = [];

        // 1. Try local backend proxy first
        try {
          const res = await fetch(`/api/search-music?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.results) && data.results.length > 0) {
              items = data.results;
            }
          }
        } catch {}

        // 2. Direct Apple Music / iTunes API fallback
        if (items.length === 0) {
          const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&country=VN&media=music&limit=25`;
          const res = await fetch(itunesUrl);
          const data = await res.json();
          items = (data.results || [])
            .filter((item: any) => item.trackName && item.previewUrl)
            .map((item: any) => {
              const durationSec = item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 240;
              const mins = Math.floor(durationSec / 60);
              const secs = durationSec % 60;
              const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
              const artworkUrl = item.artworkUrl100
                ? item.artworkUrl100.replace('100x100bb', '600x600bb')
                : undefined;

              return {
                id: `online-${item.trackId}`,
                title: item.trackName,
                artist: item.artistName || 'Nghệ sĩ',
                category: 'chill' as const,
                categoryLabel: 'Tìm Kiếm Online',
                tag: item.primaryGenreName || 'Online Hit',
                duration: durationStr,
                chorusLyric: `Bản thu gốc của ca sĩ "${item.artistName}" tìm thấy từ Internet.`,
                icon: '🌐',
                color: 'from-sky-500 to-indigo-600',
                hasVocals: true,
                audioUrl: item.previewUrl,
                coverUrl: artworkUrl,
                startSeconds: 0,
                synthPreset: 'spring-acoustic' as const,
              };
            });
        }
        items.forEach((it) => {
          if (it.id) soundFx.registerSongMetadata(it.id, it.title, it.artist);
          if (it.audioUrl) soundFx.registerSongMetadata(it.audioUrl, it.title, it.artist);
        });
        setOnlineResults(items);
      } catch (err) {
        console.warn('Online music search error:', err);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter local songs
  const filteredSongs = useMemo(() => {
    return VIETNAMESE_MUSIC_LIBRARY.filter((song) => {
      // Category filter
      if (activeCategory !== 'all' && activeCategory !== 'upload' && activeCategory !== 'custom') {
        if (song.category !== activeCategory) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = song.title.toLowerCase().includes(query);
        const matchesArtist = song.artist.toLowerCase().includes(query);
        const matchesLyric = song.chorusLyric.toLowerCase().includes(query);
        const matchesTag = song.tag.toLowerCase().includes(query);
        return matchesTitle || matchesArtist || matchesLyric || matchesTag;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  // Handle play/pause preview
  const handleTogglePreview = (song: SongItem, e: React.MouseEvent, startSec: number = 0) => {
    e.stopPropagation();
    const modeKey = startSec > 0 ? `${song.id}:chorus` : song.id;
    if (playingSongId === modeKey) {
      soundFx.stopBackgroundMusic();
      setPlayingSongId(null);
    } else {
      soundFx.startBackgroundMusic(song.id, song.audioUrl, startSec);
      setPlayingSongId(modeKey);
    }
  };

  // Handle select song
  const handleSelect = (song: SongItem, startSeconds: number = 0) => {
    soundFx.playHeartPop();
    // Reset playingSongId trước để modal cleanup không stop nhạc vừa chọn
    setPlayingSongId(null);
    onSelectSong(song, startSeconds);
    onClose();
  };

  // Handle file upload in Upload Tab
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playPinClick();
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setUploadedFile({
          name: file.name,
          size: sizeMb,
          dataUrl,
        });
        soundFx.startBackgroundMusic('custom-mp3', dataUrl, 0);
        setPlayingSongId('uploaded-preview');
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply uploaded file to card
  const handleApplyUploadedFile = () => {
    if (!uploadedFile) return;
    soundFx.playHeartPop();
    onSelectCustomUrl(uploadedFile.dataUrl, 0);
    onClose();
  };

  // Handle submit custom URL
  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    soundFx.playHeartPop();
    onSelectCustomUrl(customUrlInput.trim(), 0);
    onClose();
  };

  if (!isOpen) return null;

  // Render individual song card
  const renderSongCard = (song: SongItem, isOnline: boolean = false) => {
    const isSelected = currentPreset === song.id;
    const isPlaying = playingSongId === song.id;
    const isChorusPlaying = playingSongId === `${song.id}:chorus`;

    return (
      <div
        key={song.id}
        onClick={() => handleSelect(song, 0)}
        className={`group p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isSelected
            ? 'bg-rose-50/70 border-rose-300 shadow-sm ring-1 ring-rose-400/30'
            : 'bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-rose-200'
        }`}
      >
        {/* Left info */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Singer / Cover Image */}
          <div
            data-search-exclude="true"
            className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-md border border-slate-200/90 relative group/img bg-slate-100"
          >
            <div
              className={`w-full h-full bg-gradient-to-tr ${song.color} text-white flex items-center justify-center text-lg absolute inset-0`}
            >
              {song.icon}
            </div>
            <img
              src={getSongCoverUrl(song)}
              alt={`${song.title} - ${song.artist}`}
              loading="lazy"
              data-search-exclude="true"
              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110 relative z-10"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                {song.title}
              </h4>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs font-semibold text-slate-600">{song.artist}</span>

              {isOnline ? (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 flex items-center gap-1 shadow-2xs">
                  <Globe className="w-2.5 h-2.5" />
                  <span>Internet Online</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-500">
                  {song.tag}
                </span>
              )}

              {song.hasVocals && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white flex items-center gap-1 shadow-xs">
                  <span>🎤</span>
                  <span>Có lời ca sĩ</span>
                </span>
              )}
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-full border border-slate-200/50 flex items-center gap-1">
                ⏱️ {song.duration}
              </span>
            </div>

            {/* Chorus / Description */}
            <p className="text-xs text-slate-500 mt-1 italic line-clamp-2 font-serif text-rose-950/75">
              "{song.chorusLyric}"
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div
          className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end flex-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Preview Button */}
          <button
            type="button"
            onClick={(e) => handleTogglePreview(song, e, 0)}
            title={isPlaying ? 'Dừng phát' : 'Phát bài hát'}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isPlaying
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30 animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-white" />
                <span>Dừng</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-slate-700" />
                <span>Phát</span>
              </>
            )}
          </button>

          {/* CHỈ BÀI CÓ SẴN TRÊN HỆ THỐNG MỚI CÓ NÚT "ĐIỆP KHÚC" */}
          {!isOnline && song.startSeconds && (
            <button
              type="button"
              onClick={(e) => handleTogglePreview(song, e, song.startSeconds)}
              title={isChorusPlaying ? 'Dừng nghe điệp khúc' : `Nghe thử đoạn điệp khúc (${formatSeconds(song.startSeconds)})`}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                isChorusPlaying
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-300 animate-pulse'
                  : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-xs'
              }`}
            >
              {isChorusPlaying ? (
                <>
                  <Pause className="w-3 h-3 fill-white" />
                  <span>Dừng điệp khúc ({formatSeconds(song.startSeconds)})</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-amber-200" />
                  <span>Điệp khúc ({formatSeconds(song.startSeconds)})</span>
                </>
              )}
            </button>
          )}

          {/* Select Button */}
          <button
            type="button"
            onClick={() => handleSelect(song, isChorusPlaying ? (song.startSeconds || 0) : 0)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              isSelected
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                : 'bg-white hover:bg-slate-800 hover:text-white text-slate-700 border border-slate-200 hover:border-transparent'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Đang chọn</span>
              </>
            ) : (
              <span>Chọn</span>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-rose-100 flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-rose-50/90 via-pink-50/60 to-purple-50/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Kho Nhạc Việt 20/10
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white tracking-wider shadow-xs">
                  {VIETNAMESE_MUSIC_LIBRARY.length} Bài Sẵn Có
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 flex items-center gap-1 shadow-xs hidden xs:flex">
                  <Globe className="w-2.5 h-2.5" />
                  <span>Tìm Online Mọi Bài Hát</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tìm kiếm trực tiếp từ Internet hoặc chọn bài sẵn có với nút Điệp khúc tiện lợi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-4 sm:px-7 border-b border-slate-100 bg-white space-y-3">
          {/* Live Search bar connected to Internet */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Nhập tên bài hát hoặc ca sĩ (VD: Nơi Này Có Anh, Vũ, Sơn Tùng, Đen Vâu, MONO...)"
              className="w-full pl-10 pr-24 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm bg-slate-50/60 focus:bg-white focus:outline-none focus:border-rose-400 transition-colors"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {isSearchingOnline && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-sky-500" />
                  <span>Online...</span>
                </span>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Categories Tab Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {/* Direct MP3 Upload Tab */}
            <button
              onClick={() => {
                soundFx.playPinClick();
                setActiveCategory('upload');
              }}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === 'upload'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-600/30 ring-2 ring-purple-300'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải file MP3</span>
            </button>

            {MUSIC_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  soundFx.playPinClick();
                  setActiveCategory(cat.id);
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/25'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    activeCategory === cat.id
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.id === 'all'
                    ? VIETNAMESE_MUSIC_LIBRARY.length
                    : VIETNAMESE_MUSIC_LIBRARY.filter((s) => s.category === cat.id).length}
                </span>
              </button>
            ))}

            {/* Custom URL Tab */}
            <button
              onClick={() => {
                soundFx.playPinClick();
                setActiveCategory('custom');
              }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === 'custom'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <LinkIcon className="w-3 h-3" />
              <span>Dán Link Online</span>
            </button>
          </div>
        </div>

        {/* Songs List / Search Results / Upload Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[58vh]">
          {/* TAB 1: UPLOAD LOCAL MP3 FILE */}
          {activeCategory === 'upload' ? (
            <div className="p-6 bg-gradient-to-br from-purple-50/70 via-white to-pink-50/50 rounded-3xl border-2 border-dashed border-purple-200 text-center space-y-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.ogg"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
                <FileAudio className="w-8 h-8" />
              </div>

              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="text-base font-extrabold text-slate-900">
                  Tải lên file nhạc MP3 từ máy của bạn
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Chọn bất kỳ bài hát nào từ điện thoại hoặc máy tính (Sơn Tùng, Đức Phúc, Masew...). Nhạc sẽ được phát trực tiếp 100% âm thanh chuẩn phòng thu, có giọng hát ca sĩ gốc!
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-purple-500/25 inline-flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn File Nhạc Từ Thiết Bị (.mp3, .m4a)</span>
              </button>

              {uploadedFile && (
                <div className="p-4 bg-white rounded-2xl border border-purple-200/90 shadow-sm flex items-center justify-between gap-3 text-left animate-fadeIn">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
                      🎵
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">
                        {uploadedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {uploadedFile.size} • Đang phát thử nghiệm
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyUploadedFile}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition-colors shrink-0 shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Dùng Bài Này</span>
                  </button>
                </div>
              )}
            </div>
          ) : activeCategory === 'custom' ? (
            /* TAB 2: PASTE URL */
            <form onSubmit={handleApplyCustomUrl} className="p-6 bg-slate-50/80 rounded-3xl border border-slate-200/80 space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">Dán Đường Link Nhạc Trực Tuyến</h4>
                <p className="text-xs text-slate-500">
                  Hỗ trợ link video YouTube hoặc link file âm thanh trực tiếp (.mp3, .wav, .m4a)
                </p>
              </div>

              <input
                type="url"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... hoặc https://.../audio.mp3"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:border-purple-500"
                required
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Áp Dụng Link Này</span>
                </button>
                {customUrlInput && (
                  <button
                    type="button"
                    onClick={() => {
                      if (playingSongId === 'custom') {
                        soundFx.stopBackgroundMusic();
                        setPlayingSongId(null);
                      } else {
                        soundFx.startBackgroundMusic('custom-mp3', customUrlInput, 0);
                        setPlayingSongId('custom');
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {playingSongId === 'custom' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{playingSongId === 'custom' ? 'Dừng' : 'Nghe Thử'}</span>
                  </button>
                )}
              </div>
            </form>
          ) : (
            /* TAB 3: SONGS LIST + ONLINE SEARCH RESULTS */
            <div className="space-y-4">
              {/* If actively searching, show sectioned results */}
              {searchQuery.trim().length > 0 ? (
                <>
                  {/* Local library matching results */}
                  {filteredSongs.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                        <span className="flex items-center gap-1.5">
                          <span>🎵</span>
                          <span>Kho nhạc có sẵn ({filteredSongs.length})</span>
                        </span>
                      </div>
                      <div className="space-y-2">
                        {filteredSongs.map((song) => renderSongCard(song, false))}
                      </div>
                    </div>
                  )}

                  {/* Online Search Results from Internet */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                      <span className="flex items-center gap-1.5 text-sky-700">
                        <Globe className="w-3.5 h-3.5 text-sky-600" />
                        <span>Kết quả tìm kiếm trực tiếp từ Internet ({onlineResults.length})</span>
                      </span>
                      {isSearchingOnline && (
                        <span className="flex items-center gap-1 text-[11px] text-sky-500 font-normal">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Đang tải...</span>
                        </span>
                      )}
                    </div>

                    {isSearchingOnline && onlineResults.length === 0 ? (
                      <div className="p-6 text-center bg-sky-50/50 rounded-2xl border border-sky-100">
                        <Loader2 className="w-6 h-6 mx-auto mb-2 text-sky-500 animate-spin" />
                        <p className="text-xs font-semibold text-sky-700">
                          Đang tìm kiếm bài hát trên Internet cho "{searchQuery}"...
                        </p>
                      </div>
                    ) : onlineResults.length > 0 ? (
                      <div className="space-y-2">
                        {onlineResults.map((song) => renderSongCard(song, true))}
                      </div>
                    ) : (
                      !isSearchingOnline && (
                        <div className="p-4 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
                          Chưa thấy thêm kết quả từ mạng. Thử tìm với từ khóa cụ thể hơn (tên bài hát, ca sĩ).
                        </div>
                      )
                    )}
                  </div>
                </>
              ) : filteredSongs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Music className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">Không tìm thấy bài hát nào phù hợp</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                    className="mt-3 text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Xem tất cả {VIETNAMESE_MUSIC_LIBRARY.length} bài hát
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSongs.map((song) => renderSongCard(song, false))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 sm:px-7 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Bài có sẵn hỗ trợ nút "Điệp khúc" để mở thiệp là phát ngay đoạn cao trào</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
