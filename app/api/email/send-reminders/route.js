import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase admin client missing env vars')
  }

  return createClient(url, key)
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function POST(request) {
  const supabaseAdmin = getSupabaseAdmin()
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

      try {
        await sgMail.send({
          from: process.env.EMAIL_FROM || 'hello@pickcrown.app',
          to: entry.email,
          subject: `🎯 ${pool.name} – picks close soon!`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">
                👑 Quick Reminder
              </h1>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Hey! Just a friendly nudge – your picks for <strong>${pool.name}</strong> are due soon.
              </p>
              
              <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #3b82f6;">
                <p style="margin: 0 0 8px; font-size: 15px; color: #333;">
                  <strong>${pool.event.name}</strong>
                </p>
                <p style="margin: 0; font-size: 14px; color: #666;">
                  ⏰ Picks lock: <strong>${deadline}</strong>
                </p>
              </div>
              
              <p style="font-size: 15px; color: #333; line-height: 1.6; margin-bottom: 24px;">
                <strong>What happens next:</strong> Once picks lock, you'll be able to see everyone's picks and track the standings as results come in. No pressure – just fun!
              </p>
              
              <a href="${poolUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                Submit Your Picks →
              </a>
              
              <p style="font-size: 14px; color: #666; margin-top: 32px;">
                Good luck! 🍀
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
              
              <p style="font-size: 12px; color: #999;">
                You're receiving this because you joined a PickCrown pool. No action needed if you've already submitted.
              </p>
            </div>
          `,
          text: `
Quick Reminder from PickCrown

Hey! Just a friendly nudge – your picks for ${pool.name} are due soon.

Event: ${pool.event.name}
Picks lock: ${deadline}

What happens next: Once picks lock, you'll be able to see everyone's picks and track the standings as results come in. No pressure – just fun!

Submit your picks: ${poolUrl}

Good luck!

---
You're receiving this because you joined a PickCrown pool. No action needed if you've already submitted.
          `.trim()
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
      results
    })

  } catch (error) {
    console.error('Send reminders error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
