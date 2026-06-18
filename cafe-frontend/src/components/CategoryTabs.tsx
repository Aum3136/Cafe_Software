import { useEffect, useRef } from 'react';
import type { MenuCategory } from '../types';

interface CategoryTabsProps {
  categories: MenuCategory[];
  activeId: number | null;
  onSelect: (id: number) => void;
}

/*
  Horizontally scrollable tab bar that sticks below the cafe header.
  Active tab auto-scrolls into view when changed programmatically
  (e.g. when user scrolls the page and active category changes).
*/
export function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef    = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view whenever it changes
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeId]);

  if (categories.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="flex gap-1 overflow-x-auto scrollbar-hide px-4 py-2 bg-surface border-b border-line"
      role="tablist"
      aria-label="Menu categories"
    >
      {categories.map(cat => {
        const isActive = cat.id === activeId;
        return (
          <button
            key={cat.id}
            ref={isActive ? activeRef : null}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(cat.id)}
            className={`
              flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium
              transition-colors duration-150 whitespace-nowrap
              ${isActive
                ? 'bg-saffron-500 text-white shadow-tab'
                : 'bg-transparent text-muted hover:bg-saffron-50 hover:text-ink'
              }
            `}
          >
            {cat.name}
            <span className={`ml-1.5 text-xs ${isActive ? 'text-saffron-100' : 'text-ghost'}`}>
              {cat.items.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}
