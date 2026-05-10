import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Page not found
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        That URL does not match a post or category in this boilerplate.
      </p>
      <p className="mt-10">
        <Link
          href="/"
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
        >
          Go home
        </Link>
      </p>
    </main>
  );
}
