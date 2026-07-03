/**
 * Hard safety limits (Section 8 of the requirements).
 *
 * These are non-negotiable ceilings for a seizure-prone population (SR-1, SR-3, SR-5).
 * Every animated value flows through the kernel in engine/kernel.ts, which clamps
 * against these numbers, and tests/safety.test.ts simulates every lesson at every
 * extreme setting and measures the resulting luminance timeline against them (SR-8).
 *
 * Do not raise these values. Lower is always acceptable.
 */
export const SAFETY = {
  /**
   * Ceiling for any periodic luminance/opacity modulation (pulse, twinkle, bob).
   * Photosensitive risk begins around 3 Hz (SR-1); we stay 6x below it.
   */
  MAX_MOD_HZ: 0.5,

  /** Maximum amplitude of periodic alpha modulation. Keeps pulses far below "flash" swing. */
  MAX_MOD_DEPTH: 0.10,

  /** No appearance, disappearance, or state change faster than this (FR-8, SR-2). */
  MIN_FADE_MS: 500,

  /** Interactive rewards cannot retrigger faster than this, however fast input arrives (SR-6). */
  MIN_REWARD_COOLDOWN_MS: 1500,

  /** Approximate relative-luminance ceiling for the whole screen (SR-3). */
  MAX_SCREEN_LUM: 0.8,

  /** Largest allowed luminance swing within any 0.5 s window (SR-3, SR-5). */
  MAX_LUM_DELTA_PER_500MS: 0.18,

  /**
   * A "transition" is a luminance swing >= FLASH_DELTA; an opposing pair of
   * transitions inside one second is a flash. WCAG 2.3.1 allows 3 per second;
   * we allow at most 1 (SR-1, SR-5).
   */
  FLASH_DELTA: 0.10,
  MAX_FLASH_PAIRS_PER_SEC: 1,

  /**
   * SR-5 — saturated-red area flashing. We require zero opposing transitions of
   * saturated-red screen coverage at or above this fraction.
   */
  RED_AREA_DELTA: 0.2,

  /**
   * SR-5/SR-6 — reward blooms are always pulled at least this far toward
   * white, so no call site can ever produce a saturated-red burst.
   */
  MIN_BLOOM_WHITENESS: 0.5,

  /** Music stays slow and gentle (FR-7). */
  MAX_TEMPO_BPM: 84,

  /** Audio envelopes: minimum attack so no clicks or startling onsets (SR-2's audio analogue). */
  MIN_AUDIO_ATTACK_S: 0.03,
} as const;

/** Backgrounds are limited to plain, dark, pattern-free fields (SR-5: no stripes/checks). */
export const BACKGROUNDS: Record<string, string> = {
  black: '#000000',
  midnight: '#050810',
  charcoal: '#0b0d12',
};

/** Target palette (PR-1). High-salience hues; defaults lean red/yellow per CVI practice. */
export const TARGET_COLORS: Record<string, string> = {
  red: '#e8262d',
  yellow: '#ffd21f',
  orange: '#ff8b1f',
  green: '#4cd964',
  blue: '#3ea6ff',
  pink: '#ff7bc1',
  white: '#f4f1e8',
};
