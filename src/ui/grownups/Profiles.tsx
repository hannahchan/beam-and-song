import { useRef, useState } from 'preact/hooks';
import type { AppState, Profile } from '../../lib/types';
import {
  createProfile,
  deleteProfile,
  exportAll,
  exportProfile,
  importAny,
  setActiveProfile,
  setPin,
  updateProfile,
} from '../../lib/store';
import { Card, downloadFile } from './bits';

/** PT-1 / PT-3 / PV-3 / PV-4 — children on this device, moving profiles, the courtesy lock. */
export function Profiles({ state }: { state: AppState }) {
  const [newName, setNewName] = useState('');
  const [importMsg, setImportMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div class="stack">
      <h1 tabindex={-1}>Children on this device</h1>
      <p class="card-note" style={{ maxWidth: '46rem' }}>
        Each child has their own settings, starred lessons, notes, and photos — all stored only in this browser.
        A nickname is all that's needed; please avoid full names and birthdays.
      </p>

      {state.profiles.map((p) => (
        <ProfileCard key={p.id} profile={p} isActive={p.id === state.activeProfileId} multiple={state.profiles.length > 1} />
      ))}

      <Card title="Add a child">
        <form
          class="row"
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) {
              createProfile(newName);
              setNewName('');
            }
          }}
        >
          <label class="field" style={{ flex: 1, minWidth: '12rem', margin: 0 }}>
            <span class="field-label">Nickname</span>
            <input type="text" maxLength={40} value={newName} onInput={(e) => setNewName((e.target as HTMLInputElement).value)} />
          </label>
          <button class="btn btn-primary" type="submit">
            Add
          </button>
        </form>
      </Card>

      <Card title="Bring a profile from another device">
        <p class="card-note">
          Choose a <code>.json</code> file exported from Beam and Song — settings, notes, and photos come with it.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          aria-label="Choose a Beam and Song profile file to import"
          onChange={async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
              const result = importAny(JSON.parse(await file.text()));
              setImportMsg(
                result.ok
                  ? {
                      kind: 'ok',
                      text:
                        result.count === 1
                          ? `Welcome, ${result.firstNickname} — profile imported.`
                          : `${result.count} profiles imported.`,
                    }
                  : { kind: 'err', text: result.error },
              );
            } catch {
              setImportMsg({ kind: 'err', text: 'That file could not be read.' });
            }
            if (fileRef.current) fileRef.current.value = '';
          }}
        />
        {importMsg && (
          <p class={importMsg.kind === 'ok' ? 'msg-ok' : 'msg-err'} role="status">
            {importMsg.text}
          </p>
        )}
      </Card>

      {state.profiles.length > 1 && (
        <Card title="Back up this whole device">
          <p class="card-note">
            One file with every child's profile — settings, notes, and photos (recordings stay on this device).
            It contains personal information about children; keep it somewhere you trust.
          </p>
          <button
            class="btn"
            onClick={() =>
              downloadFile('beam-and-song-backup.json', JSON.stringify(exportAll(), null, 2), 'application/json')
            }
          >
            Save a backup of everyone
          </button>
        </Card>
      )}

      <PinCard hasPin={!!state.pinHash} />
    </div>
  );
}

function ProfileCard({ profile, isActive, multiple }: { profile: Profile; isActive: boolean; multiple: boolean }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [name, setName] = useState(profile.nickname);

  return (
    <Card>
      <div class="spread">
        <h2 style={{ margin: 0 }}>
          {profile.nickname} {isActive && multiple && <span class="tag-pill">current</span>}
        </h2>
        {!isActive && (
          <button class="btn btn-small" onClick={() => setActiveProfile(profile.id)}>
            Switch to {profile.nickname}
          </button>
        )}
      </div>
      <p class="card-note">
        {profile.sessions.length} session note{profile.sessions.length === 1 ? '' : 's'} · {profile.photos.length}{' '}
        photo{profile.photos.length === 1 ? '' : 's'} · since {new Date(profile.createdAt).toLocaleDateString()}
      </p>

      <details>
        <summary>Rename, move, or remove</summary>
        <div class="row" style={{ margin: '0.6rem 0' }}>
          <label class="field" style={{ flex: 1, minWidth: '10rem', margin: 0 }}>
            <span class="sr-only">New nickname</span>
            <input type="text" value={name} maxLength={40} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
          </label>
          <button
            class="btn btn-small"
            onClick={() => updateProfile(profile.id, (p) => (p.nickname = name.trim() || p.nickname))}
          >
            Rename
          </button>
        </div>

        {!exporting ? (
          <button class="btn btn-small" onClick={() => setExporting(true)}>
            Export this profile…
          </button>
        ) : (
          <div class="card" style={{ background: 'var(--bg2)' }}>
            <p class="card-note">
              The file will include {profile.nickname}'s settings, your notes, and any photos — personal
              information about your child. It saves to this device; share it only with people you trust, such as
              their vision teacher.
            </p>
            <div class="row">
              <button
                class="btn btn-small btn-primary"
                onClick={() => {
                  const data = exportProfile(profile.id);
                  if (data) downloadFile(`beam-and-song-profile-${profile.nickname}.json`, JSON.stringify(data, null, 2), 'application/json');
                  setExporting(false);
                }}
              >
                Save the file
              </button>
              <button class="btn btn-small btn-ghost" onClick={() => setExporting(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <hr class="divider" />
        {!confirmingDelete ? (
          <button class="btn btn-small btn-danger" onClick={() => setConfirmingDelete(true)}>
            Remove {profile.nickname} from this device…
          </button>
        ) : (
          <div>
            <p class="msg-err">
              This deletes {profile.nickname}'s settings, notes, and photos from this device. There is no undo —
              consider exporting first.
            </p>
            <div class="row">
              <button class="btn btn-small btn-danger" onClick={() => deleteProfile(profile.id)}>
                Yes, remove everything
              </button>
              <button class="btn btn-small" onClick={() => setConfirmingDelete(false)}>
                Keep it
              </button>
            </div>
          </div>
        )}
      </details>
    </Card>
  );
}

function PinCard({ hasPin }: { hasPin: boolean }) {
  const [pin, setPinValue] = useState('');
  const [msg, setMsg] = useState('');

  return (
    <Card title="A light lock for this area">
      <p class="card-note">
        On a shared tablet — a family device, or a therapist's — a PIN keeps notes and photos away from casual
        eyes. It asks again every time you come back from the child screen. It's a courtesy lock, not
        encryption; anyone with real access to the device could still reach browser data. And if it's ever
        forgotten, there's no recovery by design: clearing this site's data in the browser removes the lock
        <b> and everything else on this device</b> — which is one more reason to keep a backup file.
      </p>
      {hasPin ? (
        <div class="row">
          <p class="msg-ok" style={{ margin: 0 }}>
            PIN is on.
          </p>
          <button
            class="btn btn-small"
            onClick={async () => {
              await setPin(null);
              setMsg('PIN removed.');
            }}
          >
            Remove the PIN
          </button>
        </div>
      ) : (
        <form
          class="row"
          onSubmit={async (e) => {
            e.preventDefault();
            if (pin.length >= 4) {
              await setPin(pin);
              setPinValue('');
              setMsg('PIN set. You will be asked for it next time.');
            } else {
              setMsg('Use at least 4 digits.');
            }
          }}
        >
          <label class="field" style={{ flex: 1, minWidth: '10rem', margin: 0 }}>
            <span class="field-label">New PIN (4+ digits)</span>
            <input
              type="password"
              inputmode="numeric"
              autocomplete="off"
              value={pin}
              onInput={(e) => setPinValue((e.target as HTMLInputElement).value)}
            />
          </label>
          <button class="btn btn-small" type="submit">
            Set PIN
          </button>
        </form>
      )}
      {msg && <p class="card-note" role="status">{msg}</p>}
    </Card>
  );
}
