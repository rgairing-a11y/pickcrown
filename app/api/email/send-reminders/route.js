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

      // Check if already sent
      const { data: existing } = await supabaseAdmin
        .from('email_log')
        .select('id')
        .eq('pool_id', poolId)
        .eq('email_type', 'reminder')
        .eq('recipient_email', entry.email)
        .single()

      if (existing) {
        results.push({ email: entry.email, status: 'skipped', reason: 'already sent' })
        continue
      }

      const template = reminderEmail({
        poolName: pool.name,
        eventName: pool.event.name,
        deadline,
        poolUrl
      })

      try {
        await sgMail.send({
          from: process.env.EMAIL_FROM || 'picks@pickcrown.com',
          to: entry.email,
          subject: template.subject,
          html: template.html,
          text: template.text
        })

        // Log success
        await supabaseAdmin.from('email_log').insert({
          pool_id: poolId,
          email_type: 'reminder',
          recipient_email: entry.email,
          status: 'sent'
        })

        results.push({ email: entry.email, status: 'sent' })
      } catch (emailError) {
        // Log failure
        await supabaseAdmin.from('email_log').insert({
          pool_id: poolId,
          email_type: 'reminder',
          recipient_email: entry.email,
          status: 'failed',
          metadata: { error: emailError.message }
        })

        results.push({ email: entry.email, status: 'failed', error: emailError.message })
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.filter(r => r.status === 'sent').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      failed: results.filter(r => r.status === 'failed').length,
      blocked: results.filter(r => r.status === 'blocked').length,
      results
    })

  } catch (error) {
    console.error('Send reminders error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
