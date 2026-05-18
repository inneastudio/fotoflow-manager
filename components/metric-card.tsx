import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: "clay" | "olive" | "rose" | "charcoal";
};

const toneClasses = {
  clay: "bg-clay/10 text-clay",
  olive: "bg-olive/10 text-olive",
  rose: "bg-rose/10 text-rose",
  charcoal: "bg-charcoal/10 text-charcoal"
};

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "charcoal"
}: MetricCardProps) {
  return (
    <div className="surface rounded-lg p-4 transition hover:border-ink/10 hover:shadow-soft sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-3 font-display text-3xl font-semibold leading-none tracking-normal text-ink">
            {value}
          </p>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-lg border border-current/10", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {detail ? <p className="mt-4 text-sm text-muted">{detail}</p> : null}
    </div>
  );
}
