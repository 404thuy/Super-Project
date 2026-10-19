import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    domeBg: 'from-cyan-400/20 via-sky-500/10 to-transparent',
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
    domeBg: 'from-purple-400/20 via-fuchsia-500/10 to-transparent',
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
    domeBg: 'from-rose-400/20 via-pink-500/10 to-transparent',
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
    domeBg: 'from-amber-400/20 via-yellow-500/10 to-transparent',
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
    domeBg: 'from-indigo-400/20 via-blue-500/10 to-transparent',
    ambientBg: 'from-black via-indigo-950/70 to-slate-950',
    cardBorder: 'border-indigo-400/80',
    cardGlow: 'shadow-[0_0_30px_rgba(99,102,241,0.4)]',
    baseWood: 'linear-gradient(90deg, #030612 0%, #09102b 16%, #121e4a 34%, #1c2d6b 50%, #121e4a 66%, #070c23 84%, #02040d 100%)',
    brassRing: 'from-indigo-300 via-sky-400 to-indigo-600',
    plaqueGrad: 'from-indigo-200 via-sky-300 to-indigo-400',
    accentText: 'text-indigo-300',
  },
};

// 6 Default High-Resolution Romantic Crystal Memory Images (sắc nét, lãng mạn)
const DEFAULT_MEMORY_IMAGES = [
  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80', // Nắm tay ngọt ngào
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80', // Hoa hồng pha lê lung linh
  'https://images.unsplash.com/photo-1513297887119-d46091b24bfa?w=600&auto=format&fit=crop&q=80', // Ánh đèn nến ấm áp
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&auto=format&fit=crop&q=80', // Khoảnh khắc yêu thương
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80', // Trái tim ánh sáng lấp lánh
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80', // Tinh thể pha lê lộng lẫy
];

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
                ? { duration: 1.8, repeat: Infinity, ease: 'linear' }
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
            <p className="text-[10.5px] sm:text-[11.5px] font-black font-serif text-amber-950 tracking-wider uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.85)] truncate">
              {title}
            </p>
            <div className="flex items-center gap-1 my-0.5 justify-center sm:justify-start">
              <span className="text-[7.5px] text-amber-900/70 font-serif">❦</span>
              <div className="h-[0.8px] flex-1 max-w-[65px] bg-gradient-to-r from-amber-800/40 to-transparent" />
            </div>
            <p className="text-[9.5px] sm:text-[10.5px] font-bold text-amber-900 font-serif italic truncate drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
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

/* ─── 3D OPTICAL CURVED STUDIO SOFTBOX GLASS REFLECTION (PHẢN CHIẾU CỬA SỔ CONG 3D) ─── */
function CurvedStudioGlassReflection() {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-t-[142px] sm:rounded-t-[168px]">
      {/* Studio Softbox Dual Light Bars curved along the spherical surface */}
      <svg
        viewBox="0 0 340 385"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
      >
        <defs>
          {/* Main softbox curved gradient */}
          <linearGradient id="softboxMain" x1="40" y1="20" x2="110" y2="330" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="25%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Secondary parallel softbox bar */}
          <linearGradient id="softboxSecondary" x1="65" y1="25" x2="125" y2="310" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Opposing bounce rim light */}
          <linearGradient id="bounceRim" x1="310" y1="35" x2="270" y2="330" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="30%" stopColor="#bae6fd" stopOpacity="0.2" />
            <stop offset="75%" stopColor="#7dd3fc" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Apical dome crest highlight */}
          <linearGradient id="apicalCrest" x1="90" y1="4" x2="250" y2="4" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Prismatic rainbow fringe filter */}
          <linearGradient id="rainbowFringe" x1="10" y1="10" x2="40" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#f472b6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* 1. Apical top curvature crest highlight */}
        <path
          d="M95 8 Q170 3 245 8"
          stroke="url(#apicalCrest)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="filter drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)]"
        />

        {/* 2. Prismatic outer dispersion fringe */}
        <path
          d="M22 170 C20 100 45 40 95 12"
          stroke="url(#rainbowFringe)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* 3. Primary Wide Curved Studio Softbox Window Reflection */}
        <path
          d="M60 22 C38 55 28 115 28 185 C28 250 36 295 45 335 C40 295 34 250 35 185 C36 120 46 65 68 28 Z"
          fill="url(#softboxMain)"
          className="filter blur-[0.8px]"
        />

        {/* 4. Secondary Parallel Studio Light Bar */}
        <path
          d="M78 28 C62 62 52 120 52 188 C52 245 58 290 66 328 C61 290 57 245 58 188 C59 125 68 70 84 34 Z"
          fill="url(#softboxSecondary)"
          className="filter blur-[0.6px]"
        />

        {/* 5. Opposing Right-Side Rim Bounce Refraction */}
        <path
          d="M280 28 C302 62 312 120 312 188 C312 248 306 295 296 335 C302 295 307 248 306 188 C305 125 295 70 274 34 Z"
          fill="url(#bounceRim)"
          className="filter blur-[0.8px]"
        />
      </svg>

      {/* Primary Diamond Specular Hotspot Glint on glass shoulder */}
      <div className="absolute top-8 left-12 flex items-center justify-center pointer-events-none">
        <div className="w-5 h-5 rounded-full bg-white/40 blur-[4px] animate-pulse" />
        <div className="absolute w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_#ffffff]" />
        {/* 4-point flare */}
        <div className="absolute w-9 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
        <div className="absolute h-9 w-[1px] bg-gradient-to-b from-transparent via-white to-transparent" />
      </div>

      {/* Secondary smaller glint */}
      <div className="absolute top-16 left-8 w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_6px_#ffffff]" />

      {/* Front Glass Curvature Convex Sheen Plate */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_35%_25%,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.03)_40%,transparent_70%)] pointer-events-none" />

      {/* Inner Cavity Spherical Ambient Occlusion (Bóng đổ sâu lòng kính 3D) */}
      <div className="absolute inset-0 rounded-t-[142px] sm:rounded-t-[168px] shadow-[inset_0_0_60px_rgba(0,0,0,0.7),inset_0_2px_18px_rgba(255,255,255,0.95)] pointer-events-none" />
    </div>
  );
}

/* ─── HIGH-END SCULPTED CRYSTAL ROSE (ĐÓA HỒNG PHA LÊ SWAROVSKI ĐA DIỆN 3D) ─── */
function SculptedCrystalRose({ isFocus = false }: { isFocus?: boolean }) {
  return (
    <div className={`relative flex flex-col items-center transition-transform duration-700 ${isFocus ? 'scale-125 -translate-y-2' : ''}`}>
      {/* Radiant Petal Core Glow */}
      <div className={`absolute top-2 w-28 h-28 rounded-full bg-rose-500/50 blur-2xl pointer-events-none transition-all duration-700 ${isFocus ? 'scale-150 opacity-90' : 'animate-pulse'}`} />

      {/* Sparkling Crystal Facets SVG */}
      <svg
        width="110"
        height="140"
        viewBox="0 0 100 135"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-[0_0_24px_rgba(244,63,94,0.95)] filter"
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
        <path d="M50 56 Q49 82 50 114" stroke="url(#crStem)" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M49 60 Q48.5 82 49 110" stroke="#ecfdf5" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />

        {/* Left Crystal Leaf */}
        <path d="M49 76 C35 70 22 80 18 85 C27 92 41 87 49 82 Z" fill="url(#crLeafL)" stroke="#d1fae5" strokeWidth="1.2" />
        <path d="M49 76 L25 85" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />

        {/* Right Crystal Leaf */}
        <path d="M51 84 C65 79 78 88 82 93 C73 100 59 95 51 90 Z" fill="url(#crLeafL)" stroke="#d1fae5" strokeWidth="1.2" />
        <path d="M51 84 L75 93" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />

        {/* Outer Rose Petals (Geometric Crystal Facets) */}
        <path
          d="M26 36 C22 49 34 63 50 65 C66 63 78 49 74 36 C69 25 58 30 50 33 C42 30 31 25 26 36 Z"
          fill="url(#crGlow)"
          stroke="#ffe4e6"
          strokeWidth="1.5"
        />

        {/* Left Outer Facet */}
        <path d="M28 35 C33 46 41 57 50 60 C43 51 36 43 28 35 Z" fill="url(#crFacetL)" stroke="#fff1f2" strokeWidth="1" />

        {/* Right Outer Facet */}
        <path d="M72 35 C67 46 59 57 50 60 C57 51 64 43 72 35 Z" fill="url(#crFacetR)" stroke="#fff1f2" strokeWidth="1" />

        {/* Center Petal Whirl */}
        <path d="M38 27 C38 16 62 16 62 27 C62 38 38 38 38 27 Z" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="1" />
        <path d="M42 25 C42 18 58 18 58 25 C58 32 42 32 42 25 Z" fill="#e11d48" />
        <path d="M46 23 C46 19 54 19 54 23 C54 27 46 27 46 23 Z" fill="#fff1f2" />

        {/* Diamond Glint Sparkles */}
        <polygon points="50,15 52,19 56,20 52,21 50,25 48,21 44,20 48,19" fill="#ffffff" opacity="0.95" />
        <polygon points="32,44 33,47 36,47 33,48 32,51 31,48 28,47 31,47" fill="#ffffff" opacity="0.9" />
        <polygon points="68,42 69,45 72,45 69,46 68,49 67,46 64,45 67,45" fill="#ffffff" opacity="0.9" />

        {/* Sculpted Golden Pedestal Base */}
        <ellipse cx="50" cy="116" rx="28" ry="6" fill="url(#crPedestal)" stroke="#fef08a" strokeWidth="1.2" />
        <ellipse cx="50" cy="122" rx="36" ry="8" fill="url(#crPedestal)" stroke="#fef08a" strokeWidth="1.4" />
        <ellipse cx="50" cy="125" rx="42" ry="9" fill="#2e1003" stroke="#ca8a04" strokeWidth="1" opacity="0.6" />
      </svg>
    </div>
  );
}

/* ─── SCULPTED TWIN SWANS (ĐÔI THIÊN NGA PHA LÊ) ─── */
function SculptedTwinSwans({ isFocus = false }: { isFocus?: boolean }) {
  return (
    <div className={`relative flex flex-col items-center transition-transform duration-700 ${isFocus ? 'scale-125 -translate-y-2' : ''}`}>
      <div className={`absolute top-4 w-28 h-28 rounded-full bg-cyan-400/40 blur-2xl pointer-events-none transition-all duration-700 ${isFocus ? 'scale-150 opacity-90' : 'animate-pulse'}`} />
      <svg width="115" height="115" viewBox="0 0 120 120" fill="none" className="relative z-10 filter drop-shadow-[0_0_20px_rgba(56,189,248,0.9)]">
        <defs>
          <linearGradient id="swanGrad" x1="0" y1="20" x2="60" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        <path d="M54 45 C48 30 34 26 26 36 C20 44 26 56 34 68 C42 80 52 86 54 88 C48 86 36 82 28 78 C20 74 16 66 18 56 C20 42 34 32 46 38 Z" fill="url(#swanGrad)" stroke="#e0f2fe" strokeWidth="1.4" />
        <path d="M66 45 C72 30 86 26 94 36 C100 44 94 56 86 68 C78 80 68 86 66 88 C72 86 84 82 92 78 C100 74 104 66 102 56 C100 42 86 32 74 38 Z" fill="url(#swanGrad)" stroke="#e0f2fe" strokeWidth="1.4" />
        <path d="M54 44 L60 48 L56 50 Z" fill="#f97316" />
        <path d="M66 44 L60 48 L64 50 Z" fill="#f97316" />
        <ellipse cx="60" cy="94" rx="45" ry="10" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="4 3" opacity="0.8" />
        <ellipse cx="60" cy="98" rx="35" ry="7" fill="#0284c7" fillOpacity="0.25" stroke="#bae6fd" strokeWidth="1" />
      </svg>
    </div>
  );
}

/* ─── SCULPTED DIAMOND HEART (TRÁI TIM KIM CƯƠNG) ─── */
function SculptedDiamondHeart({ isFocus = false }: { isFocus?: boolean }) {
  return (
    <div className={`relative flex flex-col items-center transition-transform duration-700 ${isFocus ? 'scale-125 -translate-y-2' : ''}`}>
      <div className={`absolute top-2 w-28 h-28 rounded-full bg-pink-500/50 blur-2xl pointer-events-none transition-all duration-700 ${isFocus ? 'scale-150 opacity-90' : 'animate-pulse'}`} />
      <svg width="110" height="110" viewBox="0 0 100 100" fill="none" className="relative z-10 filter drop-shadow-[0_0_24px_rgba(244,114,182,0.95)]">
        <defs>
          <linearGradient id="dhGrad" x1="10" y1="15" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff1f2" />
            <stop offset="35%" stopColor="#f472b6" />
            <stop offset="70%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#831843" />
          </linearGradient>
        </defs>
        <path d="M50 85 L20 48 C12 36 18 20 32 18 C40 17 46 22 50 28 C54 22 60 17 68 18 C82 20 88 36 80 48 Z" fill="url(#dhGrad)" stroke="#fbcfe8" strokeWidth="1.6" />
        <polygon points="50,28 32,18 50,42" fill="#ffffff" opacity="0.5" />
        <polygon points="50,28 68,18 50,42" fill="#f472b6" opacity="0.6" />
        <polygon points="50,42 20,48 50,85" fill="#be185d" opacity="0.7" />
        <polygon points="50,42 80,48 50,85" fill="#9d174d" opacity="0.8" />
        <polygon points="32,24 34,28 38,29 34,30 32,34 30,30 26,29 30,28" fill="#ffffff" />
      </svg>
    </div>
  );
}

export default function CrystalCarouselFX({ config }: Props) {
  // 3D Rotation Motions: angle around Y-axis & tilt around X-axis for natural desk-view perspective
  const carouselAngleMotion = useMotionValue(0);
  const carouselTiltMotion = useMotionValue(12); // Nghiêng nhẹ 12 độ tạo chiều sâu 3D sang trọng

  const [isPlayingBox, setIsPlayingBox] = useState(false);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [focusCenterpiece, setFocusCenterpiece] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  // Canvas ref for dynamic 60fps snow / blizzard particle physics
  const weatherCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Drag interaction state with momentum velocity tracking
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartAngle = useRef(0);
  const dragStartTilt = useRef(12);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const velocityX = useRef(0);

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
      const hasUserImage = userImages.length > 0 && userImages[i % userImages.length];
      const fallbackImage = DEFAULT_MEMORY_IMAGES[i % DEFAULT_MEMORY_IMAGES.length];
      return {
        id: i,
        indexStr: `0${i + 1}`,
        image: hasUserImage || fallbackImage,
        isCustom: !!hasUserImage,
        quote: customQuotes[i] || defaultQuotes[i % defaultQuotes.length],
      };
    });
  }, [userImages, customQuotes, defaultQuotes]);

  // Smooth Auto-spin via Framer Motion direct GPU compositor animation
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

  // Dynamic 60fps Snow / Blizzard Particle Engine on Canvas
  useEffect(() => {
    const canvas = weatherCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = canvas.width;
    const height = canvas.height;

    // Generate 42 3D particles with depth, spin and inertia
    const particleCount = 42;
    const pts = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: 0.3 + Math.random() * 0.7, // depth scale
      size: 1.5 + Math.random() * 3.5,
      speedY: 0.6 + Math.random() * 1.4,
      speedX: (Math.random() - 0.5) * 0.8,
      angle: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() - 0.5) * 0.04,
      opacity: 0.3 + Math.random() * 0.65,
    }));

    let blizzardTime = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Intensity increases dramatically when isShaking is active
      const isBlizzard = isShaking;
      if (isBlizzard) {
        blizzardTime += 0.06;
      } else {
        blizzardTime = Math.max(0, blizzardTime - 0.03);
      }

      pts.forEach((p) => {
        if (isBlizzard || blizzardTime > 0) {
          // Whirlwind vortex physics around the center of the globe
          const centerX = width / 2;
          const centerY = height / 2;
          const dx = p.x - centerX;
          const dy = p.y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const angle = Math.atan2(dy, dx);
          
          // Tangential whirlwind spin velocity + upward lift
          const spinForce = (4.5 + p.z * 3.5) * Math.min(1, blizzardTime + 0.5);
          p.x += -Math.sin(angle) * spinForce + (Math.random() - 0.5) * 2;
          p.y += Math.cos(angle) * (spinForce * 0.6) - (2.5 * p.z);

          // Keep inside dome bounds
          if (dist > width * 0.48) {
            p.x = centerX + Math.cos(angle) * (width * 0.45);
            p.y = centerY + Math.sin(angle) * (height * 0.45);
          }
        } else {
          // Gentle floating fall
          p.y += p.speedY * p.z;
          p.x += Math.sin(p.angle) * p.speedX;
          p.angle += p.spinSpeed;

          // Wrap around top/bottom
          if (p.y > height - 8) {
            p.y = 10;
            p.x = Math.random() * width;
          }
          if (p.x < 5) p.x = width - 10;
          if (p.x > width - 5) p.x = 10;
        }

        // Draw particle based on weather type
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.opacity;

        if (weatherType === 'petals') {
          // Soft pink rose petal
          ctx.fillStyle = '#fda4af';
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.8, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (weatherType === 'hearts') {
          // Tiny glowing pink heart
          ctx.fillStyle = '#f472b6';
          ctx.font = `${p.size * 2.8}px serif`;
          ctx.fillText('♥', -p.size, p.size);
        } else if (weatherType === 'notes') {
          // Golden musical note
          ctx.fillStyle = '#fef08a';
          ctx.font = `${p.size * 2.6}px sans-serif`;
          ctx.fillText('♪', -p.size, p.size);
        } else if (weatherType === 'sparkles') {
          // Golden 4-point sparkle star
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Crystal Ice Snow Flake: glowing radial white/cyan
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 1.5);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.5, '#e0f2fe');
          grad.addColorStop(1, 'rgba(224, 242, 254, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [weatherType, isShaking]);

  // Pointer & Drag handlers with Inertia Momentum Physics
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragStartAngle.current = carouselAngleMotion.get();
    dragStartTilt.current = carouselTiltMotion.get();
    lastX.current = e.clientX;
    lastTime.current = performance.now();
    velocityX.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - dragStartX.current;
    const deltaY = e.clientY - dragStartY.current;

    // Track velocity for inertia
    const now = performance.now();
    const dt = now - lastTime.current;
    if (dt > 10) {
      velocityX.current = (e.clientX - lastX.current) / dt;
      lastX.current = e.clientX;
      lastTime.current = now;
    }

    // Update 3D Angle and Tilt
    carouselAngleMotion.set(dragStartAngle.current + deltaX * 0.65);
    const newTilt = Math.max(2, Math.min(26, dragStartTilt.current - deltaY * 0.15));
    carouselTiltMotion.set(newTilt);
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    // Apply smooth inertia fling if released while dragging fast
    if (Math.abs(velocityX.current) > 0.25) {
      const inertiaDelta = velocityX.current * 280;
      animate(carouselAngleMotion, carouselAngleMotion.get() + inertiaDelta, {
        duration: 1.1,
        ease: [0.16, 1, 0.3, 1],
      });
    }
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
      }, 200);
      setIsPlayingBox(true);
    }
  };

  const handleShakeGlobe = () => {
    soundFx.playSuccessChime();
    setIsShaking(true);
    animate(carouselAngleMotion, carouselAngleMotion.get() + 360, {
      duration: 2.4,
      ease: 'easeInOut',
    });
    setTimeout(() => {
      setIsShaking(false);
    }, 2800);
  };

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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[550px] h-[380px] sm:h-[550px] rounded-full blur-[100px] pointer-events-none opacity-50 transition-all duration-700"
        style={{ background: theme.glowColor }}
      />

      {/* Main Interactive Music Box Stage */}
      <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-2.5 w-full max-w-md py-1 sm:py-0">
        
        {/* Top Control Chips: Shake & Focus Mode */}
        <div className="flex items-center gap-1.5 sm:gap-2 z-20">
          <button
            onClick={handleShakeGlobe}
            className="px-3 sm:px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white text-[11px] font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
            title="Lắc quả cầu để bùng nổ bão tuyết lấp lánh"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
            <span>Lắc Quả Cầu</span>
          </button>

          <button
            onClick={() => setFocusCenterpiece(!focusCenterpiece)}
            className={`px-3 sm:px-3.5 py-1.5 rounded-full border text-[11px] font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer ${
              focusCenterpiece
                ? 'bg-rose-500/40 border-rose-400 text-rose-100 ring-2 ring-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                : 'bg-white/10 hover:bg-white/20 border-white/30 text-slate-100'
            }`}
            title="Tập trung ngắm đóa hoa pha lê trung tâm"
          >
            <Eye className="w-3.5 h-3.5 text-rose-400" />
            <span>{focusCenterpiece ? '🌹 Đang Ngắm Hoa' : 'Ngắm Đóa Hồng'}</span>
          </button>

          <button
            onClick={() => setIsAutoSpinning(!isAutoSpinning)}
            className={`px-3 sm:px-3.5 py-1.5 rounded-full border text-[11px] font-bold backdrop-blur-md flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer ${
              isAutoSpinning
                ? 'bg-cyan-500/40 border-cyan-400 text-cyan-100 ring-1 ring-cyan-400/40'
                : 'bg-white/10 hover:bg-white/20 border-white/30 text-slate-100'
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
                    x: [-10, 10, -7, 7, -3, 3, 0],
                    rotate: [-3.5, 3.5, -2, 2, 0],
                  }
                : {}
            }
            transition={{ duration: 0.8 }}
            className={`relative w-[285px] sm:w-[335px] h-[340px] sm:h-[385px] rounded-t-[142px] sm:rounded-t-[168px] rounded-b-none bg-gradient-to-b ${theme.domeBg} border-[2.5px] border-b-0 border-white/75 shadow-[0_22px_50px_rgba(0,0,0,0.92),inset_0_2px_16px_rgba(255,255,255,0.95),inset_8px_0_24px_rgba(255,255,255,0.35),inset_-8px_0_24px_rgba(255,255,255,0.25),0_0_55px_${theme.glowHex}35] overflow-hidden flex flex-col items-center justify-between p-2 sm:p-2.5`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
          >
            {/* 1. LỚP THÀNH KÍNH ĐÔI 4MM (Inner Glass Wall Thickness) */}
            <div className="absolute inset-[3.5px] rounded-t-[138px] sm:rounded-t-[164px] border-[1.5px] border-b-0 border-white/35 pointer-events-none z-25" />

            {/* 2. HIỆU ỨNG THẤU KÍNH QUANG HỌC PHẢN CHIẾU CỬA SỔ STUDIO CONG 3D */}
            <CurvedStudioGlassReflection />

            {/* 3. Dynamic 60fps Particle Canvas (Tuyết rơi / bão tuyết trong lòng kính) */}
            <canvas
              ref={weatherCanvasRef}
              width={340}
              height={390}
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
            />

            {/* 4. Internal Warm Stage LED Uplight Spotlight (Đèn hắt đáy từ mâm máy lên) */}
            <div className="absolute bottom-0 inset-x-0 h-40 bg-[radial-gradient(ellipse_at_bottom,rgba(251,191,36,0.38)_0%,rgba(56,189,248,0.15)_45%,transparent_75%)] pointer-events-none" />

            {/* 5. Frosted base mist at bottom of the globe */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white/28 via-white/10 to-transparent pointer-events-none backdrop-blur-[1px]" />

            {/* 6. GỜ CHÂN KÍNH THỦY TINH ĐÚC DÀY 3D TIẾP XÚC BỆ ĐỒNG (Glass Meniscus Lip) */}
            <div className="absolute bottom-0 inset-x-0 h-2.5 bg-gradient-to-r from-white/35 via-white/85 via-50% to-white/35 pointer-events-none shadow-[0_-1px_4px_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.8)] z-35 border-t border-white/60" />

            {/* Musical Notes Floating Up when music box is playing */}
            {isPlayingBox &&
              Array.from({ length: 7 }).map((_, i) => (
                <motion.div
                  key={`note-${i}`}
                  className="absolute text-yellow-300 font-bold pointer-events-none z-30 text-sm sm:text-base drop-shadow-[0_0_6px_rgba(250,204,21,0.9)]"
                  style={{
                    left: `${24 + i * 9}%`,
                    bottom: '28px',
                  }}
                  initial={{ y: 0, opacity: 0, scale: 0.5 }}
                  animate={{
                    y: -300,
                    opacity: [0, 1, 1, 0],
                    scale: [0.6, 1.4, 1],
                    x: [0, (i % 2 === 0 ? 1 : -1) * 28, 0],
                  }}
                  transition={{
                    duration: 3.5 + i * 0.35,
                    repeat: Infinity,
                    delay: i * 0.45,
                    ease: 'easeOut',
                  }}
                >
                  {['♪', '♫', '♬', '✨', '♪', '♫', '✦'][i]}
                </motion.div>
              ))}

            {/* ─── 3D CAROUSEL STAGE WITH REALISTIC DEPTH & CENTERPIECE ─── */}
            <div
              className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing z-10 pt-6 pb-4"
              style={{ perspective: '1200px' }}
            >
              {/* The Unified 3D Coordinate System (Driven directly by GPU Compositor with X-tilt and Y-rotation) */}
              <motion.div
                style={{
                  rotateY: carouselAngleMotion,
                  rotateX: carouselTiltMotion,
                  transformStyle: 'preserve-3d',
                }}
                className="relative w-20 sm:w-22 h-32 sm:h-36 flex items-center justify-center"
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
                    className="absolute -bottom-2 w-36 h-36 rounded-full border-2 border-amber-300/80 bg-gradient-to-b from-amber-300/35 via-yellow-400/20 to-transparent flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.45)]"
                    style={{ transform: 'rotateX(75deg)' }}
                  >
                    <div className="w-full h-full rounded-full border border-dashed border-amber-300/60 flex items-center justify-center">
                      <span className="text-[8px] font-mono text-amber-200/80 tracking-widest uppercase">
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
                    {centerpieceType === 'rose' && <SculptedCrystalRose isFocus={focusCenterpiece} />}
                    {centerpieceType === 'swans' && <SculptedTwinSwans isFocus={focusCenterpiece} />}
                    {centerpieceType === 'heart' && <SculptedDiamondHeart isFocus={focusCenterpiece} />}
                    {centerpieceType === 'castle' && (
                      <div className="text-5xl filter drop-shadow-[0_0_25px_rgba(251,191,36,0.9)] animate-pulse">
                        🏰
                      </div>
                    )}
                    {centerpieceType === 'teddy' && (
                      <div className="text-5xl filter drop-shadow-[0_0_25px_rgba(168,85,247,0.9)] animate-pulse">
                        🧸
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* ── 2. THE 6 GILDED CRYSTAL CAROUSEL PANELS ── */}
                {panels.map((panel, idx) => {
                  const angle = idx * 60; // 360 / 6 = 60 deg
                  const orbitRadius = focusCenterpiece ? 150 : 124;
                  const depthScale = focusCenterpiece ? 0.72 : 1;
                  const depthOpacity = focusCenterpiece ? 0.22 : 1;

                  return (
                    <div
                      key={panel.id}
                      className="absolute inset-0"
                      style={{
                        transform: `rotateY(${angle}deg) translateZ(${orbitRadius}px) scale(${depthScale})`,
                        transformStyle: 'preserve-3d',
                        opacity: depthOpacity,
                        transition: 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      {/* FRONT FACE: Gilded Vintage Crystal Slide */}
                      <div
                        onClick={() => {
                          soundFx.playPinClick();
                          setSelectedItemIndex(panel.id);
                        }}
                        className={`absolute inset-0 rounded-2xl p-1.5 bg-[#0a0f1d] border-2 border-amber-300/90 shadow-[0_12px_35px_rgba(0,0,0,0.95)] ring-1 ring-amber-400/60 flex flex-col items-center justify-between cursor-pointer hover:border-white hover:scale-105 transition-all group overflow-hidden`}
                        style={{
                          transform: 'translateZ(1.5px)',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                        }}
                      >
                        {/* Baroque corner accents */}
                        <span className="absolute top-1 left-1.5 text-amber-300 text-[8px] pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">❖</span>
                        <span className="absolute top-1 right-1.5 text-amber-300 text-[8px] pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">❖</span>

                        {/* Header Badge */}
                        <div className="w-full flex items-center justify-between text-[8px] font-mono font-bold text-amber-200 px-1 border-b border-amber-400/35 pb-0.5">
                          <span className="text-amber-300 font-black">#{panel.indexStr}</span>
                          <span className="text-[7px] text-amber-300 font-serif tracking-widest uppercase">KỶ NIỆM</span>
                        </div>

                        {/* High-Resolution Memory Image */}
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black/60 border border-amber-300/60 shadow-inner group-hover:border-amber-200 transition-colors">
                          <img
                            src={panel.image}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="eager"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-1">
                            <span className="text-[8px] font-bold text-white flex items-center gap-1 drop-shadow-md">
                              <Maximize2 className="w-2.5 h-2.5 text-amber-300" /> Xem ảnh
                            </span>
                          </div>
                        </div>

                        {/* Romantic Quote Plaque */}
                        <div className="w-full bg-black/80 rounded-lg p-1 border border-amber-400/35 shadow-xs">
                          <p className="text-[7.5px] sm:text-[8.5px] font-medium font-serif italic text-amber-100/95 text-center line-clamp-2 leading-tight">
                            "{panel.quote}"
                          </p>
                        </div>

                        {/* Shimmer Light Reflection Sweep */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none opacity-40" />
                      </div>

                      {/* BACK FACE: Royal Damask Gold Foil Crest */}
                      <div
                        className="absolute inset-0 rounded-2xl p-2 bg-gradient-to-b from-[#151d36] via-[#090e1f] to-[#151d36] border-2 border-amber-400/85 shadow-[0_12px_35px_rgba(0,0,0,0.95)] ring-1 ring-amber-400/50 flex flex-col items-center justify-center text-center"
                        style={{
                          transform: 'rotateY(180deg) translateZ(1.5px)',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                        }}
                      >
                        <div className="w-8 h-8 rounded-full border border-amber-300/70 bg-amber-400/15 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(251,191,36,0.35)] mb-1">
                          ⚜️
                        </div>
                        <p className="text-[8.5px] font-serif font-black tracking-widest text-amber-200">
                          ROYAL
                        </p>
                        <p className="text-[6.5px] text-amber-400/80 font-mono tracking-wider">
                          MUSIC BOX 3D
                        </p>
                        <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent my-1" />
                        <span className="text-[9px] text-rose-300">🌹</span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Bottom Prompt Badge inside dome */}
            <div className="relative z-25 text-[9.5px] text-white/90 font-medium flex items-center gap-1.5 bg-black/65 px-3 py-0.5 rounded-full border border-white/20 backdrop-blur-xs shadow-md">
              <span>👆 Vuốt ngang xoay 360° • Chạm ảnh xem kỷ niệm</span>
            </div>
          </motion.div>
        </div>

        {/* ─── LUXURY 3D MULTI-TIERED MAHOGANY WOODEN & BRASS PEDESTAL (BỆ ĐẾ HOÀNG GIA ĐA TẦNG 3D) ─── */}
        <div className="relative w-full max-w-[295px] sm:max-w-[345px] flex flex-col items-center z-20">
          
          {/* TIER 1: Heavy Beveled Brass Dome Retaining Collar (Vành cổ đồng giữ kính) */}
          <div className="w-[285px] sm:w-[335px] h-2.5 sm:h-3 bg-gradient-to-r from-amber-700 via-amber-300 via-yellow-100 via-amber-400 to-amber-800 rounded-t-lg border-t border-yellow-100/90 shadow-[0_3px_8px_rgba(0,0,0,0.85)] flex items-center justify-around px-3 relative overflow-hidden">
            {/* Cylindrical shine highlight streak */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_20%,rgba(255,255,255,0.45)_45%,transparent_65%)] pointer-events-none" />
            
            {/* 3D Beaded pearl rivets along the rim */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-gradient-to-b from-yellow-100 via-amber-400 to-amber-950 border border-yellow-200/80 shadow-xs shrink-0"
              />
            ))}
          </div>

          {/* TIER 2: Upper Stepped Wood Moulding Profile (Phào chỉ gỗ trên vát cong 3D) */}
          <div
            className="w-[292px] sm:w-[342px] h-2 rounded-t-md border-t border-amber-500/40 shadow-inner relative"
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
                className="group relative focus:outline-none cursor-pointer"
                title={isPlayingBox ? 'Dừng phát nhạc' : 'Vặn dây cót để phát nhạc'}
              >
                <ButterflyWindingKey isPlaying={isPlayingBox} />
              </button>

              {/* Status Indicator Badge */}
              <button
                onClick={handleTogglePlayBox}
                className={`px-2.5 py-0.5 rounded-full font-serif text-[9px] font-black tracking-wider uppercase flex items-center gap-1 border shadow-md active:scale-95 transition-all cursor-pointer ${
                  isPlayingBox
                    ? 'bg-rose-950/85 border-rose-400 text-rose-200 ring-1 ring-rose-400/50'
                    : 'bg-amber-950/85 border-amber-400 text-amber-200 hover:bg-amber-900/80 ring-1 ring-amber-400/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isPlayingBox ? 'bg-rose-400 animate-ping' : 'bg-amber-400'}`} />
                <span>{isPlayingBox ? 'Đang Phát' : 'Vặn Cót'}</span>
              </button>
            </div>
          </div>

          {/* TIER 4: Lower Stepped Wood Moulding & Inlaid Brass Trim (Phào chỉ đế dưới & chỉ đồng) */}
          <div className="w-[290px] sm:w-[340px] h-1.5 bg-gradient-to-r from-amber-700 via-yellow-300 via-amber-200 to-amber-800 shadow-sm border-t border-yellow-100/70" />
          
          <div
            className="w-[294px] sm:w-[344px] h-2.5 rounded-b-lg border-b border-amber-900/80 shadow-md relative"
            style={{ background: theme.baseWood }}
          />

          {/* TIER 5: 4 Sculpted Spherical Brass Feet (4 Chân đế quả cầu đồng hoàng gia) */}
          <div className="w-[276px] sm:w-[324px] flex items-center justify-between px-2 -mt-0.5">
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
            className="px-3.5 py-1.5 rounded-xl bg-slate-900/85 border border-white/20 text-white hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold flex items-center gap-1 shadow-md hover:border-amber-400 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Xoay Trái</span>
          </button>

          <button
            onClick={handleTogglePlayBox}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/85 border border-white/20 text-white hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold flex items-center justify-center shadow-md hover:border-emerald-400 cursor-pointer"
            title={isPlayingBox ? 'Tạm dừng nhạc' : 'Phát nhạc nền'}
          >
            {isPlayingBox ? <Pause className="w-4 h-4 text-rose-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleRotateRight}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900/85 border border-white/20 text-white hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold flex items-center gap-1 shadow-md hover:border-amber-400 cursor-pointer"
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
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Memory Index Header */}
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-xs font-mono font-bold text-amber-300">
                  ✦ Kỷ Niệm 0{selectedItemIndex + 1} / 06 ✦
                </span>
              </div>

              {/* High-Resolution Photo */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-amber-300/80 shadow-2xl relative bg-black">
                <img
                  src={panels[selectedItemIndex].image}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Romantic Quote */}
              <div className="bg-black/60 rounded-2xl p-3.5 border border-amber-400/35">
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
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Ảnh trước
                </button>

                <button
                  onClick={() => {
                    soundFx.playPinClick();
                    setSelectedItemIndex((prev) => (prev !== null ? (prev + 1) % 6 : 0));
                  }}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  Ảnh sau <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Continue Rotating Button */}
              <button
                onClick={() => setSelectedItemIndex(null)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-stone-950 font-black text-xs shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer"
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
