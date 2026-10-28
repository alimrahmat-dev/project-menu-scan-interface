import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  Landmark,
  Leaf,
  Loader2,
  MapPin,
  Phone,
  QrCode,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import Logo from '../components/Logo'
import MenuImage from '../components/MenuImage'
import { useToast } from '../context/toast'
import { api } from '../lib/api'
import { formatCurrency, getCurrentYear } from '../lib/format'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=85'

const STEPS = [
  {
    icon: ScanLine,
    title: 'Pindai QR di meja',
    description:
      'Buka kamera ponsel, arahkan ke QR code yang tertempel di meja. Menu langsung terbuka tanpa perlu install aplikasi.',
  },
  {
    icon: ShoppingBag,
    title: 'Pilih & pesan',
    description:
      'Jelajahi menu, tambahkan catatan khusus, lalu kirim pesanan. Dapur menerima pesanan Anda secara real-time.',
  },
  {
    icon: CreditCard,
    title: 'Bayar dari meja',
    description:
      'Selesaikan pembayaran lewat QRIS, e-wallet, atau virtual account. Struk digital tersimpan otomatis.',
  },
]

const PAYMENT_BADGES = [
  { icon: QrCode, label: 'QRIS' },
  { icon: Wallet, label: 'GoPay' },
  { icon: Smartphone, label: 'ShopeePay' },
  { icon: Landmark, label: 'Virtual Account' },
  { icon: Banknote, label: 'Tunai' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [featured, setFeatured] = useState([])
  const [demoLoading, setDemoLoading] = useState(false)

  useEffect(() => {
    let active = true

    api
      .get('/menu')
      .then(({ data }) => {
        if (active) setFeatured((data.featured || []).slice(0, 4))
      })
      .catch(() => {
        if (active) setFeatured([])
      })

    return () => {
      active = false
    }
  }, [])

  const handleDemo = async () => {
    setDemoLoading(true)

    try {
      const { data } = await api.get('/demo-table')
      navigate(`/t/${data.data.qr_token}`)
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          'Meja demo belum tersedia. Jalankan seeder backend terlebih dahulu.',
      )
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-cream">
      <header className="sticky top-0 z-40 border-b border-ink/5 bg-cream/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-8 text-sm font-semibold text-ink-soft lg:flex">
            <a href="#cara-kerja" className="transition hover:text-ink">
              Cara Kerja
            </a>
            <a href="#menu" className="transition hover:text-ink">
              Menu
            </a>
            <a href="#pembayaran" className="transition hover:text-ink">
              Pembayaran
            </a>
            <a href="#restoran" className="transition hover:text-ink">
              Untuk Restoran
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/scan" className="btn-secondary hidden sm:inline-flex">
              <ScanLine className="size-4" /> Scan QR
            </Link>
            <Link to="/admin" className="btn-primary px-5 py-2.5">
              Dashboard <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="pointer-events-none absolute -left-32 top-10 size-96 rounded-full bg-brand/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-sun/15 blur-3xl" />

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:pb-28 lg:pt-20">
            <div className="relative z-10 animate-fade-up">
              <span className="section-eyebrow">
                <Sparkles className="size-3.5" /> QR Menu & Self Ordering
              </span>

              <h1 className="mt-6 max-w-2xl font-display text-[2.7rem] font-semibold leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-[4.2rem]">
                Pesan makanan favorit,{' '}
                <span className="relative whitespace-nowrap italic text-brand">
                  tanpa menunggu
                  <svg
                    viewBox="0 0 300 12"
                    className="absolute -bottom-2 left-0 h-3 w-full text-brand/30"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 8c60-6 120-6 180-2s80 2 116-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{' '}
                pelayan.
              </h1>

              <p className="mt-7 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
                Pindai QR di meja, jelajahi menu, dan bayar langsung dari ponsel. Pesanan
                masuk ke dapur dalam hitungan detik — pengalaman makan yang lebih tenang
                untuk tamu, lebih efisien untuk restoran.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button type="button" onClick={handleDemo} className="btn-brand px-7 py-3.5 text-[15px]" disabled={demoLoading}>
                  {demoLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UtensilsCrossed className="size-4" />
                  )}
                  Coba Demo Langsung
                </button>
                <Link to="/scan" className="btn-secondary px-6 py-3.5 text-[15px]">
                  <ScanLine className="size-4" /> Pindai QR Meja
                </Link>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs font-semibold text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex text-sun">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star key={star} className="size-3.5 fill-current" />
                    ))}
                  </span>
                  4.9 dari 1.200+ tamu
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-leaf" /> Pembayaran aman
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-brand" /> Tanpa antre
                </span>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative mx-auto w-full max-w-lg animate-fade-up lg:max-w-none" style={{ animationDelay: '120ms' }}>
              <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-tr from-brand/15 via-transparent to-sun/20 blur-2xl" />

              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-ink shadow-2xl shadow-ink/25">
                <img
                  src={HERO_IMAGE}
                  alt="Hidangan Nusantara di atas meja"
                  className="h-[420px] w-full object-cover sm:h-[480px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />

                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-cream/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-ink backdrop-blur">
                  <span className="size-1.5 rounded-full bg-leaf" /> Meja 07 · Siap pesan
                </div>

                <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
                  <div className="flex items-center gap-3">
                    <MenuImage
                      src={featured[0]?.image_url}
                      alt={featured[0]?.name || 'Menu favorit'}
                      className="size-14 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand">
                        Rekomendasi hari ini
                      </p>
                      <p className="truncate font-display text-base font-semibold">
                        {featured[0]?.name || 'Nasi Goreng Kampung'}
                      </p>
                      <p className="text-xs font-semibold text-ink-soft">
                        {formatCurrency(featured[0]?.price || 38000)}
                      </p>
                    </div>
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-cream">
                      <ArrowRight className="size-4" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute -left-4 top-20 hidden animate-fade-up items-center gap-2 rounded-2xl border border-ink/5 bg-white px-4 py-3 shadow-xl shadow-ink/10 sm:flex" style={{ animationDelay: '400ms' }}>
                <span className="grid size-9 place-items-center rounded-full bg-leaf-soft text-leaf">
                  <CheckCircle2 className="size-4.5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                    Pembayaran
                  </p>
                  <p className="text-xs font-bold text-ink">Berhasil · Rp 101.200</p>
                </div>
              </div>

              <div className="absolute -bottom-5 -right-3 hidden rounded-2xl bg-ink p-4 text-cream shadow-2xl sm:block">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-white/10">
                    <QrCode className="size-6" />
                  </span>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cream/50">
                      Scan me
                    </p>
                    <p className="font-display text-sm font-semibold">Menu di meja Anda</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="grid gap-4 rounded-3xl bg-ink px-6 py-7 text-cream sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
              {[
                ['< 30 detik', 'Pesanan langsung masuk dapur'],
                ['3 metode', 'QRIS, e-wallet, virtual account'],
                ['0 install', 'Cukup buka lewat browser'],
                ['1 dashboard', 'Pantau menu, meja, dan omzet'],
              ].map(([value, label]) => (
                <div key={value} className="flex items-center gap-3">
                  <span className="size-1.5 rounded-full bg-sun" />
                  <div>
                    <p className="font-display text-lg font-semibold leading-tight">{value}</p>
                    <p className="text-[11px] text-cream/55">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cara kerja */}
        <section id="cara-kerja" className="border-y border-ink/5 bg-cream-dark/50 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <span className="section-eyebrow">Alur tanpa hambatan</span>
                <h2 className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                  Tiga langkah dari meja ke suapan pertama.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
                Dirancang untuk pengalaman tamu yang mulus sekaligus operasional restoran
                yang lebih rapi.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <div key={step.title} className="group relative card p-7 transition duration-300 hover:-translate-y-1">
                  <span className="absolute right-6 top-6 font-display text-5xl font-semibold text-ink/[0.06]">
                    0{index + 1}
                  </span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white">
                    <step.icon className="size-5.5" />
                  </span>
                  <h3 className="mt-6 font-display text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Menu */}
        <section id="menu" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="section-eyebrow">
                  <Leaf className="size-3.5" /> Dari dapur kami
                </span>
                <h2 className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                  Hidangan yang bikin kembali lagi.
                </h2>
              </div>
              <button type="button" onClick={handleDemo} className="btn-secondary self-start sm:self-auto">
                Lihat menu lengkap <ArrowRight className="size-4" />
              </button>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(featured.length > 0 ? featured : Array.from({ length: 4 })).map((menu, index) => (
                <div
                  key={menu?.id || index}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_20px_50px_-40px_rgba(33,27,22,0.5)]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <MenuImage
                      src={menu?.image_url}
                      alt={menu?.name || 'Menu Rasa Nusantara'}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                    {menu?.badge && (
                      <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">
                        {menu.badge}
                      </span>
                    )}
                    <div className="absolute bottom-4 left-4 right-4 text-cream">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cream/60">
                        {menu?.category?.name || 'Signature'}
                      </p>
                      <h3 className="mt-1 font-display text-lg font-semibold leading-tight">
                        {menu?.name || 'Segera hadir'}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <span className="text-sm font-bold">{formatCurrency(menu?.price || 0)}</span>
                    <span className="text-[11px] text-ink-soft">{menu?.prep_time || 15} menit</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pembayaran */}
        <section id="pembayaran" className="relative overflow-hidden bg-ink py-20 text-cream lg:py-28">
          <div className="pointer-events-none absolute -right-32 top-0 size-96 rounded-full bg-brand/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 size-80 rounded-full bg-sun/10 blur-3xl" />

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-cream/15 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-sun">
                <ShieldCheck className="size-3.5" /> Pembayaran terintegrasi
              </span>
              <h2 className="mt-6 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                Bayar di meja.{' '}
                <span className="italic text-sun">Selesai dalam satu ketukan.</span>
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-cream/60 sm:text-base">
                Pilih metode favorit Anda. Untuk demo ini, pembayaran dapat disimulasikan
                langsung; untuk produksi, integrasi Midtrans Snap siap diaktifkan hanya
                dengan mengubah satu variabel lingkungan.
              </p>

              <div className="mt-8 flex flex-wrap gap-2.5">
                {PAYMENT_BADGES.map((badge) => (
                  <span
                    key={badge.label}
                    className="inline-flex items-center gap-2 rounded-xl border border-cream/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-cream/80"
                  >
                    <badge.icon className="size-4 text-sun" /> {badge.label}
                  </span>
                ))}
              </div>

              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                {[
                  'Konfirmasi pembayaran otomatis',
                  'Struk digital tanpa kertas',
                  'Refund & pembatalan terkontrol',
                  'Rekonsiliasi omzet harian',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-cream/70">
                    <span className="grid size-5 place-items-center rounded-full bg-leaf/40 text-cream">
                      <Check className="size-3" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute inset-0 -rotate-3 rounded-[2.5rem] border border-cream/10" />
              <div className="relative rotate-1 rounded-[2.5rem] border border-cream/10 bg-white p-6 text-ink shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-soft">
                    Total tagihan
                  </span>
                  <span className="chip bg-leaf-soft text-leaf">Lunas</span>
                </div>
                <p className="mt-3 font-display text-3xl font-semibold">Rp 101.200</p>
                <p className="mt-1 text-xs text-ink-soft">Pesanan RN-261026-A1B2C · Meja 07</p>

                <div className="my-6 border-t border-dashed border-ink/15" />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-soft">Metode</span>
                  <span className="inline-flex items-center gap-1.5 font-bold">
                    <QrCode className="size-4 text-brand" /> QRIS
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-ink-soft">Dibayar pada</span>
                  <span className="font-semibold">26 Okt 2026, 19.42</span>
                </div>

                <div className="mt-6 rounded-2xl bg-cream p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-leaf text-white">
                      <CheckCircle2 className="size-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold">Pembayaran berhasil</p>
                      <p className="text-[11px] text-ink-soft">Dapur sedang menyiapkan pesanan Anda.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-soft/70">
                  <ShieldCheck className="size-3.5" /> Secured by Midtrans
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Untuk restoran */}
        <section id="restoran" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-ink/10 bg-white p-8 sm:p-12 lg:p-16">
              <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-brand-soft" />
              <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  <span className="section-eyebrow">
                    <ChefHat className="size-3.5" /> Untuk pemilik restoran
                  </span>
                  <h2 className="mt-5 max-w-xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
                    Satu dashboard untuk menu, meja, pesanan, dan omzet.
                  </h2>
                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
                    Kelola seluruh operasional restoran tanpa ribet. Ubah harga, tandai menu
                    habis, cetak QR meja, dan pantau pesanan masuk secara langsung.
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link to="/admin" className="btn-primary">
                      Buka Dashboard Admin <ArrowUpRight className="size-4" />
                    </Link>
                    <Link to="/admin/login" className="btn-secondary">
                      Masuk dengan akun demo
                    </Link>
                  </div>

                  <p className="mt-4 text-[11px] text-ink-soft">
                    Demo: <span className="font-bold text-ink">admin@rasanusantara.id</span> ·{' '}
                    <span className="font-bold text-ink">password</span>
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: UtensilsCrossed, title: 'Manajemen menu', desc: 'Kategori, harga, foto, ketersediaan.' },
                    { icon: QrCode, title: 'QR per meja', desc: 'Cetak & atur ulang QR dalam sekali klik.' },
                    { icon: ShoppingBag, title: 'Pesanan real-time', desc: 'Pantau status dari dapur ke meja.' },
                    { icon: CreditCard, title: 'Rekap pembayaran', desc: 'Omzet harian dan menu terlaris.' },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
                      <span className="grid size-9 place-items-center rounded-xl bg-white text-brand shadow-sm">
                        <item.icon className="size-4.5" />
                      </span>
                      <p className="mt-3 text-sm font-bold">{item.title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/10 bg-cream-dark/50 pb-10 pt-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-soft">
                Cita rasa Indonesia, dipesan dalam sekali pindai. Dibuat untuk pengalaman
                bersantap yang lebih manusiawi.
              </p>
              <div className="mt-5 space-y-2 text-xs text-ink-soft">
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-brand" /> Jl. Cikini Raya No. 42, Jakarta Pusat
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-3.5 text-brand" /> +62 812 3456 7890
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="size-3.5 text-brand" /> Buka setiap hari, 10.00 – 22.00
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink">Untuk Tamu</p>
              <div className="mt-4 space-y-2.5 text-sm text-ink-soft">
                <Link to="/scan" className="block transition hover:text-brand">Scan QR Meja</Link>
                <button type="button" onClick={handleDemo} className="block transition hover:text-brand">Coba Demo</button>
                <a href="#menu" className="block transition hover:text-brand">Lihat Menu</a>
                <a href="#pembayaran" className="block transition hover:text-brand">Metode Pembayaran</a>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink">Untuk Restoran</p>
              <div className="mt-4 space-y-2.5 text-sm text-ink-soft">
                <Link to="/admin" className="block transition hover:text-brand">Dashboard</Link>
                <Link to="/admin/login" className="block transition hover:text-brand">Login Admin</Link>
                <a href="#restoran" className="block transition hover:text-brand">Fitur</a>
                <a href="#cara-kerja" className="block transition hover:text-brand">Cara Kerja</a>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink/10 pt-6 text-[11px] text-ink-soft sm:flex-row">
            <p>© {getCurrentYear()} Rasa Nusantara. Semua hak dilindungi.</p>
            <p className="inline-flex items-center gap-1.5">
              Dibangun dengan Laravel & React <span className="text-brand">•</span>{' '}
              <ShieldCheck className="size-3.5" /> Demo pembayaran aman
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
