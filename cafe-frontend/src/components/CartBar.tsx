import { useCart } from '../context/CartContext';

/*
  CartBar slides up from the bottom when the cart has items.
  Leaves room at the very bottom for iOS home indicator (pb-safe).
  This is the user's primary CTA to proceed to checkout — Week 3's job.
*/
interface CartBarProps {
  onCheckout: () => void;
}

export function CartBar({ onCheckout }: CartBarProps) {
  const { totalItems, totalAmount } = useCart();

  if (totalItems === 0) return null;

  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-50
        px-4 pb-6 pt-3
        bg-transparent pointer-events-none
      "
    >
      <button
        onClick={onCheckout}
        className="
          w-full flex items-center justify-between
          bg-ink text-white rounded-xl px-4 py-3.5
          shadow-cart pointer-events-auto
          active:scale-[0.98] transition-transform duration-100
        "
        aria-live="polite"
        aria-label={`View cart — ${totalItems} item${totalItems > 1 ? 's' : ''}, ₹${totalAmount.toFixed(0)} total`}
      >
        <span className="flex items-center gap-2">
          {/* Cart item count badge */}
          <span className="bg-saffron-500 text-white text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center">
            {totalItems}
          </span>
          <span className="text-sm font-medium">
            {totalItems} item{totalItems > 1 ? 's' : ''} added
          </span>
        </span>

        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold">₹{totalAmount.toFixed(0)}</span>
          <span className="text-sm text-white/70">→ View Cart</span>
        </span>
      </button>
    </div>
  );
}
