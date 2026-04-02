import Link from "next/link";
import SearchBar from "./SearchBar";

export default function Masthead() {
  return (
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center mb-3">
          <Link href="/" className="inline-block">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight text-text-primary">
              VANTAGE
            </h1>
          </Link>
        </div>
        <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-text-secondary font-sans text-center">
          AI-powered tech intelligence
        </p>
        <p className="mt-2 text-xs sm:text-sm text-text-secondary font-sans tracking-wide max-w-xl mx-auto leading-relaxed text-center">
          Every story cross-referenced across news wires, Reddit, and
          HackerNews. No editors. No agenda. Just signal.
        </p>

        <div className="mt-4 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
          <nav className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/about"
              className="text-xs font-mono text-text-secondary hover:text-accent-amber transition-colors tracking-wider uppercase"
            >
              About
            </Link>
            <span className="text-border">|</span>
            <Link
              href="/feed.xml"
              className="text-xs font-mono text-text-secondary hover:text-accent-amber transition-colors tracking-wider uppercase"
            >
              RSS
            </Link>
          </nav>
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
