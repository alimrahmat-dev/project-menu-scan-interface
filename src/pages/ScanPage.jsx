import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import {
  ArrowLeft,
  Camera,
  KeyRound,
  Loader2,
  QrCode,
  RefreshCw,
  ScanLine,
  Sparkles,
} from 'lucide-react'
import Logo from '../components/Logo'
import { useToast } from '../context/toast'
import { api } from '../lib/api'

const READER_ID = 'menu-qr-reader'
const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

function extractToken(text) {
  if (!text) return null

  const trimmed = text.trim()

  try {
    const url = new URL(trimmed)
    const match = url.pathname.match(/\/t\/([0-9a-f-]{36})/i)
    if (match) return match[1]
  } catch {
    // Bukan URL, lanjut cek token mentah.
  }

  if (UUID_PATTERN.test(trimmed)) {
    return trimmed.match(UUID_PATTERN)[0]
  }

  return null
}

export default function ScanPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const scannerRef = useRef(null)
  const resolvedRef = useRef(false)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [manualValue, setManualValue] = useState('')
  const [demoLoading, setDemoLoading] = useState(false)

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current
    scannerRef.current = null

    if (!scanner) return

    try {
      if (scanner.isScanning) {
        await scanner.stop()
      }
    } catch {
      // Abaikan error saat menghentikan kamera.
    }

    try {
      scanner.clear()
    } catch {
      // Elemen mungkin sudah dilepas dari DOM.
    }
  }, [])

  const handleDecoded = useCallback(
    (decodedText) => {
      if (resolvedRef.current) return

      const token = extractToken(decodedText)

      if (!token) {
        setErrorMessage('QR code ini bukan QR meja Rasa Nusantara. Coba pindai QR yang lain.')
        return
      }

      resolvedRef.current = true
      stopScanner().then(() => navigate(`/t/${token}`))
    },
    [navigate, stopScanner],
  )

  const startScanner = useCallback(async () => {
    if (scannerRef.current) return

    setStatus('starting')
    setErrorMessage('')

    const scanner = new Html5Qrcode(READER_ID, { verbose: false })
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.68)
            return { width: size, height: size }
          },
          aspectRatio: 1,
        },
        handleDecoded,
        () => {},
      )

      setStatus('scanning')
    } catch (error) {
      scannerRef.current = null
      setStatus('error')
      setErrorMessage(
        error?.message?.includes('NotAllowed')
          ? 'Akses kamera ditolak. Izinkan kamera pada browser, lalu coba lagi.'
          : 'Kamera tidak dapat diakses pada perangkat ini. Anda masih bisa memasukkan tautan QR secara manual.',
      )

      try {
        scanner.clear()
      } catch {
        // Abaikan.
      }
    }
  }, [handleDecoded])

  useEffect(() => {
    startScanner()

    return () => {
      stopScanner()
    }
    // Scanner hanya diinisialisasi sekali saat halaman dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleManualSubmit = (event) => {
    event.preventDefault()

    const token = extractToken(manualValue)

    if (!token) {
      toast.error('Tautan atau kode QR tidak valid. Pastikan Anda menyalin tautan lengkap dari QR meja.')
      return
    }

    navigate(`/t/${token}`)
  }

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

  const handleRetry = async () => {
    await stopScanner()
    resolvedRef.current = false
    startScanner()
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-ink/5 bg-cream/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link to="/" className="btn-ghost">
            <ArrowLeft className="size-4" /> Beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:py-12">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
                <ScanLine className="size-4.5" />
              </span>
              <div>
                <h1 className="font-display text-base font-semibold leading-tight">Pindai QR Meja</h1>
                <p className="text-[11px] text-ink-soft">Arahkan kamera ke QR di meja Anda</p>
              </div>
            </div>
            <span
              className={`chip ${
                status === 'scanning'
                  ? 'bg-emerald-100 text-emerald-700'
                  : status === 'starting'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-stone-100 text-stone-600'
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  status === 'scanning'
                    ? 'animate-pulse bg-emerald-500'
                    : status === 'starting'
                      ? 'bg-amber-500'
                      : 'bg-stone-400'
                }`}
              />
              {status === 'scanning' ? 'Kamera aktif' : status === 'starting' ? 'Menyiapkan' : 'Kamera nonaktif'}
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-ink">
              <div id={READER_ID} className="qr-reader h-full w-full" />

              {status !== 'scanning' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink px-8 text-center text-cream">
                  {status === 'starting' ? (
                    <>
                      <Loader2 className="size-8 animate-spin text-sun" />
                      <p className="text-sm font-semibold">Menyiapkan kamera...</p>
                    </>
                  ) : (
                    <>
                      <span className="grid size-14 place-items-center rounded-2xl bg-white/10">
                        <Camera className="size-7 text-sun" />
                      </span>
                      <p className="text-sm font-semibold">Kamera belum bisa digunakan</p>
                      <p className="max-w-xs text-xs leading-relaxed text-cream/55">{errorMessage}</p>
                      <button type="button" onClick={handleRetry} className="btn-brand mt-2 px-5 py-2.5">
                        <RefreshCw className="size-4" /> Coba Lagi
                      </button>
                    </>
                  )}
                </div>
              )}

              {status === 'scanning' && (
                <>
                  <div className="pointer-events-none absolute inset-0 z-10">
                    <div className="absolute left-1/2 top-1/2 size-[62%] -translate-x-1/2 -translate-y-1/2">
                      <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-sun" />
                      <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 border-sun" />
                      <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-sun" />
                      <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-sun" />
                      <span className="absolute inset-x-2 top-1/2 h-0.5 animate-pulse bg-sun/80 shadow-[0_0_20px_4px_rgba(245,158,11,0.45)]" />
                    </div>
                  </div>
                  <p className="pointer-events-none absolute bottom-4 left-0 right-0 z-10 text-center text-[11px] font-semibold text-cream/80">
                    Posisikan QR di dalam kotak
                  </p>
                </>
              )}
            </div>

            <button type="button" onClick={handleDemo} disabled={demoLoading} className="btn-secondary mt-4 w-full">
              {demoLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Belum ada QR? Coba meja demo
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <span className="grid size-11 place-items-center rounded-2xl bg-leaf-soft text-leaf">
              <QrCode className="size-5" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold">Satu pindai, semua beres.</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              QR code di setiap meja sudah membawa informasi meja Anda. Tidak perlu membuat
              akun — cukup pilih menu, isi nama, dan bayar.
            </p>

            <ol className="mt-5 space-y-3">
              {[
                'Izinkan browser mengakses kamera.',
                'Arahkan kamera ke QR code di meja.',
                'Menu akan terbuka otomatis.',
              ].map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm text-ink-soft">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cream-dark text-[11px] font-bold text-ink">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
                <KeyRound className="size-4.5" />
              </span>
              <div>
                <h3 className="text-sm font-bold">Masukkan kode manual</h3>
                <p className="text-[11px] text-ink-soft">Tempel tautan QR atau token meja</p>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="mt-4 space-y-3">
              <input
                type="text"
                value={manualValue}
                onChange={(event) => setManualValue(event.target.value)}
                placeholder="http://localhost:5173/t/xxxxxxxx-..."
                className="field text-xs"
                aria-label="Tautan atau token QR meja"
              />
              <button type="submit" className="btn-primary w-full">
                Buka Menu Meja
              </button>
            </form>

            <p className="mt-3 text-[10px] leading-relaxed text-ink-soft">
              Kamera membutuhkan koneksi aman (HTTPS) atau localhost. Jika kamera tidak
              tersedia, gunakan tautan dari QR yang tertera pada struk/meja.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
