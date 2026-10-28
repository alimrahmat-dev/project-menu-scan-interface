import { ArrowRight, ShoppingBag, Trash2, UtensilsCrossed } from 'lucide-react'
import { useCart } from '../context/cart'
import { formatCurrency } from '../lib/format'
import MenuImage from './MenuImage'
import QuantityStepper from './QuantityStepper'

export default function CartPanel({ onCheckout, onClose, className = '' }) {
  const { table, items, subtotal, tax, service, total, itemCount, setQuantity, removeItem, taxPercent, servicePercent } =
    useCart()

  return (
    <div className={`card flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
            <ShoppingBag className="size-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold leading-tight">Pesanan Anda</h2>
            <p className="text-[11px] text-ink-soft">
              {itemCount > 0 ? `${itemCount} item · ${table?.name || 'Meja belum dipilih'}` : 'Belum ada item'}
            </p>
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-xs font-semibold text-ink-soft hover:text-ink">
            Tutup
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-cream-dark text-ink-soft">
            <UtensilsCrossed className="size-5" />
          </span>
          <p className="text-sm font-semibold">Keranjang masih kosong</p>
          <p className="mt-1 text-xs text-ink-soft">Pilih menu favorit Anda untuk mulai memesan.</p>
        </div>
      ) : (
        <div className="max-h-[46vh] flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {items.map((item) => (
            <div
              key={item.menu.id}
              className="group flex gap-3 rounded-2xl px-3 py-3 transition hover:bg-cream/70"
            >
              <MenuImage
                src={item.menu.image_url}
                alt={item.menu.name}
                className="size-16 shrink-0 rounded-xl object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-xs font-bold leading-snug text-ink">
                    {item.menu.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeItem(item.menu.id)}
                    className="shrink-0 rounded-full p-1 text-ink-soft/60 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Hapus ${item.menu.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                {item.notes && (
                  <p className="mt-0.5 line-clamp-1 text-[10px] italic text-ink-soft">
                    “{item.notes}”
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <span className="text-xs font-semibold text-ink-soft">
                    {formatCurrency(item.menu.price * item.quantity)}
                  </span>
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(next) => setQuantity(item.menu.id, next)}
                    size="sm"
                    min={0}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-ink/10 bg-cream/50 px-5 py-4">
        <dl className="space-y-1.5 text-xs">
          <div className="flex justify-between text-ink-soft">
            <dt>Subtotal</dt>
            <dd className="font-semibold text-ink">{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-ink-soft">
            <dt>Pajak ({taxPercent}%)</dt>
            <dd>{formatCurrency(tax)}</dd>
          </div>
          <div className="flex justify-between text-ink-soft">
            <dt>Biaya layanan ({servicePercent}%)</dt>
            <dd>{formatCurrency(service)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-ink/10 pt-2.5">
            <dt className="text-sm font-bold text-ink">Total</dt>
            <dd className="font-display text-xl font-semibold text-ink">{formatCurrency(total)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onCheckout}
          disabled={items.length === 0}
          className="btn-brand mt-4 w-full"
        >
          Lanjut ke Pembayaran
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
