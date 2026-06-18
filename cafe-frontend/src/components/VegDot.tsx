/*
  VegDot — the FSSAI-mandated green/red dot indicator every Indian
  food product and menu must carry. Square border with filled circle inside.
  Immediately recognizable to every Indian customer.
*/
interface VegDotProps {
  isVeg: boolean;
  size?: 'sm' | 'md';
}

export function VegDot({ isVeg, size = 'sm' }: VegDotProps) {
  const box  = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const dot  = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const color = isVeg ? 'border-veg' : 'border-nonveg';
  const fill  = isVeg ? 'bg-veg'     : 'bg-nonveg';

  return (
    <span
      className={`inline-flex items-center justify-center border-2 rounded-sm ${box} ${color} flex-shrink-0`}
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      role="img"
    >
      <span className={`rounded-full ${dot} ${fill}`} />
    </span>
  );
}
