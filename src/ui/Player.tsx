import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { navigate } from '../lib/router';
import { getLesson } from '../lessons/specs';
import { activeProfile, addSession, ensureProfile } from '../lib/store';
import { buildParams } from '../engine/params';
import { computeScene, restScene, type SimInput } from '../engine/scenes';
import { createPhotoCache, drawScene } from '../engine/render';
import { audio } from '../engine/audio';
import { buzz } from '../engine/haptics';
import { effectiveTaps } from '../engine/kernel';
import { SESSION_TAGS, type ResponseLevel, type SessionTag } from '../lib/types';

type Phase = 'running' | 'paused' | 'resting' | 'observe';

/**
 * FR-2 — the full-screen, distraction-free lesson player.
 *
 * A child can never get stuck (FR-5): the only chrome is one dim corner
 * button that opens the grown-up overlay. Opening it immediately dims the
 * scene and softens the sound (FR-12) — the overlay *is* the calm-down.
 * It is a single ordinary button, so a motor-impaired or switch-using
 * caregiver can operate it like any other control (FR-11); a baby cannot
 * complete the two-step Resume/End choice it reveals.
 */
export function Player({ lessonId }: { lessonId: string }) {
  const profile = ensureProfile();
  const lesson = getLesson(lessonId) ?? getLesson('gentle-glow')!;
  const settings = profile.settings;

  const [phase, setPhase] = useState<Phase>('running');
  const [soft, setSoft] = useState(false);
  const [againCount, setAgainCount] = useState(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const softRef = useRef(soft);
  softRef.current = soft;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tapsRef = useRef<number[]>([]);
  const startedAtRef = useRef(0);
  const againRef = useRef<(() => void) | null>(null);

  const params = useMemo(() => {
    const p = buildParams(settings);
    return p;
  }, [settings]);

  const photoDataUrl = profile.photos[0]?.dataUrl;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const photos = createPhotoCache();
    const sim: SimInput = { seed: 20260703, tapsMs: tapsRef.current, photoDataUrl };
    const sessionMs = Math.max(2, settings.sessionMinutes) * 60_000;

    let raf = 0;
    let lessonT = 0; // ms of *running* lesson time
    let prevT = 0;
    let restT = 0;
    let lastFrame = performance.now();
    let melody: ReturnType<typeof audio.startMelody> | null = null;
    let melodyWanted = settings.audioMode === 'with' && !!lesson.melody;
    let fadingOut = false;
    startedAtRef.current = Date.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const startMelodyIfWanted = () => {
      if (!melodyWanted || melody || !audio.unlocked) return;
      // Hearing-first pan lessons always travel; otherwise per setting (FR-10).
      const usePan = settings.soundFollowsTarget || lesson.behavior === 'audioPan';
      if (lesson.behavior === 'audioAlternate') return; // its voices come from cues
      melody = audio.startMelody(lesson.melody, {
        tempoScale: params.tempoScale,
        pan: usePan,
        layered: settings.audioStyle === 'layered',
        loop: true,
      });
    };
    audio.setVolume(settings.volume * (softRef.current ? 0.5 : 1));
    void audio.unlock().then(startMelodyIfWanted);

    // "Once more" from the rest screen: a fresh, equally gentle round (PT-6).
    againRef.current = () => {
      lessonT = 0;
      prevT = 0;
      restT = 0;
      fadingOut = false;
      tapsRef.current.length = 0;
      melody = null;
      startMelodyIfWanted();
    };

    // Screen must not sleep mid-lesson.
    let wakeLock: { release(): Promise<void> } | null = null;
    const grabWakeLock = async () => {
      try {
        wakeLock = await (navigator as Navigator & { wakeLock?: { request(t: string): Promise<never> } }).wakeLock?.request(
          'screen',
        ) ?? null;
      } catch {
        /* not critical */
      }
    };
    void grabWakeLock();

    const frame = (now: number) => {
      const dt = Math.min(now - lastFrame, 100);
      lastFrame = now;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (phaseRef.current === 'running') {
        prevT = lessonT;
        lessonT += dt;

        // PT-6 — gentle wind-down, never an abrupt stop.
        if (lessonT > sessionMs && !fadingOut) {
          fadingOut = true;
          melody?.stop(2.5);
          melody = null;
          setPhase('resting');
        }

        const scene = computeScene(lesson, softened(), lessonT, sim, prevT);
        for (const cue of scene.cues) {
          if (settings.audioMode === 'off') continue;
          if (settings.audioMode === 'after' && !isTapCue(cue)) continue;
          audio.playCue(cue, scene.pan * 0.6);
          if (isTapCue(cue)) buzz(settings.haptics);
        }
        if (melody && (settings.soundFollowsTarget || lesson.behavior === 'audioPan')) {
          melody.setPan(scene.pan);
        }
        drawScene(ctx, scene, w, h, photos);
      } else if (phaseRef.current === 'resting') {
        restT += dt;
        drawScene(ctx, restScene(params, restT), w, h, photos);
      } else {
        // paused/observe: hold the last frame, dimmed via CSS.
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const softened = () => {
      if (!softRef.current) return params;
      return { ...params, peakAlpha: params.peakAlpha * 0.55, glow: Math.min(params.glow, 0.6) };
    };

    /** Tap / switch input — anywhere counts (AR-1, AR-3, AR-8). */
    const onTap = () => {
      if (phaseRef.current !== 'running') return;
      if (!audio.unlocked) {
        void audio.unlock().then(startMelodyIfWanted);
      }
      const t = lessonT;
      if (lesson.interactive) {
        const before = effectiveTaps(tapsRef.current).length;
        tapsRef.current.push(t);
        const after = effectiveTaps(tapsRef.current).length;
        if (after === before) return; // inside cooldown — scene & sound ignore it too
      } else if (settings.audioMode === 'after') {
        // FR-6b — the grown-up taps when the baby looks; the song answers.
        melody ??= settings.audioMode === 'after' && lesson.melody
          ? audio.startMelody(lesson.melody, { tempoScale: params.tempoScale, pan: false, layered: settings.audioStyle === 'layered', loop: false })
          : null;
        melody?.playPhrase();
        buzz(settings.haptics);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('button, a, .overlay')) return;
      onTap();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setPhase((p) => (p === 'running' ? 'paused' : p));
        return;
      }
      if ((e.key === ' ' || e.key === 'Enter') && !(e.target as HTMLElement).closest('button, a, input, textarea')) {
        e.preventDefault();
        onTap();
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        if (phaseRef.current === 'running') setPhase('paused');
        audio.duck(0);
      } else {
        void grabWakeLock();
      }
    };
    canvas.parentElement?.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.parentElement?.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
      melody?.stop(0.5);
      audio.stopMelody(0.4);
      audio.duck(1);
      void wakeLock?.release().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  // FR-12 — opening the overlay is itself the calm-down: dim + hush at once.
  useEffect(() => {
    if (phase === 'paused' || phase === 'observe') audio.duck(0.12, 0.4);
    else audio.duck(1, 0.6);
  }, [phase]);

  useEffect(() => {
    audio.setVolume(settings.volume * (soft ? 0.5 : 1));
  }, [soft, settings.volume]);

  const finish = () => {
    setPhase('observe');
  };

  const leave = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    navigate('/');
  };

  return (
    <div class={`player ${phase === 'paused' || phase === 'observe' ? 'dimmed' : ''}`}>
      <canvas ref={canvasRef} aria-label={`${lesson.title} lesson playing`} role="img" />

      {settings.audioMode === 'after' && phase === 'running' && <AfterModeHint interactive={lesson.interactive} />}

      {phase === 'running' && (
        <button class="player-corner" onClick={() => setPhase('paused')} aria-label="Grown-ups: pause, soften, or end the lesson">
          &#9203;
        </button>
      )}

      {phase === 'paused' && (
        <div class="overlay" role="dialog" aria-modal="true" aria-label="Paused — grown-up controls">
          <div class="overlay-card">
            <h2>Paused</h2>
            <p class="card-note">The screen is dimmed and the sound is hushed. Take all the time you need.</p>
            <button class="btn btn-primary" onClick={() => setPhase('running')} autofocus>
              Continue the lesson
            </button>
            <button class="btn" aria-pressed={soft} onClick={() => setSoft(!soft)}>
              {soft ? 'Softer mode is on' : 'Softer — dim the light, quiet the song'}
            </button>
            <button class="btn" onClick={finish}>
              End the session
            </button>
          </div>
        </div>
      )}

      {phase === 'resting' && (
        <div class="rest-buttons">
          <button
            class="btn btn-ghost"
            onClick={() => {
              setAgainCount((c) => c + 1);
              againRef.current?.();
              setPhase('running');
            }}
          >
            Once more
          </button>
          <button class="btn btn-primary" onClick={finish}>
            Done
          </button>
        </div>
      )}
      {phase === 'resting' && againCount >= 1 && (
        <p class="player-hint">Short and sweet is best — looking is hard work for growing eyes.</p>
      )}

      {phase === 'observe' && (
        <ObservationCard
          onDone={(response, tags, note) => {
            const p = activeProfile();
            if (p) {
              addSession(p.id, {
                at: new Date(startedAtRef.current).toISOString(),
                lessonId: lesson.id,
                durationSec: Math.round((Date.now() - startedAtRef.current) / 1000),
                response,
                tags,
                note: note || undefined,
              });
            }
            leave();
          }}
        />
      )}
    </div>
  );
}

function isTapCue(cue: string): boolean {
  return cue === 'chime' || cue === 'note';
}

function AfterModeHint({ interactive }: { interactive: boolean }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setGone(true), 7000);
    return () => clearTimeout(id);
  }, []);
  return (
    <p class="player-hint" style={{ opacity: gone ? 0 : 1 }}>
      {interactive
        ? 'Sound plays after a touch — any touch or switch press counts.'
        : 'Sound is set to follow a look: tap the screen when your baby looks, and the song will answer.'}
    </p>
  );
}

/** PT-4 / PT-8 — one-tap session observation, entirely skippable. */
function ObservationCard({
  onDone,
}: {
  onDone: (response: ResponseLevel | null, tags: SessionTag[], note: string) => void;
}) {
  const [tags, setTags] = useState<SessionTag[]>([]);
  const [note, setNote] = useState('');
  const [response, setResponse] = useState<ResponseLevel | null>(null);

  const toggleTag = (t: SessionTag) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <div class="overlay" role="dialog" aria-modal="true" aria-label="How did it go?">
      <div class="overlay-card">
        <h2>How did it go?</h2>
        <p class="card-note">
          A ten-second note builds a picture over time. Quiet days are information too — never a verdict.
        </p>
        <div class="chips" role="group" aria-label="Did your baby respond?">
          {(
            [
              ['clear', 'Responded clearly'],
              ['some', 'A little'],
              ['none', 'Not this time'],
              ['unsure', 'Hard to say'],
            ] as const
          ).map(([val, label]) => (
            <button key={val} class="chip" aria-pressed={response === val} onClick={() => setResponse(val)}>
              {label}
            </button>
          ))}
        </div>
        <div class="chips" role="group" aria-label="Anything about today? Optional.">
          {SESSION_TAGS.map((t) => (
            <button key={t} class="chip" aria-pressed={tags.includes(t)} onClick={() => toggleTag(t)}>
              {t}
            </button>
          ))}
        </div>
        <label class="field">
          <span class="field-label">A note, if you like</span>
          <textarea value={note} onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)} rows={2} />
        </label>
        <div class="overlay-actions-row">
          <button class="btn" onClick={() => onDone(null, [], '')}>
            Skip
          </button>
          <button class="btn btn-primary" onClick={() => onDone(response, tags, note)}>
            Save &amp; finish
          </button>
        </div>
      </div>
    </div>
  );
}
