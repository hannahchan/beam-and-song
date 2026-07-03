import { useEffect, useRef, useState } from 'preact/hooks';
import type { Profile } from '../../lib/types';
import { updateProfile, updateSettings } from '../../lib/store';
import { PRESETS } from '../../lib/presets';
import { TARGET_COLORS } from '../../safety/constants';
import { MAX_PHOTOS_PER_PROFILE, processPhotoFile } from '../../lib/photos';
import { uid } from '../../lib/store';
import { analyzeAudio, checkAudioFile, deleteBlob, MAX_AUDIO_FILES, putBlob } from '../../lib/media';
import { buildParams } from '../../engine/params';
import { computeScene } from '../../engine/scenes';
import { createPhotoCache, drawScene } from '../../engine/render';
import { audio } from '../../engine/audio';
import { getLesson } from '../../lessons/specs';
import { Card, RadioGroup, RangeField, Toggle } from './bits';

/**
 * Section 5 — every personalization axis, in plain words, presets first
 * (PR-10). Changes save instantly.
 */
export function Settings({ profile }: { profile: Profile | null }) {
  if (!profile) {
    return (
      <div>
        <h1 tabindex={-1}>Settings</h1>
        <p>
          First, add a child on the <a href="#/grown-ups/profiles">Children page</a>.
        </p>
      </div>
    );
  }
  const s = profile.settings;
  const set = (patch: Partial<typeof s>) => updateSettings(profile.id, patch);

  return (
    <div class="settings-layout">
      <LivePreview profile={profile} />
      <div class="stack settings-main">
      <h1 tabindex={-1}>Settings for {profile.nickname}</h1>
      <p class="card-note" style={{ maxWidth: '46rem' }}>
        There is no single right setup — the right one is {profile.nickname}'s. Start from a preset, change one
        thing at a time, and let your vision professional guide the bigger choices. The preview follows every
        change as you make it.
      </p>

      <Card title="Age">
        <RadioGroup
          legend={`How should lessons speak to ${profile.nickname}?`}
          value={profile.ageBand}
          onChange={(ageBand) => updateProfile(profile.id, (p) => (p.ageBand = ageBand))}
          options={[
            { value: 'infant', label: 'A baby', detail: 'Up to around 18 months — lullabies, stars, ducks.' },
            { value: 'child', label: 'A child', detail: 'Roughly 2–9 — the same warm lessons, wording adjusted.' },
            {
              value: 'teen',
              label: 'An older child or teen',
              detail: 'Roughly 10 and up — embers, orbits, and ambient music instead of nursery content.',
            },
          ]}
        />
        <p class="hint">
          Age changes how lessons look, sound, and speak — never how simple they are allowed to be. Someone
          older working on the earliest looking skills gets the same calm, high-salience targets, presented with
          respect (no cartoon ducks, no nursery rhymes).
        </p>
      </Card>

      <Card title="Start from a preset">
        <div class="row">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              class="btn"
              aria-pressed={profile.presetId === p.id}
              title={p.blurb}
              onClick={() => {
                updateProfile(profile.id, (prof) => {
                  prof.settings = { ...prof.settings, ...p.settings };
                  prof.presetId = p.id;
                  for (const f of p.seedFavorites) {
                    if (!prof.favorites.includes(f)) prof.favorites.push(f);
                  }
                  prof.lastReviewAt = new Date().toISOString();
                });
              }}
            >
              {p.title}
            </button>
          ))}
        </div>
        <p class="card-note">
          Not sure which? The <a href="#/grown-ups/setup">guided setup</a> asks five quick questions and suggests
          one.
        </p>
      </Card>

      <Card title="Looking">
        <div class="field">
          <span class="field-label" id="color-label">
            Target colour
          </span>
          <p class="hint">Many children with CVI are drawn to one colour — often red or yellow, but not always.</p>
          <div class="swatches" role="group" aria-labelledby="color-label">
            {Object.entries(TARGET_COLORS).map(([id, hex]) => (
              <button
                key={id}
                class="swatch"
                style={{ background: hex }}
                aria-pressed={s.targetColor === id}
                aria-label={`Target colour ${id}`}
                onClick={() => set({ targetColor: id as typeof s.targetColor })}
              />
            ))}
          </div>
        </div>

        <RadioGroup
          legend="Background"
          value={s.background}
          onChange={(background) => set({ background })}
          options={[
            { value: 'black', label: 'Pure black', detail: 'Highest contrast — the usual choice.' },
            { value: 'midnight', label: 'Midnight blue', detail: 'A whisper softer than black.' },
            { value: 'charcoal', label: 'Charcoal', detail: 'For screens that look harsh at full black.' },
          ]}
        />

        <RangeField
          label="Target size"
          value={s.size}
          min={1}
          max={5}
          words={['Small', 'Smallish', 'Middling', 'Large', 'Very large']}
          hint="Bigger is easier. Making it smaller over time gently practises seeing at a distance."
          onChange={(size) => set({ size: size as typeof s.size })}
        />

        <RangeField
          label="Glow"
          value={s.glow + 1}
          min={1}
          max={4}
          words={['No glow', 'A hint', 'Soft halo', 'Strong halo']}
          hint="Glow helps many children find the target — but for some it feeds staring at light itself rather than looking at things. If your child is drawn into the light rather than the shape, turn glow down or off, and mention it to your vision professional."
          onChange={(v) => set({ glow: (v - 1) as typeof s.glow })}
        />

        <RangeField
          label="Brightness"
          value={s.brightness}
          min={1}
          max={3}
          words={['Gentle', 'Medium', 'Full']}
          hint="Screen brightness itself lives in your device settings; this softens the target. Everything stays within calm, safe bounds at every level."
          onChange={(brightness) => set({ brightness: brightness as typeof s.brightness })}
        />

        <Toggle
          label="Movement"
          checked={s.movement}
          hint="Movement is a powerful attention magnet in CVI — and also more work. Off means targets rest still."
          onChange={(movement) => set({ movement })}
        />
        {s.movement && (
          <RangeField
            label="Movement speed"
            value={s.speed}
            min={1}
            max={5}
            words={['Barely drifting', 'Very slow', 'Slow', 'Unhurried', 'Steady']}
            hint="Even the top speed is deliberately slow."
            onChange={(speed) => set({ speed: speed as typeof s.speed })}
          />
        )}

        <RangeField
          label="Visual complexity"
          value={s.complexity}
          min={1}
          max={3}
          words={['One thing only', 'Up to two things', 'A whisper of texture']}
          hint="How much may be on screen at once. When in doubt, simpler."
          onChange={(complexity) => set({ complexity: complexity as typeof s.complexity })}
        />

        <RangeField
          label="Pace"
          value={s.pace}
          min={1}
          max={5}
          words={['Slowest', 'Very slow', 'Slow', 'Relaxed', 'Flowing']}
          hint="How long things linger and how slowly they change. CVI often means a long pause before a look — slower paces wait longer."
          onChange={(pace) => set({ pace: pace as typeof s.pace })}
        />

        <RadioGroup
          legend="Where targets appear"
          value={s.fieldBias}
          onChange={(fieldBias) => set({ fieldBias })}
          options={[
            { value: 'none', label: 'Everywhere', detail: 'No preference.' },
            { value: 'lower', label: 'Favour lower', detail: 'For a baby who notices things low in their view.' },
            { value: 'upper', label: 'Favour upper' },
            { value: 'left', label: 'Favour left' },
            { value: 'right', label: 'Favour right' },
          ]}
        />
        {s.fieldBias !== 'none' && (
          <RadioGroup
            legend="How strongly"
            value={s.biasStrength}
            onChange={(biasStrength) => set({ biasStrength })}
            options={[
              { value: 'gentle', label: 'Gently', detail: 'Favour that area but still visit the rest.' },
              { value: 'strong', label: 'Strongly', detail: 'Keep targets in that area almost always.' },
            ]}
          />
        )}
      </Card>

      <Card title="Sound">
        <RadioGroup
          legend="When does sound play?"
          value={s.audioMode}
          onChange={(audioMode) => set({ audioMode })}
          options={[
            { value: 'with', label: 'With the visual', detail: 'Song and light together — the usual pairing.' },
            {
              value: 'after',
              label: 'After a look',
              detail:
                'Screen stays quiet; you tap when they look and the song answers. For children whom sound pulls away from looking.',
            },
            { value: 'off', label: 'No sound', detail: 'Visual-only, for pure looking practice.' },
          ]}
        />
        <RangeField
          label="Volume"
          value={Math.round(s.volume * 10)}
          min={0}
          max={10}
          words={['Silent', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Full']}
          onChange={(v) => set({ volume: v / 10 })}
        />
        <RadioGroup
          legend="Musical texture"
          value={s.audioStyle}
          onChange={(audioStyle) => set({ audioStyle })}
          options={[
            { value: 'single', label: 'Single instrument', detail: 'One clear voice — easiest to listen to.' },
            { value: 'layered', label: 'Softly layered', detail: 'Adds a quiet second voice underneath.' },
          ]}
        />
        <Toggle
          label="Sound follows the target"
          checked={s.soundFollowsTarget}
          hint="The song sits where the target is and travels with it — joining looking and listening. Needs stereo speakers to be felt."
          onChange={(soundFollowsTarget) => set({ soundFollowsTarget })}
        />
        <AudioManager profile={profile} />
        <Toggle
          label="A tiny vibration on touch rewards"
          checked={s.haptics}
          hint="Where the device supports it — a quiet extra channel for babies who don't hear the chime."
          onChange={(haptics) => set({ haptics })}
        />
      </Card>

      <Card title="Access">
        <RadioGroup
          legend="Switch scanning for menus"
          value={s.scanning}
          onChange={(scanning) => set({ scanning })}
          options={[
            { value: 'off', label: 'Off', detail: 'Touch, keyboard, and your device’s own switch tools work as usual.' },
            {
              value: 'auto',
              label: 'One switch (automatic)',
              detail: 'A calm ring glides from button to button by itself; pressing the switch chooses.',
            },
            {
              value: 'step',
              label: 'Two switches (step)',
              detail: 'One switch moves the ring (Space), the other chooses (Enter).',
            },
          ]}
        />
        <p class="hint">
          The ring's timing follows the pace setting above and never hurries. During a lesson the switch belongs
          to {profile.nickname} — any press is the lesson's touch — and the ring returns for menus and the pause
          screen.
        </p>

        <Toggle
          label="Notice where on the screen responses happen (optional)"
          checked={s.fieldObservation}
          hint="Quietly counts which part of the screen the target was in when you (or they) marked a response. After a couple of weeks of sessions, the Notes page may offer a gentle observation — purely as tuning help and something to discuss with their vision professional. It never tests, measures, or diagnoses anything, and single sessions are never interpreted."
          onChange={(fieldObservation) => set({ fieldObservation })}
        />
      </Card>

      <Card title="Session length">
        <RangeField
          label="Wind down after"
          value={s.sessionMinutes}
          min={2}
          max={8}
          words={['2 minutes', '3 minutes', '4 minutes', '5 minutes', '6 minutes', '7 minutes', '8 minutes']}
          hint="Looking is genuinely tiring work with CVI. The lesson fades to a resting moon when time is up — never an abrupt stop."
          onChange={(sessionMinutes) => set({ sessionMinutes })}
        />
      </Card>

      <PhotoManager profile={profile} />

      <Card title="Reviewed together?">
        <p class="card-note">
          When you've looked over these settings — ideally with {profile.nickname}'s vision professional — mark it
          here, and we'll remind you again in a month or two.
        </p>
        <button
          class="btn"
          onClick={() => updateProfile(profile.id, (p) => (p.lastReviewAt = new Date().toISOString()))}
        >
          Mark settings as reviewed today
        </button>
      </Card>
      </div>
    </div>
  );
}

/**
 * The live preview — the caregiver sees every change the instant they make it,
 * without bouncing between screens. It runs the *real* lesson engine (same
 * scenes, same safety kernel), so what you see is exactly what plays, smaller.
 */
function LivePreview({ profile }: { profile: Profile }) {
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
    const sim = { seed: 11, taps: [] as never[] };
    let raf = 0;
    const t0 = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
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
        <canvas ref={canvasRef} class="preview-canvas" role="img" aria-label="Live preview of how lessons will look with the current settings" />
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

/**
 * CR-3 — a favourite song or a familiar voice as the session music.
 * Files stay in this browser's storage; they are not part of profile exports.
 */
function AudioManager({ profile }: { profile: Profile }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const s = profile.settings;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = checkAudioFile(file);
    if (problem) {
      setMsg({ kind: 'err', text: problem });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const { duration, gain } = await analyzeAudio(file);
      const id = uid();
      await putBlob(id, file);
      updateProfile(profile.id, (p) => {
        p.audio.push({
          id,
          label: file.name.replace(/\.[a-z0-9]+$/i, ''),
          duration,
          gain,
          addedAt: new Date().toISOString(),
        });
      });
      setMsg({ kind: 'ok', text: 'Added. It stays on this device and is not part of profile exports.' });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'That file could not be read.' });
    } finally {
      setBusy(false);
    }
  };

  const removeAudio = async (id: string) => {
    updateProfile(profile.id, (p) => {
      p.audio = p.audio.filter((a) => a.id !== id);
      if (p.settings.melodySource === id) p.settings.melodySource = 'builtin';
    });
    await deleteBlob(id);
  };

  return (
    <div class="field">
      <span class="field-label">Your own music</span>
      <p class="hint">
        A song {profile.nickname} already loves, or a recording of a familiar voice singing, can be more
        motivating than anything built in. Playback is softened and volume-matched automatically. Files stay in
        this browser only — they are never uploaded, and they don't travel with profile exports.
      </p>
      <fieldset>
        <legend>Which music plays during lessons?</legend>
        <div class="radio-row">
          <label class="radio-item">
            <input
              type="radio"
              name="melodySource"
              checked={s.melodySource === 'builtin'}
              onChange={() => updateSettings(profile.id, { melodySource: 'builtin' })}
            />
            <span class="radio-text">
              <b>Built-in songs</b>
              <small>Each lesson's own gentle melody.</small>
            </span>
          </label>
          {profile.audio.map((a) => (
            <label key={a.id} class="radio-item">
              <input
                type="radio"
                name="melodySource"
                checked={s.melodySource === a.id}
                onChange={() => updateSettings(profile.id, { melodySource: a.id })}
              />
              <span class="radio-text">
                <b>{a.label}</b>
                <small>
                  {Math.round(a.duration / 60)} min {Math.round(a.duration % 60)} s ·{' '}
                  <button type="button" class="btn btn-small btn-ghost" onClick={() => void removeAudio(a.id)}>
                    Remove
                  </button>
                </small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {profile.audio.length < MAX_AUDIO_FILES && (
        <label class="btn">
          {busy ? 'Listening to it…' : 'Add a song or recording'}
          <input
            type="file"
            accept="audio/*"
            class="sr-only"
            disabled={busy}
            onChange={(e) => {
              const input = e.target as HTMLInputElement;
              void onFile(input.files?.[0]);
              input.value = '';
            }}
          />
        </label>
      )}
      {msg && (
        <p class={msg.kind === 'ok' ? 'msg-ok' : 'msg-err'} role="status">
          {msg.text}
        </p>
      )}
    </div>
  );
}

/** CR-3 / PV-5 — the child's own motivating things, kept on this device only. */
function PhotoManager({ profile }: { profile: Profile }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const { dataUrl, lum } = await processPhotoFile(file);
      updateProfile(profile.id, (p) => {
        p.photos.push({ id: uid(), label: file.name.replace(/\.[a-z0-9]+$/i, ''), dataUrl, lum, addedAt: new Date().toISOString() });
      });
      setMsg({ kind: 'ok', text: 'Added. It stays on this device — nothing is uploaded.' });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'That photo could not be added.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Familiar things — your own photos">
      <p class="card-note">
        A favourite toy, or a familiar, loved face: often the most motivating targets of all. Photos are shrunk
        and stored <b>on this device only</b> — never uploaded, never sent anywhere. They unlock the “A Familiar
        Face or Toy” lesson.
      </p>
      {profile.photos.map((ph) => (
        <div key={ph.id} class="photo-row">
          <img class="photo-thumb" src={ph.dataUrl} alt={`Photo: ${ph.label}`} />
          <span style={{ flex: 1 }}>{ph.label}</span>
          <button
            class="btn btn-small btn-danger"
            onClick={() => updateProfile(profile.id, (p) => (p.photos = p.photos.filter((x) => x.id !== ph.id)))}
          >
            Remove
          </button>
        </div>
      ))}
      {profile.photos.length < MAX_PHOTOS_PER_PROFILE && (
        <label class="btn" style={{ marginTop: '0.8rem' }}>
          {busy ? 'Preparing…' : 'Add a photo'}
          <input
            type="file"
            accept="image/*"
            class="sr-only"
            disabled={busy}
            onChange={(e) => {
              const input = e.target as HTMLInputElement;
              void onFile(input.files?.[0]);
              input.value = '';
            }}
          />
        </label>
      )}
      {msg && (
        <p class={msg.kind === 'ok' ? 'msg-ok' : 'msg-err'} role="status">
          {msg.text}
        </p>
      )}
    </Card>
  );
}
