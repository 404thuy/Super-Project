import { useRef, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ArrowLeft,
  Rotate3d,
  Sliders,
  Sparkles,
  RefreshCw,
  Star,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

/* ---------- Procedural Astronomical Star Textures (Zero Square Pixels) ---------- */
let cachedRoundStarTexture: THREE.CanvasTexture | null = null;
let cachedStarFlareTexture: THREE.CanvasTexture | null = null;

function getRoundStarTexture(): THREE.CanvasTexture {
  if (cachedRoundStarTexture) return cachedRoundStarTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = 32;
    const cy = 32;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.15, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.35, 'rgba(240, 245, 255, 0.6)');
    grad.addColorStop(0.65, 'rgba(200, 220, 255, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  cachedRoundStarTexture = new THREE.CanvasTexture(canvas);
  cachedRoundStarTexture.generateMipmaps = true;
  return cachedRoundStarTexture;
}

function getStarFlareTexture(): THREE.CanvasTexture {
  if (cachedStarFlareTexture) return cachedStarFlareTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = 128;
    const cy = 128;

    // Soft spherical corona falloff
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.08, 'rgba(255, 255, 255, 0.98)');
    grad.addColorStop(0.2, 'rgba(245, 235, 255, 0.65)');
    grad.addColorStop(0.45, 'rgba(190, 160, 255, 0.22)');
    grad.addColorStop(0.8, 'rgba(130, 100, 255, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // 4-Pointed High-Precision Telescope Diffraction Spikes
    const drawSpike = (angle: number, length: number, width: number, opacity: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const spikeGrad = ctx.createLinearGradient(0, -width, length, 0);
      spikeGrad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      spikeGrad.addColorStop(0.25, `rgba(255, 240, 250, ${opacity * 0.75})`);
      spikeGrad.addColorStop(0.65, `rgba(210, 190, 255, ${opacity * 0.3})`);
      spikeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = spikeGrad;
      ctx.beginPath();
      ctx.moveTo(0, -width / 2);
      ctx.lineTo(length, 0);
      ctx.lineTo(0, width / 2);
      ctx.lineTo(-length, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Primary perpendicular cross diffraction rays (James Webb / Hubble style)
    drawSpike(0, 124, 7, 0.95);
    drawSpike(Math.PI / 2, 124, 7, 0.95);

    // Subtle 45-degree secondary diffraction glints
    drawSpike(Math.PI / 4, 76, 4, 0.5);
    drawSpike(-Math.PI / 4, 76, 4, 0.5);
  }
  cachedStarFlareTexture = new THREE.CanvasTexture(canvas);
  cachedStarFlareTexture.generateMipmaps = true;
  return cachedStarFlareTexture;
}

/* ---------- Realistic Multi-Spectral Deep Space Starfield (100% Round & Twinkling) ---------- */
function RealisticDeepSpaceField({ count = 3000 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const texture = useMemo(() => getRoundStarTexture(), []);

  const [positions, colors, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sc = new Float32Array(count);

    // Stellar spectral classification: Ice-Blue, Diamond-White, Warm-Gold, Rose
    const starColors = [
      [0.82, 0.90, 1.0],  // Class B (Ice Blue)
      [0.98, 0.99, 1.0],  // Class A (Diamond White)
      [1.0, 0.95, 0.85],  // Class F/G (Warm Starlight)
      [1.0, 0.82, 0.65],  // Class K (Golden Dawn)
      [1.0, 0.72, 0.80],  // Class M (Soft Rose Giant)
    ];

    for (let i = 0; i < count; i++) {
      // Uniform distribution on spherical shell
      const radius = 45 + Math.random() * 55;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const c = starColors[Math.floor(Math.random() * starColors.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];

      sc[i] = 0.5 + Math.random() * 1.5;
    }
    return [pos, col, sc];
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.003;
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.002) * 0.02;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={0.28}
        vertexColors
        transparent
        opacity={0.88}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ---------- Multi-Layered Deep Cosmic Spiral Dust System (Soft Glowing Particles) ---------- */
function CosmicSpiralArms({ count = 1200 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const texture = useMemo(() => getRoundStarTexture(), []);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      [0.98, 0.45, 0.65], // Rose Pink
      [0.78, 0.45, 0.98], // Royal Purple
      [0.35, 0.78, 0.98], // Celestial Cyan
      [1.0, 0.88, 0.45],  // Golden Starlight
      [0.95, 0.98, 1.0],  // White Diamond
      [0.4, 0.92, 0.82],  // Emerald Aurora
    ];

    const arms = 2;
    for (let i = 0; i < count; i++) {
      const armIndex = i % arms;
      const r1 = Math.abs(Math.sin(i * 12.9898 + 1.234) * 43758.5453) % 1;
      const r2 = Math.abs(Math.sin(i * 78.233 + 5.678) * 43758.5453) % 1;
      const r3 = Math.abs(Math.sin(i * 45.164 + 9.101) * 43758.5453) % 1;
      const r4 = Math.abs(Math.sin(i * 91.731 + 3.415) * 43758.5453) % 1;

      const dist = Math.pow(r1, 1.4) * 22 + 2.5;
      const angle = (dist * 0.42) + (armIndex * Math.PI) + (r2 - 0.5) * 0.75;
      const height = (r3 - 0.5) * (dist * 0.28);

      pos[i * 3] = Math.cos(angle) * dist;
      pos[i * 3 + 1] = height;
      pos[i * 3 + 2] = Math.sin(angle) * dist;

      const c = palette[Math.floor(r4 * palette.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.018;
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.006) * 0.06;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={0.24}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ---------- Glowing Orbit Ellipse Rings ---------- */
function OrbitRing({ radius, tilt = 0, color = '#a855f7' }: { radius: number; tilt?: number; color?: string }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 80;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);

  const lineObject = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Line(points, mat);
  }, [points, color]);

  return <primitive object={lineObject} rotation={[tilt, 0, 0]} />;
}

/* ---------- 3D Constellation Starlight Network Lines ---------- */
function ConstellationWeb({ points }: { points: [number, number, number][] }) {
  const lineObject = useMemo(() => {
    const linePts: THREE.Vector3[] = [];
    // Connect stars sequentially and close loop
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      linePts.push(new THREE.Vector3(...p1), new THREE.Vector3(...p2));
    }
    // Also cross-connect to star 2
    if (points.length >= 4) {
      linePts.push(new THREE.Vector3(...points[0]), new THREE.Vector3(...points[3]));
      linePts.push(new THREE.Vector3(...points[1]), new THREE.Vector3(...points[4 % points.length]));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(linePts);
    const mat = new THREE.LineBasicMaterial({
      color: '#c084fc',
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.LineSegments(geo, mat);
  }, [points]);

  return <primitive object={lineObject} />;
}

/* ---------- Central Galactic Core Star (Luminous Hypergiant) ---------- */
function GalacticCoreStar({ recipientName }: { recipientName: string }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const flareTexture = useMemo(() => getStarFlareTexture(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 2.2) * 0.08;
      coreRef.current.scale.setScalar(pulse);
      coreRef.current.rotation.y = t * 0.15;
    }
    if (haloRef.current) {
      const haloPulse = 1.15 + Math.cos(t * 1.8) * 0.12;
      haloRef.current.scale.setScalar(haloPulse);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Large Photometric Telescope Flare Billboard */}
      <sprite scale={[5.2, 5.2, 1]}>
        <spriteMaterial
          map={flareTexture}
          color="#f43f5e"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* 2. Outer Corona Atmosphere */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[1.35, 32, 32]} />
        <meshBasicMaterial color="#f43f5e" transparent opacity={0.25} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* 3. Ultra-Hot Luminous Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.78, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#fb7185"
          emissiveIntensity={3.2}
          roughness={0.1}
        />
      </mesh>

      {/* Core Tag */}
      <Html position={[0, -1.45, 0]} center>
        <div className="px-3.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-rose-400/50 text-[11px] font-black text-rose-200 shadow-2xl pointer-events-none whitespace-nowrap flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          <span>Tâm Vũ Trụ: {recipientName}</span>
        </div>
      </Html>
    </group>
  );
}

/* ---------- Shooting Star / Meteor With Tail ---------- */
function ShootingStar() {
  const headRef = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(false);
  const startPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());

  useEffect(() => {
    const triggerMeteor = () => {
      startPos.current.set(
        (Math.random() - 0.5) * 35,
        10 + Math.random() * 6,
        (Math.random() - 0.5) * 20
      );
      velocity.current.set(-14 - Math.random() * 8, -14 - Math.random() * 8, -6);
      if (headRef.current) {
        headRef.current.position.copy(startPos.current);
      }
      setActive(true);

      setTimeout(() => {
        setActive(false);
      }, 950);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        triggerMeteor();
      }
    }, 4800);

    return () => clearInterval(interval);
  }, []);

  useFrame((_, delta) => {
    if (active && headRef.current) {
      headRef.current.position.addScaledVector(velocity.current, delta);
    }
  });

  return (
    <mesh ref={headRef} visible={active}>
      <sphereGeometry args={[0.14, 16, 16]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  );
}

/* ---------- Smooth Camera Controller Rig (No Fighting OrbitControls) ---------- */
function CameraRig({
  targetPos,
  isZoomed,
}: {
  targetPos: [number, number, number] | null;
  isZoomed: boolean;
}) {
  const { camera } = useThree();
  const zoomTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    // Only animate camera position when inspecting an item
    if (isZoomed && targetPos) {
      zoomTarget.set(targetPos[0] * 0.72, targetPos[1] * 0.72 + 0.3, targetPos[2] + 2.8);
      camera.position.lerp(zoomTarget, 0.06);
    }
  });

  return null;
}

/* ---------- True 3D Volumetric Memory Crystal (Double-Sided 360 Inspection) ---------- */
function VolumetricMemoryCrystal({
  position,
  imageUrl,
  index,
  recipientName,
  senderName,
  quoteText,
  onClick,
  hidden = false,
}: {
  position: [number, number, number];
  imageUrl?: string;
  index: number;
  recipientName: string;
  senderName: string;
  quoteText: string;
  onClick: () => void;
  hidden?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Slow orbital rotation in place
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5 + index) * 0.2;
    }
  });

  const toggleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playPinClick();
    setIsFlipped(!isFlipped);
  };

  if (hidden) {
    return <group ref={groupRef} position={position} />;
  }

  return (
    <group ref={groupRef} position={position}>
      <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.3}>
        <Html position={[0, 0, 0]} center distanceFactor={9}>
          <div
            onClick={onClick}
            className="group relative cursor-pointer select-none"
            style={{ perspective: '1200px' }}
          >
            {/* 3D Volumetric Card with Flip Animation */}
            <div
              className="relative w-40 sm:w-44 h-52 sm:h-56 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.85)]"
              style={{
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.75s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* ===== FRONT FACE (Photo + Crystal Bevel Border) ===== */}
              <div
                className="absolute inset-0 rounded-3xl p-2.5 bg-gradient-to-br from-purple-900/90 via-slate-900/95 to-rose-950/90 border-2 border-purple-400/50 backdrop-blur-xl flex flex-col justify-between overflow-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {/* Glow Edge */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 via-transparent to-rose-500/20 pointer-events-none" />

                {/* Top Badge */}
                <div className="flex items-center justify-between text-[9px] font-extrabold text-purple-200">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-rose-400" />
                    <span>Kỷ niệm #{index + 1}</span>
                  </span>
                  <button
                    onClick={toggleFlip}
                    className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white"
                    title="Lật 180° xem mặt sau"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Center Image or Fallback 3D Art */}
                <div className="flex-1 my-1.5 rounded-2xl overflow-hidden bg-slate-950/80 border border-white/10 flex items-center justify-center relative">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-3 space-y-1">
                      <div className="text-3xl animate-pulse">💎</div>
                      <p className="text-[10px] font-bold text-rose-300">Pha Lê Tình Yêu</p>
                      <p className="text-[8px] text-white/50">Mặt trước kỷ niệm</p>
                    </div>
                  )}
                </div>

                {/* Bottom Tag */}
                <div className="text-center">
                  <p className="text-[10px] font-bold text-rose-300 truncate">
                    Gửi {recipientName}
                  </p>
                </div>
              </div>

              {/* ===== BACK FACE (Engraved Love Quote on Frosted Crystal Glass) ===== */}
              <div
                className="absolute inset-0 rounded-3xl p-3 bg-gradient-to-br from-indigo-950/95 via-purple-950/90 to-slate-900/95 border-2 border-rose-400/50 backdrop-blur-xl flex flex-col justify-between text-center overflow-hidden"
                style={{
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {/* Frosted Shimmer Texture */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/15 via-transparent to-purple-500/15 pointer-events-none" />

                {/* Top Header */}
                <div className="flex items-center justify-between text-[9px] font-extrabold text-rose-300">
                  <span>Lời Khắc Sau Pha Lê</span>
                  <button
                    onClick={toggleFlip}
                    className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white"
                    title="Lật về mặt trước"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Center Engraved Text */}
                <div className="flex-1 flex flex-col items-center justify-center p-1">
                  <p className="text-[10px] leading-relaxed text-purple-100 font-medium line-clamp-5">
                    "{quoteText}"
                  </p>
                </div>

                {/* Sender Signature */}
                <div className="text-right border-t border-white/10 pt-1">
                  <p className="text-[9px] font-bold text-rose-400 italic">
                    — {senderName} 🌹
                  </p>
                </div>
              </div>
            </div>

            {/* Click to inspect guide */}
            <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="px-2 py-0.5 rounded-full bg-purple-600/90 text-white text-[9px] font-bold shadow">
                Nhấp để xem gần
              </span>
            </div>
          </div>
        </Html>
      </Float>
    </group>
  );
}

/* ---------- 🌟 PHOTOREALISTIC 3D CELESTIAL STAR NODE (100% Round & Glowing) ---------- */
function HighPrecisionStarNode({
  position,
  label,
  icon,
  onClick,
  color = '#FB7185',
  secondaryColor = '#fef08a',
  hidden = false,
}: {
  position: [number, number, number];
  label: string;
  icon: string;
  onClick: () => void;
  color?: string;
  secondaryColor?: string;
  hidden?: boolean;
}) {
  const primaryCore = useRef<THREE.Mesh>(null);
  const coronaSphere = useRef<THREE.Mesh>(null);
  const outerSparks = useRef<THREE.Group>(null);
  const flareSprite = useRef<THREE.Sprite>(null);
  const flareTexture = useMemo(() => getStarFlareTexture(), []);

  // Orbiting micro-embers coordinates
  const emberAngles = useMemo(
    () => [
      { speed: 1.8, radius: 0.65, tilt: 0.4 },
      { speed: -2.3, radius: 0.78, tilt: -0.6 },
      { speed: 1.4, radius: 0.9, tilt: 0.9 },
    ],
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const offset = position[0] * 1.5 + position[1];

    if (primaryCore.current) {
      // Natural stellar pulsing and rotation
      const pulse = 1 + Math.sin(t * 3.5 + offset) * 0.08;
      primaryCore.current.scale.setScalar(pulse);
      primaryCore.current.rotation.y = t * 0.8 + offset;
    }

    if (coronaSphere.current) {
      const coronaPulse = 1.1 + Math.cos(t * 2.2 + offset) * 0.12;
      coronaSphere.current.scale.setScalar(coronaPulse);
    }

    if (flareSprite.current) {
      // Breathing flare scale and gentle pulsation
      const flareScale = 2.4 + Math.sin(t * 2.8 + offset) * 0.25;
      flareSprite.current.scale.set(flareScale, flareScale, 1);
    }

    if (outerSparks.current) {
      outerSparks.current.rotation.y = t * 1.2;
      outerSparks.current.rotation.z = Math.sin(t * 0.6) * 0.3;
    }
  });

  return (
    <Float speed={2.0} rotationIntensity={0.2} floatIntensity={0.35}>
      <group position={position}>
        {/* 1. Astrophotography Telescope Diffraction Cross Flare Sprite (Always faces camera) */}
        <sprite ref={flareSprite} scale={[2.4, 2.4, 1]} onClick={onClick}>
          <spriteMaterial
            map={flareTexture}
            color={secondaryColor}
            transparent
            opacity={0.88}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>

        {/* 2. Soft Secondary Chromatic Aura Sprite */}
        <sprite scale={[1.4, 1.4, 1]}>
          <spriteMaterial
            map={flareTexture}
            color={color}
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>

        {/* 3. Luminous Spherical Stellar Plasma Core */}
        <mesh ref={primaryCore} onClick={onClick}>
          <sphereGeometry args={[0.26, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={color}
            emissiveIntensity={2.8}
            roughness={0.15}
          />
        </mesh>

        {/* 4. Volumetric Corona Atmosphere (Layered soft glow sphere) */}
        <mesh ref={coronaSphere}>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.28}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* 5. Delicate Kinetic Light Rays (Needle-slender 3D beams that catch light) */}
        <group>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.005, 0.015, 1.1, 16]} />
            <meshBasicMaterial
              color={secondaryColor}
              transparent
              opacity={0.35}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.005, 0.015, 1.1, 16]} />
            <meshBasicMaterial
              color={secondaryColor}
              transparent
              opacity={0.35}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>

        {/* 6. Orbiting Starlight Micro-Embers (Alive celestial fireflies) */}
        <group ref={outerSparks}>
          {emberAngles.map((ember, idx) => (
            <mesh
              key={idx}
              position={[
                Math.cos(idx * 2.1) * ember.radius,
                Math.sin(idx * 1.5) * 0.25,
                Math.sin(idx * 2.1) * ember.radius,
              ]}
            >
              <sphereGeometry args={[0.035, 12, 12]} />
              <meshBasicMaterial
                color={secondaryColor}
                transparent
                opacity={0.85}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>

        {/* 7. Starlight Label Tag (Hidden when modal dialog is active) */}
        {!hidden && (
          <Html position={[0, -0.65, 0]} center>
            <button
              onClick={onClick}
              className="group flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold shadow-2xl hover:border-rose-400 hover:scale-110 active:scale-95 transition-all select-none whitespace-nowrap"
            >
              <span>{icon}</span>
              <span className="group-hover:text-rose-300 transition-colors">{label}</span>
            </button>
          </Html>
        )}
      </group>
    </Float>
  );
}

const SAMPLE_GALAXY_QUOTES = [
  'Mỗi khoảnh khắc có em là một vì sao sáng lấp lánh trong vũ trụ của anh.',
  'Em là định mệnh ngọt ngào nhất mà cuộc đời đã ban tặng.',
  'Dù vũ trụ có bao la đến đâu, trái tim anh vẫn luôn hướng về em.',
  'Chúc em ngày 20/10 ngập tràn niềm vui, nụ cười và hạnh phúc!',
];

/* ---------- 7 Unique Constellation Stars with Personalized Blessings ---------- */
interface ConstellationStarData {
  pos: [number, number, number];
  name: string;
  symbol: string;
  color: string;
  secondaryColor: string;
  meaning: string;
  blessing: string;
}

const CONSTELLATION_STARS: ConstellationStarData[] = [
  {
    pos: [-4.6, 2.8, -2.5],
    name: 'Sao Hạnh Phúc',
    symbol: '⭐',
    color: '#FB7185',
    secondaryColor: '#fef08a',
    meaning: 'Ánh sáng của nụ cười, niềm vui và sự lạc quan yêu đời',
    blessing: 'Chúc bạn mỗi sớm mai thức dậy đều đón nhận nụ cười rạng rỡ, trọn vẹn niềm vui và ngập tràn hạnh phúc bất tận.',
  },
  {
    pos: [4.4, -1.6, -3.0],
    name: 'Sao Yêu Thương',
    symbol: '💖',
    color: '#F43F5E',
    secondaryColor: '#fda4af',
    meaning: 'Tình cảm nồng thắm, sự chân thành và nâng niu vô điều kiện',
    blessing: 'Mong bạn luôn được che chở trong tình yêu thương ấm áp, luôn có một bờ vai vững chãi đồng hành cùng bạn.',
  },
  {
    pos: [-2.4, -2.9, 2.6],
    name: 'Sao Rực Rỡ',
    symbol: '🌹',
    color: '#C084FC',
    secondaryColor: '#e9d5ff',
    meaning: 'Nhan sắc kiêu sa, khí chất tự tin và tỏa sáng của phái nữ',
    blessing: 'Chúc người phụ nữ tuyệt vời ngày 20/10 luôn kiêu hãnh, tự tin và ngát hương như đóa hồng nhung nở giữa trời đêm.',
  },
  {
    pos: [3.5, 3.2, 1.6],
    name: 'Sao Kiêu Hãnh',
    symbol: '👑',
    color: '#FBBF24',
    secondaryColor: '#ffffff',
    meaning: 'Sự thông tuệ, bản lĩnh và thành công rực rỡ',
    blessing: 'Chúc bạn gặt hái thêm nhiều thành công vượt bậc, luôn là người phụ nữ độc lập, quyến rũ và tỏa sáng ở mọi nơi bạn bước tới.',
  },
  {
    pos: [0.6, 4.2, -2.4],
    name: 'Sao Ước Nguyện',
    symbol: '✨',
    color: '#38BDF8',
    secondaryColor: '#bae6fd',
    meaning: 'Mọi ước vọng sâu thẳm đều trở thành hiện thực',
    blessing: 'Gửi ngàn ước nguyện tốt lành nhất qua dải thiên hà: chúc mọi hoài bão và mong ước của bạn đều nở hoa rực rỡ.',
  },
  {
    pos: [-3.8, -0.8, -4.2],
    name: 'Sao Tri Kỷ',
    symbol: '💫',
    color: '#A855F7',
    secondaryColor: '#f472b6',
    meaning: 'Sự thấu hiểu, đồng hành và gắn kết keo sơn',
    blessing: 'Cảm ơn vì đã luôn có mặt trong cuộc đời tôi, lắng nghe và chia sẻ mọi khoảnh khắc buồn vui quý giá.',
  },
  {
    pos: [2.2, -3.8, 0.8],
    name: 'Sao Bình An',
    symbol: '🌙',
    color: '#34D399',
    secondaryColor: '#a7f3d0',
    meaning: 'Tâm hồn thư thái, an yên và thanh bình',
    blessing: 'Chúc tâm hồn bạn luôn như mặt hồ êm ả, bình yên trước bão giông và luôn cảm nhận được sự dịu dàng của cuộc sống.',
  },
];

export default function GalaxyMemoriesFX({ config, mode }: Props) {
  const [selectedStarIndex, setSelectedStarIndex] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [targetFocusPos, setTargetFocusPos] = useState<[number, number, number] | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [inspectFlipped, setInspectFlipped] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [starLit, setStarLit] = useState(false);

  // Quality toggle (Auto default to smooth on mobile width)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [graphicsQuality, setGraphicsQuality] = useState<'high' | 'smooth'>(
    isMobile ? 'smooth' : 'high'
  );

  const constellationPoints = useMemo<[number, number, number][]>(
    () => CONSTELLATION_STARS.map((s) => s.pos),
    []
  );

  // 3D Orbital Coordinates for Volumetric Crystals (Multi-level Y and Radius)
  const crystalPositions = useMemo(
    () => [
      [-5.2, 0.4, 3.2] as [number, number, number],
      [4.8, 0.8, 3.0] as [number, number, number],
      [0.8, -3.2, -4.2] as [number, number, number],
      [-3.0, 3.2, 3.8] as [number, number, number],
    ],
    []
  );

  // Render photo memory crystals only when user has actually uploaded photos
  const memoryItems = useMemo(() => {
    const uploaded = config.images || [];
    if (uploaded.length > 0) {
      return uploaded.slice(0, 4).map((img, i) => ({
        img,
        quote: SAMPLE_GALAXY_QUOTES[i % SAMPLE_GALAXY_QUOTES.length],
      }));
    }
    return [];
  }, [config.images]);

  const handleStarClick = (index: number) => {
    soundFx.playShootingStar();
    const star = CONSTELLATION_STARS[index];
    setTargetFocusPos(star.pos);
    setSelectedStarIndex(index);
    setSelectedImage(null);
    setInspectFlipped(false);
    setStarLit(false);

    setTimeout(() => {
      setShowContent(true);
      soundFx.playSuccessChime();
    }, 380);
  };

  const handleCrystalClick = (img: string | undefined, pos: [number, number, number]) => {
    soundFx.playPaperSwoosh();
    setTargetFocusPos(pos);
    setSelectedImage(img || 'fallback');
    setSelectedStarIndex(null);
    setInspectFlipped(false);

    setTimeout(() => {
      setShowContent(true);
    }, 350);
  };

  const handleDismissModal = () => {
    soundFx.playPaperSwoosh();
    setShowContent(false);
    setSelectedStarIndex(null);
    setSelectedImage(null);
    setTargetFocusPos(null);
    setInspectFlipped(false);
    setStarLit(false);
  };

  const handleIlluminateStar = () => {
    soundFx.playSuccessChime();
    setStarLit(true);
    confetti({
      particleCount: 50,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#FBBF24', '#FB7185', '#C084FC', '#38BDF8', '#FFFFFF'],
      shapes: ['star', 'circle'],
    });
  };

  const currentStar =
    selectedStarIndex !== null ? CONSTELLATION_STARS[selectedStarIndex] : null;

  return (
    <div
      onPointerDown={() => setHasInteracted(true)}
      className={`relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing ${
        mode === 'recipient'
          ? 'h-screen min-h-screen bg-slate-950'
          : 'h-full min-h-[520px] sm:min-h-[620px] bg-slate-950'
      }`}
    >
      {/* Top Left: Graphics Quality Toggle */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button
          onClick={() => {
            soundFx.playPinClick();
            setGraphicsQuality((prev) => (prev === 'high' ? 'smooth' : 'high'));
          }}
          className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 hover:border-purple-400 transition-colors shadow-lg"
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>Đồ họa: {graphicsQuality === 'high' ? 'Cao cấp (4000 sao)' : 'Mượt mà (1200 sao)'}</span>
        </button>

        <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-950/70 border border-purple-500/30 text-purple-200 text-[11px] font-semibold">
          <Compass className="w-3.5 h-3.5 text-amber-300" />
          <span>7 Chòm Sao 20/10</span>
        </div>
      </div>

      {/* 3D Orbit Canvas with Full 360-Degree Exploration */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 3, 11], fov: 60 }}>
          <ambientLight intensity={0.45} />
          <pointLight position={[15, 15, 15]} intensity={1.5} color="#C084FC" />
          <pointLight position={[-15, -15, -15]} intensity={1.2} color="#FB7185" />
          <pointLight position={[0, 0, 0]} intensity={2.0} color="#F43F5E" />

          {/* Central Luminous Core Star */}
          <GalacticCoreStar recipientName={config.recipientName} />

          {/* Glowing Planetary Orbit Rings */}
          <OrbitRing radius={5.8} tilt={0.15} color="#ec4899" />
          <OrbitRing radius={8.4} tilt={-0.22} color="#a855f7" />
          <OrbitRing radius={11.2} tilt={0.09} color="#38bdf8" />

          {/* 3D Constellation Starlight Network Lines */}
          <ConstellationWeb points={constellationPoints} />

          {/* Deep Space Stars & Two-Arm Spiral Dust (100% Round Realistic Starfield) */}
          <RealisticDeepSpaceField count={graphicsQuality === 'high' ? 3500 : 1200} />
          <CosmicSpiralArms count={graphicsQuality === 'high' ? 1200 : 450} />
          <ShootingStar />

          {/* Camera Smooth Lerp Rig */}
          <CameraRig targetPos={targetFocusPos} isZoomed={showContent} />

          {/* 💎 7 Upgraded 3D High-Precision Constellation Stars */}
          {CONSTELLATION_STARS.map((star, i) => (
            <HighPrecisionStarNode
              key={star.name}
              position={star.pos}
              label={star.name}
              icon={star.symbol}
              color={star.color}
              secondaryColor={star.secondaryColor}
              onClick={() => handleStarClick(i)}
              hidden={showContent}
            />
          ))}

          {/* Volumetric Double-Sided 3D Memory Crystals */}
          {memoryItems.map((item, i) => {
            const pos = crystalPositions[i % crystalPositions.length];
            return (
              <VolumetricMemoryCrystal
                key={i}
                position={pos}
                imageUrl={item.img}
                index={i}
                recipientName={config.recipientName}
                senderName={config.senderName}
                quoteText={item.quote}
                onClick={() => handleCrystalClick(item.img, pos)}
                hidden={showContent}
              />
            );
          })}

          {/* True 360-degree Orbit & Swipe Drag Controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            rotateSpeed={0.85}
            zoomSpeed={0.9}
            panSpeed={0.5}
            minDistance={3.5}
            maxDistance={26}
            enabled={!showContent}
          />
        </Canvas>
      </div>

      {/* Navigation Guide Pill (Auto fades once user starts exploring) */}
      {!showContent && !hasInteracted && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute bottom-16 sm:bottom-20 inset-x-0 flex flex-col items-center z-20 pointer-events-none px-4"
        >
          <div className="px-5 py-2.5 rounded-full bg-slate-900/85 backdrop-blur-xl border border-white/20 text-white text-xs font-bold flex items-center gap-2 shadow-2xl text-center">
            <Rotate3d className="w-4 h-4 text-purple-400 animate-spin" />
            <span>Kéo xoay 360° • Chạm vào các vì sao để khám phá ✨</span>
          </div>
        </motion.div>
      )}

      {/* 3D Close-up Inspection Modal with Flip 3D Feature (Portaled to document.body to prevent clipping) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showContent && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 25 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 25 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                  className="bg-slate-900/95 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl max-w-md w-full border border-purple-500/40 shadow-[0_0_60px_rgba(192,132,252,0.35)] text-center space-y-4"
                >
                  {/* Photo Crystal Inspection */}
                  {selectedImage !== null ? (
                    <div className="space-y-4" style={{ perspective: '1200px' }}>
                      <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-rose-400" />
                          <span>{inspectFlipped ? 'Mặt Sau: Lời Khắc Kính' : 'Mặt Trước: Ảnh Kỷ Niệm'}</span>
                        </span>
                        <button
                          onClick={() => {
                            soundFx.playPinClick();
                            setInspectFlipped(!inspectFlipped);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-600/70 hover:bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Lật Mặt 3D</span>
                        </button>
                      </div>

                      {/* Flipped Content Card */}
                      <div
                        className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-purple-400/50 shadow-2xl"
                        style={{
                          transform: inspectFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                          transformStyle: 'preserve-3d',
                          transition: 'transform 0.75s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        {/* Front: High-res Photo */}
                        <div
                          className="absolute inset-0 bg-slate-950 flex items-center justify-center"
                          style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                          }}
                        >
                          {selectedImage !== 'fallback' ? (
                            <img src={selectedImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="p-6 text-center space-y-2">
                              <div className="text-5xl animate-bounce">💎</div>
                              <h4 className="text-lg font-bold text-rose-300">Pha Lê Kỷ Niệm</h4>
                              <p className="text-xs text-purple-200">
                                Khoảnh khắc yêu thương dành riêng cho {config.recipientName || 'Người Thương'}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Back: Engraved Cosmic Glass Wish */}
                        <div
                          className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 p-6 flex flex-col justify-between text-center"
                          style={{
                            transform: 'rotateY(180deg)',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                          }}
                        >
                          <div className="text-[11px] font-extrabold uppercase tracking-widest text-rose-400 bg-rose-500/10 py-1 rounded-full border border-rose-500/20">
                            Thông Điệp Khắc Sau Pha Lê
                          </div>
                          <p className="text-sm sm:text-base leading-relaxed text-purple-100 font-sans italic my-auto">
                            "{config.mainText}"
                          </p>
                          <p className="text-xs font-bold text-rose-300 italic text-right">
                            — {config.senderName || 'Người gửi'} 🌹
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : currentStar !== null ? (
                    /* 💎 Specialized Constellation Star Modal */
                    <div className="space-y-4">
                      {/* Star Icon Badge */}
                      <div
                        className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl shadow-xl transition-transform"
                        style={{
                          background: `linear-gradient(135deg, ${currentStar.color}, #1e1b4b)`,
                          boxShadow: `0 0 35px ${currentStar.color}66`,
                        }}
                      >
                        <span>{currentStar.symbol}</span>
                      </div>

                      <div>
                        <span
                          className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border"
                          style={{
                            color: currentStar.color,
                            borderColor: `${currentStar.color}55`,
                            background: `${currentStar.color}15`,
                          }}
                        >
                          {currentStar.name}
                        </span>
                        <h3
                          className="text-xl sm:text-2xl font-black text-white mt-2"
                          style={{ fontFamily: config.fontFamily || 'Playfair Display' }}
                        >
                          Tặng {config.recipientName || 'Người Thương'} 20/10
                        </h3>
                        <p className="text-xs text-purple-200/80 mt-1">
                          {currentStar.meaning}
                        </p>
                      </div>

                      {/* Star Dedication Message */}
                      <div className="bg-purple-950/60 p-4 sm:p-5 rounded-2xl border border-purple-500/30 text-left font-sans shadow-inner space-y-2">
                        <p className="text-purple-100 text-sm leading-relaxed whitespace-pre-line italic">
                          "{currentStar.blessing}"
                        </p>
                        <p className="text-xs text-rose-300 font-sans font-bold pt-2 border-t border-white/10 text-right">
                          Lời chúc từ: {config.senderName || 'Người gửi'} 🌹
                        </p>
                      </div>

                      {/* Interactive Button: Illuminate Star */}
                      <button
                        onClick={handleIlluminateStar}
                        className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                        style={{
                          background: starLit
                            ? 'linear-gradient(to right, #10b981, #059669)'
                            : `linear-gradient(to right, ${currentStar.color}, #9333ea)`,
                          color: '#ffffff',
                        }}
                      >
                        <Star className="w-4 h-4 fill-white" />
                        <span>{starLit ? `✨ ${currentStar.name} Đang Tỏa Sáng Rực Rỡ!` : `Thắp Sáng ${currentStar.name}`}</span>
                      </button>
                    </div>
                  ) : null}

                  {/* Back to Galaxy Button */}
                  <button
                    onClick={handleDismissModal}
                    className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Tiếp Tục Xoay Ngắm Bầu Trời</span>
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
