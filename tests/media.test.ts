import { describe, expect, it } from 'vitest';
import { checkAudioFile, clearAllBlobs, deleteBlob, getBlob, MAX_AUDIO_BYTES, putBlob } from '../src/lib/media';

describe('media store (CR-3 blobs, local-only)', () => {
  it('falls back to memory storage where IndexedDB is unavailable and round-trips', async () => {
    const blob = new Blob(['hello'], { type: 'audio/mpeg' });
    await putBlob('a1', blob);
    const back = await getBlob('a1');
    expect(back).not.toBeNull();
    expect(await back!.text()).toBe('hello');
    await deleteBlob('a1');
    expect(await getBlob('a1')).toBeNull();
  });

  it('rejects non-audio and oversized files with friendly copy', () => {
    expect(checkAudioFile({ type: 'video/mp4', size: 100 })).toMatch(/audio file/);
    expect(checkAudioFile({ type: 'audio/mpeg', size: MAX_AUDIO_BYTES + 1 })).toMatch(/15 MB/);
    expect(checkAudioFile({ type: 'audio/mpeg', size: 1000 })).toBeNull();
  });

  it('clearAllBlobs wipes every stored blob at once (full reset, PV-5)', async () => {
    await putBlob('a1', new Blob(['one'], { type: 'audio/mpeg' }));
    await putBlob('a2', new Blob(['two'], { type: 'audio/mpeg' }));
    await clearAllBlobs();
    expect(await getBlob('a1')).toBeNull();
    expect(await getBlob('a2')).toBeNull();
  });
});
