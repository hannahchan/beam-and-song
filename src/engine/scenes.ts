import type { LessonSpec, Scene, SceneItem } from '../lib/types';
import type { EngineParams } from './params';
import { biasBandX, biasBandY, biasPoint } from './params';
import {
  clamp,
  clamp01,
  easeInOutSine,
  effectiveTaps,
  envelopeLength,
  fadeEnvelope,
  makeRng,
  mix,
  safeMod,
  smooth,
} from './kernel';
import { mixHex } from '../safety/luminance';

/**
 * Pure scene computation: (lesson, params, time, inputs) -> what is on screen.
 * No DOM, no canvas, no randomness outside the seeded RNG — so the safety
 * suite can simulate every lesson frame-by-frame and measure it (SR-8),
 * and the renderer stays a thin drawing pass.
 */

export interface SimInput {
  seed: number;
  /** Raw tap/switch timestamps in lesson-ms. Cooldown filtering happens here. */
  tapsMs: readonly number[];
  photoDataUrl?: string;
}

const EMPTY: readonly number[] = [];

export function computeScene(
  spec: LessonSpec,
  p: EngineParams,
  tMs: number,
  sim: SimInput,
  prevTMs: number = tMs,
): Scene {
  const scene: Scene = { bg: p.bg, items: [], pan: 0, cues: [] };
  const taps = spec.interactive ? effectiveTaps(sim.tapsMs) : EMPTY;
  const cue = (name: string, atMs: number) => {
    if (atMs > prevTMs && atMs <= tMs) scene.cues.push(name);
  };

  switch (spec.behavior) {
    case 'pulse':
      pulse(scene, p, tMs);
      break;
    case 'twinkle':
      twinkle(scene, p, tMs);
      break;
    case 'driftAcross':
      driftAcross(scene, p, tMs);
      break;
    case 'causeEffect':
      causeEffect(scene, p, tMs, taps, cue);
      break;
    case 'appearSpots':
      appearSpots(scene, p, tMs, sim.seed);
      break;
    case 'fallDrop':
      fallDrop(scene, p, tMs, sim.seed, cue);
      break;
    case 'pathArc':
      pathArc(scene, p, tMs);
      break;
    case 'inviteTwo':
      inviteTwo(scene, p, tMs, taps, cue);
      break;
    case 'rollBounce':
      rollBounce(scene, p, tMs, taps, cue);
      break;
    case 'glideAcross':
      glideAcross(scene, p, tMs);
      break;
    case 'riseFloat':
      riseFloat(scene, p, tMs, sim.seed, taps, cue);
      break;
    case 'photoDrift':
      photoDrift(scene, p, tMs, sim.photoDataUrl);
      break;
    case 'audioPan':
      audioPan(scene, p, tMs);
      break;
    case 'audioAlternate':
      audioAlternate(scene, p, tMs, cue);
      break;
  }

  // Subtle texture only at complexity 3, and only ever near-invisible dim
  // points — never stripes or patterns (SR-5).
  if (p.complexity >= 3 && !spec.hearingFirst && spec.behavior !== 'photoDrift') {
    backdropStars(scene, sim.seed);
  }

  return scene;
}

/* ------------------------------- helpers ------------------------------- */

function orb(p: EngineParams, over: Partial<SceneItem> = {}): SceneItem {
  return {
    shape: 'orb',
    x: 0.5,
    y: 0.5,
    r: p.radius,
    color: p.color,
    alpha: p.peakAlpha,
    glow: p.glow,
    ...over,
  };
}

/** Gentle entry so no lesson ever starts with content already at full strength. */
function entry(tMs: number, p: EngineParams): number {
  return smooth(tMs / Math.max(p.fadeMs, 1));
}

function breathe(p: EngineParams, tMs: number, phase = 0): number {
  return 1 + safeMod(tMs / 1000, p.modHz, p.modDepth, phase);
}

/* ------------------------------- behaviors ------------------------------- */

function pulse(scene: Scene, p: EngineParams, tMs: number): void {
  const pos = biasPoint(0.5, 0.5, p.fieldBias, p.biasStrength);
  const a = p.peakAlpha * 0.92 * breathe(p, tMs) * entry(tMs, p);
  scene.items.push(
    orb(p, { x: pos.x, y: pos.y, alpha: clamp01(a), r: p.radius * (1 + 0.4 * safeMod(tMs / 1000, p.modHz, p.modDepth, Math.PI / 2)) }),
  );
  scene.pan = (pos.x - 0.5) * 1.6;
}

function twinkle(scene: Scene, p: EngineParams, tMs: number): void {
  const pos = biasPoint(0.5, 0.42, p.fieldBias, p.biasStrength);
  const a = p.peakAlpha * 0.9 * breathe(p, tMs) * entry(tMs, p);
  scene.items.push({
    ...orb(p, { x: pos.x, y: pos.y }),
    shape: 'star',
    alpha: clamp01(a),
    r: p.radius * (1 + 0.5 * safeMod(tMs / 1000, p.modHz * 0.8, p.modDepth, 1.3)),
    rot: 0.12 * Math.sin(2 * Math.PI * clamp(p.modHz * 0.3, 0, 0.5) * (tMs / 1000)),
  });
  scene.pan = (pos.x - 0.5) * 1.6;
}

function driftAcross(scene: Scene, p: EngineParams, tMs: number): void {
  if (!p.movement) {
    pulse(scene, p, tMs);
    return;
  }
  const travelMs = (0.7 / p.speed) * 1000;
  const cycleMs = p.fadeMs + travelMs + p.fadeMs + p.holdMs * 0.6;
  const idx = Math.floor(tMs / cycleMs);
  const local = tMs - idx * cycleMs;
  const dir = idx % 2 === 0 ? 1 : -1;
  const u = easeInOutSine(clamp01((local - p.fadeMs) / travelMs));
  const x = dir > 0 ? mix(0.15, 0.85, u) : mix(0.85, 0.15, u);
  const y =
    biasBandY(p.fieldBias, p.biasStrength) +
    0.3 * safeMod(tMs / 1000, p.modHz * 0.6, p.modDepth, 0.7);
  const env = fadeEnvelope(local, 0, p.fadeMs, travelMs, p.fadeMs);
  scene.items.push(orb(p, { x, y, alpha: clamp01(p.peakAlpha * env * breathe(p, tMs)) }));
  scene.pan = (x - 0.5) * 1.6;
}

function causeEffect(
  scene: Scene,
  p: EngineParams,
  tMs: number,
  taps: readonly number[],
  cue: (name: string, atMs: number) => void,
): void {
  const pos = biasPoint(0.5, 0.5, p.fieldBias, p.biasStrength);
  // Waiting light: dim and patient.
  const gate = entry(tMs, p);
  let alpha = p.peakAlpha * 0.4 * breathe(p, tMs) * gate;
  let radius = p.radius;

  for (const tap of taps) {
    // A touch during the entry fade answers once the light has fully arrived —
    // response and entry ramps never multiply into a steeper combined ramp.
    const tapAt = Math.max(tap, p.fadeMs);
    cue('chime', tapAt);
    const dt = tMs - tapAt;
    if (dt < 0) continue;
    // The light warms to full and relaxes — all fades >= safety floor, and the
    // bloom is staggered behind the lift so their luminance ramps never stack.
    const lift = fadeEnvelope(dt, 0, 800, 900, 1400);
    alpha = Math.max(alpha, p.peakAlpha * (0.4 + 0.6 * lift) * gate);
    radius = p.radius * (1 + 0.1 * lift);
    // Soft bloom halo, desaturated toward white (never a saturated-red burst, SR-5/SR-6).
    const bloomEnv = fadeEnvelope(dt - 500, 0, 800, 300, 1300) * gate;
    if (bloomEnv > 0.01) {
      const spread = smooth(clamp01((dt - 500) / envelopeLength(800, 300, 1300)));
      scene.items.push({
        shape: 'bloom',
        x: pos.x,
        y: pos.y,
        r: p.radius * (1.05 + 0.4 * spread),
        color: mixHex(p.color, '#f7f3ea', 0.65),
        alpha: 0.25 * bloomEnv,
        glow: 0,
      });
    }
  }

  scene.items.push(orb(p, { x: pos.x, y: pos.y, alpha: clamp01(alpha), r: radius }));
  scene.pan = (pos.x - 0.5) * 1.6;
}

function appearSpots(scene: Scene, p: EngineParams, tMs: number, seed: number): void {
  const cycleMs = envelopeLength(p.fadeMs, p.holdMs, p.fadeMs) + p.holdMs * 0.6;
  const idx = Math.floor(tMs / cycleMs);
  const local = tMs - idx * cycleMs;

  const posFor = (i: number) => {
    const rng = makeRng((seed ^ (i * 2654435761)) >>> 0);
    let pt = biasPoint(rng(), rng(), p.fieldBias, p.biasStrength);
    if (i > 0) {
      const prev = posFor(i - 1);
      const d = Math.hypot(pt.x - prev.x, pt.y - prev.y);
      if (d < 0.2) pt = biasPoint(rng(), rng(), p.fieldBias, p.biasStrength);
    }
    return pt;
  };
  const pos = posFor(idx);
  const env = fadeEnvelope(local, 0, p.fadeMs, p.holdMs, p.fadeMs);
  if (env > 0.005) {
    scene.items.push(orb(p, { x: pos.x, y: pos.y, r: p.radius * 0.8, alpha: clamp01(p.peakAlpha * env * breathe(p, tMs)) }));
  }
  scene.pan = (pos.x - 0.5) * 1.6;
}

function fallDrop(
  scene: Scene,
  p: EngineParams,
  tMs: number,
  seed: number,
  cue: (name: string, atMs: number) => void,
): void {
  const fallMs = (0.62 / p.speed) * 1000;
  const cycleMs = p.fadeMs + fallMs + 1500 + p.holdMs * 0.5;
  const idx = Math.floor(tMs / cycleMs);
  const local = tMs - idx * cycleMs;
  const rng = makeRng((seed ^ (idx * 40503)) >>> 0);
  const x = biasPoint(rng(), 0.5, p.fieldBias, p.biasStrength).x;

  const landAt = idx * cycleMs + p.fadeMs + fallMs;
  cue('plink', landAt);

  const u = easeInOutSine(clamp01((local - p.fadeMs) / fallMs));
  const y = mix(0.12, 0.74, u);
  const env = fadeEnvelope(local, 0, p.fadeMs, fallMs, 900);
  if (env > 0.005) {
    scene.items.push({ ...orb(p, { x, y }), shape: 'drop', r: p.radius * 0.62, alpha: clamp01(p.peakAlpha * env) });
  }
  // Soft landing ripple — small, dim, slow (SR-6 applies to every "moment").
  const sinceLand = local - (p.fadeMs + fallMs);
  if (sinceLand > 0) {
    const rippleEnv = fadeEnvelope(sinceLand, 0, 500, 100, 900);
    if (rippleEnv > 0.01) {
      const spread = smooth(clamp01(sinceLand / 1500));
      scene.items.push({
        shape: 'bloom',
        x,
        y: 0.76,
        r: p.radius * (0.5 + 1.1 * spread),
        color: mixHex(p.color, '#f7f3ea', 0.5),
        alpha: 0.3 * rippleEnv,
        glow: 0,
      });
    }
  }
  scene.pan = (x - 0.5) * 1.6;
}

function pathArc(scene: Scene, p: EngineParams, tMs: number): void {
  if (!p.movement) {
    twinkle(scene, p, tMs);
    return;
  }
  const cy = mix(biasBandY(p.fieldBias, p.biasStrength), 0.5, 0.3);
  const omega = (p.speed / 0.32) * 0.9; // rad/s along the wide axis — slow by construction
  const th = omega * (tMs / 1000);
  const x = 0.5 + 0.32 * Math.cos(th);
  const y = cy + 0.14 * Math.sin(2 * th);
  scene.items.push({
    ...orb(p, { x, y }),
    shape: 'star',
    alpha: clamp01(p.peakAlpha * 0.92 * breathe(p, tMs) * entry(tMs, p)),
    rot: 0.1 * Math.sin(th),
  });
  scene.pan = clamp((x - 0.5) * 1.8, -0.85, 0.85);
}

function inviteTwo(
  scene: Scene,
  p: EngineParams,
  tMs: number,
  taps: readonly number[],
  cue: (name: string, atMs: number) => void,
): void {
  const y = biasBandY(p.fieldBias, p.biasStrength);
  const bx = biasBandX(p.fieldBias, p.biasStrength);
  const posA = { x: clamp(bx - 0.22, 0.14, 0.86), y };
  const posB = { x: clamp(bx + 0.22, 0.14, 0.86), y };

  // Rest first, then invite: lesson entry and the first invite never ramp
  // together, and every invite rises out of stillness.
  const inviteMs = envelopeLength(p.fadeMs, p.holdMs * 1.1, p.fadeMs);
  const cycleMs = p.holdMs + inviteMs;
  const idx = Math.floor(tMs / cycleMs);
  const local = tMs - idx * cycleMs;
  const inviter = idx % 2 === 0 ? 0 : 1;
  cue('invite', idx * cycleMs + p.holdMs + p.fadeMs * 0.6);

  const inviteEnv = fadeEnvelope(local - p.holdMs, 0, p.fadeMs, p.holdMs * 1.1, p.fadeMs);

  // Tap during an invite makes the bright one answer with a bloom.
  let answer = 0;
  for (const tap of taps) {
    const dt = tMs - tap;
    if (dt >= 0) answer = Math.max(answer, fadeEnvelope(dt, 0, 700, 400, 1200));
    cue('chime', tap);
  }

  const base = p.peakAlpha * 0.3;
  const lit = p.peakAlpha * (0.3 + 0.62 * inviteEnv);
  const positions = [posA, posB];
  for (let i = 0; i < 2; i++) {
    const isInviter = i === inviter;
    const alpha = (isInviter ? lit : base) * breathe(p, tMs, i * 1.7) * entry(tMs, p);
    scene.items.push(orb(p, { x: positions[i].x, y: positions[i].y, r: p.radius * 0.85, alpha: clamp01(alpha) }));
    // A touch can only bloom a firefly that is actually inviting — so the
    // reward never stacks onto the lesson's own entry or rest transitions.
    if (isInviter && answer > 0.01 && inviteEnv > 0.01) {
      scene.items.push({
        shape: 'bloom',
        x: positions[i].x,
        y: positions[i].y,
        r: p.radius * (1.0 + 0.5 * answer),
        color: mixHex(p.color, '#f7f3ea', 0.65),
        alpha: 0.3 * answer * inviteEnv,
        glow: 0,
      });
    }
  }
  scene.pan = ((positions[inviter].x - 0.5) * 1.6) * inviteEnv;
}

function rollBounce(
  scene: Scene,
  p: EngineParams,
  tMs: number,
  taps: readonly number[],
  cue: (name: string, atMs: number) => void,
): void {
  const ground = clamp(biasBandY(p.fieldBias, p.biasStrength) + 0.12, 0.45, 0.78);

  if (!p.movement) {
    // Resting ball: breathes in place; a touch still gives the soft hop.
    let y = ground;
    for (const tap of taps) {
      const dt = tMs - tap;
      if (dt >= 0) {
        cue('note', tap);
        y = ground - 0.035 * fadeEnvelope(dt, 0, 500, 0, 700);
      }
    }
    scene.items.push({
      ...orb(p, { x: 0.5, y }),
      shape: 'ball',
      alpha: clamp01(p.peakAlpha * entry(tMs, p) * breathe(p, tMs)),
      rot: 0,
    });
    return;
  }

  const enterMs = (0.65 / p.speed) * 1000;
  const restMs = p.holdMs * 3;
  const exitMs = enterMs * 0.8;
  const cycleMs = p.fadeMs + enterMs + restMs + exitMs + p.holdMs * 0.5;
  const local = tMs % cycleMs;

  let x: number;
  let y = ground;
  let env = 1;
  let rot = 0;

  if (local < p.fadeMs + enterMs) {
    const u = easeInOutSine(clamp01((local - p.fadeMs) / enterMs));
    x = mix(0.12, 0.5, u);
    env = smooth(clamp01(local / p.fadeMs));
    // Two diminishing, slow bounces on the way in.
    const hump = (a: number, b: number, h: number) =>
      u > a && u < b ? h * Math.sin(Math.PI * ((u - a) / (b - a))) : 0;
    y = ground - hump(0.35, 0.62, 0.05) - hump(0.62, 0.82, 0.024);
    rot = (x - 0.12) / Math.max(p.radius, 0.04);
  } else if (local < p.fadeMs + enterMs + restMs) {
    x = 0.5;
    rot = (0.5 - 0.12) / Math.max(p.radius, 0.04);
    // A touch gives a soft little hop.
    for (const tap of taps) {
      const dt = tMs - tap;
      if (dt >= 0) {
        cue('note', tap);
        const hop = fadeEnvelope(dt, 0, 500, 0, 700);
        y = ground - 0.035 * hop;
      }
    }
  } else {
    const exitStart = p.fadeMs + enterMs + restMs;
    const u = easeInOutSine(clamp01((local - exitStart) / exitMs));
    x = mix(0.5, 0.9, u);
    rot = (x - 0.12) / Math.max(p.radius, 0.04);
    // Fade out over the last stretch of the roll — never a cut (FR-8).
    const fadeOutStart = exitStart + Math.max(exitMs - p.fadeMs, 0);
    env = 1 - smooth(clamp01((local - fadeOutStart) / p.fadeMs));
  }

  scene.items.push({
    ...orb(p, { x, y }),
    shape: 'ball',
    alpha: clamp01(p.peakAlpha * env * breathe(p, tMs)),
    rot,
  });
  scene.pan = (x - 0.5) * 1.6;
}

function glideAcross(scene: Scene, p: EngineParams, tMs: number): void {
  const water = clamp(biasBandY(p.fieldBias, p.biasStrength) + 0.08, 0.4, 0.72);
  if (!p.movement) {
    scene.items.push({
      ...orb(p, { x: 0.5, y: water }),
      shape: 'duck',
      alpha: clamp01(p.peakAlpha * entry(tMs, p) * breathe(p, tMs)),
      rot: 0,
    });
    return;
  }
  const glideMs = (0.36 / p.speed) * 1000;
  const bobMs = p.holdMs * 1.4;
  const cycleMs = p.fadeMs + glideMs + bobMs + glideMs + p.fadeMs + p.holdMs * 0.5;
  const local = tMs % cycleMs;

  let x: number;
  if (local < p.fadeMs + glideMs) {
    x = mix(0.14, 0.5, easeInOutSine(clamp01((local - p.fadeMs) / glideMs)));
  } else if (local < p.fadeMs + glideMs + bobMs) {
    x = 0.5;
  } else {
    x = mix(0.5, 0.86, easeInOutSine(clamp01((local - p.fadeMs - glideMs - bobMs) / glideMs)));
  }
  const env = fadeEnvelope(local, 0, p.fadeMs, glideMs + bobMs + glideMs, p.fadeMs);
  const bob = 0.35 * safeMod(tMs / 1000, p.modHz * 0.7, p.modDepth, 0.4);
  scene.items.push({
    ...orb(p, { x, y: water + bob }),
    shape: 'duck',
    alpha: clamp01(p.peakAlpha * env * breathe(p, tMs, 2)),
    rot: bob * 0.6,
  });
  scene.pan = (x - 0.5) * 1.6;
}

function riseFloat(
  scene: Scene,
  p: EngineParams,
  tMs: number,
  seed: number,
  taps: readonly number[],
  cue: (name: string, atMs: number) => void,
): void {
  if (!p.movement) {
    const pos = biasPoint(0.5, 0.6, p.fieldBias, p.biasStrength);
    const sway = 0.3 * safeMod(tMs / 1000, p.modHz * 0.8, p.modDepth, 1);
    scene.items.push({
      ...orb(p, { x: pos.x + sway, y: pos.y }),
      shape: 'balloon',
      alpha: clamp01(p.peakAlpha * entry(tMs, p) * breathe(p, tMs)),
      rot: sway * 2,
    });
    return;
  }
  const riseMs = (0.75 / (p.speed * 0.85)) * 1000;
  const cycleMs = p.fadeMs + riseMs + p.holdMs * 0.6;
  const idx = Math.floor(tMs / cycleMs);
  const local = tMs - idx * cycleMs;
  const rng = makeRng((seed ^ (idx * 69621)) >>> 0);
  const bx = biasPoint(rng(), 0.5, p.fieldBias, p.biasStrength).x;

  let swayAmp = 0.028;
  for (const tap of taps) {
    const dt = tMs - tap;
    if (dt >= 0) {
      cue('note', tap);
      swayAmp += 0.014 * fadeEnvelope(dt, 0, 500, 500, 900);
    }
  }
  const sway = swayAmp * Math.sin(2 * Math.PI * clamp(p.modHz * 0.9, 0, 0.5) * (tMs / 1000));
  const u = easeInOutSine(clamp01((local - p.fadeMs) / riseMs));
  const y = mix(0.94, 0.14, u);
  const env = fadeEnvelope(local, 0, p.fadeMs, riseMs * 0.82, riseMs * 0.18 + 200);
  if (env > 0.005) {
    scene.items.push({
      ...orb(p, { x: clamp(bx + sway, 0.1, 0.9), y }),
      shape: 'balloon',
      alpha: clamp01(p.peakAlpha * env),
      rot: sway * 2.2,
    });
  }
  scene.pan = (bx - 0.5) * 1.6;
}

function photoDrift(scene: Scene, p: EngineParams, tMs: number, photoDataUrl?: string): void {
  const pos = biasPoint(0.5, 0.5, p.fieldBias, p.biasStrength);
  const cycleMs = envelopeLength(p.fadeMs * 1.6, p.holdMs * 2.6, p.fadeMs * 1.6) + p.holdMs * 0.8;
  const local = tMs % cycleMs;
  const env = fadeEnvelope(local, 0, p.fadeMs * 1.6, p.holdMs * 2.6, p.fadeMs * 1.6);
  const driftX = p.movement ? 0.25 * safeMod(tMs / 1000, p.modHz * 0.5, p.modDepth, 0) : 0;
  const driftY = p.movement ? 0.2 * safeMod(tMs / 1000, p.modHz * 0.35, p.modDepth, 1.2) : 0;
  if (env > 0.005) {
    scene.items.push({
      shape: 'photo',
      x: pos.x + driftX,
      y: pos.y + driftY,
      r: p.radius * 1.4,
      color: '#888888',
      alpha: clamp01(p.peakAlpha * 0.95 * env),
      glow: 0, // photos never glow (PR-13; also keeps luminance bounded)
      photoDataUrl,
    });
  }
  scene.pan = (pos.x - 0.5) * 1.2;
}

/** Listening lesson: near-dark screen, the song slowly travels ear to ear (CR-5). */
function audioPan(scene: Scene, p: EngineParams, tMs: number): void {
  const period = 16; // seconds for a full there-and-back — far below any risk band
  const pan = Math.sin((2 * Math.PI * (tMs / 1000)) / period) * 0.85;
  const pos = biasPoint(0.5, 0.5, p.fieldBias, p.biasStrength);
  // A single ember so the screen reads as "on", far too dim to compete with listening.
  scene.items.push(
    orb(p, {
      x: pos.x,
      y: pos.y,
      r: p.radius * 0.35,
      alpha: clamp01(0.14 * p.peakAlpha * breathe(p, tMs) * entry(tMs, p)),
      glow: Math.min(p.glow, 0.6),
    }),
  );
  scene.pan = pan;
}

/** Bell and drum take slow turns (CR-5 discrimination). */
function audioAlternate(
  scene: Scene,
  p: EngineParams,
  tMs: number,
  cue: (name: string, atMs: number) => void,
): void {
  const y = biasBandY(p.fieldBias, p.biasStrength);
  const halfMs = 6000 + p.holdMs; // each voice's turn, incl. quiet gap
  const cycleMs = halfMs * 2;
  const idx = Math.floor(tMs / cycleMs);
  const local = tMs - idx * cycleMs;
  cue('bell', idx * cycleMs + 400);
  cue('drum', idx * cycleMs + halfMs + 400);

  const bellActive = local < halfMs;
  const glowEnv = fadeEnvelope(local % halfMs, 0, 600, 2400, Math.max(halfMs - 3600, 600));
  const mk = (x: number, active: boolean): SceneItem =>
    orb(p, {
      x,
      y,
      r: p.radius * 0.4,
      alpha: clamp01((0.1 + (active ? 0.1 * glowEnv : 0)) * p.peakAlpha * entry(tMs, p)),
      glow: Math.min(p.glow, 0.6),
    });
  scene.items.push(mk(0.28, bellActive), mk(0.72, !bellActive));
  scene.pan = bellActive ? -0.5 : 0.5;
}

/** Complexity level 3: a handful of near-invisible resting points, never patterns. */
function backdropStars(scene: Scene, seed: number): void {
  const rng = makeRng(seed ^ 0x5f3759df);
  for (let i = 0; i < 5; i++) {
    scene.items.push({
      shape: 'orb',
      x: 0.1 + rng() * 0.8,
      y: 0.1 + rng() * 0.8,
      r: 0.006,
      color: '#9aa4b8',
      alpha: 0.1,
      glow: 0,
    });
  }
}

/** The end-of-session rest screen: a dim moon, everything winding down (PT-6). */
export function restScene(p: EngineParams, tMs: number): Scene {
  const breatheSlow = 1 + safeMod(tMs / 1000, 0.08, 0.04);
  return {
    bg: p.bg,
    pan: 0,
    cues: [],
    items: [
      {
        shape: 'moon',
        x: 0.5,
        y: 0.44,
        r: 0.1,
        color: '#e8e4d8',
        alpha: 0.4 * breatheSlow * smooth(Math.min(tMs / 2000, 1)),
        glow: 0.5,
      },
      { shape: 'orb', x: 0.3, y: 0.28, r: 0.007, color: '#cfd4de', alpha: 0.22, glow: 0 },
      { shape: 'orb', x: 0.72, y: 0.62, r: 0.006, color: '#cfd4de', alpha: 0.18, glow: 0 },
    ],
  };
}
