/**
 * The i18n seam. The app ships English only today; this is the single source
 * of truth for the active locale so formatting (lib/fmt) and display labels
 * (lib/labels) read a language tag from one place. Making the app multilingual
 * later starts here — nothing else hard-codes a language.
 *
 * Deliberately NOT a persisted per-profile setting yet: that would be a store
 * migration for a single value. Keep it a module constant until a real second
 * language exists, then make it dynamic here.
 */
export type Locale = 'en';

export const LOCALE: Locale = 'en';

/** Reflect the active locale on <html lang> for assistive tech (index.html seeds 'en'). */
export function applyLocale(root: HTMLElement = document.documentElement): void {
  root.lang = LOCALE;
}
