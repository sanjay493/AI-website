import Link from "next/link";
import { AuthNav } from "@/components/auth-nav";
import { categories } from "@/lib/content";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          AI Signal
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <AuthNav />
          <Link
            href="/blog"
            className="hover:text-violet-600 dark:hover:text-violet-400"
          >
            Blog
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="hover:text-violet-600 dark:hover:text-violet-400"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
