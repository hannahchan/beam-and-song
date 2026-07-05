import { useEffect, useRef, useState } from 'preact/hooks';
import type { Profile, TapEvent } from '../../lib/types';
import { buildParams } from '../../engine/params';
import { computeScene, type SimInput } from '../../engine/scenes';
import { createPhotoCache, drawScene, fitCanvasToDisplay } from '../../engine/render';
import { audio, isTapCue } from '../../engine/audio';
import { CUE_DRIVEN_BEHAVIORS, HOLD_DRIVEN_BEHAVIORS, cuePan, LESSONS } from '../../lessons/specs';
import { resolveLesson } from '../../lessons/bands';
import { enabledPhotos } from '../../lib/photos';
import type { HoldSpan } from '../../engine/kernel';
import { Card } from './bits';

const AUTO_ADVANCE_MS = 18_000;

/**
 * The walk-through: every lesson, one after another, on a single page,
 * rendered by the real engine with the active child's settings, band, and
 * photos, so what reviewers and families see here is exactly what plays.
 * Built for the clinical-review pass ("look at all the content quickly"),
 * and just as handy for a caregiver browsing what exists.
 */
export function Review({ profile }: { profile: Profile | null }) {
  if (!profile) {
    return (
      <div>
        <h1 tabindex={-1}>Walk through the lessons</h1>
        <p>
          First, add a child on the <a href="#/grown-ups/profiles">Children page</a>. The walk-through uses
          their settings.
        </p>
      </div>
    );
  }
  return <ReviewInner profile={profile} />;
}

function ReviewInner({ profile }: { profile: Profile }) {
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(false);
  const [sound, setSound] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const melodyRef = useRef<ReturnType<typeof audio.startMelody> | null>(null);
  const tapsRef = useRef<TapEvent[]>([]);
  const holdsRef = useRef<HoldSpan[]>([]);
  const openHoldRef = useRef(-1);
  const t0Ref = useRef(performance.now());
  const prevTRef = useRef(0);

  const base = LESSONS[idx];
  const spec = resolveLesson(base, profile.ageBand);
  const missingPhoto = base.requiresPhoto && enabledPhotos(profile.photos).length === 0;

  // Refs read per-frame so lesson changes and settings edits land instantly.
  const specRef = useRef(spec);
  specRef.current = spec;
  const settingsRef = useRef(profile.settings);
  settingsRef.current = profile.settings;
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const simRef = useRef<SimInput>({ seed: 11, taps: tapsRef.current });
  simRef.current = {
    seed: 11 + idx * 7,
    taps: tapsRef.current,
    holds: holdsRef.current,
    photos: enabledPhotos(profile.photos).map((p) => ({ dataUrl: p.dataUrl, lum: p.lum })),
  };

  // Each lesson starts from its own quiet beginning.
  useEffect(() => {
    t0Ref.current = performance.now();
    prevTRef.current = 0;
    tapsRef.current.length = 0;
    holdsRef.current.length = 0;
    openHoldRef.current = -1;
  }, [idx]);

  // Hold-to-sustain lessons respond to press-and-hold here too.
  useEffect(() => {
    const release = () => {
      if (openHoldRef.current < 0) return;
      holdsRef.current[openHoldRef.current].end = performance.now() - t0Ref.current;
      openHoldRef.current = -1;
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const photoCache = createPhotoCache();
    let raf = 0;

    const resize = () => fitCanvasToDisplay(canvas, ctx);
    resize();
    window.addEventListener('resize', resize);

    const frame = (now: number) => {
      fitCanvasToDisplay(canvas, ctx); // stay glued to the CSS box (see engine/render)
      const t = now - t0Ref.current;
      const params = buildParams(settingsRef.current);
      const scene = computeScene(specRef.current, params, t, simRef.current, prevTRef.current);
      prevTRef.current = t;
      if (soundRef.current) {
        for (const cue of scene.cues) {
          // Quiet-bound lessons keep only their answer sounds, as in a real
          // session, so a reviewer hears what the child would.
          if (specRef.current.quietPreferred && !isTapCue(cue)) continue;
          audio.playCue(cue, cuePan(specRef.current, scene.pan));
        }
      }
      drawScene(ctx, scene, canvas.clientWidth, canvas.clientHeight, photoCache);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // The looping melody follows the lesson and the sound toggle; cue-driven
  // lessons (listening and pure cause-and-effect) stay melody-free here
  // exactly as in the player, and the find/search lessons stay quiet too,
  // so a reviewer hears what a session actually sounds like.
  useEffect(() => {
    melodyRef.current?.stop(0.4);
    melodyRef.current = null;
    if (!sound || CUE_DRIVEN_BEHAVIORS.has(spec.behavior) || spec.quietPreferred) return;
    let cancelled = false;
    void audio.unlock().then(() => {
      if (cancelled) return;
      audio.setVolume(profile.settings.volume);
      melodyRef.current = audio.startMelody(spec.melody, {
        tempoScale: buildParams(profile.settings).tempoScale,
        layered: profile.settings.audioStyle === 'layered',
        loop: true,
      });
    });
    return () => {
      cancelled = true;
      melodyRef.current?.stop(0.4);
      melodyRef.current = null;
    };
  }, [sound, idx, spec.melody]);

  // Optional slow slideshow for a full review pass.
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % LESSONS.length), AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [auto, idx]);

  // Arrow keys page through; ordinary buttons carry switch and keyboard users.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % LESSONS.length);
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + LESSONS.length) % LESSONS.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onPointerDown = (e: PointerEvent) => {
    if (!specRef.current.interactive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (HOLD_DRIVEN_BEHAVIORS.has(specRef.current.behavior)) {
      if (openHoldRef.current < 0) {
        holdsRef.current.push({ start: performance.now() - t0Ref.current, end: Number.POSITIVE_INFINITY });
        openHoldRef.current = holdsRef.current.length - 1;
      }
      return;
    }
    const rect = canvas.getBoundingClientRect();
    tapsRef.current.push({
      t: performance.now() - t0Ref.current,
      x: (e.clientX - rect.left) / Math.max(rect.width, 1),
      y: (e.clientY - rect.top) / Math.max(rect.height, 1),
    });
  };

  const groupLabel = base.hearingFirst ? `Listening · Level ${base.level}` : `Level ${base.level}`;

  return (
    <div class="stack">
      <h1 tabindex={-1}>Walk through the lessons</h1>
      <p class="card-note">
        Every lesson, one after another, played by the real engine with {profile.nickname}'s current
        settings, age band, and photos. Tap the picture to try a touch response. This is the quickest way to
        see the whole library, for you, or for a vision professional reviewing it.
      </p>
      <Card title={`${idx + 1} of ${LESSONS.length} · ${groupLabel}`}>
        <canvas
          ref={canvasRef}
          class="review-canvas"
          role="img"
          aria-label={`${spec.title} playing with the current settings`}
          onPointerDown={onPointerDown}
        />
        <div class="spread" style={{ marginTop: '0.8rem', gap: '0.6rem', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>{spec.title}</h2>
          <span class="lesson-skill">Practises: {spec.skill}</span>
        </div>
        <p class="card-note">{spec.goal}</p>
        {missingPhoto && (
          <p class="card-note">
            This one uses the family's own photos. <a href="#/grown-ups/settings">Add one in Settings</a> to
            see it properly. A soft placeholder stands in meanwhile.
          </p>
        )}
        <div class="row" style={{ marginTop: '0.4rem', flexWrap: 'wrap' }}>
          <button
            class="btn"
            aria-label="Previous lesson"
            onClick={() => setIdx((i) => (i - 1 + LESSONS.length) % LESSONS.length)}
          >
            ← Previous
          </button>
          <button class="btn" aria-label="Next lesson" onClick={() => setIdx((i) => (i + 1) % LESSONS.length)}>
            Next →
          </button>
          <button class="btn" aria-pressed={auto} onClick={() => setAuto(!auto)}>
            {auto ? 'Stop the slideshow' : 'Walk through by itself'}
          </button>
          <button class="btn" aria-pressed={sound} onClick={() => setSound(!sound)}>
            {sound ? 'Sound off' : 'Sound on'}
          </button>
          <a class="btn btn-primary" href={`#/play?lesson=${base.id}`}>
            Play full screen
          </a>
        </div>
        <p class="hint" style={{ marginTop: '0.6rem' }}>
          Arrow keys page through. The slideshow moves on every {Math.round(AUTO_ADVANCE_MS / 1000)} seconds,
          slower than any real session would.
        </p>
      </Card>
    </div>
  );
}
