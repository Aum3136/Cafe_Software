import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMenu } from '../hooks/useMenu';
import { useCart } from '../context/CartContext';
import { CategoryTabs } from '../components/CategoryTabs';
import { ItemCard } from '../components/ItemCard';
import { CartBar } from '../components/CartBar';
import { MenuSkeleton } from '../components/MenuSkeleton';

/*
  MenuPage layout:
  ┌─────────────────────────────┐  ← position: sticky, top: 0
  │  Cafe Header (name + logo)  │
  │  Category Tabs              │
  └─────────────────────────────┘
  │  Category Section Heading   │
  │  ItemCard                   │  ← scrollable content
  │  ItemCard                   │
  │  ...                        │
  ┌─────────────────────────────┐  ← position: fixed, bottom: 0
  │  CartBar (slides up)        │
  └─────────────────────────────┘

  Active category is tracked two ways:
  1. Click on a tab → smooth-scroll to that section
  2. Scroll the page → IntersectionObserver updates active tab
  Both directions sync to the same activeId state.
*/

export function MenuPage() {
  const { cafeSlug } = useParams<{ cafeSlug: string }>();
  const navigate = useNavigate();
  const { cafe, menu, isLoading, error } = useMenu(cafeSlug);
  useCart(); // CartBar reads cart state directly via context

  const [activeId, setActiveId]         = useState<number | null>(null);
  const [isScrolling, setIsScrolling]   = useState(false);
  const sectionRefs                     = useRef<Map<number, HTMLElement>>(new Map());
  const scrollTimerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set first category as active once menu loads
  useEffect(() => {
    if (menu.length > 0 && activeId === null) {
      setActiveId(menu[0].id);
    }
  }, [menu, activeId]);

  // IntersectionObserver — watches category sections and updates the active tab
  // as the user scrolls naturally through the menu
  useEffect(() => {
    if (menu.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        // Don't fight the observer while a programmatic scroll is in progress
        if (isScrolling) return;

        // Find the topmost visible section
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const id = Number(visible[0].target.getAttribute('data-category-id'));
          if (!isNaN(id)) setActiveId(id);
        }
      },
      {
        // Section is "active" when its top half is in the upper 60% of the viewport
        rootMargin: '-10% 0px -40% 0px',
        threshold: 0,
      }
    );

    sectionRefs.current.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [menu, isScrolling]);

  // Register a section's DOM element
  const registerSection = useCallback((id: number, el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(id, el);
    else sectionRefs.current.delete(id);
  }, []);

  // Tab click → scroll to that section
  const handleTabSelect = useCallback((id: number) => {
    setActiveId(id);
    setIsScrolling(true);

    const el = sectionRefs.current.get(id);
    if (el) {
      // Offset for sticky header (approx 110px — header + tabs)
      const TOP_OFFSET = 110;
      const y = el.getBoundingClientRect().top + window.scrollY - TOP_OFFSET;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    // Re-enable observer after scroll animation (~600ms)
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 700);
  }, []);

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">🍽️</div>
        <h1 className="text-lg font-semibold text-ink mb-2">Menu not found</h1>
        <p className="text-sm text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas relative">
      {/* Subtle paper-grain texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-surface border-b border-line">

        {/* Cafe name bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          {cafe?.logo_url ? (
            <img
              src={cafe.logo_url}
              alt={cafe?.name}
              className="w-9 h-9 rounded-full object-cover border border-line flex-shrink-0"
            />
          ) : (
            /* Logo placeholder — saffron initial circle */
            <div className="w-9 h-9 rounded-full bg-saffron-100 flex items-center justify-center flex-shrink-0">
              <span className="text-saffron-600 font-semibold text-sm">
                {cafe?.name?.[0] ?? '☕'}
              </span>
            </div>
          )}

          <div className="min-w-0">
            {isLoading ? (
              <div className="h-4 w-32 bg-line rounded animate-pulse" />
            ) : (
             <h1 className="font-serif font-semibold text-ink text-base truncate">{cafe?.name}</h1>
            )}
            {cafe?.address && (
              <p className="text-xs text-muted truncate">{cafe.address}</p>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <CategoryTabs
          categories={menu}
          activeId={activeId}
          onSelect={handleTabSelect}
        />
      </header>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main
        className="px-4 pt-3 pb-28"
        // pb-28 = space for CartBar so last item isn't hidden behind it
      >
        {isLoading ? (
          <MenuSkeleton />
        ) : menu.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">🍽️</div>
            <p className="text-sm text-muted">This menu is empty right now.</p>
            <p className="text-xs text-ghost mt-1">Check back soon!</p>
          </div>
        ) : (
          menu.map(category => (
            <section
              key={category.id}
              ref={el => registerSection(category.id, el)}
              data-category-id={category.id}
              className="mb-6"
              aria-labelledby={`cat-${category.id}`}
            >
              {/* Category heading */}
              <h2 className="font-serif text-base font-semibold text-ink mb-3 pt-1">
                {category.name}
                <span className="ml-2 text-xs font-normal text-ghost">
                  {category.items.length} item{category.items.length !== 1 ? 's' : ''}
                </span>
              </h2>

              {/* Item list */}
              <div className="flex flex-col gap-3">
                {category.items.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    cafeSlug={cafeSlug ?? ''}
                    isFeatured={index === 0}
                    categoryName={category.name}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* ── Sticky cart bar ───────────────────────────────────────────── */}
      <CartBar
        onCheckout={() => navigate(`/checkout/${cafeSlug}`)}
      />
    </div>
  );
}
