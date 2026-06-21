import { useState, useEffect } from 'react';
import { VegDot } from '../components/VegDot';
import { getFallbackImage } from '../components/ItemCard';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface MenuItem {
  id: number;
  cafe_id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: 0 | 1;
  is_available: 0 | 1;
  sort_order: number;
}

interface Category {
  id: number;
  name: string;
  item_count: number;
}

export function MenuManager() {
  const token = localStorage.getItem('owner_token');

  // State lists
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Loading & error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch items & categories
  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch items
      const itemsRes = await fetch(`${BASE_URL}/api/items`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!itemsRes.ok) throw new Error('Failed to fetch menu items.');
      const itemsData = await itemsRes.json();

      // 2. Fetch categories
      const catRes = await fetch(`${BASE_URL}/api/categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!catRes.ok) throw new Error('Failed to fetch categories.');
      const catData = await catRes.json();

      setItems(itemsData.items);
      setCategories(catData.categories);
      
      // Select first category as default for the form
      if (catData.categories.length > 0) {
        setCategoryId(catData.categories[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load menu data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // ── LIVE TOGGLE SWITCH: SOLD OUT / AVAILABLE ──
  const handleToggleAvailable = async (itemId: number) => {
    if (!token) return;

    try {
      const response = await fetch(`${BASE_URL}/api/items/${itemId}/toggle-available`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to update availability.');

      const data = await response.json();
      
      // Update local state list
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_available: data.is_available } : item
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update item availability.');
    }
  };

  // ── ADD NEW ITEM SUBMISSION ──
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim() || !categoryId) {
      setFormError('Name, Price, and Category are required fields.');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Please enter a valid price.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch(`${BASE_URL}/api/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          price: priceNum,
          description: description.trim() || undefined,
          category_id: parseInt(categoryId),
          is_veg: isVeg ? 1 : 0,
        }),
      });

      if (!response.ok) {
        let errMsg = 'Failed to create item.';
        try {
          const body = await response.json();
          if (body?.error) errMsg = body.error;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      // Refresh list, close modal, reset inputs
      await fetchData();
      setIsModalOpen(false);
      setName('');
      setPrice('');
      setDescription('');
      if (categories.length > 0) {
        setCategoryId(categories[0].id.toString());
      }
      setIsVeg(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error adding item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-black text-ink font-serif">Menu Manager</h1>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-saffron-500 hover:bg-saffron-600 active:scale-95 text-canvas text-xs font-bold px-5 py-2.5 rounded-full shadow-md transition-all flex items-center gap-1.5"
        >
          Add Item
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 text-xs font-semibold p-3.5 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Main Grid Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-surface border border-line rounded-lg p-4 h-36 flex gap-3">
              <div className="w-16 h-16 bg-line rounded-md" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-line rounded w-3/4" />
                <div className="h-3 bg-line rounded w-1/2" />
                <div className="h-4 bg-line rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-surface rounded-lg border border-line p-12 text-center text-muted">
          <h2 className="text-base font-bold text-ink">Your menu is empty</h2>
          <p className="text-xs mt-1 text-muted max-w-xs mx-auto leading-relaxed">
            Click the Add Item button above to create the first dish for your cafe!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const displayImage = item.image_url || getFallbackImage(item.name, item.category_name);
            return (
              <article
                key={item.id}
                className={`bg-surface rounded-lg border border-line p-4 shadow-card hover:shadow-card-featured transition-all flex gap-3 ${
                  item.is_available === 0 ? 'opacity-65' : ''
                }`}
              >
                {/* Thumbnail Image */}
                <div className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-saffron-50 border border-line">
                  <img 
                    src={displayImage} 
                    alt={item.name} 
                    className="w-full h-full object-cover" 
                    style={{ filter: 'saturate(1.1) contrast(1.05) sepia(0.08)' }}
                    loading="lazy"
                  />
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-1.5">
                      <VegDot isVeg={item.is_veg === 1} />
                      <h2 className="text-xs font-bold text-ink truncate leading-tight">
                        {item.name}
                      </h2>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-line text-muted text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize">
                        {item.category_name}
                      </span>
                      <span className="text-xs font-extrabold text-saffron-600">
                        ₹{item.price}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[10px] text-muted line-clamp-1 mt-1 leading-normal">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Available / Sold-Out Toggle Switch */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-line/40">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wide">
                      {item.is_available === 1 ? 'Instock' : 'Sold out'}
                    </span>

                    {/* Custom Toggle Switch */}
                    <button
                      onClick={() => handleToggleAvailable(item.id)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.is_available === 1 ? 'bg-saffron-500' : 'bg-ghost'
                      }`}
                      role="switch"
                      aria-checked={item.is_available === 1}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          item.is_available === 1 ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── ADD NEW ITEM MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-ink/40" />

          {/* Modal Card */}
          <div className="bg-surface rounded-lg shadow-xl border border-line w-full max-w-md p-6 relative z-10 space-y-5 animate-slide-up">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h2 className="text-base font-bold text-ink font-serif">
                Add New Menu Item
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-ghost hover:text-muted text-lg font-black"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 border border-red-100 text-xs font-semibold p-3 rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label htmlFor="item-name" className="block text-xs font-bold text-ink mb-1">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="item-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ginger Tea, Paneer Tikka"
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-saffron-500 bg-canvas transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="item-price" className="block text-xs font-bold text-ink mb-1">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="item-price"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 40"
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-saffron-500 bg-canvas transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="item-category" className="block text-xs font-bold text-ink mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="item-category"
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full border border-line rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-saffron-500 bg-canvas transition-colors"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="item-description" className="block text-xs font-bold text-ink mb-1">
                  Description
                </label>
                <textarea
                  id="item-description"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Classic home-style spiced tea with cardamom"
                  className="w-full border border-line rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-saffron-500 bg-canvas transition-colors resize-none"
                />
              </div>

              {/* FSSAI Veg / Non-Veg Toggle */}
              <div className="flex items-center justify-between bg-canvas border border-line rounded-lg p-3">
                <div>
                  <span className="block text-xs font-bold text-ink">Food Type</span>
                  <span className="text-[10px] text-muted">Identify this dish for FSSAI indicators</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVeg(true)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isVeg
                        ? 'bg-veg/10 border border-veg text-veg'
                        : 'border border-line text-muted bg-white'
                    }`}
                  >
                    Veg
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVeg(false)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      !isVeg
                        ? 'bg-nonveg/10 border border-nonveg text-nonveg'
                        : 'border border-line text-muted bg-white'
                    }`}
                  >
                    Non-Veg
                  </button>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-line hover:bg-line/80 active:scale-[0.98] text-muted text-xs font-bold py-2.5 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-saffron-500 hover:bg-saffron-600 active:scale-[0.98] text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
