import { useState } from 'preact/hooks';
import type { AgeBand, Profile } from '../../lib/types';
import { getPreset, recommendFromSetup, type SetupAnswers } from '../../lib/presets';
import { bandNoun } from '../../lessons/bands';
import { updateProfile } from '../../lib/store';
import { Card, RadioGroup } from './bits';

/**
 * PR-12 — five plain questions instead of a wall of sliders. Ends in a
 * recommendation the caregiver applies with one tap, and can change any time.
 */
export function Setup({ profile }: { profile: Profile | null }) {
  const [a, setA] = useState<SetupAnswers>({
    color: 'unsure',
    movementHelps: 'unsure',
    soundEffect: 'unsure',
    strongerSide: 'unsure',
    looksYet: 'rarely',
  });
  const [band, setBand] = useState<AgeBand>(profile?.ageBand ?? 'infant');
  const [done, setDone] = useState(false);
  const noun = bandNoun(band);
  const they = band === 'teen' ? 'they' : noun;

  if (!profile) {
    return (
      <div>
        <h1 tabindex={-1}>Guided setup</h1>
        <p>
          First, add a child on the <a href="#/grown-ups/profiles">Children page</a>.
        </p>
      </div>
    );
  }

  const rec = recommendFromSetup(a);
  const preset = getPreset(rec.presetId)!;

  if (done) {
    return (
      <div class="stack">
        <h1 tabindex={-1}>You're set</h1>
        <Card title={`Starting point: “${preset.title}”`}>
          <p>{preset.blurb}</p>
          {rec.notes.map((n) => (
            <p key={n} class="card-note">
              {n}
            </p>
          ))}
          <p class="card-note">
            Nothing is fixed — adjust anything in Settings as you learn what {profile.nickname} enjoys, and bring
            your vision professional into the tuning whenever you can.
          </p>
          <div class="row">
            <a class="btn btn-primary" href="#/choose">
              Try a lesson now
            </a>
            <a class="btn" href="#/grown-ups/settings">
              See the settings
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div class="stack">
      <h1 tabindex={-1}>Guided setup for {profile.nickname}</h1>
      <p class="card-note">
        Five questions, best guesses welcome — “not sure” is a perfectly good answer. This only chooses a starting
        point.
      </p>

      <Card>
        <RadioGroup
          legend={`First: roughly how old is ${profile.nickname}?`}
          value={band}
          onChange={setBand}
          options={[
            { value: 'infant', label: 'A baby (up to ~18 months)' },
            { value: 'child', label: 'A child (~2–9)' },
            { value: 'teen', label: 'An older child or teen (~10+)', detail: 'Lessons re-present themselves with age-respecting themes and music.' },
          ]}
        />
        <RadioGroup
          legend={`Is there a colour ${profile.nickname} seems drawn to?`}
          value={a.color}
          onChange={(color) => setA({ ...a, color })}
          options={[
            { value: 'red', label: 'Red (or reddish things)' },
            { value: 'yellow', label: 'Yellow (or golden things)' },
            { value: 'unsure', label: 'Not sure yet', detail: 'We’ll start with red — a common first door.' },
          ]}
        />
        <RadioGroup
          legend="Do they seem to notice things more when the things move?"
          value={a.movementHelps}
          onChange={(movementHelps) => setA({ ...a, movementHelps })}
          options={[
            { value: 'yes', label: 'Yes — movement catches them' },
            { value: 'no', label: 'No — movement seems to lose them' },
            { value: 'unsure', label: 'Not sure' },
          ]}
        />
        <RadioGroup
          legend="When there's sound as well, what happens to their looking?"
          value={a.soundEffect}
          onChange={(soundEffect) => setA({ ...a, soundEffect })}
          options={[
            { value: 'helps', label: 'Sound seems to help them look' },
            { value: 'pulls-away', label: 'Sound seems to pull them away from looking' },
            { value: 'unsure', label: 'Not sure' },
          ]}
        />
        <RadioGroup
          legend="Do they notice things more in one part of their view?"
          value={a.strongerSide}
          onChange={(strongerSide) => setA({ ...a, strongerSide })}
          options={[
            { value: 'none', label: 'No pattern I’ve noticed' },
            { value: 'lower', label: 'More when things are low' },
            { value: 'left', label: 'More on their left' },
            { value: 'right', label: 'More on their right' },
          ]}
        />
        <RadioGroup
          legend={`Right now, how often ${they === 'they' ? 'do they' : `does ${noun}`} settle their eyes on something?`}
          value={a.looksYet}
          onChange={(looksYet) => setA({ ...a, looksYet })}
          options={[
            { value: 'rarely', label: 'Rarely or I’m not sure yet', detail: 'We’ll begin with one still light at a time.' },
            { value: 'sometimes', label: 'Sometimes — brief moments' },
            { value: 'often', label: 'Fairly often — and sometimes follows' },
          ]}
        />
      </Card>

      <Card title={`Suggested start: “${preset.title}”`}>
        <p class="card-note">{preset.blurb}</p>
        {rec.notes.map((n) => (
          <p key={n} class="card-note">
            {n}
          </p>
        ))}
        <button
          class="btn btn-primary"
          onClick={() => {
            updateProfile(profile.id, (p) => {
              p.ageBand = band;
              p.settings = { ...p.settings, ...preset.settings, ...rec.overrides };
              p.presetId = preset.id;
              for (const f of preset.seedFavorites) {
                if (!p.favorites.includes(f)) p.favorites.push(f);
              }
              p.lastReviewAt = new Date().toISOString();
            });
            setDone(true);
          }}
        >
          Use this starting point
        </button>
      </Card>
    </div>
  );
}
