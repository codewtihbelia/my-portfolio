import React, { forwardRef } from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'danger'
  | 'ghost'
  | 'success'
  | 'white';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      icon,
      iconPosition = 'left',
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeClasses: Record<ButtonSize, string> = {
      xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5 min-h-[28px]',
      sm: 'px-3 py-1.5 text-xs font-semibold rounded-xl gap-1.5 min-h-[32px]',
      md: 'px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl gap-2 min-h-[38px]',
      lg: 'px-6 py-3.5 text-sm font-semibold rounded-xl gap-2.5 min-h-[46px]',
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs focus:ring-2 focus:ring-indigo-500/20 active:scale-[0.98]',
      secondary:
        'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-zinc-500/20 active:scale-[0.98]',
      outline:
        'border border-zinc-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-zinc-500/20 active:scale-[0.98]',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-2 focus:ring-rose-500/20 active:scale-[0.98]',
      ghost:
        'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 focus:ring-2 focus:ring-zinc-500/20',
      success:
        'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-2 focus:ring-emerald-500/20 active:scale-[0.98]',
      white:
        'bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 shadow-sm active:scale-[0.98]',
    };

    const spinnerSizeMap: Record<ButtonSize, 'xs' | 'sm' | 'md'> = {
      xs: 'xs',
      sm: 'xs',
      md: 'sm',
      lg: 'sm',
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
          sizeClasses[size]
        } ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size={spinnerSizeMap[size]} />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
