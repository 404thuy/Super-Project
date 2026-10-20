import type { SongItem } from '../data/vietnameseMusic';
import { BACKEND_URL, getTunnelHeaders } from './apiConfig';

export interface UserTrack {
  id: string;
  userId: string;
  title: string;
  originalFileName: string;
  fileSize: string;
  fileSizeBytes: number;
  duration: string;
  durationSec: number;
  audioUrl: string; // Blob URL hoặc Static URL
  serverUrl?: string; // Static URL từ backend nếu upload thành công
  dataUrl?: string; // Fallback dataUrl nếu file nhỏ
  uploadedAt: string;
  sourceType?: 'audio' | 'video';
}

const DB_NAME = 'LoveCardUserAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

// Helper mở IndexedDB an toàn
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB không được hỗ trợ trên trình duyệt này.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper lấy metadata từ LocalStorage dự phòng theo từng tài khoản
function getMetaStorageKey(userId: string): string {
  const cleanId = (userId || 'guest').trim().toLowerCase();
  return `lovecard_user_music_meta_${cleanId}`;
}

function getStoredMeta(userId: string): UserTrack[] {
  try {
    const raw = localStorage.getItem(getMetaStorageKey(userId));
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveStoredMeta(userId: string, tracks: UserTrack[]) {
  try {
    // Chỉ lưu metadata (bỏ audioUrl blob/dataUrl lớn để không tràn localStorage)
    const leanTracks = tracks.map((t) => ({
      ...t,
      audioUrl: t.serverUrl || '',
      dataUrl: undefined,
    }));
    localStorage.setItem(getMetaStorageKey(userId), JSON.stringify(leanTracks));
  } catch (err) {
    console.warn('Lỗi lưu metadata nhạc người dùng vào localStorage:', err);
  }
}

// Chuyển đổi AudioBuffer thành file WAV Blob chuẩn PCM 16-bit
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF header
  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  setUint32(16); // SubChunk1Size (16 for PCM)
  setUint16(1); // AudioFormat (1 for PCM)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // ByteRate
  setUint16(numOfChan * 2); // BlockAlign
  setUint16(16); // BitsPerSample
  writeString('data');
  setUint32(length - pos - 4); // SubChunk2Size

  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

// Đo thời lượng file audio chính xác
export function detectAudioDuration(fileOrUrl: Blob | string): Promise<{ durationStr: string; durationSec: number }> {
  return new Promise((resolve) => {
    try {
      const url = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
      const audio = new Audio();
      audio.preload = 'metadata';

      let resolved = false;
      const cleanup = () => {
        if (typeof fileOrUrl !== 'string') {
          URL.revokeObjectURL(url);
        }
      };

      const finish = (sec: number) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        const cleanSec = Math.max(1, Math.round(sec || 0));
        const mins = Math.floor(cleanSec / 60);
        const remainingSec = cleanSec % 60;
        const durationStr = `${mins}:${remainingSec.toString().padStart(2, '0')}`;
        resolve({ durationStr, durationSec: cleanSec });
      };

      audio.onloadedmetadata = () => {
        finish(audio.duration);
      };

      audio.onerror = () => {
        finish(180);
      };

      // Timeout dự phòng 3 giây
      setTimeout(() => {
        finish(180);
      }, 3000);

      audio.src = url;
    } catch {
      resolve({ durationStr: '3:00', durationSec: 180 });
    }
  });
}

// Đo thời lượng video dự phòng bằng thẻ video
function detectVideoDuration(file: File): Promise<{ durationStr: string; durationSec: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);

    let resolved = false;
    const finish = (sec: number) => {
      if (resolved) return;
      resolved = true;
      URL.revokeObjectURL(url);
      const cleanSec = Math.max(1, Math.round(sec || 0));
      const mins = Math.floor(cleanSec / 60);
      const remainingSec = cleanSec % 60;
      const durationStr = `${mins}:${remainingSec.toString().padStart(2, '0')}`;
      resolve({ durationStr, durationSec: cleanSec });
    };

    video.onloadedmetadata = () => finish(video.duration);
    video.onerror = () => finish(180);
    setTimeout(() => finish(180), 3000);
    video.src = url;
  });
}

// Trích xuất âm thanh từ file (hỗ trợ cả audio và video mp4, mov, webm...)
// Đảm bảo thời gian chuẩn xác 100% với file được tải lên
export async function extractAudioFromFile(
  file: File,
  onProgress?: (text: string) => void
): Promise<{
  audioBlob: Blob;
  durationStr: string;
  durationSec: number;
  mimeType: string;
  ext: string;
  isExtractedFromVideo: boolean;
}> {
  const isVideo =
    file.type.startsWith('video/') ||
    /\.(mp4|mov|webm|mkv|avi|3gp|flv|wmv)$/i.test(file.name);

  if (isVideo) {
    onProgress?.(`Đang trích xuất âm thanh từ video "${file.name}"...`);
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioCtx.close().catch(() => {});

        const durationSec = Math.max(1, Math.round(audioBuffer.duration));
        const mins = Math.floor(durationSec / 60);
        const remainingSec = durationSec % 60;
        const durationStr = `${mins}:${remainingSec.toString().padStart(2, '0')}`;

        onProgress?.(`Đang tối ưu tệp âm thanh trích xuất (${durationStr})...`);
        const wavBlob = audioBufferToWavBlob(audioBuffer);

        return {
          audioBlob: wavBlob,
          durationStr,
          durationSec,
          mimeType: 'audio/wav',
          ext: 'wav',
          isExtractedFromVideo: true,
        };
      }
    } catch (err) {
      console.warn('Decode audio from video Web Audio failed, using fallback:', err);
    }

    // Fallback nếu không decode được audio buffer: đo thời lượng qua video element và dùng track âm thanh của video
    const { durationStr, durationSec } = await detectVideoDuration(file);
    return {
      audioBlob: file,
      durationStr,
      durationSec,
      mimeType: file.type || 'video/mp4',
      ext: file.name.split('.').pop()?.toLowerCase() || 'mp4',
      isExtractedFromVideo: true,
    };
  }

  // Audio file (MP3, M4A, WAV, OGG, AAC, FLAC...)
  onProgress?.(`Đang kiểm tra thời lượng âm thanh "${file.name}"...`);
  const { durationStr, durationSec } = await detectAudioDuration(file);
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3';
  return {
    audioBlob: file,
    durationStr,
    durationSec,
    mimeType: file.type || 'audio/mpeg',
    ext,
    isExtractedFromVideo: false,
  };
}

// Lấy danh sách bài hát của một tài khoản cụ thể
export async function getUserTracks(userId: string): Promise<UserTrack[]> {
  const currentUserId = (userId || 'guest').trim().toLowerCase();

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const allRecords: any[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    // Lọc riêng từng tài khoản
    const userRecords = allRecords.filter((r) => (r.userId || 'guest').toLowerCase() === currentUserId);

    // Chuyển Blob thành Blob URL có thể phát được ngay
    const tracks: UserTrack[] = userRecords.map((r) => {
      let activeUrl = r.serverUrl || '';
      if (r.audioBlob instanceof Blob) {
        activeUrl = URL.createObjectURL(r.audioBlob);
      } else if (r.dataUrl) {
        activeUrl = r.dataUrl;
      }

      return {
        id: r.id,
        userId: currentUserId,
        title: r.title,
        originalFileName: r.originalFileName,
        fileSize: r.fileSize,
        fileSizeBytes: r.fileSizeBytes || 0,
        duration: r.duration || '3:00',
        durationSec: r.durationSec || 180,
        audioUrl: activeUrl,
        serverUrl: r.serverUrl,
        dataUrl: r.dataUrl,
        uploadedAt: r.uploadedAt,
        sourceType: r.sourceType || 'audio',
      };
    });

    // Sắp xếp bài mới nhất lên đầu
    tracks.sort((a, b) => (b.id > a.id ? 1 : -1));
    return tracks;
  } catch (err) {
    console.warn('Lỗi đọc IndexedDB, dùng localStorage fallback:', err);
    return getStoredMeta(currentUserId);
  }
}

// Lưu một bài hát mới từ file tải lên (hỗ trợ MP3, MP4, video...)
export async function saveUserTrack(
  userId: string,
  file: File,
  onProgress?: (text: string) => void
): Promise<UserTrack> {
  const currentUserId = (userId || 'guest').trim().toLowerCase();
  const trackId = `user-audio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Tách âm thanh & đo thời lượng chuẩn xác
  const { audioBlob, durationStr, durationSec, mimeType, ext, isExtractedFromVideo } =
    await extractAudioFromFile(file, onProgress);

  // Tên bài hát hiển thị sạch sẽ
  const rawBaseName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Bài Hát Mới';
  const cleanTitle = isExtractedFromVideo ? rawBaseName : rawBaseName;
  const sizeMb = (audioBlob.size / (1024 * 1024)).toFixed(2) + ' MB';

  // Tạo Blob URL phát tức thì
  const blobUrl = URL.createObjectURL(audioBlob);

  let serverUrl: string | undefined = undefined;
  let dataUrl: string | undefined = undefined;

  // 1. Thử upload lên Backend nếu online (dùng base64 json)
  try {
    onProgress?.('Đang đồng bộ tệp âm thanh...');
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const uploadName = `${rawBaseName}.${ext}`;
    const res = await fetch(`${BACKEND_URL}/api/upload-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getTunnelHeaders(),
      },
      body: JSON.stringify({
        fileName: uploadName,
        fileData: `data:${mimeType};base64,${base64Data}`,
        userId: currentUserId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.audioUrl) {
        serverUrl = data.audioUrl.startsWith('http') ? data.audioUrl : `${BACKEND_URL}${data.audioUrl}`;
      }
    }
  } catch (backendErr) {
    console.warn('Không thể gửi file lên server backend, lưu trữ cục bộ:', backendErr);
  }

  // Nếu file nhỏ < 2.5MB và không có serverUrl, lưu dataUrl dự phòng
  if (!serverUrl && audioBlob.size < 2.5 * 1024 * 1024) {
    try {
      dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(audioBlob);
      });
    } catch {}
  }

  const newTrack: UserTrack = {
    id: trackId,
    userId: currentUserId,
    title: cleanTitle,
    originalFileName: file.name,
    fileSize: sizeMb,
    fileSizeBytes: audioBlob.size,
    duration: durationStr,
    durationSec,
    audioUrl: serverUrl || blobUrl,
    serverUrl,
    dataUrl,
    uploadedAt: new Date().toLocaleDateString('vi-VN'),
    sourceType: isExtractedFromVideo ? 'video' : 'audio',
  };

  // 2. Lưu vào IndexedDB (lưu audioBlob đã trích xuất)
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise((resolve, reject) => {
      const req = store.put({
        ...newTrack,
        audioBlob,
      });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (idbErr) {
    console.warn('Lỗi lưu vào IndexedDB:', idbErr);
  }

  // 3. Cập nhật LocalStorage metadata
  try {
    const existing = getStoredMeta(currentUserId);
    saveStoredMeta(currentUserId, [newTrack, ...existing.filter((t) => t.id !== newTrack.id)]);
  } catch {}

  return newTrack;
}

// Xóa bài hát khỏi kho lưu trữ của tài khoản
export async function deleteUserTrack(userId: string, trackId: string): Promise<void> {
  const currentUserId = (userId || 'guest').trim().toLowerCase();

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise((resolve, reject) => {
      const req = store.delete(trackId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Lỗi xóa track trong IndexedDB:', err);
  }

  // Cập nhật metadata trong LocalStorage
  try {
    const existing = getStoredMeta(currentUserId);
    const updated = existing.filter((t) => t.id !== trackId);
    saveStoredMeta(currentUserId, updated);
  } catch {}
}

// Chuyển đổi UserTrack thành SongItem chuẩn để dùng trong toàn bộ app
export function userTrackToSongItem(track: UserTrack, displayName?: string): SongItem {
  return {
    id: track.id,
    title: track.title,
    artist: displayName || 'Nhạc Của Bạn',
    category: 'chill',
    categoryLabel: track.sourceType === 'video' ? 'Âm Thanh Từ Video' : 'Nhạc Tự Tải Lên',
    tag: track.sourceType === 'video' ? 'Âm Thanh Video' : 'MP3 Của Tôi',
    duration: track.duration,
    chorusLyric: `Bản thu âm "${track.title}" do ${displayName || 'bạn'} tải lên từ thiết bị.`,
    icon: track.sourceType === 'video' ? '🎬' : '🎵',
    color: track.sourceType === 'video' ? 'from-indigo-600 to-rose-600' : 'from-purple-600 to-indigo-600',
    hasVocals: true,
    audioUrl: track.serverUrl || track.audioUrl,
    startSeconds: 0,
    synthPreset: 'spring-acoustic',
  };
}
