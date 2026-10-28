import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Armchair,
  ChartColumn,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Tags,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../context/auth'
import { useToast } from '../context/toast'
import { initials } from '../lib/format'

const NAV_ITEMS = [
  {
    to: '/admin',
    label: 'Ringkasan',
    description: 'Statistik & aktivitas',
    icon: LayoutDashboard,
    end: true,
  },
  { to: '/admin/orders', label: 'Pesanan', description: 'Antrean & pembayaran', icon: ClipboardList },
  { to: '/admin/menus', label: 'Menu', description: 'Hidangan & harga', icon: UtensilsCrossed },
  { to: '/admin/categories', label: 'Kategori', description: 'Kelompok menu', icon: Tags },
  { to: '/admin/tables', label: 'Meja & QR', description: 'QR code per meja', icon: Armchair },
]

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)

    try {
      await logout()
      toast.success('Anda telah keluar dari dashboard.')
      navigate('/admin/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 pb-6 pt-7">
        <Logo light to="/admin" />
      </div>

      <div className="mx-4 mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cream/45">
          <ChartColumn className="size-3.5 text-sun" /> Panel Restoran
        </div>
        <p className="mt-2 text-sm font-semibold text-cream">Rasa Nusantara</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-cream/50">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
          Operasional aktif
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cream/35">
          Menu Utama
        </p>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-start gap-3 rounded-2xl px-4 py-3 transition ${
                isActive
                  ? 'bg-white/10 text-cream shadow-inner'
                  : 'text-cream/60 hover:bg-white/5 hover:text-cream'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl transition ${
                    isActive ? 'bg-brand text-white' : 'bg-white/5 text-cream/60 group-hover:text-cream'
                  }`}
                >
                  <item.icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">{item.label}</span>
                  <span
                    className={`mt-0.5 block text-[10px] leading-tight ${
                      isActive ? 'text-cream/55' : 'text-cream/35 group-hover:text-cream/50'
                    }`}
                  >
                    {item.description}
                  </span>
                </span>
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-4">
          <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cream/35">
            Lainnya
          </p>
          <Link
            to="/"
            className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-cream/60 transition hover:bg-white/5 hover:text-cream"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/5 text-cream/60">
              <ExternalLink className="size-4" />
            </span>
            Lihat Situs Tamu
          </Link>
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-sm font-bold text-white">
            {initials(user?.name || 'Admin')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-cream">{user?.name || 'Admin'}</p>
            <p className="truncate text-[10px] text-cream/45">{user?.email || '-'}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-cream/50 transition hover:bg-white/10 hover:text-cream disabled:opacity-50"
            aria-label="Keluar dari dashboard"
            title="Keluar"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const location = useLocation()
  const [mobileMenuPath, setMobileMenuPath] = useState(null)
  const mobileOpen = mobileMenuPath === location.pathname
  const closeMobileMenu = () => setMobileMenuPath(null)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = mobileOpen ? 'hidden' : previous

    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 bg-ink lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={closeMobileMenu}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
          />
          <aside className="animate-fade-in relative h-full w-[19rem] max-w-[85vw] bg-ink shadow-2xl">
            <button
              type="button"
              onClick={closeMobileMenu}
              className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full text-cream/60 transition hover:bg-white/10 hover:text-cream"
              aria-label="Tutup menu"
            >
              <X className="size-4.5" />
            </button>
            <SidebarContent onNavigate={closeMobileMenu} />
          </aside>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/85 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between gap-3 px-4">
            <Logo compact to="/admin" />
            <span className="flex-1 truncate font-display text-sm font-semibold">Dashboard Admin</span>
            <button
              type="button"
              onClick={() => setMobileMenuPath(location.pathname)}
              className="btn-icon"
              aria-label="Buka menu navigasi"
            >
              <MenuIcon className="size-5" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
