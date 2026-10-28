export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink/15 bg-white/60 px-6 py-14 text-center ${className}`}
    >
      {Icon && (
        <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-cream-dark text-ink-soft">
          <Icon className="size-6" />
        </span>
      )}
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
