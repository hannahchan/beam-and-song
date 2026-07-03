import { useEffect, useState } from 'preact/hooks';
import { SESSION_TAGS, type ResponseLevel, type SessionTag } from '../lib/types';

/** The Player's DOM overlays — kept apart so Player.tsx stays the session engine. */

export function AfterModeHint({ interactive, noun }: { interactive: boolean; noun: string }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setGone(true), 7000);
    return () => clearTimeout(id);
  }, []);
  return (
    <p class="player-hint" style={{ opacity: gone ? 0 : 1 }}>
      {interactive
        ? 'Sound plays after a touch — any touch or switch press counts.'
        : `Sound is set to follow a look: tap the screen when ${noun} look${noun === 'they' ? '' : 's'}, and the music will answer.`}
    </p>
  );
}

/** PT-4 / PT-8 — one-tap session observation, entirely skippable. */
export function ObservationCard({
  noun,
  onDone,
}: {
  noun: string;
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
        <div class="chips" role="group" aria-label={`Did ${noun} respond?`}>
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
