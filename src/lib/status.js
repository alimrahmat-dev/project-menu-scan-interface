export const ORDER_STATUS_META = {
  pending: {
    label: 'Menunggu Konfirmasi',
    short: 'Menunggu',
    tone: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  confirmed: {
    label: 'Dikonfirmasi',
    short: 'Dikonfirmasi',
    tone: 'bg-sky-100 text-sky-800',
    dot: 'bg-sky-500',
  },
  preparing: {
    label: 'Sedang Disiapkan',
    short: 'Disiapkan',
    tone: 'bg-orange-100 text-orange-800',
    dot: 'bg-orange-500',
  },
  ready: {
    label: 'Siap Disajikan',
    short: 'Siap',
    tone: 'bg-violet-100 text-violet-800',
    dot: 'bg-violet-500',
  },
  completed: {
    label: 'Selesai',
    short: 'Selesai',
    tone: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Dibatalkan',
    short: 'Dibatalkan',
    tone: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
}

export const PAYMENT_STATUS_META = {
  unpaid: {
    label: 'Belum Dibayar',
    tone: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  pending: {
    label: 'Menunggu Pembayaran',
    tone: 'bg-sky-100 text-sky-800',
    dot: 'bg-sky-500',
  },
  paid: {
    label: 'Lunas',
    tone: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
  },
  failed: {
    label: 'Pembayaran Gagal',
    tone: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
  expired: {
    label: 'Kedaluwarsa',
    tone: 'bg-stone-200 text-stone-700',
    dot: 'bg-stone-500',
  },
  refunded: {
    label: 'Dikembalikan',
    tone: 'bg-indigo-100 text-indigo-800',
    dot: 'bg-indigo-500',
  },
}

export const PAYMENT_METHODS = [
  {
    id: 'qris',
    label: 'QRIS',
    description: 'Scan sekali, semua bank & e-wallet',
    icon: 'qris',
  },
  {
    id: 'ewallet',
    label: 'E-Wallet',
    description: 'GoPay, ShopeePay, dan lainnya',
    icon: 'wallet',
  },
  {
    id: 'va',
    label: 'Virtual Account',
    description: 'Transfer bank otomatis terverifikasi',
    icon: 'bank',
  },
  {
    id: 'cash',
    label: 'Bayar di Kasir',
    description: 'Bayar tunai saat pesanan diantar',
    icon: 'cash',
  },
]

export const PAYMENT_METHOD_LABELS = PAYMENT_METHODS.reduce((acc, method) => {
  acc[method.id] = method.label
  return acc
}, {})

export const ORDER_TIMELINE = ['pending', 'confirmed', 'preparing', 'ready', 'completed']

export const orderStatusMeta = (status) =>
  ORDER_STATUS_META[status] || {
    label: status || '-',
    short: status || '-',
    tone: 'bg-stone-100 text-stone-700',
    dot: 'bg-stone-400',
  }

export const paymentStatusMeta = (status) =>
  PAYMENT_STATUS_META[status] || {
    label: status || '-',
    tone: 'bg-stone-100 text-stone-700',
    dot: 'bg-stone-400',
  }
