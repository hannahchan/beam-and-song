import { describe, expect, it } from 'vitest';
import { formatDuration, formatMinutes, formatMinutesSeconds, plural } from '../src/lib/fmt';

/**
 * lib/fmt is the single locale-aware formatting funnel (i18n-readiness).
 * These lock the English output so a future locale change is a deliberate one.
 */
describe('fmt', () => {
  describe('formatMinutesSeconds', () => {
    it('floors the minute and keeps seconds in 0–59 (no over-rounding)', () => {
      // A 35 s clip is not "1 min 35 s"; a 95 s clip is 1:35, not 2:35.
      expect(formatMinutesSeconds(35)).toBe('0 min 35 s');
      expect(formatMinutesSeconds(95)).toBe('1 min 35 s');
      expect(formatMinutesSeconds(8)).toBe('0 min 8 s');
      expect(formatMinutesSeconds(125)).toBe('2 min 5 s');
      expect(formatMinutesSeconds(600)).toBe('10 min 0 s');
      expect(formatMinutesSeconds(0)).toBe('0 min 0 s');
    });

    it('rolls a rounded-up 60 into the next minute instead of showing "60 s"', () => {
      expect(formatMinutesSeconds(59.6)).toBe('1 min 0 s');
      expect(formatMinutesSeconds(119.7)).toBe('2 min 0 s');
    });
  });

  it('formatMinutes labels a whole minute count', () => {
    expect(formatMinutes(0)).toBe('0 min');
    expect(formatMinutes(1)).toBe('1 min');
    expect(formatMinutes(5)).toBe('5 min');
  });

  it('formatDuration rounds seconds to the nearest minute, at least one', () => {
    expect(formatDuration(0)).toBe('1 min');
    expect(formatDuration(40)).toBe('1 min');
    expect(formatDuration(95)).toBe('2 min');
    expect(formatDuration(150)).toBe('3 min');
  });

  it('plural picks the form by count', () => {
    expect(plural(1, { one: 'session', other: 'sessions' })).toBe('session');
    expect(plural(2, { one: 'session', other: 'sessions' })).toBe('sessions');
    expect(plural(0, { one: 'session', other: 'sessions' })).toBe('sessions');
  });
});
