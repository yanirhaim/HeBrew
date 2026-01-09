import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "super" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", fullWidth = false, children, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center font-extrabold uppercase tracking-wide transition-all active:translate-y-[2px] active:border-b-0 disabled:opacity-50 disabled:pointer-events-none";
    const rounded = "rounded-2xl";
    
    const variants = {
      primary: "bg-feather-green text-white border-b-4 border-feather-green-shadow hover:bg-[#61e002]",
      secondary: "bg-feather-blue text-white border-b-4 border-feather-blue-shadow hover:bg-[#2dc5ff]",
      danger: "bg-feather-red text-white border-b-4 border-feather-red-shadow hover:bg-[#ff5d5d]",
      super: "bg-feather-yellow text-feather-text border-b-4 border-feather-yellow-shadow hover:bg-[#ffd21f]",
      outline: "bg-white text-feather-blue border-2 border-feather-gray border-b-4 hover:bg-feather-gray/20",
      ghost: "bg-transparent text-feather-blue border-none hover:bg-feather-gray/20 active:translate-y-0",
    };

    const sizes = {
      sm: "h-9 px-4 text-xs",
      md: "h-11 px-6 text-sm",
      lg: "h-14 px-8 text-base",
    };

    const width = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${rounded} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
