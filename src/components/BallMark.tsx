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
      <g className="balon-interior" style={{ transformOrigin: "100px 100px" }}>
        {/* Pentágono central regular (vértice hacia arriba) */}
        <path
          d="M100 70 L128.5 90.7 L117.6 124.3 L82.4 124.3 L71.5 90.7 Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* 5 costuras, una por cada vértice, con simetría de 72° */}
        <path d="M100 70 L100 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M128.5 90.7 L178 74.7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M117.6 124.3 L148.2 166.3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M82.4 124.3 L51.8 166.3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M71.5 90.7 L22 74.7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
