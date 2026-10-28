import { orderStatusMeta, paymentStatusMeta } from '../lib/status'

export default function StatusBadge({ status, type = 'order', dot = true, className = '' }) {
  const meta = type === 'payment' ? paymentStatusMeta(status) : orderStatusMeta(status)

  return (
    <span className={`chip ${meta.tone} ${className}`}>
      {dot && <span className={`size-1.5 rounded-full ${meta.dot}`} />}
      {type === 'payment' ? meta.label : meta.label}
    </span>
  )
}
