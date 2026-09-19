import { cn } from "@/lib/utils";

export function AdminPageHero({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "admin-page-hero relative isolate overflow-hidden rounded-lg bg-[linear-gradient(110deg,#18181b_20%,#193d38_100%)] px-5 py-6 text-white sm:px-6",
        className,
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-teal-200">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {title}
          </h2>
          <div className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
            {description}
          </div>
        </div>
        {action ? (
          <div className="flex shrink-0 flex-wrap gap-2 [&_button]:rounded-lg [&_button]:border-0 [&_button]:bg-white [&_button]:text-zinc-900 [&_button]:shadow-none">{action}</div>
        ) : null}
      </div>
    </section>
  );
}
