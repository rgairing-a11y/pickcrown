import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

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
      try {
        await sgMail.send({
          from: process.env.EMAIL_FROM || 'hello@pickcrown.app',
          to: email,
          subject: `🎯 ${pool.name} – don't forget to finish!`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">
                👑 Almost There!
              </h1>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Looks like you started your picks for <strong>${pool.name}</strong> but haven't finished yet. No worries – there's still time!
              </p>
              
              <div style="background: #fef9c3; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #eab308;">
                <p style="margin: 0 0 8px; font-size: 15px; color: #333;">
                  <strong>${pool.event.name}</strong>
                </p>
                <p style="margin: 0; font-size: 14px; color: #666;">
                  ⏰ Picks lock: <strong>${deadline}</strong>
                </p>
              </div>
              
              <p style="font-size: 15px; color: #333; line-height: 1.6; margin-bottom: 24px;">
                <strong>What happens next:</strong> Once you submit, you'll see everyone's picks after the deadline passes. Then we track the results together!
              </p>
              
              <a href="${poolUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                Finish Your Picks →
              </a>
              
              <p style="font-size: 14px; color: #666; margin-top: 32px;">
                See you at the finish line! 🏁
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
              
              <p style="font-size: 12px; color: #999;">
                You're receiving this because you have incomplete picks in a PickCrown pool.
              </p>
            </div>
          `,
          text: `
Almost There!

Looks like you started your picks for ${pool.name} but haven't finished yet. No worries – there's still time!

Event: ${pool.event.name}
Picks lock: ${deadline}

What happens next: Once you submit, you'll see everyone's picks after the deadline passes. Then we track the results together!

Finish your picks: ${poolUrl}

See you at the finish line!
          `.trim()
        })

        results.push({ email, status: 'sent' })
      } catch (emailError) {
        results.push({ email, status: 'failed', error: emailError.message })
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    })

  } catch (error) {
    console.error('Send reminder incomplete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
