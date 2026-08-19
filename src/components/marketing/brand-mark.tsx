interface BrandMarkProps {
  readonly compact?: boolean;
  readonly tone?: "light" | "dark";
}

export function BrandMark({ compact = false, tone = "light" }: BrandMarkProps) {
  return (
    <span className={`brand-mark brand-mark--${tone}`}>
      <svg
        aria-hidden="true"
        className="brand-mark__symbol"
        viewBox="0 0 42 42"
        fill="none"
      >
        <circle cx="21" cy="21" r="18.5" stroke="currentColor" />
        <circle cx="21" cy="21" r="7" stroke="currentColor" />
        <path d="M21 2.5V14M21 28v11.5M2.5 21H14M28 21h11.5" stroke="currentColor" />
        <path
          d="m9 9 7.1 7.1M25.9 25.9 33 33M33 9l-7.1 7.1M16.1 25.9 9 33"
          stroke="currentColor"
        />
        <circle cx="21" cy="21" r="2" fill="currentColor" />
      </svg>
      <span className="brand-mark__wordmark">
        OPS<span>Alchemy</span>
      </span>
      {!compact && (
        <span className="brand-mark__descriptor">Operations, transformed</span>
      )}
    </span>
  );
}
