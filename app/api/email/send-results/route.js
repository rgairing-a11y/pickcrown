import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import { createClient } from '@supabase/supabase-js'
import { resultsEmail } from '@/lib/email-templates'

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

    // Get pool with event
    const { data: pool, error: poolError } = await supabaseAdmin
      .from('pools')
      .select(`
        *,
        event:events(*)
      `)
      .eq('id', poolId)
      .single()

    if (poolError || !pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    }

    // Get standings
    const { data: standings, error: standingsError } = await supabaseAdmin
      .rpc('calculate_standings', { p_pool_id: poolId })

    if (standingsError) {
      return NextResponse.json({ error: 'Failed to calculate standings' }, { status: 500 })
    }

    if (!standings || standings.length === 0) {
      return NextResponse.json({ error: 'No entries in pool' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pickcrown.vercel.app'
    const poolUrl = `${baseUrl}/pool/${poolId}`

    const results = []

    for (const entry of standings) {
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
        .eq('email_type', 'results')
        .eq('recipient_email', entry.email)
        .single()

      if (existing) {
        results.push({ email: entry.email, status: 'skipped', reason: 'already sent' })
        continue
      }

      const template = resultsEmail({
        poolName: pool.name,
        eventName: pool.event.name,
        standings,
        poolUrl,
        recipientRank: entry.rank,
        recipientName: entry.entry_name
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
          email_type: 'results',
          recipient_email: entry.email,
          status: 'sent'
        })

        results.push({ email: entry.email, status: 'sent', rank: entry.rank })
      } catch (emailError) {
        // Log failure
        await supabaseAdmin.from('email_log').insert({
          pool_id: poolId,
          email_type: 'results',
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
    console.error('Send results error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}