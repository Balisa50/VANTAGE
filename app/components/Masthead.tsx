import Link from "next/link";
import SearchBar from "./SearchBar";

export default function Masthead() {
  return (
    <header className="relative border-b border-border" style={{ zIndex: 50, overflow: "visible" }}>
      <div className="absolute inset-0 hero-glow pointer-events-none overflow-hidden" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="text-center mb-3">
          <Link href="/" className="inline-block">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight text-text-primary">
              VANTAGE
            </h1>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green pulse-dot" />
          <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-accent-amber font-mono">
            Live
          </p>
        </div>

        <p className="text-xs sm:text-sm text-text-secondary font-sans tracking-wide max-w-lg mx-auto leading-relaxed text-center">
          The sharpest lens on global tech. AI-powered analysis from six continents, published the moment stories break.
        </p>

        <div className="mt-5 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
          <nav className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/briefing"
              className="text-xs font-mono text-text-secondary hover:text-accent-amber transition-colors tracking-wider uppercase"
            >
              Briefing
            </Link>
            <Link
              href="/trending"
              className="text-xs font-mono text-text-secondary hover:text-accent-amber transition-colors tracking-wider uppercase"
            >
              Trending
            </Link>
            <Link
              href="/saved"
              className="text-xs font-mono text-text-secondary hover:text-accent-amber transition-colors tracking-wider uppercase"
            >
              Saved
            </Link>
            <Link
              href="/about"
              className="text-xs font-mono text-text-secondary hover:text-accent-amber transition-colors tracking-wider uppercase"
            >
              How it works
            </Link>
          </nav>
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
