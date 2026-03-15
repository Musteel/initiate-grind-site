'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AuthFormProps {
  mode: 'login' | 'signup'
  redirectTo?: string
}

// Discord logo SVG
function DiscordIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.02.015.04.03.052a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  )
}

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)

  const router  = useRouter()
  const supabase = createClient()

  const callbackUrl = `${window.location.origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`

  async function handleDiscordOAuth() {
    try {
      setOauthLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: { redirectTo: callbackUrl },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect with Discord')
      setOauthLoading(false)
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(redirectTo ?? '/dashboard')
        router.refresh()
      } else {
        // Sign up — profile row is created by DB trigger
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { preferred_username: username || undefined },
            emailRedirectTo: callbackUrl,
          },
        })
        if (error) throw error
        setSuccess('Check your email to confirm your account.')
      }
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-3xl font-bold text-white mb-2"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}
        >
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="text-slate-500 text-sm">
          {mode === 'login'
            ? 'Sign in to continue your training'
            : 'Join the community and start improving'}
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-[#0f1114] border border-white/8 p-6 sm:p-8 shadow-[0_8px_48px_rgba(0,0,0,0.5)]">

        {/* Discord OAuth */}
        <Button
          variant="secondary"
          size="lg"
          className="w-full justify-center text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 hover:border-indigo-500/25"
          icon={<DiscordIcon />}
          loading={oauthLoading}
          onClick={handleDiscordOAuth}
        >
          Continue with Discord
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/6" />
          <span className="text-xs text-slate-600 font-medium">or</span>
          <div className="flex-1 h-px bg-white/6" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {mode === 'signup' && (
            <Input
              label="Username"
              type="text"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<User className="w-4 h-4" />}
              hint="3–30 characters, letters, numbers, _ and - only"
              autoComplete="username"
            />
          )}

          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            required
            autoComplete={mode === 'login' ? 'email' : 'email'}
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Password</label>
              {mode === 'login' && (
                <Link href="/forgot-password" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Minimum 8 characters' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={8}
                className={cn(
                  'w-full h-10 rounded-lg pl-9 pr-10 text-sm',
                  'bg-slate-900 border border-white/8',
                  'text-slate-100 placeholder:text-slate-600',
                  'transition-colors duration-150',
                  'focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30',
                  'hover:border-white/12'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in-fast">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-fade-in-fast">
              <span className="mt-0.5 shrink-0">✓</span>
              <span>{success}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full"
            loading={loading}
          >
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
      </div>

      {/* Switch mode link */}
      <p className="text-center text-sm text-slate-600">
        {mode === 'login' ? (
          <>
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
              Sign up for free
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
