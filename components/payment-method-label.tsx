import { Banknote, CreditCard } from "lucide-react";
import type { PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

type PaymentMethodLabelProps = {
  method: PaymentMethod | string;
  className?: string;
};

export function PaymentMethodLabel({
  method,
  className
}: PaymentMethodLabelProps) {
  const Icon = method === "Gotovina" ? Banknote : CreditCard;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className="h-4 w-4 text-clay" />
      <span>{method}</span>
    </span>
  );
}
