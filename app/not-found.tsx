import Link from "next/link";
import { FaSearch } from "react-icons/fa";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-5 font-['Montserrat']">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 md:p-12 text-center shadow-2xl border border-[var(--color-border)]">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-[var(--color-gold)] text-4xl">
            <FaSearch />
          </div>
        </div>
        <h1 className="font-['Playfair_Display'] text-4xl text-[var(--color-text-main)] mb-2">
          Page Not Found
        </h1>
        <h2 className="text-xl text-[var(--color-gold)] font-bold tracking-widest uppercase mb-6">
          Error 404
        </h2>
        <p className="text-[var(--color-text-muted)] text-lg mb-10">
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
        </p>
        <Link href="/">
          <button className="px-10 py-4 rounded-full bg-[var(--color-gold)] text-white font-bold tracking-wider hover:bg-[var(--color-gold-hover)] transition-all shadow-md">
            Return to Homepage
          </button>
        </Link>
      </div>
    </div>
  );
}
