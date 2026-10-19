import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight, Play, Pause, RotateCw, Maximize2, X, Eye } from 'lucide-react';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

// 5 Rich Theme Color Palettes with cylindrical 3D wood shaders
const THEMES = {
  cyan: {
    id: 'cyan',
    name: 'Băng Tuyết Dạ Quang',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    glowHex: '#06B6D4',
    accentColor: '#38BDF8',
    domeBg: 'from-cyan-400/15 via-sky-500/10 to-transparent',
    ambientBg: 'from-slate-950 via-cyan-950/70 to-slate-950',
    cardBorder: 'border-cyan-400/80',
    cardGlow: 'shadow-[0_0_30px_rgba(6,182,212,0.4)]',
    baseWood: 'linear-gradient(90deg, #100603 0%, #291007 16%, #4a1d0d 34%, #732d16 50%, #4a1d0d 66%, #230c04 84%, #0d0502 100%)',
    brassRing: 'from-amber-200 via-yellow-400 to-amber-600',
    plaqueGrad: 'from-amber-100 via-yellow-300 to-amber-500',
    accentText: 'text-cyan-300',
  },
  purple: {
    id: 'purple',
    name: 'Dạ Nguyệt Thạch Anh',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    glowHex: '#A855F7',
    accentColor: '#C084FC',
    domeBg: 'from-purple-400/15 via-fuchsia-500/10 to-transparent',
    ambientBg: 'from-slate-950 via-purple-950/70 to-slate-950',
    cardBorder: 'border-purple-400/80',
    cardGlow: 'shadow-[0_0_30px_rgba(168,85,247,0.4)]',
    baseWood: 'linear-gradient(90deg, #0e0314 0%, #230930 16%, #3d1254 34%, #5b1d7a 50%, #3d1254 66%, #1d0729 84%, #0b0210 100%)',
    brassRing: 'from-purple-300 via-fuchsia-300 to-purple-600',
    plaqueGrad: 'from-purple-200 via-fuchsia-200 to-purple-400',
    accentText: 'text-purple-300',
  },
  rose: {
    id: 'rose',
    name: 'Hồng Ngọc Tình Yêu',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    glowHex: '#F43F5E',
    accentColor: '#FB7185',
    domeBg: 'from-rose-400/15 via-pink-500/10 to-transparent',
    ambientBg: 'from-slate-950 via-rose-950/70 to-slate-950',
    cardBorder: 'border-rose-400/80',
    cardGlow: 'shadow-[0_0_30px_rgba(244,63,94,0.4)]',
    baseWood: 'linear-gradient(90deg, #140306 0%, #2f0910 16%, #4e111d 34%, #731a2c 50%, #4e111d 66%, #27060d 84%, #0f0204 100%)',
    brassRing: 'from-rose-300 via-pink-400 to-rose-600',
    plaqueGrad: 'from-rose-200 via-pink-200 to-rose-400',
    accentText: 'text-rose-300',
  },
  gold: {
    id: 'gold',
    name: 'Hoàng Kim Quý Tộc',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    glowHex: '#EAB308',
    accentColor: '#FBBF24',
    domeBg: 'from-amber-400/15 via-yellow-500/10 to-transparent',
    ambientBg: 'from-stone-950 via-amber-950/70 to-stone-950',
    cardBorder: 'border-amber-400/80',
    cardGlow: 'shadow-[0_0_30px_rgba(234,179,8,0.4)]',
    baseWood: 'linear-gradient(90deg, #120902 0%, #2c1706 16%, #4c290d 34%, #703e14 50%, #4c290d 66%, #231204 84%, #0e0601 100%)',
    brassRing: 'from-yellow-200 via-amber-300 to-yellow-600',
    plaqueGrad: 'from-yellow-100 via-amber-300 to-yellow-500',
    accentText: 'text-amber-300',
  },
  midnight: {
    id: 'midnight',
    name: 'Ngân Hà Tinh Tú',
    glowColor: 'rgba(99, 102, 241, 0.45)',
    glowHex: '#6366F1',
    accentColor: '#818CF8',
    domeBg: 'from-indigo-400/15 via-blue-500/10 to-transparent',
    ambientBg: 'from-black via-indigo-950/70 to-slate-950',
    cardBorder: 'border-indigo-400/80',
    cardGlow: 'shadow-[0_0_30px_rgba(99,102,241,0.4)]',
    baseWood: 'linear-gradient(90deg, #030612 0%, #09102b 16%, #121e4a 34%, #1c2d6b 50%, #121e4a 66%, #070c23 84%, #02040d 100%)',
    brassRing: 'from-indigo-300 via-sky-400 to-indigo-600',
    plaqueGrad: 'from-indigo-200 via-sky-300 to-indigo-400',
    accentText: 'text-indigo-300',
  },
};

/* ─── ORNATE BAROQUE CORNER BRACKET (HOA VĂN ĐỒNG ĐÚC GÓC BỆ) ─── */
function BaroqueCorner({ className = '' }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className={`pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${className}`}>
      <defs>
        <linearGradient id="baroqueGold" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="30%" stopColor="#fef08a" />
          <stop offset="65%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>
      <path
        d="M2 2 H16 C12 2 10 5 10 8 C10 11 14 13 16 13 C11 13 7 16 7 21 C7 24 9 26 12 28 H2 V2 Z"
        fill="url(#baroqueGold)"
        opacity="0.95"
      />
      <path
        d="M3 3 C3 11 6 17 13 21 M3 3 C11 3 17 6 21 13"
        stroke="#fef9c3"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <circle cx="5" cy="5" r="1.6" fill="#fffbeb" />
      <circle cx="12" cy="7" r="1.1" fill="#fef08a" />
      <circle cx="7" cy="12" r="1.1" fill="#fef08a" />
    </svg>
  );
}

/* ─── 3D VINTAGE BUTTERFLY WINDING KEY (TAY VẶN CÓT CÁNH BƯỚM KIM LOẠI 3D) ─── */
function ButterflyWindingKey({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* 3D Keyhole Escutcheon Rosette Plate */}
      <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#fff7ed] via-[#fde047] via-35% via-[#d97706] via-70% to-[#451a03] p-[2px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.85)] flex items-center justify-center">
        {/* Inner concentric ring with engraved radial notches */}
        <div className="w-full h-full rounded-full bg-gradient-to-tl from-[#140802] via-[#2f1406] to-[#1c0b03] flex items-center justify-center border border-amber-500/50 shadow-inner relative overflow-hidden">
          {/* Radial tick notches */}
          <div className="absolute inset-1 rounded-full border border-dashed border-amber-400/40" />

          {/* 3D Rotating Butterfly Key */}
          <motion.div
            animate={
              isPlaying
                ? { rotate: [0, 360] }
                : { rotate: 22 }
            }
            transition={
              isPlaying
                ? { duration: 2.2, repeat: Infinity, ease: 'linear' }
                : { duration: 0.35 }
            }
            className="relative z-10 flex items-center justify-center cursor-pointer drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]"
          >
            <svg width="36" height="36" viewBox="0 0 44 44" fill="none">
              <defs>
                <linearGradient id="keyGoldGrad" x1="4" y1="4" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="20%" stopColor="#fef08a" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="75%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#451a03" />
                </linearGradient>
                <linearGradient id="keyShaftGrad" x1="18" y1="18" x2="26" y2="26">
                  <stop offset="0%" stopColor="#fffbeb" />
                  <stop offset="50%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#311202" />
                </linearGradient>
              </defs>
              {/* Left Butterfly Wing */}
              <path
                d="M20 22 C17 13 6 10 3 16 C1 20 3 26 9 27 C15 28 18 25 20 22 Z"
                fill="url(#keyGoldGrad)"
                stroke="#fffbeb"
                strokeWidth="0.8"
              />
              <circle cx="8" cy="18" r="2.6" fill="#120601" stroke="#fbbf24" strokeWidth="0.8" />

              {/* Right Butterfly Wing */}
              <path
                d="M24 22 C27 13 38 10 41 16 C43 20 41 26 35 27 C29 28 26 25 24 22 Z"
                fill="url(#keyGoldGrad)"
                stroke="#fffbeb"
                strokeWidth="0.8"
              />
              <circle cx="36" cy="18" r="2.6" fill="#120601" stroke="#fbbf24" strokeWidth="0.8" />

              {/* Center Hub & Spindle Boss */}
              <circle cx="22" cy="22" r="5.5" fill="url(#keyShaftGrad)" stroke="#fef08a" strokeWidth="1" />
              <circle cx="22" cy="22" r="2" fill="#ffffff" />
            </svg>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ─── 3D EMBOSSED BRASS NAMEPLATE (BIỂN ĐỒNG DẬP NỔI HOÀNG GIA) ─── */
function BrassEngravedPlaque({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="relative flex-1 mr-2 sm:mr-3 py-0.5">
      {/* Outer beveled metallic plaque frame */}
      <div className="relative px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-br from-[#fff7ed] via-[#fde047] via-25% via-[#d97706] via-60% to-[#78350f] p-[1.5px] shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.85)] border border-amber-300/40">
        <div className="relative rounded-[9px] bg-gradient-to-r from-[#ffe8a3] via-[#ffdf88] to-[#f5b33d] px-2 py-0.5 sm:py-1 flex flex-col justify-center shadow-inner overflow-hidden">
          {/* Brushed metal reflection streak */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_40%,transparent_60%)] pointer-events-none" />

          {/* 4 Miniature Slotted Brass Dome Screws at Corners */}
          <div className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-100 to-amber-900 border border-amber-950/50 flex items-center justify-center">
            <div className="w-1 h-[0.5px] bg-amber-950 rotate-45" />
          </div>
          <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-100 to-amber-900 border border-amber-950/50 flex items-center justify-center">
            <div className="w-1 h-[0.5px] bg-amber-950 -rotate-45" />
          </div>
          <div className="absolute bottom-1 left-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-100 to-amber-900 border border-amber-950/50 flex items-center justify-center">
            <div className="w-1 h-[0.5px] bg-amber-950 -rotate-30" />
          </div>
          <div className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-amber-100 to-amber-900 border border-amber-950/50 flex items-center justify-center">
            <div className="w-1 h-[0.5px] bg-amber-950 rotate-60" />
          </div>

          {/* Engraved Typography */}
          <div className="text-center sm:text-left px-2">
            <p className="text-[10px] sm:text-[11px] font-black font-serif text-amber-950 tracking-wider uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.85)] truncate">
              {title}
            </p>
            <div className="flex items-center gap-1 my-0.5 justify-center sm:justify-start">
              <span className="text-[7px] text-amber-900/60 font-serif">❦</span>
              <div className="h-[0.8px] flex-1 max-w-[65px] bg-gradient-to-r from-amber-800/40 to-transparent" />
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-amber-900 font-serif italic truncate drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 3D SPHERICAL BRASS PEDESTAL FOOT (CHÂN ĐẾ QUẢ CẦU ĐỒNG ĐÁNH BÓNG) ─── */
function BrassPedestalFoot() {
  return (
    <div className="relative w-4.5 sm:w-5 h-3 sm:h-3.5 flex flex-col items-center">
      {/* Brass collar mounting */}
      <div className="w-3.5 sm:w-4 h-1 rounded-t-xs bg-gradient-to-r from-amber-700 via-amber-300 to-amber-800 shadow-xs" />
      {/* 3D Polished Brass Sphere */}
      <div className="w-4 sm:w-4.5 h-2 sm:h-2.5 rounded-b-full bg-gradient-to-b from-yellow-100 via-amber-400 to-amber-950 border border-yellow-200/70 shadow-[0_3px_6px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.9)] relative overflow-hidden">
        <div className="absolute top-0.5 left-1 w-1 h-1 rounded-full bg-white/90 blur-[0.4px]" />
      </div>
    </div>
  );
}

/* ─── TOP FACETED CRYSTAL DOME FINIAL KNOB (NÚM ĐỈNH PHA LÊ VÁT CẠNH) ─── */
function CrystalDomeFinial() {
  return (
    <div className="absolute -top-3.5 sm:-top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
      <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
        {/* Soft radial halo */}
        <div className="absolute inset-0 bg-white/40 rounded-full blur-sm animate-pulse" />
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" className="relative drop-shadow-[0_4px_10px_rgba(255,255,255,0.85)]">
          <defs>
            <linearGradient id="finialGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#e0f2fe" stopOpacity="0.85" />
              <stop offset="75%" stopColor="#7dd3fc" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <polygon points="18,3 27,11 23,25 18,28 13,25 9,11" fill="url(#finialGrad)" stroke="#ffffff" strokeWidth="1" />
          <polygon points="18,3 27,11 18,17" fill="#ffffff" fillOpacity="0.6" />
          <polygon points="18,3 9,11 18,17" fill="#bae6fd" fillOpacity="0.4" />
          <polygon points="18,17 27,11 23,25" fill="#38bdf8" fillOpacity="0.3" />
          <polygon points="18,17 9,11 13,25" fill="#7dd3fc" fillOpacity="0.5" />
          <polygon points="18,17 13,25 18,28" fill="#e0f2fe" fillOpacity="0.7" />
          <polygon points="18,17 23,25 18,28" fill="#ffffff" fillOpacity="0.85" />
          <circle cx="16" cy="9" r="1.3" fill="#ffffff" />
        </svg>
        {/* Brass base collar for finial */}
        <div className="absolute -bottom-0.5 w-4 h-1.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 border border-yellow-100 shadow-xs" />
      </div>
    </div>
  );
}

/* ─── HIGH-END SCULPTED CRYSTAL ROSE (ĐÓA HỒNG PHA LÊ SWAROVSKI) ─── */
function SculptedCrystalRose() {
  return (
    <div className="relative flex flex-col items-center">
      {/* Radiant Petal Core Glow */}
      <div className="absolute top-2 w-20 h-20 rounded-full bg-rose-500/40 blur-2xl pointer-events-none animate-pulse" />

      <svg
        width="95"
        height="125"
        viewBox="0 0 100 135"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-[0_0_18px_rgba(244,63,94,0.8)] filter"
      >
        <defs>
          <radialGradient id="crGlow" cx="50%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#fff5f5" />
            <stop offset="35%" stopColor="#fb7185" />
            <stop offset="70%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#881337" />
          </radialGradient>
          <linearGradient id="crFacetL" x1="25" y1="20" x2="50" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffe4e6" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#9f1239" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="crFacetR" x1="75" y1="20" x2="50" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fecdd3" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#fb7185" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#be123c" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="crStem" x1="48" y1="55" x2="52" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="crLeafL" x1="20" y1="75" x2="50" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#065f46" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="crPedestal" x1="15" y1="110" x2="85" y2="132" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#713f12" />
          </linearGradient>
        </defs>

        {/* Stem with faceted crystal cuts */}
        <path d="M50 56 Q49 82 50 114" stroke="url(#crStem)" strokeWidth="4" strokeLinecap="round" />
        <path d="M49 60 Q48.5 82 49 110" stroke="#ecfdf5" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

        {/* Left Crystal Leaf */}
        <path d="M49 76 C35 70 22 80 18 85 C27 92 41 87 49 82 Z" fill="url(#crLeafL)" stroke="#d1fae5" strokeWidth="1" />
        <path d="M49 76 L25 85" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.75" />

        {/* Right Crystal Leaf */}
        <path d="M51 84 C65 79 78 88 82 93 C73 100 59 95 51 90 Z" fill="url(#crLeafL)" stroke="#d1fae5" strokeWidth="1" />
        <path d="M51 84 L75 93" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.75" />

        {/* Outer Rose Petals (Geometric Crystal Facets) */}
        <path
          d="M26 36 C22 49 34 63 50 65 C66 63 78 49 74 36 C69 25 58 30 50 33 C42 30 31 25 26 36 Z"
          fill="url(#crGlow)"
          stroke="#ffe4e6"
          strokeWidth="1.2"
        />

        {/* Left Outer Facet */}
        <path d="M28 35 C33 46 41 57 50 60 C43 51 36 43 28 35 Z" fill="url(#crFacetL)" stroke="#fff1f2" strokeWidth="0.8" />

        {/* Right Outer Facet */}
        <path d="M72 35 C67 46 59 57 50 60 C57 51 64 43 72 35 Z" fill="url(#crFacetR)" stroke="#fff1f2" strokeWidth="0.8" />

        {/* Center Petal Whirl */}
        <path d="M38 27 C38 16 62 16 62 27 C62 38 38 38 38 27 Z" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="0.8" />
        <path d="M42 25 C42 18 58 18 58 25 C58 32 42 32 42 25 Z" fill="#e11d48" />
        <path d="M46 23 C46 19 54 19 54 23 C54 27 46 27 46 23 Z" fill="#fff1f2" />

        {/* Diamond Glint Sparkles */}
        <polygon points="50,15 52,19 56,20 52,21 50,25 48,21 44,20 48,19" fill="#ffffff" opacity="0.9" />
        <polygon points="32,44 33,47 36,47 33,48 32,51 31,48 28,47 31,47" fill="#ffffff" opacity="0.8" />
        <polygon points="68,42 69,45 72,45 69,46 68,49 67,46 64,45 67,45" fill="#ffffff" opacity="0.8" />

        {/* Sculpted Golden Pedestal Base */}
        <ellipse cx="50" cy="116" rx="28" ry="6" fill="url(#crPedestal)" stroke="#fef08a" strokeWidth="1" />
        <ellipse cx="50" cy="122" rx="36" ry="8" fill="url(#crPedestal)" stroke="#fef08a" strokeWidth="1.2" />
        <ellipse cx="50" cy="125" rx="42" ry="9" fill="#2e1003" stroke="#ca8a04" strokeWidth="0.8" opacity="0.5" />
      </svg>
    </div>
  );
}

/* ─── SCULPTED TWIN SWANS (ĐÔI THIÊN NGA PHA LÊ) ─── */
function SculptedTwinSwans() {
  return (
    <div className="relative flex flex-col items-center">
      <div className="absolute top-4 w-24 h-24 rounded-full bg-cyan-400/30 blur-2xl pointer-events-none animate-pulse" />
      <svg width="105" height="105" viewBox="0 0 120 120" fill="none" className="relative z-10 filter drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]">
        <defs>
          <linearGradient id="swanGrad" x1="0" y1="20" x2="60" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        <path d="M54 45 C48 30 34 26 26 36 C20 44 26 56 34 68 C42 80 52 86 54 88 C48 86 36 82 28 78 C20 74 16 66 18 56 C20 42 34 32 46 38 Z" fill="url(#swanGrad)" stroke="#e0f2fe" strokeWidth="1.2" />
        <path d="M66 45 C72 30 86 26 94 36 C100 44 94 56 86 68 C78 80 68 86 66 88 C72 86 84 82 92 78 C100 74 104 66 102 56 C100 42 86 32 74 38 Z" fill="url(#swanGrad)" stroke="#e0f2fe" strokeWidth="1.2" />
        <path d="M54 44 L60 48 L56 50 Z" fill="#f97316" />
        <path d="M66 44 L60 48 L64 50 Z" fill="#f97316" />
        <ellipse cx="60" cy="94" rx="45" ry="10" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
        <ellipse cx="60" cy="98" rx="35" ry="7" fill="#0284c7" fillOpacity="0.2" stroke="#bae6fd" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

/* ─── SCULPTED DIAMOND HEART (TRÁI TIM KIM CƯƠNG) ─── */
function SculptedDiamondHeart() {
  return (
    <div className="relative flex flex-col items-center">
      <div className="absolute top-2 w-24 h-24 rounded-full bg-pink-500/40 blur-2xl pointer-events-none animate-pulse" />
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" className="relative z-10 filter drop-shadow-[0_0_20px_rgba(244,114,182,0.9)]">
        <defs>
          <linearGradient id="dhGrad" x1="10" y1="15" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff1f2" />
            <stop offset="35%" stopColor="#f472b6" />
            <stop offset="70%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#831843" />
          </linearGradient>
        </defs>
        <path d="M50 85 L20 48 C12 36 18 20 32 18 C40 17 46 22 50 28 C54 22 60 17 68 18 C82 20 88 36 80 48 Z" fill="url(#dhGrad)" stroke="#fbcfe8" strokeWidth="1.5" />
        <polygon points="50,28 32,18 50,42" fill="#ffffff" opacity="0.4" />
        <polygon points="50,28 68,18 50,42" fill="#f472b6" opacity="0.5" />
        <polygon points="50,42 20,48 50,85" fill="#be185d" opacity="0.6" />
        <polygon points="50,42 80,48 50,85" fill="#9d174d" opacity="0.7" />
        <polygon points="32,24 34,28 38,29 34,30 32,34 30,30 26,29 30,28" fill="#ffffff" />
      </svg>
    </div>
  );
}

export default function CrystalCarouselFX({ config }: Props) {
  const carouselAngleMotion = useMotionValue(0);
  const [isPlayingBox, setIsPlayingBox] = useState(false);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [focusCenterpiece, setFocusCenterpiece] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  // Drag interaction state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartAngle = useRef(0);

  const activeThemeKey = (config.crystalTheme || 'cyan') as keyof typeof THEMES;
  const theme = THEMES[activeThemeKey] || THEMES.cyan;
  const weatherType = config.crystalWeather || 'snow';
  const centerpieceType = config.crystalCenterpiece || 'rose';

  const userImages = config.images || [];

  const defaultQuotes = useMemo(() => [
    'Mỗi khoảnh khắc bên em đều lấp lánh như viên pha lê.',
    'Em là điều ngọt ngào nhất mà số phận đã sắp đặt.',
    'Chúc em ngày 20/10 ngập tràn niềm vui và bình yên.',
    'Nụ cười của em thắp sáng cả thế giới xung quanh.',
    'Mãi yêu thương và trân trọng từng phút giây bên nhau.',
    'Gửi tặng công chúa đóa hồng vĩnh cửu không tàn 🌹',
  ], []);

  const customQuotes = config.crystalQuotes || defaultQuotes;

  // 6 Carousel Panels with front & back
  const panels = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const hasImage = userImages.length > 0 && userImages[i % userImages.length];
      return {
        id: i,
        indexStr: `0${i + 1}`,
        image: hasImage || undefined,
        quote: customQuotes[i] || defaultQuotes[i % defaultQuotes.length],
      };
    });
  }, [userImages, customQuotes, defaultQuotes]);

  // Smooth Auto-spin via Framer Motion direct GPU compositor animation (NO React re-renders!)
  useEffect(() => {
    if (!isPlayingBox && !isAutoSpinning) return;
    const currentAngle = carouselAngleMotion.get();
    const duration = isPlayingBox ? 16 : 28;
    const controls = animate(carouselAngleMotion, currentAngle + 360, {
      duration,
      repeat: Infinity,
      ease: 'linear',
    });
    return () => {
      controls.stop();
    };
  }, [isPlayingBox, isAutoSpinning, carouselAngleMotion]);

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartAngle.current = carouselAngleMotion.get();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - dragStartX.current;
    carouselAngleMotion.set(dragStartAngle.current + deltaX * 0.65);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleRotateLeft = () => {
    soundFx.playPinClick();
    animate(carouselAngleMotion, carouselAngleMotion.get() - 60, {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1],
    });
  };

  const handleRotateRight = () => {
    soundFx.playPinClick();
    animate(carouselAngleMotion, carouselAngleMotion.get() + 60, {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1],
    });
  };

  const handleTogglePlayBox = () => {
    if (isPlayingBox) {
      soundFx.playPinClick();
      soundFx.stopBackgroundMusic();
      setIsPlayingBox(false);
    } else {
      soundFx.playMusicBoxWinding();
      setTimeout(() => {
        soundFx.startBackgroundMusic(config.musicPreset || 'music-box', config.audioUrl);
      }, 180);
      setIsPlayingBox(true);
    }
  };

  const handleShakeGlobe = () => {
    soundFx.playSuccessChime();
    setIsShaking(true);
    animate(carouselAngleMotion, carouselAngleMotion.get() + 360, {
      duration: 2.2,
      ease: 'easeInOut',
    });
    setTimeout(() => {
      setIsShaking(false);
    }, 2800);
  };

  // Weather particles generation (Tối ưu 14 hạt nhẹ nhàng)
  const particles = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: `${6 + ((i * 19) % 86)}%`,
      top: `${8 + ((i * 23) % 80)}%`,
      size: 4 + (i % 3) * 2,
      delay: (i % 5) * 0.4,
      duration: 3.5 + (i % 4) * 1.2,
      symbol:
        weatherType === 'snow'
          ? ['❄', '·', '⋆', '✦'][i % 4]
          : weatherType === 'petals'
          ? ['🌸', '🌺', '🍃', '💮'][i % 4]
          : weatherType === 'hearts'
          ? ['💖', '💕', '✨', '💗'][i % 4]
          : weatherType === 'notes'
          ? ['♪', '♫', '♬', '✨'][i % 4]
          : ['✨', '⋆', '✦', '⭐'][i % 4],
    }));
  }, [weatherType]);

  return (
    <div
      className="relative w-full h-full min-h-full bg-slate-950 overflow-y-auto sm:overflow-hidden select-none flex flex-col items-center justify-start sm:justify-center p-2 sm:p-3"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Dynamic Deep Velvet Background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.ambientBg} pointer-events-none transition-colors duration-1000`} />

      {/* Radial soft atmospheric glow behind the globe */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] sm:w-[500px] h-[360px] sm:h-[500px] rounded-full blur-[100px] pointer-events-none opacity-45 transition-all duration-700"
        style={{ background: theme.glowColor }}
      />

      {/* Main Interactive Music Box Stage */}
      <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-2.5 w-full max-w-md py-1 sm:py-0">
        
        {/* Top Control Chips: Shake & Focus Mode */}
        <div className="flex items-center gap-1.5 sm:gap-2 z-20">
          <button
            onClick={handleShakeGlobe}
            className="px-2.5 sm:px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white text-[10.5px] font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            title="Lắc quả cầu để khuấy động bão tuyết lấp lánh"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
            <span>Lắc Quả Cầu</span>
          </button>

          <button
            onClick={() => setFocusCenterpiece(!focusCenterpiece)}
            className={`px-2.5 sm:px-3 py-1 rounded-full border text-[10.5px] font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg active:scale-95 transition-all ${
              focusCenterpiece
                ? 'bg-rose-500/30 border-rose-400 text-rose-200 ring-2 ring-rose-400/30'
                : 'bg-white/10 hover:bg-white/20 border-white/25 text-slate-200'
            }`}
            title="Tập trung ngắm đóa hoa pha lê trung tâm"
          >
            <Eye className="w-3.5 h-3.5 text-rose-400" />
            <span>{focusCenterpiece ? '6 Thẻ Kỷ Niệm' : 'Ngắm Đóa Hồng'}</span>
          </button>

          <button
            onClick={() => setIsAutoSpinning(!isAutoSpinning)}
            className={`px-2.5 sm:px-3 py-1 rounded-full border text-[10.5px] font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg active:scale-95 transition-all ${
              isAutoSpinning
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                : 'bg-white/10 hover:bg-white/20 border-white/25 text-slate-200'
            }`}
            title="Tự động xoay hộp nhạc 360 độ"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoSpinning ? 'animate-spin' : ''}`} />
            <span>{isAutoSpinning ? 'Đang Xoay' : 'Tự Xoay'}</span>
          </button>
        </div>

        {/* ─── THE PHYSICAL SNOW GLOBE GLASS DOME (QUẢ CẦU THỦY TINH CAO CẤP 3D) ─── */}
        <div className="relative flex flex-col items-center">
          
          {/* Top Faceted Crystal Finial / Crown Knob */}
          <CrystalDomeFinial />

          <motion.div
            animate={
              isShaking
                ? {
                    x: [-8, 8, -6, 6, -3, 3, 0],
                    rotate: [-3, 3, -2, 2, 0],
                  }
                : {}
            }
            transition={{ duration: 0.8 }}
            className={`relative w-[260px] sm:w-[305px] h-[245px] sm:h-[280px] rounded-t-[130px] sm:rounded-t-[152px] rounded-b-none bg-gradient-to-b ${theme.domeBg} border-[2px] border-b-0 border-white/60 shadow-[0_0_50px_rgba(0,0,0,0.85),inset_0_2px_8px_rgba(255,255,255,0.7),inset_0_0_30px_rgba(255,255,255,0.18),0_0_45px_${theme.glowHex}35] overflow-hidden flex flex-col items-center justify-between p-1.5 sm:p-2`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
          >
            {/* Inner Glass Refractive Rim (Tạo độ dày thật 4mm cho kính) */}
            <div className="absolute inset-1 rounded-t-[125px] sm:rounded-t-[146px] border border-white/25 pointer-events-none" />

            {/* Primary Curved Specular Glass Reflection (Khúc xạ ánh sáng mặt kính cong 3D) */}
            <div className="absolute top-2 left-3.5 w-10 sm:w-11 h-44 sm:h-52 rounded-[100%] bg-gradient-to-b from-white/60 via-white/20 to-transparent blur-[2px] -rotate-[15deg] pointer-events-none" />
            
            {/* Specular Glint Highlight on glass shoulder */}
            <div className="absolute top-8 left-10 w-3 h-3 rounded-full bg-white/95 blur-[0.5px] pointer-events-none shadow-[0_0_12px_rgba(255,255,255,0.95)]" />

            {/* Secondary Ambient Rim Reflection on right side */}
            <div className="absolute top-6 right-4 w-3.5 sm:w-4 h-48 sm:h-56 rounded-[100%] bg-gradient-to-b from-white/35 via-white/10 to-transparent blur-[1px] rotate-[15deg] pointer-events-none" />

            {/* Internal Warm Stage LED Uplight Spotlight (Đèn hắt đáy từ mâm máy lên) */}
            <div className="absolute bottom-0 inset-x-0 h-32 bg-[radial-gradient(ellipse_at_bottom,rgba(251,191,36,0.32)_0%,rgba(56,189,248,0.12)_45%,transparent_75%)] pointer-events-none" />

            {/* Frosted base mist at bottom of the globe */}
            <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white/25 via-white/8 to-transparent pointer-events-none backdrop-blur-[1px]" />

            {/* Glass bottom thick rolled lip bead */}
            <div className="absolute bottom-0 inset-x-0 h-1.5 bg-gradient-to-r from-white/40 via-white/70 to-white/40 pointer-events-none shadow-xs" />

            {/* Internal Weather Particles */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className={`absolute pointer-events-none text-xs sm:text-sm select-none ${
                  weatherType === 'snow'
                    ? 'text-cyan-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]'
                    : weatherType === 'petals'
                    ? 'text-rose-300'
                    : weatherType === 'hearts'
                    ? 'text-pink-300'
                    : weatherType === 'notes'
                    ? 'text-amber-200'
                    : 'text-yellow-200'
                }`}
                style={{
                  left: p.left,
                  top: p.top,
                }}
                animate={
                  isShaking
                    ? {
                        y: [-120, 100, -80, 80, 0],
                        x: [-60, 60, -40, 40, 0],
                        rotate: [0, 720],
                        scale: [0.8, 1.6, 0.9],
                        opacity: [0.3, 1, 0.4],
                      }
                    : {
                        y: weatherType === 'notes' ? [-40, -110, -40] : [-15, 25, -15],
                        x: [-12, 12, -12],
                        opacity: [0.3, 0.95, 0.3],
                        scale: [0.8, 1.2, 0.8],
                        rotate: [0, 60, 0],
                      }
                }
                transition={{
                  duration: isShaking ? 2.5 : p.duration,
                  delay: isShaking ? 0 : p.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {p.symbol}
              </motion.div>
            ))}

            {/* Musical Notes Floating Up when music box is playing */}
            {isPlayingBox &&
              Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={`note-${i}`}
                  className="absolute text-yellow-300 font-bold pointer-events-none z-30"
                  style={{
                    left: `${28 + i * 9}%`,
                    bottom: '25px',
                  }}
                  initial={{ y: 0, opacity: 0, scale: 0.5 }}
                  animate={{
                    y: -220,
                    opacity: [0, 1, 1, 0],
                    scale: [0.6, 1.4, 1],
                    x: [0, (i % 2 === 0 ? 1 : -1) * 25, 0],
                  }}
                  transition={{
                    duration: 3.2 + i * 0.4,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: 'easeOut',
                  }}
                >
                  {['♪', '♫', '♬', '✨', '♪', '♫'][i]}
                </motion.div>
              ))}

            {/* ─── 3D CAROUSEL STAGE WITH REALISTIC DEPTH & CENTERPIECE ─── */}
            <div
              className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
              style={{ perspective: '1100px' }}
            >
              {/* The Unified 3D Coordinate System (Driven directly by GPU Compositor) */}
              <motion.div
                style={{
                  rotateY: carouselAngleMotion,
                  transformStyle: 'preserve-3d',
                }}
                className="relative w-22 sm:w-26 h-32 sm:h-40 flex items-center justify-center"
              >
                {/* ── 1. CENTERPIECE AT (0,0,0) INSIDE 3D SPACE ── */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    transform: 'translateZ(0px)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Golden Clockwork Mirrored Turn-Table Disc */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
                    className="absolute bottom-2 w-32 h-32 rounded-full border-2 border-amber-300/70 bg-gradient-to-b from-amber-300/30 via-yellow-400/15 to-transparent flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.4)]"
                    style={{ transform: 'rotateX(75deg)' }}
                  >
                    <div className="w-full h-full rounded-full border border-dashed border-amber-300/50 flex items-center justify-center">
                      <span className="text-[7.5px] font-mono text-amber-200/70 tracking-widest uppercase">
                        ★ I ★ III ★ V ★ VII ★ IX ★ XI ★
                      </span>
                    </div>
                  </motion.div>

                  {/* Render Selected High-End Sculpted Centerpiece */}
                  <motion.div
                    animate={
                      isPlayingBox
                        ? { y: [-4, 4, -4], rotateY: 360 }
                        : { y: [-3, 3, -3] }
                    }
                    transition={{
                      y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                      rotateY: { duration: 16, repeat: Infinity, ease: 'linear' },
                    }}
                    className="relative z-10"
                  >
                    {centerpieceType === 'rose' && <SculptedCrystalRose />}
                    {centerpieceType === 'swans' && <SculptedTwinSwans />}
                    {centerpieceType === 'heart' && <SculptedDiamondHeart />}
                    {centerpieceType === 'castle' && (
                      <div className="text-4xl filter drop-shadow-[0_0_25px_rgba(251,191,36,0.9)] animate-pulse">
                        🏰
                      </div>
                    )}
                    {centerpieceType === 'teddy' && (
                      <div className="text-4xl filter drop-shadow-[0_0_25px_rgba(168,85,247,0.9)] animate-pulse">
                        🧸
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* ── 2. THE 6 GILDED CRYSTAL CAROUSEL PANELS ── */}
                {panels.map((panel, idx) => {
                  const angle = idx * 60; // 360 / 6 = 60 deg
                  const orbitRadius = focusCenterpiece ? 130 : 108;
                  const depthScale = focusCenterpiece ? 0.72 : 1;
                  const depthOpacity = focusCenterpiece ? 0.35 : 1;

                  return (
                    <div
                      key={panel.id}
                      className="absolute inset-0"
                      style={{
                        transform: `rotateY(${angle}deg) translateZ(${orbitRadius}px) scale(${depthScale})`,
                        transformStyle: 'preserve-3d',
                        opacity: depthOpacity,
                        transition: 'opacity 0.4s ease, transform 0.4s ease',
                      }}
                    >
                      {/* FRONT FACE: Gilded Vintage Crystal Slide */}
                      <div
                        onClick={() => {
                          soundFx.playPinClick();
                          setSelectedItemIndex(panel.id);
                        }}
                        className={`absolute inset-0 rounded-2xl p-1.5 bg-[#0c1222] border-2 border-amber-300/90 shadow-[0_10px_35px_rgba(0,0,0,0.95)] ring-1 ring-amber-400/50 flex flex-col items-center justify-between cursor-pointer hover:border-white hover:scale-105 transition-all group overflow-hidden`}
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                        }}
                      >
                        {/* Baroque corner accents */}
                        <span className="absolute top-1 left-1.5 text-amber-400/80 text-[7px] pointer-events-none">❖</span>
                        <span className="absolute top-1 right-1.5 text-amber-400/80 text-[7px] pointer-events-none">❖</span>

                        {/* Header Badge */}
                        <div className="w-full flex items-center justify-between text-[7.5px] font-mono font-bold text-amber-200 px-1 border-b border-amber-400/30 pb-0.5">
                          <span className="text-amber-300">#{panel.indexStr}</span>
                          <span className="text-[6.5px] text-amber-400 font-serif tracking-widest">KỶ NIỆM</span>
                        </div>

                        {/* Photo or Gem Placeholder */}
                        {panel.image ? (
                          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black/60 border border-amber-300/50 shadow-inner group-hover:border-amber-200 transition-colors">
                            <img
                              src={panel.image}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-1">
                              <span className="text-[7.5px] font-bold text-white flex items-center gap-1">
                                <Maximize2 className="w-2.5 h-2.5 text-amber-300" /> Xem ảnh
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-black border border-amber-400/40 flex flex-col items-center justify-center shadow-inner group">
                            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-300/50 flex items-center justify-center text-lg shadow-[0_0_12px_rgba(251,191,36,0.4)]">
                              💎
                            </div>
                            <span className="text-[6.5px] text-amber-300/70 font-serif mt-1">Pha Lê Kỷ Niệm</span>
                          </div>
                        )}

                        {/* Romantic Quote Plaque */}
                        <div className="w-full bg-black/60 rounded-lg p-1 border border-amber-400/30">
                          <p className="text-[7.5px] sm:text-[8.5px] font-medium font-serif italic text-amber-100/90 text-center line-clamp-2 leading-tight">
                            "{panel.quote}"
                          </p>
                        </div>

                        {/* Shimmer Light Reflection Sweep */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none opacity-30" />
                      </div>

                      {/* BACK FACE: Royal Damask Gold Foil Crest */}
                      <div
                        className="absolute inset-0 rounded-2xl p-2 bg-gradient-to-b from-[#151d36] via-[#090e1f] to-[#151d36] border-2 border-amber-400/80 shadow-[0_10px_35px_rgba(0,0,0,0.95)] ring-1 ring-amber-400/40 flex flex-col items-center justify-center text-center"
                        style={{
                          transform: 'rotateY(180deg)',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                        }}
                      >
                        <div className="w-8 h-8 rounded-full border border-amber-300/60 bg-amber-400/10 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(251,191,36,0.3)] mb-0.5">
                          ⚜️
                        </div>
                        <p className="text-[8px] font-serif font-black tracking-widest text-amber-200">
                          ROYAL
                        </p>
                        <p className="text-[6px] text-amber-400/70 font-mono tracking-wider">
                          MUSIC BOX 3D
                        </p>
                        <div className="w-7 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent my-1" />
                        <span className="text-[8px] text-rose-300">🌹</span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Bottom Prompt Badge inside dome */}
            <div className="relative z-20 text-[9px] text-white/80 font-medium flex items-center gap-1.5 bg-black/60 px-2.5 py-0.5 rounded-full border border-white/15 backdrop-blur-xs">
              <span>👆 Vuốt ngang xoay 360° • Chạm ảnh xem kỷ niệm</span>
            </div>
          </motion.div>
        </div>

        {/* ─── LUXURY 3D MULTI-TIERED MAHOGANY WOODEN & BRASS PEDESTAL (BỆ ĐẾ HOÀNG GIA ĐA TẦNG 3D) ─── */}
        <div className="relative w-full max-w-[288px] sm:max-w-[335px] flex flex-col items-center z-20">
          
          {/* TIER 1: Heavy Beveled Brass Dome Retaining Collar (Vành cổ đồng giữ kính) */}
          <div className="w-[260px] sm:w-[305px] h-2.5 sm:h-3 bg-gradient-to-r from-amber-700 via-amber-300 via-yellow-100 via-amber-400 to-amber-800 rounded-t-lg border-t border-yellow-100/90 shadow-[0_3px_8px_rgba(0,0,0,0.85)] flex items-center justify-around px-3 relative overflow-hidden">
            {/* Cylindrical shine highlight streak */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_20%,rgba(255,255,255,0.45)_45%,transparent_65%)] pointer-events-none" />
            
            {/* 3D Beaded pearl rivets along the rim */}
            {Array.from({ length: 11 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-gradient-to-b from-yellow-100 via-amber-400 to-amber-950 border border-yellow-200/80 shadow-xs shrink-0"
              />
            ))}
          </div>

          {/* TIER 2: Upper Stepped Wood Moulding Profile (Phào chỉ gỗ trên vát cong 3D) */}
          <div
            className="w-[270px] sm:w-[316px] h-2 rounded-t-md border-t border-amber-500/40 shadow-inner relative"
            style={{ background: theme.baseWood }}
          >
            {/* Ambient shadow cast by the collar above */}
            <div className="absolute top-0 inset-x-0 h-0.5 bg-black/40 blur-[0.5px]" />
          </div>

          {/* TIER 3: Main Pedestal Drum (Thân bệ gỗ trụ tròn sơn mài bóng bẩy) */}
          <div
            className="relative w-full h-18 sm:h-20 rounded-xl border border-amber-600/50 shadow-[0_16px_50px_rgba(0,0,0,0.95)] flex items-center justify-between px-3 sm:px-4 relative overflow-hidden"
            style={{ background: theme.baseWood }}
          >
            {/* Glossy Lacquer Cylindrical Specular Highlight */}
            <div className="absolute inset-y-0 left-[30%] w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none blur-xs" />

            {/* 4 Ornate Baroque Cast Brass Corner Appliques */}
            <BaroqueCorner className="absolute top-0.5 left-0.5" />
            <BaroqueCorner className="absolute top-0.5 right-0.5 scale-x-[-1]" />
            <BaroqueCorner className="absolute bottom-0.5 left-0.5 scale-y-[-1]" />
            <BaroqueCorner className="absolute bottom-0.5 right-0.5 scale-x-[-1] scale-y-[-1]" />

            {/* 3D Embossed Engraved Brass Plaque */}
            <BrassEngravedPlaque
              title={config.crystalBaseTitle || 'HỘP NHẠC PHA LÊ'}
              subtitle={config.crystalBaseSubtitle || `Dành tặng ${config.recipientName || 'Công Chúa Của Anh'}`}
            />

            {/* Mechanical Winding Key Interaction Station */}
            <div className="flex flex-col items-center gap-1 z-10 shrink-0">
              <button
                onClick={handleTogglePlayBox}
                className="group relative focus:outline-none"
                title={isPlayingBox ? 'Dừng phát nhạc' : 'Vặn dây cót để phát nhạc'}
              >
                <ButterflyWindingKey isPlaying={isPlayingBox} />
              </button>

              {/* Status Indicator Badge */}
              <button
                onClick={handleTogglePlayBox}
                className={`px-2 py-0.5 rounded-full font-serif text-[8.5px] font-black tracking-wider uppercase flex items-center gap-1 border shadow-md active:scale-95 transition-all ${
                  isPlayingBox
                    ? 'bg-rose-950/80 border-rose-400 text-rose-200 ring-1 ring-rose-400/50'
                    : 'bg-amber-950/80 border-amber-400 text-amber-200 hover:bg-amber-900/80 ring-1 ring-amber-400/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isPlayingBox ? 'bg-rose-400 animate-ping' : 'bg-amber-400'}`} />
                <span>{isPlayingBox ? 'Đang Phát' : 'Vặn Cót'}</span>
              </button>
            </div>
          </div>

          {/* TIER 4: Lower Stepped Wood Moulding & Inlaid Brass Trim (Phào chỉ đế dưới & chỉ đồng) */}
          <div className="w-[282px] sm:w-[330px] h-1.5 bg-gradient-to-r from-amber-700 via-yellow-300 via-amber-200 to-amber-800 shadow-sm border-t border-yellow-100/70" />
          
          <div
            className="w-[286px] sm:w-[334px] h-2.5 rounded-b-lg border-b border-amber-900/80 shadow-md relative"
            style={{ background: theme.baseWood }}
          />

          {/* TIER 5: 4 Sculpted Spherical Brass Feet (4 Chân đế quả cầu đồng hoàng gia) */}
          <div className="w-[268px] sm:w-[314px] flex items-center justify-between px-2 -mt-0.5">
            <BrassPedestalFoot />
            <BrassPedestalFoot />
            <BrassPedestalFoot />
            <BrassPedestalFoot />
          </div>

          {/* Soft Physical Contact Shadow on Tabletop */}
          <div className="w-[88%] h-3 bg-black/90 blur-md rounded-full -mt-1 pointer-events-none" />
        </div>

        {/* ─── QUICK NAVIGATION STEP BUTTONS ───────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3 z-20 pt-0.5">
          <button
            onClick={handleRotateLeft}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/20 text-white hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold flex items-center gap-1 shadow-md hover:border-amber-400"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Xoay Trái</span>
          </button>

          <button
            onClick={handleTogglePlayBox}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900/80 border border-white/20 text-white hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold flex items-center justify-center shadow-md hover:border-emerald-400"
            title={isPlayingBox ? 'Tạm dừng nhạc' : 'Phát nhạc nền'}
          >
            {isPlayingBox ? <Pause className="w-3.5 h-3.5 text-rose-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            onClick={handleRotateRight}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/20 text-white hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold flex items-center gap-1 shadow-md hover:border-amber-400"
          >
            <span>Xoay Phải</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── SELECTED CAROUSEL ITEM FULL INSPECTION MODAL ───────────── */}
      <AnimatePresence>
        {selectedItemIndex !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in"
            onClick={() => setSelectedItemIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0c1222] border-2 border-amber-300 p-5 sm:p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-[0_0_80px_rgba(0,0,0,0.95)] relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedItemIndex(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Memory Index Header */}
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-xs font-mono font-bold text-amber-300">
                  ✦ Kỷ Niệm 0{selectedItemIndex + 1} / 06 ✦
                </span>
              </div>

              {/* Photo or Gem */}
              {panels[selectedItemIndex].image ? (
                <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-amber-300/80 shadow-2xl relative">
                  <img
                    src={panels[selectedItemIndex].image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/20 to-transparent border-2 border-amber-300/60 flex items-center justify-center text-5xl shadow-inner">
                  💎
                </div>
              )}

              {/* Romantic Quote */}
              <div className="bg-black/60 rounded-2xl p-3 border border-amber-400/30">
                <p className="text-sm font-serif italic text-amber-100 leading-relaxed">
                  "{panels[selectedItemIndex].quote}"
                </p>
              </div>

              {/* Sender Dedication */}
              <div className="flex items-center justify-between text-xs font-bold text-amber-300 px-1 font-serif">
                <span>Gửi: {config.recipientName || 'Em'}</span>
                <span>— {config.senderName || 'Anh'} 🌹</span>
              </div>

              {/* Modal Navigation Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    soundFx.playPinClick();
                    setSelectedItemIndex((prev) => (prev !== null ? (prev - 1 + 6) % 6 : 0));
                  }}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Ảnh trước
                </button>

                <button
                  onClick={() => {
                    soundFx.playPinClick();
                    setSelectedItemIndex((prev) => (prev !== null ? (prev + 1) % 6 : 0));
                  }}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  Ảnh sau <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Continue Rotating Button */}
              <button
                onClick={() => setSelectedItemIndex(null)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-stone-950 font-black text-xs shadow-lg hover:brightness-110 active:scale-98 transition-all"
              >
                Tiếp tục quay hộp nhạc
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
