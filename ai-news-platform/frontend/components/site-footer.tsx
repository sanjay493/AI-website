import { NewsletterForm } from "@/components/newsletter-form";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              AI Signal
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Curated AI news, articles, tutorials, and trend notes — built as a
              clean Next.js boilerplate you can wire to your backend later.
            </p>
          </div>
          <NewsletterForm />
        </div>
        <p className="mt-10 text-xs text-zinc-500 dark:text-zinc-500">
          © {new Date().getFullYear()} AI Signal. Boilerplate frontend.
        </p>
      </div>
    </footer>
  );
}
