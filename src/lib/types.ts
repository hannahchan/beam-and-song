/** Core shared types. Kept dependency-free so engine, UI, and tests can all import. */

export type TargetColorId =
  | 'red'
  | 'yellow'
  | 'white'
  | 'orange'
  | 'green'
  | 'blue'
  | 'pink';

export type BackgroundId = 'black' | 'midnight' | 'charcoal';

export type FieldBias = 'none' | 'lower' | 'upper' | 'left' | 'right';

/** FR-6 / PR-11 — how sound relates to the visual target. */
export type AudioMode = 'with' | 'after' | 'off';

export interface ChildSettings {
  /** PR-1 */
  targetColor: TargetColorId;
  background: BackgroundId;
  /** PR-2 */
  movement: boolean;
  speed: 1 | 2 | 3 | 4 | 5;
  /** PR-3 — 1: single element on plain field · 2: allow a second element · 3: allow subtle texture */
  complexity: 1 | 2 | 3;
  /** PR-4 */
  fieldBias: FieldBias;
  biasStrength: 'gentle' | 'strong';
  /** PR-5 — 1 is slowest. Higher never exceeds safety floors. */
  pace: 1 | 2 | 3 | 4 | 5;
  /** PR-6 */
  size: 1 | 2 | 3 | 4 | 5;
  /** PR-7 / PR-13 — 0 means no glow at all */
  glow: 0 | 1 | 2 | 3;
  brightness: 1 | 2 | 3;
  /** PR-8 / PR-11 */
  audioMode: AudioMode;
  volume: number; // 0..1
  audioStyle: 'single' | 'layered';
  /** FR-10 */
  soundFollowsTarget: boolean;
  /** AR-7 — non-auditory feedback where the device supports it */
  haptics: boolean;
  /** PT-6 */
  sessionMinutes: number;
  /** PR-9 / CR-3 — 'builtin' or the id of one of the profile's own recordings. */
  melodySource: 'builtin' | string;
  /** AR-2/AR-8 — built-in switch scanning for menus and overlays. */
  scanning: 'off' | 'auto' | 'step';
  /** PT-13 — optional, off by default; descriptive tuning aid only (SR-7). */
  fieldObservation: boolean;
}

export interface CustomPhoto {
  id: string;
  label: string;
  /** Downscaled JPEG data URL, produced client-side (TR-7). Never leaves the device (PV-5). */
  dataUrl: string;
  /** Measured average relative luminance (0..1). Absent on old photos → treated as worst-case. */
  lum?: number;
  addedAt: string;
}

/**
 * CR-3 — a favourite song or familiar voice. The blob lives in IndexedDB
 * (see lib/media.ts); this is just its passport. Audio never leaves the
 * device and is not included in profile exports.
 */
export interface CustomAudio {
  id: string;
  label: string;
  duration: number; // seconds
  gain: number; // normalization applied at playback
  addedAt: string;
}

export type ResponseLevel = 'clear' | 'some' | 'none' | 'unsure';

/** PT-8 — light day-context tags so a quiet day is not misread as decline. */
export const SESSION_TAGS = ['good day', 'tired', 'unwell', 'post-seizure', 'new medicine'] as const;
export type SessionTag = (typeof SESSION_TAGS)[number];

export interface SessionRecord {
  id: string;
  at: string; // ISO datetime
  lessonId: string;
  /** Set when the session played a program (PT-9); stored by name so it survives deletion. */
  programName?: string;
  durationSec: number;
  response: ResponseLevel | null; // null = not recorded
  tags: SessionTag[];
  note?: string;
  /** PT-13 — per-quadrant seconds-shown / marked-responses, only when enabled. */
  regions?: Record<'ul' | 'ur' | 'll' | 'lr', { s: number; r: number }>;
}

/**
 * CR-9 / PR-14 — developmental age band, independent of visual phase.
 * It changes how lessons look, sound, and speak — never how simple they
 * are allowed to be.
 */
export type AgeBand = 'infant' | 'child' | 'teen';

/** PT-9 — a named, ordered sequence of lessons composed by a parent or TVI. */
export interface Program {
  id: string;
  name: string;
  lessonIds: string[];
}

export interface Profile {
  id: string;
  /** PV-1 — a nickname is enough; we never ask for legal names or birthdays. */
  nickname: string;
  createdAt: string;
  /** CR-9/CR-10 — drives themes, music, and tone; changeable any time. */
  ageBand: AgeBand;
  settings: ChildSettings;
  favorites: string[]; // lesson ids, in order
  programs: Program[];
  photos: CustomPhoto[];
  audio: CustomAudio[];
  sessions: SessionRecord[];
  /** PT-5 — when settings were last deliberately reviewed. */
  lastReviewAt: string;
  presetId?: string;
}

export interface AppState {
  version: 1;
  activeProfileId: string | null;
  profiles: Profile[];
  /** PV-3 — optional courtesy lock for the grown-up area (not encryption). */
  pinHash: string | null;
}

/* ---------------------------------- Lessons ---------------------------------- */

export type Behavior =
  | 'pulse'
  | 'twinkle'
  | 'driftAcross'
  | 'causeEffect'
  | 'appearSpots'
  | 'fallDrop'
  | 'pathArc'
  | 'inviteTwo'
  | 'rollBounce'
  | 'glideAcross'
  | 'riseFloat'
  | 'photoDrift'
  | 'audioPan'
  | 'audioAlternate'
  | 'findAmong'
  | 'searchClutter'
  | 'nearFar'
  | 'amongMoving'
  | 'facesFamiliar';

export type ShapeKind =
  | 'orb'
  | 'star'
  | 'ball'
  | 'duck'
  | 'boat'
  | 'balloon'
  | 'drop'
  | 'photo'
  | 'bloom'
  | 'moon';

export type MelodyId =
  | 'brahms'
  | 'twinkle'
  | 'frere'
  | 'mary'
  | 'row'
  | 'humSway'
  | 'chime'
  | 'plinks'
  | 'musicBox'
  | 'duet'
  | 'ember'
  | 'nightSky'
  | 'tideGlass';

/** CR-10 — how a lesson re-presents itself for an older band. */
export interface BandVariant {
  title?: string;
  theme?: string;
  shape?: ShapeKind;
  melody?: MelodyId;
  goal?: string;
  watchFor?: string;
  bridge?: string;
}

/** A tap or switch press. x/y are 0..1 screen fractions; x < 0 means "switch press, no pointer" (AR-8). */
export interface TapEvent {
  t: number; // lesson-ms
  x: number;
  y: number;
}

export interface LessonSpec {
  id: string;
  title: string;
  level: 1 | 2 | 3 | 4;
  theme: string; // CR-1 — themes recur across levels
  /** CR-5 — listening is the goal; visuals stay minimal. */
  hearingFirst?: boolean;
  behavior: Behavior;
  shape: ShapeKind;
  melody: MelodyId;
  /** FR-9 — a tap anywhere (or a switch press) draws a gentle response. */
  interactive: boolean;
  requiresPhoto?: boolean;
  /** Grown-up copy */
  goal: string;
  watchFor: string;
  /** CR-4 — optional real-object bridge prompt. */
  bridge?: string;
}

/* ------------------------------ Engine interfaces ------------------------------ */

export interface SceneItem {
  shape: ShapeKind;
  x: number; // 0..1 of width
  y: number; // 0..1 of height
  r: number; // radius as fraction of the smaller screen dimension
  color: string; // hex
  alpha: number; // 0..1
  /** Halo radius as a multiple of r. 0 = no glow (PR-13). */
  glow: number;
  rot?: number; // radians
  photoDataUrl?: string;
  /** Measured luminance of the photo; the safety model assumes 1 (white) when absent. */
  photoLum?: number;
}

export interface Scene {
  bg: string;
  items: SceneItem[];
  /** -1..1 — where the sound should sit when sound-follows-target is on (FR-10). */
  pan: number;
  /** Audio cues that fired between prevT and t (deterministic). */
  cues: string[];
}
