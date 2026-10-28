import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  bodyClassName = '',
}) {
  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Tutup dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/50 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-scale-in relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${SIZES[size] || SIZES.md}`}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-6 py-5">
            <div>
              {title && <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>}
              {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-cream-dark hover:text-ink"
              aria-label="Tutup"
            >
              <X className="size-4.5" />
            </button>
          </div>
        )}
        <div className={`flex-1 overflow-y-auto px-6 py-5 ${bodyClassName}`}>{children}</div>
        {footer && <div className="border-t border-ink/10 bg-cream/60 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
