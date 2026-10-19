import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Smile, Heart, Sparkles, CheckCircle2, Scan, Activity, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

type Phase = 'idle' | 'requesting' | 'scanning' | 'smile_detected' | 'revealed';

export default function AIGestureUnlockFX({ config, mode }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [camError, setCamError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0); // 0-100
  const [faceDetected, setFaceDetected] = useState(false);
  const [smileScore, setSmileScore] = useState(0);
  const [radianceScore, setRadianceScore] = useState(88);
  const [scanMessage, setScanMessage] = useState('Đang quét nụ cười...');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const phaseRef = useRef<Phase>('idle');

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const userImages = config.images || [];
  const recipientName = config.recipientName || 'Công Chúa Của Anh';
  const senderName = config.senderName || 'Người Yêu Em';
  const mainText =
    config.mainText ||
    'AI đã nhận ra nụ cười đẹp nhất thế giới rồi đó! 🤖💗\nNgày 20/10, chúc em luôn tỏa sáng, hạnh phúc ngập tràn và mãi giữ nụ cười rạng rỡ tựa ngàn ánh sao nhé!';

  const fallbackPhotos = [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80', // Hoa hồng pha lê phát sáng
    'https://images.unsplash.com/photo-1513297887119-d46091b24bfa?w=800&auto=format&fit=crop&q=80', // Hộp quà ánh nến lung linh
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80', // Trái tim tinh thể ngàn sao
  ];

  const photosToDisplay = userImages.length > 0 ? userImages : fallbackPhotos;

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const triggerReveal = useCallback(() => {
    stopCamera();
    phaseRef.current = 'smile_detected';
    setPhase('smile_detected');
    soundFx.playSuccessChime();

    confetti({
      particleCount: 120,
      spread: 95,
      origin: { y: 0.5 },
      colors: ['#E879F9', '#C026D3', '#F43F5E', '#FBBF24', '#FFFFFF'],
    });

    setTimeout(() => {
      phaseRef.current = 'revealed';
      setPhase('revealed');
    }, 1300);
  }, [stopCamera]);

  // Vòng lặp phân tích khuôn mặt & nụ cười AI thời gian thực
  const analyzeFrame = useCallback(() => {
    if (phaseRef.current !== 'scanning') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(analyzeFrame);
      return;
    }

    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Kiểm tra camera có hình ảnh thật
    try {
      const frameData = ctx.getImageData(canvas.width * 0.25, canvas.height * 0.25, canvas.width * 0.5, canvas.height * 0.5).data;
      let totalLum = 0;
      let skinPixels = 0;
      const totalSamples = frameData.length / 4;

      for (let i = 0; i < frameData.length; i += 8) {
        const r = frameData[i];
        const g = frameData[i + 1];
        const b = frameData[i + 2];
        totalLum += (r + g + b) / 3;

        // Phân tích vùng sắc tố da mặt (Skin-tone chromaticity heuristic)
        if (r > 45 && g > 30 && b > 20 && r > g && g > b) {
          skinPixels++;
        }
      }

      const avgLum = totalLum / (totalSamples / 2);
      const skinRatio = skinPixels / (totalSamples / 2);
      // Chỉ nhận diện là có mặt khi khuôn mặt đủ sáng và chiếm ít nhất 8% diện tích vùng trung tâm
      const isFacePresent = avgLum > 35 && skinRatio > 0.08;
      setFaceDetected(isFacePresent);

      if (isFacePresent) {
        // Tốc độ quét chậm rãi, chuyên nghiệp: tăng 0.22 - 0.35% mỗi frame (khoảng 4 - 5s để quét trọn vẹn)
        progressRef.current = Math.min(100, progressRef.current + 0.22 + Math.random() * 0.12);
        const currentProg = Math.round(progressRef.current);
        setScanProgress(currentProg);
        setSmileScore(Math.min(99, Math.round(65 + (currentProg / 100) * 34 + Math.sin(Date.now() / 250) * 2)));
        setRadianceScore(Math.min(99, Math.round(80 + (currentProg / 100) * 19)));

        if (currentProg < 25) {
          setScanMessage('AI đang định vị tọa độ khuôn mặt...');
        } else if (currentProg < 55) {
          setScanMessage('Phát hiện nụ cười • Đang phân tích góc môi...');
        } else if (currentProg < 85) {
          setScanMessage('Đo chỉ số hạnh phúc & độ rạng rỡ 20/10...');
        } else if (currentProg < 99) {
          setScanMessage('Nụ cười tuyệt mỹ đạt 99.9% ✨ Chuẩn bị mở thư!');
        } else {
          setScanMessage('Xác thực nụ cười thành công! 🎉');
        }

        if (progressRef.current >= 100) {
          triggerReveal();
          return;
        }
      } else {
        // Chưa có mặt hoặc quay đi: giảm dần tiến trình về 0%
        progressRef.current = Math.max(0, progressRef.current - 0.4);
        setScanProgress(Math.round(progressRef.current));
        setSmileScore(0);
        setRadianceScore(0);
        setScanMessage('Vui lòng hướng khuôn mặt vào giữa khung quét...');
      }
    } catch (_e) {
      // Fallback an toàn nếu trình duyệt chặn getImageData (bảo mật canvas)
      progressRef.current = Math.min(100, progressRef.current + 0.25);
      setScanProgress(Math.round(progressRef.current));
      if (progressRef.current >= 100) {
        triggerReveal();
        return;
      }
    }

    rafRef.current = requestAnimationFrame(analyzeFrame);
  }, [triggerReveal]);

  const startCamera = useCallback(async () => {
    phaseRef.current = 'requesting';
    setPhase('requesting');
    setCamError(null);
    progressRef.current = 0;
    setScanProgress(0);
    setFaceDetected(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      phaseRef.current = 'scanning';
      setPhase('scanning');
      rafRef.current = requestAnimationFrame(analyzeFrame);
    } catch {
      setCamError('Không thể mở camera. Bạn có thể bấm nút "Mở ngay" bên dưới để xem thiệp.');
      phaseRef.current = 'idle';
      setPhase('idle');
    }
  }, [analyzeFrame]);

  const handleManualReveal = () => {
    stopCamera();
    triggerReveal();
  };

  return (
    <div
      className="relative w-full h-full min-h-[100%] flex flex-col items-center justify-center overflow-y-auto sm:overflow-hidden select-none p-3 sm:p-5 text-white"
      style={{
        background: 'radial-gradient(ellipse at 50% 25%, #2e003e 0%, #1a0527 45%, #06000d 100%)',
      }}
    >
      {/* Background Cyberpunk Neon Grid */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(232,121,249,1) 1px, transparent 1px), linear-gradient(90deg, rgba(232,121,249,1) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* Radial soft atmospheric purple glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-purple-600/15 blur-[90px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {phase !== 'revealed' ? (
          <motion.div
            key="ai-stage"
            className="relative flex flex-col items-center gap-3.5 z-10 w-full max-w-sm px-4 my-auto"
            exit={{ opacity: 0, scale: 0.94 }}
          >
            {/* Header Badge */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-fuchsia-950/80 border border-fuchsia-500/40 text-[11px] font-extrabold uppercase tracking-widest text-fuchsia-300 shadow-[0_0_15px_rgba(232,121,249,0.3)]">
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                MẬT MÃ NỤ CƯỜI AI
              </span>
              <h2
                className="text-white text-2xl font-black mt-1.5 tracking-tight"
                style={{ fontFamily: config.fontFamily || 'Cinzel, Playfair Display, serif' }}
              >
                Gửi <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-pink-400 to-rose-400">{recipientName}</span> ✨
              </h2>
            </div>

            {/* ─── CYBERPUNK HIGH-TECH VIEWFINDER (CHUẨN FORM MẪU) ─── */}
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden p-2 bg-gradient-to-br from-fuchsia-600/40 via-purple-900/60 to-slate-950 border border-fuchsia-500/50 shadow-[0_0_35px_rgba(192,38,211,0.35),0_15px_35px_rgba(0,0,0,0.8)]">
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/95 border border-fuchsia-900/60 flex items-center justify-center">
                {/* Real Camera Video Feed (Khóa chặt trong khung, chống tràn hoặc fullscreen trên mobile) */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  disablePictureInPicture
                  className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 pointer-events-none ${
                    phase === 'scanning' ? 'opacity-90' : 'opacity-0'
                  }`}
                  style={{ pointerEvents: 'none' }}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* 4 Neon Magenta/Fuchsia Corner Brackets */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,0.8)]" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,0.8)]" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,0.8)]" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,0.8)]" />

                {/* Laser Scanning Beam Line */}
                {phase === 'scanning' && (
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent shadow-[0_0_12px_rgba(232,121,249,0.95)]"
                    animate={{ top: ['12%', '88%', '12%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                  />
                )}

                {/* Central AI Targeting Reticle & Smile Avatar */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                  {/* Outer Pulsing Reticle Ring */}
                  <div
                    className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full border-1.5 flex items-center justify-center transition-all duration-300 ${
                      faceDetected
                        ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_18px_rgba(52,211,153,0.5)]'
                        : 'border-fuchsia-400/50 bg-fuchsia-500/10 shadow-[0_0_15px_rgba(232,121,249,0.3)] animate-pulse'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl drop-shadow-md">
                      {phase === 'scanning' ? (faceDetected ? '🥰' : '😊') : '🤖'}
                    </span>
                  </div>
                </div>

                {/* Live Camera Active Banner */}
                {phase === 'scanning' && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-fuchsia-500/40 text-[9.5px] font-mono font-bold text-fuchsia-300 flex items-center gap-1.5 shadow-sm">
                    <span className={`w-1.5 h-1.5 rounded-full ${faceDetected ? 'bg-emerald-400 animate-ping' : 'bg-fuchsia-400 animate-pulse'}`} />
                    <span>{faceDetected ? 'AI: ĐÃ KHÓA NỤ CƯỜI' : 'AI: ĐANG TÌM KHUÔN MẶT'}</span>
                  </div>
                )}

                {/* Idle / Requesting Overlay */}
                {(phase === 'idle' || phase === 'requesting') && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/80">
                    <div className="p-3.5 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-300 mb-2 shadow-[0_0_15px_rgba(232,121,249,0.2)]">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="text-fuchsia-200 text-xs font-semibold">
                      {phase === 'requesting' ? 'Đang kết nối camera AI...' : 'Bật camera để nhận diện nụ cười'}
                    </p>
                  </div>
                )}

                {/* Success Flash */}
                {phase === 'smile_detected' && (
                  <motion.div
                    className="absolute inset-0 bg-fuchsia-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-amber-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-2 animate-bounce drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
                    <span className="font-black text-sm tracking-widest uppercase text-white drop-shadow">
                      NỤ CƯỜI ĐÃ ĐƯỢC XÁC THỰC! ✨
                    </span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ─── REAL-TIME FACE TELEMETRY HUD (BẢNG DỮ LIỆU TRẠNG THÁI KHUÔN MẶT) ─── */}
            <div className="w-full rounded-2xl p-2.5 bg-black/60 backdrop-blur-md border border-fuchsia-500/30 shadow-lg space-y-2">
              {/* Telemetry Stat Pills */}
              <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[9.5px]">
                <div className="p-1 rounded-xl bg-fuchsia-950/60 border border-fuchsia-500/20">
                  <div className="text-fuchsia-400 text-[8px] flex items-center justify-center gap-1">
                    <Scan className="w-2.5 h-2.5" />
                    <span>THEO DÕI</span>
                  </div>
                  <span className="font-bold text-white">{faceDetected ? '98.6%' : 'Tìm kiếm'}</span>
                </div>
                <div className="p-1 rounded-xl bg-purple-950/60 border border-purple-500/20">
                  <div className="text-purple-400 text-[8px] flex items-center justify-center gap-1">
                    <Smile className="w-2.5 h-2.5" />
                    <span>NỤ CƯỜI</span>
                  </div>
                  <span className="font-bold text-amber-300">{phase === 'scanning' ? `${smileScore}%` : '---'}</span>
                </div>
                <div className="p-1 rounded-xl bg-pink-950/60 border border-pink-500/20">
                  <div className="text-pink-400 text-[8px] flex items-center justify-center gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    <span>RẠNG RỠ</span>
                  </div>
                  <span className="font-bold text-emerald-300">{phase === 'scanning' ? `${radianceScore}%` : '---'}</span>
                </div>
              </div>

              {/* Scan Progress Bar (Chuẩn 100% như ảnh thumbnail) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-fuchsia-300 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-pink-400 animate-spin" />
                    <span>{scanMessage}</span>
                  </span>
                  <span className="text-amber-300 font-mono font-black">{Math.round(scanProgress)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden border border-fuchsia-500/30">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-400 shadow-[0_0_12px_rgba(232,121,249,0.8)]"
                    animate={{ width: `${scanProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>

              {/* Status footer prompt */}
              <p className="text-[10px] text-center font-bold text-fuchsia-200/80 flex items-center justify-center gap-1.5 pt-0.5">
                <span>🤖</span>
                <span>Mỉm cười thật rạng rỡ để AI giải mã bức thư</span>
              </p>
            </div>

            {camError && (
              <p className="text-amber-300 text-xs text-center font-semibold bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-500/30">
                {camError}
              </p>
            )}

            {/* Action Buttons */}
            {phase === 'idle' && (
              <div className="flex flex-col items-center gap-2 w-full pt-1">
                <motion.button
                  onClick={startCamera}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-full bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-500 text-white font-black text-sm tracking-wide shadow-[0_10px_30px_rgba(192,38,211,0.5)] border border-fuchsia-300/40 active:scale-95 transition-all"
                  whileTap={{ scale: 0.96 }}
                >
                  <Camera className="w-4 h-4 text-fuchsia-200" />
                  <span>Bật Camera & Quét Nụ Cười</span>
                </motion.button>
                <button
                  onClick={handleManualReveal}
                  className="text-xs text-fuchsia-300/70 hover:text-fuchsia-200 transition-colors underline-offset-4 hover:underline"
                >
                  Không tiện mở camera? Nhấn đây để mở thư ngay
                </button>
              </div>
            )}

            {phase === 'scanning' && (
              <div className="flex items-center justify-between w-full px-2 pt-0.5">
                <button
                  onClick={() => {
                    stopCamera();
                    setPhase('idle');
                  }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-300 transition-colors"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Tắt camera</span>
                </button>
                <button
                  onClick={handleManualReveal}
                  className="text-xs text-amber-300 hover:text-amber-200 font-bold underline"
                >
                  Mở thư ngay ✨
                </button>
              </div>
            )}

            <p className="text-fuchsia-200/40 text-[10.5px] text-center">
              {mode === 'studio'
                ? '✦ Chế độ Studio: Nhấn "Bật Camera" hoặc "Mở thư ngay" để thử nghiệm'
                : '✦ AI quét cục bộ trên thiết bị, bảo mật an toàn 100%'}
            </p>
          </motion.div>
        ) : (
          /* ─── REVEALED CYBERPUNK HIGH-TECH LOVE LETTER ─── */
          <motion.div
            key="revealed"
            className="w-full max-w-md flex flex-col items-center justify-center p-2 my-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          >
            {/* Top Verified Badge */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500 text-white font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(232,121,249,0.5)] border border-fuchsia-300/50"
            >
              <Smile className="w-4 h-4 text-amber-200" />
              <span>NỤ CƯỜI ĐÃ MỞ KHÓA BÍ MẬT</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            </motion.div>

            {/* Futuristic Gilded Cyber Love Box */}
            <div className="relative w-full rounded-[2.5rem] p-3.5 sm:p-4 bg-gradient-to-b from-fuchsia-500 via-purple-700 to-slate-950 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(192,38,211,0.35)] border-2 border-fuchsia-400/60">
              {/* Corner AI Glyphs */}
              <div className="absolute top-3 left-3 text-fuchsia-300 font-mono text-xs select-none">❖</div>
              <div className="absolute top-3 right-3 text-fuchsia-300 font-mono text-xs select-none">❖</div>
              <div className="absolute bottom-3 left-3 text-fuchsia-300 font-mono text-xs select-none">❖</div>
              <div className="absolute bottom-3 right-3 text-fuchsia-300 font-mono text-xs select-none">❖</div>

              <div className="relative w-full rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#1b021c] via-[#0d0112] to-[#050008] p-5 sm:p-6 border border-fuchsia-500/30 shadow-inner">
                {/* Header */}
                <div className="text-center mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-fuchsia-950/80 border border-fuchsia-500/40 text-[10px] font-mono font-bold text-fuchsia-300 uppercase tracking-widest">
                    <span>✦ TÂM THƯ GỬI {recipientName} ✦</span>
                  </div>
                  <div className="h-px w-24 mx-auto my-2 bg-gradient-to-r from-transparent via-fuchsia-400/60 to-transparent" />
                </div>

                {/* Photo Gallery */}
                {photosToDisplay.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {photosToDisplay.slice(0, 4).map((img, i) => (
                      <div
                        key={i}
                        className={`rounded-2xl overflow-hidden border border-fuchsia-500/40 shadow-md ${
                          i === 0 ? 'col-span-2 h-36' : 'h-24'
                        }`}
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Main Letter Body */}
                <p
                  className="text-fuchsia-50 text-sm leading-relaxed whitespace-pre-line text-center italic my-3"
                  style={{ fontFamily: config.fontFamily || 'Playfair Display, serif' }}
                >
                  "{mainText}"
                </p>

                {/* Signature */}
                <div className="flex items-center gap-1.5 mt-5 pt-3 border-t border-fuchsia-500/20 justify-center">
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" />
                  <span className="text-fuchsia-200 font-bold text-sm tracking-wide">— {senderName} —</span>
                </div>
              </div>
            </div>

            {/* Replay Button */}
            <button
              onClick={() => {
                setPhase('idle');
                progressRef.current = 0;
                setScanProgress(0);
                setFaceDetected(false);
              }}
              className="mt-4 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-fuchsia-400/30 text-fuchsia-200 text-xs font-semibold transition-all shadow-md active:scale-95"
            >
              ↺ Quét lại nụ cười
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
