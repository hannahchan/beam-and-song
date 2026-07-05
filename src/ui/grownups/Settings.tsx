import { useEffect, useRef, useState } from 'preact/hooks';
import type { CustomPhoto, Profile } from '../../lib/types';
import { updateProfile, updateSettings } from '../../lib/store';
import { PRESETS } from '../../lib/presets';
import { TARGET_COLORS } from '../../safety/constants';
import { MAX_PHOTOS_PER_PROFILE, processPhotoFile, voiceBlobId } from '../../lib/photos';
import { uid } from '../../lib/store';
import { formatMinutesSeconds } from '../../lib/fmt';
import {
  analyzeAudio,
  checkAudioFile,
  deleteBlob,
  MAX_AUDIO_FILES,
  MAX_VOICE_SECONDS,
  putBlob,
  VOICE_RECORD_MS,
} from '../../lib/media';
import { audio } from '../../engine/audio';
import { LivePreview } from './LivePreview';
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
      <p class="card-note">
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
          The ring's timing follows the pace setting above and never hurries. During most lessons the switch
          belongs to {profile.nickname} — any press is the lesson's touch. In the find-and-seek lessons, the
          ring steps gently between the lights on screen, and choosing answers the one it rests on — a real
          choice, made with a switch. The ring returns for menus and the pause screen.
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
                  {formatMinutesSeconds(a.duration)} ·{' '}
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
        Face or Toy” lesson. You can also record <b>your own voice</b> naming each photo — “the red ball!” —
        and in the photo lessons that voice becomes the answer: after a find, or when you mark a look in the
        “after a look” sound mode. Recordings stay on this device too.
      </p>
      {profile.photos.map((ph) => (
        <div key={ph.id} class="photo-entry">
          <div class="photo-row">
            <img class="photo-thumb" src={ph.dataUrl} alt={`Photo: ${ph.label}`} />
            <span style={{ flex: 1 }}>{ph.label}</span>
            <label class="check-item" style={{ minHeight: 'auto' }}>
              <input
                type="checkbox"
                checked={ph.enabled !== false}
                onChange={(e) =>
                  updateProfile(profile.id, (p) => {
                    const target = p.photos.find((x) => x.id === ph.id);
                    if (target) target.enabled = (e.target as HTMLInputElement).checked;
                  })
                }
              />
              <span>Shown in lessons</span>
            </label>
            <button
              class="btn btn-small btn-danger"
              onClick={() => {
                updateProfile(profile.id, (p) => (p.photos = p.photos.filter((x) => x.id !== ph.id)));
                void deleteBlob(voiceBlobId(ph.id));
              }}
            >
              Remove
            </button>
          </div>
          <VoiceLabelControl profile={profile} photo={ph} />
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

/**
 * CR-3 — a short caregiver voice label per photo ("the red ball!"), recorded
 * right here or added as a small audio file. It becomes the answer in the
 * photo lessons. The clip lives in this browser's storage only (PV-5) and is
 * removed with the photo. Recording needs the microphone once, with your
 * permission; nothing is ever uploaded.
 */
function VoiceLabelControl({ profile, photo }: { profile: Profile; photo: CustomPhoto }) {
  const [state, setState] = useState<'idle' | 'recording' | 'busy'>('idle');
  const [err, setErr] = useState<string | null>(null);
  const recRef = useRef<{ rec: MediaRecorder; stream: MediaStream; timer: number } | null>(null);
  const canRecord =
    typeof MediaRecorder !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  // Never leave the microphone open if the page moves on mid-recording.
  useEffect(
    () => () => {
      const r = recRef.current;
      if (r) {
        window.clearTimeout(r.timer);
        try {
          if (r.rec.state !== 'inactive') r.rec.stop();
        } catch {
          /* already stopped */
        }
        r.stream.getTracks().forEach((t) => t.stop());
        recRef.current = null;
      }
    },
    [],
  );

  const save = async (blob: Blob) => {
    setState('busy');
    try {
      const { duration, gain } = await analyzeAudio(blob);
      if (duration > MAX_VOICE_SECONDS) {
        throw new Error('Keep it under ten seconds — just the name, said warmly.');
      }
      await putBlob(voiceBlobId(photo.id), blob);
      updateProfile(profile.id, (p) => {
        const target = p.photos.find((x) => x.id === photo.id);
        if (target) target.voice = { duration, gain };
      });
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'That recording could not be used.');
    } finally {
      setState('idle');
    }
  };

  const startRecording = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        recRef.current = null;
        void save(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
      };
      const timer = window.setTimeout(() => {
        if (rec.state !== 'inactive') rec.stop();
      }, VOICE_RECORD_MS);
      recRef.current = { rec, stream, timer };
      rec.start();
      setState('recording');
    } catch {
      setErr('The microphone is not available here — you can add a small audio file instead.');
    }
  };

  const stopRecording = () => {
    const r = recRef.current;
    if (!r) return;
    window.clearTimeout(r.timer);
    if (r.rec.state !== 'inactive') r.rec.stop();
  };

  const onVoiceFile = (file: File | undefined) => {
    if (!file) return;
    const problem = checkAudioFile(file);
    if (problem) {
      setErr(problem);
      return;
    }
    void save(file);
  };

  const removeVoice = async () => {
    updateProfile(profile.id, (p) => {
      const target = p.photos.find((x) => x.id === photo.id);
      if (target) delete target.voice;
    });
    await deleteBlob(voiceBlobId(photo.id));
  };

  const play = () => {
    const v = photo.voice;
    if (!v) return;
    void audio.unlock().then(() => audio.playVoiceLabel(voiceBlobId(photo.id), v.gain));
  };

  return (
    <div class="voice-row">
      {photo.voice ? (
        <>
          <span class="hint" style={{ margin: 0 }}>
            Voice label ({Math.max(1, Math.round(photo.voice.duration))} s) — plays as the answer in photo
            lessons.
          </span>
          <button class="btn btn-small" aria-label={`Play the voice label for ${photo.label}`} onClick={play}>
            Play
          </button>
          <button
            class="btn btn-small btn-ghost"
            aria-label={`Remove the voice label for ${photo.label}`}
            onClick={() => void removeVoice()}
          >
            Remove voice
          </button>
        </>
      ) : state === 'recording' ? (
        <button class="btn btn-small" aria-label={`Finish recording for ${photo.label}`} onClick={stopRecording}>
          ● Recording — tap to finish (stops by itself after 8 s)
        </button>
      ) : (
        <>
          {canRecord && (
            <button
              class="btn btn-small"
              disabled={state === 'busy'}
              aria-label={`Record a voice label for ${photo.label}`}
              onClick={() => void startRecording()}
            >
              {state === 'busy' ? 'Saving…' : 'Record its name in your voice'}
            </button>
          )}
          <label class="btn btn-small">
            Add a voice file
            <input
              type="file"
              accept="audio/*"
              class="sr-only"
              disabled={state === 'busy'}
              onChange={(e) => {
                const input = e.target as HTMLInputElement;
                onVoiceFile(input.files?.[0]);
                input.value = '';
              }}
            />
          </label>
        </>
      )}
      {err && (
        <p class="msg-err" role="status" style={{ margin: 0 }}>
          {err}
        </p>
      )}
    </div>
  );
}
