import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sgMail from '@sendgrid/mail'

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  // Initialize SendGrid with API key at runtime
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  }
  try {
    const { emails, targetPoolId } = await request.json()

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'No emails provided' }, { status: 400 })
    }

    if (!targetPoolId) {
      return NextResponse.json({ error: 'Target pool ID required' }, { status: 400 })
    }

    // Get target pool details
    const { data: pool, error: poolError } = await supabaseAdmin
      .from('pools')
      .select('*, event:events(name, start_time)')
      .eq('id', targetPoolId)
      .single()

    if (poolError || !pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pickcrown.vercel.app'
    const poolUrl = `${baseUrl}/pool/${targetPoolId}`
    const deadline = new Date(pool.event.start_time).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    let sent = 0
    const errors = []

    for (const email of emails) {
      try {
        await sgMail.send({
          to: email,
          from: {
            email: 'hello@pickcrown.app',
            name: 'PickCrown'
          },
          subject: `🎯 You're invited to ${pool.name}!`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #7c3aed; margin-bottom: 16px;">👑 You're Invited!</h1>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                You've been invited to join <strong>${pool.name}</strong> for ${pool.event.name}.
              </p>
              
              <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #7c3aed;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  ⏰ Picks lock: <strong>${deadline}</strong>
                </p>
              </div>
              
              <p style="font-size: 15px; color: #333; margin-bottom: 24px;">
                <strong>What to do:</strong> Click the button below, enter your email, and make your picks before the deadline. It only takes a few minutes!
              </p>
              
              <div style="margin: 32px 0;">
                <a href="${poolUrl}" style="display: inline-block; padding: 16px 32px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
                  Make Your Picks →
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 32px;">
                Good luck! 🍀
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
              
              <p style="color: #999; font-size: 12px;">
                PickCrown — Bragging rights only 😄
              </p>
            </div>
          `
        })

        // Log the email
        await supabaseAdmin.from('email_log').insert({
          pool_id: targetPoolId,
          email_type: 'invite',
          recipient_email: email
        })

        sent++
      } catch (err) {
        console.error(`Failed to send to ${email}:`, err)
        errors.push(email)
      }
    }

    return NextResponse.json({ 
      success: true, 
      sent, 
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error('Send invites error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
