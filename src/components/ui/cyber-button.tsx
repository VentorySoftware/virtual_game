import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cyberButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium font-orbitron transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 cyber-glow",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-glow-secondary",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow-accent",
        cyber: "bg-gradient-cyber text-white hover:shadow-glow-primary hover:shadow-glow-secondary animate-cyber-pulse",
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground cyber-glow",
        ghost: "text-primary hover:bg-primary/10 hover:text-primary",
        neon: "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground animate-neon-flicker shadow-glow-primary",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-lg px-12 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CyberButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof cyberButtonVariants> {
  asChild?: boolean
}

const CyberButton = React.forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(cyberButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
CyberButton.displayName = "CyberButton"

export { CyberButton, cyberButtonVariants }