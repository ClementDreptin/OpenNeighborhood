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

interface CircularProgressProps {
  value: number;
  className?: string;
}

function CircularProgress({ value, className }: CircularProgressProps) {
  const size = 100;
  const strokeWidth = 10;
  const radius = size / 2 - 10;
  const circumference = Math.ceil(Math.PI * radius * 2);
  const percentage = Math.ceil(circumference * (1 - value));
  const viewBox = `-${size * 0.125} -${size * 0.125} ${size * 1.25} ${size * 1.25}`;

  return (
    <div className="relative">
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: "rotate(-90deg)" }}
        className="relative"
      >
        {/* Base Circle */}
        <circle
          r={radius}
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset="0"
          className={cn("stroke-primary/25", className)}
        />
        {/* Progress */}
        <circle
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDashoffset={percentage}
          fill="transparent"
          strokeDasharray={circumference}
          className="stroke-primary"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm">
        {PERCENT_FORMATTER.format(value)}
      </div>
    </div>
  );
}

export { Progress, CircularProgress };
