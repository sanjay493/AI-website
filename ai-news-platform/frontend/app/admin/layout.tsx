import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[60vh] bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3 sm:gap-6 sm:px-6">
          <Link
            href="/admin"
            className="text-sm font-semibold text-zinc-900 hover:text-violet-600 dark:text-zinc-50 dark:hover:text-violet-400"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/articles"
            className="text-sm font-medium text-zinc-600 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400"
          >
            Articles
          </Link>
          <Link
            href="/blog"
            className="ml-auto text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
          >
            Live blog
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
          >
            Homepage
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
