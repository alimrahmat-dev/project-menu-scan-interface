import { Clock, Flame, Plus } from 'lucide-react'
import { formatCurrency } from '../lib/format'
import MenuImage from './MenuImage'
import QuantityStepper from './QuantityStepper'
import { useCart } from '../context/cart'

export default function MenuCard({ menu, onOpen, index = 0 }) {
  const { items, addItem, setQuantity } = useCart()
  const cartItem = items.find((item) => item.menu.id === menu.id)
  const quantity = cartItem?.quantity || 0

  return (
    <article
      className="group flex animate-fade-up flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_20px_45px_-35px_rgba(33,27,22,0.5)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-35px_rgba(33,27,22,0.5)]"
      style={{ animationDelay: `${Math.min(index * 45, 300)}ms` }}
    >
      <button
        type="button"
        onClick={() => onOpen?.(menu)}
        className="relative block aspect-[4/3] w-full overflow-hidden text-left"
        aria-label={`Lihat detail ${menu.name}`}
      >
        <MenuImage
          src={menu.image_url}
          alt={menu.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent opacity-70" />
        {menu.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand shadow-sm backdrop-blur">
            {menu.badge}
          </span>
        )}
        {!menu.is_available && (
          <span className="absolute inset-0 grid place-items-center bg-ink/55 text-xs font-bold uppercase tracking-widest text-cream backdrop-blur-[2px]">
            Habis
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-4">
        <button type="button" onClick={() => onOpen?.(menu)} className="text-left">
          <h3 className="line-clamp-1 font-display text-[17px] font-semibold leading-tight text-ink">
            {menu.name}
          </h3>
        </button>
        <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-relaxed text-ink-soft">
          {menu.description}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
          {menu.calories ? (
            <span className="inline-flex items-center gap-1">
              <Flame className="size-3 text-brand" /> {menu.calories} kkal
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3 text-brand" /> {menu.prep_time} mnt
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <p className="font-display text-lg font-semibold text-ink">
            {formatCurrency(menu.price)}
          </p>

          {quantity > 0 ? (
            <QuantityStepper
              value={quantity}
              onChange={(next) => setQuantity(menu.id, next)}
              size="sm"
              min={0}
            />
          ) : (
            <button
              type="button"
              disabled={!menu.is_available}
              onClick={() => addItem(menu)}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-cream transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="size-3.5" /> Tambah
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
