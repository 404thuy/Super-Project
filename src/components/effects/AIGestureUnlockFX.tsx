import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Smile, Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

type Phase = 'idle' | 'requesting' | 'scanning' | 'smile_detected' | 'revealed';

function computeFrameBrightness(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const data = ctx.getImageData(w * 0.25, h * 0.45, w * 0.5, h * 0.25).data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  return sum / (data.length / 4);
}

export default function AIGestureUnlockFX({ config, mode }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [camError, setCamError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0); // 0-100
  const [scanMessage, setScanMessage] = useState('Đang quét khuôn mặt thiên thần...');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const smileFramesRef = useRef(0);
  const prevBrightnessRef = useRef(0);
  const userImages = config.images || [];

  const SMILE_MESSAGES = [
    'Đang căn chỉnh tỷ lệ vàng khuôn mặt...',
    'Phát hiện ánh mắt dịu dàng tỏa sáng...',
    'Đang quét nụ cười rạng rỡ 20/10...',
    'Nụ cười hoàn hảo! Đang giải mã bí mật... ✨',
  ];

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const triggerReveal = useCallback(() => {
    stopCamera();
    setPhase('smile_detected');
    soundFx.playSuccessChime();

    confetti({
      particleCount: 120, spread: 90, origin: { y: 0.5 },
      colors: ['#F43F5E', '#FB7185', '#FBBF24', '#F472B6', '#FFFFFF'],
    });

    setTimeout(() => setPhase('revealed'), 1400);
  }, [stopCamera]);

  const analyzeFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(analyzeFrame);
      return;
    }

    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const brightness = computeFrameBrightness(ctx, canvas.width, canvas.height);
    const delta = Math.abs(brightness - prevBrightnessRef.current);
    prevBrightnessRef.current = brightness;

    if (brightness > 105 && delta > 1.2) {
      smileFramesRef.current++;
    } else if (delta < 0.4) {
      smileFramesRef.current = Math.max(0, smileFramesRef.current - 1);
    }

    const progress = Math.min((smileFramesRef.current / 50) * 100, 100);
    setScanProgress(progress);

    const msgIdx = Math.floor((progress / 100) * (SMILE_MESSAGES.length - 1));
    setScanMessage(SMILE_MESSAGES[Math.min(msgIdx, SMILE_MESSAGES.length - 1)]);

    if (smileFramesRef.current >= 50) {
      triggerReveal();
      return;
    }

    rafRef.current = requestAnimationFrame(analyzeFrame);
  }, [triggerReveal, SMILE_MESSAGES]);

  const startCamera = useCallback(async () => {
    setPhase('requesting');
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setPhase('scanning');
      smileFramesRef.current = 0;
      rafRef.current = requestAnimationFrame(analyzeFrame);
    } catch {
      setCamError('Không thể mở camera. Bạn có thể nhấn nút mở nhanh bên dưới.');
      setPhase('idle');
    }
  }, [analyzeFrame]);

  const handleManualReveal = () => {
    stopCamera();
    triggerReveal();
  };

  return (
    <div className="relative w-full h-full min-h-[100%] flex flex-col items-center justify-center overflow-y-auto sm:overflow-hidden select-none p-3 sm:p-5"
      style={{ background: 'radial-gradient(ellipse at 50% 25%, #4c0519 0%, #20040c 55%, #0a0104 100%)' }}>

      {/* Ambient rose-gold holographic rays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-rose-500/10 blur-[100px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {phase !== 'revealed' ? (
          <motion.div key="ai-stage" className="relative flex flex-col items-center gap-4 z-10 w-full max-w-sm px-4 my-auto"
            exit={{ opacity: 0, scale: 0.94 }}>

            {/* Header Badge */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-amber-400/30 text-[11px] font-extrabold uppercase tracking-widest text-amber-300 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                AI NHẬN DIỆN NỤ CƯỜI
              </span>
              <h2 className="text-white text-2xl font-bold mt-2"
                style={{ fontFamily: config.fontFamily || 'Cinzel, Playfair Display, serif' }}>
                Gửi <span className="text-rose-300 drop-shadow">{config.recipientName}</span> 💖
              </h2>
            </div>

            {/* Holographic Rose Gold Viewfinder */}
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden p-2.5 bg-gradient-to-b from-amber-200 via-rose-400 to-amber-600 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(244,63,94,0.3)]">
              
              {/* Inner video frame */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/90 border border-amber-900/50">
                <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
                <canvas ref={canvasRef} className="hidden" />

                {/* Ornate Gold Corner Scan Brackets */}
                <div className="absolute top-2 left-2 text-amber-300 text-sm font-bold select-none">❖</div>
                <div className="absolute top-2 right-2 text-amber-300 text-sm font-bold select-none">❖</div>
                <div className="absolute bottom-2 left-2 text-amber-300 text-sm font-bold select-none">❖</div>
                <div className="absolute bottom-2 right-2 text-amber-300 text-sm font-bold select-none">❖</div>

                {/* Laser Scanning Line */}
                {phase === 'scanning' && (
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_12px_rgba(251,191,36,0.9)]"
                    animate={{ top: ['15%', '85%', '15%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                  />
                )}

                {/* Idle Placeholder */}
                {(phase === 'idle' || phase === 'requesting') && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <div className="p-4 rounded-full bg-rose-500/10 border border-rose-400/30 text-rose-300 mb-2">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="text-rose-200/60 text-xs">Mở camera để nhận diện nụ cười</p>
                  </div>
                )}

                {/* Success Flash */}
                {phase === 'smile_detected' && (
                  <motion.div
                    className="absolute inset-0 bg-rose-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-amber-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <CheckCircle2 className="w-14 h-14 text-amber-300 mb-2 animate-bounce" />
                    <span className="font-extrabold text-sm tracking-wider uppercase">Nụ cười đã được xác nhận!</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Scan Progress */}
            {phase === 'scanning' && (
              <div className="w-full space-y-1.5 px-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-rose-200 font-medium">{scanMessage}</span>
                  <span className="text-amber-300 font-bold">{Math.round(scanProgress)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden border border-amber-400/20">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                    animate={{ width: `${scanProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
            )}

            {camError && (
              <p className="text-amber-300 text-xs text-center">{camError}</p>
            )}

            {/* Controls */}
            {phase === 'idle' && (
              <div className="flex flex-col items-center gap-2.5 w-full">
                <motion.button
                  onClick={startCamera}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-full bg-gradient-to-r from-rose-600 via-pink-500 to-amber-500 text-white font-black text-sm tracking-wide shadow-[0_10px_30px_rgba(244,63,94,0.4)] border border-amber-300/40"
                  whileTap={{ scale: 0.96 }}
                >
                  <Camera className="w-4 h-4" />
                  <span>Bật Camera & Mỉm Cười</span>
                </motion.button>
                <button
                  onClick={handleManualReveal}
                  className="text-xs text-rose-300/70 hover:text-rose-200 transition-colors underline-offset-4 hover:underline"
                >
                  Không tiện mở camera? Nhấn đây để mở thư
                </button>
              </div>
            )}

            {phase === 'scanning' && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-amber-200/80 text-xs font-semibold animate-pulse">
                  ✨ Hãy mỉm cười thật rạng rỡ trước camera nhé!
                </p>
                <div className="flex items-center gap-3">
                  <button onClick={() => { stopCamera(); setPhase('idle'); }}
                    className="flex items-center gap-1 text-xs text-rose-300/60 hover:text-rose-200">
                    <CameraOff className="w-3 h-3" /> Tắt camera
                  </button>
                  <button onClick={handleManualReveal}
                    className="text-xs text-amber-300 hover:text-amber-200 font-bold">
                    Mở nhanh thư
                  </button>
                </div>
              </div>
            )}

            <p className="text-rose-200/40 text-[11px] text-center">
              {mode === 'studio' ? '✦ Xem trước Studio: Nhấn "Bật Camera" hoặc mở thư' : '✦ AI xử lý trên thiết bị, bảo mật 100% hình ảnh'}
            </p>
          </motion.div>
        ) : (
          /* ─── REVEALED ROSE GOLD LETTER ─── */
          <motion.div key="revealed"
            className="w-full max-w-md flex flex-col items-center justify-center p-3 my-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}>

            {/* Revealed Badge */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="mb-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-600 via-rose-500 to-amber-600 text-white font-black text-xs tracking-wider uppercase shadow-xl border border-amber-300/40">
              <Smile className="w-4 h-4 text-amber-200" />
              <span>NỤ CƯỜI ĐẸP NHẤT THẾ GIAN</span>
            </motion.div>

            {/* Gilded Letter Box */}
            <div className="relative w-full rounded-[2.5rem] p-4 bg-gradient-to-b from-amber-200 via-rose-400 to-amber-700 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(244,63,94,0.3)] border border-amber-300">
              
              <div className="absolute top-2 left-2 text-amber-950 font-bold select-none">❖</div>
              <div className="absolute top-2 right-2 text-amber-950 font-bold select-none">❖</div>
              <div className="absolute bottom-2 left-2 text-amber-950 font-bold select-none">❖</div>
              <div className="absolute bottom-2 right-2 text-amber-950 font-bold select-none">❖</div>

              <div className="relative w-full rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#260510] via-[#160209] to-[#0a0104] p-5 sm:p-6 border-2 border-amber-900/60 shadow-inner">
                {/* Header */}
                <div className="text-center mb-3">
                  <span className="text-[10px] font-extrabold tracking-[0.25em] text-amber-400 uppercase">
                    Bức Thư Tình Ý • Gửi {config.recipientName}
                  </span>
                  <div className="h-px w-24 mx-auto my-2 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                </div>

                {/* Photos */}
                {userImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {userImages.slice(0, 4).map((img, i) => (
                      <div key={i} className={`rounded-xl overflow-hidden border border-rose-400/40 shadow-md ${i === 0 ? 'col-span-2 h-36' : 'h-24'}`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Letter Body */}
                <p className="text-rose-50 text-sm leading-relaxed whitespace-pre-line text-center italic my-3"
                  style={{ fontFamily: config.fontFamily || 'Playfair Display, serif' }}>
                  "{config.mainText}"
                </p>

                {/* Signature */}
                <div className="flex items-center gap-1.5 mt-5 pt-3 border-t border-rose-400/20 justify-center">
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                  <span className="text-amber-300 font-bold text-sm tracking-wide">— {config.senderName} —</span>
                </div>
              </div>
            </div>

            {mode === 'studio' && (
              <button
                onClick={() => setPhase('idle')}
                className="mt-4 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-amber-400/30 text-amber-200 text-xs font-semibold transition-all"
              >
                ↺ Xem lại từ đầu
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
