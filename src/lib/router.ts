import { useEffect, useState } from 'preact/hooks';

/**
 * Tiny hash router — hash routing means GitHub Pages needs no rewrite rules
 * and deep links always work (TR-1).
 */
export interface Route {
  path: string;
  params: URLSearchParams;
}

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, '') || '/';
  const [path, query = ''] = h.split('?');
  return { path: path.startsWith('/') ? path : `/${path}`, params: new URLSearchParams(query) };
}

export function navigate(path: string, params?: Record<string, string>): void {
  const q = params ? `?${new URLSearchParams(params)}` : '';
  location.hash = `${path}${q}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
