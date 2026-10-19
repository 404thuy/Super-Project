import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Wind, Heart, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

interface SeedParasol {
  id: number;
  angle: number; // 0 to 360 degrees
  distance: number; // radial offset from center
  scale: number;
  vx: number;
  vy: number;
  rotSpeed: number;
}

const BLOW_THRESHOLD = 60; // volume dB-ish level to trigger
const MIC_SENSITIVITY = 60;

// Bespoke Botanical Dandelion Core SVG
function SculptedGoldenDandelion({ isBlowing }: { isBlowing: boolean }) {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center pointer-events-none">
      {/* Outer Golden Glow */}
      <div className="absolute w-36 h-36 rounded-full bg-emerald-400/20 blur-2xl animate-pulse" />
      <div className="absolute w-24 h-24 rounded-full bg-amber-300/30 blur-xl" />

      {/* Stem */}
      <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 overflow-visible" width="6" height="120" viewBox="0 0 6 120">
        <defs>
          <linearGradient id="dandelionStemGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="50%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#14532D" />
          </linearGradient>
        </defs>
        <path d="M 3 0 Q 6 60 3 120" stroke="url(#dandelionStemGrad)" strokeWidth="4" strokeLinecap="round" fill="none" />
      </svg>

      {/* Dandelion Receptacle Center */}
      <motion.div
        className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: 'radial-gradient(circle at 40% 35%, #FEF08A 0%, #F59E0B 60%, #78350F 100%)',
          boxShadow: '0 0 20px rgba(251, 191, 36, 0.6), inset 0 2px 4px rgba(255,255,255,0.8)',
        }}
        animate={{ scale: isBlowing ? [1, 0.85] : [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-5 h-5 rounded-full bg-amber-200/50 blur-[2px]" />
      </motion.div>
    </div>
  );
}

export default function BlowMicRevealFX({ config, mode }: Props) {
  const [phase, setPhase] = useState<'idle' | 'requesting' | 'listening' | 'blowing' | 'revealed'>('idle');
  const [micError, setMicError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [seeds, setSeeds] = useState<SeedParasol[]>([]);
  const [seedsScattered, setSeedsScattered] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef<'idle' | 'requesting' | 'listening' | 'blowing' | 'revealed'>('idle');
  const blowStreakRef = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const userImages = config.images || [];

  const recipientName = config.recipientName || 'Người Phụ Nữ Xinh Đẹp';
  const senderName = config.senderName || 'Người Luôn Nghĩ Về Em';
  const mainText =
    config.mainText ||
    'Hãy thổi nhẹ và gửi gắm những ước nguyện đẹp nhất theo từng cánh hoa bồ công anh nhé!\nChúc bạn ngày 20/10 ngập tràn nụ cười, hạnh phúc viên mãn và luôn được nâng niu yêu thương! 🌼✨';

  const defaultSamplePhotos = [
    'https://images.unsplash.com/photo-1490750967868-88df5691cc37?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80',
  ];

  const photosToDisplay = userImages.length > 0 ? userImages : defaultSamplePhotos;

  // Generate dandelion seed parasols positioned radially
  useEffect(() => {
    const total = 42;
    const initial: SeedParasol[] = Array.from({ length: total }, (_, i) => {
      const angle = (i / total) * 360 + (Math.random() * 8 - 4);
      const layer = Math.floor(i / 14); // 3 concentric rings
      const distance = 28 + layer * 22 + Math.random() * 6;
      return {
        id: i,
        angle,
        distance,
        scale: 0.85 + (i % 3) * 0.15,
        vx: 0,
        vy: 0,
        rotSpeed: (Math.random() - 0.5) * 12,
      };
    });
    setSeeds(initial);
  }, []);

  // Cleanup audio
  const stopMic = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopMic();
    };
  }, [stopMic]);

  const scatterSeeds = useCallback(() => {
    phaseRef.current = 'blowing';
    setPhase('blowing');
    setSeedsScattered(true);
    setSeeds((prev) =>
      prev.map((s) => ({
        ...s,
        vx: (Math.random() - 0.35) * 6,
        vy: -(3.5 + Math.random() * 5),
      }))
    );

    soundFx.playPaperSwoosh();
    soundFx.playSuccessChime();

    confetti({
      particleCount: 100,
      spread: 95,
      origin: { y: 0.55 },
      colors: ['#FDE047', '#FBBF24', '#86EFAC', '#34D399', '#FFFFFF'],
    });

    setTimeout(() => {
      phaseRef.current = 'revealed';
      setPhase('revealed');
      stopMic();
    }, 1200);
  }, [stopMic]);

  // Volume measurement với phaseRef luôn cập nhật
  const measureVolume = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const buf = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buf);

    let sumSquares = 0;
    for (const s of buf) {
      const n = s / 128 - 1;
      sumSquares += n * n;
    }
    const rms = Math.sqrt(sumSquares / buf.length);
    const db = Math.min(100, rms * 360);
    const currentVol = Math.round(db);
    setVolume(currentVol);

    // Ngưỡng phát hiện hơi thổi thông minh:
    // Thổi vào mic tạo tiếng rít gió đều (> 28) hoặc âm lượng tức thời (> 42)
    if (currentVol > 28) {
      blowStreakRef.current += 1;
    } else {
      blowStreakRef.current = Math.max(0, blowStreakRef.current - 1);
    }

    if ((blowStreakRef.current >= 2 || currentVol > 42) && (phaseRef.current === 'listening' || phaseRef.current === 'requesting')) {
      scatterSeeds();
      return;
    }

    rafRef.current = requestAnimationFrame(measureVolume);
  }, [scatterSeeds]);

  // Start mic
  const startMic = useCallback(async () => {
    phaseRef.current = 'requesting';
    setPhase('requesting');
    setMicError(null);
    blowStreakRef.current = 0;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      phaseRef.current = 'listening';
      setPhase('listening');
      rafRef.current = requestAnimationFrame(measureVolume);
    } catch {
      setMicError('Không thể truy cập micro. Bạn có thể nhấn nút "Thổi ngay" bên dưới.');
      phaseRef.current = 'idle';
      setPhase('idle');
    }
  }, [measureVolume]);

  const handleManualReveal = () => {
    scatterSeeds();
  };

  return (
    <div className="relative w-full h-full min-h-[100%] flex flex-col items-center justify-center overflow-y-auto sm:overflow-hidden select-none p-3 sm:p-5"
      style={{ background: 'radial-gradient(ellipse at 50% 25%, #064e3b 0%, #062f28 50%, #031512 100%)' }}>

      {/* Floating Emerald Fireflies */}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${3 + (i % 3) * 2}px`,
            height: `${3 + (i % 3) * 2}px`,
            background: i % 2 === 0 ? '#FDE047' : '#86EFAC',
            boxShadow: '0 0 10px rgba(253, 224, 71, 0.8)',
            left: `${5 + (i * 17) % 90}%`,
            top: `${10 + (i * 13) % 80}%`,
          }}
          animate={{
            y: [0, -25, 0],
            x: [0, (i % 2 === 0 ? 15 : -15), 0],
            opacity: [0.2, 0.85, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      <AnimatePresence mode="wait">
        {phase !== 'revealed' ? (
          <motion.div key="blow-stage" className="relative flex flex-col items-center gap-5 z-10 w-full max-w-sm px-4 my-auto"
            exit={{ opacity: 0, scale: 0.94 }}>

            {/* Title Badge */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-[11px] font-extrabold uppercase tracking-widest text-emerald-300 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                ĐIỀU ƯỚC BỒ CÔNG ANH
              </span>
              <h2 className="text-white text-2xl font-bold mt-2"
                style={{ fontFamily: config.fontFamily || 'Cinzel, Playfair Display, serif' }}>
                Gửi <span className="text-amber-300 drop-shadow">{config.recipientName}</span> 💫
              </h2>
            </div>

            {/* Dandelion Interactive Centerpiece */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <SculptedGoldenDandelion isBlowing={phase === 'blowing'} />

              {/* Seed Parasols */}
              {seeds.map((s) => {
                const rad = (s.angle * Math.PI) / 180;
                const ox = Math.cos(rad) * s.distance;
                const oy = Math.sin(rad) * s.distance;

                return (
                  <motion.div
                    key={s.id}
                    className="absolute pointer-events-none flex flex-col items-center"
                    style={{
                      transform: `translate(${ox}px, ${oy}px) rotate(${s.angle + 90}deg)`,
                      scale: s.scale,
                    }}
                    animate={seedsScattered ? {
                      x: [ox, ox + s.vx * 70 + (Math.random() - 0.5) * 80],
                      y: [oy, oy + s.vy * 70 - 60],
                      rotate: [s.angle + 90, s.angle + 90 + 360],
                      opacity: [1, 0],
                      scale: [s.scale, 0.4],
                    } : {
                      rotate: [s.angle + 88, s.angle + 92, s.angle + 88],
                    }}
                    transition={seedsScattered ? { duration: 1.3, ease: 'easeOut' } : {
                      duration: 3 + (s.id % 5) * 0.4, repeat: Infinity, ease: 'easeInOut'
                    }}
                  >
                    {/* Seed Feather Parasol Stalk */}
                    <div className="w-0.5 h-6 bg-gradient-to-t from-amber-200/60 to-white/90" />
                    {/* Fluffy Radial Tufts */}
                    <div className="relative w-5 h-5 flex items-center justify-center -mt-1">
                      <div className="absolute w-4 h-4 rounded-full bg-white/30 blur-[1px]" />
                      <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Audio Wave Visualizer */}
            {phase === 'listening' && (
              <div className="w-full flex flex-col items-center gap-2">
                <div className="flex items-end gap-1.5 h-10 px-4 py-1.5 rounded-2xl bg-emerald-950/70 border border-emerald-400/20 backdrop-blur-md">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 rounded-full bg-gradient-to-t from-emerald-500 to-amber-300"
                      animate={{ height: `${Math.max(4, (volume / 100) * 36 * (0.4 + Math.sin(i * 0.7) * 0.6))}px` }}
                      transition={{ duration: 0.05 }}
                    />
                  ))}
                </div>

                <div className="w-56 h-2 rounded-full bg-white/10 overflow-hidden border border-emerald-400/20">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 shadow-[0_0_10px_rgba(253,224,71,0.6)]"
                    animate={{ width: `${(volume / MIC_SENSITIVITY) * 100}%` }}
                    transition={{ duration: 0.08 }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {phase === 'idle' && (
              <div className="flex flex-col items-center gap-2.5 w-full">
                {micError && (
                  <p className="text-amber-300 text-xs text-center">{micError}</p>
                )}
                <motion.button
                  onClick={startMic}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 text-white font-black text-sm tracking-wide shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:shadow-emerald-500/60 border border-amber-300/40"
                  whileTap={{ scale: 0.96 }}
                >
                  <Mic className="w-4 h-4" />
                  <span>Bật Micro & Thổi Gió Bay</span>
                </motion.button>
                <button
                  onClick={handleManualReveal}
                  className="text-xs text-emerald-300/70 hover:text-emerald-200 transition-colors underline-offset-4 hover:underline"
                >
                  Không tiện bật mic? Chạm vào đây để thổi
                </button>
              </div>
            )}

            {phase === 'requesting' && (
              <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold animate-pulse">
                <Wind className="w-4 h-4" /> Đang chuẩn bị cánh hoa...
              </div>
            )}

            {phase === 'listening' && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-amber-200 text-sm font-bold animate-pulse">
                  <Wind className="w-4 h-4 text-emerald-400" />
                  <span>Thổi một làn gió vào micro! 💨</span>
                </div>
                <button onClick={stopMic}
                  className="flex items-center gap-1.5 text-xs text-emerald-400/60 hover:text-emerald-300 transition-colors">
                  <MicOff className="w-3 h-3" /> Tắt micro
                </button>
              </div>
            )}

            {phase === 'blowing' && (
              <motion.div className="text-amber-300 font-extrabold text-sm tracking-wide"
                animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
                ✨ Điều ước đang bay vào trời đêm... ✨
              </motion.div>
            )}

            <p className="text-emerald-200/40 text-[11px] text-center">
              {mode === 'studio' ? '✦ Xem trước Studio: Nhấn "Bật Micro" hoặc chạm để test' : '✦ Thổi một hơi để điều ước bay đến bầu trời'}
            </p>
          </motion.div>
        ) : (
          /* ─── REVEALED BOTANICAL PARCHMENT ─── */
          <motion.div key="revealed"
            className="w-full max-w-md flex flex-col items-center justify-center p-3 my-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}>

            {/* Revealed Badge */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="mb-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 text-white font-black text-xs tracking-wider uppercase shadow-xl border border-amber-300/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>ĐIỀU ƯỚC ĐÃ THÀNH HIỆN THỰC</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            </motion.div>

            {/* Victorian Botanical Gold Framed Letter */}
            <div className="relative w-full rounded-3xl p-4 sm:p-5 bg-gradient-to-b from-[#064e3b] via-[#042f24] to-[#021c15] border-2 border-emerald-400/40 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(16,185,129,0.2)]">
              
              {/* Corner botanical accents */}
              <div className="absolute top-2.5 left-2.5 text-emerald-300/60 text-sm select-none">🌿</div>
              <div className="absolute top-2.5 right-2.5 text-emerald-300/60 text-sm select-none">🌿</div>
              <div className="absolute bottom-2.5 left-2.5 text-emerald-300/60 text-sm select-none">🌿</div>
              <div className="absolute bottom-2.5 right-2.5 text-emerald-300/60 text-sm select-none">🌿</div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-amber-400/30 backdrop-blur-md">
                {/* Header */}
                <div className="text-center mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-amber-300">
                    Bức Thư Gửi {recipientName}
                  </span>
                  <div className="h-px w-24 mx-auto my-2 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
                </div>

                {/* Photo Gallery */}
                {photosToDisplay.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {photosToDisplay.slice(0, 4).map((img, i) => (
                      <div key={i} className={`rounded-xl overflow-hidden border border-emerald-400/40 shadow-md ${i === 0 ? 'col-span-2 h-36' : 'h-24'}`}>
                        <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Main letter text */}
                <p className="text-emerald-50 text-sm leading-relaxed whitespace-pre-line text-center italic"
                  style={{ fontFamily: config.fontFamily || 'Playfair Display, serif' }}>
                  "{mainText}"
                </p>

                {/* Signature */}
                <div className="flex items-center gap-1.5 mt-5 pt-3 border-t border-emerald-400/20 justify-center">
                  <Heart className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-amber-200 font-bold text-sm tracking-wide">— {senderName} —</span>
                </div>
              </div>
            </div>

            {/* Replay Button */}
            <button
              onClick={() => {
                setPhase('idle');
                setSeedsScattered(false);
                blowStreakRef.current = 0;
              }}
              className="mt-4 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold transition-all shadow-md active:scale-95"
            >
              ↺ Thử lại từ đầu
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
