import { BEHAVIOR_IDS, type LessonSpec } from '../lib/types';
import { MELODIES } from '../engine/melodies';
import { SAFETY } from './constants';

/**
 * Static validation of lesson specs against the safety framework (SR-8).
 * The animation kernel already clamps at runtime; this catches authoring
 * mistakes at build/test time with readable errors.
 */

const BEHAVIORS = new Set<string>(BEHAVIOR_IDS);

/**
 * SR-7 — language that must never appear in anything family-facing:
 * no clinical deficit vocabulary, no scoring/grading, no diagnosis.
 * Lesson copy is validated against this, and the PT-13 observation
 * templates are tested against it too.
 */
export const NON_DIAGNOSTIC_BANNED =
  /diagnos|deficit|impair|defect|\bscore|test result|assess|field loss|abnormal|sever(e|ity)|normative|percentile|\bgrade\b|\bfail/i;

export function validateSpec(spec: LessonSpec): string[] {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`${spec.id}: ${m}`);

  if (!spec.id || !/^[a-z0-9-]+$/.test(spec.id)) err('id must be a kebab-case slug');
  if (!spec.title) err('missing title');
  if (![1, 2, 3, 4].includes(spec.level)) err('level must be 1–4');
  if (!BEHAVIORS.has(spec.behavior)) err(`unknown behavior "${spec.behavior}"`);

  const melody = MELODIES[spec.melody];
  if (!melody) {
    err(`unknown melody "${spec.melody}"`);
  } else if (melody.bpm > SAFETY.MAX_TEMPO_BPM) {
    err(`melody tempo ${melody.bpm} exceeds ${SAFETY.MAX_TEMPO_BPM} bpm`);
  }

  if (!spec.goal || spec.goal.length < 20) err('goal copy missing or too short to be useful');
  if (!spec.watchFor) err('watchFor copy missing (needed for PT-10 guidance)');
  if (spec.requiresPhoto && spec.shape !== 'photo') err('requiresPhoto only makes sense for photo lessons');

  for (const field of [spec.goal, spec.watchFor, spec.bridge ?? '']) {
    if (NON_DIAGNOSTIC_BANNED.test(field)) err(`copy uses clinical/diagnostic language: "${field.slice(0, 40)}…"`);
  }

  return errors;
}

export function validateAll(specs: readonly LessonSpec[]): string[] {
  const errors = specs.flatMap(validateSpec);
  const ids = new Set<string>();
  for (const s of specs) {
    if (ids.has(s.id)) errors.push(`duplicate lesson id "${s.id}"`);
    ids.add(s.id);
  }
  return errors;
}
