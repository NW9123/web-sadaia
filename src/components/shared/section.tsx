import { cn } from "@/lib/utils";

/** Standard section heading (eyebrow + title + subtitle) used across pages. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "start",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-2",
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      {eyebrow && (
        <span className="inline-block text-sm font-semibold uppercase tracking-wide text-secondary">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
