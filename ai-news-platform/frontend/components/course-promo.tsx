import { COURSE_NAME, getCourseUrl } from "@/lib/site-config";

const MODULES = [
  { days: "1–5", title: "Command-line fundamentals" },
  { days: "6–10", title: "System administration" },
  { days: "11–15", title: "Networking & troubleshooting" },
  { days: "16–20", title: "Security, logs & monitoring" },
  { days: "21–25", title: "Scripting & automation" },
  { days: "26–30", title: "Professional operations & capstone" },
];

/** Promotes the free course, which is hosted separately (GitHub Pages / learn.agentweekly.in). */
export function CoursePromo() {
  const url = getCourseUrl();
  return (
    <section
      aria-labelledby="course-heading"
      className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-slate-900 to-cyan-900 p-6 text-slate-100 shadow-sm sm:p-10 dark:border-cyan-900/60"
    >
      <p className="font-mono text-sm text-cyan-300">&gt;_ Free course</p>
      <h2 id="course-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        {COURSE_NAME}
      </h2>
      <p className="mt-3 max-w-2xl text-slate-300">
        30 days from beginner to advanced IT professional: Bash and PowerShell side by side,
        with hands-on labs, quizzes and downloadable PDF handbooks. New lessons every night at
        22:00 IST.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <li
            key={m.days}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
          >
            <span className="block text-xs text-cyan-300">Days {m.days}</span>
            {m.title}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href={url}
          className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Start the course
        </a>
        <a
          href={`${url.replace(/\/$/, "")}/downloads/`}
          className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
        >
          Download the handbook
        </a>
      </div>
    </section>
  );
}
