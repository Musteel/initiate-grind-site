import * as React from "react";
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const describedBy = error
      ? (inputId ? `${inputId}-error` : undefined)
      : hint
        ? (inputId ? `${inputId}-hint` : undefined)
        : undefined

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            className={cn(
              'w-full h-10 rounded-lg px-3 text-sm',
              'bg-slate-900 border border-white/8',
              'text-slate-100 placeholder:text-slate-600',
              'transition-colors duration-150',
              'focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30',
              'hover:border-white/12',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              icon && 'pl-9',
              error && 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/30',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={inputId ? `${inputId}-error` : undefined} className="text-xs text-red-400">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={inputId ? `${inputId}-hint` : undefined} className="text-xs text-slate-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// ============================================================
// Textarea
// ============================================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const describedBy = error
      ? (inputId ? `${inputId}-error` : undefined)
      : hint
        ? (inputId ? `${inputId}-hint` : undefined)
        : undefined

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full rounded-lg px-3 py-2.5 text-sm min-h-[100px] resize-y',
            'bg-slate-900 border border-white/8',
            'text-slate-100 placeholder:text-slate-600',
            'transition-colors duration-150',
            'focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30',
            'hover:border-white/12',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500/50',
            className
          )}
          {...props}
        />
        {error && (
          <p id={inputId ? `${inputId}-error` : undefined} className="text-xs text-red-400">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={inputId ? `${inputId}-hint` : undefined} className="text-xs text-slate-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// ============================================================
// Label (standalone)
// ============================================================

export function Label({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode
  htmlFor?: string
  className?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('text-sm font-medium text-slate-300 block', className)}
    >
      {children}
    </label>
  )
}
