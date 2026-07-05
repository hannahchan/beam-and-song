/**
 * AR-7, a non-auditory feedback channel. A single short, soft vibration on
 * reward moments, where the device supports it (most Android tablets; iPads
 * currently do not expose vibration to the web, the visual response still
 * carries the moment there).
 */
export function buzz(enabled: boolean): void {
  if (!enabled) return;
  try {
    navigator.vibrate?.(40);
  } catch {
    /* unsupported, fine */
  }
}
