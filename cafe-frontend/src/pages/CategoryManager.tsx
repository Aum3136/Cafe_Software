import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface Category {
  id: number;
  cafe_id: number;
  name: string;
  sort_order: number;
  is_active: number;
  created_at: number;
  item_count: number;
}

export function CategoryManager() {
  const token = localStorage.getItem('owner_token');

  // State lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Add category fields
  const [addName, setAddName] = useState('');
  const [addSortOrder, setAddSortOrder] = useState('0');
  
  // Edit category fields
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editSortOrder, setEditSortOrder] = useState('0');
  const [editIsActive, setEditIsActive] = useState(true);

  // Deletion warning modal
  const [deletionWarning, setDeletionWarning] = useState<{ name: string; count: number } | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/api/categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load categories.');
      const data = await response.json();
      setCategories(data.categories);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  // ── ADD CATEGORY SUBMIT ──
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      setFormError('Category Name is required.');
      return;
    }

    const sortOrderNum = parseInt(addSortOrder);
    if (isNaN(sortOrderNum)) {
      setFormError('Sort order must be a valid number.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch(`${BASE_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: addName.trim(),
          sort_order: sortOrderNum,
        }),
      });

      if (!response.ok) {
        let errMsg = 'Failed to create category.';
        try {
          const body = await response.json();
          if (body?.error) errMsg = body.error;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      await fetchCategories();
      setIsAddOpen(false);
      setAddName('');
      setAddSortOrder('0');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error creating category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── EDIT CATEGORY INITIATE ──
  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditSortOrder(category.sort_order.toString());
    setEditIsActive(category.is_active === 1);
    setFormError(null);
    setIsEditOpen(true);
  };

  // ── EDIT CATEGORY SUBMIT ──
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editName.trim()) {
      setFormError('Category Name is required.');
      return;
    }

    const sortOrderNum = parseInt(editSortOrder);
    if (isNaN(sortOrderNum)) {
      setFormError('Sort order must be a valid number.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch(`${BASE_URL}/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName.trim(),
          sort_order: sortOrderNum,
          is_active: editIsActive ? 1 : 0,
        }),
      });

      if (!response.ok) {
        let errMsg = 'Failed to update category.';
        try {
          const body = await response.json();
          if (body?.error) errMsg = body.error;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      await fetchCategories();
      setIsEditOpen(false);
      setEditingCategory(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error updating category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── DELETE CATEGORY ──
  const handleDeleteCategory = async (category: Category) => {
    // Foreign-key safe precaution: if there are items inside the category, reject on frontend immediately
    if (category.item_count > 0) {
      setDeletionWarning({ name: category.name, count: category.item_count });
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/categories/${category.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        let errMsg = 'Failed to delete category.';
        try {
          const body = await response.json();
          if (body?.error) errMsg = body.error;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      await fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">📁</span>
          <h1 className="text-lg font-black text-ink">Category Manager</h1>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsAddOpen(true);
          }}
          className="bg-saffron-500 hover:bg-saffron-600 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <span className="text-sm font-bold leading-none">+</span> Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 text-xs font-semibold p-3.5 rounded-2xl text-center">
          {error}
        </div>
      )}

      {/* Categories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-surface border border-line rounded-2xl p-4 h-32 space-y-3">
              <div className="h-4 bg-line rounded w-1/2" />
              <div className="h-3 bg-line rounded w-1/3" />
              <div className="h-4 bg-line rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-line p-12 text-center text-muted shadow-card">
          <div className="text-5xl mb-4">📂</div>
          <h2 className="text-base font-bold text-ink">No categories found</h2>
          <p className="text-xs mt-1 text-muted max-w-xs mx-auto leading-relaxed">
            Click the **Add Category** button above to structure your menu categories!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`bg-surface rounded-2xl border border-line p-4 shadow-card hover:shadow-md transition-all flex flex-col justify-between h-36 ${
                cat.is_active === 0 ? 'opacity-65' : ''
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <h2 className="text-sm font-bold text-ink truncate max-w-[150px]">
                    {cat.name}
                  </h2>
                  <span className="bg-line text-muted text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                    Sort: {cat.sort_order}
                  </span>
                </div>
                
                <p className="text-[10px] text-muted font-bold tracking-wide uppercase mt-2">
                  💼 {cat.item_count} Item{cat.item_count !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-line/40">
                <span className="text-[9px] font-bold tracking-wider uppercase">
                  {cat.is_active === 1 ? '🟢 Active' : '🔴 Inactive'}
                </span>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 hover:bg-canvas text-saffron-600 rounded-lg text-xs font-bold transition-all border border-line"
                    title="Edit category"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg text-xs font-bold transition-all border border-line"
                    title="Delete category"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD CATEGORY MODAL ── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsAddOpen(false)} className="absolute inset-0 bg-ink/40" />

          <div className="bg-surface rounded-2xl shadow-xl border border-line w-full max-w-sm p-6 relative z-10 space-y-5 animate-slide-up">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h2 className="text-base font-bold text-ink flex items-center gap-1">
                <span>➕</span> Add Menu Category
              </h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-ghost hover:text-muted text-lg font-black"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 border border-red-100 text-xs font-semibold p-3 rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label htmlFor="cat-name" className="block text-xs font-bold text-ink mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Desserts, Pizza, Main Course"
                  className="w-full border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron-500 bg-canvas transition-colors"
                />
              </div>

              <div>
                <label htmlFor="cat-sort" className="block text-xs font-bold text-ink mb-1">
                  Sort Order
                </label>
                <input
                  id="cat-sort"
                  type="number"
                  required
                  value={addSortOrder}
                  onChange={(e) => setAddSortOrder(e.target.value)}
                  placeholder="e.g. 0, 1, 2"
                  className="w-full border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron-500 bg-canvas transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 bg-line hover:bg-line/80 active:scale-[0.98] text-muted text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-saffron-500 hover:bg-saffron-600 active:scale-[0.98] text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT CATEGORY MODAL ── */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsEditOpen(false)} className="absolute inset-0 bg-ink/40" />

          <div className="bg-surface rounded-2xl shadow-xl border border-line w-full max-w-sm p-6 relative z-10 space-y-5 animate-slide-up">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h2 className="text-base font-bold text-ink flex items-center gap-1">
                <span>✏️</span> Edit Menu Category
              </h2>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-ghost hover:text-muted text-lg font-black"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 border border-red-100 text-xs font-semibold p-3 rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditCategory} className="space-y-4">
              <div>
                <label htmlFor="edit-cat-name" className="block text-xs font-bold text-ink mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-cat-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron-500 bg-canvas transition-colors"
                />
              </div>

              <div>
                <label htmlFor="edit-cat-sort" className="block text-xs font-bold text-ink mb-1">
                  Sort Order
                </label>
                <input
                  id="edit-cat-sort"
                  type="number"
                  required
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(e.target.value)}
                  className="w-full border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron-500 bg-canvas transition-colors"
                />
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between bg-canvas border border-line rounded-xl p-3">
                <div>
                  <span className="block text-xs font-bold text-ink">Status</span>
                  <span className="text-[10px] text-muted">Toggle category visibility for customers</span>
                </div>

                <button
                  type="button"
                  onClick={() => setEditIsActive(!editIsActive)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    editIsActive ? 'bg-veg' : 'bg-ghost'
                  }`}
                  role="switch"
                  aria-checked={editIsActive}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      editIsActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 bg-line hover:bg-line/80 active:scale-[0.98] text-muted text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-saffron-500 hover:bg-saffron-600 active:scale-[0.98] text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETION FOREIGN-KEY WARNING MODAL ── */}
      {deletionWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setDeletionWarning(null)} className="absolute inset-0 bg-ink/40" />

          <div className="bg-surface rounded-2xl shadow-xl border border-line w-full max-w-sm p-6 relative z-10 text-center space-y-4 animate-slide-up">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Cannot Delete Category</h2>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                The category **"{deletionWarning.name}"** currently contains **{deletionWarning.count} menu item{deletionWarning.count !== 1 ? 's' : ''}**.
              </p>
              <p className="text-[10px] text-red-500 font-semibold mt-3 bg-red-50 border border-red-100 p-2.5 rounded-xl">
                Please reassign or delete these items in the **Menu Manager** first before deleting the category.
              </p>
            </div>

            <button
              onClick={() => setDeletionWarning(null)}
              className="w-full bg-ink hover:bg-ink/90 active:scale-[0.98] text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm"
            >
              Okay, I understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
