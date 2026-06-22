import { useState, useEffect } from 'react';
import { fetchPublicMenu } from '../api/menu';
import type { CafeInfo, MenuCategory, MenuItem } from '../types';

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
  Also polls every 30 seconds to catch real-time availability updates from owners.
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

    let cancelled = false;

    const fetchMenuData = (showLoading = false) => {
      if (showLoading) {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
      }

      fetchPublicMenu(slug)
        .then(data => {
          if (cancelled) return;

          // Inject client-side mock 3D model URLs onto premium items for verification
          const updatedMenu = data.menu.map((cat: MenuCategory) => ({
            ...cat,
            items: cat.items.map((item: MenuItem) => {
              if (item.name === 'Masala Chai') {
                return {
                  ...item,
                  '3d_model_url': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Avocado/glTF-Binary/Avocado.glb',
                  ingredients: ['Fresh Ginger', 'Cardamom Pods', 'Assam Tea Leaves', 'Full Cream Milk', 'Sugar']
                };
              }
              if (item.name === 'The Classic Cheese & Garlic') {
                return {
                  ...item,
                  '3d_model_url': 'https://modelviewer.dev/shared-assets/models/shishkebab.glb',
                  ingredients: ['Crispy Bread', 'Cheddar Cheese', 'Mozzarella', 'Garlic Butter', 'Oregano']
                };
              }
              if (item.name === 'Classic Blend Cold Coffee') {
                return {
                  ...item,
                  '3d_model_url': 'https://modelviewer.dev/shared-assets/models/shishkebab.glb',
                  ingredients: ['Espresso Shot', 'Chilled Milk', 'Sweet Cream', 'Ice Cubes']
                };
              }
              return item;
            })
          }));

          setState(prev => {
            // Compare the lists of available item IDs
            const prevIds = prev.menu.flatMap(cat => cat.items).map(i => i.id).sort().join(',');
            const newIds = updatedMenu.flatMap((cat: MenuCategory) => cat.items).map((i: MenuItem) => i.id).sort().join(',');

            // If available items are the same, return previous state to avoid triggering unnecessary re-renders
            if (prevIds === newIds && prev.cafe?.id === data.cafe.id && prev.error === null) {
              return { ...prev, isLoading: false };
            }

            return {
              cafe: data.cafe,
              menu: updatedMenu,
              isLoading: false,
              error: null
            };
          });
        })
        .catch(err => {
          if (cancelled) return;
          const message = err instanceof Error ? err.message : 'Failed to load menu.';
          setState(prev => {
            // If we already have a loaded menu, keep it during polling errors
            if (prev.menu.length > 0) {
              return { ...prev, isLoading: false };
            }
            return { cafe: null, menu: [], isLoading: false, error: message };
          });
        });
    };

    // Initial fetch
    fetchMenuData(true);

    // Setup 30-second polling
    const intervalId = setInterval(() => {
      fetchMenuData(false);
    }, 30 * 1000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [slug]);

  return state;
}
