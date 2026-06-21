import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useMenu } from '../hooks/useMenu';
import { placeOrder } from '../api/order';
import { VegDot } from '../components/VegDot';

export function CheckoutPage() {
  const { cafeSlug } = useParams<{ cafeSlug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cart, totalAmount, clearCart, addItem, removeItem, isShared } = useCart();
  const { cafe, isLoading } = useMenu(cafeSlug);

  const [tableNumber, setTableNumber] = useState(cart.tableNumber || searchParams.get('table') || '');
  const isTablePrefilled = !!(cart.tableNumber || searchParams.get('table'));
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: number;
    tableNumber: string;
    totalAmount: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeSlug) return;
    if (!tableNumber.trim()) {
      setErrorMessage('Please enter your table number.');
      return;
    }
    if (cart.items.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        cafe_slug: cafeSlug,
        table_number: tableNumber.trim(),
        items: cart.items.map(i => ({
          item_id: i.item_id,
          quantity: i.quantity,
        })),
        customer_note: customerNote.trim() || undefined,
      };

      const response = await placeOrder(payload);
      setOrderSuccess({
        orderId: response.order_id,
        tableNumber: response.table_number,
        totalAmount: response.total_amount,
      });
      clearCart();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col justify-between">
        {/* Success Header */}
        <header className="bg-surface border-b border-line px-4 py-4 flex items-center justify-center sticky top-0 z-40">
          <h1 className="font-semibold text-ink text-base">Order Sent!</h1>
        </header>

        {/* Success Card */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="bg-white p-6 rounded-lg shadow-card w-full max-w-md text-center border border-line">
            {/* Success Circle */}
            <div className="w-16 h-16 rounded-full bg-saffron-100 flex items-center justify-center mx-auto mb-6 text-saffron-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-ink mb-2">Sent to Kitchen!</h2>
            <p className="text-sm text-muted mb-6">
              Your order is sent to the kitchen. Sit back and relax while we brew it.
            </p>

            {/* Details */}
            <div className="bg-canvas rounded-lg p-4 text-left border border-line mb-6 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Order ID</span>
                <span className="font-bold text-ink">#{orderSuccess.orderId}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Table Number</span>
                <span className="font-bold text-ink">{orderSuccess.tableNumber.replace(/tbale/i, 'Table')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Total Amount</span>
                <span className="font-bold text-ink">₹{orderSuccess.totalAmount.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Status</span>
                <span className="px-2.5 py-0.5 rounded-full bg-saffron-100 text-saffron-600 font-medium text-xs">
                  Sending to Kitchen
                </span>
              </div>
            </div>

            <p className="text-xs text-ghost leading-relaxed mb-2">
              Stay at your table, we'll bring your order right over.
            </p>
          </div>
        </main>

        {/* Action Button */}
        <div className="px-4 py-6 bg-surface border-t border-line">
          <button
            onClick={() => navigate(`/menu/${cafeSlug}`)}
            className="w-full bg-ink text-white font-semibold rounded-lg py-3.5 shadow-card hover:bg-ink/90 active:scale-[0.98] transition-all"
          >
            Go back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-line px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(`/menu/${cafeSlug}`)}
          className="text-ink hover:text-saffron-600 flex items-center gap-1 text-sm font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Menu
        </button>
        <h1 className="font-semibold text-ink text-base">Checkout</h1>
        <div className="w-12"></div> {/* Spacer to center title */}
      </header>

      {/* Main Form Content */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-5 space-y-6">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-line rounded w-1/3" />
            <div className="h-32 bg-line rounded-lg" />
            <div className="h-40 bg-line rounded-lg" />
          </div>
        ) : (
          <>
            {/* Cafe Info Header */}
            <div>
              <h2 className="text-lg font-bold text-ink">{cafe?.name}</h2>
              {cafe?.address && <p className="text-xs text-muted mt-0.5">{cafe.address}</p>}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-lg text-xs font-medium border border-red-100">
                {errorMessage}
              </div>
            )}

            {/* Order Items List */}
            <div className="bg-white rounded-lg p-4 shadow-card border border-line space-y-4">
              <h3 className="text-sm font-bold text-ink border-b border-line pb-2">Your Order Summary</h3>
              {cart.items.length === 0 ? (
                <p className="text-xs text-muted py-4 text-center">Your cart is empty.</p>
              ) : (
                <div className="divide-y divide-line">
                  {cart.items.map(item => (
                    <div key={item.item_id} className="py-3 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5"><VegDot isVeg={item.is_veg === 1} /></span>
                        <div>
                          <h4 className="text-sm font-semibold text-ink leading-tight">{item.name}</h4>
                          <span className="text-xs text-muted">₹{item.price} each</span>
                        </div>
                      </div>
                      
                      {/* Quantity Selector / Display */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-line rounded-lg overflow-hidden bg-canvas">
                          <button
                            onClick={() => removeItem(item.item_id)}
                            className="px-2 py-1 text-muted hover:bg-line active:bg-line/80 font-semibold text-sm transition-colors"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-bold text-ink min-w-[1.25rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => addItem(cafeSlug ?? '', { id: item.item_id, name: item.name, price: item.price, is_veg: item.is_veg, category_id: 0, description: null, sort_order: 0, image_url: null })}
                            className="px-2 py-1 text-muted hover:bg-line active:bg-line/80 font-semibold text-sm transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-ink w-14 text-right">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Table & Notes Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Table Number Field */}
              <div className="bg-white rounded-lg p-4 shadow-card border border-line space-y-3">
                <div>
                  <label htmlFor="table-number" className="block text-sm font-bold text-ink mb-1">
                    Table Stand Number <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-muted mb-2">
                    Enter the number on your table stand or barcode.
                  </p>
                </div>
                <input
                  id="table-number"
                  type="text"
                  required
                  readOnly={isTablePrefilled}
                  placeholder="e.g. Table 4, Counter, Bar"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  className={`w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none transition-colors ${
                    isTablePrefilled
                      ? 'bg-line/60 border-line text-muted cursor-not-allowed opacity-80'
                      : 'bg-canvas border-line focus:border-saffron-500'
                  }`}
                />
              </div>

              {/* Special Instructions Field */}
              <div className="bg-white rounded-lg p-4 shadow-card border border-line space-y-3">
                <label htmlFor="customer-note" className="block text-sm font-bold text-ink">
                  Special Instructions
                </label>
                <textarea
                  id="customer-note"
                  rows={2}
                  placeholder="e.g. Less spicy, extra hot chai, serve cold drinks first"
                  value={customerNote}
                  onChange={e => setCustomerNote(e.target.value)}
                  className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-saffron-500 bg-canvas transition-colors resize-none"
                />
              </div>
            </form>
          </>
        )}
      </main>

      {/* Sticky Bottom Actions */}
      <div className="bg-surface border-t border-line p-4 sticky bottom-0 z-40">
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex justify-between items-center text-sm px-1">
            <span className="text-muted font-medium">To Pay</span>
            <span className="text-lg font-bold text-ink">₹{totalAmount.toFixed(0)}</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || cart.items.length === 0}
            className="w-full bg-ink text-white font-semibold rounded-lg py-3.5 shadow-card hover:bg-ink/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending to kitchen...
              </>
            ) : (
              isShared 
                ? `Send table's order to kitchen (₹${totalAmount.toFixed(0)})` 
                : `Send order to kitchen (₹${totalAmount.toFixed(0)})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
