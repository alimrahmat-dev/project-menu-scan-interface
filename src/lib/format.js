const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function formatCurrency(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return 'Rp 0'
  }

  return currencyFormatter.format(number)
}

export function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value) || 0)
}

export function formatDateTime(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDate(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatTime(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function formatToday() {
  return formatDate(new Date())
}

export function getTimeGreeting() {
  const hour = new Date().getHours()

  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'

  return 'Selamat malam'
}

export function getCurrentYear() {
  return new Date().getFullYear()
}
