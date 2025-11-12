import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  showPercentage?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, showPercentage = false, ...props }, ref) => {
  const percentage = Math.round(value || 0);
  
  return (
    <div className="relative w-full">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800",
          className
        )}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className="h-full w-full flex-1 bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ProgressPrimitive.Root>
      {showPercentage && (
        <span className={cn(
          "absolute top-1/2 -translate-y-1/2 text-xs font-medium",
          percentage < 15 ? "left-full ml-2 text-foreground" : "left-1/2 -translate-x-1/2 text-white"
        )}>
          {percentage}%
        </span>
      )}
    </div>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
