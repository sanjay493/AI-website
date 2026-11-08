import { NewsletterForm } from "@/components/newsletter-form";
import { COURSE_NAME, getCourseUrl } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              AI Signal
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Trending AI and tech videos from YouTube, refreshed automatically. Video titles,
              thumbnails and content belong to their creators and open on YouTube.
            </p>
            <p className="mt-4 text-sm">
              <a
                href={getCourseUrl()}
                className="font-medium text-cyan-700 hover:text-cyan-600 dark:text-cyan-400"
              >
                Free course: {COURSE_NAME} →
              </a>
            </p>
          </div>
          <NewsletterForm />
        </div>
        <p className="mt-10 text-xs text-zinc-500 dark:text-zinc-500">
          © {new Date().getFullYear()} AI Signal · agentweekly.in
        </p>
      </div>
    </footer>
  );
}
