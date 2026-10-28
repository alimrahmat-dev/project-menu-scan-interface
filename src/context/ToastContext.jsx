import { useCallback, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { ToastContext } from './toast'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const TONES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))

    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message, type = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`

      setToasts((current) => [...current.slice(-3), { id, message, type }])

      const timer = setTimeout(() => remove(id), 4200)
      timers.current.set(id, timer)
    },
    [remove],
  )

  const value = useMemo(
    () => ({
      toast: push,
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
      info: (message) => push(message, 'info'),
      remove,
    }),
    [push, remove],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || Info

          return (
            <div
              key={toast.id}
              className={`animate-fade-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg shadow-ink/5 backdrop-blur ${TONES[toast.type] || TONES.info}`}
            >
              <Icon className="mt-0.5 size-5 shrink-0" />
              <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
              <button
                type="button"
                onClick={() => remove(toast.id)}
                className="rounded-full p-1 transition hover:bg-black/5"
                aria-label="Tutup notifikasi"
              >
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
