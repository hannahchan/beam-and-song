import type { Scene } from '../lib/types';

/** Colour math shared by the renderer, the scenes, and the safety analyzer. */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function mixHex(a: string, b: string, u: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * u, ag + (bg - ag) * u, ab + (bb - ab) * u);
}

/** WCAG relative luminance, 0..1. */
export function relLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** SR-5 — "saturated red" in the photosensitivity sense. */
export function isSaturatedRed(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  return r > 0.75 && g < 0.35 && b < 0.35;
}

/**
 * Alpha-weighted luminous area of one item on a unit screen.
 *
 * The core disc counts at full alpha. The glow halo the renderer draws is a
 * radial gradient from ~0.5 alpha down to 0 at radius r*(1+glow); its
 * area-weighted mean alpha works out to ~0.15, so the annulus is counted at
 * 0.18 — slightly above the drawn truth, i.e. still conservative.
 */
export function luminousArea(r: number, glow: number, alpha: number): number {
  const core = Math.PI * r * r;
  const haloFactor = Math.max(0, (1 + glow) * (1 + glow) - 1); // annulus area / core area
  return Math.min(core * (1 + haloFactor * 0.18), 1) * alpha;
}

/**
 * Approximate whole-screen relative luminance of a scene, on a unit screen.
 * A photo is treated as bright as its alpha allows (we cannot know its
 * pixels, so we assume the worst case: pure white).
 */
export function sceneLuminance(scene: Scene): number {
  const bgLum = relLuminance(scene.bg);
  let lum = bgLum;
  for (const it of scene.items) {
    const itemLum = it.shape === 'photo' ? 1 : relLuminance(it.color);
    lum += luminousArea(it.r, it.glow, it.alpha) * Math.max(0, itemLum - bgLum);
  }
  return Math.min(lum, 1);
}

/** Fraction of the screen covered by saturated-red content, weighted by alpha (SR-5). */
export function saturatedRedArea(scene: Scene): number {
  let area = 0;
  for (const it of scene.items) {
    if (it.shape !== 'photo' && isSaturatedRed(it.color)) {
      area += luminousArea(it.r, it.glow, it.alpha);
    }
  }
  return Math.min(area, 1);
}
