import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  endAdornment?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, endAdornment, ...props }, ref) => {
    if (endAdornment) {
      return (
        <div className="relative">
          <input
            type={type}
            className={cn(
              "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
              "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{endAdornment}</div>
        </div>
      );
    }
    return (
      <input
        type={type}
        className={cn(
          "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
