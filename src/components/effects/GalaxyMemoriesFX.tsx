import { useRef, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Star,
  CheckCircle2,
  Wand2,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

/* ═══════════════════════════════════════════════════════════════════════
   ROMANTIC FALLBACK MEMORY IMAGES (High-Res, Aesthetic & Inspiring)
   ═══════════════════════════════════════════════════════════════════════ */
const DEFAULT_MEMORY_IMAGES = [
  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=700&auto=format&fit=crop&q=80', // Nắm tay ngọt ngào
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&auto=format&fit=crop&q=80', // Hoa hồng pha lê lung linh
  'https://images.unsplash.com/photo-1513297887119-d46091b24bfa?w=700&auto=format&fit=crop&q=80', // Ánh đèn nến ấm áp
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=700&auto=format&fit=crop&q=80', // Khoảnh khắc yêu thương
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=700&auto=format&fit=crop&q=80', // Trái tim ánh sáng lấp lánh
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=700&auto=format&fit=crop&q=80', // Tinh thể pha lê lộng lẫy
];

const SAMPLE_GALAXY_QUOTES = [
  'Mỗi khoảnh khắc có em là một vì sao sáng lấp lánh trong vũ trụ của anh.',
  'Em là định mệnh ngọt ngào nhất mà cuộc đời đã ban tặng.',
  'Dù vũ trụ có bao la đến đâu, trái tim anh vẫn luôn hướng về em.',
  'Chúc em ngày 20/10 ngập tràn nụ cười, hạnh phúc và vạn sự như ý!',
  'Cảm ơn em vì đã mang đến ấm áp và diệu kỳ cho cả thế giới của anh.',
  'Tình yêu này tựa ngân hà vô tận, mãi mãi tỏa sáng vì em.',
];

/* ═══════════════════════════════════════════════════════════════════════
   PROCEDURAL SILKY ASTRONOMICAL TEXTURES (Gaussian Glow Falloffs)
   ═══════════════════════════════════════════════════════════════════════ */
let cachedRoundStarTexture: THREE.CanvasTexture | null = null;
let cachedStarFlareTexture: THREE.CanvasTexture | null = null;
let cachedNebulaTexture: THREE.CanvasTexture | null = null;

function getRoundStarTexture(): THREE.CanvasTexture {
  if (cachedRoundStarTexture) return cachedRoundStarTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = 64;
    const cy = 64;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.12, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.35, 'rgba(235, 245, 255, 0.6)');
    grad.addColorStop(0.65, 'rgba(168, 195, 255, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
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

    // Corona aura
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.08, 'rgba(255, 255, 255, 0.98)');
    grad.addColorStop(0.22, 'rgba(245, 235, 255, 0.65)');
    grad.addColorStop(0.48, 'rgba(200, 160, 255, 0.22)');
    grad.addColorStop(0.85, 'rgba(130, 90, 255, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // High precision diffraction spikes
    const drawSpike = (angle: number, length: number, width: number, opacity: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const spikeGrad = ctx.createLinearGradient(0, -width, length, 0);
      spikeGrad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      spikeGrad.addColorStop(0.25, `rgba(255, 240, 250, ${opacity * 0.75})`);
      spikeGrad.addColorStop(0.65, `rgba(220, 190, 255, ${opacity * 0.3})`);
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

    drawSpike(0, 124, 7, 0.95);
    drawSpike(Math.PI / 2, 124, 7, 0.95);
    drawSpike(Math.PI / 4, 78, 4, 0.5);
    drawSpike(-Math.PI / 4, 78, 4, 0.5);
  }
  cachedStarFlareTexture = new THREE.CanvasTexture(canvas);
  cachedStarFlareTexture.generateMipmaps = true;
  return cachedStarFlareTexture;
}

function getNebulaCloudTexture(): THREE.CanvasTexture {
  if (cachedNebulaTexture) return cachedNebulaTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = 64;
    const cy = 64;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(0.25, 'rgba(235, 210, 255, 0.45)');
    grad.addColorStop(0.6, 'rgba(160, 110, 240, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  cachedNebulaTexture = new THREE.CanvasTexture(canvas);
  return cachedNebulaTexture;
}

/* ═══════════════════════════════════════════════════════════════════════
   DEEP SPACE VOLUMETRIC NEBULA CLOUDS (Atmospheric Cosmic Fog)
   ═══════════════════════════════════════════════════════════════════════ */
function VolumetricNebulaClouds() {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useMemo(() => getNebulaCloudTexture(), []);

  const clouds = useMemo(
    () => [
      { pos: [-16, 6, -20], scale: 38, color: '#ec4899', rot: 0.1 },
      { pos: [18, -8, -22], scale: 42, color: '#8b5cf6', rot: -0.2 },
      { pos: [0, 14, -25], scale: 36, color: '#38bdf8', rot: 0.15 },
      { pos: [-20, -12, -18], scale: 40, color: '#d946ef', rot: -0.1 },
      { pos: [14, 16, -19], scale: 32, color: '#f59e0b', rot: 0.05 },
      { pos: [0, -4, -12], scale: 28, color: '#6366f1', rot: 0.08 },
    ],
    []
  );

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.0018;
    }
  });

  return (
    <group ref={groupRef}>
      {clouds.map((c, i) => (
        <sprite key={i} position={c.pos as [number, number, number]} scale={[c.scale, c.scale, 1]}>
          <spriteMaterial
            map={texture}
            color={c.color}
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DEEP SPACE BACKGROUND STARS (Infinite Cosmic Depth)
   ═══════════════════════════════════════════════════════════════════════ */
function DeepCosmosField({ count = 2800 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const texture = useMemo(() => getRoundStarTexture(), []);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const starColors = [
      [0.85, 0.92, 1.0], // Ice Blue
      [0.99, 0.99, 1.0], // Diamond White
      [1.0, 0.96, 0.88], // Warm Gold Starlight
      [1.0, 0.84, 0.7],  // Sunset Amber
      [1.0, 0.75, 0.88], // Rose Starlight
      [0.72, 0.85, 1.0], // Celestial Blue
    ];

    for (let i = 0; i < count; i++) {
      const radius = 50 + Math.random() * 60;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const c = starColors[Math.floor(Math.random() * starColors.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.002;
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
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   4-ARM HIGH-PRECISION LOGARITHMIC SPIRAL GALAXY (Volumetric Depth)
   ═══════════════════════════════════════════════════════════════════════ */
function RealisticSpiralGalaxy({ count = 9000 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const texture = useMemo(() => getRoundStarTexture(), []);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const arms = 4;
    const maxRadius = 18.0;

    // Palette with cosmic spectral gradients
    const colorInside = new THREE.Color('#fff7ed'); // Warm incandescent core
    const colorMidCyan = new THREE.Color('#38bdf8'); // Stellar blue arm ridges
    const colorMidMagenta = new THREE.Color('#ec4899'); // Glowing rose nebula
    const colorOuterPurple = new THREE.Color('#a855f7'); // Interstellar violet
    const colorOuterEdge = new THREE.Color('#6366f1'); // Deep cosmic indigo

    for (let i = 0; i < count; i++) {
      // Logarithmic spiral distribution
      const rRatio = Math.pow(Math.random(), 1.45);
      const r = 0.5 + rRatio * maxRadius;

      // Arm assignment
      const armIndex = i % arms;
      const armAngle = (armIndex / arms) * Math.PI * 2;

      // Logarithmic spiral curve
      const spinAngle = r * 0.42;

      // Filamentary cluster dispersion (clusters concentrate near arm axis)
      const spread = (Math.pow(Math.random(), 2.8) * 1.5 + 0.15) * (r * 0.28);
      const spreadAngle = (Math.random() - 0.5) * spread;

      const finalAngle = armAngle + spinAngle + spreadAngle;

      // Volumetric thickness: Thick galactic bulge at center, thin disc on arms
      const bulgeHeight = Math.exp(-r / 3.0) * 2.2;
      const discHeight = (Math.random() - 0.5) * (0.45 + r * 0.05);
      const y = (Math.random() - 0.5) * bulgeHeight + discHeight;

      pos[i * 3] = Math.cos(finalAngle) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(finalAngle) * r;

      // Color interpolation according to distance from core
      const t = r / maxRadius;
      const c = new THREE.Color();

      if (t < 0.2) {
        c.lerpColors(colorInside, colorMidCyan, t / 0.2);
      } else if (t < 0.5) {
        c.lerpColors(colorMidCyan, colorMidMagenta, (t - 0.2) / 0.3);
      } else if (t < 0.8) {
        c.lerpColors(colorMidMagenta, colorOuterPurple, (t - 0.5) / 0.3);
      } else {
        c.lerpColors(colorOuterPurple, colorOuterEdge, (t - 0.8) / 0.2);
      }

      // Add random starlight sparkle variation
      const sparkle = 0.85 + Math.random() * 0.35;
      col[i * 3] = Math.min(1, c.r * sparkle);
      col[i * 3 + 1] = Math.min(1, c.g * sparkle);
      col[i * 3 + 2] = Math.min(1, c.b * sparkle);
    }

    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      // Fluid differential rotation
      mesh.current.rotation.y = state.clock.elapsedTime * 0.024;
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.008) * 0.035;
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
        opacity={0.92}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CELESTIAL ASTROLABE PLANE (Ancient Cosmic Map Rings & Coordinate Grid)
   ═══════════════════════════════════════════════════════════════════════ */
function CelestialAstrolabeGrid() {
  const groupRef = useRef<THREE.Group>(null);

  const circles = useMemo(() => [5.2, 8.8, 12.4, 16.0], []);

  const radialLines = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(Math.cos(angle) * 3.5, 0, Math.sin(angle) * 3.5),
        new THREE.Vector3(Math.cos(angle) * 16.5, 0, Math.sin(angle) * 16.5)
      );
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: '#c084fc',
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.LineSegments(geo, mat);
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * -0.003;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      <primitive object={radialLines} />
      {circles.map((radius, idx) => {
        const pts: THREE.Vector3[] = [];
        const segs = 120;
        for (let i = 0; i <= segs; i++) {
          const theta = (i / segs) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({
          color: idx % 2 === 0 ? '#f472b6' : '#38bdf8',
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
        });
        const line = new THREE.Line(geo, mat);
        return <primitive key={idx} object={line} />;
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   LUMINOUS GALACTIC CORE & POLAR PLASMA BEAMS (Trọng Tâm Vũ Trụ)
   ═══════════════════════════════════════════════════════════════════════ */
function LuminousGalacticCore({ recipientName }: { recipientName: string }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const flareTexture = useMemo(() => getStarFlareTexture(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 2.8) * 0.09;
      coreRef.current.scale.setScalar(pulse);
      coreRef.current.rotation.y = t * 0.2;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.z = t * 0.45;
      ringRef1.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.4) * 0.08;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z = -t * 0.38;
      ringRef2.current.rotation.y = Math.PI / 4 + Math.cos(t * 0.5) * 0.08;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Primary White-Hot Diffraction Flare */}
      <sprite scale={[7.2, 7.2, 1]}>
        <spriteMaterial
          map={flareTexture}
          color="#ffffff"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* 2. Secondary Magenta/Rose Corona Halo */}
      <sprite scale={[5.0, 5.0, 1]}>
        <spriteMaterial
          map={flareTexture}
          color="#fb7185"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* 3. Golden Heart Energy Halo */}
      <sprite scale={[3.2, 3.2, 1]}>
        <spriteMaterial
          map={flareTexture}
          color="#fef08a"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* 4. Central Stellar Sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.05, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#fb7185"
          emissiveIntensity={4.2}
          roughness={0.05}
        />
      </mesh>

      {/* 5. Pulsing Volumetric Atmosphere */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial
          color="#f43f5e"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 6. Rotating Celestial Relativistic Accretion Rings */}
      <mesh ref={ringRef1}>
        <torusGeometry args={[2.0, 0.025, 16, 80]} />
        <meshBasicMaterial color="#fde047" transparent opacity={0.65} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ringRef2}>
        <torusGeometry args={[2.45, 0.018, 16, 80]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={0.55} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* 7. Polar Relativistic Plasma Beams (Jets) */}
      <group>
        <mesh position={[0, 3.5, 0]}>
          <cylinderGeometry args={[0.04, 0.18, 7.0, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, -3.5, 0]}>
          <cylinderGeometry args={[0.18, 0.04, 7.0, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* 8. Luminous Galactic Core Name Tag */}
      <Html position={[0, -2.1, 0]} center distanceFactor={14}>
        <div className="px-3.5 py-1 rounded-full bg-slate-950/90 backdrop-blur-md border border-rose-400/50 text-[11px] font-extrabold text-rose-200 shadow-[0_0_20px_rgba(251,113,133,0.45)] pointer-events-none whitespace-nowrap flex items-center gap-1.5 select-none">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
          <span>Tâm Vũ Trụ: {recipientName || 'Người Thương'}</span>
        </div>
      </Html>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   3D FACETED PHOTO MEMORY CRYSTAL PRISM (Khối Pha Lê Kỷ Niệm 3D Chân Thực)
   ═══════════════════════════════════════════════════════════════════════ */
function VolumetricPhotoCrystal({
  position,
  imageUrl,
  index,
  recipientName,
  onClick,
}: {
  position: [number, number, number];
  imageUrl: string;
  index: number;
  recipientName: string;
  onClick: () => void;
}) {
  const crystalRef = useRef<THREE.Group>(null);
  const gemMeshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const flareTexture = useMemo(() => getStarFlareTexture(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (crystalRef.current) {
      // Harmonic floating bobbing
      crystalRef.current.position.y =
        position[1] + Math.sin(t * 1.5 + index * 1.3) * 0.28;
    }
    if (gemMeshRef.current) {
      // Slow tumbling crystal reflection
      gemMeshRef.current.rotation.y = t * 0.45 + index;
      gemMeshRef.current.rotation.x = Math.sin(t * 0.35 + index) * 0.2;
    }
  });

  return (
    <group ref={crystalRef} position={position}>
      <Float speed={2.0} rotationIntensity={0.2} floatIntensity={0.4}>
        {/* Clickable 3D Gemstone Prism */}
        <group
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
        >
          {/* 1. Starlight Corona Glow on Hover */}
          <sprite scale={hovered ? [3.8, 3.8, 1] : [2.6, 2.6, 1]}>
            <spriteMaterial
              map={flareTexture}
              color={hovered ? '#f43f5e' : '#c084fc'}
              transparent
              opacity={hovered ? 0.95 : 0.65}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>

          {/* 2. 3D Faceted Crystal Body (Bipyramidal Octahedron) */}
          <group ref={gemMeshRef} scale={hovered ? [1.15, 1.15, 1.15] : [1, 1, 1]}>
            {/* Outer Gem Glass Shell */}
            <mesh
              scale={[0.85, 1.35, 0.85]}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <octahedronGeometry args={[1.0, 0]} />
              <meshPhysicalMaterial
                color="#f8fafc"
                emissive={hovered ? '#fb7185' : '#818cf8'}
                emissiveIntensity={hovered ? 1.6 : 0.65}
                roughness={0.05}
                metalness={0.1}
                transmission={0.82}
                thickness={1.2}
                transparent
                opacity={0.88}
                wireframe={false}
              />
            </mesh>

            {/* Radiant Crystal Facet Wireframe Edge Outlines */}
            <mesh
              scale={[0.86, 1.36, 0.86]}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <octahedronGeometry args={[1.0, 0]} />
              <meshBasicMaterial
                color={hovered ? '#ffffff' : '#38bdf8'}
                wireframe
                transparent
                opacity={hovered ? 0.9 : 0.45}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>

          {/* 3. Floating 3D Crystal Memory Tag with Glassmorphic Preview */}
          <Html position={[0, 0, 0]} center distanceFactor={11}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className={`cursor-pointer transition-all duration-300 transform select-none ${
                hovered ? 'scale-110 -translate-y-1' : 'scale-95 opacity-90'
              }`}
            >
              {/* Floating Glassmorphic Crystal Card */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="cursor-pointer relative w-28 sm:w-32 h-36 sm:h-40 rounded-2xl p-1.5 bg-slate-950/85 backdrop-blur-xl border border-purple-400/50 shadow-[0_10px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(192,132,252,0.35)] flex flex-col justify-between overflow-hidden group hover:border-rose-400/80 transition-colors"
              >
                {/* Iridescent shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/15 via-transparent to-rose-500/25 pointer-events-none" />

                {/* Top Badge */}
                <div className="flex items-center justify-between text-[9px] font-extrabold text-purple-200 z-10 px-1 pointer-events-none">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-rose-400" />
                    <span>Pha Lê #{index + 1}</span>
                  </span>
                  <span className="text-[8px] text-amber-300">💎 3D</span>
                </div>

                {/* Center Image */}
                <div className="flex-1 my-1 rounded-xl overflow-hidden bg-slate-900 border border-white/10 relative shadow-inner flex items-center justify-center pointer-events-none">
                  <img
                    src={imageUrl}
                    alt=""
                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Bottom Caption */}
                <div className="text-center z-10 pointer-events-none">
                  <p className="text-[9px] font-bold text-rose-300 truncate">
                    {recipientName || 'Người Thương'}
                  </p>
                </div>
              </div>
            </div>
          </Html>
        </group>
      </Float>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   7 CELESTIAL CONSTELLATION STARS (Chòm Sao 20/10 Tỏa Sáng Tự Nhiên)
   ═══════════════════════════════════════════════════════════════════════ */
interface ConstellationStarData {
  id: string;
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
    id: 'star-1',
    pos: [-5.2, 2.2, -3.0],
    name: 'Sao Hạnh Phúc',
    symbol: '⭐',
    color: '#FB7185',
    secondaryColor: '#fef08a',
    meaning: 'Ánh sáng của nụ cười, niềm vui và sự lạc quan yêu đời',
    blessing: 'Chúc bạn mỗi sớm mai thức dậy đều đón nhận nụ cười rạng rỡ, trọn vẹn niềm vui và ngập tràn hạnh phúc bất tận.',
  },
  {
    id: 'star-2',
    pos: [4.8, -1.8, -3.2],
    name: 'Sao Yêu Thương',
    symbol: '💖',
    color: '#F43F5E',
    secondaryColor: '#fda4af',
    meaning: 'Tình cảm nồng thắm, sự chân thành và nâng niu vô điều kiện',
    blessing: 'Mong bạn luôn được che chở trong tình yêu thương ấm áp, luôn có một bờ vai vững chãi đồng hành cùng bạn.',
  },
  {
    id: 'star-3',
    pos: [-3.0, -3.0, 3.2],
    name: 'Sao Rực Rỡ',
    symbol: '🌹',
    color: '#C084FC',
    secondaryColor: '#e9d5ff',
    meaning: 'Nhan sắc kiêu sa, khí chất tự tin và tỏa sáng của phái nữ',
    blessing: 'Chúc người phụ nữ tuyệt vời ngày 20/10 luôn kiêu hãnh, tự tin và ngát hương như đóa hồng nhung nở giữa trời đêm.',
  },
  {
    id: 'star-4',
    pos: [3.8, 3.4, 2.0],
    name: 'Sao Kiêu Hãnh',
    symbol: '👑',
    color: '#FBBF24',
    secondaryColor: '#ffffff',
    meaning: 'Sự thông tuệ, bản lĩnh và thành công rực rỡ',
    blessing: 'Chúc bạn gặt hái thêm nhiều thành công vượt bậc, luôn là người phụ nữ độc lập, quyến rũ và tỏa sáng ở mọi nơi bạn bước tới.',
  },
  {
    id: 'star-5',
    pos: [0.8, 4.4, -2.8],
    name: 'Sao Ước Nguyện',
    symbol: '✨',
    color: '#38BDF8',
    secondaryColor: '#bae6fd',
    meaning: 'Mọi ước vọng sâu thẳm đều trở thành hiện thực',
    blessing: 'Gửi ngàn ước nguyện tốt lành nhất qua dải thiên hà: chúc mọi hoài bão và mong ước của bạn đều nở hoa rực rỡ.',
  },
  {
    id: 'star-6',
    pos: [-4.2, -1.0, -4.6],
    name: 'Sao Tri Kỷ',
    symbol: '💫',
    color: '#A855F7',
    secondaryColor: '#f472b6',
    meaning: 'Sự thấu hiểu, đồng hành và gắn kết keo sơn',
    blessing: 'Cảm ơn vì đã luôn có mặt trong cuộc đời tôi, lắng nghe và chia sẻ mọi khoảnh khắc buồn vui quý giá.',
  },
  {
    id: 'star-7',
    pos: [2.6, -4.0, 1.2],
    name: 'Sao Bình An',
    symbol: '🌙',
    color: '#34D399',
    secondaryColor: '#a7f3d0',
    meaning: 'Tâm hồn thư thái, an yên và thanh bình',
    blessing: 'Chúc tâm hồn bạn luôn như mặt hồ êm ả, bình yên trước bão giông và luôn cảm nhận được sự dịu dàng của cuộc sống.',
  },
];

function ConstellationBeaconNode({
  star,
  isLit,
  onClick,
}: {
  star: ConstellationStarData;
  isLit: boolean;
  onClick: () => void;
}) {
  const starMesh = useRef<THREE.Mesh>(null);
  const flareRef = useRef<THREE.Sprite>(null);
  const flareTexture = useMemo(() => getStarFlareTexture(), []);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const offset = star.pos[0] * 1.5 + star.pos[1];

    if (starMesh.current) {
      const pulse = (isLit ? 1.3 : 1.0) + Math.sin(t * 3.5 + offset) * 0.12;
      starMesh.current.scale.setScalar(pulse);
      starMesh.current.rotation.y = t * 1.2 + offset;
    }

    if (flareRef.current) {
      const baseScale = isLit ? 3.4 : 2.5;
      const flareScale = baseScale + Math.sin(t * 3.0 + offset) * 0.35;
      flareRef.current.scale.set(flareScale, flareScale, 1);
    }
  });

  return (
    <Float speed={2.2} rotationIntensity={0.2} floatIntensity={0.35}>
      <group position={star.pos}>
        {/* Interactive Starlight Trigger */}
        <group
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
        >
          {/* 1. Diffraction Flare */}
          <sprite ref={flareRef} scale={[2.6, 2.6, 1]}>
            <spriteMaterial
              map={flareTexture}
              color={isLit ? '#ffffff' : star.secondaryColor}
              transparent
              opacity={isLit ? 0.95 : 0.85}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>

          {/* 2. Secondary Chromatic Halo */}
          <sprite scale={[1.8, 1.8, 1]}>
            <spriteMaterial
              map={flareTexture}
              color={star.color}
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>

          {/* 3. 3D Faceted Octahedron Gem Core */}
          <mesh
            ref={starMesh}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <octahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={isLit ? '#ffffff' : star.color}
              emissiveIntensity={isLit ? 4.5 : 3.0}
              roughness={0.1}
            />
          </mesh>

          {/* 4. Delicate Starlight Title Tag (Subtle, Clean & Non-Intrusive) */}
          <Html position={[0, -0.65, 0]} center distanceFactor={13}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className={`cursor-pointer px-2.5 py-1 rounded-full border transition-all duration-300 flex items-center gap-1.5 select-none whitespace-nowrap shadow-xl ${
                hovered
                  ? 'scale-110 bg-slate-900/95 border-rose-400 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.45)]'
                  : isLit
                  ? 'bg-amber-950/85 border-amber-400/80 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                  : 'bg-slate-950/80 border-white/15 text-white/90'
              }`}
            >
              <span className="text-xs">{star.symbol}</span>
              <span className="text-[10px] font-bold">{star.name}</span>
              {isLit && <span className="text-[9px] text-amber-300">★</span>}
            </div>
          </Html>
        </group>
      </group>
    </Float>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CONSTELLATION WEB (Laser-Thin Starlight Connecting Major Stars)
   ═══════════════════════════════════════════════════════════════════════ */
function ConstellationStarLines({ points }: { points: [number, number, number][] }) {
  const lineObject = useMemo(() => {
    const linePts: THREE.Vector3[] = [];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      linePts.push(new THREE.Vector3(...p1), new THREE.Vector3(...p2));
    }
    if (points.length >= 4) {
      linePts.push(new THREE.Vector3(...points[0]), new THREE.Vector3(...points[3]));
      linePts.push(new THREE.Vector3(...points[1]), new THREE.Vector3(...points[4 % points.length]));
      linePts.push(new THREE.Vector3(...points[2]), new THREE.Vector3(...points[5 % points.length]));
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

/* ═══════════════════════════════════════════════════════════════════════
   SHOOTING STARS / METEORS (Ion Glowing Tails)
   ═══════════════════════════════════════════════════════════════════════ */
function CosmicShootingStar() {
  const headRef = useRef<THREE.Group>(null);
  const [active, setActive] = useState(false);
  const startPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());

  const tailGeo = useMemo(() => {
    const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(3.2, 3.2, 1.2)];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const tailMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(() => {
    const triggerMeteor = () => {
      startPos.current.set(
        (Math.random() - 0.5) * 42,
        14 + Math.random() * 8,
        (Math.random() - 0.5) * 25
      );
      velocity.current.set(-18 - Math.random() * 10, -18 - Math.random() * 8, -8);
      if (headRef.current) {
        headRef.current.position.copy(startPos.current);
      }
      setActive(true);

      setTimeout(() => {
        setActive(false);
      }, 850);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.3) {
        triggerMeteor();
      }
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  useFrame((_, delta) => {
    if (active && headRef.current) {
      headRef.current.position.addScaledVector(velocity.current, delta);
    }
  });

  return (
    <group ref={headRef} visible={active}>
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <primitive object={new THREE.Line(tailGeo, tailMat)} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SMOOTH CINEMATIC CAMERA RIG (Lerps to Focused Object)
   ═══════════════════════════════════════════════════════════════════════ */
function CameraController({
  targetPos,
  isZoomed,
}: {
  targetPos: [number, number, number] | null;
  isZoomed: boolean;
}) {
  const { camera } = useThree();
  const zoomTarget = useMemo(() => new THREE.Vector3(), []);
  const defaultPos = useMemo(() => new THREE.Vector3(0, 4.5, 13.5), []);
  const returningRef = useRef(false);

  useEffect(() => {
    if (!isZoomed && targetPos === null) {
      returningRef.current = true;
    }
  }, [isZoomed, targetPos]);

  useFrame(() => {
    if (isZoomed && targetPos) {
      returningRef.current = false;
      zoomTarget.set(targetPos[0] * 0.75, targetPos[1] * 0.75 + 0.4, targetPos[2] + 3.2);
      camera.position.lerp(zoomTarget, 0.06);
    } else if (returningRef.current) {
      camera.position.lerp(defaultPos, 0.05);
      if (camera.position.distanceTo(defaultPos) < 0.15) {
        returningRef.current = false;
      }
    }
  });

  return null;
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN GALAXY MEMORIES COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export default function GalaxyMemoriesFX({ config }: Props) {
  const [selectedStarIndex, setSelectedStarIndex] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<string>('');
  const [targetFocusPos, setTargetFocusPos] = useState<[number, number, number] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [inspectFlipped, setInspectFlipped] = useState(false);
  const [litStarIds, setLitStarIds] = useState<Set<string>>(new Set());

  const constellationPoints = useMemo<[number, number, number][]>(
    () => CONSTELLATION_STARS.map((s) => s.pos),
    []
  );

  // Position 6 3D memory crystals gracefully along the spiral arms
  const crystalPositions = useMemo<[number, number, number][]>(
    () => [
      [-6.5, 0.5, 3.2],
      [5.8, 0.8, 3.8],
      [1.2, -3.8, -4.5],
      [-3.8, 3.6, 4.2],
      [6.8, -2.4, -2.2],
      [-5.5, -2.8, -3.8],
    ],
    []
  );

  // Harmonize user uploaded photos with fallback photos so galaxy is always filled
  const memoryItems = useMemo(() => {
    const uploaded = config.images || [];
    const pool = uploaded.length > 0 ? uploaded : DEFAULT_MEMORY_IMAGES;

    return crystalPositions.map((pos, i) => {
      const img = pool[i % pool.length];
      const quote = SAMPLE_GALAXY_QUOTES[i % SAMPLE_GALAXY_QUOTES.length];
      return { pos, img, quote };
    });
  }, [config.images, crystalPositions]);

  const handleCrystalClick = (img: string, quote: string, pos: [number, number, number]) => {
    soundFx.playPaperSwoosh();
    setTargetFocusPos(pos);
    setSelectedImage(img);
    setSelectedQuote(quote);
    setSelectedStarIndex(null);
    setInspectFlipped(false);

    setTimeout(() => {
      setShowModal(true);
    }, 320);
  };

  const handleStarClick = (index: number) => {
    soundFx.playShootingStar();
    const star = CONSTELLATION_STARS[index];
    setTargetFocusPos(star.pos);
    setSelectedStarIndex(index);
    setSelectedImage(null);
    setInspectFlipped(false);

    setTimeout(() => {
      setShowModal(true);
      soundFx.playSuccessChime();
    }, 350);
  };

  const handleDismissModal = () => {
    soundFx.playPaperSwoosh();
    setShowModal(false);
    setSelectedStarIndex(null);
    setSelectedImage(null);
    setTargetFocusPos(null);
    setInspectFlipped(false);
  };

  const handleIlluminateStar = () => {
    if (selectedStarIndex === null) return;
    const star = CONSTELLATION_STARS[selectedStarIndex];
    soundFx.playSuccessChime();

    setLitStarIds((prev) => {
      const next = new Set(prev);
      next.add(star.id);

      if (next.size === CONSTELLATION_STARS.length) {
        setTimeout(() => {
          confetti({
            particleCount: 140,
            spread: 120,
            origin: { y: 0.5 },
            colors: ['#FBBF24', '#FB7185', '#C084FC', '#38BDF8', '#FFFFFF', '#34D399'],
            shapes: ['star', 'circle'],
          });
        }, 400);
      }
      return next;
    });

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: [star.color, star.secondaryColor, '#FFFFFF'],
      shapes: ['star', 'circle'],
    });
  };

  const handleIlluminateAll = () => {
    soundFx.playSuccessChime();
    const all = new Set(CONSTELLATION_STARS.map((s) => s.id));
    setLitStarIds(all);
    confetti({
      particleCount: 160,
      spread: 130,
      origin: { y: 0.5 },
      colors: ['#FBBF24', '#FB7185', '#C084FC', '#38BDF8', '#FFFFFF', '#34D399'],
      shapes: ['star', 'circle'],
    });
  };

  const currentStar =
    selectedStarIndex !== null ? CONSTELLATION_STARS[selectedStarIndex] : null;
  const isCurrentStarLit = currentStar ? litStarIds.has(currentStar.id) : false;

  return (
    <div className="relative w-full h-full min-h-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-slate-950">
      {/* ── TOP CONTROLS & STATUS BAR (Minimalist & Non-Intrusive) ── */}
      <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Star Counter */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-xl border border-purple-500/30 text-purple-200 text-xs font-semibold shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              Chòm sao: <strong className="text-amber-300">{litStarIds.size}/7</strong>
            </span>
          </div>
        </div>

        {/* Right: Quick Illuminate All Button */}
        <div className="pointer-events-auto">
          {litStarIds.size < 7 ? (
            <button
              onClick={handleIlluminateAll}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-500/80 to-purple-600/80 hover:from-rose-500 hover:to-purple-600 backdrop-blur-xl border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(244,63,94,0.35)] active:scale-95 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Thắp Sáng Cả Dải Ngân Hà</span>
            </button>
          ) : (
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(52,211,153,0.35)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Thiên Hà Rực Rỡ! ✨</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 3D THREE.JS CANVAS ── */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 4.5, 13.5], fov: 55 }}
          dpr={[1, 1.5]}
          gl={{
            powerPreference: 'high-performance',
            antialias: true,
            stencil: false,
            depth: true,
          }}
        >
          <ambientLight intensity={0.6} />
          <pointLight position={[18, 18, 18]} intensity={1.8} color="#C084FC" />
          <pointLight position={[-18, -18, -18]} intensity={1.5} color="#FB7185" />
          <pointLight position={[0, 0, 0]} intensity={3.0} color="#F43F5E" />

          {/* Deep Space Volumetric Nebula Clouds */}
          <VolumetricNebulaClouds />

          {/* Infinite Multi-Spectral Background Starfield */}
          <DeepCosmosField count={2600} />

          {/* Shooting Stars & Dynamic Camera Controller */}
          <CosmicShootingStar />
          <CameraController targetPos={targetFocusPos} isZoomed={showModal} />

          {/* Tilted Volumetric Galactic Plane (Dramatic 3D Astronomical Perspective) */}
          <group rotation={[-0.32, 0, 0.08]}>
            {/* 4-Arm Logarithmic Spiral Galaxy Disc */}
            <RealisticSpiralGalaxy count={9500} />

            {/* Ancient Celestial Astrolabe Map Rings & Coordinate Grid */}
            <CelestialAstrolabeGrid />

            {/* Central Galactic Supermassive Core & Polar Beams */}
            <LuminousGalacticCore recipientName={config.recipientName} />

            {/* Constellation Laser Network connecting stars */}
            <ConstellationStarLines points={constellationPoints} />

            {/* 7 High-Precision Constellation Stars */}
            {CONSTELLATION_STARS.map((star, i) => (
              <ConstellationBeaconNode
                key={star.id}
                star={star}
                isLit={litStarIds.has(star.id)}
                onClick={() => handleStarClick(i)}
              />
            ))}

            {/* 6 Volumetric 3D Faceted Photo Memory Crystals */}
            {memoryItems.map((item, i) => (
              <VolumetricPhotoCrystal
                key={i}
                position={item.pos}
                imageUrl={item.img}
                index={i}
                recipientName={config.recipientName}
                onClick={() => handleCrystalClick(item.img, item.quote, item.pos)}
              />
            ))}
          </group>

          {/* 360-degree Orbit Drag & Zoom Controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            rotateSpeed={0.8}
            zoomSpeed={0.85}
            panSpeed={0.4}
            minDistance={4.0}
            maxDistance={28.0}
            enabled={!showModal}
          />
        </Canvas>
      </div>

      {/* ── 3D CLOSE-UP INSPECTION MODAL (Portaled to document.body) ── */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showModal && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 25 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 25 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                  className="bg-slate-900/95 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl max-w-md w-full border border-purple-500/40 shadow-[0_0_60px_rgba(192,132,252,0.35)] text-center space-y-4"
                >
                  {/* Photo Crystal Inspection */}
                  {selectedImage !== null ? (
                    <div className="space-y-4" style={{ perspective: '1200px' }}>
                      <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-rose-400" />
                          <span>{inspectFlipped ? 'Mặt Sau: Lời Khắc Kính' : 'Mặt Trước: Pha Lê Kỷ Niệm'}</span>
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

                      {/* 3D Flipped Content Card */}
                      <div
                        className="relative w-full aspect-square"
                        style={{
                          transform: inspectFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                          transformStyle: 'preserve-3d',
                          transition: 'transform 0.75s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        {/* Front: High-res Photo */}
                        <div
                          className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-purple-400/50 shadow-2xl bg-slate-950 flex items-center justify-center"
                          style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                          }}
                        >
                          <img
                            src={selectedImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Back: Engraved Cosmic Glass Wish */}
                        <div
                          className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-rose-400/50 shadow-2xl bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 p-6 flex flex-col justify-between text-center"
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
                            "{selectedQuote || config.mainText || 'Mỗi khoảnh khắc có em là một vì sao sáng trong vũ trụ!'}"
                          </p>
                          <p className="text-xs font-bold text-rose-300 italic text-right">
                            — {config.senderName || 'Người gửi'} 🌹
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : currentStar !== null ? (
                    /* Specialized Constellation Star Modal */
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
                          background: isCurrentStarLit
                            ? 'linear-gradient(to right, #10b981, #059669)'
                            : `linear-gradient(to right, ${currentStar.color}, #9333ea)`,
                          color: '#ffffff',
                        }}
                      >
                        <Star className="w-4 h-4 fill-white" />
                        <span>
                          {isCurrentStarLit
                            ? `✨ ${currentStar.name} Đang Tỏa Sáng Rực Rỡ!`
                            : `Thắp Sáng ${currentStar.name}`}
                        </span>
                      </button>
                    </div>
                  ) : null}

                  {/* Back to Galaxy Button */}
                  <button
                    onClick={handleDismissModal}
                    className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Tiếp Tục Xoay Ngắm Vũ Trụ</span>
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
