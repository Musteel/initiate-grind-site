'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu, X, Flame, Trophy, BookOpen, Plus,
  LogOut, Settings, LayoutDashboard, Shield,
  ChevronDown, Zap
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, LevelBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Tables } from '@/lib/supabase/types'

interface NavbarProps {
  initialProfile?: Tables<'profiles'> | null
}

const NAV_LINKS = [
  { href: '/puzzles',            label: 'Puzzles',     icon: BookOpen },
  { href: '/puzzle-of-the-day',  label: 'Daily',       icon: Flame },
  { href: '/leaderboard',        label: 'Leaderboard', icon: Trophy },
]

export function Navbar({ initialProfile }: NavbarProps) {
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(initialProfile ?? null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setProfile(data)
        } else {
          setProfile(null)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    router.push('/')
    router.refresh()
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator'

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#0a0b0d]/90 backdrop-blur-md border-b border-white/6'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
          >
            <div className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 group-hover:border-amber-500/60 transition-colors">
              <Zap className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
            </div>
            <span
              className="font-display font-semibold text-lg tracking-wide text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Deadlock<span className="text-amber-400">Trainer</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-amber-500/12 text-amber-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {profile ? (
              <>
                {/* Submit puzzle */}
                <Link href="/submit">
                  <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />}>
                    Submit
                  </Button>
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-150',
                      'hover:bg-white/5 border border-transparent',
                      userMenuOpen && 'bg-white/5 border-white/8'
                    )}
                  >
                    <Avatar src={profile.avatar_url} name={profile.display_name ?? profile.username} size="sm" />
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-sm font-medium text-slate-200 truncate max-w-[100px]">
                        {profile.display_name ?? profile.username}
                      </span>
                      <LevelBadge level={profile.level} />
                    </div>
                    <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform duration-150', userMenuOpen && 'rotate-180')} />
                  </button>

                  {/* Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-[#1d2229] border border-white/10 shadow-2xl py-1 animate-scale-in">
                      <div className="px-3 py-2.5 border-b border-white/8">
                        <p className="text-sm font-medium text-slate-200">@{profile.username}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{profile.xp.toLocaleString()} XP</p>
                      </div>

                      <div className="py-1">
                        <DropdownLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>
                          Dashboard
                        </DropdownLink>
                        <DropdownLink href={`/profile/${profile.username}`} icon={<Avatar src={profile.avatar_url} name={profile.username} size="xs" />}>
                          Profile
                        </DropdownLink>
                        <DropdownLink href="/settings" icon={<Settings className="w-4 h-4" />}>
                          Settings
                        </DropdownLink>
                        {isAdmin && (
                          <DropdownLink href="/admin" icon={<Shield className="w-4 h-4" />} highlight>
                            Admin panel
                          </DropdownLink>
                        )}
                      </div>

                      <div className="pt-1 border-t border-white/8">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/8 transition-colors rounded-md mx-1"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/sign-up">
                  <Button variant="brand" size="sm">Get started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/6 bg-[#0a0b0d]/95 backdrop-blur-md animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-amber-500/12 text-amber-400'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}

            <div className="border-t border-white/6 pt-4 mt-4">
              {profile ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-4 py-2 mb-2">
                    <Avatar src={profile.avatar_url} name={profile.display_name ?? profile.username} size="md" />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{profile.display_name ?? profile.username}</p>
                      <LevelBadge level={profile.level} />
                    </div>
                  </div>
                  <MobileLink href="/dashboard">Dashboard</MobileLink>
                  <MobileLink href="/submit">Submit puzzle</MobileLink>
                  <MobileLink href="/settings">Settings</MobileLink>
                  {isAdmin && <MobileLink href="/admin">Admin panel</MobileLink>}
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-4">
                  <Link href="/signup">
                    <Button variant="brand" className="w-full">Get started</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="secondary" className="w-full">Sign in</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  )
}

function DropdownLink({
  href,
  icon,
  children,
  highlight,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 mx-1 text-sm rounded-md transition-colors',
        highlight
          ? 'text-amber-400 hover:bg-amber-500/8'
          : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'
      )}
    >
      <span className="text-slate-500">{icon}</span>
      {children}
    </Link>
  )
}

function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-slate-100 rounded-lg transition-colors"
    >
      {children}
    </Link>
  )
}