import { useEffect, useState } from 'preact/hooks';
import { getState, subscribe } from '../lib/store';
import type { AppState } from '../lib/types';

/** Re-render on any store change. */
export function useStore(): AppState {
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force((n) => n + 1)), []);
  return getState();
}
