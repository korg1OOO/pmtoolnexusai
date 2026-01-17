import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-success/15 text-success border-success/30",
        warning: "border-transparent bg-warning/15 text-warning border-warning/30",
        info: "border-transparent bg-info/15 text-info border-info/30",
        error: "border-transparent bg-destructive/15 text-destructive border-destructive/30",
        critical: "border-transparent bg-destructive text-destructive-foreground",
        high: "border-transparent bg-orange-500/15 text-orange-400 border-orange-500/30",
        medium: "border-transparent bg-warning/15 text-warning border-warning/30",
        low: "border-transparent bg-success/15 text-success border-success/30",
        active: "border-transparent bg-success/15 text-success border-success/30",
        pending: "border-transparent bg-warning/15 text-warning border-warning/30",
        blocked: "border-transparent bg-destructive/15 text-destructive border-destructive/30",
        completed: "border-transparent bg-primary/15 text-primary border-primary/30",
        todo: "border-transparent bg-muted text-muted-foreground border-border",
        "in-progress": "border-transparent bg-primary/15 text-primary border-primary/30",
        review: "border-transparent bg-purple-500/15 text-purple-400 border-purple-500/30",
        done: "border-transparent bg-success/15 text-success border-success/30",
        epic: "border-transparent bg-purple-500/20 text-purple-400",
        story: "border-transparent bg-blue-500/20 text-blue-400",
        task: "border-transparent bg-cyan-500/20 text-cyan-400",
        bug: "border-transparent bg-red-500/20 text-red-400",
        "tech-debt": "border-transparent bg-orange-500/20 text-orange-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
