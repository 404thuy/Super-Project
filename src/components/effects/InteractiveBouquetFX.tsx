import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, RotateCcw, Volume2, Flower2, Maximize2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

interface FlowerItem {
  id: number;
  name: string;
  type: 'rose' | 'tulip' | 'peony' | 'carnation' | 'lily';
  color: string;
  glowColor: string;
  x: number; // percentage in bouquet
  y: number;
  rotation: number;
  scale: number;
  bloomed: boolean;
  meaning: string;
}

export default function InteractiveBouquetFX({ config, mode }: Props) {
  const gradientId = useId();
  const [isUntied, setIsUntied] = useState(mode === 'studio');
  const [selectedCharmIndex, setSelectedCharmIndex] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [bloomedFlowers, setBloomedFlowers] = useState<Record<number, boolean>>({
    0: true,
    2: true,
  });
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [butterflyPos, setButterflyPos] = useState({ x: 50, y: 35 });

  const photos: string[] = config.images && config.images.length > 0 ? config.images : [];
  const sender = config.senderName || 'Người yêu em';
  const recipient = config.recipientName || 'Cô Giáo Kính Yêu';
  const message = config.mainText || 'Chúc bạn luôn xinh đẹp, hạnh phúc và toả sáng rực rỡ như những đóa hoa ngát hương!';

  const defaultCharmQuotes = [
    'Nụ cười của bạn là ánh nắng rực rỡ nhất 🌸',
    'Mỗi khoảnh khắc có bạn đều ngát hương ngọt ngào 🌷',
    'Mong bạn luôn được nâng niu và yêu thương vô điều kiện 💖',
  ];

  const fallbackCharms = [
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
  ];

  const flowers: FlowerItem[] = [
    { id: 0, name: 'Hồng Juliet', type: 'rose', color: '#ff6584', glowColor: '#ff2e93', x: 50, y: 22, rotation: 0, scale: 1.15, bloomed: !!bloomedFlowers[0], meaning: 'Tình yêu nồng nàn & sự ngưỡng mộ chân thành' },
    { id: 1, name: 'Tulip Hà Lan', type: 'tulip', color: '#f43f5e', glowColor: '#e11d48', x: 32, y: 32, rotation: -18, scale: 0.95, bloomed: !!bloomedFlowers[1], meaning: 'Lời chúc rạng rỡ, hoàn hảo và kiêu hãnh' },
    { id: 2, name: 'Mẫu Đơn Quý Tộc', type: 'peony', color: '#ec4899', glowColor: '#db2777', x: 68, y: 30, rotation: 16, scale: 1.05, bloomed: !!bloomedFlowers[2], meaning: 'Thịnh vượng, sắc đẹp kiêu sa và may mắn' },
    { id: 3, name: 'Cẩm Chướng Hồng', type: 'carnation', color: '#fb7185', glowColor: '#f43f5e', x: 20, y: 45, rotation: -28, scale: 0.9, bloomed: !!bloomedFlowers[3], meaning: 'Lòng biết ơn sâu sắc và tình cảm bền chặt' },
    { id: 4, name: 'Ly Trắng Tinh Khôi', type: 'lily', color: '#fce7f3', glowColor: '#fda4af', x: 80, y: 44, rotation: 26, scale: 0.9, bloomed: !!bloomedFlowers[4], meaning: 'Sự thuần khiết, thanh cao và quý phái' },
    { id: 5, name: 'Hồng Kem Dâu', type: 'rose', color: '#fda4af', glowColor: '#f43f5e', x: 38, y: 52, rotation: -8, scale: 0.95, bloomed: !!bloomedFlowers[5], meaning: 'Sự dịu dàng, êm đềm và thấu hiểu' },
    { id: 6, name: 'Hồng Nhung Tinh Khiết', type: 'rose', color: '#e11d48', glowColor: '#be123c', x: 62, y: 50, rotation: 10, scale: 1.0, bloomed: !!bloomedFlowers[6], meaning: 'Nét đẹp bất diệt và niềm tự hào sâu sắc' },
  ];

  const handleFlowerClick = (flower: FlowerItem) => {
    soundFx.playHeartPop();
    setBloomedFlowers((prev) => ({
      ...prev,
      [flower.id]: !prev[flower.id],
    }));
    setActiveNote(`${flower.name}: ${flower.meaning}`);
    setTimeout(() => {
      setActiveNote(null);
    }, 4500);
  };

  const handleUntieRibbon = () => {
    soundFx.playPaperSwoosh();
    soundFx.playSuccessChime();
    setIsUntied(true);
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.65 },
      colors: ['#FB7185', '#F43F5E', '#FBBF24', '#FDA4AF', '#FFF'],
    });
  };

  const handleOpenCharm = (index: number) => {
    soundFx.playPinClick();
    setSelectedCharmIndex(index);
    setIsFlipped(false);
  };

  const totalBloomed = Object.values(bloomedFlowers).filter(Boolean).length;

  const charmsList: string[] =
    photos.length > 0 ? photos.slice(0, 3) : fallbackCharms;

  return (
    <div className="relative w-full h-full min-h-full overflow-y-auto sm:overflow-hidden bg-gradient-to-b from-[#1a0814] via-[#2d0f25] to-[#12050e] text-white flex flex-col items-center justify-start sm:justify-between select-none p-2.5 sm:p-4">
      {/* Dynamic Background Petals & Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-rose-500/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[360px] h-[360px] bg-amber-400/10 rounded-full blur-[110px]" />

        {/* Ambient floating petals */}
        {[...Array(14)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: `${10 + (i % 4) * 5}px`,
              height: `${14 + (i % 4) * 6}px`,
              background: i % 2 === 0 ? 'rgba(251, 113, 133, 0.45)' : 'rgba(244, 63, 94, 0.35)',
              filter: 'blur(0.5px)',
              top: `${(i * 7) % 100}%`,
              left: `${(i * 13) % 100}%`,
              borderRadius: '60% 40% 70% 30% / 40% 50% 60% 50%',
            }}
            animate={{
              y: [0, -140, 0],
              x: [0, (i % 2 === 0 ? 30 : -30), 0],
              rotate: [0, 180, 360],
              opacity: [0.2, 0.7, 0.2],
            }}
            transition={{
              duration: 9 + (i % 5) * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          />
        ))}

        {/* Interactive butterfly that moves near touches */}
        <motion.div
          className="absolute z-20 pointer-events-none text-2xl filter drop-shadow-[0_0_12px_rgba(253,164,175,0.8)]"
          animate={{
            left: `${butterflyPos.x}%`,
            top: `${butterflyPos.y}%`,
            rotate: [0, -12, 12, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          🦋
        </motion.div>
      </div>

      {/* Header Bar */}
      <header className="relative z-20 w-full max-w-4xl flex items-center justify-between pt-2 px-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300 backdrop-blur-md">
            <Flower2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-rose-200">Bó Hoa Nghệ Thuật 3D</h1>
            <p className="text-xs text-rose-300/70">
              Dành tặng <span className="text-rose-300 font-medium">{recipient}</span> • {totalBloomed}/{flowers.length} đóa đang nở
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isUntied && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUntieRibbon}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/40 flex items-center gap-1.5 border border-amber-300/40 animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Mở Dải Ruy Băng
            </motion.button>
          )}
          <button
            onClick={() => soundFx.playHeartPop()}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-rose-200 border border-white/15 backdrop-blur-md transition-colors"
            title="Âm thanh"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Interactive Bouquet Showcase Area */}
      <main
        className="relative z-10 w-full max-w-2xl flex-1 flex flex-col items-center justify-center my-2"
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * 100;
          const py = ((e.clientY - rect.top) / rect.height) * 100;
          setButterflyPos({ x: Math.max(15, Math.min(85, px)), y: Math.max(15, Math.min(75, py)) });
        }}
      >
        <div className="relative w-full max-w-[440px] aspect-[4/5] flex items-center justify-center">
          {/* Back Paper Wrapping (Cone Fan) */}
          <div
            className="absolute bottom-6 w-[340px] h-[400px] pointer-events-none transition-transform duration-700 ease-out"
            style={{
              background: 'linear-gradient(135deg, #3d1b28 0%, #200a16 100%)',
              clipPath: 'polygon(50% 100%, 0% 12%, 18% 0%, 50% 10%, 82% 0%, 100% 12%)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 40px rgba(244,63,94,0.15)',
              transform: isUntied ? 'scale(1.04) translateY(4px)' : 'scale(1)',
            }}
          >
            {/* Paper texture lines */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ff85a1_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>

          {/* Stems & Leaves Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 500">
            <defs>
              <linearGradient id={`${gradientId}-stem`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
            </defs>
            <path d="M 200 450 Q 180 320 130 180" stroke={`url(#${gradientId}-stem)`} strokeWidth="4.5" fill="none" opacity="0.8" />
            <path d="M 200 450 Q 200 300 200 130" stroke={`url(#${gradientId}-stem)`} strokeWidth="5" fill="none" opacity="0.9" />
            <path d="M 200 450 Q 220 320 270 180" stroke={`url(#${gradientId}-stem)`} strokeWidth="4.5" fill="none" opacity="0.8" />
            <path d="M 200 450 Q 160 350 90 240" stroke={`url(#${gradientId}-stem)`} strokeWidth="4" fill="none" opacity="0.75" />
            <path d="M 200 450 Q 240 350 310 240" stroke={`url(#${gradientId}-stem)`} strokeWidth="4" fill="none" opacity="0.75" />
          </svg>

          {/* Flowers Cluster (Interactive blooming on click) */}
          <div className="absolute inset-0 z-10">
            {flowers.map((fl) => {
              const isBloomed = !!bloomedFlowers[fl.id];
              return (
                <motion.div
                  key={fl.id}
                  onClick={() => handleFlowerClick(fl)}
                  whileHover={{ scale: fl.scale * (isBloomed ? 1.12 : 1.05) }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 group"
                  style={{
                    left: `${fl.x}%`,
                    top: `${fl.y}%`,
                  }}
                  animate={{
                    rotate: [fl.rotation - 2, fl.rotation + 2, fl.rotation - 2],
                    scale: isBloomed ? fl.scale : fl.scale * 0.82,
                  }}
                  transition={{
                    rotate: { duration: 4 + fl.id * 0.5, repeat: Infinity, ease: 'easeInOut' },
                    scale: { type: 'spring', damping: 12, stiffness: 200 },
                  }}
                >
                  {/* Flower Graphic */}
                  <div className="relative flex items-center justify-center">
                    {/* Glowing Backdrop */}
                    <div
                      className="absolute -inset-4 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity"
                      style={{ background: fl.glowColor }}
                    />

                    {/* Flower Petals Geometry (SVG) */}
                    <svg width="84" height="84" viewBox="0 0 100 100" className="relative z-10 drop-shadow-xl">
                      {/* Outer petals */}
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, pi) => (
                        <motion.ellipse
                          key={pi}
                          cx="50"
                          cy="30"
                          rx={isBloomed ? '18' : '10'}
                          ry={isBloomed ? '26' : '16'}
                          fill={fl.color}
                          transform={`rotate(${deg} 50 50)`}
                          opacity={isBloomed ? 0.92 : 0.75}
                          animate={{
                            rx: isBloomed ? 18 : 10,
                            ry: isBloomed ? 26 : 16,
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      ))}
                      {/* Inner layers */}
                      {[22, 67, 112, 157, 202, 247, 292, 337].map((deg, pi) => (
                        <circle
                          key={`in-${pi}`}
                          cx="50"
                          cy="38"
                          r={isBloomed ? '14' : '8'}
                          fill={fl.glowColor}
                          transform={`rotate(${deg} 50 50)`}
                          opacity={0.85}
                        />
                      ))}
                      {/* Pistil */}
                      <circle cx="50" cy="50" r={isBloomed ? '10' : '7'} fill="#fef08a" />
                      <circle cx="50" cy="50" r={isBloomed ? '6' : '4'} fill="#eab308" />
                    </svg>

                    {/* Tiny Click Me Indicator if not bloomed */}
                    {!isBloomed && (
                      <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] bg-amber-400 text-rose-950 font-bold shadow-md animate-bounce">
                        Chạm
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Hanging 2-Sided Floral Photo Charms (Tucked inside the bouquet) */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {charmsList.map((photoUrl: string, cIdx: number) => {
              const charmPositions = [
                { left: '26%', top: '64%', rotation: -12 },
                { left: '72%', top: '62%', rotation: 14 },
                { left: '50%', top: '70%', rotation: 0 },
              ];
              const pos = charmPositions[cIdx] || charmPositions[0];

              return (
                <div
                  key={cIdx}
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{
                    left: pos.left,
                    top: pos.top,
                    transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
                  }}
                  onClick={() => handleOpenCharm(cIdx)}
                >
                  {/* String hanging charm */}
                  <div className="w-[1.5px] h-8 bg-amber-300/70 mx-auto -mb-1 shadow-[0_0_4px_rgba(252,211,77,0.8)]" />

                  {/* 2-Sided Charm Frame */}
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: pos.rotation + 4 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-18 h-22 sm:w-20 sm:h-24 rounded-2xl p-1 bg-gradient-to-br from-amber-300 via-rose-300 to-amber-500 shadow-2xl border-2 border-white/70 flex flex-col items-center justify-center overflow-hidden"
                  >
                    <img
                      src={photoUrl}
                      alt={`Charm ${cIdx + 1}`}
                      className="w-full h-full object-cover rounded-xl"
                    />

                    {/* Badge tag */}
                    <div className="absolute bottom-1 bg-black/65 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] text-amber-300 font-mono font-bold">
                      #{cIdx + 1} Lật mở
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Front Silk Wrapping Paper & Ribbon */}
          <div
            className="absolute bottom-2 w-[280px] h-[190px] pointer-events-none z-20 flex flex-col items-center justify-end"
            style={{
              background: 'linear-gradient(180deg, rgba(61,27,40,0.85) 0%, rgba(30,10,20,0.98) 100%)',
              clipPath: 'polygon(15% 0%, 85% 0%, 65% 100%, 35% 100%)',
              boxShadow: '0 -10px 30px rgba(0,0,0,0.6)',
            }}
          >
            {/* Elegant Golden Stamp on wrapping */}
            <div className="mb-8 flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-400/40 bg-amber-950/40 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span className="text-[10px] font-medium tracking-widest text-amber-200 uppercase">
                Bó Hoa Yêu Thương
              </span>
            </div>
          </div>

          {/* Physical Ribbon Bow (Interactive untie) */}
          <div className="absolute bottom-10 z-30 flex flex-col items-center">
            <motion.div
              onClick={() => {
                if (!isUntied) handleUntieRibbon();
              }}
              whileHover={{ scale: isUntied ? 1 : 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`relative cursor-pointer flex items-center justify-center ${
                isUntied ? 'opacity-80' : 'animate-pulse'
              }`}
            >
              <div className="w-14 h-6 rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-amber-500 shadow-lg shadow-amber-900/60 flex items-center justify-center border border-white/50">
                <span className="text-[10px] font-bold text-rose-950">
                  {isUntied ? 'Đã Mở' : 'Rút Nơ'}
                </span>
              </div>
              {/* Ribbon Ends */}
              <div
                className={`absolute top-5 flex justify-between w-10 transition-all duration-700 ${
                  isUntied ? 'scale-y-50 opacity-40' : 'scale-y-100'
                }`}
              >
                <div className="w-3.5 h-10 bg-amber-400/90 rounded-b-md -rotate-12 origin-top" />
                <div className="w-3.5 h-10 bg-amber-400/90 rounded-b-md rotate-12 origin-top" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Flower Meaning Toast / Subtitle */}
        <AnimatePresence>
          {activeNote && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 px-4 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-rose-400/30 text-xs text-rose-200 text-center max-w-sm shadow-xl flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{activeNote}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Envelope Letter & Recipient Greeting Card */}
      <footer className="relative z-20 w-full max-w-xl pb-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-3xl bg-[#FFFDF8]/95 text-slate-800 border-2 border-amber-300/90 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col gap-3 relative overflow-hidden"
        >
          {/* Filigree Corner Accents */}
          <span className="absolute top-2 left-2.5 text-amber-500 text-xs select-none">❖</span>
          <span className="absolute top-2 right-2.5 text-amber-500 text-xs select-none">❖</span>
          <span className="absolute bottom-2 left-2.5 text-amber-500 text-xs select-none">❖</span>
          <span className="absolute bottom-2 right-2.5 text-amber-500 text-xs select-none">❖</span>

          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-rose-700 text-xs sm:text-sm">
              <Flower2 className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Thư Bó Hoa 20/10 Gửi {recipient}</span>
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300">
              Từ: {sender}
            </span>
          </div>

          <p
            className="text-sm sm:text-base text-slate-800 italic leading-relaxed font-serif whitespace-pre-line bg-amber-50/50 p-3 rounded-2xl border border-amber-200/70"
            style={{ fontFamily: config.fontFamily ? `${config.fontFamily}, 'Playfair Display', serif` : "'Playfair Display', serif" }}
          >
            "{message}"
          </p>

          {/* Charms quick thumbnail bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-rose-800">3 Thẻ Charm:</span>
              <div className="flex items-center gap-1.5">
                {charmsList.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOpenCharm(idx)}
                    className="w-8 h-8 rounded-lg overflow-hidden border border-amber-400 shadow-xs hover:scale-110 transition-transform cursor-pointer"
                    title={`Mở thẻ charm #${idx + 1}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {mode === 'studio' && (
                <button
                  type="button"
                  onClick={() => setIsUntied(!isUntied)}
                  className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline"
                >
                  {isUntied ? 'Buộc lại nơ' : 'Mở nơ hoa'}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleOpenCharm(0)}
                className="text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 transition-all active:scale-95"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Xem charm 2 mặt</span>
              </button>
            </div>
          </div>
        </motion.div>
      </footer>

      {/* 3D Charm Modal / Double-Sided Inspection View */}
      <AnimatePresence>
        {selectedCharmIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-rose-950/90 via-[#220718] to-black border border-rose-500/40 p-6 flex flex-col items-center shadow-[0_0_60px_rgba(244,63,94,0.3)]"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedCharmIndex(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-rose-200 border border-white/15"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold mb-4 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Thẻ Charm Kỷ Niệm #{selectedCharmIndex + 1}
              </div>

              {/* 3D Flippable Card Container */}
              <div
                className="w-64 h-80 cursor-pointer perspective-[1000px] my-2"
                onClick={() => {
                  soundFx.playPinClick();
                  setIsFlipped(!isFlipped);
                }}
              >
                <motion.div
                  className="w-full h-full relative [transform-style:preserve-3d] transition-transform duration-700 rounded-2xl shadow-2xl"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                >
                  {/* FRONT FACE (Photo or Golden Emblem) */}
                  <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl p-3 bg-gradient-to-br from-amber-100 via-rose-50 to-amber-200 text-rose-950 flex flex-col items-center justify-between border-2 border-amber-300/80 shadow-inner">
                    {photos[selectedCharmIndex] ? (
                      <div className="w-full h-[82%] rounded-xl overflow-hidden bg-black/10 relative">
                        <img
                          src={photos[selectedCharmIndex]}
                          alt="Charm Memory"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                      </div>
                    ) : (
                      <div className="w-full h-[82%] rounded-xl bg-gradient-to-br from-rose-500/10 to-amber-500/20 flex flex-col items-center justify-center p-4 text-center border border-rose-300/50">
                        <Flower2 className="w-16 h-16 text-rose-500 stroke-[1.5] mb-2 animate-pulse" />
                        <span className="text-xs font-serif italic text-rose-900">
                          {defaultCharmQuotes[selectedCharmIndex % defaultCharmQuotes.length]}
                        </span>
                      </div>
                    )}

                    <div className="w-full flex items-center justify-between text-[11px] font-medium text-rose-900 px-1">
                      <span>Kỷ niệm 20/10</span>
                      <span className="flex items-center gap-1 text-amber-700">
                        <RotateCcw className="w-3 h-3" /> Chạm để lật
                      </span>
                    </div>
                  </div>

                  {/* BACK FACE (Personal Note & Sender Engraving) */}
                  <div
                    className="absolute inset-0 [backface-visibility:hidden] rounded-2xl p-5 bg-gradient-to-br from-[#2a081e] via-[#1a0513] to-black text-rose-100 flex flex-col justify-between border-2 border-rose-400/60 shadow-2xl"
                    style={{ transform: 'rotateY(180deg)' }}
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-rose-500/30 pb-2 mb-3">
                        <span className="text-[10px] tracking-widest uppercase text-amber-300 font-mono">
                          Lời Nhắn Sau Hoa
                        </span>
                        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                      </div>
                      <p className="text-xs leading-relaxed text-rose-200/90 italic font-serif">
                        "{message}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-rose-500/20 flex items-center justify-between text-xs">
                      <span className="text-rose-400/80">Ký tặng:</span>
                      <span className="font-semibold text-amber-300">{sender}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Flip Button Indicator */}
              <button
                onClick={() => {
                  soundFx.playPinClick();
                  setIsFlipped(!isFlipped);
                }}
                className="mt-4 px-4 py-2 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {isFlipped ? 'Xem Lại Mặt Trước (Ảnh)' : 'Lật Xem Mặt Sau (Lời Chúc)'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
