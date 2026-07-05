/**
 * Design tokens for the grown-up UI (AR-4, AR-6).
 * Single source of truth: applied to CSS custom properties at boot, and
 * tests/tokens.test.ts asserts every foreground/background pair meets WCAG AA.
 */
export const tokens = {
  bg0: '#07080d', // app background
  bg1: '#12151f', // cards
  bg2: '#1b2030', // raised surfaces / inputs
  line: '#2c3247',
  ink: '#eef1f7', // primary text
  inkSoft: '#aeb7c9', // secondary text
  accent: '#ffd27d', // warm amber, primary action background
  accentInk: '#241703', // text on accent
  focus: '#9ec1ff',
  danger: '#ffa3a3',
  good: '#a5e2b0',
} as const;

export type TokenName = keyof typeof tokens;

/** Pairs that must meet WCAG 2.1 AA contrast (4.5:1), verified in tests. */
export const CONTRAST_PAIRS: Array<[fg: TokenName, bg: TokenName]> = [
  ['ink', 'bg0'],
  ['ink', 'bg1'],
  ['ink', 'bg2'],
  ['inkSoft', 'bg0'],
  ['inkSoft', 'bg1'],
  ['inkSoft', 'bg2'],
  ['accent', 'bg0'],
  ['accent', 'bg1'],
  ['accentInk', 'accent'],
  ['focus', 'bg0'],
  ['focus', 'bg1'],
  ['danger', 'bg1'],
  ['good', 'bg1'],
];

export function applyTheme(root: HTMLElement): void {
  for (const [name, value] of Object.entries(tokens)) {
    root.style.setProperty(`--${name}`, value);
  }
}
