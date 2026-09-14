// Keep in sync with src/app/icon.svg. The seal is deliberately simple enough
// to hold together at favicon size: a speech form and a single Y monogram.
export function Mark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="mark-seal" x1="11" y1="7" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b3485c" />
          <stop offset="1" stopColor="#611827" />
        </linearGradient>
      </defs>
      <path
        d="M19 6h26c7.2 0 13 5.8 13 13v20c0 7.2-5.8 13-13 13H29.5L18.2 59c-1.4.9-3.2-.1-3.2-1.8V52C9.2 50.4 6 45.2 6 39V19C6 11.8 11.8 6 19 6Z"
        fill="url(#mark-seal)"
      />
      <path
        d="M20.5 18.5 32 31.2l11.5-12.7M32 31.2v15"
        fill="none"
        stroke="#f6ece3"
        strokeWidth="5.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M27.4 46.2h9.2" fill="none" stroke="#f6ece3" strokeWidth="2" strokeLinecap="round" opacity="0.72" />
    </svg>
  );
}
