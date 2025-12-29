import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import { createClient } from '@supabase/supabase-js'
import { reminderEmail } from '@/lib/email-templates'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ============================================
// EMAIL SAFETY GUARD
// Prevents accidental emails in dev/localhost
// ============================================
const ALLOWED_TEST_EMAILS = ['rgairing@gmail.com']

function isEmailAllowed(email) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const isProduction = baseUrl.includes('pickcrown.vercel.app')
  
  // In production, all emails allowed
  if (isProduction) return { allowed: true }
  
  // In dev/localhost, only allow test emails
  if (ALLOWED_TEST_EMAILS.includes(email.toLowerCase())) {
    return { allowed: true }
  }
  
  return { allowed: false, reason: 'DEV MODE: Email blocked (not in allowed list)' }
}
// ============================================

export async function POST(request) {
  try {
    const { poolId } = await request.json()

    if (!poolId) {
      return NextResponse.json({ error: 'poolId required' }, { status: 400 })
    }

    // Get pool with event and entries
    const { data: pool, error: poolError } = await supabaseAdmin
      .from('pools')
      .select(`
        *,
        event:events(*),
        entries:pool_entries(entry_name, email)
      `)
      .eq('id', poolId)
      .single()

    if (poolError || !pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    }

    // Check if event is still upcoming
    if (new Date(pool.event.start_time) < new Date()) {
      return NextResponse.json({ error: 'Event already started' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pickcrown.vercel.app'
    const poolUrl = `${baseUrl}/pool/${poolId}`
    const deadline = new Date(pool.event.start_time).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    const results = []

    for (const entry of pool.entries) {
      // ============================================
      // CHECK EMAIL SAFETY GUARD
      // ============================================
      const emailCheck = isEmailAllowed(entry.email)
      if (!emailCheck.allowed) {
        console.log(`🛑 ${emailCheck.reason}: ${entry.email}`)
        results.push({ email: entry.email, status: 'blocked', reason: emailCheck.reason })
        continue
      }
      // ============================================

      // Check if alr