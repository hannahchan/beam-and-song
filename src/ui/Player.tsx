import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { navigate } from '../lib/router';
import { CUE_DRIVEN_BEHAVIORS, HOLD_DRIVEN_BEHAVIORS, getLesson } from '../lessons/specs';
import { bandLookPhrase, bandNoun, resolveLesson } from '../lessons/bands';
import { activeProfile, addSession, ensureProfile } from '../lib/store';
import { buildParams } from '../engine/params';
import { computeScene, primarySceneItem, restScene, type SimInput } from '../engine/scenes';
import { createPhotoCache, drawScene, fitCanvasToDisplay } from '../engine/render';
import { audio } from '../engine/audio';
import { buzz } from '../engine/haptics';
import { effectiveTapEvents, type HoldSpan } from '../engine/kernel';
import type { LessonSpec, TapEvent } from '../lib/types';
import { AfterModeHint, ObservationCard } from './SessionOverlays';
import { emptyTally, quadrantOf, type RegionTally } from '../lib/regions';
import { enabledPhotos, voiceForItems } from '../lib/photos';
import { CHOICE_BEHAVIORS, LessonScanController, LESSON_SCAN } from './lessonScan';
import { dwellFromPace } from './scan';
import { paceMultiplier } from '../engine/params';

type Phase = 'running' | 'paused' | 'resting' | 'observe';

/**
 * FR-2, the full-screen, distraction-free lesson player.
 *
 * Plays either a single lesson or a named program (PT-9) as a queued session:
 * each lesson gets an equal slice of the session time and hands over with a
 * slow crossfade and a beat of quiet, never a cut (FR-8).
 *
 * A child can never get stuck (FR-5): the only chrome is one dim corner
 * button that opens the grown-up overlay. Opening it immediately dims the
 * scene and softens the sound (FR-12), the overlay *is* the calm-down.
 * It is a single ordinary button, so a motor-impaired or switch-using
 * caregiver can operate it like any other control (FR-11); a baby cannot
 * complete the two-step Resume/End choice it reveals.
 */
export function Player({ lessonId, programId }: { lessonId?: string; programId?: string }) {
  const profile = ensureProfile();
  const settings = profile.settings;

  const program = programId ? profile.programs.find((p) => p.id === programId) : undefined;
  const queue = useMemo<LessonSpec[]>(() => {
    const ids = program ? program.lessonIds : [lessonId ?? ''];
    const specs = ids
      .map(getLesson)
      .filter((l): l is LessonSpec => !!l && !(l.requiresPhoto && enabledPhotos(profile.photos).length === 0))
      .map((l) => resolveLesson(l, profile.ageBand)); // CR-9: band skin, same behavior
    return specs.length ? specs : [resolveLesson(getLesson('gentle-glow')!, profile.ageBand)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId, lessonId, profile.ageBand]);

  const [phase, setPhase] = useState<Phase>('running');
  const [soft, setSoft] = useState(false);
  const [againCount, setAgainCount] = useState(0);
  const [current, setCurrent] = useState<LessonSpec>(queue[0]);
  // TR-9, on-device diagnostics for the scripted hardware soak (docs/perf-budgets.md).
  const diag = location.hash.includes('diag=1');
  const [diagText, setDiagText] = useState('');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const softRef = useRef(soft);
  softRef.current = soft;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tapsRef = useRef<TapEvent[]>([]);
  const holdsRef = useRef<HoldSpan[]>([]);
  const startedAtRef = useRef(0);
  const againRef = useRef<(() => void) | null>(null);
  const regionsRef = useRef<RegionTally>(emptyTally());
  const lastQuadRef = useRef<'ul' | 'ur' | 'll' | 'lr'>('ul');
  // CR-3, the voice label for the photo currently on screen, refreshed per frame.
  const voiceRef = useRef<{ blobId: string; gain: number } | null>(null);

  const params = useMemo(() => buildParams(settings), [settings]);
  const photos = enabledPhotos(profile.photos).map((p) => ({ dataUrl: p.dataUrl, lum: p.lum }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const photoCache = createPhotoCache();
    const sessionMs = Math.max(2, settings.sessionMinutes) * 60_000;
    // Each program entry gets an equal slice, never less than 45 s (FR-7).
    const sliceMs = queue.length > 1 ? Math.max(45_000, sessionMs / queue.length) : sessionMs;
    const XFADE_MS = 1400;
    const GAP_MS = 700;

    let idx = 0;
    let spec = queue[0];
    let sim: SimInput = { seed: 20260703, taps: tapsRef.current, holds: holdsRef.current, photos };
    // AR-8, with scanning on, find/search lessons become stepped choices.
    const lessonScan = new LessonScanController();
    const scanDwellMs = dwellFromPace(paceMultiplier(settings.pace));
    const choiceScanActive = () => settings.scanning !== 'off' && CHOICE_BEHAVIORS.has(spec.behavior);
    let raf = 0;
    let lessonT = 0;
    let prevT = 0;
    let restT = 0;
    let handover: null | { at: number } = null; // lessonT when the crossfade began
    let lastFrame = performance.now();
    let melody: ReturnType<typeof audio.startMelody> | null = null;
    let windingDown = false;
    startedAtRef.current = Date.now();

    const resize = () => fitCanvasToDisplay(canvas, ctx);
    resize();
    window.addEventListener('resize', resize);

    // CR-3, the family's own song, when chosen, replaces the built-in melody.
    const customMeta =
      settings.melodySource !== 'builtin'
        ? profile.audio.find((a) => a.id === settings.melodySource)
        : undefined;

    const melodyWanted = () => settings.audioMode === 'with' && !CUE_DRIVEN_BEHAVIORS.has(spec.behavior);
    const startMelodyIfWanted = () => {
      if (!melodyWanted() || melody || !audio.unlocked) return;
      const usePan = settings.soundFollowsTarget || spec.behavior === 'audioPan';
      melody = customMeta
        ? audio.startCustom(customMeta, spec.melody, { pan: usePan, loop: true })
        : audio.startMelody(spec.melody, {
            tempoScale: params.tempoScale,
            pan: usePan,
            layered: settings.audioStyle === 'layered',
            loop: true,
          });
    };

    // Hold-to-sustain input (AR-8-friendly): fingers and held switches both
    // open a span; the kernel's slew limiter makes any pattern safe.
    const holdState = { pointers: 0, key: false, open: -1 };
    const holdDriven = () => HOLD_DRIVEN_BEHAVIORS.has(spec.behavior);
    const syncHold = () => {
      const active = holdState.pointers > 0 || holdState.key;
      const holds = holdsRef.current;
      if (active && holdState.open < 0) {
        holds.push({ start: lessonT, end: Number.POSITIVE_INFINITY });
        holdState.open = holds.length - 1;
      } else if (!active && holdState.open >= 0) {
        holds[holdState.open].end = lessonT;
        holdState.open = -1;
      }
    };
    const releaseAllHolds = () => {
      holdState.pointers = 0;
      holdState.key = false;
      syncHold();
    };

    const beginLesson = (nextIdx: number) => {
      idx = nextIdx;
      spec = queue[idx];
      tapsRef.current.length = 0;
      holdsRef.current.length = 0;
      holdState.pointers = 0;
      holdState.key = false;
      holdState.open = -1;
      sim = { seed: 20260703 + idx * 101, taps: tapsRef.current, holds: holdsRef.current, photos };
      lessonT = 0;
      prevT = 0;
      handover = null;
      melody = null;
      lessonScan.reset();
      startMelodyIfWanted();
      setCurrent(spec);
    };

    audio.setVolume(settings.volume * (softRef.current ? 0.5 : 1));
    void audio.unlock().then(startMelodyIfWanted);

    againRef.current = () => {
      restT = 0;
      windingDown = false;
      audio.stopMelody(0.2);
      beginLesson(0);
    };

    let wakeLock: { release(): Promise<void> } | null = null;
    const grabWakeLock = async () => {
      try {
        wakeLock =
          (await (
            navigator as Navigator & { wakeLock?: { request(t: string): Promise<never> } }
          ).wakeLock?.request('screen')) ?? null;
      } catch {
        /* not critical */
      }
    };
    void grabWakeLock();

    const softened = () => {
      if (!softRef.current) return params;
      return { ...params, peakAlpha: params.peakAlpha * 0.55, glow: Math.min(params.glow, 0.6) };
    };

    let frames = 0;
    let dropped = 0;
    let worstDt = 0;
    let lastDiagAt = 0;

    const frame = (now: number) => {
      const dt = Math.min(now - lastFrame, 100);
      lastFrame = now;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (diag && phaseRef.current === 'running') {
        frames++;
        if (dt > 34) dropped++; // more than ~2 vsync intervals at 60 Hz
        worstDt = Math.max(worstDt, dt);
        if (now - lastDiagAt > 1000) {
          lastDiagAt = now;
          setDiagText(
            `${spec.id} · frames ${frames} · dropped ${dropped} (${((dropped / Math.max(frames, 1)) * 100).toFixed(2)}%) · worst ${worstDt.toFixed(0)}ms`,
          );
        }
      }

      if (phaseRef.current === 'running') {
        prevT = lessonT;
        lessonT += dt;

        // Slice elapsed: hand over to the next lesson, or wind the session down (PT-6).
        if (lessonT > sliceMs && !handover && !windingDown) {
          if (idx < queue.length - 1) {
            handover = { at: lessonT };
            melody?.stop(1.2);
            melody = null;
          } else {
            windingDown = true;
            melody?.stop(2.5);
            melody = null;
            setPhase('resting');
          }
        }

        const scene = computeScene(spec, softened(), lessonT, sim, prevT);
        const main = primarySceneItem(scene.items);
        // PT-13 (opt-in): tally which quadrant the main target sat in, and
        // where marked responses landed. Descriptive support only (SR-7).
        if (settings.fieldObservation && !handover && main) {
          const q = quadrantOf(main.x, main.y);
          lastQuadRef.current = q;
          regionsRef.current[q].s += dt / 1000;
          if (scene.cues.some(isTapCue)) regionsRef.current[q].r += 1;
        }
        const fadeK = handover ? Math.min((lessonT - handover.at) / XFADE_MS, 1) : 0;
        voiceRef.current = voiceForItems(scene.items, profile.photos);
        for (const cue of scene.cues) {
          if (settings.audioMode === 'off' || handover) continue;
          if (settings.audioMode === 'after' && !isTapCue(cue)) continue;
          // In photo lessons, a recorded voice label is the answer (CR-3):
          // the caregiver's own "the red ball!" instead of the chime.
          if (cue === 'chime' && voiceRef.current) {
            audio.playVoiceLabel(voiceRef.current.blobId, voiceRef.current.gain);
          } else {
            audio.playCue(cue, scene.pan * 0.6);
          }
          if (isTapCue(cue)) buzz(settings.haptics);
        }
        if (melody && (settings.soundFollowsTarget || spec.behavior === 'audioPan')) {
          // FR-10: the music sits where the target sits, including its height.
          melody.setPan(scene.pan, main?.y ?? 0.5);
        }
        drawScene(ctx, scene, w, h, photoCache);
        if (choiceScanActive() && !handover) {
          const ring = lessonScan.update(scene.items, lessonT, dt, settings.scanning as 'auto' | 'step', scanDwellMs);
          if (ring.visible) {
            const minDim = Math.min(w, h);
            ctx.save();
            ctx.globalAlpha = ring.alpha;
            ctx.strokeStyle = '#9ec1ff';
            ctx.lineWidth = Math.max(3, minDim * LESSON_SCAN.STROKE_FRAC);
            ctx.beginPath();
            ctx.arc(ring.x * w, ring.y * h, ring.r * minDim, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
        if (fadeK > 0) {
          ctx.save();
          ctx.globalAlpha = fadeK;
          ctx.fillStyle = scene.bg;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
        if (handover && lessonT - handover.at > XFADE_MS + GAP_MS) {
          beginLesson(idx + 1);
        }
      } else if (phaseRef.current === 'resting') {
        restT += dt;
        drawScene(ctx, restScene(params, restT), w, h, photoCache);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    /**
     * Tap / switch input, anywhere counts (AR-1, AR-3, AR-8). Pointer taps
     * carry a position for the find/search lessons; a switch press carries
     * x = -1, which those lessons treat as a hit (attending + pressing is
     * the achievement, position accuracy must never exclude switch users).
     */
    const onTap = (x = -1, y = -1) => {
      if (phaseRef.current !== 'running' || handover) return;
      if (!audio.unlocked) {
        void audio.unlock().then(startMelodyIfWanted);
      }
      const t = lessonT;
      if (spec.interactive) {
        // Same cooldown source of truth as the scene (kernel.effectiveTapEvents):
        // record the tap, react only if it survives the safety cooldown.
        tapsRef.current.push({ t, x, y });
        const eff = effectiveTapEvents(tapsRef.current);
        if (eff[eff.length - 1]?.t !== t) return;
      } else if (settings.audioMode === 'after') {
        // FR-6b, the grown-up taps when the baby looks; the song answers.
        // If the photo on screen has a recorded voice label, that voice IS
        // the answer, the most meaningful sound we can offer (CR-3).
        if (voiceRef.current) {
          audio.playVoiceLabel(voiceRef.current.blobId, voiceRef.current.gain);
        } else {
          melody ??= customMeta
            ? audio.startCustom(customMeta, spec.melody, { pan: false, loop: false })
            : audio.startMelody(spec.melody, {
                tempoScale: params.tempoScale,
                pan: false,
                layered: settings.audioStyle === 'layered',
                loop: false,
              });
          melody.playPhrase();
        }
        buzz(settings.haptics);
        // The grown-up marked a look (FR-6b), that's a response too (PT-13).
        if (settings.fieldObservation) regionsRef.current[lastQuadRef.current].r += 1;
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('button, a, .overlay')) return;
      if (holdDriven()) {
        if (phaseRef.current !== 'running' || handover) return;
        if (!audio.unlocked) void audio.unlock().then(startMelodyIfWanted);
        holdState.pointers++;
        syncHold();
        return;
      }
      const rect = canvas.getBoundingClientRect();
      onTap((e.clientX - rect.left) / Math.max(rect.width, 1), (e.clientY - rect.top) / Math.max(rect.height, 1));
    };
    // Releases always land, even mid-pause or over the overlay, a light that
    // cannot be let go of would be worse than no light at all.
    const onPointerUp = () => {
      if (holdState.pointers === 0) return;
      holdState.pointers--;
      syncHold();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.repeat) {
        e.preventDefault();
        releaseAllHolds();
        setPhase((p) => (p === 'running' ? 'paused' : p));
        return;
      }
      if ((e.key === ' ' || e.key === 'Enter') && !(e.target as HTMLElement).closest('button, a, input, textarea')) {
        e.preventDefault();
        if (holdDriven()) {
          // A held switch is a hold (AR-8): down opens the span, up closes it.
          if (e.repeat || phaseRef.current !== 'running' || handover) return;
          if (!audio.unlocked) void audio.unlock().then(startMelodyIfWanted);
          holdState.key = true;
          syncHold();
          return;
        }
        if (e.repeat) return;
        // Choice scanning: the switch steps the ring / picks the highlighted
        // light, instead of the tap-anywhere auto-hit (AR-8).
        if (phaseRef.current === 'running' && choiceScanActive()) {
          if (settings.scanning === 'step' && e.key === ' ') {
            lessonScan.step(lessonT);
            return;
          }
          const sel = lessonScan.selection();
          if (sel) onTap(sel.x, sel.y);
          return;
        }
        onTap();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && holdState.key) {
        holdState.key = false;
        syncHold();
      }
    };
    const onBlur = () => releaseAllHolds();
    const onVisibility = () => {
      if (document.hidden) {
        releaseAllHolds();
        if (phaseRef.current === 'running') setPhase('paused');
        audio.duck(0);
      } else {
        void grabWakeLock();
      }
    };
    canvas.parentElement?.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.parentElement?.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      melody?.stop(0.5);
      audio.stopMelody(0.4);
      audio.duck(1);
      void wakeLock?.release().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.map((q) => q.id).join('|')]);

  // FR-12, opening the overlay is itself the calm-down: dim + hush at once.
  useEffect(() => {
    if (phase === 'paused' || phase === 'observe') audio.duck(0.12, 0.4);
    else audio.duck(1, 0.6);
  }, [phase]);

  // While the lesson is live, the switch belongs to the child (AR-8):
  // scanning suspends and Space/Enter are lesson input. Overlays wake it.
  useEffect(() => {
    document.body.classList.toggle('bs-lesson-live', phase === 'running');
    return () => document.body.classList.remove('bs-lesson-live');
  }, [phase]);

  useEffect(() => {
    audio.setVolume(settings.volume * (soft ? 0.5 : 1));
  }, [soft, settings.volume]);

  const finish = () => setPhase('observe');

  const leave = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    navigate('/');
  };

  return (
    <div class={`player ${phase === 'paused' || phase === 'observe' ? 'dimmed' : ''}`}>
      <canvas ref={canvasRef} aria-label={`${current.title} lesson playing`} role="img" />

      {diag && diagText && (
        <p class="player-hint" style={{ top: '0.6rem', bottom: 'auto', opacity: 0.8 }}>
          {diagText}
        </p>
      )}

      {settings.audioMode === 'after' && phase === 'running' && (
        <AfterModeHint interactive={current.interactive} lookPhrase={bandLookPhrase(profile.ageBand)} />
      )}

      {phase === 'running' && (
        <button class="player-corner" onClick={() => setPhase('paused')} aria-label="Grown-ups: pause, soften, or end the lesson">
          &#9203;
        </button>
      )}

      {phase === 'paused' && (
        <div class="overlay" role="dialog" aria-modal="true" aria-label="Paused, grown-up controls">
          <div class="overlay-card">
            <h2>Paused</h2>
            <p class="card-note">The screen is dimmed and the sound is hushed. Take all the time you need.</p>
            <button class="btn btn-primary" onClick={() => setPhase('running')} autofocus>
              Continue the lesson
            </button>
            <button class="btn" aria-pressed={soft} onClick={() => setSoft(!soft)}>
              {soft ? 'Softer mode is on' : 'Softer, dim the light, quiet the song'}
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
        <p class="player-hint">Short and sweet is best. Looking is genuinely hard work.</p>
      )}

      {phase === 'observe' && (
        <ObservationCard
          noun={bandNoun(profile.ageBand)}
          onDone={(response, tags, note) => {
            const p = activeProfile();
            if (p) {
              const tally = regionsRef.current;
              const hasRegionData =
                settings.fieldObservation && Object.values(tally).some((q) => q.s > 5);
              addSession(p.id, {
                at: new Date(startedAtRef.current).toISOString(),
                lessonId: current.id,
                programName: program?.name,
                durationSec: Math.round((Date.now() - startedAtRef.current) / 1000),
                response,
                tags,
                note: note || undefined,
                regions: hasRegionData ? tally : undefined,
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
  return cue === 'chime' || cue === 'note' || cue === 'hum';
}
