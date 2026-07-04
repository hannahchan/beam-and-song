import { describe, expect, it } from 'vitest';
import { buildParams } from '../src/engine/params';
import { computeScene, type SimInput } from '../src/engine/scenes';
import { getLesson, LESSONS } from '../src/lessons/specs';
import { resolveLesson } from '../src/lessons/bands';
import { validateAll } from '../src/safety/validate';
import { DEFAULT_SETTINGS } from '../src/lib/store';
import type { LessonSpec, Scene } from '../src/lib/types';

/**
 * The structural round: per-lesson guidance metadata (skill, step links,
 * bridges, quiet preference) and the six behaviors that thickened Levels 2–4
 * and gave listening its second rung.
 */

const spec = (id: string) => LESSONS.find((l) => l.id === id)!;
const params = buildParams(DEFAULT_SETTINGS);
const quiet: SimInput = { seed: 42, taps: [] };

/** Sample a lesson at 10 fps over a window, collecting scenes and cues. */
function sample(l: LessonSpec, p = params, sim = quiet, seconds = 40): Scene[] {
  const scenes: Scene[] = [];
  for (let t = 0; t <= seconds * 1000; t += 100) {
    scenes.push(computeScene(l, p, t, sim, t - 100));
  }
  return scenes;
}

describe('lesson guidance metadata (PT-10 / CR-4)', () => {
  it('every lesson carries a skill phrase and a real-world bridge', () => {
    for (const l of LESSONS) {
      expect(l.skill.length, `${l.id} skill`).toBeGreaterThanOrEqual(4);
      expect(l.bridge.length, `${l.id} bridge`).toBeGreaterThan(20);
    }
  });

  it('step links point at real, different lessons in a sensible direction', () => {
    for (const l of LESSONS) {
      if (l.stepBack) {
        expect(l.stepBack, `${l.id} stepBack`).not.toBe(l.id);
        expect(getLesson(l.stepBack)!.level, `${l.id} stepBack level`).toBeLessThanOrEqual(l.level);
      }
      if (l.stepUp) {
        expect(l.stepUp, `${l.id} stepUp`).not.toBe(l.id);
        expect(getLesson(l.stepUp)!.level, `${l.id} stepUp level`).toBeGreaterThanOrEqual(l.level);
      }
    }
  });

  it('the find/search lessons carry the quiet-looking suggestion', () => {
    for (const id of [
      'find-the-star',
      'find-your-colour',
      'find-your-photo',
      'hidden-among-many',
      'follow-the-star',
      'star-by-star',
    ]) {
      expect(spec(id).quietPreferred, id).toBe(true);
    }
  });

  it('the validator rejects broken step links and missing bridge/skill copy', () => {
    const good = LESSONS[0];
    const broken: LessonSpec = { ...good, id: 'broken-link', stepUp: 'no-such-lesson' };
    expect(validateAll([...LESSONS, broken]).join('\n')).toMatch(/unknown lesson/);
    const selfish: LessonSpec = { ...good, id: 'selfish', stepBack: 'selfish' };
    expect(validateAll([selfish]).join('\n')).toMatch(/points at itself/);
    const bare = { ...good, id: 'bare', bridge: '', skill: '' } as LessonSpec;
    const errs = validateAll([bare]).join('\n');
    expect(errs).toMatch(/bridge/);
    expect(errs).toMatch(/skill/);
  });

  it('listening now has a second rung, and it suppresses the looping melody', async () => {
    const l = spec('song-then-star');
    expect(l.hearingFirst).toBe(true);
    expect(l.level).toBe(2);
    const { CUE_DRIVEN_BEHAVIORS } = await import('../src/lessons/specs');
    expect(CUE_DRIVEN_BEHAVIORS.has(l.behavior)).toBe(true);
  });
});

describe('peekaboo (hideReveal) — anticipation with a kept promise', () => {
  const moving = buildParams({ ...DEFAULT_SETTINGS, movement: true });
  const light = (s: Scene) => s.items.find((i) => i.r < 0.4 && i.alpha > 0.02);
  const hill = (s: Scene) => s.items.find((i) => i.r >= 0.4);

  it('the light hides, a wink sounds during the wait, and it returns where it vanished', () => {
    const scenes = sample(spec('peekaboo-light'), moving, quiet, 65);
    let lastSeenX: number | null = null;
    let hiddenAt = -1;
    let winked = false;
    let returned = false;
    for (const s of scenes) {
      const it = light(s);
      if (it) {
        if (hiddenAt >= 0 && lastSeenX !== null) {
          // Reappearance: the promise is kept — same place it melted away.
          expect(Math.abs(it.x - lastSeenX)).toBeLessThan(0.08);
          returned = true;
          hiddenAt = -1;
        }
        lastSeenX = it.x;
      } else if (hiddenAt < 0) {
        hiddenAt = 1;
        winked = false;
      }
      if (hiddenAt >= 0 && s.cues.includes('invite')) winked = true;
      if (hiddenAt >= 0 && winked) returned = false; // must return after the wink
    }
    expect(returned).toBe(true);
  });

  it('the hill is scenery: present, static, matte, and never "the target"', async () => {
    const scenes = sample(spec('peekaboo-light'), moving, quiet, 30).slice(30);
    const first = hill(scenes[0])!;
    expect(first).toBeDefined();
    expect(first.shape).toBe('hill');
    const { primarySceneItem } = await import('../src/engine/scenes');
    for (const s of scenes) {
      const h = hill(s)!;
      expect(h.x).toBe(first.x);
      expect(h.r).toBe(first.r);
      expect(h.glow).toBe(0);
      // PT-13's quadrant tally must follow the light, never the scenery.
      expect(primarySceneItem(s.items)?.shape ?? 'none').not.toBe('hill');
    }
  });

  it('with movement off the light still plays peekaboo, in one place', () => {
    const scenes = sample(spec('peekaboo-light'), params, quiet, 60);
    const xs = new Set<number>();
    let everHidden = false;
    for (const s of scenes) {
      const it = light(s);
      if (it) xs.add(Math.round(it.x * 100));
      else everHidden = true;
    }
    expect(everHidden).toBe(true);
    expect(xs.size).toBe(1);
  });
});

describe('reach for the light (reachTouch) — look, then touch', () => {
  const t0 = 6000;

  it('a touch on the light answers with a chime and a bloom', () => {
    const before = computeScene(spec('reach-for-the-light'), params, t0, quiet, t0 - 100);
    const target = before.items[0];
    const sim: SimInput = { seed: 42, taps: [{ t: t0, x: target.x, y: target.y }] };
    const atTap = computeScene(spec('reach-for-the-light'), params, t0 + 50, sim, t0 - 50);
    expect(atTap.cues).toContain('chime');
    const later = computeScene(spec('reach-for-the-light'), params, t0 + 900, sim, t0 + 800);
    expect(later.items.some((i) => i.shape === 'bloom')).toBe(true);
  });

  it('a switch press always counts as a hit (AR-8)', () => {
    const sim: SimInput = { seed: 42, taps: [{ t: t0, x: -1, y: -1 }] };
    const later = computeScene(spec('reach-for-the-light'), params, t0 + 900, sim, t0 + 800);
    expect(later.items.some((i) => i.shape === 'bloom')).toBe(true);
  });

  it('a far miss draws no bloom — only the gentle guiding lift', () => {
    const before = computeScene(spec('reach-for-the-light'), params, t0, quiet, t0 - 100);
    const target = before.items[0];
    const far = { x: target.x > 0.5 ? 0.02 : 0.98, y: target.y > 0.5 ? 0.02 : 0.98 };
    const sim: SimInput = { seed: 42, taps: [{ t: t0, ...far }] };
    const later = computeScene(spec('reach-for-the-light'), params, t0 + 700, sim, t0 + 600);
    expect(later.items.some((i) => i.shape === 'bloom')).toBe(false);
    expect(later.items[0].alpha).toBeGreaterThan(before.items[0].alpha * 0.98);
  });
});

describe('song, then star (soundThenLight) — the senses take turns', () => {
  it('the call sounds first, from the side where the star later appears', () => {
    const scenes = sample(spec('song-then-star'), params, quiet, 24);
    let callAt = -1;
    let callPan = 0;
    let starAt = -1;
    let starX = 0;
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      if (callAt < 0 && s.cues.includes('call')) {
        callAt = i;
        callPan = s.pan;
      }
      const star = s.items.find((it) => it.shape === 'star' && it.alpha > 0.1);
      if (callAt >= 0 && starAt < 0 && star) {
        starAt = i;
        starX = star.x;
      }
    }
    expect(callAt).toBeGreaterThan(0);
    expect(starAt).toBeGreaterThan(callAt + 10); // a real pause, not an overlap
    expect(Math.sign(callPan)).toBe(Math.sign(starX - 0.5));
  });

  it('the star is never on screen while the call window opens', () => {
    const scenes = sample(spec('song-then-star'), params, quiet, 24);
    for (const s of scenes) {
      if (s.cues.includes('call')) {
        expect(s.items.some((it) => it.shape === 'star' && it.alpha > 0.05)).toBe(false);
      }
    }
  });
});

describe('star by star (sweepRow) — an ordered sweep', () => {
  it('stars take their glowing turn strictly left to right', () => {
    const scenes = sample(spec('star-by-star'), params, quiet, 40);
    const firstLit = new Map<number, number>(); // x (rounded) -> first index clearly lit
    for (let i = 0; i < scenes.length; i++) {
      for (const it of scenes[i].items) {
        if (it.shape !== 'star') continue;
        const key = Math.round(it.x * 100);
        if (!firstLit.has(key) && it.alpha > params.peakAlpha * 0.6) firstLit.set(key, i);
      }
    }
    expect(firstLit.size).toBeGreaterThanOrEqual(3);
    const byX = [...firstLit.entries()].sort((a, b) => a[0] - b[0]).map(([, i]) => i);
    for (let k = 1; k < byX.length; k++) expect(byX[k], 'lit order follows x order').toBeGreaterThan(byX[k - 1]);
  });

  it('a tap answers only the star that is glowing', () => {
    const l = spec('star-by-star');
    // Find a moment when some star is clearly lit, then tap it.
    const scenes = sample(l, params, quiet, 40);
    const litIdx = scenes.findIndex((s) => s.items.some((it) => it.alpha > params.peakAlpha * 0.7));
    const t = litIdx * 100;
    const lit = scenes[litIdx].items.reduce((a, b) => (a.alpha > b.alpha ? a : b));
    const sim: SimInput = { seed: 42, taps: [{ t, x: lit.x, y: lit.y }] };
    const later = computeScene(l, params, t + 800, sim, t + 700);
    expect(later.items.some((i) => i.shape === 'bloom')).toBe(true);
  });
});

describe('a quiet scene (restingScene) — small, still company', () => {
  it('complexity decides how much of the cast appears', () => {
    const two = computeScene(spec('quiet-scene'), buildParams({ ...DEFAULT_SETTINGS, complexity: 1 }), 20_000, quiet, 19_900);
    const three = computeScene(spec('quiet-scene'), buildParams({ ...DEFAULT_SETTINGS, complexity: 2 }), 20_000, quiet, 19_900);
    expect(two.items).toHaveLength(2);
    expect(three.items).toHaveLength(3);
  });

  it('the teen harbour swaps the whole cast — no duck, no ball', () => {
    const teen = resolveLesson(spec('quiet-scene'), 'teen');
    const scene = computeScene(teen, buildParams({ ...DEFAULT_SETTINGS, complexity: 3 }), 20_000, quiet, 19_900);
    const shapes = scene.items.map((i) => i.shape);
    expect(shapes).toContain('boat');
    expect(shapes).toContain('moon');
    expect(shapes).not.toContain('duck');
    expect(shapes).not.toContain('ball');
  });
});

describe('find your colour (findColor) — hue is the anchor', () => {
  const p = buildParams({ ...DEFAULT_SETTINGS, complexity: 2 });
  const withPhotos: SimInput = { seed: 42, taps: [], photos: [{ dataUrl: 'x' }] };

  it('exactly one light wears the chosen colour; company keeps a quiet other hue, no photos ever', () => {
    const scene = computeScene(spec('find-your-colour'), p, 8000, withPhotos, 7900);
    const targets = scene.items.filter((i) => i.color === p.color);
    expect(targets).toHaveLength(1);
    expect(targets[0].shape).toBe('orb');
    expect(scene.items.some((i) => i.shape === 'photo')).toBe(false);
    const company = scene.items.filter((i) => i.color !== p.color);
    expect(company.length).toBeGreaterThanOrEqual(2);
    for (const c of company) expect(c.glow).toBe(0);
  });

  it('find-the-star keeps its star even when the family has photos (the copy is the contract)', () => {
    const scene = computeScene(spec('find-the-star'), p, 8000, withPhotos, 7900);
    expect(scene.items.some((i) => i.shape === 'photo')).toBe(false);
    expect(scene.items.some((i) => i.shape === 'star')).toBe(true);
  });

  it('find-your-photo still hunts the photo', () => {
    const scene = computeScene(spec('find-your-photo'), p, 8000, withPhotos, 7900);
    expect(scene.items.some((i) => i.shape === 'photo')).toBe(true);
  });
});
