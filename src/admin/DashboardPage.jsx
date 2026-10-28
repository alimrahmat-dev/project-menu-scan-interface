import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Armchair,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  Loader2,
  Plus,
  QrCode,
  RefreshCw,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/auth'
import { useToast } from '../context/toast'
import { api, getErrorMessage } from '../lib/api'
import {
  formatCurrency,
  formatNumber,
  formatTime,
  formatToday,
  getTimeGreeting,
} from '../lib/format'
import { orderStatusMeta } from '../lib/status'

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']

function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-soft text-brand',
    leaf: 'bg-leaf-soft text-leaf',
    sun: 'bg-amber-100 text-amber-700',
    ink: 'bg-cream-dark text-ink',
  }

  return (
    <div className="card p-5 transition duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-11 place-items-center rounded-2xl ${tones[tone] || tones.brand}`}>
          <Icon className="size-5" />
        </span>
        <ArrowUpRight className="size-4 text-ink/20" />
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold leading-tight">{value}</p>
      <p className="mt-1 text-[11px] text-ink-soft">{hint}</p>
    </div>
  )
}

function RevenueChart({ week, mode, onModeChange }) {
  const max = Math.max(...week.map((day) => (mode === 'revenue' ? day.revenue : day.orders)), 1)
  const total = week.reduce((sum, day) => sum + (mode === 'revenue' ? day.revenue : day.orders), 0)
  const todayKey = week[week.length - 1]?.date

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 px-5 py-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
              <ChartColumn className="size-4.5" />
            </span>
            <div>
              <h2 className="font-display text-base font-semibold">Tren 7 hari terakhir</h2>
              <p className="text-[11px] text-ink-soft">
                {mode === 'revenue'
                  ? `${formatCurrency(total)} total omzet lunas`
                  : `${formatNumber(total)} pesanan masuk`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex rounded-full border border-ink/10 bg-cream p-1">
          {[
            { id: 'revenue', label: 'Omzet' },
            { id: 'orders', label: 'Pesanan' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onModeChange(item.id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                mode === item.id ? 'bg-ink text-cream shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5 pt-6">
        <div className="flex h-52 items-end gap-2 sm:gap-4">
          {week.map((day) => {
            const value = mode === 'revenue' ? day.revenue : day.orders
            const height = Math.max((value / max) * 100, value > 0 ? 8 : 2)
            const isToday = day.date === todayKey

            return (
              <div key={day.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="relative flex w-full flex-1 items-end justify-center">
                  <div
                    className={`relative w-full max-w-12 rounded-t-xl transition duration-300 ${
                      isToday
                        ? 'bg-gradient-to-t from-brand to-sun'
                        : 'bg-cream-dark group-hover:bg-sand'
                    }`}
                    style={{ height: `${height}%` }}
                  >
                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[10px] font-semibold text-cream shadow-lg group-hover:block">
                      {mode === 'revenue' ? formatCurrency(value) : `${formatNumber(value)} pesanan`}
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <p className={`text-[10px] font-bold uppercase ${isToday ? 'text-brand' : 'text-ink-soft'}`}>
                    {day.label}
                  </p>
                  <p className="text-[9px] text-ink-soft/70">{new Date(`${day.date}T00:00:00`).getDate()}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function TopMenus({ menus }) {
  const max = Math.max(...menus.map((menu) => Number(menu.quantity)), 1)

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-leaf-soft text-leaf">
            <TrendingUp className="size-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold">Menu terlaris</h2>
            <p className="text-[11px] text-ink-soft">Berdasarkan pesanan lunas</p>
          </div>
        </div>
        <Link to="/admin/menus" className="text-[11px] font-semibold text-brand hover:underline">
          Kelola
        </Link>
      </div>

      {menus.length === 0 ? (
        <p className="px-5 py-10 text-center text-xs text-ink-soft">
          Belum ada penjualan. Menu terlaris akan muncul di sini.
        </p>
      ) : (
        <ol className="divide-y divide-ink/5">
          {menus.map((menu, index) => (
            <li key={menu.menu_name} className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-cream-dark text-[11px] font-bold text-ink-soft">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{menu.menu_name}</p>
                  <p className="text-[10px] text-ink-soft">
                    {formatNumber(menu.quantity)} terjual · {formatCurrency(menu.revenue)}
                  </p>
                </div>
              </div>
              <div className="ml-10 mt-2 h-1.5 overflow-hidden rounded-full bg-cream-dark">
                <div
                  className={`h-full rounded-full ${index === 0 ? 'bg-brand' : 'bg-sand'}`}
                  style={{ width: `${Math.max((Number(menu.quantity) / max) * 100, 6)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function StatusBreakdown({ breakdown }) {
  const entries = STATUS_ORDER.filter((status) => Number(breakdown?.[status]) > 0)

  return (
    <section className="card p-5">
      <h2 className="font-display text-base font-semibold">Status pesanan</h2>
      <p className="text-[11px] text-ink-soft">Akumulasi seluruh pesanan tersimpan</p>

      {entries.length === 0 ? (
        <p className="mt-6 text-center text-xs text-ink-soft">Belum ada pesanan.</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {entries.map((status) => {
            const meta = orderStatusMeta(status)

            return (
              <div key={status} className="flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-2 font-medium text-ink-soft">
                  <span className={`size-2 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
                <span className="chip bg-cream-dark text-ink">{formatNumber(breakdown[status])}</span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function RecentOrders({ orders }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-cream-dark text-ink">
            <ClipboardList className="size-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold">Pesanan terbaru</h2>
            <p className="text-[11px] text-ink-soft">6 aktivitas terakhir</p>
          </div>
        </div>
        <Link to="/admin/orders" className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">
          Semua pesanan <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="px-5 py-10 text-center text-xs text-ink-soft">Belum ada pesanan masuk.</p>
      ) : (
        <div className="divide-y divide-ink/5">
          {orders.map((order) => (
            <Link
              key={order.id}
              to="/admin/orders"
              className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-cream/60"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-[10px] font-bold text-brand">
                {order.dining_table?.name?.replace(/[^0-9]/g, '') || '—'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{order.order_number}</p>
                <p className="truncate text-[10px] text-ink-soft">
                  {order.customer_name} · {order.dining_table?.name || 'Meja'} ·{' '}
                  {formatTime(order.created_at)}
                </p>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-xs font-semibold">{formatCurrency(order.total)}</p>
                <p className="text-[10px] text-ink-soft">{order.items?.length || 0} item</p>
              </div>
              <StatusBadge status={order.status} className="shrink-0 !text-[10px]" />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [chartMode, setChartMode] = useState('revenue')

  const load = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const response = await api.get('/admin/dashboard')
        setData(response.data)
        setError('')
      } catch (requestError) {
        if (!silent) setError(getErrorMessage(requestError, 'Dashboard gagal dimuat.'))
        else toast.error(getErrorMessage(requestError, 'Gagal menyegarkan dashboard.'))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Muat data awal dari API.
    load()
  }, [load])

  useEffect(() => {
    const interval = setInterval(() => load({ silent: true }), 60000)
    return () => clearInterval(interval)
  }, [load])

  const week = data?.week || []
  const recentOrders = data?.recent_orders?.data || data?.recent_orders || []
  const stats = data?.stats || {}
  const greeting = getTimeGreeting()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-3xl bg-cream-dark/60" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-3xl bg-cream-dark/60" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
          <div className="h-80 animate-pulse rounded-3xl bg-cream-dark/60" />
          <div className="h-80 animate-pulse rounded-3xl bg-cream-dark/60" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={ChartColumn}
        title="Dashboard tidak dapat dimuat"
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
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="section-eyebrow">
            <Sparkles className="size-3.5" /> Ringkasan hari ini
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {greeting}, {user?.name?.split(' ')[0] || 'Admin'}.
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" /> {formatToday()}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              Data diperbarui otomatis setiap menit
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
          <Link to="/admin/orders" className="btn-primary !py-2.5">
            <ClipboardList className="size-4" /> Lihat Pesanan
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Omzet hari ini"
          value={formatCurrency(stats.revenue_today || 0)}
          hint={`${formatNumber(stats.paid_orders_today || 0)} pesanan lunas`}
        />
        <StatCard
          icon={ClipboardList}
          label="Pesanan hari ini"
          value={formatNumber(stats.orders_today || 0)}
          hint="Seluruh pesanan masuk"
          tone="sun"
        />
        <StatCard
          icon={UtensilsCrossed}
          label="Pesanan aktif"
          value={formatNumber(stats.active_orders || 0)}
          hint="Perlu diproses dapur"
          tone="brand"
        />
        <StatCard
          icon={Armchair}
          label="Meja aktif"
          value={formatNumber(stats.tables_active || 0)}
          hint={`${formatNumber(stats.menus_available || 0)} menu tersedia`}
          tone="leaf"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <RevenueChart week={week} mode={chartMode} onModeChange={setChartMode} />
        <TopMenus menus={data?.top_menus || []} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <RecentOrders orders={recentOrders} />

        <div className="space-y-4">
          <StatusBreakdown breakdown={data?.status_breakdown || {}} />

          <section className="overflow-hidden rounded-3xl bg-ink p-5 text-cream">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cream/40">
              Aksi cepat
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold">Siap melayani tamu?</h2>
            <div className="mt-4 space-y-2">
              <Link
                to="/admin/menus"
                className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 text-xs font-semibold transition hover:bg-white/10"
              >
                <span className="grid size-8 place-items-center rounded-xl bg-brand text-white">
                  <Plus className="size-4" />
                </span>
                Tambah menu baru
                <ArrowRight className="ml-auto size-3.5 text-cream/40" />
              </Link>
              <Link
                to="/admin/tables"
                className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 text-xs font-semibold transition hover:bg-white/10"
              >
                <span className="grid size-8 place-items-center rounded-xl bg-white/10 text-sun">
                  <QrCode className="size-4" />
                </span>
                Cetak QR meja
                <ArrowRight className="ml-auto size-3.5 text-cream/40" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
