export function CarPlaceholder({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 240"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="carGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="400" height="240" fill="url(#bgGrad)" />

      {/* Ground shadow */}
      <ellipse cx="200" cy="195" rx="130" ry="8" fill="#cbd5e1" opacity="0.5" />

      {/* Car body — main */}
      <rect x="60" y="130" width="280" height="55" rx="8" fill="url(#carGrad)" />

      {/* Car roof */}
      <path
        d="M120 130 Q140 85 175 80 L225 80 Q260 85 280 130 Z"
        fill="url(#carGrad)"
      />

      {/* Windshield */}
      <path
        d="M130 128 Q148 92 175 88 L225 88 Q252 92 270 128 Z"
        fill="#dde3ea"
        opacity="0.6"
      />

      {/* Left window */}
      <path
        d="M132 126 Q148 96 172 90 L197 90 L197 126 Z"
        fill="#dde3ea"
        opacity="0.5"
      />

      {/* Right window */}
      <path
        d="M268 126 Q252 96 228 90 L203 90 L203 126 Z"
        fill="#dde3ea"
        opacity="0.5"
      />

      {/* Front bumper */}
      <rect x="55" y="170" width="35" height="12" rx="4" fill="#94a3b8" />

      {/* Rear bumper */}
      <rect x="310" y="170" width="35" height="12" rx="4" fill="#94a3b8" />

      {/* Front headlight */}
      <rect x="62" y="148" width="22" height="10" rx="3" fill="#e2e8f0" opacity="0.9" />

      {/* Rear taillight */}
      <rect x="316" y="148" width="22" height="10" rx="3" fill="#94a3b8" opacity="0.7" />

      {/* Left wheel */}
      <circle cx="120" cy="187" r="22" fill="#64748b" />
      <circle cx="120" cy="187" r="13" fill="#94a3b8" />
      <circle cx="120" cy="187" r="5" fill="#64748b" />

      {/* Right wheel */}
      <circle cx="280" cy="187" r="22" fill="#64748b" />
      <circle cx="280" cy="187" r="13" fill="#94a3b8" />
      <circle cx="280" cy="187" r="5" fill="#64748b" />

      {/* Door line */}
      <line x1="200" y1="130" x2="200" y2="185" stroke="#94a3b8" strokeWidth="1.5" opacity="0.5" />

      {/* Door handle left */}
      <rect x="160" y="155" width="20" height="5" rx="2.5" fill="#94a3b8" opacity="0.7" />

      {/* Door handle right */}
      <rect x="220" y="155" width="20" height="5" rx="2.5" fill="#94a3b8" opacity="0.7" />
    </svg>
  )
}
