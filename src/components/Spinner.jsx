import { Loader2 } from 'lucide-react'

export default function Spinner({ label = 'Memuat data...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}>
      <Loader2 className="size-7 animate-spin text-brand" />
      <p className="text-sm font-medium text-ink-soft">{label}</p>
    </div>
  )
}

export function FullPageLoader({ label = 'Menyiapkan halaman...' }) {
  return (
    <div className="grid min-h-screen place-items-center bg-cream">
      <div className="flex flex-col items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand text-white shadow-xl shadow-brand/25">
          <Loader2 className="size-7 animate-spin" />
        </span>
        <p className="text-sm font-semibold text-ink-soft">{label}</p>
      </div>
    </div>
  )
}
