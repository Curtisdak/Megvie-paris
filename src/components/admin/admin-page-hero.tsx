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
        "admin-page-hero relative isolate overflow-hidden rounded-[1.65rem] bg-[linear-gradient(112deg,#0b0909_0%,#4a1905_47%,#063b2d_100%)] px-5 py-6 text-white shadow-[0_22px_55px_rgba(28,15,8,0.18)] sm:px-8 sm:py-7",
        className,
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-amber-300">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h2>
          <div className="mt-2 max-w-3xl text-sm leading-6 text-white/75">
            {description}
          </div>
        </div>
        {action ? (
          <div className="shrink-0 [&_button]:shadow-none">{action}</div>
        ) : null}
      </div>
    </section>
  );
}
