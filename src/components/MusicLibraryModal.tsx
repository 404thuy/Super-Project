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
  User as UserIcon,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import {
  VIETNAMESE_MUSIC_LIBRARY,
  MUSIC_CATEGORIES,
  getSongCoverUrl,
  type SongItem,
} from '../data/vietnameseMusic';
import { soundFx } from '../utils/soundEffects';
import { useAuth } from '../context/AuthContext';
import {
  getUserTracks,
  saveUserTrack,
  deleteUserTrack,
  userTrackToSongItem,
  type UserTrack,
} from '../utils/userMusicStorage';

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
  const { user } = useAuth();
  const currentUserId = user?.id || 'guest';

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState(currentAudioUrl || '');

  // Online Search State
  const [onlineResults, setOnlineResults] = useState<SongItem[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // User Tracks State (Tab "Tôi" - Lưu trữ riêng cho từng tài khoản)
  const [mySongs, setMySongs] = useState<UserTrack[]>([]);
  const [isLoadingMySongs, setIsLoadingMySongs] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<UserTrack | null>(null);

  // File Upload State & Indicators
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    dataUrl: string;
    track?: UserTrack;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Nạp danh sách bài hát của tài khoản hiện tại khi mở modal hoặc khi user thay đổi
  const loadUserTracks = async () => {
    setIsLoadingMySongs(true);
    try {
      const tracks = await getUserTracks(currentUserId);
      setMySongs(tracks);
    } catch (err) {
      console.warn('Lỗi tải danh sách bài hát người dùng:', err);
    } finally {
      setIsLoadingMySongs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUserTracks();
      soundFx.preloadAllMusic();
    } else {
      if (playingSongId) {
        soundFx.stopBackgroundMusic();
        setPlayingSongId(null);
      }
      setUploadError(null);
      setUploadSuccessMessage(null);
      setTrackToDelete(null);
    }
  }, [isOpen, currentUserId]);

  // Online search with debouncing & resilient fallback
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    setIsSearchingOnline(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        let items: SongItem[] = [];

        // 1. Thử gọi backend proxy với timeout 2.0s để không bị treo
        try {
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const res = await fetch(`/api/search-music?q=${encodeURIComponent(q)}`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const data = await res.json();
              if (Array.isArray(data.results) && data.results.length > 0) {
                items = data.results;
              }
            }
          }
        } catch {}

        // 2. Trực tiếp Apple Music / iTunes API (Cực nhanh <200ms, CORS mở, luôn sẵn sàng trên mobile và Vercel)
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
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Filter local songs
  const filteredSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return VIETNAMESE_MUSIC_LIBRARY.filter((song) => {
      if (!q) {
        if (activeCategory !== 'all' && activeCategory !== 'upload' && activeCategory !== 'custom' && activeCategory !== 'my-music') {
          if (song.category !== activeCategory) return false;
        }
        return true;
      }
      const matchesTitle = song.title.toLowerCase().includes(q);
      const matchesArtist = song.artist.toLowerCase().includes(q);
      const matchesLyric = song.chorusLyric.toLowerCase().includes(q);
      const matchesTag = song.tag.toLowerCase().includes(q);
      return matchesTitle || matchesArtist || matchesLyric || matchesTag;
    });
  }, [activeCategory, searchQuery]);

  // Filter my uploaded songs (trong tab "Tôi" hoặc khi tìm kiếm)
  const filteredMySongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return mySongs;
    return mySongs.filter(
      (track) =>
        track.title.toLowerCase().includes(q) ||
        track.originalFileName.toLowerCase().includes(q)
    );
  }, [mySongs, searchQuery]);

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

  // Preview bài hát trong danh sách "Tôi"
  const handleToggleMyTrackPreview = (track: UserTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingSongId === track.id) {
      soundFx.stopBackgroundMusic();
      setPlayingSongId(null);
    } else {
      soundFx.startBackgroundMusic('custom-mp3', track.audioUrl, 0);
      setPlayingSongId(track.id);
    }
  };

  // Handle select song
  const handleSelect = (song: SongItem, startSeconds: number = 0) => {
    soundFx.playHeartPop();
    setPlayingSongId(null);
    onSelectSong(song, startSeconds);
    onClose();
  };

  // Chọn bài hát từ mục "Tôi" đưa vào thiệp
  const handleSelectMyTrack = (track: UserTrack) => {
    soundFx.playHeartPop();
    setPlayingSongId(null);
    const songItem = userTrackToSongItem(track, user?.displayName);
    soundFx.registerSongMetadata(songItem.id, songItem.title, songItem.artist);
    if (songItem.audioUrl) {
      soundFx.registerSongMetadata(songItem.audioUrl, songItem.title, songItem.artist);
    }
    onSelectSong(songItem, 0);
    onClose();
  };

  // Xóa bài hát khỏi kho lưu trữ của tài khoản
  const handleDeleteMyTrack = async (track: UserTrack) => {
    try {
      soundFx.playPinClick();
      await deleteUserTrack(currentUserId, track.id);
      if (playingSongId === track.id) {
        soundFx.stopBackgroundMusic();
        setPlayingSongId(null);
      }
      setMySongs((prev) => prev.filter((t) => t.id !== track.id));
      setTrackToDelete(null);
    } catch (err) {
      console.error('Lỗi khi xóa bài hát:', err);
    }
  };

  // Handle file upload: Xử lý an toàn, hiển thị trạng thái và lưu vào kho "Tôi"
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset value ngay để có thể chọn lại cùng file mà không bị kẹt onChange
    e.target.value = '';

    if (!file) return;

    // Kiểm tra loại file: hỗ trợ mọi định dạng âm thanh và video phổ biến
    const isAudioOrVideo =
      file.type.startsWith('audio/') ||
      file.type.startsWith('video/') ||
      /\.(mp3|m4a|wav|ogg|flac|aac|wma|mp4|mov|webm|mkv|avi|3gp|flv|wmv)$/i.test(file.name);

    if (!isAudioOrVideo) {
      setUploadError('Vui lòng chọn tệp âm thanh (.mp3, .m4a, .wav...) hoặc video (.mp4, .mov, .webm...)!');
      return;
    }

    // Giới hạn 150MB cho video / audio
    if (file.size > 150 * 1024 * 1024) {
      setUploadError('Dung lượng tệp vượt quá giới hạn tối đa 150MB.');
      return;
    }

    setUploadError(null);
    setUploadSuccessMessage(null);
    setIsUploading(true);
    setUploadProgressText(`Đang đọc tệp "${file.name}"...`);
    soundFx.playPinClick();

    try {
      // Lưu vào kho IndexedDB và Backend upload (tự động tách âm thanh nếu là video)
      const newTrack = await saveUserTrack(currentUserId, file, (progressMsg) => {
        setUploadProgressText(progressMsg);
      });

      // Cập nhật lại danh sách bài của user
      const updatedList = await getUserTracks(currentUserId);
      setMySongs(updatedList);

      // Tự động phát thử bài hát vừa tải lên/trích xuất
      soundFx.startBackgroundMusic('custom-mp3', newTrack.audioUrl, 0);
      setPlayingSongId(newTrack.id);

      setUploadedFile({
        name: newTrack.title,
        size: newTrack.fileSize,
        dataUrl: newTrack.audioUrl,
        track: newTrack,
      });

      const successDetail =
        newTrack.sourceType === 'video'
          ? `🎉 Đã trích xuất âm thanh từ video "${newTrack.title}" (${newTrack.duration}) và lưu vào mục "Tôi"!`
          : `🎉 Đã tải lên và lưu bài hát "${newTrack.title}" (${newTrack.duration}) vào mục "Tôi"!`;

      setUploadSuccessMessage(successDetail);
      soundFx.playSuccessChime();

      // Tự động chuyển sang tab "Tôi" để người dùng xem ngay bài hát đã lưu
      setTimeout(() => {
        setActiveCategory('my-music');
      }, 1000);
    } catch (err: any) {
      console.error('Lỗi tải tệp âm thanh/video:', err);
      setUploadError('Không thể xử lý tệp âm thanh hoặc video này. Vui lòng thử lại với tệp khác.');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  // Apply uploaded file directly
  const handleApplyUploadedFile = () => {
    if (!uploadedFile) return;
    soundFx.playHeartPop();
    if (uploadedFile.track) {
      handleSelectMyTrack(uploadedFile.track);
    } else {
      onSelectCustomUrl(uploadedFile.dataUrl, 0);
      onClose();
    }
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

  // Render individual song card from system or online
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
      {/* Hidden File Input (Hỗ trợ cả audio và video mp4, mov, webm...) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/*,.mp3,.m4a,.wav,.ogg,.aac,.flac,.wma,.mp4,.mov,.webm,.mkv,.avi,.3gp"
        onChange={handleFileChange}
        className="hidden"
      />

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
                Tìm kiếm trực tiếp từ Internet, chọn bài sẵn có hoặc xem các bài đã lưu tại mục "Tôi"
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

          {/* Categories Tab Bar: NÚT "TÔI" NẰM NGAY BÊN TRÁI NÚT "TẢI LÊN" */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {/* 1. NÚT "TÔI" (CHỈ DÙNG LƯU LẠI NHẠC ĐÃ THÊM CHO TỪNG TÀI KHOẢN) */}
            <button
              type="button"
              onClick={() => {
                soundFx.playPinClick();
                setActiveCategory('my-music');
              }}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeCategory === 'my-music'
                  ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white shadow-sm shadow-rose-600/30 ring-2 ring-rose-300'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Tôi</span>
              {mySongs.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    activeCategory === 'my-music'
                      ? 'bg-white/25 text-white'
                      : 'bg-rose-200 text-rose-800'
                  }`}
                >
                  {mySongs.length}
                </span>
              )}
            </button>

            {/* 2. NÚT "TẢI LÊN" (HỖ TRỢ MP3, MP4, VIDEO - TÁCH ÂM THÂM CHUẨN THỜI GIAN) */}
            <button
              type="button"
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
              <span>Tải lên</span>
            </button>

            {/* Các danh mục hệ thống */}
            {MUSIC_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
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
              type="button"
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
          {/* TAB: "TÔI" - CHỈ DÙNG ĐỂ LƯU LẠI NHỮNG BÀI HÁT ĐÃ THÊM CỦA TÀI KHOẢN NÀY */}
          {activeCategory === 'my-music' ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Account Header Banner */}
              <div className="p-4 bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 rounded-2xl border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 overflow-hidden border-2 border-white">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span>Kho nhạc của {user?.displayName || 'Tài khoản khách'}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        {mySongs.length} bài đã lưu
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Nơi lưu trữ lại những bài nhạc và âm thanh video bạn đã thêm, riêng biệt cho từng tài khoản.
                    </p>
                  </div>
                </div>
              </div>

              {/* Thông báo trạng thái đang tải lên nếu có */}
              {isUploading && (
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex items-center gap-3 text-purple-700 text-xs font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600 shrink-0" />
                  <span>{uploadProgressText || 'Đang xử lý và lưu âm thanh...'}</span>
                </div>
              )}

              {/* Danh sách bài hát */}
              {isLoadingMySongs ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-rose-500" />
                  <p className="text-xs">Đang nạp danh sách bài hát của bạn...</p>
                </div>
              ) : filteredMySongs.length === 0 ? (
                /* Empty state khi chưa có bài nào */
                <div className="py-10 px-6 text-center bg-slate-50/80 rounded-3xl border-2 border-dashed border-slate-200 space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm">
                    <FileAudio className="w-7 h-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-800">
                      Tài khoản của bạn chưa có bài hát nào được lưu lại
                    </h4>
                    <p className="text-xs text-slate-500">
                      Mục "Tôi" dùng để lưu lại các bài nhạc bạn đã thêm. Hãy chuyển qua mục "Tải lên" để thêm file nhạc (.mp3, .m4a...) hoặc trích xuất âm thanh từ video (.mp4, .mov...)!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playPinClick();
                      setActiveCategory('upload');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs transition-all shadow-md shadow-purple-500/25 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Chuyển Sang Tab Tải Lên</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredMySongs.map((track) => {
                    const isSelected = currentPreset === track.id || currentAudioUrl === track.audioUrl;
                    const isPlaying = playingSongId === track.id;
                    const isVideoTrack = track.sourceType === 'video';

                    return (
                      <div
                        key={track.id}
                        onClick={() => handleSelectMyTrack(track)}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                          isSelected
                            ? 'bg-rose-50/80 border-rose-300 shadow-sm ring-1 ring-rose-400/30'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-rose-200'
                        }`}
                      >
                        {/* Info */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center text-xl shadow-md shrink-0 ${
                              isVideoTrack
                                ? 'bg-gradient-to-tr from-indigo-600 to-rose-600'
                                : 'bg-gradient-to-tr from-purple-500 to-pink-500'
                            }`}
                          >
                            {isVideoTrack ? '🎬' : '🎵'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                                {track.title}
                              </h4>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  isVideoTrack
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}
                              >
                                {isVideoTrack ? '🎬 Âm Thanh Video' : 'MP3 Của Tôi'}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                ⏱️ {track.duration}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {track.fileSize}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              File gốc: {track.originalFileName} • Đã lưu ngày: {track.uploadedAt}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div
                          className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Nút Nghe Thử */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleMyTrackPreview(track, e)}
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

                          {/* Nút Chọn Bài */}
                          <button
                            type="button"
                            onClick={() => handleSelectMyTrack(track)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                                : 'bg-white hover:bg-slate-800 hover:text-white text-slate-700 border border-slate-200'
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

                          {/* Nút Xóa */}
                          <button
                            type="button"
                            onClick={() => setTrackToDelete(track)}
                            title="Xóa bài hát khỏi tài khoản"
                            className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeCategory === 'upload' ? (
            /* TAB 2: TẢI LÊN FILE ÂM THANH HOẶC VIDEO TỪ THIẾT BỊ */
            <div className="p-6 bg-gradient-to-br from-purple-50/70 via-white to-pink-50/50 rounded-3xl border-2 border-dashed border-purple-200 text-center space-y-5 animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
                <FileAudio className="w-8 h-8" />
              </div>

              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="text-base font-extrabold text-slate-900">
                  Tải lên tệp âm thanh hoặc video từ máy của bạn
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hỗ trợ tệp âm thanh (.mp3, .m4a, .wav, .ogg, .aac...) và tệp video (.mp4, .mov, .webm...). Hệ thống sẽ tự động tách âm thanh với thời lượng chuẩn xác 100% và lưu vào mục <strong className="text-purple-700">"Tôi"</strong> của tài khoản này!
                </p>
              </div>

              {/* Thông báo lỗi nếu có */}
              {uploadError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center justify-center gap-2 border border-rose-200 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Thông báo thành công nếu có */}
              {uploadSuccessMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center justify-center gap-2 border border-emerald-200 animate-fadeIn font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{uploadSuccessMessage}</span>
                </div>
              )}

              {/* Nút bấm chọn file */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-purple-500/25 inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{uploadProgressText || 'Đang xử lý tệp...'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Chọn Tệp Âm Thanh Hoặc Video (.mp3, .mp4, .mov...)</span>
                  </>
                )}
              </button>

              {/* Khung xem lại bài hát vừa nạp */}
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
                        {uploadedFile.size} • Đang phát thử nghiệm & Đã lưu vào mục "Tôi"
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyUploadedFile}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition-colors shrink-0 shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Dùng Bài Này Cho Thiệp</span>
                  </button>
                </div>
              )}
            </div>
          ) : activeCategory === 'custom' ? (
            /* TAB 3: DÁN LINK ONLINE */
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
            /* TAB 4: KHO BÀI HÁT CÓ SẴN + TÌM KIẾM ONLINE */
            <div className="space-y-4">
              {/* If actively searching, show sectioned results */}
              {searchQuery.trim().length > 0 ? (
                <>
                  {/* Local uploaded songs matching query */}
                  {filteredMySongs.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                        <span className="flex items-center gap-1.5 text-purple-700">
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>Bài hát trong mục "Tôi" ({filteredMySongs.length})</span>
                        </span>
                      </div>
                      <div className="space-y-2">
                        {filteredMySongs.map((track) => {
                          const isSelected = currentPreset === track.id || currentAudioUrl === track.audioUrl;
                          const isPlaying = playingSongId === track.id;
                          return (
                            <div
                              key={track.id}
                              onClick={() => handleSelectMyTrack(track)}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-rose-50 border-rose-300'
                                  : 'bg-white hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
                                  🎵
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-extrabold text-xs text-slate-900 truncate">
                                    {track.title}
                                  </h4>
                                  <p className="text-[10px] text-slate-400">
                                    {track.fileSize} • ⏱️ {track.duration} • Bài hát của tôi
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleMyTrackPreview(track, e)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
                                >
                                  {isPlaying ? 'Dừng' : 'Phát'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSelectMyTrack(track)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-600 text-white"
                                >
                                  Chọn
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
      </div>

      {/* Modal xác nhận xóa bài hát */}
      {trackToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-rose-100 text-center space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Xác nhận xóa bài hát?
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Bạn có chắc muốn xóa bài <strong>"{trackToDelete.title}"</strong> khỏi kho lưu trữ của tài khoản?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTrackToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMyTrack(trackToDelete)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-colors shadow-md shadow-rose-600/25 cursor-pointer"
              >
                Xóa bài hát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
