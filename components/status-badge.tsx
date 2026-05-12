import type { PaymentStatus, WorkflowStatus } from "@/lib/types";
import { cn, paymentTone, workflowTone } from "@/lib/utils";

type StatusBadgeProps = {
  children: PaymentStatus | WorkflowStatus | string;
  type?: "workflow" | "payment";
  className?: string;
};

export function StatusBadge({
  children,
  type = "workflow",
  className
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold",
        type === "payment"
          ? paymentTone(children as PaymentStatus)
          : workflowTone(children as WorkflowStatus),
        className
      )}
    >
      {children}
    </span>
  );
}
