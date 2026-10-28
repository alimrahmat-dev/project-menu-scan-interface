import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../context/auth'
import { useToast } from '../context/toast'
import { getErrorMessage } from '../lib/api'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'

const DEMO = { email: 'admin@rasanusantara.id', password: 'password' }

export default function AdminLoginPage() {
  const { isAuthenticated, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!loading && isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await login(form.email.trim(), form.password)
      toast.success('Selamat datang kembali di dashboard Rasa Nusantara.')
      navigate(location.state?.from || '/admin', { replace: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Login gagal. Periksa kembali email dan password Anda.'))
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = () => {
    setForm(DEMO)
    setError('')
  }

  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-ink text-cream lg:flex lg:flex-col lg:justify-between">
        <img
          src={HERO_IMAGE}
          alt="Suasana restoran Rasa Nusantara"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/85 to-brand-dark/60" />

        <div className="relative z-10 p-10 xl:p-14">
          <Logo light />
        </div>

        <div className="relative z-10 max-w-xl p-10 xl:p-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-cream/15 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-sun backdrop-blur">
            <Sparkles className="size-3.5" /> Dashboard Restoran
          </span>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] xl:text-5xl">
            Kelola seluruh meja, menu, dan pesanan dari satu tempat.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-cream/60">
            Pantau pesanan masuk, perbarui status dapur, atur ketersediaan menu, dan cetak
            QR meja — semuanya real-time.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              'Pesanan pelanggan masuk otomatis',
              'QR meja siap cetak & bisa dibuat ulang',
              'Rekap omzet dan menu terlaris harian',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-cream/70">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-leaf/50 text-cream">
                  <Check className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-2 border-t border-white/10 px-10 py-6 text-[11px] text-cream/40 xl:px-14">
          <ShieldCheck className="size-3.5" /> Akses khusus staf restoran
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo />
            <Link to="/" className="btn-ghost !px-3 text-xs">
              <ArrowLeft className="size-4" /> Beranda
            </Link>
          </div>

          <div className="card p-7 sm:p-9">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/25">
              <LockKeyhole className="size-6" />
            </span>

            <h2 className="mt-6 font-display text-2xl font-semibold leading-tight sm:text-3xl">
              Masuk ke dashboard
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Gunakan akun staf yang sudah terdaftar untuk mengelola restoran.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label htmlFor="email" className="label">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="admin@rasanusantara.id"
                    autoComplete="email"
                    required
                    className="field !pl-10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="field !pl-10 !pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-soft transition hover:bg-cream-dark hover:text-ink"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium leading-relaxed text-red-700">
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-brand w-full !py-3.5">
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Memeriksa akun...
                  </>
                ) : (
                  <>
                    Masuk ke Dashboard <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-dashed border-ink/15 bg-cream/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
                    Akun demo
                  </p>
                  <p className="mt-1.5 text-xs font-semibold text-ink">{DEMO.email}</p>
                  <p className="text-xs text-ink-soft">
                    Password: <span className="font-semibold text-ink">{DEMO.password}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="btn-secondary shrink-0 !px-3 !py-2 text-[11px]"
                >
                  Isi otomatis
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-[11px] text-ink-soft">
            <ShieldCheck className="size-3.5 text-leaf" />
            Sesi admin diamankan dengan Laravel Sanctum
          </p>
        </div>
      </main>
    </div>
  )
}
