import type { Behavior, SceneItem } from '../lib/types';

/**
 * AR-8, in-lesson choice scanning. With scanning off, a switch press in the
 * find/search lessons counts as a hit (attending + pressing is the
 * achievement). With scanning on, those lessons become *real choices*: a
 * gentle ring steps across the on-screen lights, and choosing submits the
 * highlighted position through the exact same hit logic as a pointer tap.
 *
 * The ring is a visual stimulus, so it follows the calm rules by
 * construction: constant alpha (it never blinks), a thin stroke (negligible
 * luminance), and exponential gliding between positions (it never jumps).
 * Dwell timing comes from the child's pace setting, floor 1.5 s (PR-5).
 */

export const CHOICE_BEHAVIORS: ReadonlySet<Behavior> = new Set<Behavior>([
  'findAmong',
  'searchClutter',
  'amongMoving',
  'findColor',
  'sweepRow',
  'reachTouch',
]);

export const LESSON_SCAN = {
  /** Ring position/opacity smoothing time-constant, glides, never jumps (FR-8). */
  GLIDE_MS: 450,
  /** Constant ring opacity, no blinking, ever. */
  RING_ALPHA: 0.75,
  /** Stroke width as a fraction of the smaller screen dimension, a thin annulus. */
  STROKE_FRAC: 0.01,
} as const;

export interface RingState {
  x: number; // 0..1 of width
  y: number; // 0..1 of height
  r: number; // fraction of min dimension
  alpha: number;
  visible: boolean;
}

export class LessonScanController {
  private idx = 0;
  private lastAdvanceAt = 0;
  private current: SceneItem | null = null;
  private ring: RingState = { x: 0.5, y: 0.5, r: 0.1, alpha: 0, visible: false };

  reset(): void {
    this.idx = 0;
    this.lastAdvanceAt = 0;
    this.current = null;
    this.ring = { x: 0.5, y: 0.5, r: 0.1, alpha: 0, visible: false };
  }

  /** The things worth stepping between: real, visible items, never blooms, scenery, or dust. */
  candidates(items: readonly SceneItem[]): SceneItem[] {
    return items.filter((i) => i.shape !== 'bloom' && i.shape !== 'hill' && i.r > 0.035 && i.alpha > 0.08);
  }

  /** Advance the ring; in auto mode the highlight steps on its own gentle clock. */
  update(
    items: readonly SceneItem[],
    lessonT: number,
    dt: number,
    mode: 'auto' | 'step',
    dwellMs: number,
  ): RingState {
    const cands = this.candidates(items);
    const k = Math.min(1, dt / LESSON_SCAN.GLIDE_MS);
    if (!cands.length) {
      this.current = null;
      this.ring.alpha += (0 - this.ring.alpha) * k;
      this.ring.visible = this.ring.alpha > 0.02;
      return this.ring;
    }
    if (mode === 'auto' && lessonT - this.lastAdvanceAt >= dwellMs) {
      this.idx++;
      this.lastAdvanceAt = lessonT;
    }
    const target = cands[this.idx % cands.length];
    this.current = target;
    const targetR = target.r * 1.45;
    if (!this.ring.visible && this.ring.alpha < 0.02) {
      // First appearance: take position instantly but arrive by fading in.
      this.ring.x = target.x;
      this.ring.y = target.y;
      this.ring.r = targetR;
    } else {
      this.ring.x += (target.x - this.ring.x) * k;
      this.ring.y += (target.y - this.ring.y) * k;
      this.ring.r += (targetR - this.ring.r) * k;
    }
    this.ring.alpha += (LESSON_SCAN.RING_ALPHA - this.ring.alpha) * k;
    this.ring.visible = true;
    return this.ring;
  }

  /** Step mode: the first switch moves the ring. */
  step(lessonT: number): void {
    this.idx++;
    this.lastAdvanceAt = lessonT;
  }

  /** The position to submit as a tap, null when nothing is highlighted. */
  selection(): { x: number; y: number } | null {
    return this.current ? { x: this.current.x, y: this.current.y } : null;
  }
}
