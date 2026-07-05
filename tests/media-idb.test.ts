// Exercises the real IndexedDB code path in media.ts (the browser path), which
// the node-env media.test.ts can't reach: there, `indexedDB` is undefined, so
// every call takes the in-memory fallback. `fake-indexeddb/auto` registers a
// spec-compliant IndexedDB on the globals BEFORE the media module first calls
// openDb(), so putBlob/getBlob/deleteBlob/clearAllBlobs run their actual
// transaction code. Kept in a separate file so the fake stays isolated from
// media.test.ts's "IndexedDB unavailable" fallback test (vitest isolates
// modules and globals per file).
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearAllBlobs, deleteBlob, getBlob, putBlob } from '../src/lib/media';

describe('media store, real IndexedDB path (CR-3 / PV-5)', () => {
  beforeEach(async () => {
    await clearAllBlobs();
  });
  afterEach(async () => {
    await clearAllBlobs();
  });

  it('round-trips a blob through a real object store transaction', async () => {
    await putBlob('song', new Blob(['la la la'], { type: 'audio/mpeg' }));
    const back = await getBlob('song');
    expect(back).not.toBeNull();
    expect(back!.type).toBe('audio/mpeg');
    expect(await back!.text()).toBe('la la la');

    await deleteBlob('song');
    expect(await getBlob('song')).toBeNull();
  });

  it('clearAllBlobs empties the whole store, including ids the caller never tracks (PV-5)', async () => {
    await putBlob('audio-1', new Blob(['one'], { type: 'audio/mpeg' }));
    await putBlob('audio-2', new Blob(['two'], { type: 'audio/mpeg' }));
    // An orphan the profile metadata no longer references: a per-id sweep would
    // miss it, a store-wide clear must not.
    await putBlob('voice:ghost', new Blob(['name'], { type: 'audio/webm' }));
    expect(await getBlob('audio-1')).not.toBeNull();

    await clearAllBlobs();

    expect(await getBlob('audio-1')).toBeNull();
    expect(await getBlob('audio-2')).toBeNull();
    expect(await getBlob('voice:ghost')).toBeNull();
  });
});
