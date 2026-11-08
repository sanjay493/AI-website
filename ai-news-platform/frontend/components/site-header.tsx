import Image from "next/image";
import Link from "next/link";
import { AuthNav } from "@/components/auth-nav";
import { getCourseUrl } from "@/lib/site-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          <Image
            src="/icon.png"
            alt=""
            width={28}
            height={28}
            className="rounded-md"
            priority
          />
          AI Signal
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <Link href="/" className="hover:text-red-600 dark:hover:text-red-400">
            Trending videos
          </Link>
          <a href={getCourseUrl()} className="hover:text-cyan-700 dark:hover:text-cyan-400">
            Linux &amp; PowerShell course
          </a>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
