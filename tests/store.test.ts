import { beforeEach, describe, expect, it } from 'vitest';

/** In-memory localStorage so the store module works in the node environment. */
const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
} as Storage;

const store = await import('../src/lib/store');

function reset(): void {
  mem.clear();
  // Force the module to re-read storage by mutating its cached state through the public API.
  const s = store.getState();
  s.profiles.length = 0;
  s.activeProfileId = null;
  s.pinHash = null;
  s.lastBackupAt = null;
}

describe('profiles persist locally (TR-2, PT-1, PT-2)', () => {
  beforeEach(reset);

  it('creates and activates a profile with safe defaults', () => {
    const p = store.createProfile('Bean');
    expect(store.activeProfile()?.id).toBe(p.id);
    expect(p.settings).toEqual(store.DEFAULT_SETTINGS);
    expect(JSON.parse(mem.get('light-and-sound:v1')!).profiles).toHaveLength(1);
  });

  it('nickname only, no other identifying fields exist on a fresh profile (PV-1)', () => {
    const p = store.createProfile('Bean');
    expect(Object.keys(p).sort()).toEqual(
      ['ageBand', 'audio', 'createdAt', 'favorites', 'id', 'lastReviewAt', 'nickname', 'photos', 'programs', 'sessions', 'settings'].sort(),
    );
  });

  it('imports strip audio metadata, blobs never travel with exports (PV-5)', () => {
    const p = store.createProfile('Bean');
    store.updateProfile(p.id, (prof) => {
      prof.audio.push({ id: 'song1', label: 'lullaby', duration: 60, gain: 1, addedAt: 'now' });
      prof.settings.melodySource = 'song1';
    });
    const exported = store.exportProfile(p.id)!;
    const result = store.importProfile(exported);
    expect(result.ok).toBe(true);
    const copy = store.getState().profiles[1];
    expect(copy.audio).toEqual([]);
    expect(copy.settings.melodySource).toBe('builtin');
  });

  it('programs: create, reorder, remove (PT-9)', () => {
    const p = store.createProfile('Bean');
    const progId = store.addProgram(p.id, 'Morning quiet');
    store.updateProgram(p.id, progId, (prog) => prog.lessonIds.push('gentle-glow', 'little-star', 'raindrop'));
    store.updateProgram(p.id, progId, (prog) => {
      [prog.lessonIds[0], prog.lessonIds[1]] = [prog.lessonIds[1], prog.lessonIds[0]];
    });
    expect(store.activeProfile()?.programs[0].lessonIds).toEqual(['little-star', 'gentle-glow', 'raindrop']);
    store.deleteProgram(p.id, progId);
    expect(store.activeProfile()?.programs).toEqual([]);
  });

  it('updates settings and favorites', () => {
    const p = store.createProfile('Bean');
    store.updateSettings(p.id, { targetColor: 'yellow', pace: 4 });
    store.toggleFavorite(p.id, 'little-star');
    expect(store.activeProfile()?.settings.targetColor).toBe('yellow');
    expect(store.activeProfile()?.favorites).toEqual(['little-star']);
    store.toggleFavorite(p.id, 'little-star');
    expect(store.activeProfile()?.favorites).toEqual([]);
  });

  it('caps stored sessions', () => {
    const p = store.createProfile('Bean');
    for (let i = 0; i < 410; i++) {
      store.addSession(p.id, {
        at: new Date().toISOString(),
        lessonId: 'gentle-glow',
        durationSec: 60,
        response: 'some',
        tags: [],
      });
    }
    expect(store.activeProfile()?.sessions.length).toBe(400);
  });
});

describe('export / import (PT-3, PV-4)', () => {
  beforeEach(reset);

  it('round-trips a profile, photos and notes included', () => {
    const p = store.createProfile('Bean');
    store.updateSettings(p.id, { targetColor: 'yellow' });
    store.updateProfile(p.id, (prof) => {
      prof.photos.push({ id: 'ph1', label: 'ducky', dataUrl: 'data:image/jpeg;base64,AAA', addedAt: 'now' });
    });
    store.addSession(p.id, { at: new Date().toISOString(), lessonId: 'firefly', durationSec: 120, response: 'clear', tags: ['good day'] });

    const exported = store.exportProfile(p.id)!;
    expect(exported.app).toBe('light-and-sound');

    const result = store.importProfile(JSON.parse(JSON.stringify(exported)));
    expect(result.ok).toBe(true);
    const s = store.getState();
    expect(s.profiles).toHaveLength(2);
    const copy = s.profiles[1];
    expect(copy.id).not.toBe(p.id); // collision avoided
    expect(copy.settings.targetColor).toBe('yellow');
    expect(copy.photos[0].label).toBe('ducky');
    expect(copy.sessions).toHaveLength(1);
  });

  it('rejects files that are not Light & Sound profiles', () => {
    expect(store.importProfile({}).ok).toBe(false);
    expect(store.importProfile(null).ok).toBe(false);
    expect(store.importProfile({ app: 'other', kind: 'profile', profile: {} }).ok).toBe(false);
    expect(store.getState().profiles).toHaveLength(0);
  });

  it('whole-device backup round-trips every profile (PT-3)', () => {
    store.createProfile('Bean');
    store.createProfile('Pip');
    const backup = store.exportAll();
    expect(backup.kind).toBe('backup');
    const result = store.importAny(JSON.parse(JSON.stringify(backup)));
    expect(result.ok && result.count).toBe(2);
    expect(store.getState().profiles).toHaveLength(4);
  });

  it('normalizes missing fields on import instead of crashing later', () => {
    const p = store.createProfile('Bean');
    const exported = store.exportProfile(p.id)!;
    delete (exported.profile as Partial<typeof exported.profile>).sessions;
    const result = store.importProfile(exported);
    expect(result.ok).toBe(true);
    expect(store.getState().profiles[1].sessions).toEqual([]);
  });
});

describe('backup nudge (PT-3 hygiene)', () => {
  beforeEach(reset);

  it('not due with little data; due with photos and no backup; cleared by exporting', () => {
    const p = store.createProfile('Bean');
    expect(store.backupIsDue(store.getState())).toBe(false);
    store.updateProfile(p.id, (prof) => {
      prof.photos.push({ id: 'ph', label: 'x', dataUrl: 'data:', addedAt: 'now' });
    });
    expect(store.backupIsDue(store.getState())).toBe(true);
    store.exportAll();
    expect(store.backupIsDue(store.getState())).toBe(false);
  });

  it('becomes due again three weeks after the last backup', () => {
    const p = store.createProfile('Bean');
    store.updateProfile(p.id, (prof) => {
      prof.photos.push({ id: 'ph', label: 'x', dataUrl: 'data:', addedAt: 'now' });
    });
    store.exportAll();
    const state = store.getState();
    expect(store.backupIsDue(state, Date.now() + 22 * 86400000)).toBe(true);
  });
});

describe('photo visibility toggle (CR-3)', () => {
  it('enabledPhotos filters rested photos without deleting them', async () => {
    const { enabledPhotos } = await import('../src/lib/photos');
    const photos = [
      { id: 'a', enabled: undefined },
      { id: 'b', enabled: false },
      { id: 'c', enabled: true },
    ];
    expect(enabledPhotos(photos).map((p) => p.id)).toEqual(['a', 'c']);
  });
});

describe('PIN courtesy lock (PV-3)', () => {
  beforeEach(reset);

  it('sets, checks, and clears', async () => {
    await store.setPin('2468');
    expect(await store.checkPin('2468')).toBe(true);
    expect(await store.checkPin('0000')).toBe(false);
    await store.setPin(null);
    expect(await store.checkPin('anything')).toBe(true);
  });
});

describe('review prompt timing (PT-5)', () => {
  beforeEach(reset);

  it('not due for a fresh profile; due after 5 weeks and 8 sessions', () => {
    const p = store.createProfile('Bean');
    expect(store.reviewIsDue(p)).toBe(false);
    store.updateProfile(p.id, (prof) => {
      prof.lastReviewAt = new Date(Date.now() - 40 * 86400000).toISOString();
      for (let i = 0; i < 9; i++) {
        prof.sessions.push({
          id: `s${i}`,
          at: new Date(Date.now() - i * 86400000).toISOString(),
          lessonId: 'gentle-glow',
          durationSec: 60,
          response: null,
          tags: [],
        });
      }
    });
    expect(store.reviewIsDue(store.activeProfile()!)).toBe(true);
  });
});
