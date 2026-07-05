// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  dwellFromPace,
  ScanController,
  SCAN_MIN_DWELL_MS,
  SCAN_MAX_DWELL_MS,
  SCAN_RING_TRANSITION_MS,
} from '../src/ui/scan';
import { SAFETY } from '../src/safety/constants';

/**
 * AR-2/AR-8, the scanning system itself must obey the calm rules:
 * latency-respecting dwell, and a highlight that glides rather than blinks.
 */

function setupDom(): HTMLButtonElement[] {
  document.body.innerHTML = '';
  const mk = (label: string) => {
    const b = document.createElement('button');
    b.textContent = label;
    // jsdom reports zero rects; give the filter something visible.
    b.getBoundingClientRect = () => ({ width: 100, height: 50, top: 0, left: 0, right: 100, bottom: 50, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    b.scrollIntoView = () => {};
    document.body.appendChild(b);
    return b;
  };
  return [mk('one'), mk('two'), mk('three')];
}

const press = (key: string) =>
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

afterEach(() => {
  document.body.className = '';
  document.body.innerHTML = '';
});

describe('switch scanning', () => {
  it('dwell respects the latency floor and ceiling (AR-8, PR-5)', () => {
    expect(dwellFromPace(0.1)).toBe(SCAN_MIN_DWELL_MS);
    expect(dwellFromPace(2.4)).toBeLessThanOrEqual(SCAN_MAX_DWELL_MS);
    expect(dwellFromPace(2.4)).toBeGreaterThan(dwellFromPace(1.0));
    expect(SCAN_MIN_DWELL_MS).toBeGreaterThanOrEqual(1500);
  });

  it('the highlight ring glides, transition no faster than the fade floor (FR-8)', () => {
    expect(SCAN_RING_TRANSITION_MS).toBeGreaterThanOrEqual(SAFETY.MIN_FADE_MS);
  });

  it('step mode: Space advances, Enter activates', () => {
    const [a, b] = setupDom();
    const clicks: string[] = [];
    for (const el of [a, b]) el.addEventListener('click', () => clicks.push(el.textContent!));
    const scan = new ScanController();
    scan.configure('step', 1500);
    press(' ');
    press('Enter');
    expect(clicks).toEqual(['two']);
    scan.stop();
  });

  it('auto mode: timer advances, any switch activates', () => {
    vi.useFakeTimers();
    const btns = setupDom();
    const clicks: string[] = [];
    for (const el of btns) el.addEventListener('click', () => clicks.push(el.textContent!));
    const scan = new ScanController();
    scan.configure('auto', 1500);
    vi.advanceTimersByTime(3100); // two dwells: one -> two -> three
    press('Enter');
    expect(clicks).toEqual(['three']);
    scan.stop();
    vi.useRealTimers();
  });

  it('suspends completely while a lesson is live, the switch is the child’s (FR-9)', () => {
    const btns = setupDom();
    const clicks: string[] = [];
    for (const el of btns) el.addEventListener('click', () => clicks.push(el.textContent!));
    document.body.classList.add('bs-lesson-live');
    const scan = new ScanController();
    scan.configure('auto', 1500);
    const evt = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    window.dispatchEvent(evt);
    expect(clicks).toEqual([]);
    expect(evt.defaultPrevented).toBe(false); // key flows through to the lesson
    scan.stop();
  });

  it('never steals keys while typing in a text field', () => {
    setupDom();
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);
    const scan = new ScanController();
    scan.configure('step', 1500);
    const evt = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    Object.defineProperty(evt, 'target', { value: input });
    window.dispatchEvent(evt);
    expect(evt.defaultPrevented).toBe(false);
    scan.stop();
  });
});
