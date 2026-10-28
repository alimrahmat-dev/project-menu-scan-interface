import { ChefHat } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Logo({ to = '/', light = false, compact = false }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-3">
      <span className="relative grid size-11 place-items-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/25 transition group-hover:-rotate-3">
        <ChefHat className="size-6" strokeWidth={1.9} />
        <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-sun ring-2 ring-cream" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span
            className={`block font-display text-xl font-semibold tracking-tight ${light ? 'text-cream' : 'text-ink'}`}
          >
            Rasa Nusantara
          </span>
          <span
            className={`mt-1.5 block text-[9px] font-bold uppercase tracking-[0.3em] ${light ? 'text-cream/50' : 'text-ink-soft'}`}
          >
            Scan · Pesan · Bayar
          </span>
        </span>
      )}
    </Link>
  )
}
