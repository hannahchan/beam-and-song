import type { AppState, ChildSettings, Profile, SessionRecord } from './types';

/**
 * Local-only persistence (TR-2, PV-2). Everything lives in this browser's
 * localStorage; nothing is ever transmitted. Export/import (PT-3) is the
 * caregiver-controlled way to move a profile between devices.
 */

const KEY = 'beam-and-song:v1';
const MAX_SESSIONS_KEPT = 400;

export const DEFAULT_SETTINGS: ChildSettings = {
  targetColor: 'red',
  background: 'black',
  movement: false,
  speed: 2,
  complexity: 1,
  fieldBias: 'none',
  biasStrength: 'gentle',
  pace: 2,
  size: 4,
  glow: 2,
  brightness: 2,
  audioMode: 'with',
  volume: 0.6,
  audioStyle: 'single',
  soundFollowsTarget: false,
  haptics: true,
  sessionMinutes: 4,
  melodySource: 'builtin',
};

type Listener = () => void;
const listeners = new Set<Listener>();
let state: AppState | null = null;

function emit(): void {
  for (const l of [...listeners]) l();
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function blankState(): AppState {
  return { version: 1, activeProfileId: null, profiles: [], pinHash: null };
}

export function getState(): AppState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? migrate(JSON.parse(raw)) : blankState();
  } catch {
    state = blankState();
  }
  return state;
}

function migrate(raw: unknown): AppState {
  if (!raw || typeof raw !== 'object' || (raw as AppState).version !== 1) return blankState();
  const s = raw as AppState;
  return {
    version: 1,
    activeProfileId: s.activeProfileId ?? null,
    profiles: Array.isArray(s.profiles) ? s.profiles.map(normalizeProfile) : [],
    pinHash: typeof s.pinHash === 'string' ? s.pinHash : null,
  };
}

function normalizeProfile(p: Profile): Profile {
  return {
    ...p,
    settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
    favorites: Array.isArray(p.favorites) ? p.favorites : [],
    programs: Array.isArray(p.programs) ? p.programs.filter((x) => x && Array.isArray(x.lessonIds)) : [],
    photos: Array.isArray(p.photos) ? p.photos : [],
    audio: Array.isArray(p.audio) ? p.audio : [],
    sessions: Array.isArray(p.sessions) ? p.sessions : [],
  };
}

function persist(): void {
  if (!state) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded (usually photos). Surfaced by the photo-add flow; other
    // writes fail silently rather than crashing a lesson in progress.
  }
  emit();
}

export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

/* ------------------------------- profiles ------------------------------- */

export function createProfile(nickname: string): Profile {
  const s = getState();
  const profile: Profile = {
    id: uid(),
    nickname: nickname.trim() || 'Little one',
    createdAt: new Date().toISOString(),
    settings: { ...DEFAULT_SETTINGS },
    favorites: [],
    programs: [],
    photos: [],
    audio: [],
    sessions: [],
    lastReviewAt: new Date().toISOString(),
  };
  s.profiles.push(profile);
  s.activeProfileId = profile.id;
  persist();
  return profile;
}

export function activeProfile(): Profile | null {
  const s = getState();
  return s.profiles.find((p) => p.id === s.activeProfileId) ?? s.profiles[0] ?? null;
}

/** The child path must never dead-end: ensure a profile exists (FR-5 spirit). */
export function ensureProfile(): Profile {
  return activeProfile() ?? createProfile('Little one');
}

export function setActiveProfile(id: string): void {
  const s = getState();
  if (s.profiles.some((p) => p.id === id)) {
    s.activeProfileId = id;
    persist();
  }
}

export function updateProfile(id: string, patch: (p: Profile) => void): void {
  const s = getState();
  const p = s.profiles.find((x) => x.id === id);
  if (!p) return;
  patch(p);
  persist();
}

export function deleteProfile(id: string): void {
  const s = getState();
  const gone = s.profiles.find((p) => p.id === id);
  s.profiles = s.profiles.filter((p) => p.id !== id);
  if (s.activeProfileId === id) s.activeProfileId = s.profiles[0]?.id ?? null;
  persist();
  // Remove the child's audio blobs too (PV-5 — clean deletion means clean).
  if (gone?.audio.length) {
    void import('./media').then((m) => gone.audio.forEach((a) => void m.deleteBlob(a.id)));
  }
}

export function updateSettings(profileId: string, patch: Partial<ChildSettings>): void {
  updateProfile(profileId, (p) => {
    p.settings = { ...p.settings, ...patch };
  });
}

export function toggleFavorite(profileId: string, lessonId: string): void {
  updateProfile(profileId, (p) => {
    p.favorites = p.favorites.includes(lessonId)
      ? p.favorites.filter((f) => f !== lessonId)
      : [...p.favorites, lessonId];
  });
}

/* ------------------------------ programs (PT-9) ------------------------------ */

export function addProgram(profileId: string, name: string): string {
  const id = uid();
  updateProfile(profileId, (p) => {
    p.programs.push({ id, name: name.trim() || 'New program', lessonIds: [] });
  });
  return id;
}

export function updateProgram(profileId: string, programId: string, patch: (prog: import('./types').Program) => void): void {
  updateProfile(profileId, (p) => {
    const prog = p.programs.find((x) => x.id === programId);
    if (prog) patch(prog);
  });
}

export function deleteProgram(profileId: string, programId: string): void {
  updateProfile(profileId, (p) => {
    p.programs = p.programs.filter((x) => x.id !== programId);
  });
}

export function addSession(profileId: string, rec: Omit<SessionRecord, 'id'>): void {
  updateProfile(profileId, (p) => {
    p.sessions.push({ ...rec, id: uid() });
    if (p.sessions.length > MAX_SESSIONS_KEPT) p.sessions = p.sessions.slice(-MAX_SESSIONS_KEPT);
  });
}

/* ----------------------------- export / import ----------------------------- */

export interface ProfileExport {
  app: 'beam-and-song';
  kind: 'profile';
  version: 1;
  exportedAt: string;
  profile: Profile;
}

export function exportProfile(profileId: string): ProfileExport | null {
  const p = getState().profiles.find((x) => x.id === profileId);
  if (!p) return null;
  return {
    app: 'beam-and-song',
    kind: 'profile',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: JSON.parse(JSON.stringify(p)) as Profile,
  };
}

export function importProfile(json: unknown): { ok: true; profile: Profile } | { ok: false; error: string } {
  if (!json || typeof json !== 'object') return { ok: false, error: 'That file is not readable.' };
  const data = json as Partial<ProfileExport>;
  if (data.app !== 'beam-and-song' || data.kind !== 'profile' || !data.profile) {
    return { ok: false, error: 'That file is not a Beam and Song profile.' };
  }
  const p = normalizeProfile(data.profile as Profile);
  if (!p.nickname || typeof p.nickname !== 'string') return { ok: false, error: 'The profile in that file looks incomplete.' };
  // Audio blobs live in the exporting device's IndexedDB and never travel
  // with the file (PV-5) — drop their orphaned metadata on arrival.
  p.audio = [];
  if (p.settings.melodySource !== 'builtin') p.settings.melodySource = 'builtin';
  const s = getState();
  p.id = s.profiles.some((x) => x.id === p.id) ? uid() : p.id || uid();
  s.profiles.push(p);
  s.activeProfileId = p.id;
  persist();
  return { ok: true, profile: p };
}

/* --------------------------------- PIN (PV-3) --------------------------------- */

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`beam-and-song:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function setPin(pin: string | null): Promise<void> {
  const s = getState();
  s.pinHash = pin ? await hashPin(pin) : null;
  persist();
}

export async function checkPin(pin: string): Promise<boolean> {
  const s = getState();
  if (!s.pinHash) return true;
  return (await hashPin(pin)) === s.pinHash;
}

/* ------------------------------ review prompt (PT-5) ------------------------------ */

export function reviewIsDue(p: Profile): boolean {
  const last = Date.parse(p.lastReviewAt || p.createdAt);
  const sessionsSince = p.sessions.filter((s) => Date.parse(s.at) > last).length;
  const days = (Date.now() - last) / 86400000;
  return days > 35 && sessionsSince >= 8;
}
