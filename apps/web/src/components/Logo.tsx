interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function Logo({ width = 36, height = 36, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="group cursor-pointer select-none"
      >
        <defs>
          {/* Unifying colors from the Landing Page */}
          <linearGradient id="logo-m-grad-orange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="logo-m-grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="logo-m-grad-mix" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        <style>{`
          .logo-page {
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
            transform-origin: center center;
          }
          .group:hover .logo-page-left {
            transform: translate3d(-4px, -2px, 0) rotate(-6deg);
          }
          .group:hover .logo-page-right {
            transform: translate3d(4px, -2px, 0) rotate(6deg);
          }
          .group:hover .logo-page-center-1 {
            transform: translate3d(-1px, -4px, 0) scaleY(1.05);
          }
          .group:hover .logo-page-center-2 {
            transform: translate3d(1px, -4px, 0) scaleY(1.05);
          }
        `}</style>

        {/* Outer Shadow / Glow backing */}
        <circle cx="50" cy="50" r="42" fill="rgba(255,255,255,0.02)" />

        {/* 3D Layered Letter 'M' Pages */}
        {/* Left cover/stroke of M (peeling book page style) */}
        <path
          className="logo-page logo-page-left"
          d="M20 25C20 22.2386 22.2386 20 25 20H40C41.1046 20 42 20.8954 42 22V78C42 79.1046 41.1046 80 40 80H25C22.2386 80 20 77.7614 20 75V25Z"
          fill="url(#logo-m-grad-orange)"
          opacity="0.9"
        />

        {/* Right cover/stroke of M */}
        <path
          className="logo-page logo-page-right"
          d="M80 25C80 22.2386 77.7614 20 75 20H60C58.8954 20 58 20.8954 58 22V78C58 79.1046 58.8954 80 60 80H75C77.7614 80 80 77.7614 80 75V25Z"
          fill="url(#logo-m-grad-blue)"
          opacity="0.9"
        />

        {/* Middle diagonals of M (overlapping, curving sheets) */}
        <path
          className="logo-page logo-page-center-1"
          d="M42 22C42 20.8954 43.1046 20.25 44 21L52 29C52.5523 29.5523 52.5523 30.4477 52 31L44 39C43.1046 39.75 42 39.1046 42 38V22Z"
          fill="url(#logo-m-grad-mix)"
          transform="matrix(1 0 0 1 0 0)"
        />
        
        {/* Overlapping sheets completing the M shape */}
        <path
          className="logo-page logo-page-center-1"
          d="M38 25L50 48L44 80H38V25Z"
          fill="url(#logo-m-grad-orange)"
          opacity="0.8"
        />
        <path
          className="logo-page logo-page-center-2"
          d="M62 25L50 48L56 80H62V25Z"
          fill="url(#logo-m-grad-blue)"
          opacity="0.8"
        />

        {/* Core Spine accent */}
        <line x1="50" y1="22" x2="50" y2="78" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      </svg>
      <span className="text-lg tracking-widest font-serif font-semibold text-[#fafafa] select-none">
        MINI<span className="text-[#fb923c] font-bold">S</span>ERIES
      </span>
    </div>
  );
}
