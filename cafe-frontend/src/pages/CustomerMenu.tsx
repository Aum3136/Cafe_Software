import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { VegDot } from '../components/VegDot';
import { useCart } from '../context/CartContext';
import type { CafeInfo, MenuItem, MenuCategory } from '../types';
import { DishExperienceModal } from '../components/DishExperienceModal';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface CartStateItem {
  item: MenuItem;
  quantity: number;
}

export function CustomerMenu() {
  const { cafeSlug } = useParams<{ cafeSlug: string }>();
  const [searchParams] = useSearchParams();
  const table = searchParams.get('table');
  const navigate = useNavigate();
  const { clearCart, addItem, setTableNumber } = useCart();

  // Menu states
  const [cafe, setCafe] = useState<CafeInfo | null>(null);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperienceItem, setSelectedExperienceItem] = useState<MenuItem | null>(null);

  // Filter & search states
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [vegOnly, setVegOnly] = useState<boolean>(false);

  // Local cart state
  const [cart, setCart] = useState<Record<number, CartStateItem>>({});

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Fetch menu data on mount / cafeSlug change
  const fetchMenu = async () => {
    if (!cafeSlug) {
      setError('Invalid cafe link.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${BASE_URL}/api/menu/${cafeSlug}`);
      if (!response.ok) {
        let message = `Error: ${response.status} ${response.statusText}`;
        try {
          const body = await response.json();
          if (body?.error) message = body.error;
        } catch {
          // Ignore JSON parse failure
        }
        throw new Error(message);
      }

      const data = await response.json();
      
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
          if (item.name === 'Samosa (2 pcs)') {
            return {
              ...item,
              '3d_model_url': 'https://modelviewer.dev/shared-assets/models/shishkebab.glb',
              ingredients: ['Spiced Potatoes', 'Green Peas', 'Crispy Maida Shell', 'Coriander Seeds', 'Mint Chutney']
            };
          }
          if (item.name === 'Cold Coffee') {
            return {
              ...item,
              '3d_model_url': 'https://modelviewer.dev/shared-assets/models/shishkebab.glb',
              ingredients: ['Espresso Shot', 'Chilled Milk', 'Cocoa Powder', 'Vanilla Ice Cream']
            };
          }
          return item;
        })
      }));

      setCafe(data.cafe);
      setMenu(updatedMenu);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to fetch menu items.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [cafeSlug]);

  useEffect(() => {
    if (table) {
      setTableNumber(table);
    }
  }, [table, setTableNumber]);

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: existing ? existing.quantity + 1 : 1,
        },
      };
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      
      const updated = { ...prev };
      if (existing.quantity <= 1) {
        delete updated[itemId];
      } else {
        updated[itemId] = {
          ...existing,
          quantity: existing.quantity - 1,
        };
      }
      return updated;
    });
  };

  const getQuantity = (itemId: number) => {
    return cart[itemId]?.quantity ?? 0;
  };

  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = Object.values(cart).reduce((sum, item) => sum + item.item.price * item.quantity, 0);

  // Filter menu categories and items
  const filteredMenu = menu
    .map((category) => {
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
        items: filteredItems,
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
      <div className="min-h-screen bg-canvas flex flex-col justify-between max-w-md mx-auto shadow-lg">
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
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto shadow-lg">
        <div className="text-6xl mb-4">🍽️</div>
        <h2 className="text-xl font-bold text-ink mb-2">Failed to load Menu</h2>
        <p className="text-muted text-sm mb-6">{error}</p>
        <button
          onClick={fetchMenu}
          className="px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 active:scale-95 text-white font-semibold rounded-xl transition-all shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col max-w-md mx-auto shadow-lg relative pb-28">
      {/* ── STICKY TOP BANNER ── */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {cafe?.logo_url ? (
              <img
                src={cafe.logo_url}
                alt={cafe.name}
                className="w-10 h-10 rounded-full object-cover border border-line"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-saffron-100 flex items-center justify-center">
                <span className="text-saffron-600 font-bold text-lg">
                  {cafe?.name?.[0] ?? '☕'}
                </span>
              </div>
            )}
            <div>
              <h1 className="font-bold text-ink text-base leading-tight">{cafe?.name}</h1>
              {cafe?.address && (
                <p className="text-xs text-muted truncate max-w-[200px]">{cafe.address}</p>
              )}
            </div>
          </div>

          {/* Table / QR Info Banner */}
          <div className="flex flex-col items-end">
            {table ? (
              <span className="bg-saffron-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                Table {table}
              </span>
            ) : (
              <span className="bg-line text-muted text-[10px] font-medium px-2 py-0.5 rounded-full">
                Self Pickup
              </span>
            )}
          </div>
        </div>

        {/* Search & Veg Toggle Row */}
        <div className="px-4 pb-3 pt-1 flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-canvas border border-line rounded-xl px-3.5 py-1.5 text-xs focus:outline-none focus:border-saffron-400 focus:ring-1 focus:ring-saffron-400 transition-all"
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              vegOnly
                ? 'bg-veg/10 border-veg text-veg'
                : 'bg-canvas border-line text-muted hover:border-muted'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${vegOnly ? 'bg-veg' : 'bg-ghost'}`} />
            Veg Only
          </button>
        </div>

        {/* ── HORIZONTAL SLIDING CATEGORY SELECTOR ── */}
        <div
          ref={categoryScrollRef}
          className="flex overflow-x-auto gap-2 px-4 pb-3 scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
        >
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeCategory === 'all'
                ? 'bg-saffron-500 text-white shadow-sm'
                : 'bg-canvas border border-line text-muted hover:border-ghost'
            }`}
          >
            All
          </button>
          {menu.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id.toString())}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat.id.toString()
                  ? 'bg-saffron-500 text-white shadow-sm'
                  : 'bg-canvas border border-line text-muted hover:border-ghost'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* ── FILTERED ITEM LIST ── */}
      <main className="px-4 py-3 flex-1">
        {filteredMenu.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="text-sm">No items found matching the filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setVegOnly(false);
                setActiveCategory('all');
              }}
              className="text-xs text-saffron-600 font-semibold underline mt-2 hover:text-saffron-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredMenu.map((category) => (
            <section key={category.id} className="mb-6">
              <h2 className="text-sm font-bold text-ink mb-3 tracking-wide uppercase border-l-4 border-saffron-500 pl-2">
                {category.name}
                <span className="ml-1.5 text-[10px] font-normal text-ghost normal-case">
                  ({category.items.length})
                </span>
              </h2>

              <div className="flex flex-col gap-3">
                {category.items.map((item) => {
                  const qty = getQuantity(item.id);
                  return (
                    <article
                      key={item.id}
                      onClick={() => setSelectedExperienceItem(item)}
                      className="flex gap-3 bg-surface rounded-2xl p-3 shadow-card hover:shadow-md transition-all border border-line/40 cursor-pointer"
                    >
                      {/* Photo or Placeholder */}
                      <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-saffron-50">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl select-none">
                            {item.is_veg === 1 ? '🥗' : '🍗'}
                          </div>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start gap-1.5">
                            <VegDot isVeg={item.is_veg === 1} />
                            <h3 className="text-xs font-bold text-ink leading-snug line-clamp-2">
                              {item.name}
                            </h3>
                          </div>
                          {item.description && (
                            <p className="text-[10px] text-muted mt-1 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Price & Add to Cart Controls */}
                        <div className="flex items-center justify-between mt-2 pt-1">
                          <span className="text-sm font-extrabold text-saffron-600">
                            ₹{item.price}
                          </span>

                          {qty === 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(item);
                              }}
                              className="px-4 py-1.5 bg-saffron-500 hover:bg-saffron-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                            >
                              + ADD
                            </button>
                          ) : (
                            <div 
                              className="flex items-center bg-saffron-500 rounded-xl overflow-hidden shadow-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCart(item.id);
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
                                  addToCart(item);
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

      {/* ── BOTTOM CART DRAWER SUMMARY ── */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3 bg-gradient-to-t from-canvas via-canvas/90 to-transparent pointer-events-none max-w-md mx-auto">
          <div className="bg-ink text-white rounded-2xl px-4 py-3.5 shadow-xl pointer-events-auto flex items-center justify-between animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="bg-saffron-500 text-white text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center shadow-inner">
                {totalItems}
              </div>
              <div>
                <p className="text-xs text-ghost font-medium">Local Cart Tracker</p>
                <p className="text-xs font-bold">
                  {totalItems} Item{totalItems !== 1 ? 's' : ''} Selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-extrabold text-saffron-100">
                ₹{totalAmount}
              </span>
              <button
                onClick={() => {
                  clearCart();
                  Object.values(cart).forEach(({ item, quantity }) => {
                    for (let i = 0; i < quantity; i++) {
                      addItem(cafeSlug ?? '', item);
                    }
                  });
                  const tableParam = table ? `?table=${encodeURIComponent(table)}` : '';
                  navigate(`/checkout/${cafeSlug}${tableParam}`);
                }}
                className="bg-saffron-500 hover:bg-saffron-600 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md"
              >
                Place Order
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
          onAdd={() => addToCart(selectedExperienceItem)}
          onRemove={() => removeFromCart(selectedExperienceItem.id)}
          onClose={() => setSelectedExperienceItem(null)}
        />
      )}
    </div>
  );
}
