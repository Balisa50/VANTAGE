import Link from "next/link";
import SearchBar from "./SearchBar";

export default function Masthead() {
  return (
    <header className="relative border-b border-border overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 hero-glow pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="text-center mb-3">
          <Link href="/" className="inline-block group">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight text-text-primary">
              <span className="bg-gradient-to-r from-text-primary via-accent-amber/80 to-text-primary bg-clip-text text-transparent bg-[length:200%_100%] group-hover:animate-[shimmer_2s_ease-in-out]">
                VANTAGE
              </span>
            </h1>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green pulse-dot" />
          <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-text-secondary font-mono">
            Live intelligence
          </p>
        </div>

        <p className="text-xs sm:text-sm text-text-secondary font-sans tracking-wide max-w-lg mx-auto leading-relaxed text-center">
          AI-analyzed tech news cross-referenced across news wires, Reddit, and
          HackerNews. Real-time. Global.
        </p>

        <div className="mt-5 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
          <nav className="flex items-center gap-3 sm:gap-4">
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
