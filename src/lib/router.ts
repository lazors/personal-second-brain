import { useEffect, useState } from 'react';

export type Route =
  | { name: 'dashboard' }
  | { name: 'collection'; type: string }
  | { name: 'search' };

const COLLECTIONS = new Set([
  'thoughts',
  'ideas',
  'tasks',
  'references',
  'trackers',
]);

function parse(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').trim();
  if (!path) return { name: 'dashboard' };
  if (path === 'search') return { name: 'search' };
  if (COLLECTIONS.has(path)) {
    // strip trailing 's' to get singular item type
    return { name: 'collection', type: path.replace(/s$/, '') };
  }
  return { name: 'dashboard' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parse(location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

export function navigate(to: string) {
  location.hash = to;
}
