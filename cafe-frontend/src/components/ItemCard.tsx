import { useState } from 'react';
import { VegDot } from './VegDot';
import { useCart } from '../context/CartContext';
import type { MenuItem } from '../types';

interface ItemCardProps {
  item: MenuItem;
  cafeSlug: string;
}

/*
  ItemCard design decisions:
  - Horizontal layout (image left, content right) — fits mobile width better
    than vertical cards and lets users scan more items without scrolling
  - Add button becomes an inline +/- stepper after first tap — no navigation away
  - Price in saffron accent — the visual anchor that draws the eye immediately
  - Sold-out state handled gracefully (is_available filtered by backend, but
    defensive styling here if ever shown)
*/
export function ItemCard({ item, cafeSlug }: ItemCardProps) {
  const { addItem, removeItem, getQuantity } = useCart();
  const quantity = getQuantity(item.id);
  const [imgError, setImgError] = useState(false);

  const handleAdd = () => addItem(cafeSlug, item);
  const handleRemove = () => removeItem(item.id);

  return (
    <article className="flex gap-3 bg-surface rounded-xl p-3 shadow-card">

      {/* ── Photo / Placeholder ── */}
      <div className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-saffron-50">
        {item.image_url && !imgError ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          /* Placeholder — saffron tint with food emoji as stand-in until photo is uploaded */
          <div className="w-full h-full flex items-center justify-center text-3xl select-none">
            {item.is_veg ? '🥗' : '🍗'}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">

        <div>
          {/* Veg dot + name row */}
          <div className="flex items-start gap-2 mb-0.5">
            <VegDot isVeg={item.is_veg === 1} />
            <h3 className="text-sm font-medium text-ink leading-snug line-clamp-2">
              {item.name}
            </h3>
          </div>

          {/* Description — only shown if present */}
          {item.description && (
            <p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* ── Price + Add control ── */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold text-saffron-600">
            ₹{item.price}
          </span>

          {quantity === 0 ? (
            /* Initial ADD button */
            <button
              onClick={handleAdd}
              className="
                flex items-center gap-1 px-3 py-1 rounded-lg border-2 border-saffron-500
                text-saffron-600 text-sm font-semibold
                active:scale-95 transition-transform duration-75
              "
              aria-label={`Add ${item.name} to cart`}
            >
              <span className="text-base leading-none">+</span> ADD
            </button>
          ) : (
            /* Inline quantity stepper — shown after first add */
            <div
              className="flex items-center gap-2 bg-saffron-500 rounded-lg px-1"
              role="group"
              aria-label={`${item.name} quantity`}
            >
              <button
                onClick={handleRemove}
                className="w-7 h-7 flex items-center justify-center text-white text-lg font-bold
                           active:scale-90 transition-transform duration-75"
                aria-label="Remove one"
              >
                −
              </button>
              <span className="text-white text-sm font-semibold min-w-[1ch] text-center">
                {quantity}
              </span>
              <button
                onClick={handleAdd}
                className="w-7 h-7 flex items-center justify-center text-white text-lg font-bold
                           active:scale-90 transition-transform duration-75"
                aria-label="Add one more"
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
