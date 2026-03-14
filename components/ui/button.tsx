'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'brand' | 'secondary' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  brand: [
    'bg-amber-500 text-slate-950 font-semibold',
    'hover:bg-amber-400 active:bg-amber-600',
    'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    'hover:shadow-[0_0_28px_rgba(245,158,11,0.4)]',
    'disabled:bg-amber-500/40 disabled:text-slate-950/50 disabled:shadow-none',
  ].join(' '),
  secondary: [
    'bg-slate-800 text-slate-100 font-medium',
    'border border-white/8',
    'hover:bg-slate-700 hover:border-white/12',
    'active:bg-slate-900',
    'disabled:opacity-40',
  ].join(' '),
  ghost: [
    'bg-transparent text-slate-300 font-medium',
    'hover:bg-white/5 hover:text-slate-100',
    'active:bg-white/8',
    'disabled:opacity-40',
  ].join(' '),
  outline: [
    'bg-transparent text-amber-400 font-medium',
    'border border-amber-500/40',
    'hover:bg-amber-500/8 hover:border-amber-500/60',
    'active:bg-amber-500/12',
    'disabled:opacity-40',
  ].join(' '),
  danger: [
    'bg-red-500/15 text-red-400 font-medium',
    'border border-red-500/25',
    'hover:bg-red-500/25 hover:border-red-500/40',
    'active:bg-red-500/30',
    'disabled:opacity-40',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-12 px-6 text-base rounded-lg gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'brand',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center',
          'transition-all duration-150',
          'cursor-pointer select-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500',
          'disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
