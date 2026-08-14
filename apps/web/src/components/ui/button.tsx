import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/25",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-destructive/25",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/40",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline hover:translate-y-0 hover:shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingProgress?: number // 0 to 100
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, loadingProgress, loadingText, children, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    const showProgress = loadingProgress !== undefined || isLoading;
    const progressVal = loadingProgress !== undefined ? Math.min(100, Math.max(0, loadingProgress)) : null;

    return (
      <button
        className={cn(
          buttonVariants({ variant, size, className }),
          showProgress && "pointer-events-none opacity-90"
        )}
        disabled={disabled || showProgress}
        ref={ref}
        {...props}
      >
        {/* Progress Background Fill Bar */}
        {showProgress && (
          <span 
            className="absolute inset-0 bg-black/15 dark:bg-white/20 transition-all duration-300 animate-progress-stripe"
            style={{ 
              width: progressVal !== null ? `${progressVal}%` : '100%',
              left: 0,
            }}
          />
        )}

        {/* Button Content */}
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {showProgress && <Loader2 className="animate-spin h-4 w-4" />}
          {showProgress && loadingText ? (
            <span>{loadingText} {progressVal !== null ? `(${progressVal}%)` : ''}</span>
          ) : (
            children
          )}
        </span>
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

