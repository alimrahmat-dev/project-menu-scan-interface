import { useState } from 'react'
import { UtensilsCrossed } from 'lucide-react'

export default function MenuImage({ src, alt = '', className = '', emoji = '🍽️' }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const failed = !src || failedSrc === src

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-cream-dark via-sand to-cream ${className}`}
        aria-hidden="true"
      >
        <span className="text-4xl drop-shadow-sm">{emoji}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={className}
    />
  )
}

export function AvatarImage({ src, alt = '', className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const failed = !src || failedSrc === src

  if (failed) {
    return (
      <div className={`grid place-items-center bg-cream-dark text-ink-soft ${className}`}>
        <UtensilsCrossed className="size-5" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailedSrc(src)}
      className={`object-cover ${className}`}
    />
  )
}
