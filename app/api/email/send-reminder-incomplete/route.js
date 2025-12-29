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
// ============================================
const ALLOWED_TEST_EMAILS = ['rgairing@gmail.com']

function isEmailAllowed(email) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const isProduction = baseUrl.includes('pickcrown.vercel.app')
  if (isProduction) return { allowed: true }
  if (ALLOWED_TEST_EMAILS.includes(email.toLowerCase())) return { allowed: true }
  return { allowed: false, reason: 'DEV MODE: Email blocked' }
}
// ============================================

export async function POST(request) {
  try {
    const { poolId, emails } = await request.json()

    if (!poolId || !emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: 'poolId and emails required' }, { status: 400 })
    }

    // Get pool with event
    const { data: pool, error: poolError } = await supabaseAdmin
      .from('pools')
      .select(`*, event:events(*)`)
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

    for (const email of emails) {
      // Check safety guard
      const emailCheck = isEmailAllowed(email)
      if (!emailCheck.allowed) {
        console.log(`🛑 ${emailCheck.reason}: ${email}`)
        results.push({ email, status: 'blocked', reason: emailCheck.reason })
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
          to: email,
          subject: `⏰ Reminder: Finish your ${pool.event.name} picks!`,
          html: template.html,
          text: template.text
        })

        results.push({ email, status: 'sent' })
      } catch (emailError) {
        results.push({ email, status: 'failed', error: emailError.message })
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.filter(r => r.status === 'sent').length,
      blocked: results.filter(r => r.status === 'blocked').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    })

  } catch (error) {
    console.error('Send reminder incomplete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}