import { describe, expect, it } from 'vitest';
import { voiceBlobId, voiceForItems } from '../src/lib/photos';
import { MAX_VOICE_SECONDS, VOICE_RECORD_MS } from '../src/lib/media';
import { audio } from '../src/engine/audio';
import type { CustomPhoto } from '../src/lib/types';

/**
 * CR-3, per-photo caregiver voice labels: the parent's own "the red ball!"
 * as the answer in photo lessons. These cover the pure decision logic; the
 * recording UI itself needs a microphone and real ears.
 */

const photo = (over: Partial<CustomPhoto> = {}): CustomPhoto => ({
  id: 'p1',
  label: 'ball',
  dataUrl: 'data:one',
  addedAt: '2026-07-04',
  ...over,
});

describe('voice labels', () => {
  it('blob ids derive from the photo id, so removal can never miss them', () => {
    expect(voiceBlobId('abc')).toBe('photo-voice-abc');
  });

  it('recording auto-stop leaves comfortable room under the hard ceiling', () => {
    expect(VOICE_RECORD_MS / 1000).toBeLessThan(MAX_VOICE_SECONDS);
  });

  it('finds the voice of the photo currently on screen', () => {
    const photos = [photo({ voice: { duration: 2, gain: 1.2 } })];
    const items = [
      { shape: 'orb' },
      { shape: 'photo', photoDataUrl: 'data:one' },
      { shape: 'bloom' },
    ];
    expect(voiceForItems(items, photos)).toEqual({ blobId: 'photo-voice-p1', gain: 1.2 });
  });

  it('stays silent when the photo has no voice, is rested, or is not the one shown', () => {
    const items = [{ shape: 'photo', photoDataUrl: 'data:one' }];
    expect(voiceForItems(items, [photo()])).toBeNull();
    expect(voiceForItems(items, [photo({ voice: { duration: 2, gain: 1 }, enabled: false })])).toBeNull();
    expect(
      voiceForItems(items, [photo({ dataUrl: 'data:two', voice: { duration: 2, gain: 1 } })]),
    ).toBeNull();
  });

  it('stays silent in lessons with no photo on screen', () => {
    const photos = [photo({ voice: { duration: 2, gain: 1 } })];
    expect(voiceForItems([{ shape: 'star' }, { shape: 'orb' }], photos)).toBeNull();
    expect(voiceForItems([], photos)).toBeNull();
  });

  it('playVoiceLabel is safe to call without an audio context (no throw, no sound)', () => {
    expect(() => audio.playVoiceLabel('photo-voice-p1', 1)).not.toThrow();
  });
});
