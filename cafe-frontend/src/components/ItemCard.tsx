import { VegDot } from './VegDot';
import { useCart } from '../context/CartContext';
import type { MenuItem } from '../types';

interface ItemCardProps {
  item: MenuItem;
  cafeSlug: string;
  isFeatured?: boolean;
  categoryName?: string;
}

export function getFallbackImage(itemName: string, categoryName: string = ''): string {
  const name = itemName.toLowerCase();
  const cat = categoryName.toLowerCase();
  
  if (name.includes('chai') || name.includes('tea') || name.includes('brew')) {
    if (name.includes('cold') || name.includes('iced')) {
      return 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&h=400&fit=crop&q=80'; // Cold coffee/tea
    }
    return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&h=400&fit=crop&q=80'; // Warm chai
  }
  if (name.includes('coffee') || name.includes('espresso') || name.includes('cappuccino') || name.includes('latte') || name.includes('mocha') || name.includes('americano') || name.includes('macchiato')) {
    if (name.includes('cold') || name.includes('iced') || name.includes('frappe')) {
      return 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&h=400&fit=crop&q=80'; // Cold coffee
    }
    return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&h=400&fit=crop&q=80'; // Hot coffee
  }
  if (name.includes('sandwich') || name.includes('toast') || name.includes('bread') || cat.includes('sandwich') || cat.includes('bread')) {
    return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop&q=80'; // Grilled sandwich
  }
  if (name.includes('pizza') || cat.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop&q=80'; // Pizza (sandwich link)
  }
  if (name.includes('fries') || name.includes('wedges') || name.includes('nachos') || name.includes('banana') || cat.includes('sides')) {
    return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop&q=80'; // Samosa / sides
  }
  if (name.includes('brownie') || name.includes('pie') || name.includes('roll') || name.includes('cake') || cat.includes('oven')) {
    return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop&q=80'; // Sweet/samosa fallback
  }
  if (name.includes('shake') || name.includes('smoothie')) {
    return 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&h=400&fit=crop&q=80'; // Cold drink/shake
  }
  if (name.includes('cooler') || name.includes('mocktail') || name.includes('lemon') || name.includes('ale') || name.includes('soda') || name.includes('red bull')) {
    return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=400&fit=crop&q=80'; // Coolers
  }
  return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop&q=80'; // Samosa generic fallback
}

export function ItemCard({ item, cafeSlug, isFeatured = false, categoryName = '' }: ItemCardProps) {
  const { addItem, removeItem, getQuantity } = useCart();
  const quantity = getQuantity(item.id);

  const handleAdd = () => addItem(cafeSlug, item);
  const handleRemove = () => removeItem(item.id);

  const displayImage = item.image_url || getFallbackImage(item.name, categoryName);

  if (isFeatured) {
    return (
      <article className="flex flex-col gap-3.5 bg-surface rounded-lg p-4 shadow-card-featured border border-line/25 w-full">
        {/* Photo Container */}
        <div className="relative w-full h-48 rounded-md overflow-hidden bg-saffron-50 border border-line/10">
          <img
            src={displayImage}
            alt={item.name}
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(1.1) contrast(1.05) sepia(0.08)' }}
            loading="lazy"
          />
        </div>

        {/* Content Container */}
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
          </div>

          <div className="flex items-center justify-between mt-3.5 pt-1">
            <span className="text-base font-bold text-saffron-600">
              ₹{item.price}
            </span>

            {quantity === 0 ? (
              <button
                onClick={handleAdd}
                className="
                  flex items-center gap-1 px-4 py-1.5 rounded-full border-2 border-saffron-500
                  text-saffron-600 text-sm font-semibold
                  active:scale-95 transition-transform duration-75
                "
                aria-label={`Add ${item.name} to cart`}
              >
                <span className="text-base leading-none">+</span> Add
              </button>
            ) : (
              <div
                className="flex items-center bg-saffron-500 rounded-full overflow-hidden shadow-sm"
                role="group"
                aria-label={`${item.name} quantity`}
              >
                <button
                  onClick={handleRemove}
                  className="w-8 h-8 flex items-center justify-center text-white text-base font-bold hover:bg-saffron-600 active:scale-90 transition-all duration-75"
                  aria-label="Remove one"
                >
                  −
                </button>
                <span className="text-white text-xs font-bold min-w-[2ch] text-center px-1">
                  {quantity}
                </span>
                <button
                  onClick={handleAdd}
                  className="w-8 h-8 flex items-center justify-center text-white text-base font-bold hover:bg-saffron-600 active:scale-90 transition-all duration-75"
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

  // Standard Compact Card Layout
  return (
    <article className="flex gap-3 bg-surface rounded-lg p-3 shadow-card border border-line/10">
      {/* Photo Container */}
      <div className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden bg-saffron-50 border border-line/10">
        <img
          src={displayImage}
          alt={item.name}
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(1.1) contrast(1.05) sepia(0.08)' }}
          loading="lazy"
        />
      </div>

      {/* Content Container */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start gap-2 mb-0.5">
            <VegDot isVeg={item.is_veg === 1} />
            <h3 className="text-sm font-semibold text-ink leading-snug line-clamp-2">
              {item.name}
            </h3>
          </div>
          {item.description && (
            <p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed font-medium">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-saffron-600 font-sans font-semibold">
            ₹{item.price}
          </span>

          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="
                flex items-center gap-1 px-3.5 py-1 rounded-full border-2 border-saffron-500
                text-saffron-600 text-xs font-bold
                active:scale-95 transition-transform duration-75
              "
              aria-label={`Add ${item.name} to cart`}
            >
              <span className="text-sm leading-none">+</span> Add
            </button>
          ) : (
            <div
              className="flex items-center bg-saffron-500 rounded-full overflow-hidden shadow-sm"
              role="group"
              aria-label={`${item.name} quantity`}
            >
              <button
                onClick={handleRemove}
                className="w-7 h-7 flex items-center justify-center text-white text-sm font-bold hover:bg-saffron-600 active:scale-90 transition-all duration-75"
                aria-label="Remove one"
              >
                −
              </button>
              <span className="text-white text-xs font-bold min-w-[1ch] text-center">
                {quantity}
              </span>
              <button
                onClick={handleAdd}
                className="w-7 h-7 flex items-center justify-center text-white text-sm font-bold hover:bg-saffron-600 active:scale-90 transition-all duration-75"
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
