import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';

interface MoodEntryProps {
  cafeSlug: string;
  onSelect: (keywords: string[] | null, label: string | null) => void;
}

export function MoodEntry({ cafeSlug, onSelect }: MoodEntryProps) {
  const { cart, isShared, sessionId } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const tableNumber = cart.tableNumber || '';
  const sessionKey = `mood_entry_completed_${cafeSlug}_${tableNumber}_${sessionId ?? 'local'}`;

  useEffect(() => {
    // Check if user has already made a selection or skipped in this session
    const isCompleted = sessionStorage.getItem(sessionKey);
    if (!isCompleted) {
      setIsOpen(true);
    }
  }, [sessionKey]);

  const handleSelect = (keywords: string[] | null, label: string | null) => {
    sessionStorage.setItem(sessionKey, 'true');
    setIsOpen(false);
    onSelect(keywords, label);
  };

  if (!isOpen) return null;

  const options = [
    {
      label: 'Hot drinks',
      description: 'Warm brews, freshly made chai, and rich hot coffees',
      keywords: ['hot', 'coffee', 'tea'],
    },
    {
      label: 'Cold drinks',
      description: 'Chilled frappes, refreshing mocktails, and thick milkshakes',
      keywords: ['cold', 'cooler', 'shake', 'frappe'],
    },
    {
      label: 'Something to eat',
      description: 'Grated cheese toasts, crispy snacks, and gourmet sandwiches',
      keywords: ['sandwich', 'bread', 'pizza', 'sides', 'oven', 'snack'],
    },
    {
      label: 'Show me everything',
      description: 'Explore the full range of food and beverages',
      keywords: null,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      {/* Subtle paper-grain texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-10 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative w-full max-w-md bg-canvas rounded-lg shadow-2xl border border-line/30 p-6 sm:p-8 animate-slide-up z-20">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-[10px] uppercase tracking-widest text-saffron-600 font-bold mb-1">
            {isShared ? `Table ${tableNumber}` : 'Welcome'}
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-ink font-serif leading-tight">
            What are you feeling today?
          </h2>
        </div>

        {/* Options list */}
        <div className="space-y-4">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.keywords, opt.keywords ? opt.label : null)}
              className="w-full text-left bg-white border border-line/40 hover:border-saffron-400 hover:shadow-card-featured active:scale-[0.98] transition-all p-4 rounded-lg flex flex-col justify-center"
            >
              <span className="text-sm font-extrabold text-ink block mb-0.5">
                {opt.label}
              </span>
              <span className="text-xs text-muted leading-normal font-medium">
                {opt.description}
              </span>
            </button>
          ))}
        </div>

        {/* Skip button */}
        <div className="text-center mt-6">
          <button
            onClick={() => handleSelect(null, null)}
            className="text-xs font-bold text-muted hover:text-ink underline transition-colors"
          >
            Skip — see full menu
          </button>
        </div>
      </div>
    </div>
  );
}
