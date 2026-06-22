import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { VegDot } from '../components/VegDot';
import { useCart } from '../context/CartContext';
import { useMenu } from '../hooks/useMenu';
import type { MenuItem } from '../types';
import { DishExperienceModal } from '../components/DishExperienceModal';
import { getFallbackImage } from '../components/ItemCard';
import { MoodEntry } from '../components/MoodEntry';

export function CustomerMenu() {
  const { cafeSlug } = useParams<{ cafeSlug: string }>();
  const [searchParams] = useSearchParams();
  const table = searchParams.get('table');
  const navigate = useNavigate();
  
  const { 
    cart: contextCart, 
    totalItems, 
    totalAmount, 
    addItem, 
    removeItem, 
    getQuantity, 
    setTableNumber,
    isShared,
    deviceLabel
  } = useCart();

  // Menu states via hook (includes 30s polling)
  const { cafe, menu, isLoading, error } = useMenu(cafeSlug);
  const [selectedExperienceItem, setSelectedExperienceItem] = useState<MenuItem | null>(null);

  // Filter & search states
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [moodFilter, setMoodFilter] = useState<{ keywords: string[]; label: string } | null>(null);

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (table) {
      setTableNumber(table);
    }
  }, [table, setTableNumber]);

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    setMoodFilter(null);
  };

  const availableItemIds = new Set(menu.flatMap(cat => cat.items).map(item => item.id));
  const hasUnavailableItems = !isLoading && menu.length > 0 && contextCart.items.length > 0 && contextCart.items.some(
    cartItem => !availableItemIds.has(cartItem.item_id)
  );

  // Filter menu categories and items
  const filteredMenu = menu
    .map((category) => {
      const matchesMood = !moodFilter || moodFilter.keywords.some(kw =>
        category.name.toLowerCase().includes(kw)
      );

      const filteredItems = category.items.filter((item) => {
        // Search filter
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Veg filter (is_veg: 1 = Veg, 0 = Non-veg)
        const matchesVeg = !vegOnly || item.is_veg === 1;

        return matchesSearch && matchesVeg;
      });

      return {
        ...category,
        items: matchesMood ? filteredItems : [],
      };
    })
    .filter((category) => {
      // If we are filtering by a specific category, only return that category
      if (activeCategory !== 'all' && category.id.toString() !== activeCategory) {
        return false;
      }
      // Only show categories that have items matching the filters
      return category.items.length > 0;
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col justify-between w-full max-w-md mx-auto shadow-lg">
        {/* Skeleton Header */}
        <div className="bg-surface p-4 border-b border-line animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-line" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-line rounded w-1/3" />
              <div className="h-3 bg-line rounded w-1/2" />
            </div>
          </div>
        </div>
        {/* Skeleton Body */}
        <div className="flex-1 p-4 space-y-6">
          <div className="h-8 bg-line rounded w-full animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-3 bg-surface p-3 rounded-xl border border-line animate-pulse">
                <div className="w-20 h-20 bg-line rounded-lg" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-line rounded w-3/4" />
                  <div className="h-3 bg-line rounded w-1/2" />
                  <div className="h-4 bg-line rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center w-full max-w-md mx-auto shadow-lg">
        <div className="text-6xl mb-4">🍽️</div>
        <h2 className="text-xl font-bold text-ink mb-2">Failed to load Menu</h2>
        <p className="text-muted text-sm mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 active:scale-95 text-white font-semibold rounded-xl transition-all shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col relative pb-28 lg:pb-12">
      {/* Subtle paper-grain texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="w-full max-w-6xl mx-auto px-0 lg:px-6 flex-1 flex flex-col">
        {/* ── HERO BANNER (Non-Sticky) ── */}
        <div className="relative h-60 lg:h-80 w-full bg-ink overflow-hidden flex flex-col justify-end lg:rounded-3xl lg:mt-6 shadow-sm">
          {/* Ambient cover photo */}
          <img
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200"
            alt="Atmospheric Cafe Lounge"
            className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
          />
          {/* Dark moody gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-black/20" />

          {/* Floating Table Badge */}
          <div className="absolute top-4 right-4 lg:top-6 lg:right-6 z-10">
            {table ? (
              <span className="bg-saffron-500/90 text-canvas text-[10px] lg:text-xs font-black uppercase tracking-widest px-3.5 py-2 rounded-full shadow-lg backdrop-blur-sm border border-saffron-100/10">
                Table {table}
              </span>
            ) : (
              <span className="bg-white/10 text-canvas/80 text-[10px] lg:text-xs font-black uppercase tracking-widest px-3.5 py-2 rounded-full shadow-lg backdrop-blur-sm border border-white/5">
                Pickup
              </span>
            )}
          </div>

          {/* Cafe Info Footer inside Hero */}
          <div className="relative z-10 px-5 pb-5 pt-12 lg:px-8 lg:pb-8 text-left space-y-1.5 lg:space-y-2.5">
            <div className="flex items-center gap-3 lg:gap-4">
              {cafe?.logo_url ? (
                <img
                  src={cafe.logo_url}
                  alt={cafe.name}
                  className="w-12 h-12 lg:w-16 lg:h-16 rounded-full object-cover border-2 border-canvas shadow-md"
                />
              ) : (
                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-saffron-500 flex items-center justify-center border-2 border-canvas shadow-md">
                  <span className="text-canvas font-black text-lg lg:text-2xl font-serif">
                    {cafe?.name?.[0] ?? 'C'}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-xl lg:text-3xl font-black text-white font-serif tracking-wide leading-tight drop-shadow-sm">
                  {cafe?.name}
                </h1>
                <p className="text-[9px] lg:text-[11px] text-canvas/80 font-black uppercase tracking-widest font-serif">
                  Where Magic is Brewing
                </p>
              </div>
            </div>
            {cafe?.address && (
              <p className="text-[10px] lg:text-xs text-canvas/75 font-medium drop-shadow-sm pl-0.5">
                {cafe.address}
              </p>
            )}
          </div>
        </div>

        {/* ── RESPONSIVE GRID LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6 lg:mt-8 px-4 lg:px-0">
          
          {/* ── LEFT SIDEBAR (Desktop Categories) ── */}
          <aside className="hidden lg:block lg:col-span-3 sticky lg:top-6 bg-white/70 backdrop-blur-md rounded-3xl p-5 border border-line/20 shadow-sm max-h-[calc(100vh-6rem)] overflow-y-auto">
            <h3 className="text-xs font-black text-ghost uppercase tracking-widest mb-4 px-2">Menu Sections</h3>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => handleCategoryClick('all')}
                className={`w-full text-left px-4 py-3 rounded-full text-xs font-bold transition-all duration-200 ${
                  activeCategory === 'all'
                    ? 'bg-saffron-500 text-canvas shadow-md'
                    : 'text-muted hover:bg-white/90 hover:text-ink'
                }`}
              >
                All Sections
              </button>
              {menu.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id.toString())}
                  className={`w-full text-left px-4 py-3 rounded-full text-xs font-bold transition-all duration-200 truncate ${
                    activeCategory === cat.id.toString()
                      ? 'bg-saffron-500 text-canvas shadow-md'
                      : 'text-muted hover:bg-white/90 hover:text-ink'
                  }`}
                  title={cat.name}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </aside>

          {/* ── CENTER AREA (Search + Mobile Categories + Menu Items) ── */}
          <div className="col-span-1 lg:col-span-6 flex flex-col min-w-0">
            {hasUnavailableItems && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4 animate-pulse animate-duration-1000">
                <span>⚠️</span>
                <span>Some items in your cart are no longer available.</span>
              </div>
            )}
            {/* Search & Veg Toggle Row (Sticky on Mobile, Static Header on Desktop) */}
            <div className="sticky lg:relative top-0 z-30 bg-canvas/85 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-b border-line/40 lg:border-none py-3.5 lg:py-0 lg:mb-6 space-y-3.5 shadow-sm lg:shadow-none -mx-4 px-4 lg:mx-0 lg:px-0">
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/75 border border-line rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400 transition-all font-medium placeholder-ghost shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ghost hover:text-muted text-sm font-semibold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Veg Only Toggle */}
                <button
                  onClick={() => setVegOnly(!vegOnly)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${
                    vegOnly
                      ? 'bg-veg/10 border-veg text-veg'
                      : 'bg-white/75 border-line text-muted hover:border-muted'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${vegOnly ? 'bg-veg animate-pulse' : 'bg-ghost'}`} />
                  Veg Only
                </button>
              </div>

              {/* Mobile Frosted Glass Category Selector (Hidden on Desktop) */}
              <div
                ref={categoryScrollRef}
                className="flex lg:hidden overflow-x-auto gap-2 pb-0.5 scrollbar-hide"
                style={{ scrollBehavior: 'smooth' }}
              >
                <button
                  onClick={() => handleCategoryClick('all')}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeCategory === 'all'
                      ? 'bg-saffron-500 text-canvas shadow-md'
                      : 'bg-white/40 border border-line/50 text-muted hover:bg-white/60'
                  }`}
                >
                  All
                </button>
                {menu.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id.toString())}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      activeCategory === cat.id.toString()
                        ? 'bg-saffron-500 text-canvas shadow-md'
                        : 'bg-white/40 border border-line/50 text-muted hover:bg-white/60'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ── FILTERED ITEM LIST (Desktop multi-column grid support!) ── */}
            <main className="py-3 flex-1">
              {moodFilter && (
                <div className="bg-saffron-50/50 border border-saffron-200/50 rounded-lg p-3.5 mb-5 flex items-center justify-between">
                  <span className="text-xs text-saffron-800 font-medium">
                    Showing {moodFilter.label.toLowerCase()}
                  </span>
                  <button
                    onClick={() => setMoodFilter(null)}
                    className="text-xs font-bold text-saffron-600 hover:text-saffron-800 underline"
                  >
                    Clear filter
                  </button>
                </div>
              )}

              {filteredMenu.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted">
                  <p className="text-sm">No items found matching the filters.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setVegOnly(false);
                      handleCategoryClick('all');
                    }}
                    className="text-xs text-saffron-600 font-semibold underline mt-2 hover:text-saffron-700"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                filteredMenu.map((category) => (
                  <section key={category.id} className="mb-8">
                    <h2 className="text-sm font-bold text-ink mb-4 tracking-wide uppercase border-l-4 border-saffron-500 pl-2">
                      {category.name}
                      <span className="ml-1.5 text-[10px] font-normal text-ghost normal-case">
                        ({category.items.length})
                      </span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {category.items.map((item, index) => {
                        const qty = getQuantity(item.id);
                        const isFeatured = index === 0;
                        const displayImage = item.image_url || getFallbackImage(item.name, category.name);

                        const cartItem = contextCart.items.find(i => i.item_id === item.id);
                        const addedBy = cartItem?.added_by_device;

                        if (isFeatured) {
                          return (
                            <article
                              key={item.id}
                              onClick={() => setSelectedExperienceItem(item)}
                              className="col-span-1 sm:col-span-2 flex flex-col gap-3.5 bg-white rounded-lg p-4 shadow-card-featured border border-line/25 cursor-pointer relative overflow-hidden"
                            >
                              {/* Photo container */}
                              <div className="relative w-full h-48 sm:h-64 rounded-md overflow-hidden bg-saffron-50 border border-line/10">
                                <img
                                  src={displayImage}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  style={{ filter: 'saturate(1.1) contrast(1.05) sepia(0.08)' }}
                                  loading="lazy"
                                />
                              </div>

                              {/* Content Info */}
                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start gap-2 mb-1">
                                    <VegDot isVeg={item.is_veg === 1} />
                                    <h3 className="text-base font-bold text-ink leading-snug font-sans tracking-tight">
                                      {item.name}
                                    </h3>
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-muted leading-relaxed font-medium mt-1">
                                      {item.description}
                                    </p>
                                  )}
                                  {isShared && addedBy && (
                                    <span className="text-[10px] text-muted block mt-1.5 font-medium">
                                      Added by {addedBy === deviceLabel ? 'you' : addedBy}
                                    </span>
                                  )}
                                </div>

                                {/* Price & Add to Cart Controls */}
                                <div className="flex items-center justify-between mt-3.5 pt-1">
                                  <span className="text-base font-bold text-saffron-600">
                                    ₹{item.price}
                                  </span>

                                  {qty === 0 ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addItem(cafeSlug ?? '', item);
                                      }}
                                      className="px-4 py-1.5 bg-saffron-500 hover:bg-saffron-600 active:scale-95 text-white text-xs font-bold rounded-full shadow-sm transition-all"
                                    >
                                      + Add
                                    </button>
                                  ) : (
                                    <div 
                                      className="flex items-center bg-saffron-500 rounded-full overflow-hidden shadow-sm"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeItem(item.id);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center text-white text-sm font-bold hover:bg-saffron-600 active:scale-90 transition-all"
                                      >
                                        −
                                      </button>
                                      <span className="text-white text-xs font-bold min-w-[2ch] text-center px-1">
                                        {qty}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addItem(cafeSlug ?? '', item);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center text-white text-sm font-bold hover:bg-saffron-600 active:scale-90 transition-all"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </article>
                          );
                        }

                        // Standard compact card
                        return (
                          <article
                            key={item.id}
                            onClick={() => setSelectedExperienceItem(item)}
                            className="flex gap-4 bg-white rounded-lg p-4 shadow-card hover:shadow-card-featured transition-all duration-300 border border-line/25 cursor-pointer relative overflow-hidden"
                          >
                            {/* Photo or Placeholder */}
                            <div className="relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-saffron-50 border border-line/10">
                              <img
                                src={displayImage}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                style={{ filter: 'saturate(1.1) contrast(1.05) sepia(0.08)' }}
                                loading="lazy"
                              />
                            </div>

                            {/* Content Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-start gap-1.5">
                                  <VegDot isVeg={item.is_veg === 1} />
                                  <h3 className="text-xs font-bold text-ink leading-snug font-sans tracking-tight">
                                    {item.name}
                                  </h3>
                                </div>
                                {item.description && (
                                  <p className="text-[10px] text-muted mt-1 line-clamp-2 leading-relaxed font-medium">
                                    {item.description}
                                  </p>
                                )}
                                {isShared && addedBy && (
                                  <span className="text-[9px] text-muted block mt-1 font-medium">
                                    Added by {addedBy === deviceLabel ? 'you' : addedBy}
                                  </span>
                                )}
                              </div>

                              {/* Price & Add to Cart Controls */}
                              <div className="flex items-center justify-between mt-2 pt-1">
                                <span className="text-sm font-bold text-[#4A5D4E]">
                                  ₹{item.price}
                                </span>

                                {qty === 0 ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addItem(cafeSlug ?? '', item);
                                    }}
                                    className="px-4 py-1.5 bg-saffron-500 hover:bg-saffron-600 active:scale-95 text-white text-xs font-bold rounded-full shadow-sm transition-all"
                                  >
                                    + Add
                                  </button>
                                ) : (
                                  <div 
                                    className="flex items-center bg-saffron-500 rounded-full overflow-hidden shadow-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeItem(item.id);
                                      }}
                                      className="w-8 h-8 flex items-center justify-center text-white text-sm font-bold hover:bg-saffron-600 active:scale-90 transition-all"
                                    >
                                      −
                                    </button>
                                    <span className="text-white text-xs font-bold min-w-[2ch] text-center px-1">
                                      {qty}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addItem(cafeSlug ?? '', item);
                                      }}
                                      className="w-8 h-8 flex items-center justify-center text-white text-sm font-bold hover:bg-saffron-600 active:scale-90 transition-all"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </main>
          </div>

          {/* ── RIGHT SIDEBAR (Desktop Cart Panel) ── */}
          <aside className="hidden lg:block lg:col-span-3 sticky lg:top-6">
            <div className="bg-[#1C1715] text-white rounded-lg p-5 shadow-lg border border-white/5 max-h-[calc(100vh-6rem)] overflow-y-auto flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-4">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    Order Cart
                  </h3>
                  <span className="bg-saffron-400 text-[#1C1715] text-[10px] font-black w-5 h-5 rounded-lg flex items-center justify-center">
                    {totalItems}
                  </span>
                </div>

                {totalItems === 0 ? (
                  <div className="py-12 text-center text-white/40 space-y-2">
                    <p className="text-xs font-medium">Your cart is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5 mb-6 max-h-[40vh] overflow-y-auto pr-1">
                    {contextCart.items.map((cartItem) => (
                      <div key={cartItem.item_id} className="flex flex-col justify-between border-b border-white/5 pb-2 mb-2 gap-1">
                        <div className="flex justify-between items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">{cartItem.name}</p>
                            <p className="text-[10px] text-white/50">₹{cartItem.price} each</p>
                          </div>
                          <div className="flex items-center bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                            <button
                              onClick={() => removeItem(cartItem.item_id)}
                              className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/20 active:scale-90"
                            >
                              −
                            </button>
                            <span className="text-white text-xs font-bold px-1.5 min-w-[1.5ch] text-center">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => {
                                const menuItem = menu.flatMap(cat => cat.items).find(i => i.id === cartItem.item_id);
                                if (menuItem) {
                                  addItem(cafeSlug ?? '', menuItem);
                                }
                              }}
                              className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/20 active:scale-90"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs font-bold text-white flex-shrink-0 min-w-[4ch] text-right">
                            ₹{cartItem.price * cartItem.quantity}
                          </span>
                        </div>
                        {isShared && cartItem.added_by_device && (
                          <span className="text-[9px] text-white/40 block leading-none pl-0.5">
                            added by {cartItem.added_by_device === deviceLabel ? 'you' : cartItem.added_by_device}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {totalItems > 0 && (
                <div className="border-t border-white/10 pt-4 mt-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/70 font-medium">Total:</span>
                    <span className="text-base font-black text-saffron-300">₹{totalAmount}</span>
                  </div>
                  <button
                    onClick={() => {
                      const tableParam = table ? `?table=${encodeURIComponent(table)}` : '';
                      navigate(`/checkout/${cafeSlug}${tableParam}`);
                    }}
                    className="w-full bg-saffron-400 hover:bg-saffron-500 text-[#1C1715] text-xs font-black py-3 rounded-lg transition-all shadow-md uppercase tracking-wider text-center"
                  >
                    {isShared ? "Send table's order to kitchen" : "Send order to kitchen"} (₹{totalAmount})
                  </button>
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>

      {/* ── BOTTOM CART DRAWER SUMMARY (Hidden on Desktop) ── */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3 bg-gradient-to-t from-canvas via-canvas/90 to-transparent pointer-events-none max-w-md mx-auto lg:hidden">
          <div className="bg-[#1C1715] text-canvas rounded-lg px-5 py-4 shadow-[0_12px_40px_rgba(26,20,16,0.22)] pointer-events-auto flex items-center justify-between animate-slide-up border border-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-saffron-400 text-[#1C1715] text-xs font-black w-7 h-7 rounded-md flex items-center justify-center shadow-inner">
                {totalItems}
              </div>
              <div>
                <p className="text-[9px] text-ghost font-bold uppercase tracking-widest">Cart Summary</p>
                <p className="text-xs font-black text-white">
                  {totalItems} Item{totalItems !== 1 ? 's' : ''} Selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-canvas">
                ₹{totalAmount}
              </span>
              <button
                onClick={() => {
                  const tableParam = table ? `?table=${encodeURIComponent(table)}` : '';
                  navigate(`/checkout/${cafeSlug}${tableParam}`);
                }}
                className="bg-saffron-400 hover:bg-saffron-500 active:scale-95 text-[#1C1715] text-xs font-black px-5 py-2.5 rounded-lg transition-all shadow-md uppercase tracking-wider"
              >
                {isShared ? "Send table's order" : "Order at counter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMMERSIVE EXPERIENCE & 3D PREVIEW MODAL ── */}
      {selectedExperienceItem && (
        <DishExperienceModal
          item={selectedExperienceItem}
          qty={getQuantity(selectedExperienceItem.id)}
          onAdd={() => addItem(cafeSlug ?? '', selectedExperienceItem)}
          onRemove={() => removeItem(selectedExperienceItem.id)}
          onClose={() => setSelectedExperienceItem(null)}
        />
      )}

      {/* Conversational Entry screen */}
      <MoodEntry 
        cafeSlug={cafeSlug ?? ''} 
        onSelect={(keywords, label) => {
          if (keywords && label) {
            setMoodFilter({ keywords, label });
          } else {
            setMoodFilter(null);
          }
        }} 
      />
    </div>
  );
}

// Trigger Vercel rebuild

