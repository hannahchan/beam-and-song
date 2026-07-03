import { useEffect, useRef, useState } from 'preact/hooks';
import type { Profile } from '../../lib/types';
import { buildParams } from '../../engine/params';
import { computeScene, type SimInput } from '../../engine/scenes';
import { createPhotoCache, drawScene, fitCanvasToDisplay } from '../../engine/render';
import { audio } from '../../engine/audio';
import { getLesson } from '../../lessons/specs';

/**
 * The live preview beside Settings — the caregiver sees every change the
 * instant they make it, without bouncing between screens. It runs the *real*
 * lesson engine (same scenes, same safety kernel), so what you see is
 * exactly what plays, smaller.
 */
export function LivePreview({ profile }: { profile: Profile }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef(profile.settings);
  settingsRef.current = profile.settings;
  const [sounding, setSounding] = useState(false);
  const soundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const melodyRef = useRef<ReturnType<typeof audio.startMelody> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const photoCache = createPhotoCache();
    // Drifting light doubles as the perfect sampler: it travels when movement
    // is on and rests as a breathing glow when movement is off.
    const spec = getLesson('drifting-light')!;
    const sim: SimInput = { seed: 11, taps: [] };
    let raf = 0;
    const t0 = performance.now();

    const resize = () => fitCanvasToDisplay(canvas, ctx);
    resize();
    window.addEventListener('resize', resize);

    // No document.hidden guard: browsers already pause rAF in hidden tabs,
    // and some embedded webviews report "hidden" while still rendering.
    const frame = (now: number) => {
      // Reading settings each frame makes every slider move land instantly.
      const params = buildParams(settingsRef.current);
      const scene = computeScene(spec, params, now - t0, sim);
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
    const custom = s.melodySource !== 'builtin' ? profile.audio.find((a) => a.id === s.melodySource) : undefined;
    melodyRef.current = custom
      ? audio.startCustom(custom, 'brahms', { loop: true })
      : audio.startMelody('brahms', {
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
          aria-label="Live preview of how lessons will look with the current settings"
        />
        <div class="spread" style={{ marginTop: '0.6rem', gap: '0.5rem' }}>
          <span class="card-note">Exactly what plays — smaller.</span>
          <button class="btn btn-small" aria-pressed={sounding} onClick={() => void toggleSound()}>
            {sounding ? 'Stop sound' : 'Hear a moment'}
          </button>
        </div>
      </div>
    </aside>
  );
}
