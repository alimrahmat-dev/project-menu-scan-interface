import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Info,
  Loader2,
  MapPin,
  Phone,
  QrCode,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import Logo from '../components/Logo'
import { useToast } from '../context/toast'
import { api, getErrorMessage } from '../lib/api'
import { formatCurrency, formatDateTime } from '../lib/format'
import { PAYMENT_METHOD_LABELS } from '../lib/status'

const TIMELINE = [
  {
    status: 'pending',
    label: 'Pesanan diterima',
    description: 'Pesanan Anda sudah masuk ke sistem restoran.',
    icon: ClipboardList,
  },
  {
    status: 'confirmed',
    label: 'Dikonfirmasi',
    description: 'Pembayaran terverifikasi dan pesanan diteruskan ke dapur.',
    icon: CheckCircle2,
  },
  {
    status: 'preparing',
    label: 'Sedang disiapkan',
    description: 'Chef kami sedang menyiapkan hidangan Anda.',
    icon: ChefHat,
  },
  {
    status: 'ready',
    label: 'Siap disajikan',
    description: 'Pesanan sedang diantar ke meja Anda.',
    icon: UtensilsCrossed,
  },
  {
    status: 'completed',
    label: 'Selesai',
    description: 'Selamat menikmati! Terima kasih sudah berkunjung.',
    icon: Sparkles,
  },
]

function Header({ tableToken }) {
  return (
    <header className="print-hide sticky top-0 z-30 border-b border-ink/5 bg-cream/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          {tableToken && (
            <Link to={`/t/${tableToken}`} className="btn-ghost !px-3">
              <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Menu</span>
            </Link>
          )}
          <Link to="/" className="btn-secondary !px-4 !py-2 text-xs">
            Beranda
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function OrderStatusPage() {
  const { orderNumber } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const shouldPay = searchParams.get('pay') === '1'
  const toast = useToast()

  const [order, setOrder] = useState(null)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState(
    token ? '' : 'Tautan pesanan tidak lengkap. Buka kembali tautan dari struk atau halaman pembayaran.',
  )
  const [startingPayment, setStartingPayment] = useState(false)
  const [mockProcessing, setMockProcessing] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const autoStartedRef = useRef(false)

  const loadOrder = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) return

      try {
        const { data } = await api.get(`/orders/${orderNumber}`, { params: { token } })
        setOrder(data.data)
        setError('')
      } catch (requestError) {
        if (!silent) {
          setError(
            getErrorMessage(
              requestError,
              'Pesanan tidak ditemukan. Pastikan tautan yang Anda buka sudah benar.',
            ),
          )
        }
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [orderNumber, token],
  )

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Muat data awal dari API.
    loadOrder()
  }, [loadOrder])

  const startPayment = useCallback(async () => {
    if (!token) return

    setStartingPayment(true)

    try {
      const { data } = await api.post(`/orders/${orderNumber}/pay`, { token })
      setPayment(data.payment || null)
      setOrder(data.data)

      if (data.payment?.mode === 'mock') {
        toast.info('Mode demo aktif. Simulasikan hasil pembayaran pada panel pembayaran.')
      }
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Gagal memulai pembayaran. Silakan coba lagi.'))
    } finally {
      setStartingPayment(false)
    }
  }, [orderNumber, token, toast])

  useEffect(() => {
    if (!order || !shouldPay || autoStartedRef.current) return undefined

    if (order.can_pay || order.payment_status === 'pending') {
      autoStartedRef.current = true

      if (order.payment_status === 'unpaid' || order.payment_status === 'failed') {
        const timer = setTimeout(() => startPayment(), 0)

        return () => clearTimeout(timer)
      }
    }

    return undefined
  }, [order, shouldPay, startPayment])

  useEffect(() => {
    if (!order || order.payment_status !== 'pending' || order.payment_mode !== 'midtrans') {
      return undefined
    }

    const interval = setInterval(() => loadOrder({ silent: true }), 6000)

    return () => clearInterval(interval)
  }, [order, loadOrder])

  const handleMockPay = async (outcome) => {
    setMockProcessing(outcome)

    try {
      const { data } = await api.post(`/orders/${orderNumber}/mock-pay`, {
        token,
        outcome,
      })

      setOrder(data.data)
      setPayment(null)

      if (outcome === 'success') {
        toast.success('Pembayaran demo berhasil. Pesanan Anda sedang disiapkan!')
      } else {
        toast.error('Simulasi pembayaran gagal. Anda dapat mencoba lagi.')
      }
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Gagal memproses simulasi pembayaran.'))
    } finally {
      setMockProcessing('')
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Batalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.')) return

    setCancelling(true)

    try {
      const { data } = await api.post(`/orders/${orderNumber}/cancel`, { token })
      setOrder(data.data)
      toast.success('Pesanan berhasil dibatalkan.')
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Pesanan tidak dapat dibatalkan.'))
    } finally {
      setCancelling(false)
    }
  }

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.order_number)
      toast.success('Nomor pesanan disalin.')
    } catch {
      toast.error('Tidak dapat menyalin nomor pesanan.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 px-4 py-32">
          <Loader2 className="size-8 animate-spin text-brand" />
          <p className="text-sm font-semibold text-ink-soft">Memuat pesanan Anda...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <EmptyState
            icon={ReceiptText}
            title="Pesanan tidak dapat dibuka"
            description={error}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/scan" className="btn-brand">
                  Scan QR Meja
                </Link>
                <Link to="/" className="btn-secondary">
                  Kembali ke Beranda
                </Link>
              </div>
            }
          />
        </main>
      </div>
    )
  }

  const isPaid = order.payment_status === 'paid'
  const isCancelled = order.status === 'cancelled'
  const isCash = order.payment_method === 'cash'
  const isMock = order.payment_mode === 'mock'
  const paymentPending = order.payment_status === 'pending'
  const paymentFailed = ['failed', 'expired'].includes(order.payment_status)
  const canPay = order.can_pay
  const table = order.dining_table
  const timelineIndex = TIMELINE.findIndex((step) => step.status === order.status)
  const activeIndex = timelineIndex === -1 ? 0 : timelineIndex

  const heroTone = isPaid
    ? 'from-leaf to-emerald-800'
    : isCancelled
      ? 'from-red-800 to-red-950'
      : paymentFailed
        ? 'from-amber-700 to-orange-900'
        : 'from-ink to-stone-800'

  const HeroIcon = isPaid ? CheckCircle2 : isCancelled ? XCircle : paymentPending ? Clock : ReceiptText

  const heroTitle = isPaid
    ? 'Pembayaran berhasil!'
    : isCancelled
      ? 'Pesanan dibatalkan'
      : paymentFailed
        ? 'Pembayaran belum selesai'
        : paymentPending
          ? 'Menunggu pembayaran'
          : 'Pesanan Anda sudah diterima'

  const heroDescription = isPaid
    ? 'Terima kasih! Dapur kami sudah menerima pesanan Anda dan akan segera menyiapkannya.'
    : isCancelled
      ? 'Pesanan ini sudah dibatalkan. Anda dapat memesan kembali kapan saja.'
      : paymentFailed
        ? 'Pembayaran sebelumnya tidak berhasil. Silakan coba lagi dengan metode yang sama.'
        : paymentPending
          ? 'Selesaikan pembayaran untuk meneruskan pesanan ke dapur.'
          : isCash
            ? 'Silakan lakukan pembayaran di kasir dengan menunjukkan nomor pesanan Anda.'
            : 'Pesanan tercatat. Selesaikan pembayaran untuk memulai proses di dapur.'

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Header tableToken={table?.qr_token} />

      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 sm:pt-8">
        <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${heroTone} p-6 text-cream sm:p-8`}>
          <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur sm:size-14">
                <HeroIcon className="size-6 sm:size-7" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
                  {heroTitle}
                </h1>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-cream/65">
                  {heroDescription}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-cream/75">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                    <ReceiptText className="size-3.5" /> {order.order_number}
                    <button type="button" onClick={copyOrderNumber} aria-label="Salin nomor pesanan" className="ml-1 opacity-70 transition hover:opacity-100">
                      <Copy className="size-3" />
                    </button>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                    <MapPin className="size-3.5" /> {table?.name || 'Meja'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                    <Clock className="size-3.5" /> {formatDateTime(order.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setLoading(true)
                loadOrder()
              }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold text-cream backdrop-blur transition hover:bg-white/20"
            >
              <RefreshCw className="size-3.5" /> Perbarui
            </button>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {/* Panel pembayaran */}
            {!isPaid && !isCancelled && (
              <section className="card overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
                      <CreditCard className="size-4.5" />
                    </span>
                    <div>
                      <h2 className="text-sm font-bold">Pembayaran</h2>
                      <p className="text-[11px] text-ink-soft">
                        {PAYMENT_METHOD_LABELS[order.payment_method] || 'Pilih metode pembayaran'}
                      </p>
                    </div>
                  </div>
                  <span className="font-display text-lg font-semibold">{formatCurrency(order.total)}</span>
                </div>

                <div className="p-5">
                  {isCash ? (
                    <div className="rounded-2xl bg-amber-50 p-5 text-amber-900">
                      <div className="flex items-start gap-3">
                        <Banknote className="mt-0.5 size-5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold">Pembayaran dilakukan di kasir</p>
                          <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                            Tunjukkan nomor pesanan <strong>{order.order_number}</strong> kepada staf
                            kasir. Setelah pembayaran diterima, status akan berubah menjadi lunas.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : isMock ? (
                    <div>
                      {paymentFailed && (
                        <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-red-800">
                          <XCircle className="mt-0.5 size-4.5 shrink-0" />
                          <div className="text-xs leading-relaxed">
                            <p className="font-bold">Pembayaran sebelumnya gagal.</p>
                            <p className="mt-0.5 text-red-700/80">
                              Coba lagi untuk mendapatkan kode pembayaran baru.
                            </p>
                          </div>
                        </div>
                      )}

                      {paymentPending ? (
                        <div className="animate-fade-in">
                          <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink/20 bg-cream/60 p-5 text-center">
                            <span className="chip bg-ink text-cream">
                              <span className="size-1.5 animate-pulse rounded-full bg-sun" />
                              Mode demo
                            </span>

                            <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm">
                              <QRCodeCanvas
                                value={`DEMO|${order.order_number}|${order.total}`}
                                size={148}
                                bgColor="#ffffff"
                                fgColor="#211b16"
                                level="M"
                              />
                            </div>

                            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft">
                              Total pembayaran
                            </p>
                            <p className="font-display text-3xl font-semibold">{formatCurrency(order.total)}</p>
                            <p className="mt-1 text-[10px] text-ink-soft">
                              Ref: {payment?.reference || `MOCK-${order.order_number}`}
                            </p>
                          </div>

                          <div className="mt-4 rounded-2xl bg-sky-50 p-3.5 text-[11px] leading-relaxed text-sky-900">
                            <div className="flex items-start gap-2">
                              <Info className="mt-0.5 size-4 shrink-0" />
                              Ini adalah <strong>simulasi pembayaran</strong>. Tidak ada dana yang
                              ditarik. Pilih hasil di bawah untuk melihat alur aplikasi.
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => handleMockPay('success')}
                              disabled={Boolean(mockProcessing)}
                              className="btn-brand"
                            >
                              {mockProcessing === 'success' ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Check className="size-4" />
                              )}
                              Simulasikan Berhasil
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMockPay('failed')}
                              disabled={Boolean(mockProcessing)}
                              className="btn-secondary !border-red-200 !text-red-700 hover:!bg-red-50"
                            >
                              {mockProcessing === 'failed' ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <XCircle className="size-4" />
                              )}
                              Simulasikan Gagal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-cream/70 p-5 text-center">
                          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-brand shadow-sm">
                            <QrCode className="size-6" />
                          </span>
                          <p className="mt-3 text-sm font-bold">Siap menyelesaikan pembayaran?</p>
                          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                            Klik tombol di bawah untuk membuat kode pembayaran demo.
                          </p>
                          <button
                            type="button"
                            onClick={startPayment}
                            disabled={startingPayment}
                            className="btn-brand mt-4"
                          >
                            {startingPayment ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <ShieldCheck className="size-4" />
                            )}
                            Bayar Sekarang
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {paymentPending ? (
                        <div className="rounded-2xl bg-sky-50 p-5 text-center text-sky-900">
                          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-sky-600 shadow-sm">
                            <Loader2 className="size-6 animate-spin" />
                          </span>
                          <p className="mt-3 text-sm font-bold">Menunggu konfirmasi pembayaran</p>
                          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-sky-900/70">
                            Halaman ini diperbarui otomatis. Jika Anda belum menyelesaikan
                            pembayaran, buka kembali halaman pembayaran Midtrans.
                          </p>

                          {(payment?.redirect_url || order.payment_url) && (
                            <button
                              type="button"
                              onClick={() => window.location.assign(payment?.redirect_url || order.payment_url)}
                              className="btn-primary mt-4"
                            >
                              <ExternalLink className="size-4" /> Buka Halaman Pembayaran
                            </button>
                          )}
                        </div>
                      ) : canPay ? (
                        <div className="rounded-2xl bg-cream/70 p-5 text-center">
                          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-brand shadow-sm">
                            <CreditCard className="size-6" />
                          </span>
                          <p className="mt-3 text-sm font-bold">
                            {paymentFailed ? 'Pembayaran belum berhasil' : 'Lanjutkan pembayaran'}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                            Anda akan diarahkan ke halaman pembayaran aman Midtrans.
                          </p>
                          <button
                            type="button"
                            onClick={startPayment}
                            disabled={startingPayment}
                            className="btn-brand mt-4"
                          >
                            {startingPayment ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <ExternalLink className="size-4" />
                            )}
                            Bayar Sekarang
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </section>
            )}

            {isPaid && (
              <section className="card overflow-hidden border-emerald-200/60">
                <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50/60 px-5 py-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white">
                    <CheckCircle2 className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-emerald-900">Pembayaran lunas</h2>
                    <p className="text-[11px] text-emerald-800/70">
                      {PAYMENT_METHOD_LABELS[order.payment_method] || 'Pembayaran'} ·{' '}
                      {formatDateTime(order.paid_at)}
                    </p>
                  </div>
                  <span className="ml-auto font-display text-lg font-semibold text-emerald-900">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                <div className="flex items-start gap-2.5 px-5 py-4 text-[11px] leading-relaxed text-ink-soft">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  Struk digital tersimpan pada pesanan ini. Tunjukkan halaman ini kepada staf
                  jika diperlukan.
                </div>
              </section>
            )}

            {isCancelled && (
              <section className="card border-red-200/70 p-5">
                <div className="flex items-start gap-3 text-red-800">
                  <XCircle className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">Pesanan dibatalkan</p>
                    <p className="mt-1 text-xs leading-relaxed text-red-700/80">
                      Tidak ada pembayaran yang diproses untuk pesanan ini. Anda dapat memesan
                      kembali dengan menekan tombol di samping.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Timeline */}
            {!isCancelled && (
              <section className="card p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold">Status pesanan</h2>
                  {paymentPending && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-ink-soft">
                      <Loader2 className="size-3 animate-spin" /> Diperbarui otomatis
                    </span>
                  )}
                </div>

                <ol className="mt-5 space-y-1">
                  {TIMELINE.map((step, index) => {
                    const done = index < activeIndex
                    const active = index === activeIndex
                    const Icon = step.icon

                    return (
                      <li key={step.status} className="relative flex gap-4 pb-5 last:pb-0">
                        {index < TIMELINE.length - 1 && (
                          <span
                            className={`absolute left-[19px] top-10 h-[calc(100%-24px)] w-0.5 ${
                              done ? 'bg-leaf' : 'bg-ink/10'
                            }`}
                          />
                        )}

                        <span
                          className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 transition ${
                            done
                              ? 'border-leaf bg-leaf text-white'
                              : active
                                ? 'border-brand bg-brand text-white shadow-lg shadow-brand/25'
                                : 'border-ink/10 bg-white text-ink-soft/50'
                          }`}
                        >
                          {done ? <Check className="size-4.5" /> : <Icon className="size-4.5" />}
                        </span>

                        <div className="pt-1.5">
                          <p
                            className={`text-sm font-bold ${
                              done || active ? 'text-ink' : 'text-ink-soft/60'
                            }`}
                          >
                            {step.label}
                          </p>
                          <p
                            className={`mt-0.5 text-xs leading-relaxed ${
                              done || active ? 'text-ink-soft' : 'text-ink-soft/50'
                            }`}
                          >
                            {step.description}
                          </p>
                          {active && paymentPending && step.status === 'pending' && (
                            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              Menunggu pembayaran
                            </span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </section>
            )}

            {/* Item pesanan */}
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
                    <UtensilsCrossed className="size-4.5" />
                  </span>
                  <h2 className="text-sm font-bold">Rincian pesanan</h2>
                </div>
                <span className="text-[11px] text-ink-soft">{order.items?.length || 0} jenis menu</span>
              </div>

              <div className="divide-y divide-ink/5">
                {(order.items || []).map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream-dark text-xs font-bold">
                        {item.quantity}×
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug">{item.menu_name}</p>
                        <p className="text-[11px] text-ink-soft">
                          {formatCurrency(item.unit_price)} / porsi
                        </p>
                        {item.notes && (
                          <p className="mt-0.5 text-[11px] italic text-brand">“{item.notes}”</p>
                        )}
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="card sticky top-24 overflow-hidden">
              <div className="border-b border-ink/10 px-5 py-4">
                <h2 className="font-display text-base font-semibold">Ringkasan pembayaran</h2>
              </div>

              <div className="px-5 py-4">
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between text-ink-soft">
                    <dt>Subtotal</dt>
                    <dd className="font-semibold text-ink">{formatCurrency(order.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-ink-soft">
                    <dt>Pajak</dt>
                    <dd>{formatCurrency(order.tax_amount)}</dd>
                  </div>
                  <div className="flex justify-between text-ink-soft">
                    <dt>Biaya layanan</dt>
                    <dd>{formatCurrency(order.service_amount)}</dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-ink/10 pt-3">
                    <dt className="text-sm font-bold">Total</dt>
                    <dd className="font-display text-xl font-semibold">{formatCurrency(order.total)}</dd>
                  </div>
                </dl>

                <div className="mt-4 rounded-2xl bg-cream/70 p-3.5 text-[11px]">
                  <div className="flex justify-between gap-2">
                    <span className="text-ink-soft">Pemesan</span>
                    <span className="text-right font-semibold">{order.customer_name}</span>
                  </div>
                  {order.customer_phone && (
                    <div className="mt-1.5 flex justify-between gap-2">
                      <span className="text-ink-soft">WhatsApp</span>
                      <span className="font-semibold">{order.customer_phone}</span>
                    </div>
                  )}
                  <div className="mt-1.5 flex justify-between gap-2">
                    <span className="text-ink-soft">Meja</span>
                    <span className="font-semibold">{table?.name || '-'}</span>
                  </div>
                  <div className="mt-1.5 flex justify-between gap-2">
                    <span className="text-ink-soft">Status</span>
                    <span className="font-semibold">
                      {isPaid ? 'Lunas' : isCancelled ? 'Dibatalkan' : 'Belum lunas'}
                    </span>
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-3 rounded-2xl bg-amber-50 p-3.5 text-[11px] leading-relaxed text-amber-900">
                    <p className="font-bold">Catatan pesanan</p>
                    <p className="mt-0.5">{order.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 border-t border-ink/10 bg-cream/50 px-5 py-4">
                {table?.qr_token && (
                  <Link to={`/t/${table.qr_token}`} className="btn-primary w-full">
                    <UtensilsCrossed className="size-4" /> Pesan Menu Lain
                    <ArrowRight className="size-4" />
                  </Link>
                )}

                {!isPaid && !isCancelled && order.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="btn-ghost w-full !text-red-600 hover:!bg-red-50"
                  >
                    {cancelling ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <XCircle className="size-4" />
                    )}
                    Batalkan Pesanan
                  </button>
                )}
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-leaf-soft text-leaf">
                  <Phone className="size-4.5" />
                </span>
                <p className="text-sm font-bold">Butuh bantuan?</p>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
                Hubungi staf kami di <strong className="text-ink">+62 812 3456 7890</strong> atau
                panggil langsung dari meja Anda. Sebutkan nomor pesanan agar lebih cepat.
              </p>
            </div>
          </aside>
        </div>

        <p className="mt-8 text-center text-[10px] text-ink-soft">
          Pembayaran diproses secara aman. Simpan halaman ini sebagai bukti pesanan Anda.
        </p>
      </main>
    </div>
  )
}
