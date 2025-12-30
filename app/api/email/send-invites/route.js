import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sgMail from '@sendgrid/mail'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Email safety guard
const ALLOWED_TEST_EMAILS = ['rgairing@gmail.com']

function isEmailAllowed(email) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const isProduction = baseUrl.includes('pickcrown.vercel.app')
  
  if (isProduction) return { allowed: true }
  if (ALLOWED_TEST_EMAILS.includes(email.toLowerCase())) return { allowed: true }
  
  return { allowed: false, reason: 'DEV MODE: Email blocked' }
}

export async function POST(request) {
  try {
    const { emails, targetPoolId } = await request.json()

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'No emails provided' }, { status: 400 })
    }

    if (!targetPoolId) {
      return NextResponse.json({ error: 'Target pool ID required' }, { status: 400 })
    }

    // Get target pool details
    const { data: pool, error: poolError } = await supabase
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
    let skipped = 0
    const errors = []

    for (const email of emails) {
      const { allowed, reason } = isEmailAllowed(email)
      
      if (!allowed) {
        skipped++
        continue
      }

      try {
        await sgMail.send({
          to: email,
          from: {
            email: 'hello@pickcrown.app',
            name: 'PickCrown'
          },
          subject: `You're invited to ${pool.name}!`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #7c3aed;">👑 You're Invited!</h1>
              
              <p>You've been invited to join <strong>${pool.name}</strong> for ${pool.event.name}.</p>
              
              <p><strong>Deadline:</strong> ${deadline}</p>
              
              <div style="margin: 32px 0;">
                <a href="${poolUrl}" style="display: inline-block; padding: 16px 32px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Make Your Picks
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
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
        await supabase.from('email_log').insert({
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
      skipped,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Send invites error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}