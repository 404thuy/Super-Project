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

interface Props {
  effectType: EffectType;
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

export default function EffectRenderer({ effectType, config, mode }: Props) {
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
    default:
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          Template not found
        </div>
      );
  }
}
