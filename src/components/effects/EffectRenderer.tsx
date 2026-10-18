import React, { Component, type ReactNode } from 'react';
import type { EffectType, CardConfig } from '../../types';
import PasscodeEnvelopeFX from './PasscodeEnvelopeFX';
import GalaxyMemoriesFX from './GalaxyMemoriesFX';
import BlossomPetalRainFX from './BlossomPetalRainFX';
import VinylPlayerFX from './VinylPlayerFX';
import ScratchCardFX from './ScratchCardFX';
import LanternFestivalFX from './LanternFestivalFX';
import CrystalCarouselFX from './CrystalCarouselFX';
import CinemaFilmstripFX from './CinemaFilmstripFX';
import InteractiveBouquetFX from './InteractiveBouquetFX';
// TikTok Hot Trend Interactive Templates
import HoldToRevealFX from './HoldToRevealFX';
import FoggyMirrorFX from './FoggyMirrorFX';
import BlowMicRevealFX from './BlowMicRevealFX';
import PolaroidSwipeFX from './PolaroidSwipeFX';
import AIGestureUnlockFX from './AIGestureUnlockFX';

interface Props {
  effectType: EffectType;
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

class EffectErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Effect render error caught by boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
          <p className="text-sm font-bold text-rose-300">Đang tối ưu hiệu ứng hiển thị...</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-full text-xs font-semibold cursor-pointer"
          >
            Tải lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function EffectRenderer({ effectType, config, mode }: Props) {
  const renderEffect = () => {
    switch (effectType) {
      case 'PASSCODE_ENVELOPE':
        return <PasscodeEnvelopeFX config={config} mode={mode} />;
      case 'GALAXY_3D':
        return <GalaxyMemoriesFX config={config} mode={mode} />;
      case 'PETAL_RAIN':
        return <BlossomPetalRainFX config={config} mode={mode} />;
      case 'VINYL_PLAYER':
        return <VinylPlayerFX config={config} mode={mode} />;
      case 'SCRATCH_CARD':
        return <ScratchCardFX config={config} mode={mode} />;
      case 'LANTERN_3D':
        return <LanternFestivalFX config={config} mode={mode} />;
      case 'CRYSTAL_CAROUSEL':
        return <CrystalCarouselFX config={config} mode={mode} />;
      case 'CINEMA_FILM':
        return <CinemaFilmstripFX config={config} mode={mode} />;
      case 'BOUQUET_3D':
        return <InteractiveBouquetFX config={config} mode={mode} />;
      // ── TikTok Hot Trend Interactive ──
      case 'HOLD_TO_REVEAL':
        return <HoldToRevealFX config={config} mode={mode} />;
      case 'FOGGY_MIRROR':
        return <FoggyMirrorFX config={config} mode={mode} />;
      case 'BLOW_MIC':
        return <BlowMicRevealFX config={config} mode={mode} />;
      case 'POLAROID_SWIPE':
        return <PolaroidSwipeFX config={config} mode={mode} />;
      case 'AI_GESTURE':
        return <AIGestureUnlockFX config={config} mode={mode} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            Template not found
          </div>
        );
    }
  };

  return <EffectErrorBoundary key={effectType}>{renderEffect()}</EffectErrorBoundary>;
}
