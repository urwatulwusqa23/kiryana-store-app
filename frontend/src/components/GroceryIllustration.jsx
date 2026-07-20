/* Original flat-vector "grocery bag bursting with items" illustration, drawn to match
   the app's spice-market palette. Not a traced/copied asset — hand-built from primitives. */
export default function GroceryIllustration({ className }) {
  return (
    <svg viewBox="0 0 400 400" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* bag */}
      <path d="M120 190 L280 190 L296 380 Q296 392 284 392 L116 392 Q104 392 104 380 Z"
        fill="#e8caa0" stroke="#2c2416" strokeWidth="3" strokeLinejoin="round" />
      <path d="M120 190 L124 220 L276 220 L280 190 Z" fill="#dcb887" stroke="#2c2416" strokeWidth="3" strokeLinejoin="round" />
      <path d="M150 190 Q150 155 200 155 Q250 155 250 190" fill="none" stroke="#2c2416" strokeWidth="3" strokeLinecap="round" />

      {/* carrot */}
      <g transform="translate(170 140) rotate(-12)">
        <path d="M0 0 L-10 78 Q-6 92 0 92 Q6 92 10 78 Z" fill="#e0a72c" stroke="#2c2416" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M-6 0 L-16 -22 M0 0 L0 -26 M6 0 L16 -22" stroke="#4c7a41" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* apple */}
      <g transform="translate(230 130)">
        <circle cx="0" cy="16" r="26" fill="#c1392b" stroke="#2c2416" strokeWidth="2.5" />
        <path d="M0 -10 Q3 -22 -6 -28" fill="none" stroke="#2c2416" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="10" cy="-24" rx="9" ry="5" fill="#4c7a41" stroke="#2c2416" strokeWidth="2" transform="rotate(30 10 -24)" />
      </g>

      {/* milk carton */}
      <g transform="translate(115 118)">
        <path d="M-18 -30 L18 -30 L18 30 L-18 30 Z M-18 -30 L0 -42 L18 -30" fill="#faf4e6" stroke="#2c2416" strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="-14" y="-8" width="28" height="14" fill="#4a7d94" opacity="0.85" />
      </g>

      {/* fish */}
      <g transform="translate(300 150) rotate(8)">
        <path d="M-30 0 Q-10 -20 20 0 Q-10 20 -30 0 Z" fill="#4a7d94" stroke="#2c2416" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M20 0 L34 -10 L34 10 Z" fill="#4a7d94" stroke="#2c2416" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="-18" cy="-2" r="2.4" fill="#2c2416" />
      </g>

      {/* chili */}
      <g transform="translate(90 165) rotate(20)">
        <path d="M0 0 Q26 6 30 26 Q31 34 24 34 Q6 30 0 10 Z" fill="#c1392b" stroke="#2c2416" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M0 0 Q-8 -8 -4 -16" fill="none" stroke="#4c7a41" strokeWidth="3.5" strokeLinecap="round" />
      </g>

      {/* bread loaf */}
      <g transform="translate(200 250)">
        <path d="M-40 20 Q-40 -14 0 -14 Q40 -14 40 20 Z" fill="#e0a72c" stroke="#2c2416" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M-24 -4 Q-20 -10 -14 -4 M-6 -6 Q-2 -13 4 -6 M14 -4 Q18 -10 24 -4" fill="none" stroke="#2c2416" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* banana */}
      <g transform="translate(255 265)">
        <path d="M-20 14 Q-14 -18 14 -22 Q22 -22 20 -14 Q6 -10 0 12 Q-4 22 -18 22 Q-24 20 -20 14 Z"
          fill="#e0a72c" stroke="#2c2416" strokeWidth="2.5" strokeLinejoin="round" />
      </g>

      {/* lemon (top right, falling in) */}
      <g transform="translate(330 90)">
        <ellipse cx="0" cy="0" rx="16" ry="13" fill="#e0a72c" stroke="#2c2416" strokeWidth="2.5" />
      </g>

      {/* sausage/salami top right */}
      <g transform="translate(355 60) rotate(-30)">
        <rect x="-8" y="-26" width="16" height="52" rx="8" fill="#c1392b" stroke="#2c2416" strokeWidth="2.5" />
      </g>

      {/* small tag/leaf accents */}
      <circle cx="140" cy="80" r="4" fill="#4c7a41" opacity="0.6" />
      <circle cx="310" cy="230" r="5" fill="#e0a72c" opacity="0.6" />
      <circle cx="70" cy="230" r="4" fill="#c1392b" opacity="0.5" />
    </svg>
  )
}
