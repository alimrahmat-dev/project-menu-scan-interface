import { useState } from 'react'
import { Clock, Flame, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '../context/cart'
import { formatCurrency } from '../lib/format'
import MenuImage from './MenuImage'
import Modal from './Modal'

export default function MenuDetailModal({ menu, open, onClose }) {
  const { items, addItem, removeItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const existing = items.find((item) => item.menu.id === menu?.id)

  if (!menu) return null

  const handleAdd = () => {
    addItem(menu, quantity, notes.trim())
    onClose?.()
  }

  return (
    <Modal open={open} onClose={onClose} title="Detail menu" size="lg" bodyClassName="p-0">
      <div className="relative aspect-[16/9] overflow-hidden bg-cream-dark">
        <MenuImage src={menu.image_url} alt={menu.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-cream">
          {menu.badge && (
            <span className="mb-2 inline-block rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
              {menu.badge}
            </span>
          )}
          <h2 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
            {menu.name}
          </h2>
          <p className="mt-1 font-display text-xl font-semibold text-cream/90">
            {formatCurrency(menu.price)}
          </p>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="chip bg-cream-dark text-ink-soft">
            <Flame className="size-3.5 text-brand" /> {menu.calories || '-'} kkal
          </span>
          <span className="chip bg-cream-dark text-ink-soft">
            <Clock className="size-3.5 text-brand" /> Siap dalam {menu.prep_time} menit
          </span>
          {menu.category?.name && (
            <span className="chip bg-brand-soft text-brand">{menu.category.name}</span>
          )}
        </div>

        <p className="text-sm leading-relaxed text-ink-soft">{menu.description}</p>

        {existing && (
          <div className="flex items-center justify-between rounded-2xl bg-leaf-soft px-4 py-3 text-xs font-semibold text-leaf">
            <span>{existing.quantity} porsi sudah ada di pesanan</span>
            <button
              type="button"
              onClick={() => {
                removeItem(menu.id)
                onClose?.()
              }}
              className="inline-flex items-center gap-1 text-red-600 hover:underline"
            >
              <Trash2 className="size-3.5" /> Hapus
            </button>
          </div>
        )}

        <div>
          <label htmlFor="menu-notes" className="label">
            Catatan untuk dapur (opsional)
          </label>
          <textarea
            id="menu-notes"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={200}
            placeholder="Contoh: tidak pedas, tanpa bawang, telur setengah matang..."
            className="field resize-none"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-ink-soft">Jumlah</span>
            <div className="inline-flex items-center gap-3 rounded-full border border-ink/10 bg-cream/70 p-1">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                className="grid size-9 place-items-center rounded-full bg-white shadow-sm transition hover:bg-cream-dark"
                aria-label="Kurangi"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-5 text-center font-bold tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.min(20, current + 1))}
                className="grid size-9 place-items-center rounded-full bg-ink text-cream transition hover:bg-brand"
                aria-label="Tambah"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!menu.is_available}
            className="btn-brand flex-1 sm:flex-none"
          >
            <ShoppingBag className="size-4" />
            Tambah · {formatCurrency(menu.price * quantity)}
          </button>
        </div>
      </div>
    </Modal>
  )
}
