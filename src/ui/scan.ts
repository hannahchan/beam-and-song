import { clamp } from '../engine/kernel';

/**
 * AR-2 / AR-8, built-in switch scanning, for caregivers (and later children)
 * who operate the device with one or two switches instead of touch.
 *
 * Two modes:
 *   auto, the highlight advances by itself; any switch press (Space/Enter)
 *          activates the highlighted control.
 *   step, one switch (Space) moves the highlight; a second (Enter) activates.
 *
 * Design constraints honoured here:
 *   - Dwell time follows the child's pace/latency setting, never under 1.5 s (AR-8).
 *   - The highlight is itself a visual stimulus: one steady high-contrast ring
 *     that *glides* between controls (>= 500 ms ease) and never blinks (FR-8, PR-3).
 *   - While a lesson is live, scanning suspends completely: the switch belongs
 *     to the child as lesson input (FR-9). It wakes for overlays and menus.
 */

export const SCAN_MIN_DWELL_MS = 1500;
export const SCAN_MAX_DWELL_MS = 4000;
export const SCAN_RING_TRANSITION_MS = 500;

export type ScanMode = 'off' | 'auto' | 'step';

export function dwellFromPace(paceMult: number): number {
  return clamp(1400 * paceMult, SCAN_MIN_DWELL_MS, SCAN_MAX_DWELL_MS);
}

const SCANNABLE =
  'button:not([disabled]), a[href], input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), summary';

export class ScanController {
  private mode: ScanMode = 'off';
  private dwellMs = SCAN_MIN_DWELL_MS;
  private ring: HTMLElement | null = null;
  private items: HTMLElement[] = [];
  private index = -1;
  private timer: ReturnType<typeof setInterval> | null = null;
  private observer: MutationObserver | null = null;
  private recollectQueued = false;

  configure(mode: ScanMode, dwellMs: number): void {
    const next = clamp(dwellMs, SCAN_MIN_DWELL_MS, SCAN_MAX_DWELL_MS);
    if (mode === this.mode && next === this.dwellMs) return;
    this.stop();
    this.mode = mode;
    this.dwellMs = next;
    if (mode !== 'off') this.start();
  }

  private start(): void {
    this.ensureRing();
    this.collect();
    window.addEventListener('keydown', this.onKey, true);
    window.addEventListener('hashchange', this.queueRecollect);
    this.observer = new MutationObserver(this.queueRecollect);
    this.observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled', 'hidden'] });
    if (this.mode === 'auto') {
      this.timer = setInterval(() => {
        if (!this.suspended()) this.advance(1);
      }, this.dwellMs);
    }
  }

  stop(): void {
    this.mode = 'off';
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.observer?.disconnect();
    this.observer = null;
    window.removeEventListener('keydown', this.onKey, true);
    window.removeEventListener('hashchange', this.queueRecollect);
    this.ring?.remove();
    this.ring = null;
    this.items = [];
    this.index = -1;
  }

  /** The switch belongs to the child while a lesson is live (FR-9/AR-8). */
  private suspended(): boolean {
    const live = document.body.classList.contains('bs-lesson-live');
    if (live && this.ring) this.ring.style.opacity = '0';
    return live;
  }

  private queueRecollect = (): void => {
    if (this.recollectQueued) return;
    this.recollectQueued = true;
    setTimeout(() => {
      this.recollectQueued = false;
      if (this.mode !== 'off') this.collect(true);
    }, 250);
  };

  private collect(keepCurrent = false): void {
    const current = keepCurrent && this.index >= 0 ? this.items[this.index] : null;
    this.items = [...document.querySelectorAll<HTMLElement>(SCANNABLE)].filter((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return false;
      if (el.closest('[hidden], [aria-hidden="true"]')) return false;
      return true;
    });
    this.index = current ? Math.max(this.items.indexOf(current), 0) : this.items.length ? 0 : -1;
    this.paint();
  }

  private advance(dir: 1 | -1): void {
    if (!this.items.length) {
      this.collect();
      return;
    }
    this.index = (this.index + dir + this.items.length) % this.items.length;
    this.paint();
  }

  private activate(): void {
    const el = this.items[this.index];
    if (!el) return;
    el.focus({ preventScroll: false });
    el.click();
    this.queueRecollect();
  }

  private onKey = (e: KeyboardEvent): void => {
    if (this.mode === 'off' || e.repeat || this.suspended()) return;
    // Never steal keys from typing.
    const target = e.target as HTMLElement | Window;
    if (
      target &&
      'closest' in target &&
      (target as HTMLElement).closest('input[type="text"], input[type="password"], textarea')
    ) {
      return;
    }
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    e.stopPropagation();
    if (this.mode === 'auto') {
      this.activate();
    } else {
      if (e.key === ' ') this.advance(1);
      else this.activate();
    }
  };

  private ensureRing(): void {
    if (this.ring) return;
    const ring = document.createElement('div');
    ring.id = 'bs-scan-ring';
    ring.setAttribute('aria-hidden', 'true');
    ring.style.transitionDuration = `${SCAN_RING_TRANSITION_MS}ms`;
    document.body.appendChild(ring);
    this.ring = ring;
  }

  private paint(): void {
    if (!this.ring) return;
    const el = this.items[this.index];
    if (!el) {
      this.ring.style.opacity = '0';
      return;
    }
    const r = el.getBoundingClientRect();
    const pad = 6;
    this.ring.style.opacity = '1';
    this.ring.style.top = `${r.top - pad}px`;
    this.ring.style.left = `${r.left - pad}px`;
    this.ring.style.width = `${r.width + pad * 2}px`;
    this.ring.style.height = `${r.height + pad * 2}px`;
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

export const scanner = new ScanController();
