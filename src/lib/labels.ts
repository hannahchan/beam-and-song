import type { AudioMode, BackgroundId, ChildSettings, FieldBias, SessionTag, TargetColorId } from './types';

/**
 * Display labels for values that are PERSISTED as stable keys. Stored data
 * (SessionRecord.tags, ChildSettings.targetColor, …) holds the key; the UI and
 * exports render the label from here. Localising later means editing this file,
 * never a store migration and never touching a caregiver's saved data.
 *
 * The rule this enforces: never render a stored enum value directly. Today the
 * English labels mostly equal their keys; that is fine, the decoupling is the
 * point, so a translation has exactly one place to change.
 */

export const TAG_LABELS: Record<SessionTag, string> = {
  'good day': 'good day',
  tired: 'tired',
  unwell: 'unwell',
  'post-seizure': 'post-seizure',
  'new medicine': 'new medicine',
};

export const COLOR_LABELS: Record<TargetColorId, string> = {
  red: 'red',
  yellow: 'yellow',
  white: 'white',
  orange: 'orange',
  green: 'green',
  blue: 'blue',
  pink: 'pink',
};

export const BACKGROUND_LABELS: Record<BackgroundId, string> = {
  black: 'black',
  midnight: 'midnight',
  charcoal: 'charcoal',
};

export const FIELD_BIAS_LABELS: Record<FieldBias, string> = {
  none: 'everywhere',
  lower: 'lower',
  upper: 'upper',
  left: 'left',
  right: 'right',
};

export const BIAS_STRENGTH_LABELS: Record<ChildSettings['biasStrength'], string> = {
  gentle: 'gentle',
  strong: 'strong',
};

export const AUDIO_MODE_LABELS: Record<AudioMode, string> = {
  with: 'with the visual',
  after: 'after a look',
  off: 'off',
};

export const AUDIO_STYLE_LABELS: Record<ChildSettings['audioStyle'], string> = {
  single: 'single',
  layered: 'layered',
};
