"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{
          transform: `translateX(-${100 - (value ?? 0)}%)`,
        }}
      />
    </ProgressPrimitive.Root>
  );
}

const PERCENT_FORMATTER = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 1,
});

function CircleProgress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
      {...props}
      style={{
        background: `radial-gradient(closest-side, hsl(var(--secondary)) 79%, transparent 80% 100%), conic-gradient(hsl(var(--primary)) ${((value ?? 0) * 100).toString()}%, hsl(var(--secondary)) 0)`,
      }}
    >
      <div>{PERCENT_FORMATTER.format(value ?? 0)}</div>
    </ProgressPrimitive.Root>
  );
}

export { Progress, CircleProgress };
