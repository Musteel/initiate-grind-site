import Link from 'next/link'
import { ShieldOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'

export default async function BannedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let bannedReason: string | null = null
  let isBanned = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('banned_at, banned_reason')
      .eq('id', user.id)
      .maybeSingle()
    isBanned = Boolean(profile?.banned_at)
    bannedReason = isBanned ? profile?.banned_reason ?? null : null
  }

  if (!user || !isBanned) {
    redirect('/')
  }


return (
  <div className="min-h-dvh flex items-center justify-center px-4">
    <div className="max-w-md w-full text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
        <ShieldOff className="w-8 h-8 text-red-400" />
      </div>
      <h1
        className="text-3xl font-bold text-white mb-3"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Account suspended
      </h1>
      <p className="text-slate-500 mb-4">
        Your account has been suspended. You cannot access Deadlock Trainer at this time.
      </p>
      {bannedReason && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/15 text-sm text-red-400 text-left">
          <strong className="block text-red-300 mb-1">Reason:</strong>
          {bannedReason}
        </div>
      )}
      <p className="text-sm text-slate-600 mb-8">
        If you believe this is a mistake, contact the moderation team.
      </p>
      <Link href="/">
        <Button variant="secondary">Return to home</Button>
      </Link>
    </div>
  </div>
);
}


