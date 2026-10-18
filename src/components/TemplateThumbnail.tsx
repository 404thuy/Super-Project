/**
 * TemplateThumbnail – Rich CSS/SVG live preview of each card template.
 * Each thumbnail is a self-contained mini-scene matching the actual effect.
 */
import type { EffectType } from '../types';

interface Props {
  effectType: EffectType;
  className?: string;
}

/* ─── shared CSS keyframe injector (injected once into <head>) ────────────── */
const CSS = `
@keyframes tth-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes tth-pulse-glow { 0%,100%{opacity:.4} 50%{opacity:1} }
@keyframes tth-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes tth-spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes tth-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes tth-fall { 0%{transform:translateY(-10%) rotate(0deg);opacity:1} 100%{transform:translateY(110%) rotate(360deg);opacity:0} }
@keyframes tth-blink { 0%,100%{opacity:.15} 50%{opacity:.9} }
@keyframes tth-wave { 0%,100%{transform:scaleY(0.4)} 50%{transform:scaleY(1)} }
@keyframes tth-ping { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.2);opacity:0} }
@keyframes tth-drift { 0%{transform:translate(0,0) rotate(0deg)} 33%{transform:translate(6px,-4px) rotate(8deg)} 66%{transform:translate(-4px,6px) rotate(-5deg)} 100%{transform:translate(0,0) rotate(0deg)} }
@keyframes tth-flicker { 0%,100%{opacity:.9} 45%{opacity:.6} 55%{opacity:1} }
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = CSS;
  document.head.appendChild(el);
  cssInjected = true;
}

/* ─── 1. Passcode Envelope ─────────────────────────────────────────────── */
function PasscodeEnvelopeThumb() {
  injectCSS();
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(145deg,#1a0010 0%,#3b0024 40%,#6d1040 80%,#2d0018 100%)' }}>
      {/* Star field */}
      {[...Array(22)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{ width: 1 + (i % 3) * 0.5, height: 1 + (i % 3) * 0.5, left: `${(i * 23 + 7) % 96}%`, top: `${(i * 17 + 5) % 92}%`, opacity: 0.15 + (i % 5) * 0.12, animation: `tth-blink ${2 + (i % 4) * 0.7}s ease-in-out infinite`, animationDelay: `${i * 0.18}s` }} />
      ))}
      {/* Envelope body */}
      <div className="relative flex flex-col items-center" style={{ animation: 'tth-float 4s ease-in-out infinite' }}>
        {/* Envelope */}
        <div className="relative w-28 h-20 rounded-xl shadow-2xl"
          style={{ background: 'linear-gradient(160deg,#fff0f6 0%,#ffd6e7 50%,#ffc0d9 100%)', boxShadow: '0 8px 32px rgba(219,39,119,0.45), 0 0 0 1px rgba(251,113,133,0.3)' }}>
          {/* Envelope flap top triangle */}
          <div className="absolute top-0 left-0 right-0 h-10 overflow-hidden rounded-t-xl">
            <div style={{ width: 0, height: 0, borderLeft: '56px solid transparent', borderRight: '56px solid transparent', borderTop: '40px solid rgba(251,113,133,0.35)', position: 'absolute', top: 0, left: 0 }} />
          </div>
          {/* Bottom left/right triangles */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between">
            <div style={{ width: 0, height: 0, borderLeft: '42px solid rgba(244,63,94,0.18)', borderTop: '36px solid transparent' }} />
            <div style={{ width: 0, height: 0, borderRight: '42px solid rgba(244,63,94,0.18)', borderTop: '36px solid transparent' }} />
          </div>
          {/* Wax seal */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg,#be123c,#9f1239)', boxShadow: '0 4px 12px rgba(190,18,60,0.6), 0 0 0 2px rgba(255,255,255,0.2)' }}>
            💌
          </div>
          {/* PIN dots row */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {[0,1,2,3].map(i => (
              <div key={i} className="w-2.5 h-2.5 rounded-full border-2"
                style={{ borderColor: '#fb7185', background: i < 2 ? 'linear-gradient(135deg,#fb7185,#e11d48)' : 'transparent', boxShadow: i < 2 ? '0 0 6px rgba(251,113,133,0.8)' : 'none' }} />
            ))}
          </div>
        </div>
        <p className="mt-3 text-pink-300 font-bold tracking-wide" style={{ fontSize: 9, textShadow: '0 0 8px rgba(251,113,133,0.8)' }}>Nhập mật mã để mở ✨</p>
      </div>
      {/* Floating hearts */}
      {['20%','75%','45%'].map((l, i) => (
        <div key={i} className="absolute text-pink-400" style={{ left: l, top: `${20 + i * 25}%`, fontSize: 10 + i * 3, opacity: 0.5 + i * 0.15, animation: `tth-float ${3 + i}s ease-in-out infinite`, animationDelay: `${i * 0.8}s` }}>
          {['💕','🌹','✨'][i]}
        </div>
      ))}
    </div>
  );
}

/* ─── 2. Galaxy 3D ─────────────────────────────────────────────────────── */
function GalaxyThumb() {
  injectCSS();
  return (
    <div className="w-full h-full relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 35% 40%,#1e1b4b 0%,#0f0a1e 55%,#000510 100%)' }}>
      {/* Dense star field */}
      {[...Array(35)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{ width: i % 5 === 0 ? 2 : 1, height: i % 5 === 0 ? 2 : 1, left: `${(i * 19 + 3) % 97}%`, top: `${(i * 11 + 7) % 95}%`, opacity: 0.2 + (i % 6) * 0.12, animation: `tth-blink ${1.5 + (i % 5) * 0.8}s ease-in-out infinite`, animationDelay: `${i * 0.12}s` }} />
      ))}
      {/* Galaxy nebula glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 120, height: 80, background: 'radial-gradient(ellipse,rgba(139,92,246,0.55) 0%,rgba(99,102,241,0.3) 40%,transparent 70%)', filter: 'blur(10px)', animation: 'tth-pulse-glow 3s ease-in-out infinite' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 60, height: 40, background: 'radial-gradient(ellipse,rgba(196,181,253,0.7) 0%,transparent 70%)', filter: 'blur(4px)' }} />
      {/* Spinning galaxy arms */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: 90, height: 90, animation: 'tth-spin-slow 12s linear infinite' }}>
        {[0,45,90,135].map(deg => (
          <div key={deg} className="absolute top-1/2 left-1/2 h-px origin-left rounded-full"
            style={{ width: 44, background: `linear-gradient(90deg,rgba(167,139,250,0.8),transparent)`, transform: `rotate(${deg}deg)`, marginTop: -0.5 }} />
        ))}
      </div>
      {/* Crystal memory cubes */}
      {[{l:'18%',t:'22%',em:'🔮'},{l:'68%',t:'18%',em:'💎'},{l:'28%',t:'68%',em:'⭐'},{l:'74%',t:'64%',em:'🌟'}].map(({l,t,em},i)=>(
        <div key={i} className="absolute w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ left:l, top:t, fontSize:13, background:'rgba(139,92,246,0.2)', backdropFilter:'blur(6px)', border:'1px solid rgba(196,181,253,0.35)', boxShadow:'0 0 10px rgba(139,92,246,0.3)', animation:`tth-float ${3+i*0.7}s ease-in-out infinite`, animationDelay:`${i*0.5}s` }}>
          {em}
        </div>
      ))}
      {/* Center star */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl z-10"
        style={{ animation: 'tth-pulse-glow 2s ease-in-out infinite', textShadow: '0 0 20px rgba(196,181,253,0.9)' }}>✨</div>
    </div>
  );
}

/* ─── 3. Blossom Petal Rain ─────────────────────────────────────────────── */
function BlossomThumb() {
  injectCSS();
  const petals = [
    {l:'8%',t:'-5%',d:'0s',s:18},{l:'25%',t:'-10%',d:'0.4s',s:14},{l:'45%',t:'-3%',d:'0.8s',s:20},
    {l:'62%',t:'-8%',d:'0.3s',s:16},{l:'78%',t:'-5%',d:'1.1s',s:12},{l:'90%',t:'-10%',d:'0.6s',s:18},
    {l:'15%',t:'30%',d:'1.5s',s:14},{l:'55%',t:'40%',d:'0.9s',s:16},{l:'82%',t:'25%',d:'1.8s',s:12},
  ];
  return (
    <div className="w-full h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg,#fff1f8 0%,#fce7f3 30%,#fbcfe8 65%,#fda4af 100%)' }}>
      {/* Soft vignette bottom */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 100%,rgba(253,164,175,0.5) 0%,transparent 65%)' }} />
      {/* Water shimmer at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-14 rounded-b-xl"
        style={{ background: 'linear-gradient(180deg,transparent,rgba(186,230,253,0.3))', backdropFilter: 'blur(2px)' }} />
      {/* Falling petals */}
      {petals.map((p, i) => (
        <div key={i} className="absolute"
          style={{ left:p.l, top:p.t, fontSize:p.s, animation:`tth-fall ${3.5+i*0.4}s ease-in infinite`, animationDelay:p.d }}>
          {i%3===0?'🌸':i%3===1?'🌺':'🌷'}
        </div>
      ))}
      {/* Glass card frame */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-28 rounded-2xl overflow-hidden shadow-xl"
        style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(244,114,182,0.35)', boxShadow: '0 8px 24px rgba(244,114,182,0.25)' }}>
        <div className="p-2 text-center">
          <p style={{ fontSize: 7, fontWeight: 800, color: '#be185d', letterSpacing: '0.08em' }}>✿ GỬI EM 20/10 ✿</p>
          <div className="flex gap-1 justify-center mt-1">
            {[0,1,2].map(i=><div key={i} className="w-5 h-4 rounded bg-pink-100 border border-pink-200" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 4. Vinyl Player ──────────────────────────────────────────────────── */
function VinylThumb() {
  injectCSS();
  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center"
      style={{ background: 'linear-gradient(145deg,#0c0a09 0%,#1c1410 50%,#0a0704 100%)' }}>
      {/* Warm wood texture lines */}
      {[20,35,50,65,80].map(t=>(
        <div key={t} className="absolute left-0 right-0 h-px" style={{ top:`${t}%`, background:'rgba(120,53,15,0.15)' }} />
      ))}
      {/* Turntable base */}
      <div className="absolute bottom-0 left-0 right-0 h-10 rounded-b-xl" style={{ background:'linear-gradient(180deg,rgba(28,20,16,0),rgba(41,28,18,0.9))' }} />
      {/* Vinyl disk */}
      <div className="relative z-10" style={{ animation:'tth-spin 8s linear infinite' }}>
        <div className="w-24 h-24 rounded-full shadow-2xl relative"
          style={{ background:'radial-gradient(circle,#1c1917 0%,#0a0a0a 30%,#2d2520 50%,#1a1311 65%,#0c0a09 80%,#1c1917 100%)', boxShadow:'0 8px 32px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(245,158,11,0.2)' }}>
          {/* Groove rings */}
          {[36,28,20,14,8].map(r=>(
            <div key={r} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ width:r*2, height:r*2, border:'0.5px solid rgba(245,158,11,0.12)' }} />
          ))}
          {/* Center label */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-base"
            style={{ background:'linear-gradient(135deg,#d97706,#f59e0b,#b45309)', boxShadow:'0 0 12px rgba(245,158,11,0.5), 0 0 0 1.5px rgba(255,255,255,0.15)' }}>
            🎵
          </div>
        </div>
      </div>
      {/* Tonearm */}
      <div className="absolute right-6 top-5 z-20"
        style={{ width: 3, height: 40, background: 'linear-gradient(180deg,#d4a017,#92400e)', borderRadius: 4, transformOrigin: 'top center', transform: 'rotate(28deg)', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }} />
      {/* Needle tip glow */}
      <div className="absolute z-20 w-2 h-2 rounded-full"
        style={{ right:'23%', top:'52%', background:'rgba(245,158,11,0.8)', boxShadow:'0 0 6px rgba(245,158,11,0.9)', animation:'tth-pulse-glow 2s ease-in-out infinite' }} />
      <p className="absolute bottom-2 text-amber-400 font-bold tracking-wide z-30" style={{ fontSize:8, textShadow:'0 0 8px rgba(245,158,11,0.6)' }}>🎵 Đĩa Hát Kỷ Niệm</p>
    </div>
  );
}

/* ─── 5. Scratch Card ──────────────────────────────────────────────────── */
function ScratchCardThumb() {
  injectCSS();
  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center"
      style={{ background: 'linear-gradient(145deg,#451a03 0%,#78350f 40%,#92400e 70%,#451a03 100%)' }}>
      {/* Gold sparkle dust */}
      {[...Array(14)].map((_, i) => (
        <div key={i} className="absolute text-yellow-300"
          style={{ left:`${(i*21+6)%92}%`, top:`${(i*17+8)%88}%`, fontSize:6+i%5, opacity:0.5+i%3*0.2, animation:`tth-pulse-glow ${1.5+i%3*0.6}s ease-in-out infinite`, animationDelay:`${i*0.15}s` }}>
          {['✦','✧','⋆','·'][i%4]}
        </div>
      ))}
      {/* Scratch card frame */}
      <div className="relative w-28 h-20 rounded-2xl overflow-hidden shadow-2xl"
        style={{ border:'2px solid rgba(245,158,11,0.5)', boxShadow:'0 12px 40px rgba(0,0,0,0.5), 0 0 20px rgba(245,158,11,0.2)' }}>
        {/* Hidden gift below */}
        <div className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background:'linear-gradient(135deg,#fffbeb,#fef3c7,#fde68a)' }}>
          <span style={{ fontSize: 24 }}>🎁</span>
          <p style={{ fontSize: 7, fontWeight: 800, color: '#92400e', marginTop: 2 }}>BẤT NGỜ!</p>
        </div>
        {/* Metallic foil – right 65% still covered */}
        <div className="absolute inset-0 overflow-hidden"
          style={{ clipPath: 'polygon(35% 0%, 100% 0%, 100% 100%, 35% 100%)' }}>
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(120deg,#b8960c 0%,#e8d48b 20%,#c0c0c0 35%,#f8f0a0 50%,#c0c0c0 65%,#e8d48b 80%,#b8960c 100%)', backgroundSize:'200% 100%', animation:'tth-shimmer 2.5s linear infinite' }} />
        </div>
        {/* Scratch reveal edge with sparkle */}
        <div className="absolute top-0 bottom-0 w-1"
          style={{ left:'35%', background:'linear-gradient(180deg,rgba(255,215,0,0.9),rgba(255,255,255,0.6),rgba(255,215,0,0.9))', boxShadow:'0 0 8px rgba(255,215,0,0.8)' }} />
      </div>
      <p className="absolute bottom-2 text-yellow-400 font-bold" style={{ fontSize:8, textShadow:'0 0 6px rgba(245,158,11,0.7)' }}>✨ Cào nhẹ để khám phá</p>
    </div>
  );
}

/* ─── 6. Lantern Festival ──────────────────────────────────────────────── */
function LanternThumb() {
  injectCSS();
  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 30%,#431407 0%,#1c0a00 50%,#080400 100%)' }}>
      {/* Stars */}
      {[...Array(18)].map((_,i)=>(
        <div key={i} className="absolute rounded-full bg-amber-100"
          style={{ width:1+(i%2), height:1+(i%2), left:`${(i*23+10)%90}%`, top:`${(i*17+5)%75}%`, opacity:0.2+i%4*0.15, animation:`tth-blink ${2+i%3*0.8}s ease-in-out infinite`, animationDelay:`${i*0.2}s` }} />
      ))}
      {/* Lantern glow halo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width:110, height:110, background:'radial-gradient(circle,rgba(251,146,60,0.35) 0%,rgba(234,88,12,0.2) 40%,transparent 70%)', filter:'blur(12px)', animation:'tth-pulse-glow 2.5s ease-in-out infinite' }} />
      {/* Main lantern */}
      <div className="relative z-10 flex flex-col items-center" style={{ animation:'tth-float 3.5s ease-in-out infinite' }}>
        {/* Hanging string */}
        <div className="w-px h-5" style={{ background:'linear-gradient(180deg,rgba(120,53,15,0.5),rgba(251,146,60,0.7))' }} />
        {/* Top ring */}
        <div className="w-10 h-2 rounded-full mb-0.5"
          style={{ background:'linear-gradient(90deg,#b45309,#f97316,#b45309)', boxShadow:'0 2px 6px rgba(249,115,22,0.4)' }} />
        {/* Lantern body */}
        <div className="w-16 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
          style={{ background:'linear-gradient(160deg,rgba(253,186,116,0.95) 0%,rgba(249,115,22,0.9) 50%,rgba(234,88,12,0.95) 100%)', boxShadow:'0 0 30px rgba(251,146,60,0.7), 0 0 60px rgba(234,88,12,0.3), inset 0 0 20px rgba(255,200,100,0.3)', border:'1.5px solid rgba(253,186,116,0.6)' }}>
          {/* Lattice lines */}
          <div className="absolute inset-1 rounded-xl overflow-hidden opacity-20">
            {[25,50,75].map(pct=>(
              <div key={pct} className="absolute top-0 bottom-0 w-px bg-orange-900" style={{ left:`${pct}%` }} />
            ))}
          </div>
          <span style={{ fontSize: 28, filter:'drop-shadow(0 0 6px rgba(255,150,50,0.8))' }}>🏮</span>
        </div>
        {/* Bottom ring */}
        <div className="w-10 h-2 rounded-full mt-0.5"
          style={{ background:'linear-gradient(90deg,#b45309,#f97316,#b45309)', boxShadow:'0 -2px 6px rgba(249,115,22,0.4)' }} />
        {/* Tassels */}
        <div className="flex gap-1.5 mt-0.5">
          {[0,1,2].map(i=>(
            <div key={i} className="rounded-full" style={{ width:2, height:14+(i%2)*4, background:`linear-gradient(180deg,rgba(249,115,22,0.8),rgba(254,215,170,0.4))` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── 7. Crystal Carousel ──────────────────────────────────────────────── */
function CrystalCarouselThumb() {
  injectCSS();
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 20%,#0c4a6e 0%,#082f49 35%,#0f0c2e 70%,#050318 100%)' }}>
      {/* Snowflakes floating */}
      {[...Array(16)].map((_,i)=>(
        <div key={i} className="absolute text-sky-200"
          style={{ left:`${(i*23+5)%93}%`, top:`${(i*17+4)%90}%`, fontSize:6+i%4, opacity:0.2+i%4*0.12, animation:`tth-fall ${5+i%4*1.2}s linear infinite`, animationDelay:`${i*0.4}s` }}>
          {['❄','·','⋆','✦'][i%4]}
        </div>
      ))}
      {/* Snow globe */}
      <div className="relative" style={{ animation:'tth-float 4s ease-in-out infinite' }}>
        {/* Globe sphere */}
        <div className="w-24 h-24 rounded-full relative overflow-hidden"
          style={{ background:'radial-gradient(circle at 35% 30%,rgba(186,230,253,0.3) 0%,rgba(14,165,233,0.12) 40%,rgba(2,132,199,0.08) 100%)', border:'2.5px solid rgba(186,230,253,0.35)', boxShadow:'0 0 30px rgba(56,189,248,0.25), 0 8px 32px rgba(0,0,0,0.5), inset 0 0 40px rgba(186,230,253,0.06)' }}>
          {/* Water shimmer inside */}
          <div className="absolute bottom-0 left-0 right-0 h-8 rounded-b-full"
            style={{ background:'linear-gradient(180deg,transparent,rgba(56,189,248,0.15))' }} />
          {/* Rotating photo carousel */}
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ animation:'tth-spin 10s linear infinite' }}>
            {[{deg:0},{deg:120},{deg:240}].map(({deg},i)=>(
              <div key={i} className="absolute w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ transform:`rotate(${deg}deg) translateY(-28px) rotate(-${deg}deg)`, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(4px)', border:'1px solid rgba(255,255,255,0.2)', fontSize:13 }}>
                {['📸','💝','🌹'][i]}
              </div>
            ))}
          </div>
          {/* Crystal rose center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl z-10"
            style={{ filter:'drop-shadow(0 0 8px rgba(56,189,248,0.9))' }}>🌹</div>
          {/* Highlight glare */}
          <div className="absolute top-2 left-3 w-5 h-3 rounded-full"
            style={{ background:'rgba(255,255,255,0.15)', filter:'blur(3px)' }} />
        </div>
        {/* Base */}
        <div className="w-20 h-3 rounded-full mx-auto mt-1"
          style={{ background:'linear-gradient(90deg,#0369a1,#38bdf8,#0369a1)', boxShadow:'0 0 10px rgba(56,189,248,0.4)' }} />
      </div>
    </div>
  );
}

/* ─── 8. Cinema Filmstrip ──────────────────────────────────────────────── */
function CinemaThumb() {
  injectCSS();
  const frames = [
    {em:'🥂',txt:'Kỷ niệm đầu',hue:30},
    {em:'🌸',txt:'Những ngày vui',hue:340},
    {em:'💑',txt:'Bên nhau mãi',hue:200},
  ];
  return (
    <div className="w-full h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg,#0a0906 0%,#1a1410 50%,#0e0b08 100%)' }}>
      {/* Film grain scanlines */}
      <div className="absolute inset-0 opacity-15 pointer-events-none"
        style={{ backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.04) 3px,rgba(255,255,255,0.04) 4px)' }} />
      {/* Left sprocket strip */}
      <div className="absolute left-0 top-0 bottom-0 w-5 flex flex-col gap-1 py-2"
        style={{ background:'rgba(0,0,0,0.8)', borderRight:'1px solid rgba(255,255,255,0.06)' }}>
        {[...Array(7)].map((_,i)=>(
          <div key={i} className="mx-1 rounded flex-1" style={{ background:'rgba(255,255,255,0.07)', minHeight:8 }} />
        ))}
      </div>
      {/* Right sprocket strip */}
      <div className="absolute right-0 top-0 bottom-0 w-5 flex flex-col gap-1 py-2"
        style={{ background:'rgba(0,0,0,0.8)', borderLeft:'1px solid rgba(255,255,255,0.06)' }}>
        {[...Array(7)].map((_,i)=>(
          <div key={i} className="mx-1 rounded flex-1" style={{ background:'rgba(255,255,255,0.07)', minHeight:8 }} />
        ))}
      </div>
      {/* Center frames */}
      <div className="absolute inset-x-6 top-2 bottom-2 flex flex-col gap-1.5">
        {frames.map(({em,txt,hue},i)=>(
          <div key={i} className="flex-1 rounded-lg flex items-center gap-2.5 px-2 overflow-hidden"
            style={{ background:`hsl(${hue},25%,${10+i*3}%)`, border:'0.5px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize:16 }}>{em}</span>
            <p style={{ fontSize:7.5, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>{txt}</p>
          </div>
        ))}
      </div>
      {/* Cinematic light shaft */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-full pointer-events-none"
        style={{ background:'linear-gradient(180deg,rgba(253,186,116,0.12) 0%,rgba(253,186,116,0.04) 40%,transparent 70%)', animation:'tth-pulse-glow 3s ease-in-out infinite' }} />
      {/* Film title card at bottom */}
      <div className="absolute bottom-2 left-8 right-8 rounded text-center py-0.5"
        style={{ background:'rgba(0,0,0,0.6)', border:'0.5px solid rgba(255,255,255,0.08)' }}>
        <p style={{ fontSize:7, color:'rgba(253,186,116,0.8)', letterSpacing:'0.1em', fontWeight:700 }}>★ KỶ NIỆM ĐẸP ★</p>
      </div>
    </div>
  );
}

/* ─── 9. Interactive Bouquet ───────────────────────────────────────────── */
function BouquetThumb() {
  injectCSS();
  return (
    <div className="w-full h-full relative overflow-hidden flex items-end justify-center pb-1"
      style={{ background: 'linear-gradient(160deg,#022c22 0%,#064e3b 35%,#0d1f13 70%,#000a05 100%)' }}>
      {/* Bokeh light dots */}
      {[...Array(10)].map((_,i)=>(
        <div key={i} className="absolute rounded-full"
          style={{ width:8+i%4*4, height:8+i%4*4, left:`${(i*21+8)%88}%`, top:`${(i*19+5)%70}%`, background:`hsla(${130+i*25},60%,55%,0.12)`, filter:'blur(4px)', animation:`tth-pulse-glow ${2.5+i%3*0.8}s ease-in-out infinite`, animationDelay:`${i*0.3}s` }} />
      ))}
      {/* Top glow from flowers */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-20"
        style={{ background:'radial-gradient(ellipse,rgba(134,239,172,0.2) 0%,transparent 70%)', filter:'blur(8px)' }} />
      {/* Flower stems */}
      <div className="relative z-10 flex items-end justify-center" style={{ width:80 }}>
        {[
          {l:0,h:52,em:'🌷',fs:22},{l:11,h:64,em:'🌸',fs:20},{l:22,h:72,em:'🌹',fs:26},
          {l:33,h:78,em:'💐',fs:30},{l:44,h:72,em:'🌺',fs:22},{l:55,h:64,em:'🌷',fs:20},{l:66,h:52,em:'🌸',fs:18},
        ].map(({l,h,em,fs},i)=>(
          <div key={i} className="absolute flex flex-col items-center" style={{ left:l, bottom:0 }}>
            {/* Stem */}
            <div className="rounded-full" style={{ width:2, height:h*0.55, background:'linear-gradient(180deg,rgba(21,128,61,0.8),rgba(6,78,59,0.6))', marginBottom:0 }} />
            {/* Flower */}
            <div style={{ fontSize:fs, lineHeight:1, animation:`tth-float ${3+i*0.4}s ease-in-out infinite`, animationDelay:`${i*0.25}s` }}>{em}</div>
          </div>
        ))}
      </div>
      {/* Wrapping paper cone */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20"
        style={{ width:0, height:0, borderLeft:'30px solid transparent', borderRight:'30px solid transparent', borderBottom:'36px solid rgba(167,243,208,0.22)', filter:'blur(0.5px)' }} />
      {/* Photo charm */}
      <div className="absolute right-4 top-1/4 w-8 h-8 rounded-full border-2 border-white/40 flex items-center justify-center shadow-lg"
        style={{ background:'rgba(255,255,255,0.12)', backdropFilter:'blur(4px)', fontSize:16, animation:'tth-float 3.5s ease-in-out infinite 0.5s' }}>
        📸
      </div>
    </div>
  );
}

/* ─── 10. Hold to Reveal ───────────────────────────────────────────────── */
function HoldToRevealThumb() {
  injectCSS();
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 55% 35%,#3b0764 0%,#1e1b4b 45%,#0a0715 100%)' }}>
      {/* Floating energy particles */}
      {[...Array(14)].map((_,i)=>(
        <div key={i} className="absolute rounded-full"
          style={{ width:2+i%3, height:2+i%3, background:`hsl(${275+i*18},85%,${65+i%3*10}%)`, left:`${(i*19+7)%92}%`, top:`${(i*13+6)%90}%`, opacity:0.2+i%4*0.12, animation:`tth-blink ${1.8+i%4*0.6}s ease-in-out infinite`, animationDelay:`${i*0.18}s` }} />
      ))}
      {/* SVG progress ring */}
      <div className="relative z-10 flex items-center justify-center" style={{ animation:'tth-float 4s ease-in-out infinite' }}>
        {/* Outer ping ring */}
        <div className="absolute w-20 h-20 rounded-full"
          style={{ border:'2px solid rgba(168,85,247,0.4)', animation:'tth-ping 2s ease-out infinite' }} />
        <svg width="72" height="72" style={{ transform:'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
          {/* Charge arc – 68% */}
          <circle cx="36" cy="36" r="30" fill="none" stroke="url(#chargGrad)" strokeWidth="6"
            strokeLinecap="round" strokeDasharray={188} strokeDashoffset={60}
            style={{ filter:'drop-shadow(0 0 6px rgba(168,85,247,0.9))' }} />
          <defs>
            <linearGradient id="chargGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>
        {/* Finger sensor center */}
        <div className="absolute w-11 h-11 rounded-full flex flex-col items-center justify-center"
          style={{ background:'radial-gradient(circle,rgba(109,40,217,0.7) 0%,rgba(30,27,75,0.9) 100%)', border:'1.5px solid rgba(168,85,247,0.5)', boxShadow:'0 0 20px rgba(168,85,247,0.5), inset 0 0 15px rgba(109,40,217,0.3)' }}>
          <span style={{ fontSize:18 }}>👆</span>
          <span style={{ fontSize:7, color:'rgba(196,181,253,0.9)', fontWeight:700, marginTop:1 }}>68%</span>
        </div>
      </div>
      {/* Status bar */}
      <div className="mt-4 w-24 space-y-1 z-10">
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full" style={{ width:'68%', background:'linear-gradient(90deg,#7C3AED,#A855F7,#EC4899)', boxShadow:'0 0 8px rgba(168,85,247,0.8)' }} />
        </div>
        <p className="text-center" style={{ fontSize:7.5, color:'rgba(196,181,253,0.75)', fontWeight:700 }}>🔋 Nhấn giữ để sạc 100%</p>
      </div>
    </div>
  );
}

/* ─── 11. Foggy Mirror ─────────────────────────────────────────────────── */
function FoggyMirrorThumb() {
  injectCSS();
  return (
    <div className="w-full h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg,#0f172a 0%,#1e2a45 40%,#172035 100%)' }}>
      {/* Revealed content (dimly visible) */}
      <div className="absolute inset-3 rounded-2xl overflow-hidden"
        style={{ border:'1.5px solid rgba(99,102,241,0.2)' }}>
        {/* Romantic scene behind */}
        <div className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background:'linear-gradient(145deg,rgba(99,102,241,0.1),rgba(30,27,75,0.3))' }}>
          <span style={{ fontSize:20, opacity:0.4 }}>🪞</span>
          <div className="flex gap-1 mt-1">
            {[0,1].map(i=><div key={i} className="w-8 h-7 rounded-lg opacity-25" style={{ background:'rgba(99,102,241,0.4)' }} />)}
          </div>
        </div>
        {/* Fog layer */}
        <div className="absolute inset-0 rounded-2xl"
          style={{ background:'linear-gradient(160deg,rgba(176,196,230,0.88) 0%,rgba(200,215,240,0.92) 50%,rgba(170,190,225,0.85) 100%)' }}>
          {/* Condensation droplets */}
          {[...Array(18)].map((_,i)=>(
            <div key={i} className="absolute rounded-full"
              style={{ width:2+i%5, height:3+i%4, left:`${(i*21+8)%88}%`, top:`${(i*17+6)%85}%`, background:'rgba(255,255,255,0.35)', filter:'blur(0.5px)' }} />
          ))}
          {/* Streaks */}
          {[15,35,55,72,88].map((l,i)=>(
            <div key={i} className="absolute top-0 bottom-0 w-px" style={{ left:`${l}%`, background:'linear-gradient(180deg,transparent 0%,rgba(255,255,255,0.2) 30%,rgba(255,255,255,0.4) 60%,transparent 100%)' }} />
          ))}
          {/* Wiped clear circle area */}
          <div className="absolute" style={{ right:'18%', top:'28%', width:34, height:38, borderRadius:'50%' }}>
            <div className="w-full h-full rounded-full"
              style={{ background:'linear-gradient(145deg,rgba(99,102,241,0.35),rgba(30,27,75,0.5))', border:'1px solid rgba(165,180,252,0.3)', backdropFilter:'blur(0)', boxShadow:'0 0 10px rgba(99,102,241,0.4)' }}>
              <div className="w-full h-full flex items-center justify-center" style={{ fontSize:14 }}>💙</div>
            </div>
          </div>
          {/* Prompt text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p style={{ fontSize:8.5, color:'rgba(30,50,110,0.8)', fontWeight:800, marginTop:20 }}>🪞 Lau để xem bí mật</p>
            <p style={{ fontSize:7, color:'rgba(30,50,110,0.6)' }}>Chạm & vuốt ngón tay</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 12. Blow Mic Reveal ──────────────────────────────────────────────── */
function BlowMicThumb() {
  injectCSS();
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 30%,#022c22 0%,#052e16 40%,#0a0f09 100%)' }}>
      {/* Soft light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-20"
        style={{ background:'radial-gradient(ellipse,rgba(134,239,172,0.18) 0%,transparent 70%)', filter:'blur(8px)' }} />
      {/* Dandelion */}
      <div className="relative z-10" style={{ width:76, height:76, animation:'tth-float 4s ease-in-out infinite' }}>
        {/* Spokes */}
        {[...Array(16)].map((_,i)=>{
          const angle=(i/16)*360, rad=angle*Math.PI/180;
          const x=50+Math.cos(rad)*38, y=50+Math.sin(rad)*38;
          return (
            <div key={i} className="absolute" style={{ left:'50%', top:'50%', width:38, height:1.5, background:'linear-gradient(90deg,rgba(134,239,172,0.6),rgba(187,247,208,0.2))', transformOrigin:'left center', transform:`rotate(${angle}deg)`, marginTop:-0.75 }}>
              <div className="absolute right-0 w-2.5 h-2.5 rounded-full -translate-y-1/2 top-1/2"
                style={{ background:'rgba(167,243,208,0.5)', boxShadow:'0 0 4px rgba(134,239,172,0.8)', fontSize:8, display:'flex', alignItems:'center', justifyContent:'center' }}>🌸</div>
            </div>
          );
        })}
        {/* Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10"
          style={{ background:'radial-gradient(circle,#fde68a,#fbbf24)', boxShadow:'0 0 12px rgba(251,191,36,0.6)', fontSize:16 }}>
          🌼
        </div>
      </div>
      {/* Floating petals blowing away */}
      {[{l:'78%',t:'28%',r:'40deg',d:'0s'},{l:'85%',t:'42%',r:'15deg',d:'0.3s'},{l:'90%',t:'55%',r:'-8deg',d:'0.6s'}].map((p,i)=>(
        <div key={i} className="absolute" style={{ left:p.l, top:p.t, transform:`rotate(${p.r})`, fontSize:10, opacity:0.7-i*0.2, animation:`tth-drift ${2+i*0.4}s ease-in-out infinite`, animationDelay:p.d }}>🌸</div>
      ))}
      {/* Mic & sound wave */}
      <div className="mt-2 flex flex-col items-center gap-1 z-10">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
          style={{ background:'linear-gradient(135deg,rgba(52,211,153,0.3),rgba(16,185,129,0.2))', border:'1.5px solid rgba(52,211,153,0.5)', boxShadow:'0 0 12px rgba(52,211,153,0.3)', fontSize:16 }}>🎤</div>
        {/* Animated sound bars */}
        <div className="flex items-end gap-0.5 h-5">
          {[3,6,10,14,10,7,4,8,5,11,7,4].map((h,i)=>(
            <div key={i} className="w-1 rounded-full"
              style={{ height:h, background:'rgba(52,211,153,0.7)', animation:`tth-wave ${0.6+i%3*0.2}s ease-in-out infinite`, animationDelay:`${i*0.08}s` }} />
          ))}
        </div>
        <p style={{ fontSize:7.5, color:'rgba(110,231,183,0.85)', fontWeight:700 }}>💨 Thổi vào micro</p>
      </div>
    </div>
  );
}

/* ─── 13. Polaroid Swipe ───────────────────────────────────────────────── */
function PolaroidSwipeThumb() {
  injectCSS();
  const cards = [
    {rot:'-10deg',y:6,col:'#fde68a',em:'🌅'},
    {rot:'4deg',y:3,col:'#fca5a5',em:'🌸'},
    {rot:'0deg',y:0,col:'#bfdbfe',em:'📸'},
  ];
  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 30%,#292524 0%,#1c1917 50%,#0c0a09 100%)' }}>
      {/* Warm bokeh */}
      {[...Array(8)].map((_,i)=>(
        <div key={i} className="absolute rounded-full"
          style={{ width:12+i%4*6, height:12+i%4*6, left:`${(i*27+5)%90}%`, top:`${(i*23+8)%85}%`, background:`rgba(${180+i*8},${100+i*5},${50+i*3},0.08)`, filter:'blur(6px)' }} />
      ))}
      {/* Stacked polaroids */}
      <div className="relative" style={{ width:80, height:100 }}>
        {cards.map(({rot,y,col,em},i)=>(
          <div key={i} className="absolute inset-0 rounded-md shadow-2xl overflow-hidden"
            style={{ background:'linear-gradient(160deg,#fefce8,#fef9ee)', transform:`rotate(${rot}) translateY(${y}px)`, boxShadow:'0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.3)', zIndex:cards.length-i }}>
            {/* Photo area */}
            <div className="mx-2 mt-2 h-14 rounded-sm flex items-center justify-center text-2xl"
              style={{ background:`linear-gradient(135deg,${col}66,${col}99)` }}>
              {em}
            </div>
            {/* Caption strip */}
            <div className="mx-2 mt-1">
              <div className="h-1.5 rounded-full w-3/4" style={{ background:'rgba(0,0,0,0.1)' }} />
              <div className="h-1 rounded-full w-1/2 mt-0.5" style={{ background:'rgba(0,0,0,0.07)' }} />
            </div>
          </div>
        ))}
        {/* Swipe arrows */}
        <div className="absolute -right-5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-80">
          {['→','→'].map((a,i)=>(
            <span key={i} className="text-amber-400" style={{ fontSize:10, opacity:1-i*0.4 }}>{a}</span>
          ))}
        </div>
      </div>
      <p className="absolute bottom-2 text-amber-300 font-bold text-center" style={{ fontSize:8, textShadow:'0 0 6px rgba(251,191,36,0.5)' }}>📸 Vuốt để xem ký ức</p>
    </div>
  );
}

/* ─── 14. AI Gesture Unlock ────────────────────────────────────────────── */
function AIGestureThumb() {
  injectCSS();
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 25%,#2e003e 0%,#1a0527 45%,#06000d 100%)' }}>
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage:'linear-gradient(rgba(232,121,249,1) 1px,transparent 1px),linear-gradient(90deg,rgba(232,121,249,1) 1px,transparent 1px)', backgroundSize:'18px 18px' }} />
      {/* Outer glow ring */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width:100, height:100, background:'radial-gradient(circle,rgba(192,38,211,0.2) 0%,transparent 65%)', filter:'blur(10px)', animation:'tth-pulse-glow 2.5s ease-in-out infinite' }} />
      {/* Camera viewfinder */}
      <div className="relative z-10 w-24 h-18 rounded-2xl overflow-hidden"
        style={{ height:70, background:'rgba(10,3,20,0.85)', border:'2px solid rgba(232,121,249,0.5)', boxShadow:'0 0 24px rgba(192,38,211,0.35), 0 8px 24px rgba(0,0,0,0.6)' }}>
        {/* Corner brackets */}
        {[{t:'top-1 left-1',bt:2,bb:0,bl:2,br:0},{t:'top-1 right-1',bt:2,bb:0,bl:0,br:2},{t:'bottom-1 left-1',bt:0,bb:2,bl:2,br:0},{t:'bottom-1 right-1',bt:0,bb:2,bl:0,br:2}].map((b,i)=>(
          <div key={i} className={`absolute ${b.t} w-4 h-4`}
            style={{ borderTopWidth:b.bt, borderBottomWidth:b.bb, borderLeftWidth:b.bl, borderRightWidth:b.br, borderColor:'rgba(232,121,249,0.9)', borderStyle:'solid' }} />
        ))}
        {/* Scanning line */}
        <div className="absolute left-0 right-0 h-px"
          style={{ top:'40%', background:'rgba(232,121,249,0.8)', boxShadow:'0 0 6px rgba(232,121,249,0.9)', animation:'tth-pulse-glow 1.5s ease-in-out infinite' }} />
        {/* Face with smile */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background:'rgba(232,121,249,0.1)', border:'1.5px solid rgba(232,121,249,0.3)' }}>
          <span style={{ fontSize:22 }}>😊</span>
        </div>
      </div>
      {/* Scan progress bar */}
      <div className="mt-3 w-24 z-10 space-y-1">
        <div className="flex justify-between" style={{ fontSize:7 }}>
          <span style={{ color:'rgba(232,121,249,0.8)', fontWeight:700 }}>Đang quét nụ cười...</span>
          <span style={{ color:'rgba(232,121,249,0.8)', fontWeight:800 }}>78%</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full"
            style={{ width:'78%', background:'linear-gradient(90deg,#7c3aed,#c026d3,#ec4899)', boxShadow:'0 0 8px rgba(192,38,211,0.7)', animation:'tth-shimmer 2s linear infinite', backgroundSize:'200% 100%' }} />
        </div>
      </div>
      <p className="mt-1.5 z-10" style={{ fontSize:7.5, color:'rgba(216,180,254,0.7)', fontWeight:700 }}>🤖 Mỉm cười để mở khóa</p>
    </div>
  );
}

/* ─── Dispatch table ────────────────────────────────────────────────────── */
const THUMB_MAP: Record<EffectType, React.FC> = {
  PASSCODE_ENVELOPE: PasscodeEnvelopeThumb,
  GALAXY_3D:         GalaxyThumb,
  PETAL_RAIN:        BlossomThumb,
  VINYL_PLAYER:      VinylThumb,
  SCRATCH_CARD:      ScratchCardThumb,
  LANTERN_3D:        LanternThumb,
  CRYSTAL_CAROUSEL:  CrystalCarouselThumb,
  CINEMA_FILM:       CinemaThumb,
  BOUQUET_3D:        BouquetThumb,
  HOLD_TO_REVEAL:    HoldToRevealThumb,
  FOGGY_MIRROR:      FoggyMirrorThumb,
  BLOW_MIC:          BlowMicThumb,
  POLAROID_SWIPE:    PolaroidSwipeThumb,
  AI_GESTURE:        AIGestureThumb,
};

export default function TemplateThumbnail({ effectType, className = '' }: Props) {
  const Thumb = THUMB_MAP[effectType];
  if (!Thumb) return <div className={`w-full h-full bg-slate-950 ${className}`} />;
  return (
    <div className={`w-full h-full relative overflow-hidden ${className}`}>
      <Thumb />
    </div>
  );
}
