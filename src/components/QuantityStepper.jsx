import { Minus, Plus } from 'lucide-react'

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  size = 'md',
  disabled = false,
}) {
  const isSmall = size === 'sm'
  const buttonClass = isSmall ? 'size-7' : 'size-9'
  const iconClass = isSmall ? 'size-3.5' : 'size-4'

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-ink/10 bg-cream/70 p-1 ${disabled ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`grid ${buttonClass} place-items-center rounded-full bg-white text-ink shadow-sm transition hover:bg-brand hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-ink`}
        aria-label="Kurangi jumlah"
      >
        <Minus className={iconClass} />
      </button>
      <span
        className={`min-w-6 text-center font-bold tabular-nums ${isSmall ? 'text-xs' : 'text-sm'}`}
      >
        {value}
      </span>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={`grid ${buttonClass} place-items-center rounded-full bg-ink text-cream shadow-sm transition hover:bg-brand disabled:opacity-40`}
        aria-label="Tambah jumlah"
      >
        <Plus className={iconClass} />
      </button>
    </div>
  )
}
