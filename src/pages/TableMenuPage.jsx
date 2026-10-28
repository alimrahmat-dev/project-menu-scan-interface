import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChefHat,
  Clock,
  MapPin,
  QrCode,
  ScanLine,
  Search,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'
import CartPanel from '../components/CartPanel'
import EmptyState from '../components/EmptyState'
import MenuCard from '../components/MenuCard'
import MenuDetailModal from '../components/MenuDetailModal'
import Modal from '../components/Modal'
import MenuImage from '../components/MenuImage'
import { useCart } from '../context/cart'
import { api, getErrorMessage } from '../lib/api'
import { formatCurrency } from '../lib/format'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80'

function LoadingState() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="h-20 border-b border-ink/5 bg-cream/80" />
      <main className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-52 rounded-3xl bg-cream-dark sm:h-60" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-10 w-28 rounded-full bg-cream-dark" />
              ))}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="overflow-hidden rounded-3xl border border-ink/10 bg-white">
                  <div className="aspect-[4/3] bg-cream-dark" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-2/3 rounded bg-cream-dark" />
                    <div className="h-3 w-full rounded bg-cream-dark" />
                    <div className="h-3 w-1/2 rounded bg-cream-dark" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden h-[460px] rounded-3xl bg-cream-dark lg:block" />
        </div>
      </main>
    </div>
  )
}

export default function TableMenuPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { table, setTable, setRates, items, itemCount, total, clearItems } = useCart()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    let active = true

    setLoading(true)
    setError('')

    Promise.all([api.get('/menu'), api.get(`/tables/${token}`)])
      .then(([menuResponse, tableResponse]) => {
        if (!active) return

        setData(menuResponse.data)
        setTable(tableResponse.data.data)
        setRates(menuResponse.data.tax_percent, menuResponse.data.service_percent)
      })
      .catch((requestError) => {
        if (!active) return

        setError(
          getErrorMessage(
            requestError,
            'QR meja tidak valid atau sudah tidak aktif. Silakan pindai ulang QR di meja Anda.',
          ),
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
    // setTable & setRates berasal dari context dan sengaja tidak dimasukkan agar
    // halaman tidak memuat ulang setiap keranjang berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const allMenus = useMemo(() => {
    if (!data?.categories) return []

    return data.categories.flatMap((category) =>
      (category.menus || []).map((menu) => ({
        ...menu,
        category: { id: category.id, name: category.name, icon: category.icon },
      })),
    )
  }, [data])

  const filteredMenus = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return allMenus.filter((menu) => {
      const matchesCategory = activeCategory === 'all' || menu.category_id === activeCategory
      const matchesSearch =
        !keyword ||
        menu.name.toLowerCase().includes(keyword) ||
        (menu.description || '').toLowerCase().includes(keyword)

      return matchesCategory && matchesSearch
    })
  }, [allMenus, activeCategory, search])

  const activeCategoryName =
    activeCategory === 'all'
      ? 'Semua Menu'
      : data?.categories.find((category) => category.id === activeCategory)?.name || 'Menu'

  const featured = data?.featured || []
  const showFeatured = !search.trim() && activeCategory === 'all' && featured.length > 0

  const handleCheckout = () => {
    if (items.length === 0) return
    setCartOpen(false)
    navigate('/checkout')
  }

  const handleReset = () => {
    if (items.length > 0 && !window.confirm('Kosongkan keranjang dan mulai pilih menu lagi?')) {
      return
    }

    clearItems()
    setSearch('')
    setActiveCategory('all')
  }

  if (loading) {
    return <LoadingState />
  }

  if (error) {
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
            icon={QrCode}
            title="Meja tidak ditemukan"
            description={error}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/scan" className="btn-brand">
                  <ScanLine className="size-4" /> Scan Ulang
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

  return (
    <div className="min-h-screen bg-cream pb-28 lg:pb-16">
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-lg shadow-brand/20"
            aria-label="Beranda"
          >
            <ChefHat className="size-5" />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold leading-tight sm:text-base">
              {data?.restaurant?.name || 'Rasa Nusantara'}
            </p>
            <p className="flex items-center gap-1 text-[10px] font-semibold text-ink-soft sm:text-[11px]">
              <MapPin className="size-3 text-brand" />
              {table?.name || 'Meja'} · {table?.capacity || '-'} kursi
            </p>
          </div>

          <div className="relative hidden w-60 md:block xl:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari menu..."
              className="field !py-2.5 !pl-10 text-xs"
              aria-label="Cari menu"
            />
          </div>

          <Link to="/scan" className="btn-icon" aria-label="Scan QR lain">
            <ScanLine className="size-4.5" />
          </Link>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="btn-icon relative lg:hidden"
            aria-label="Buka keranjang"
          >
            <ShoppingBag className="size-4.5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl bg-ink text-cream">
          <img
            src={data?.restaurant?.hero_url || HERO_IMAGE}
            alt="Suasana Rasa Nusantara"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/20" />
          <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:p-10">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-cream/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cream/80 backdrop-blur">
                <span className="size-1.5 rounded-full bg-sun" />
                {table?.name || 'Meja Anda'} · {table?.capacity || '-'} kursi
              </span>
              <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.7rem]">
                Selamat datang di{' '}
                <span className="italic text-sun">{data?.restaurant?.name || 'Rasa Nusantara'}</span>
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/65">
                {data?.restaurant?.tagline ||
                  'Cita rasa Indonesia, dipesan dalam sekali pindai.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] text-cream/70">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 backdrop-blur">
                <Clock className="size-3.5 text-sun" />
                {data?.restaurant?.open_hours || '10.00 - 22.00'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 backdrop-blur">
                <MapPin className="size-3.5 text-sun" />
                {data?.restaurant?.address || 'Jakarta'}
              </span>
            </div>
          </div>
        </section>

        <div className="relative mt-4 md:hidden">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari menu favorit Anda..."
            className="field !pl-10"
            aria-label="Cari menu"
          />
        </div>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="sticky top-16 z-20 -mx-4 border-b border-ink/5 bg-cream/95 px-4 py-3 backdrop-blur sm:top-20 sm:-mx-6 sm:px-6 lg:-mx-4 lg:px-4">
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition ${
                    activeCategory === 'all'
                      ? 'bg-ink text-cream shadow-lg shadow-ink/10'
                      : 'border border-ink/10 bg-white text-ink-soft hover:border-ink/20 hover:text-ink'
                  }`}
                >
                  <Sparkles className="size-4" /> Semua
                </button>

                {(data?.categories || []).map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition ${
                      activeCategory === category.id
                        ? 'bg-ink text-cream shadow-lg shadow-ink/10'
                        : 'border border-ink/10 bg-white text-ink-soft hover:border-ink/20 hover:text-ink'
                    }`}
                  >
                    <span className="text-sm">{category.icon}</span>
                    {category.name}
                    <span
                      className={`rounded-full px-1.5 text-[10px] ${
                        activeCategory === category.id ? 'bg-white/15' : 'bg-cream-dark'
                      }`}
                    >
                      {category.menus?.length || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {showFeatured && (
              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
                      Pilihan chef
                    </p>
                    <h2 className="font-display text-xl font-semibold">Rekomendasi hari ini</h2>
                  </div>
                  <span className="hidden text-[11px] text-ink-soft sm:inline">
                    Geser untuk lihat semua
                  </span>
                </div>

                <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                  {featured.map((menu) => (
                    <button
                      key={menu.id}
                      type="button"
                      onClick={() => setSelectedMenu(menu)}
                      className="group relative w-56 shrink-0 snap-start overflow-hidden rounded-2xl bg-ink text-left shadow-lg shadow-ink/10"
                    >
                      <MenuImage
                        src={menu.image_url}
                        alt={menu.name}
                        className="h-40 w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3.5 text-cream">
                        {menu.badge && (
                          <span className="mb-1 inline-block rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                            {menu.badge}
                          </span>
                        )}
                        <p className="line-clamp-1 font-display text-sm font-semibold">{menu.name}</p>
                        <p className="text-[11px] font-semibold text-cream/70">
                          {formatCurrency(menu.price)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-7">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="font-display text-2xl font-semibold">{activeCategoryName}</h2>
                  <p className="text-xs text-ink-soft">
                    {filteredMenus.length} menu
                    {search.trim() ? ` untuk “${search.trim()}”` : ' tersedia'}
                  </p>
                </div>

                {(search || activeCategory !== 'all') && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] font-semibold text-brand hover:underline"
                  >
                    Reset filter
                  </button>
                )}
              </div>

              {filteredMenus.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="Menu tidak ditemukan"
                  description="Coba kata kunci lain atau lihat semua menu yang tersedia."
                  action={
                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn-secondary"
                    >
                      <UtensilsCrossed className="size-4" /> Lihat semua menu
                    </button>
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredMenus.map((menu, index) => (
                    <MenuCard
                      key={menu.id}
                      menu={menu}
                      index={index}
                      onOpen={setSelectedMenu}
                    />
                  ))}
                </div>
              )}
            </section>

            <footer className="mt-12 border-t border-ink/10 pb-4 pt-6 text-center text-[11px] text-ink-soft">
              <p className="font-semibold text-ink">
                {data?.restaurant?.name} · {data?.restaurant?.phone}
              </p>
              <p className="mt-1">Harga sudah termasuk pajak {data?.tax_percent}% dan layanan {data?.service_percent}%.</p>
            </footer>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <CartPanel onCheckout={handleCheckout} />
            </div>
          </aside>
        </div>
      </main>

      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 p-3 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                {itemCount} item · {table?.name || 'Meja'}
              </p>
              <p className="font-display text-lg font-semibold leading-tight">{formatCurrency(total)}</p>
            </div>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="btn-brand px-5"
            >
              <ShoppingBag className="size-4" /> Lihat Pesanan
            </button>
          </div>
        </div>
      )}

      <Modal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title="Pesanan Anda"
        size="sm"
        bodyClassName="p-0"
      >
        <CartPanel
          onCheckout={handleCheckout}
          onClose={() => setCartOpen(false)}
          className="!rounded-none !border-0 !shadow-none"
        />
      </Modal>

      {selectedMenu && (
        <MenuDetailModal
          menu={selectedMenu}
          open
          onClose={() => setSelectedMenu(null)}
        />
      )}
    </div>
  )
}
