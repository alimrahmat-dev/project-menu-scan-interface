import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, ScanLine, UtensilsCrossed } from 'lucide-react'
import Logo from '../components/Logo'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-ink/5">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link to="/" className="btn-ghost !px-3 text-xs">
            <ArrowLeft className="size-4" /> Beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-3xl bg-brand-soft text-brand">
          <Compass className="size-7" />
        </span>
        <p className="mt-6 font-display text-6xl font-semibold text-ink/15">404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          Tautan yang Anda buka mungkin salah atau sudah dipindahkan. Kembali ke beranda atau
          pindai ulang QR di meja Anda.
        </p>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <Link to="/" className="btn-primary">
            <ArrowLeft className="size-4" /> Kembali ke Beranda
          </Link>
          <Link to="/scan" className="btn-secondary">
            <ScanLine className="size-4" /> Scan QR Meja
          </Link>
          <Link to="/admin" className="btn-ghost">
            <UtensilsCrossed className="size-4" /> Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
