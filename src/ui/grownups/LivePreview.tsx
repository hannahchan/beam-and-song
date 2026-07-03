import { useEffect, useRef, useState } from 'preact/hooks';
import type { Profile } from '../../lib/types';
import { buildParams } from '../../engine/params';
import { computeScene, type SimInput } from '../../engine/scenes';
import { createPhotoCache, drawScene, fitCanvasToDisplay } from '../../engine/render';
import { audio } from '../../engine/audio';
import { getLesson, LESSONS } from '../../lessons/specs';
import { resolveLesson } from '../../lessons/bands';
import { enabledPhotos } from '../../lib/photos';

/** The sampler default: travels when movement is on, rests as a glow when off. */
const DEFAULT_PREVIEW = 'drifting-light';

/**
 * The live preview beside Settings — the caregiver sees every change the
 * instant they make it, without bouncing between screens. It runs the *real*
 * lesson engine (same scenes, same safety kernel), so what you see is
 * exactly what plays, smaller — and any lesson can be chosen for preview.
 */
export function LivePreview({ profile }: { profile: Profile }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lessonId, setLessonId] = useState(DEFAULT_PREVIEW);
  const [sounding, setSounding] = useState(false);
  const soundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const melodyRef = useRef<ReturnType<typeof audio.startMelody> | null>(null);

  // Refs read per-frame so setting changes, band changes, new photos, and the
  // chosen lesson all land instantly without restarting the loop.
  const spec = resolveLesson(getLesson(lessonId) ?? getLesson(DEFAULT_PREVIEW)!, profile.ageBand);
  const specRef = useRef(spec);
  specRef.current = spec;
  const settingsRef = useRef(profile.settings);
  settingsRef.current = profile.settings;
  const simRef = useRef<SimInput>({ seed: 11, taps: [] });
  simRef.current = {
    seed: 11,
    taps: [],
    photos: enabledPhotos(profile.photos).map((p) => ({ dataUrl: p.dataUrl, lum: p.lum })),
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const photoCache = createPhotoCache();
    let raf = 0;
    const t0 = performance.now();

    const resize = () => fitCanvasToDisplay(canvas, ctx);
    resize();
    window.addEventListener('resize', resize);

    // No document.hidden guard: browsers already pause rAF in hidden tabs,
    // and some embedded webviews report "hidden" while still rendering.
    const frame = (now: number) => {
      const params = buildParams(settingsRef.current);
      const scene = computeScene(specRef.current, params, now - t0, simRef.current);
      drawScene(ctx, scene, canvas.clientWidth, canvas.clientHeight, photoCache);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const stopSound = () => {
    if (soundTimer.current) clearTimeout(soundTimer.current);
    melodyRef.current?.stop(0.6);
    melodyRef.current = null;
    setSounding(false);
  };
  useEffect(() => stopSound, []);

  const toggleSound = async () => {
    if (sounding) {
      stopSound();
      return;
    }
    await audio.unlock();
    const s = settingsRef.current;
    audio.setVolume(s.volume);
    const melodyId = specRef.current.melody;
    const custom = s.melodySource !== 'builtin' ? profile.audio.find((a) => a.id === s.melodySource) : undefined;
    melodyRef.current = custom
      ? audio.startCustom(custom, melodyId, { loop: true })
      : audio.startMelody(melodyId, {
          tempoScale: buildParams(s).tempoScale,
          layered: s.audioStyle === 'layered',
          loop: true,
        });
    setSounding(true);
    soundTimer.current = setTimeout(stopSound, 12_000);
  };

  return (
    <aside class="settings-preview" aria-label="Live preview">
      <div class="card" style={{ margin: 0, padding: '0.9rem' }}>
        <canvas
          ref={canvasRef}
          class="preview-canvas"
          role="img"
          aria-label={`Live preview of ${spec.title} with the current settings`}
        />
        <label class="field" style={{ margin: '0.6rem 0 0' }}>
          <span class="sr-only">Lesson to preview</span>
          <select value={lessonId} onChange={(e) => setLessonId((e.target as HTMLSelectElement).value)}>
            {LESSONS.map((l) => {
              const r = resolveLesson(l, profile.ageBand);
              return (
                <option key={l.id} value={l.id}>
                  {l.hearingFirst ? 'Listening' : `Level ${l.level}`} · {r.title}
                </option>
              );
            })}
          </select>
        </label>
        <div class="spread" style={{ marginTop: '0.6rem', gap: '0.5rem' }}>
          <span class="card-note">Exactly what plays — smaller.</span>
          <button class="btn btn-small" aria-pressed={sounding} onClick={() => void toggleSound()}>
            {sounding ? 'Stop sound' : 'Hear a moment'}
          </button>
        </div>
        {spec.hearingFirst && <p class="card-note" style={{ marginTop: '0.5rem' }}>This one is mostly sound — the screen stays nearly dark on purpose.</p>}
      </div>
    </aside>
  );
}
