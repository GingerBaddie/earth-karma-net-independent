export function LeafSVG({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M50 5C50 5 20 25 15 55C10 85 40 95 50 95C60 95 90 85 85 55C80 25 50 5 50 5Z" fill="currentColor" opacity="0.08" />
      <path d="M50 15C50 15 50 95 50 95" stroke="currentColor" strokeWidth="1.5" opacity="0.1" />
      <path d="M50 35C40 30 30 35 25 45" stroke="currentColor" strokeWidth="1" opacity="0.08" />
      <path d="M50 55C60 50 70 55 75 65" stroke="currentColor" strokeWidth="1" opacity="0.08" />
    </svg>
  );
}

export function TreeSVG({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M60 10L20 70H40L15 110H50V140H70V110H105L80 70H100L60 10Z" fill="currentColor" opacity="0.06" />
      <path d="M55 110H65V145H55V110Z" fill="currentColor" opacity="0.08" />
    </svg>
  );
}

export function BranchSVG({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M0 40C30 40 50 20 80 25C110 30 100 50 130 45C160 40 170 20 200 30" stroke="currentColor" strokeWidth="2" opacity="0.06" />
      <circle cx="80" cy="25" r="8" fill="currentColor" opacity="0.05" />
      <circle cx="130" cy="45" r="6" fill="currentColor" opacity="0.04" />
      <circle cx="50" cy="30" r="5" fill="currentColor" opacity="0.04" />
      <circle cx="160" cy="35" r="7" fill="currentColor" opacity="0.05" />
    </svg>
  );
}

export function FloatingLeaves() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="absolute left-[5%] top-[10%] text-3xl opacity-[0.07] animate-float" style={{ animationDelay: "0s" }}>🍃</span>
      <span className="absolute right-[8%] top-[15%] text-2xl opacity-[0.06] animate-float" style={{ animationDelay: "1s" }}>🌿</span>
      <span className="absolute left-[15%] bottom-[20%] text-4xl opacity-[0.05] animate-float" style={{ animationDelay: "2s" }}>🌱</span>
      <span className="absolute right-[12%] bottom-[15%] text-3xl opacity-[0.06] animate-float" style={{ animationDelay: "0.5s" }}>🍂</span>
      <LeafSVG className="absolute -left-6 top-20 h-32 w-32 -rotate-45 text-primary" />
      <LeafSVG className="absolute -right-4 bottom-32 h-24 w-24 rotate-[30deg] text-accent" />
      <TreeSVG className="absolute left-[3%] bottom-0 h-40 w-40 text-primary" />
      <TreeSVG className="absolute right-[5%] bottom-0 h-32 w-32 text-eco-leaf" />
    </div>
  );
}

export function PageHeaderDecor() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent" />
      <BranchSVG className="absolute -right-10 top-4 h-20 w-60 text-primary" />
      <BranchSVG className="absolute -left-10 top-16 h-16 w-48 rotate-[10deg] text-accent" />
      <LeafSVG className="absolute right-[10%] top-8 h-16 w-16 rotate-12 text-primary" />
      <LeafSVG className="absolute left-[8%] top-12 h-12 w-12 -rotate-[20deg] text-eco-leaf" />
    </div>
  );
}

export function VineBorder({ side = "left" }: { side?: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 30 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none absolute ${side === "left" ? "left-0" : "right-0"} top-0 h-full w-8 text-primary opacity-[0.04]`}
      preserveAspectRatio="none"
    >
      <path d={side === "left"
        ? "M15 0C15 0 5 50 10 100C15 150 25 160 20 200C15 240 5 260 10 300C15 340 20 360 15 400"
        : "M15 0C15 0 25 50 20 100C15 150 5 160 10 200C15 240 25 260 20 300C15 340 10 360 15 400"
      } stroke="currentColor" strokeWidth="3" />
      <circle cx={side === "left" ? "10" : "20"} cy="100" r="4" fill="currentColor" />
      <circle cx={side === "left" ? "20" : "10"} cy="200" r="3" fill="currentColor" />
      <circle cx={side === "left" ? "10" : "20"} cy="300" r="5" fill="currentColor" />
    </svg>
  );
}
