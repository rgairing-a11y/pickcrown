import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function POST(request) {
  try {
    const { message, email } = await request.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    await sgMail.send({
      from: process.env.EMAIL_FROM || 'picks@pickcrown.com',
      to: 'rgairing@gmail.com',
      subject: '💡 PickCrown Feedback',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>New Feedback Received</h2>
          <p><strong>From:</strong> ${email || 'Anonymous'}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
      text: `New Feedback\n\nFrom: ${email || 'Anonymous'}\n\n${message}`
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}