import { describe, expect, it } from 'vitest';
import { LESSONS } from '../src/lessons/specs';
import { validateAll, validateSpec } from '../src/safety/validate';
import type { LessonSpec } from '../src/lib/types';

const good = LESSONS[0];

describe('lesson spec validation (SR-8 authoring gate)', () => {
  it('every shipped lesson passes', () => {
    expect(validateAll(LESSONS)).toEqual([]);
  });

  it('rejects unknown behaviors and melodies', () => {
    const bad = { ...good, id: 'bad-a', behavior: 'strobe', melody: 'techno' } as unknown as LessonSpec;
    const errors = validateSpec(bad);
    expect(errors.join(' ')).toMatch(/behavior/);
    expect(errors.join(' ')).toMatch(/melody/);
  });

  it('rejects clinical/diagnostic language in caregiver copy (SR-7 spirit)', () => {
    const bad: LessonSpec = { ...good, id: 'bad-b', goal: 'Assess the visual field deficit in this test result properly.' };
    expect(validateSpec(bad).join(' ')).toMatch(/clinical/);
  });

  it('rejects duplicate ids', () => {
    expect(validateAll([good, { ...good }]).join(' ')).toMatch(/duplicate/);
  });

  it('requires caregiver guidance copy', () => {
    const bad: LessonSpec = { ...good, id: 'bad-c', goal: 'short', watchFor: '' };
    const errors = validateSpec(bad);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});
