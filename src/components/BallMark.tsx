type BallMarkProps = {
  className?: string;
};

export function BallMark({ className }: BallMarkProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M100 54 L128 76 L117 112 L83 112 L72 76 Z"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path d="M100 54 L100 20" stroke="currentColor" strokeWidth="2.5" />
      <path d="M128 76 L160 64" stroke="currentColor" strokeWidth="2.5" />
      <path d="M117 112 L140 148" stroke="currentColor" strokeWidth="2.5" />
      <path d="M83 112 L60 148" stroke="currentColor" strokeWidth="2.5" />
      <path d="M72 76 L40 64" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
