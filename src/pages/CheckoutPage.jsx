import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  ChefHat,
  Info,
  Landmark,
  Loader2,
  MapPin,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import MenuImage from '../components/MenuImage'
import { useCart } from '../context/cart'
import { useToast } from '../context/toast'
import { api, getErrorMessage } from '../lib/api'
import { formatCurrency } from '../lib/format'
import { PAYMENT_METHODS } from '../lib/status'

const METHOD_ICONS = {
  qris: QrCode,
  ewallet: Wallet,
  va: Landmark,
  cash: Banknote,
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const {
    table,
    items,
    subtotal,
    tax,
    service,
    total,
    taxPercent,
    servicePercent,
    clearItems,
  } = useCart()

  const [form, setForm] = useState({ customer_name: '', customer_phone: '', notes: '' })
  const [method, setMethod] = useState('qris')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.customer_name.trim()) {
      setErrors({ customer_name: 'Nama pemesan wajib diisi.' })
      return
    }

    setSubmitting(true)

    try {
      const { data } = await api.post('/orders', {
        table_token: table.qr_token,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim() || null,
        notes: form.notes.trim() || null,
        payment_method: method,
        items: items.map((item) => ({
          menu_id: item.menu.id,
          quantity: item.quantity,
          notes: item.notes || null,
        })),
      })

      const order = data.data
      const trackingToken = data.tracking_token

      clearItems()

      const paymentQuery = method === 'cash' ? 'cash=1' : 'pay=1'
      navigate(
        `/order/${order.order_number}?token=${trackingToken}&${paymentQuery}`,
        { replace: true },
      )
    } catch (error) {
      toast.error(getErrorMessage(error, 'Pesanan gagal dibuat. Silakan coba lagi.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!table || items.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <header className="border-b border-ink/5">
          <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="grid size-10 place-items-center rounded-xl bg-brand text-white">
                <ChefHat className="size-5" />
              </span>
              <span className="font-display text-lg font-semibold">Rasa Nusantara</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <EmptyState
            icon={ShoppingBag}
            title="Keranjang masih kosong"
            description="Pilih menu terlebih dahulu sebelum melanjutkan ke pembayaran."
            action={
              <Link to={table ? `/t/${table.qr_token}` : '/scan'} className="btn-brand">
                <UtensilsCrossed className="size-4" /> Lihat Menu
              </Link>
            }
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
          <Link to={table ? `/t/${table.qr_token}` : '/'} className="btn-ghost !px-2 sm:!px-4">
            <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Kembali ke menu</span>
            <span className="sm:hidden">Menu</span>
          </Link>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-ink-soft">
            <ShieldCheck className="size-4 text-leaf" /> Pembayaran aman
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="flex flex-col gap-2">
          <span className="section-eyebrow self-start">
            <ShoppingBag className="size-3.5" /> Konfirmasi pesanan
          </span>
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Hampir siap. Lengkapi data pesanan.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
            Pesanan akan langsung diteruskan ke dapur setelah Anda menyelesaikan pembayaran.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <section className="card p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
                  <MapPin className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-bold">Detail pemesan</h2>
                  <p className="text-[11px] text-ink-soft">Nama akan dipanggil saat pesanan diantar.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="customer_name" className="label">
                    Nama pemesan <span className="text-brand">*</span>
                  </label>
                  <input
                    id="customer_name"
                    type="text"
                    value={form.customer_name}
                    onChange={(event) => updateField('customer_name', event.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    maxLength={80}
                    autoComplete="name"
                    className={`field ${errors.customer_name ? '!border-red-400 !ring-red-100' : ''}`}
                    aria-invalid={Boolean(errors.customer_name)}
                  />
                  {errors.customer_name && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">{errors.customer_name}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="customer_phone" className="label">
                    Nomor WhatsApp <span className="font-medium normal-case tracking-normal text-ink-soft">(opsional)</span>
                  </label>
                  <input
                    id="customer_phone"
                    type="tel"
                    value={form.customer_phone}
                    onChange={(event) => updateField('customer_phone', event.target.value)}
                    placeholder="08xxxxxxxxxx"
                    maxLength={30}
                    autoComplete="tel"
                    className="field"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="order_notes" className="label">
                    Catatan untuk pesanan <span className="font-medium normal-case tracking-normal text-ink-soft">(opsional)</span>
                  </label>
                  <textarea
                    id="order_notes"
                    rows={2}
                    value={form.notes}
                    onChange={(event) => updateField('notes', event.target.value)}
                    maxLength={500}
                    placeholder="Contoh: alergi kacang, minta alat makan tambahan..."
                    className="field resize-none"
                  />
                </div>
              </div>
            </section>

            <section className="card p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Wallet className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-bold">Metode pembayaran</h2>
                  <p className="text-[11px] text-ink-soft">Pilih cara yang paling nyaman untuk Anda.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {PAYMENT_METHODS.map((paymentMethod) => {
                  const Icon = METHOD_ICONS[paymentMethod.icon] || Wallet
                  const selected = method === paymentMethod.id

                  return (
                    <button
                      key={paymentMethod.id}
                      type="button"
                      onClick={() => setMethod(paymentMethod.id)}
                      className={`relative flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                        selected
                          ? 'border-brand bg-brand-soft/70 ring-2 ring-brand/15'
                          : 'border-ink/10 bg-white hover:border-ink/25'
                      }`}
                    >
                      <span
                        className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                          selected ? 'bg-brand text-white' : 'bg-cream-dark text-ink-soft'
                        }`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{paymentMethod.label}</span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-soft">
                          {paymentMethod.description}
                        </span>
                      </span>
                      <span
                        className={`mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                          selected ? 'border-brand bg-brand' : 'border-ink/20'
                        }`}
                      >
                        {selected && <span className="size-2 rounded-full bg-white" />}
                      </span>
                    </button>
                  )
                })}
              </div>

              {method === 'cash' && (
                <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-[11px] leading-relaxed text-amber-900">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  Pembayaran tunai dilakukan di kasir. Pesanan tetap dibuat dan akan
                  dikonfirmasi oleh staf setelah pembayaran diterima.
                </div>
              )}

              {method !== 'cash' && (
                <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-leaf-soft p-3.5 text-[11px] leading-relaxed text-leaf">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  Anda akan diarahkan ke halaman pembayaran yang aman setelah pesanan dibuat.
                </div>
              )}
            </section>
          </div>

          <aside>
            <div className="card sticky top-24 overflow-hidden">
              <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
                <div>
                  <h2 className="font-display text-base font-semibold">Ringkasan pesanan</h2>
                  <p className="text-[11px] text-ink-soft">
                    {table.name} · {table.capacity} kursi
                  </p>
                </div>
                <Link
                  to={`/t/${table.qr_token}`}
                  className="text-[11px] font-semibold text-brand hover:underline"
                >
                  Ubah
                </Link>
              </div>

              <div className="max-h-64 space-y-3 overflow-y-auto px-5 py-4">
                {items.map((item) => (
                  <div key={item.menu.id} className="flex gap-3">
                    <MenuImage
                      src={item.menu.image_url}
                      alt={item.menu.name}
                      className="size-12 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-bold">{item.menu.name}</p>
                      <p className="text-[10px] text-ink-soft">
                        {item.quantity} × {formatCurrency(item.menu.price)}
                      </p>
                      {item.notes && (
                        <p className="line-clamp-1 text-[10px] italic text-ink-soft">“{item.notes}”</p>
                      )}
                    </div>
                    <p className="text-xs font-semibold">
                      {formatCurrency(item.menu.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

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
                  <div className="flex items-center justify-between border-t border-ink/10 pt-3">
                    <dt className="text-sm font-bold">Total bayar</dt>
                    <dd className="font-display text-xl font-semibold">{formatCurrency(total)}</dd>
                  </div>
                </dl>

                <button type="submit" disabled={submitting} className="btn-brand mt-4 w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Memproses pesanan...
                    </>
                  ) : (
                    <>
                      {method === 'cash' ? 'Buat Pesanan' : 'Pesan & Bayar'}
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[10px] leading-relaxed text-ink-soft">
                  Dengan memesan, Anda menyetujui kebijakan restoran. Total akhir
                  dihitung ulang oleh sistem.
                </p>
              </div>
            </div>
          </aside>
        </form>
      </main>
    </div>
  )
}
