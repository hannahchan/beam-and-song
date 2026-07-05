import { LOCALE } from './locale';

/**
 * Locale-aware formatting. The single funnel for dates, durations, and plurals
 * so there is one place to adjust when the app gains languages — no inline
 * `toLocaleDateString()`, `${n} min`, or `${n === 1 ? '' : 's'}` anywhere else.
 */

/** A short, locale-formatted date. Accepts an ISO string, epoch ms, or Date. */
export function formatDate(input: string | number | Date): string {
  return new Date(input).toLocaleDateString(LOCALE);
}

const MINUTES_FMT = new Intl.NumberFormat(LOCALE, { style: 'unit', unit: 'minute', unitDisplay: 'short' });

/** A whole-minute count with a localised unit ("5 min"). */
export function formatMinutes(minutes: number): string {
  return MINUTES_FMT.format(minutes);
}

/** Seconds rounded up to at least one minute, localised ("1 min"). */
export function formatDuration(seconds: number): string {
  return formatMinutes(Math.max(1, Math.round(seconds / 60)));
}

/** A minutes-and-seconds length ("1 min 35 s"), for short audio-clip labels. */
export function formatMinutesSeconds(seconds: number): string {
  return `${formatMinutes(Math.round(seconds / 60))} ${Math.round(seconds % 60)} s`;
}

// CLDR plural categories; `other` is the required fallback every language has.
type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
export type PluralForms = { other: string } & Partial<Record<PluralCategory, string>>;

const PLURAL_RULES = new Intl.PluralRules(LOCALE);

/**
 * Pick a noun form for a count. English callers pass `{ one, other }`; other
 * languages add `few`/`many`/etc. later without touching call sites. Returns
 * the word only — callers place the number: `${n} ${plural(n, { … })}`.
 */
export function plural(n: number, forms: PluralForms): string {
  return forms[PLURAL_RULES.select(n) as PluralCategory] ?? forms.other;
}
