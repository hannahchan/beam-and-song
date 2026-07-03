/**
 * On-device media store (CR-3 / TR-7 / PV-5).
 *
 * Audio files are far too large for localStorage, so blobs live in IndexedDB;
 * their small metadata lives on the profile. Nothing is ever uploaded. When
 * IndexedDB is unavailable (some private modes, tests), an in-memory map
 * keeps the feature working for the session.
 */

const DB_NAME = 'beam-and-song-media';
const STORE = 'blobs';

export const MAX_AUDIO_FILES = 3;
export const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
export const MAX_AUDIO_SECONDS = 6 * 60;

const memory = new Map<string, Blob>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

export async function putBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  if (!db) {
    memory.set(id, blob);
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  if (!db) return memory.get(id) ?? null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? memory.get(id) ?? null);
    req.onerror = () => resolve(null);
  });
}

export async function deleteBlob(id: string): Promise<void> {
  memory.delete(id);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/** Pure pre-checks, unit-testable without Web Audio. */
export function checkAudioFile(file: { type: string; size: number }): string | null {
  if (!file.type.startsWith('audio/')) return 'Please choose an audio file (a song or a recording).';
  if (file.size > MAX_AUDIO_BYTES) return 'That file is quite large — please choose one under 15 MB.';
  return null;
}

export interface ImportedAudio {
  duration: number;
  /** Gentle normalization so quiet recordings and loud songs land alike. */
  gain: number;
}

/** Decode to measure duration and peak; the original blob is what we store. */
export async function analyzeAudio(file: Blob): Promise<ImportedAudio> {
  const OfflineCtx: typeof OfflineAudioContext | undefined =
    window.OfflineAudioContext ??
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  if (!OfflineCtx) throw new Error('This browser cannot read audio files.');
  const ctx = new OfflineCtx(1, 1, 44100);
  const buf = await ctx.decodeAudioData(await file.arrayBuffer());
  if (buf.duration > MAX_AUDIO_SECONDS) {
    throw new Error('Please choose something under 6 minutes — sessions are short by design.');
  }
  let peak = 0;
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const data = buf.getChannelData(ch);
    // Sample every ~10ms — plenty for a peak estimate.
    for (let i = 0; i < data.length; i += 441) {
      const v = Math.abs(data[i]);
      if (v > peak) peak = v;
    }
  }
  const gain = peak > 0.01 ? Math.min(2.5, 0.6 / peak) : 1;
  return { duration: buf.duration, gain };
}
