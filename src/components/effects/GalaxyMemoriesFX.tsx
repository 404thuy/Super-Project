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
  CheckCircle2,
  Wand2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

/* ═══════════════════════════════════════════════════════════════════════
   PROCEDURAL ASTRONOMICAL TEXTURES (Smooth Gaussian Radial Falloffs)
   ═══════════════════════════════════════════════════════════════════════ */
let cachedRoundStarTexture: THREE.CanvasTexture | null = null;
let cachedStarFlareTexture: THREE.CanvasTexture | null = null;
let cachedNebulaTexture: THREE.CanvasTexture | null = null;

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
    grad.addColorStop(0.18, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.4, 'rgba(240, 245, 255, 0.55)');
    grad.addColorStop(0.7, 'rgba(180, 210, 255, 0.15)');
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
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    grad.addColorStop(0.3, 'rgba(230, 200, 255, 0.35)');
    grad.addColorStop(0.65, 'rgba(160, 100, 240, 0.12)');
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
      { pos: [-14, 6, -18], scale: 28, color: '#ec4899', rot: 0.1 },
      { pos: [16, -8, -20], scale: 32, color: '#8b5cf6', rot: -0.2 },
      { pos: [0, 12, -22], scale: 26, color: '#38bdf8', rot: 0.15 },
      { pos: [-18, -10, -15], scale: 30, color: '#d946ef', rot: -0.1 },
      { pos: [12, 14, -16], scale: 24, color: '#f59e0b', rot: 0.05 },
    ],
    []
  );

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.0015;
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
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   REALISTIC MULTI-SPECTRAL STARFIELD (Twinkling Spectral Classification)
   ═══════════════════════════════════════════════════════════════════════ */
function RealisticDeepSpaceField({ count = 3000 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const texture = useMemo(() => getRoundStarTexture(), []);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const starColors = [
      [0.85, 0.92, 1.0],  // Ice Blue
      [0.99, 0.99, 1.0],  // Diamond White
      [1.0, 0.96, 0.88],  // Warm Gold Starlight
      [1.0, 0.84, 0.70],  // Sunset Amber
      [1.0, 0.75, 0.85],  // Rose Giant
      [0.75, 0.85, 1.0],  // Royal Celestial
    ];

    for (let i = 0; i < count; i++) {
      const radius = 48 + Math.random() * 52;
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
      mesh.current.rotation.y = state.clock.elapsedTime * 0.0025;
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.0018) * 0.015;
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
   COSMIC SPIRAL DUST ARMS (Romantic Rose & Gold Spiral Nebula)
   ═══════════════════════════════════════════════════════════════════════ */
function CosmicSpiralArms({ count = 1200 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const texture = useMemo(() => getRoundStarTexture(), []);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      [0.98, 0.45, 0.68], // Rose Pink
      [0.78, 0.45, 0.98], // Royal Violet
      [0.35, 0.78, 0.98], // Celestial Cyan
      [1.0, 0.88, 0.48],  // Golden Aurora
      [0.98, 0.98, 1.0],  // White Diamond
      [0.45, 0.95, 0.85], // Emerald Glow
    ];

    const arms = 2;
    for (let i = 0; i < count; i++) {
      const armIndex = i % arms;
      const r1 = Math.abs(Math.sin(i * 12.9898 + 1.234) * 43758.5453) % 1;
      const r2 = Math.abs(Math.sin(i * 78.233 + 5.678) * 43758.5453) % 1;
      const r3 = Math.abs(Math.sin(i * 45.164 + 9.101) * 43758.5453) % 1;
      const r4 = Math.abs(Math.sin(i * 91.731 + 3.415) * 43758.5453) % 1;

      const dist = Math.pow(r1, 1.35) * 23 + 2.8;
      const angle = dist * 0.4 + armIndex * Math.PI + (r2 - 0.5) * 0.75;
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
      mesh.current.rotation.y = state.clock.elapsedTime * 0.016;
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.005) * 0.05;
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
        size={0.25}
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

/* ═══════════════════════════════════════════════════════════════════════
   GLOWING ORBITAL LIGHT PATH RINGS
   ═══════════════════════════════════════════════════════════════════════ */
function OrbitRing({
  radius,
  tilt = 0,
  color = '#a855f7',
  speed = 0.01,
}: {
  radius: number;
  tilt?: number;
  color?: string;
  speed?: number;
}) {
  const lineRef = useRef<THREE.Line>(null);

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 100;
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

  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.rotation.y = state.clock.elapsedTime * speed;
    }
  });

  return (
    <group ref={lineRef as unknown as React.Ref<THREE.Group>} rotation={[tilt, 0, 0]}>
      <primitive object={lineObject} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ANIMATED CONSTELLATION WEB (Glowing Energy Photons Traveling)
   ═══════════════════════════════════════════════════════════════════════ */
function ConstellationWeb({ points }: { points: [number, number, number][] }) {
  const photonRef = useRef<THREE.Points>(null);
  const texture = useMemo(() => getRoundStarTexture(), []);

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
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.LineSegments(geo, mat);
  }, [points]);

  // Traveling photons along lines
  const [photonPositions] = useMemo(() => {
    const count = 14;
    const pos = new Float32Array(count * 3);
    return [pos];
  }, []);

  useFrame((state) => {
    if (photonRef.current && points.length > 0) {
      const t = state.clock.elapsedTime * 0.45;
      const positions = photonRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < points.length; i++) {
        const nextIdx = (i + 1) % points.length;
        const p1 = points[i];
        const p2 = points[nextIdx];
        const progress = (t + i * (1 / points.length)) % 1;

        positions[i * 3] = p1[0] + (p2[0] - p1[0]) * progress;
        positions[i * 3 + 1] = p1[1] + (p2[1] - p1[1]) * progress;
        positions[i * 3 + 2] = p1[2] + (p2[2] - p1[2]) * progress;
      }
      photonRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <primitive object={lineObject} />
      <points ref={photonRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[photonPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          size={0.35}
          color="#fef08a"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CENTRAL GALACTIC HYPERGIANT (Heart of the Universe with Rotating Rings)
   ═══════════════════════════════════════════════════════════════════════ */
function GalacticCoreStar({ recipientName }: { recipientName: string }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const innerDiamondRef = useRef<THREE.Mesh>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const flareTexture = useMemo(() => getStarFlareTexture(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 2.4) * 0.08;
      coreRef.current.scale.setScalar(pulse);
      coreRef.current.rotation.y = t * 0.12;
    }
    if (innerDiamondRef.current) {
      innerDiamondRef.current.rotation.x = t * 0.6;
      innerDiamondRef.current.rotation.y = t * 0.9;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.z = t * 0.4;
      ringRef1.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.5) * 0.1;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z = -t * 0.35;
      ringRef2.current.rotation.y = Math.PI / 4 + Math.cos(t * 0.6) * 0.1;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Large Photometric Telescope Flare Billboard */}
      <sprite scale={[5.8, 5.8, 1]}>
        <spriteMaterial
          map={flareTexture}
          color="#fb7185"
          transparent
          opacity={0.82}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* 2. Secondary Golden Corona */}
      <sprite scale={[3.4, 3.4, 1]}>
        <spriteMaterial
          map={flareTexture}
          color="#fef08a"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* 3. Outer Corona Atmosphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.35, 32, 32]} />
        <meshBasicMaterial color="#f43f5e" transparent opacity={0.22} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* 4. Ultra-Hot Luminous Stellar Plasma Core */}
      <mesh>
        <sphereGeometry args={[0.78, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#fb7185"
          emissiveIntensity={3.6}
          roughness={0.1}
        />
      </mesh>

      {/* 5. Inner Spinning Octahedron Crystal Core */}
      <mesh ref={innerDiamondRef}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#f43f5e"
          emissiveIntensity={2.5}
          wireframe
        />
      </mesh>

      {/* 6. Rotating Celestial Golden Energy Rings */}
      <mesh ref={ringRef1}>
        <torusGeometry args={[1.8, 0.02, 16, 64]} />
        <meshBasicMaterial color="#fde047" transparent opacity={0.55} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ringRef2}>
        <torusGeometry args={[2.2, 0.015, 16, 64]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={0.45} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Core Tag */}
      <Html position={[0, -1.65, 0]} center>
        <div className="px-4 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-rose-400/60 text-xs font-black text-rose-200 shadow-[0_0_25px_rgba(251,113,133,0.5)] pointer-events-none whitespace-nowrap flex items-center gap-2">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
          <span>Tâm Vũ Trụ: {recipientName || 'Người Thương'}</span>
        </div>
      </Html>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SHOOTING STARS / METEORS (With Radiant Glowing Tail)
   ═══════════════════════════════════════════════════════════════════════ */
function ShootingStar() {
  const headRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Line>(null);
  const [active, setActive] = useState(false);
  const startPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());

  const tailGeo = useMemo(() => {
    const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(2.5, 2.5, 1)];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const tailMat = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useEffect(() => {
    const triggerMeteor = () => {
      startPos.current.set(
        (Math.random() - 0.5) * 40,
        12 + Math.random() * 8,
        (Math.random() - 0.5) * 22
      );
      velocity.current.set(-16 - Math.random() * 10, -16 - Math.random() * 8, -7);
      if (headRef.current) {
        headRef.current.position.copy(startPos.current);
      }
      setActive(true);

      setTimeout(() => {
        setActive(false);
      }, 900);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.35) {
        triggerMeteor();
      }
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  useFrame((_, delta) => {
    if (active && headRef.current) {
      headRef.current.position.addScaledVector(velocity.current, delta);
    }
  });

  return (
    <group ref={headRef as unknown as React.Ref<THREE.Group>} visible={active}>
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <primitive object={new THREE.Line(tailGeo, tailMat)} ref={tailRef} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SMOOTH CAMERA CONTROLLER (Cinematic Focus to Selected Celestial Objects)
   ═══════════════════════════════════════════════════════════════════════ */
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
    if (isZoomed && targetPos) {
      zoomTarget.set(targetPos[0] * 0.72, targetPos[1] * 0.72 + 0.35, targetPos[2] + 2.9);
      camera.position.lerp(zoomTarget, 0.065);
    }
  });

  return null;
}

/* ═══════════════════════════════════════════════════════════════════════
   3D FACETED PHOTO MEMORY CRYSTAL (Double-Sided 360 Glass Prism)
   ═══════════════════════════════════════════════════════════════════════ */
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

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 1.4 + index * 1.5) * 0.22;
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
      <Float speed={1.9} rotationIntensity={0.25} floatIntensity={0.35}>
        <Html position={[0, 0, 0]} center distanceFactor={9}>
          <div
            onClick={onClick}
            className="group relative cursor-pointer select-none"
            style={{ perspective: '1200px' }}
          >
            {/* 3D Volumetric Card with Flip Animation */}
            <div
              className="relative w-44 sm:w-48 h-56 sm:h-60 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
              style={{
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* ===== FRONT FACE (Photo + Crystal Bevel Border) ===== */}
              <div
                className="absolute inset-0 rounded-3xl p-3 bg-gradient-to-br from-purple-900/90 via-slate-900/95 to-rose-950/90 border-2 border-purple-400/60 backdrop-blur-xl flex flex-col justify-between overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.35)]"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {/* Iridescent edge sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/15 via-transparent to-rose-500/25 pointer-events-none" />

                {/* Top Badge */}
                <div className="flex items-center justify-between text-[10px] font-extrabold text-purple-200">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>Pha Lê #{index + 1}</span>
                  </span>
                  <button
                    onClick={toggleFlip}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Lật 180° xem mặt sau"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                {/* Center Image with Crystal Mount */}
                <div className="flex-1 my-2 rounded-2xl overflow-hidden bg-slate-950/80 border border-white/15 flex items-center justify-center relative shadow-inner">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
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
                    Gửi {recipientName || 'Người Thương'}
                  </p>
                </div>
              </div>

              {/* ===== BACK FACE (Engraved Love Quote on Frosted Crystal Glass) ===== */}
              <div
                className="absolute inset-0 rounded-3xl p-3.5 bg-gradient-to-br from-indigo-950/95 via-purple-950/90 to-slate-900/95 border-2 border-rose-400/60 backdrop-blur-xl flex flex-col justify-between text-center overflow-hidden shadow-[0_0_30px_rgba(244,63,94,0.35)]"
                style={{
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-purple-500/20 pointer-events-none" />

                {/* Top Header */}
                <div className="flex items-center justify-between text-[10px] font-extrabold text-rose-300">
                  <span>Lời Khắc Sau Pha Lê</span>
                  <button
                    onClick={toggleFlip}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                    title="Lật về mặt trước"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                {/* Center Engraved Text */}
                <div className="flex-1 flex flex-col items-center justify-center p-1.5">
                  <p className="text-[10.5px] leading-relaxed text-purple-100 font-medium italic line-clamp-5">
                    "{quoteText}"
                  </p>
                </div>

                {/* Sender Signature */}
                <div className="text-right border-t border-white/10 pt-1.5">
                  <p className="text-[9.5px] font-bold text-rose-400 italic">
                    — {senderName || 'Người gửi'} 🌹
                  </p>
                </div>
              </div>
            </div>

            {/* Click to inspect guide */}
            <div className="mt-2.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="px-2.5 py-1 rounded-full bg-purple-600/90 text-white text-[9.5px] font-bold shadow-lg">
                Nhấp để xem gần ✨
              </span>
            </div>
          </div>
        </Html>
      </Float>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   3D HIGH-PRECISION CELESTIAL STAR NODE (Faceted Crystal + Halo)
   ═══════════════════════════════════════════════════════════════════════ */
function HighPrecisionStarNode({
  position,
  label,
  icon,
  onClick,
  color = '#FB7185',
  secondaryColor = '#fef08a',
  isLit = false,
  hidden = false,
}: {
  position: [number, number, number];
  label: string;
  icon: string;
  onClick: () => void;
  color?: string;
  secondaryColor?: string;
  isLit?: boolean;
  hidden?: boolean;
}) {
  const crystalMesh = useRef<THREE.Mesh>(null);
  const coronaSphere = useRef<THREE.Mesh>(null);
  const outerSparks = useRef<THREE.Group>(null);
  const flareSprite = useRef<THREE.Sprite>(null);
  const flareTexture = useMemo(() => getStarFlareTexture(), []);

  const emberAngles = useMemo(
    () => [
      { speed: 1.8, radius: 0.65 },
      { speed: -2.3, radius: 0.8 },
      { speed: 1.4, radius: 0.95 },
    ],
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const offset = position[0] * 1.5 + position[1];

    if (crystalMesh.current) {
      const pulse = (isLit ? 1.25 : 1) + Math.sin(t * 3.5 + offset) * 0.08;
      crystalMesh.current.scale.setScalar(pulse);
      crystalMesh.current.rotation.y = t * 0.9 + offset;
      crystalMesh.current.rotation.x = t * 0.45;
    }

    if (coronaSphere.current) {
      const coronaPulse = (isLit ? 1.3 : 1.1) + Math.cos(t * 2.2 + offset) * 0.12;
      coronaSphere.current.scale.setScalar(coronaPulse);
    }

    if (flareSprite.current) {
      const baseScale = isLit ? 3.2 : 2.5;
      const flareScale = baseScale + Math.sin(t * 2.8 + offset) * 0.3;
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
        {/* 1. Telescope Diffraction Cross Flare Sprite */}
        <sprite ref={flareSprite} scale={[2.5, 2.5, 1]} onClick={onClick}>
          <spriteMaterial
            map={flareTexture}
            color={isLit ? '#ffffff' : secondaryColor}
            transparent
            opacity={isLit ? 0.95 : 0.88}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>

        {/* 2. Soft Secondary Chromatic Aura Sprite */}
        <sprite scale={[1.6, 1.6, 1]}>
          <spriteMaterial
            map={flareTexture}
            color={color}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>

        {/* 3. 3D Faceted Octahedron Gemstone Core */}
        <mesh ref={crystalMesh} onClick={onClick}>
          <octahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={isLit ? '#ffffff' : color}
            emissiveIntensity={isLit ? 4.2 : 3.0}
            roughness={0.1}
          />
        </mesh>

        {/* 4. Volumetric Corona Atmosphere */}
        <mesh ref={coronaSphere}>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isLit ? 0.45 : 0.28}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* 5. Delicate Kinetic Light Ray Needles */}
        <group>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.005, 0.015, 1.2, 16]} />
            <meshBasicMaterial
              color={secondaryColor}
              transparent
              opacity={0.38}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.005, 0.015, 1.2, 16]} />
            <meshBasicMaterial
              color={secondaryColor}
              transparent
              opacity={0.38}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>

        {/* 6. Orbiting Starlight Micro-Embers */}
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
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshBasicMaterial
                color={secondaryColor}
                transparent
                opacity={0.88}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>

        {/* 7. Starlight Label Tag with Glow Halo */}
        {!hidden && (
          <Html position={[0, -0.72, 0]} center>
            <button
              onClick={onClick}
              className={`group flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md border text-[11px] font-bold shadow-2xl hover:scale-110 active:scale-95 transition-all select-none whitespace-nowrap ${
                isLit
                  ? 'bg-amber-950/85 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                  : 'bg-slate-900/90 border-white/20 text-white hover:border-rose-400'
              }`}
            >
              <span>{icon}</span>
              <span className="group-hover:text-rose-300 transition-colors">{label}</span>
              {isLit && <span className="text-[10px] text-amber-300">✨</span>}
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

/* ═══════════════════════════════════════════════════════════════════════
   7 UNIQUE CONSTELLATION STARS (Chòm Sao 20/10)
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
    pos: [-4.6, 2.8, -2.5],
    name: 'Sao Hạnh Phúc',
    symbol: '⭐',
    color: '#FB7185',
    secondaryColor: '#fef08a',
    meaning: 'Ánh sáng của nụ cười, niềm vui và sự lạc quan yêu đời',
    blessing: 'Chúc bạn mỗi sớm mai thức dậy đều đón nhận nụ cười rạng rỡ, trọn vẹn niềm vui và ngập tràn hạnh phúc bất tận.',
  },
  {
    id: 'star-2',
    pos: [4.4, -1.6, -3.0],
    name: 'Sao Yêu Thương',
    symbol: '💖',
    color: '#F43F5E',
    secondaryColor: '#fda4af',
    meaning: 'Tình cảm nồng thắm, sự chân thành và nâng niu vô điều kiện',
    blessing: 'Mong bạn luôn được che chở trong tình yêu thương ấm áp, luôn có một bờ vai vững chãi đồng hành cùng bạn.',
  },
  {
    id: 'star-3',
    pos: [-2.4, -2.9, 2.6],
    name: 'Sao Rực Rỡ',
    symbol: '🌹',
    color: '#C084FC',
    secondaryColor: '#e9d5ff',
    meaning: 'Nhan sắc kiêu sa, khí chất tự tin và tỏa sáng của phái nữ',
    blessing: 'Chúc người phụ nữ tuyệt vời ngày 20/10 luôn kiêu hãnh, tự tin và ngát hương như đóa hồng nhung nở giữa trời đêm.',
  },
  {
    id: 'star-4',
    pos: [3.5, 3.2, 1.6],
    name: 'Sao Kiêu Hãnh',
    symbol: '👑',
    color: '#FBBF24',
    secondaryColor: '#ffffff',
    meaning: 'Sự thông tuệ, bản lĩnh và thành công rực rỡ',
    blessing: 'Chúc bạn gặt hái thêm nhiều thành công vượt bậc, luôn là người phụ nữ độc lập, quyến rũ và tỏa sáng ở mọi nơi bạn bước tới.',
  },
  {
    id: 'star-5',
    pos: [0.6, 4.2, -2.4],
    name: 'Sao Ước Nguyện',
    symbol: '✨',
    color: '#38BDF8',
    secondaryColor: '#bae6fd',
    meaning: 'Mọi ước vọng sâu thẳm đều trở thành hiện thực',
    blessing: 'Gửi ngàn ước nguyện tốt lành nhất qua dải thiên hà: chúc mọi hoài bão và mong ước của bạn đều nở hoa rực rỡ.',
  },
  {
    id: 'star-6',
    pos: [-3.8, -0.8, -4.2],
    name: 'Sao Tri Kỷ',
    symbol: '💫',
    color: '#A855F7',
    secondaryColor: '#f472b6',
    meaning: 'Sự thấu hiểu, đồng hành và gắn kết keo sơn',
    blessing: 'Cảm ơn vì đã luôn có mặt trong cuộc đời tôi, lắng nghe và chia sẻ mọi khoảnh khắc buồn vui quý giá.',
  },
  {
    id: 'star-7',
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

  // Track illuminated stars (Gamified galaxy completion!)
  const [litStarIds, setLitStarIds] = useState<Set<string>>(new Set());

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [graphicsQuality, setGraphicsQuality] = useState<'high' | 'smooth'>(
    isMobile ? 'smooth' : 'high'
  );

  const constellationPoints = useMemo<[number, number, number][]>(
    () => CONSTELLATION_STARS.map((s) => s.pos),
    []
  );

  const crystalPositions = useMemo(
    () => [
      [-5.2, 0.4, 3.2] as [number, number, number],
      [4.8, 0.8, 3.0] as [number, number, number],
      [0.8, -3.2, -4.2] as [number, number, number],
      [-3.0, 3.2, 3.8] as [number, number, number],
    ],
    []
  );

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
  };

  const handleIlluminateStar = () => {
    if (selectedStarIndex === null) return;
    const star = CONSTELLATION_STARS[selectedStarIndex];
    soundFx.playSuccessChime();

    setLitStarIds((prev) => {
      const next = new Set(prev);
      next.add(star.id);

      // Check if all 7 stars are lit -> Grand Supernova Celebration!
      if (next.size === CONSTELLATION_STARS.length) {
        setTimeout(() => {
          confetti({
            particleCount: 120,
            spread: 100,
            origin: { y: 0.5 },
            colors: ['#FBBF24', '#FB7185', '#C084FC', '#38BDF8', '#FFFFFF', '#34D399'],
            shapes: ['star', 'circle'],
          });
        }, 500);
      }
      return next;
    });

    confetti({
      particleCount: 55,
      spread: 75,
      origin: { y: 0.6 },
      colors: [star.color, star.secondaryColor, '#FFFFFF'],
      shapes: ['star', 'circle'],
    });
  };

  // Illuminate all stars at once
  const handleIlluminateAll = () => {
    soundFx.playSuccessChime();
    const all = new Set(CONSTELLATION_STARS.map((s) => s.id));
    setLitStarIds(all);
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0.5 },
      colors: ['#FBBF24', '#FB7185', '#C084FC', '#38BDF8', '#FFFFFF', '#34D399'],
      shapes: ['star', 'circle'],
    });
  };

  const currentStar =
    selectedStarIndex !== null ? CONSTELLATION_STARS[selectedStarIndex] : null;
  const isCurrentStarLit = currentStar ? litStarIds.has(currentStar.id) : false;

  return (
    <div
      onPointerDown={() => setHasInteracted(true)}
      className="relative w-full h-full min-h-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-slate-950"
    >
      {/* ── TOP CONTROLS & STATUS BAR ── */}
      <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Quality & Star Counter */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              soundFx.playPinClick();
              setGraphicsQuality((prev) => (prev === 'high' ? 'smooth' : 'high'));
            }}
            className="px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-xl border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 hover:border-purple-400 transition-colors shadow-lg active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Đồ họa: {graphicsQuality === 'high' ? 'Ultra (4200 sao)' : 'Mượt mà'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/75 backdrop-blur-xl border border-purple-500/40 text-purple-200 text-[11px] font-semibold shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              Đã thắp sáng: <strong className="text-amber-300">{litStarIds.size}/7</strong> sao
            </span>
          </div>
        </div>

        {/* Right: Quick Supernova Button */}
        <div className="pointer-events-auto">
          {litStarIds.size < 7 ? (
            <button
              onClick={handleIlluminateAll}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500/80 to-purple-600/80 hover:from-rose-500 hover:to-purple-600 backdrop-blur-xl border border-white/25 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(244,63,94,0.35)] active:scale-95 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Thắp Sáng Toàn Bộ 7 Sao</span>
              <span className="sm:hidden">Thắp sáng tất cả</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400/50 text-emerald-200 text-[11px] font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(52,211,153,0.35)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Thiên Hà Tỏa Sáng Trọn Vẹn! ✨</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 3D THREE.JS CANVAS ── */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 3, 11], fov: 60 }}
          dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[15, 15, 15]} intensity={1.6} color="#C084FC" />
          <pointLight position={[-15, -15, -15]} intensity={1.3} color="#FB7185" />
          <pointLight position={[0, 0, 0]} intensity={2.4} color="#F43F5E" />

          {/* Deep Space Volumetric Nebula Clouds */}
          <VolumetricNebulaClouds />

          {/* Central Galactic Hypergiant Star */}
          <GalacticCoreStar recipientName={config.recipientName} />

          {/* Glowing Planetary Orbit Rings */}
          <OrbitRing radius={5.8} tilt={0.15} color="#ec4899" speed={0.015} />
          <OrbitRing radius={8.4} tilt={-0.22} color="#a855f7" speed={-0.012} />
          <OrbitRing radius={11.2} tilt={0.09} color="#38bdf8" speed={0.008} />

          {/* Constellation Starlight Network with Traveling Photons */}
          <ConstellationWeb points={constellationPoints} />

          {/* Deep Space Stars & Two-Arm Spiral Dust */}
          <RealisticDeepSpaceField count={graphicsQuality === 'high' ? 3600 : 1200} />
          <CosmicSpiralArms count={graphicsQuality === 'high' ? 1400 : 500} />
          <ShootingStar />

          {/* Camera Smooth Lerp Rig */}
          <CameraRig targetPos={targetFocusPos} isZoomed={showContent} />

          {/* 7 High-Precision Faceted Constellation Stars */}
          {CONSTELLATION_STARS.map((star, i) => (
            <HighPrecisionStarNode
              key={star.name}
              position={star.pos}
              label={star.name}
              icon={star.symbol}
              color={star.color}
              secondaryColor={star.secondaryColor}
              isLit={litStarIds.has(star.id)}
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

          {/* 360-degree Orbit & Swipe Drag Controls */}
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

      {/* ── CONSTELLATION QUICK-SELECTOR DOCK (Bottom Navigation) ── */}
      {!showContent && (
        <div className="absolute bottom-4 sm:bottom-6 inset-x-0 z-20 flex flex-col items-center pointer-events-none px-3">
          {/* First interaction helper */}
          {!hasInteracted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-2 px-4 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-xl border border-white/20 text-white text-xs font-semibold flex items-center gap-2 shadow-2xl"
            >
              <Rotate3d className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span>Kéo xoay 360° • Chọn chòm sao bên dưới để khám phá ✨</span>
            </motion.div>
          )}

          {/* Horizontal Star Selector Dock */}
          <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 p-1.5 rounded-full bg-slate-900/85 backdrop-blur-2xl border border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.8)] overflow-x-auto max-w-full scrollbar-none">
            {CONSTELLATION_STARS.map((s, idx) => {
              const isLit = litStarIds.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => handleStarClick(idx)}
                  className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                    isLit
                      ? 'bg-gradient-to-r from-amber-500/25 to-rose-500/25 border border-amber-400/60 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                      : 'bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{s.symbol}</span>
                  <span className="text-[11px] hidden sm:inline">{s.name}</span>
                  {isLit && <span className="text-[10px] text-amber-300">★</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3D CLOSE-UP INSPECTION MODAL (Portaled to document.body) ── */}
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
                            "{config.mainText || 'Chúc bạn ngày 20/10 ngập tràn niềm vui và hạnh phúc!'}"
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
