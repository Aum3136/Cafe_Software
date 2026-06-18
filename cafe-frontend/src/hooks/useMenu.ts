import { useState, useEffect } from 'react';
import { fetchPublicMenu } from '../api/menu';
import type { CafeInfo, MenuCategory } from '../types';

interface UseMenuState {
  cafe: CafeInfo | null;
  menu: MenuCategory[];
  isLoading: boolean;
  error: string | null;
}

/*
  Custom hook that owns the full data-fetching lifecycle for the public menu.
  Components just call useMenu(slug) and get back typed data + states.
  Re-fetches automatically if the slug changes (e.g. navigating between cafes).
*/
export function useMenu(slug: string | undefined): UseMenuState {
  const [state, setState] = useState<UseMenuState>({
    cafe: null,
    menu: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Guard: don't fetch if slug is missing
    if (!slug) {
      setState({ cafe: null, menu: [], isLoading: false, error: 'Invalid menu link.' });
      return;
    }

    // AbortController lets us cancel in-flight requests if the component
    // unmounts or the slug changes before the fetch completes
    const controller = new AbortController();
    let cancelled = false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    fetchPublicMenu(slug)
      .then(data => {
        if (!cancelled) {
          setState({ cafe: data.cafe, menu: data.menu, isLoading: false, error: null });
        }
      })
      .catch(err => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load menu.';
          setState({ cafe: null, menu: [], isLoading: false, error: message });
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [slug]);

  return state;
}
