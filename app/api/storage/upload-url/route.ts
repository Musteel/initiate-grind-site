// app/api/storage/upload-url/route.ts
// Returns a short-lived signed upload URL for puzzle video files.
// Client uploads directly to Supabase Storage — never through the Next.js server.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET          = 'puzzle-videos'
const MAX_FILE_SIZE   = 500 * 1024 * 1024  // 500 MB
// Note: 'video/mov' is included for legacy browser compatibility alongside 'video/quicktime'
const ALLOWED_TYPES   = ['video/mp4', 'video/webm', 'video/mov', 'video/quicktime', 'video/x-matroska']
const URL_EXPIRY_SECS = 60 * 5              // 5 minutes to start the upload

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { filename, contentType, fileSize } = body as {
      filename:    string
      contentType: string
      fileSize:    number
    }

    if (!filename || !contentType || !fileSize) {
      return NextResponse.json({ error: 'Missing filename, contentType or fileSize' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Build a path scoped to the user: {userId}/{timestamp}-{sanitized filename}
    const sanitized  = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${user.id}/${Date.now()}-${sanitized}`

    const admin = createAdminClient()
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (error || !data) {
      console.error('[upload-url] Supabase error:', error)
      return NextResponse.json({ error: 'Could not create upload URL' }, { status: 500 })
    }

    return NextResponse.json({
      uploadUrl:   data.signedUrl,
      storagePath: data.path,
    })
  } catch (err: any) {
    console.error('[upload-url] Unhandled:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}