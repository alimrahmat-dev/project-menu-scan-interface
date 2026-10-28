import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock,
  CreditCard,
  Eye,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../context/toast'
import { api, getErrorMessage } from '../lib/api'
import { formatCurrency, formatDateTime, formatNumber } from '../lib/format'
import {
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META,
  orderStatusMeta,
} from '../lib/status'

const PIPELINE = ['pending', 'confirmed', 'preparing', 'ready', 'completed']
const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'completed',
}
const NEXT_LABEL = {
  pending: 'Konfirmasi',
  confirmed: 'Proses Dapur',
  preparing: 'Siap Sajikan',
  ready: 'Selesaikan',
}

const emptyFilters = { status: '', payment_status: '', date: '', q: '' }

function OrderDetail({ order, onStatus, onMarkPaid, onClose, busy }) {
  const next = NEXT_STATUS[order.status]
  const isCancelled = order.status === 'cancelled'
  const isPaid = order.payment_status === 'paid'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <StatusBadge status={order.payment_status} type="payment" />
        <span className="chip bg-cream-dark text-ink-soft">
          {PAYMENT_METHOD_LABELS[order.payment_method] || 'Metode belum dipilih'}
        </span>
        {isPaid && (
          <span className="chip bg-emerald-100 text-emerald-800">
            <Check className="size-3" /> Lunas {order.paid_at ? `· ${formatDateTime(order.paid_at)}` : ''}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-cream/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft">Pemesan</p>
          <p className="mt-1.5 text-sm font-bold">{order.customer_name}</p>
          {order.customer_phone && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
              <Phone className="size-3.5" /> {order.customer_phone}
            </p>
          )}
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
            <MapPin className="size-3.5 text-brand" /> {order.dining_table?.name || 'Meja dihapus'}
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-cream/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft">Waktu</p>
          <p className="mt-1.5 text-sm font-bold">{formatDateTime(order.created_at)}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
            <Clock className="size-3.5" /> Dibuat oleh pelanggan
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
            <CreditCard className="size-3.5" /> {PAYMENT_METHOD_LABELS[order.payment_method] || '-'}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10">
        <div className="flex items-center justify-between border-b border-ink/10 bg-cream/50 px-4 py-2.5">
          <p className="text-[11px] font-bold">Rincian menu</p>
          <p className="text-[10px] text-ink-soft">{order.items?.length || 0} jenis</p>
        </div>
        <div className="divide-y divide-ink/5">
          {(order.items || []).map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-cream-dark text-[11px] font-bold">
                  {item.quantity}×
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-snug">{item.menu_name}</p>
                  <p className="text-[10px] text-ink-soft">
                    {formatCurrency(item.unit_price)} / porsi
                  </p>
                  {item.notes && (
                    <p className="mt-0.5 text-[10px] italic text-brand">“{item.notes}”</p>
                  )}
                </div>
              </div>
              <p className="shrink-0 text-xs font-semibold">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>
      </div>

      {order.notes && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[11px] leading-relaxed text-amber-900">
          <p className="font-bold">Catatan pelanggan</p>
          <p className="mt-0.5">{order.notes}</p>
        </div>
      )}

      <div className="rounded-2xl bg-ink p-4 text-cream">
        <dl className="space-y-1.5 text-[11px]">
          <div className="flex justify-between text-cream/60">
            <dt>Subtotal</dt>
            <dd>{formatCurrency(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-cream/60">
            <dt>Pajak</dt>
            <dd>{formatCurrency(order.tax_amount)}</dd>
          </div>
          <div className="flex justify-between text-cream/60">
            <dt>Biaya layanan</dt>
            <dd>{formatCurrency(order.service_amount)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-2">
            <dt className="text-xs font-bold">Total</dt>
            <dd className="font-display text-lg font-semibold">{formatCurrency(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div>
        <p className="label">Perbarui status pesanan</p>
        <div className="flex flex-wrap gap-1.5">
          {PIPELINE.map((status) => {
            const meta = ORDER_STATUS_META[status]
            const active = order.status === status

            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatus(order, status)}
                disabled={busy || active || isCancelled}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition disabled:cursor-not-allowed ${
                  active
                    ? `border-transparent ${meta.tone}`
                    : 'border-ink/10 bg-white text-ink-soft hover:border-ink/25 hover:text-ink disabled:opacity-40'
                }`}
              >
                <span className={`size-1.5 rounded-full ${meta.dot}`} />
                {meta.short}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {next && !isCancelled && (
            <button
              type="button"
              onClick={() => onStatus(order, next)}
              disabled={busy}
              className="btn-brand !px-4 !py-2 text-[11px]"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowRight className="size-3.5" />}
              {NEXT_LABEL[order.status]}
            </button>
          )}

          {!isPaid && !isCancelled && (
            <button
              type="button"
              onClick={() => onMarkPaid(order)}
              disabled={busy}
              className="btn-secondary !border-emerald-200 !px-4 !py-2 text-[11px] !text-emerald-700 hover:!bg-emerald-50"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Banknote className="size-3.5" />}
              Tandai Lunas
            </button>
          )}

          {!isCancelled && order.status !== 'completed' && (
            <button
              type="button"
              onClick={() => onStatus(order, 'cancelled')}
              disabled={busy}
              className="btn-ghost !px-4 !py-2 text-[11px] !text-red-600 hover:!bg-red-50"
            >
              <XCircle className="size-3.5" /> Batalkan
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-end border-t border-ink/10 pt-4">
        <button type="button" onClick={onClose} className="btn-secondary">
          Tutup
        </button>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const toast = useToast()

  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(emptyFilters)
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [rowBusyId, setRowBusyId] = useState(null)

  const load = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const { data } = await api.get('/admin/orders', {
          params: {
            page,
            per_page: 20,
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.payment_status ? { payment_status: filters.payment_status } : {}),
            ...(filters.date ? { date: filters.date } : {}),
            ...(filters.q ? { q: filters.q } : {}),
          },
        })

        setOrders(data.data || [])
        setMeta(data.meta || null)
        setError('')
      } catch (requestError) {
        if (!silent) setError(getErrorMessage(requestError, 'Pesanan gagal dimuat.'))
        else toast.error(getErrorMessage(requestError, 'Gagal menyegarkan pesanan.'))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [filters, page, toast],
  )

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Muat data awal dari API.
    load()
  }, [load])

  useEffect(() => {
    const interval = setInterval(() => load({ silent: true }), 30000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setFilters((current) =>
        current.q === search.trim() ? current : { ...current, q: search.trim() },
      )
    }, 380)

    return () => clearTimeout(timer)
  }, [search])

  const updateFilter = (field, value) => {
    setPage(1)
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const resetFilters = () => {
    setSearch('')
    setPage(1)
    setFilters(emptyFilters)
  }

  const hasFilters = Boolean(
    search.trim() || filters.status || filters.payment_status || filters.date,
  )

  const currentPage = meta?.current_page || 1
  const lastPage = meta?.last_page || 1
  const total = meta?.total || 0

  const openDetail = async (order) => {
    setSelected(order)
    setDetail(order)
    setDetailLoading(true)

    try {
      const { data } = await api.get(`/admin/orders/${order.id}`)
      setDetail(data.data)
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Detail pesanan gagal dimuat.'))
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    if (actionBusy) return
    setSelected(null)
    setDetail(null)
  }

  const afterMutation = async (updated) => {
    setDetail((current) => (current && updated?.id === current.id ? updated : current))
    await load({ silent: true })
  }

  const updateStatus = async (order, status) => {
    if (status === 'cancelled') {
      const confirmed = window.confirm(
        `Batalkan pesanan ${order.order_number}? Pesanan yang dibatalkan tidak dapat diproses kembali.`,
      )
      if (!confirmed) return
    }

    setActionBusy(true)
    setRowBusyId(order.id)

    try {
      const { data } = await api.patch(`/admin/orders/${order.id}/status`, { status })
      toast.success(`Status pesanan diubah menjadi “${orderStatusMeta(status).label}”.`)
      await afterMutation(data.data)
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Status pesanan gagal diperbarui.'))
    } finally {
      setActionBusy(false)
      setRowBusyId(null)
    }
  }

  const markPaid = async (order) => {
    if (
      !window.confirm(
        `Tandai pesanan ${order.order_number} sebagai lunas? Tindakan ini akan mencatat pembayaran manual.`,
      )
    ) {
      return
    }

    setActionBusy(true)
    setRowBusyId(order.id)

    try {
      const { data } = await api.post(`/admin/orders/${order.id}/mark-paid`)
      toast.success('Pesanan berhasil ditandai lunas.')
      await afterMutation(data.data)
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Pesanan gagal ditandai lunas.'))
    } finally {
      setActionBusy(false)
      setRowBusyId(null)
    }
  }

  const quickNext = (order) => {
    const next = NEXT_STATUS[order.status]
    if (next) updateStatus(order, next)
  }

  const pages = useMemo(() => {
    if (lastPage <= 1) return []

    const start = Math.max(1, Math.min(currentPage - 1, lastPage - 2))
    const end = Math.min(lastPage, start + 2)

    return Array.from({ length: end - start + 1 }, (_, index) => start + index)
  }, [currentPage, lastPage])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="section-eyebrow">
            <ClipboardList className="size-3.5" /> Operasional dapur
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Pesanan Masuk
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-ink-soft">
            <span>{formatNumber(total)} pesanan ditemukan</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              Auto-refresh 30 detik
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true)
              load({ silent: true })
            }}
            disabled={refreshing}
            className="btn-secondary !py-2.5"
          >
            {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Segarkan
          </button>
        </div>
      </header>

      <div className="space-y-3 rounded-3xl border border-ink/10 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nomor pesanan, nama, atau meja..."
              className="field !py-2.5 !pl-10 text-xs"
              aria-label="Cari pesanan"
            />
          </div>

          <select
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
            className="field !py-2.5 text-xs lg:w-44"
            aria-label="Filter status pesanan"
          >
            <option value="">Semua status</option>
            {Object.entries(ORDER_STATUS_META).map(([status, meta]) => (
              <option key={status} value={status}>
                {meta.label}
              </option>
            ))}
          </select>

          <select
            value={filters.payment_status}
            onChange={(event) => updateFilter('payment_status', event.target.value)}
            className="field !py-2.5 text-xs lg:w-48"
            aria-label="Filter status pembayaran"
          >
            <option value="">Semua pembayaran</option>
            {Object.entries(PAYMENT_STATUS_META).map(([status, meta]) => (
              <option key={status} value={status}>
                {meta.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.date}
            onChange={(event) => updateFilter('date', event.target.value)}
            className="field !py-2.5 text-xs lg:w-40"
            aria-label="Filter tanggal pesanan"
          />
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between text-[11px] text-ink-soft">
            <p>Filter aktif · menampilkan {orders.length} pesanan pada halaman ini</p>
            <button type="button" onClick={resetFilters} className="font-semibold text-brand hover:underline">
              Reset filter
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card space-y-3 p-5">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-14 animate-pulse rounded-xl bg-cream-dark/60" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={ClipboardList}
          title="Pesanan tidak dapat dimuat"
          description={error}
          action={
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                load()
              }}
              className="btn-brand"
            >
              <RefreshCw className="size-4" /> Coba Lagi
            </button>
          }
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={hasFilters ? 'Tidak ada pesanan yang cocok' : 'Belum ada pesanan'}
          description={
            hasFilters
              ? 'Ubah filter status, pembayaran, atau tanggal untuk melihat pesanan lain.'
              : 'Pesanan pelanggan akan muncul di sini secara otomatis.'
          }
          action={
            hasFilters ? (
              <button type="button" onClick={resetFilters} className="btn-secondary">
                Reset filter
              </button>
            ) : null
          }
        />
      ) : (
        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/10 bg-cream/60 text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  <th className="px-5 py-3 font-bold">Pesanan</th>
                  <th className="px-4 py-3 font-bold">Meja</th>
                  <th className="px-4 py-3 font-bold">Pelanggan</th>
                  <th className="px-4 py-3 text-center font-bold">Item</th>
                  <th className="px-4 py-3 text-right font-bold">Total</th>
                  <th className="px-4 py-3 font-bold">Pembayaran</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {orders.map((order) => {
                  const next = NEXT_STATUS[order.status]
                  const busy = rowBusyId === order.id

                  return (
                    <tr key={order.id} className="align-middle transition hover:bg-cream/40">
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-bold">{order.order_number}</p>
                        <p className="mt-0.5 text-[10px] text-ink-soft">
                          {formatDateTime(order.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold">
                          {order.dining_table?.name || 'Meja dihapus'}
                        </p>
                        <p className="text-[10px] text-ink-soft">
                          {order.dining_table?.code || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="max-w-40 truncate text-xs font-semibold">
                          {order.customer_name}
                        </p>
                        <p className="text-[10px] text-ink-soft">{order.customer_phone || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="chip bg-cream-dark text-ink-soft">
                          {order.items?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <p className="text-xs font-bold">{formatCurrency(order.total)}</p>
                        <p className="text-[10px] text-ink-soft">
                          {PAYMENT_METHOD_LABELS[order.payment_method] || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge
                          status={order.payment_status}
                          type="payment"
                          className="!text-[10px]"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={order.status} className="!text-[10px]" />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {next && (
                            <button
                              type="button"
                              onClick={() => quickNext(order)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1.5 text-[10px] font-bold text-cream transition hover:bg-brand disabled:opacity-50"
                              title={NEXT_LABEL[order.status]}
                            >
                              {busy ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <ArrowRight className="size-3" />
                              )}
                              {NEXT_LABEL[order.status]}
                            </button>
                          )}

                          {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => markPaid(order)}
                              disabled={busy}
                              className="grid size-7 place-items-center rounded-lg text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50"
                              aria-label={`Tandai lunas ${order.order_number}`}
                              title="Tandai lunas"
                            >
                              <Banknote className="size-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openDetail(order)}
                            className="grid size-7 place-items-center rounded-lg text-ink-soft transition hover:bg-cream-dark hover:text-ink"
                            aria-label={`Lihat detail ${order.order_number}`}
                            title="Lihat detail"
                          >
                            <Eye className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-ink/10 bg-cream/40 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-ink-soft">
              Halaman <span className="font-bold text-ink">{currentPage}</span> dari{' '}
              <span className="font-bold text-ink">{lastPage}</span> · {formatNumber(total)} pesanan
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={currentPage <= 1}
                className="btn-icon !size-8 disabled:opacity-40"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="size-4" />
              </button>

              {pages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`grid size-8 place-items-center rounded-full text-[11px] font-bold transition ${
                    pageNumber === currentPage
                      ? 'bg-ink text-cream'
                      : 'text-ink-soft hover:bg-cream-dark hover:text-ink'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(current + 1, lastPage))}
                disabled={currentPage >= lastPage}
                className="btn-icon !size-8 disabled:opacity-40"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={closeDetail}
        size="xl"
        title={selected ? `Pesanan ${selected.order_number}` : 'Detail pesanan'}
        description={selected ? `${selected.dining_table?.name || 'Meja'} · ${selected.customer_name}` : ''}
      >
        {detailLoading && !detail ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft">
            <Loader2 className="size-5 animate-spin text-brand" /> Memuat detail pesanan...
          </div>
        ) : detail ? (
          <div className="relative">
            {detailLoading && (
              <div className="absolute inset-x-0 -top-2 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-ink-soft">
                <Loader2 className="size-3 animate-spin" /> Menyegarkan...
              </div>
            )}
            <OrderDetail
              order={detail}
              busy={actionBusy}
              onClose={closeDetail}
              onStatus={updateStatus}
              onMarkPaid={markPaid}
            />
          </div>
        ) : (
          <EmptyState
            icon={CircleAlert}
            title="Detail tidak tersedia"
            description="Silakan coba muat ulang pesanan ini."
          />
        )}
      </Modal>
    </div>
  )
}
