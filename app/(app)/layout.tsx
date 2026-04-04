import { Suspense } from 'react'
import Link from 'next/link'
import { FooterCopyright } from '@/components/layout/FooterCopyright'
import { Navbar } from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Suspense fallback={<NavbarFallback />}>
        <NavbarWithProfile />
      </Suspense>
      <main className="flex-1 pt-16">
        {children}
      </main>
      <footer className="border-t border-white/5 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            <Suspense fallback={<FooterFallback />}>
            <FooterCopyright />
            </Suspense>
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/puzzles" className="hover:text-slate-400 transition-colors">Puzzles</Link>
            <Link href="/leaderboard" className="hover:text-slate-400 transition-colors">Leaderboard</Link>
            <Link href="/submit" className="hover:text-slate-400 transition-colors">Submit</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

async function NavbarWithProfile() {
  const profile = await fetchUserProfile()
  return <Navbar initialProfile={profile} />
}

function NavbarFallback() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-[#0a0b0d]/90 backdrop-blur-md"
      aria-hidden="true"
    />
  )
}

async function fetchUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return profile
}

function FooterFallback() {
  return (
    <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
  )
}