import type { ChildSettings } from './types';

/**
 * PR-10, presets first, fine-tuning second. Four starting profiles so no one
 * faces a wall of sliders on day one. PR-12's guided setup recommends one.
 */
export interface Preset {
  id: string;
  title: string;
  blurb: string;
  settings: Partial<ChildSettings>;
  /** Lessons this preset stars for the child screen. */
  seedFavorites: string[];
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'first-light',
    title: 'Just beginning',
    blurb: 'One large, still light at a time on a plain dark screen. For babies who are just starting to notice.',
    settings: {
      movement: false,
      speed: 1,
      complexity: 1,
      pace: 1,
      size: 5,
      glow: 2,
      brightness: 2,
      audioMode: 'with',
      volume: 0.5,
      audioStyle: 'single',
      soundFollowsTarget: false,
    },
    seedFavorites: ['gentle-glow', 'little-star', 'magic-touch'],
  },
  {
    id: 'starting-to-look',
    title: 'Starting to look',
    blurb: 'Adds very slow movement for a baby who sometimes finds the light and can begin to follow it.',
    settings: {
      movement: true,
      speed: 2,
      complexity: 1,
      pace: 2,
      size: 4,
      glow: 2,
      brightness: 2,
      audioMode: 'with',
      volume: 0.6,
      audioStyle: 'single',
      soundFollowsTarget: false,
    },
    seedFavorites: ['drifting-light', 'raindrop', 'firefly', 'magic-touch'],
  },
  {
    id: 'looking-and-listening',
    title: 'Looking and listening together',
    blurb: 'Sound travels with the target, and gentle choices appear, for a baby who follows and re-finds fairly reliably.',
    settings: {
      movement: true,
      speed: 2,
      complexity: 2,
      pace: 3,
      size: 3,
      glow: 1,
      brightness: 2,
      audioMode: 'with',
      volume: 0.6,
      audioStyle: 'single',
      soundFollowsTarget: true,
    },
    seedFavorites: ['star-path', 'two-fireflies', 'rolling-ball', 'balloon'],
  },
  {
    id: 'listening-first',
    title: 'Listening first',
    blurb: 'For babies whose hearing is the stronger doorway right now, or when sound pulls attention away from looking: quiet visuals, listening as the goal.',
    settings: {
      movement: false,
      speed: 1,
      complexity: 1,
      pace: 1,
      size: 4,
      glow: 1,
      brightness: 1,
      audioMode: 'with',
      volume: 0.65,
      audioStyle: 'single',
      soundFollowsTarget: false,
    },
    seedFavorites: ['traveling-song', 'bell-and-drum', 'gentle-glow'],
  },
] as const;

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/* ----------------------- PR-12, guided setup answers ----------------------- */

export interface SetupAnswers {
  color: 'red' | 'yellow' | 'unsure';
  movementHelps: 'yes' | 'no' | 'unsure';
  soundEffect: 'helps' | 'pulls-away' | 'unsure';
  strongerSide: 'none' | 'lower' | 'left' | 'right' | 'unsure';
  looksYet: 'rarely' | 'sometimes' | 'often';
}

export interface SetupRecommendation {
  presetId: string;
  overrides: Partial<ChildSettings>;
  notes: string[];
}

export function recommendFromSetup(a: SetupAnswers): SetupRecommendation {
  const overrides: Partial<ChildSettings> = {};
  const notes: string[] = [];

  let presetId: string;
  if (a.looksYet === 'rarely') presetId = 'first-light';
  else if (a.looksYet === 'sometimes') presetId = 'starting-to-look';
  else presetId = 'looking-and-listening';

  if (a.soundEffect === 'pulls-away') {
    overrides.audioMode = 'after';
    notes.push(
      'Because sound seems to pull attention away, songs are set to play after a look, you tap when your child looks, and the music answers. You can change this in Settings.',
    );
  } else if (a.soundEffect === 'unsure') {
    overrides.volume = 0.4;
    notes.push('Volume starts low so you can watch whether sound helps or distracts, and adjust.');
  }

  overrides.targetColor = a.color === 'yellow' ? 'yellow' : 'red';
  if (a.color === 'unsure') {
    notes.push('Red is a common starting colour for CVI, but every child is different, try yellow or white too and watch what happens.');
  }

  if (a.movementHelps === 'yes' && presetId === 'first-light') {
    overrides.movement = true;
    overrides.speed = 1;
    notes.push('Movement is on at the very slowest speed, since it seems to catch their attention.');
  }
  if (a.movementHelps === 'no') {
    overrides.movement = false;
  }

  if (a.strongerSide !== 'none' && a.strongerSide !== 'unsure') {
    overrides.fieldBias = a.strongerSide;
    overrides.biasStrength = 'gentle';
    notes.push(
      `Targets will favour the ${a.strongerSide} part of the screen, where you feel they notice most. This is a comfort setting, not an assessment, your vision professional can help you tune it.`,
    );
  }

  return { presetId, overrides, notes };
}
