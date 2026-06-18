import { useEffect, useState } from 'react';
import type { MenuItem } from '../types';
import { VegDot } from './VegDot';

interface DishExperienceModalProps {
  item: MenuItem;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  onClose: () => void;
}

export function DishExperienceModal({
  item,
  qty,
  onAdd,
  onRemove,
  onClose,
}: DishExperienceModalProps) {
  const [animate, setAnimate] = useState(false);

  // Trigger slide-up transition on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setAnimate(false);
    setTimeout(onClose, 250); // wait for slide-down animation
  };

  // Ingredient Map resolution
  const getIngredients = (): string[] => {
    if (item.ingredients && item.ingredients.length > 0) {
      return item.ingredients;
    }
    if (!item.description) {
      return [item.name];
    }
    
    // Dynamic parse fallback
    const desc = item.description.toLowerCase();
    const cleanList = desc
      .replace(/\b(classic|fresh|delicious|house|special|signature|authentic|served with|with|and|or|made of|topped with|a blend of)\b/g, '')
      .split(/,|\s+and\s+|\s+with\s+/)
      .map(segment => segment.trim())
      .filter(segment => segment.length > 2)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1));
      
    return cleanList.length > 0 ? cleanList : [item.name];
  };

  const ingredientsList = getIngredients();
  const has3dModel = !!item['3d_model_url'];

  return (
    <div
      className={`fixed inset-0 bg-ink/65 backdrop-blur-md z-50 flex items-end sm:items-center justify-center transition-opacity duration-300 p-0 sm:p-4 ${
        animate ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative w-full sm:max-w-md bg-surface rounded-t-[2rem] sm:rounded-3xl overflow-hidden shadow-2xl border-t sm:border border-line max-h-[92vh] sm:max-h-[85vh] flex flex-col transition-transform duration-300 ease-out transform ${
          animate ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-10 sm:scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-full flex justify-center py-2 sm:hidden cursor-pointer" onClick={handleClose}>
          <div className="w-12 h-1 bg-line rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 sm:top-5 sm:right-5 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-ink/75 hover:bg-ink text-white text-xl font-bold transition-all shadow-md active:scale-90"
          title="Close modal"
        >
          ×
        </button>

        {/* ── UPPER MEDIA FRAME ── */}
        <div className="relative w-full aspect-[4/3] bg-[#F8F6F4] overflow-hidden border-b border-line/45 flex items-center justify-center select-none">
          {has3dModel ? (
            <model-viewer
              src={item['3d_model_url']}
              alt={`3D model of ${item.name}`}
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              auto-rotate
              poster={item.image_url ?? undefined}
              shadow-intensity="1"
              style={{ width: '100%', height: '100%', outline: 'none' }}
            />
          ) : item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-7xl">
              {item.is_veg === 1 ? '🥗' : '🍗'}
            </div>
          )}

          {/* 3D Indicator Badge */}
          {has3dModel && (
            <div className="absolute left-4 bottom-4 bg-saffron-500/90 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-sm">
              <span className="animate-pulse">🥽</span> 3D & AR Active
            </div>
          )}
        </div>

        {/* ── LOWER INFORMATION PANEL ── */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-hide">
          {/* Title and Badge Header */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <VegDot isVeg={item.is_veg === 1} size="md" />
                <span className="text-[10px] font-black uppercase tracking-wider text-muted">
                  {item.is_veg === 1 ? 'Pure Veg' : 'Non Veg'}
                </span>
              </div>
              <h2 className="text-lg font-black text-ink leading-tight">{item.name}</h2>
            </div>
            
            <div className="text-right">
              <span className="text-lg font-extrabold text-saffron-600 block">₹{item.price}</span>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-ink tracking-wide uppercase">Description</h3>
              <p className="text-xs text-muted leading-relaxed font-medium">
                {item.description}
              </p>
            </div>
          )}

          {/* Ingredient Map */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-ink tracking-wide uppercase flex items-center gap-1.5">
              <span>🌾</span> Ingredient Map
            </h3>
            <div className="flex flex-wrap gap-2">
              {ingredientsList.map((ingredient, index) => (
                <span
                  key={index}
                  className="bg-saffron-50 border border-saffron-100/50 text-saffron-800 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all hover:bg-saffron-100/40"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── ACTION FOOTER / ADD TO ORDER ── */}
        <div className="p-5 bg-surface border-t border-line/45 flex items-center justify-between gap-4 sticky bottom-0 z-10">
          <div>
            <p className="text-[9px] font-black uppercase text-muted tracking-wider">Item Total</p>
            <p className="text-base font-extrabold text-ink">₹{item.price * (qty || 1)}</p>
          </div>

          {qty === 0 ? (
            <button
              onClick={() => {
                onAdd();
                setAnimate(false);
                setTimeout(onClose, 250); // Close drawer after adding
              }}
              className="px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <span>+</span> Add to Order
            </button>
          ) : (
            <div className="flex items-center bg-saffron-500 rounded-xl overflow-hidden shadow-md">
              <button
                onClick={onRemove}
                className="w-10 h-10 flex items-center justify-center text-white text-lg font-bold hover:bg-saffron-600 active:scale-90 transition-all"
              >
                −
              </button>
              <span className="text-white text-sm font-bold min-w-[3ch] text-center px-1">
                {qty}
              </span>
              <button
                onClick={onAdd}
                className="w-10 h-10 flex items-center justify-center text-white text-lg font-bold hover:bg-saffron-600 active:scale-90 transition-all"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
