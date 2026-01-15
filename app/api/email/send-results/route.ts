import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sgMail from '@sendgrid/mail'

// Calculate standings for a pool
async function getPoolStandings(poolId: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data, error } = await supabaseAdmin.rpc('calculate_standings', { p_pool_id: poolId })
  if (error) {
    console.error('Error calculating standings:', error)
    return []
  }
  return data || []
}

// Calculate overall event podium (Top 3 across ALL pools)
async function getEventPodium(eventId: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  // Get all pools for this event
  const { data: pools } = await supabaseAdmin
    .from('pools')
    .select('id')
    .eq('event_id', eventId)

  if (!pools || pools.length === 0) return []

  // Get standings from all pools and combine
  const allEntries = []
  
  for (const pool of pools) {
    const standings = await getPoolStandings(pool.id)
    allEntries.push(...standings)
  }

  // Sort by total_points descending, then by entry_name
  allEntries.sort((a, b) => {
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points
    }
    return a.entry_name.localeCompare(b.entry_name)
  })

  // Return top 3 only (the podium)
  return allEntries.slice(0, 3).map((entry, idx) => ({
    ...entry,
    position: idx + 1, // 1, 2, 3
    medal: idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'
  }))
}

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
    const { eventId, poolId } = await request.json()

    // Validate: need either eventId (send to all pools) or poolId (send to one pool)
    if (!eventId && !poolId) {
      return NextResponse.json({ error: 'eventId or poolId required' }, { status: 400 })
    }

    // Get event details
    let event
    if (eventId) {
      const { data } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      event = data
    } else {
      const { data: poolData } = await supabaseAdmin
        .from('pools')
        .select('*, event:events(*)')
        .eq('id', poolId)
        .single()
      event = poolData?.event
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if event is completed
    if (event.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Event must be marked as completed before sending results emails' 
      }, { status: 400 })
    }

    // Get pools to send results for
    let pools
    if (poolId) {
      const { data } = await supabaseAdmin
        .from('pools')
        .select('*')
        .eq('id', poolId)
      pools = data
    } else {
      const { data } = await supabaseAdmin
        .from('pools')
        .select('*')
        .eq('event_id', event.id)
      pools = data
    }

    if (!pools || pools.length === 0) {
      return NextResponse.json({ error: 'No pools found' }, { status: 404 })
    }

    // Calculate event podium (Top 3 across all pools)
    const eventPodium = await getEventPodium(event.id)

    // Track emails sent (for deduplication)
    const emailsSent = new Set()
    let sent = 0
    let deduplicated = 0
    const errors = []

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pickcrown.vercel.app'

    // Process each pool
    for (const pool of pools) {
      // Get standings for this pool
      const standings = await getPoolStandings(pool.id)
      
      // Find pool champion
      const champion = standings.find(s => s.rank === 1)

      // Send email to each entry
      for (const entry of standings) {
        const email = entry.email.toLowerCase()

        // Deduplication: If user is in multiple pools for same event, only send one email
        if (emailsSent.has(email)) {
          deduplicated++
          continue
        }

        // Check if we already sent a results email to this person for this event
        const { data: existingLog } = await supabaseAdmin
          .from('email_log')
          .select('id')
          .eq('recipient_email', email)
          .eq('email_type', 'results')
          .eq('pool_id', pool.id)
          .single()

        if (existingLog) {
          deduplicated++
          continue
        }

        try {
          // Build the email
          const standingsUrl = `${baseUrl}/pool/${pool.id}/standings`
          
          // Build podium HTML
          let podiumHtml = ''
          if (eventPodium.length > 0) {
            podiumHtml = `
              <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #eee;">
                <h3 style="margin: 0 0 16px; color: #7c3aed;">🏆 PickCrown Event Podium</h3>
                <p style="color: #666; font-size: 14px; margin-bottom: 16px;">Top 3 across all pools for this event:</p>
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
                  ${eventPodium.map(p => `
                    <div style="display: flex; align-items: center; padding: 8px 0; ${p.position < 3 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                      <span style="font-size: 24px; margin-right: 12px;">${p.medal}</span>
                      <span style="font-weight: ${p.position === 1 ? 'bold' : 'normal'};">${p.entry_name}</span>
                      <span style="margin-left: auto; color: #666;">${p.total_points} pts</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `
          }

          // Determine the user's result message
          let resultMessage
          if (entry.rank === 1) {
            resultMessage = `<span style="font-size: 32px;">👑</span><br><strong>You won!</strong> Congratulations, champion!`
          } else if (entry.rank <= 3) {
            resultMessage = `You finished <strong>#${entry.rank}</strong> — great job!`
          } else {
            resultMessage = `You finished <strong>#${entry.rank}</strong> with ${entry.total_points} points.`
          }

          await sgMail.send({
            to: email,
            from: {
              email: 'hello@pickcrown.app',
              name: 'PickCrown'
            },
            subject: `${event.name} Results — ${entry.rank === 1 ? '👑 You Won!' : `You finished #${entry.rank}`}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #7c3aed; margin-bottom: 8px;">📊 ${event.name} Results</h1>
                <p style="color: #666; margin-top: 0;">Pool: ${pool.name}</p>
                
                <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
                  ${resultMessage}
                </div>
                
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <h3 style="margin: 0 0 16px;">Your Stats</h3>
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Your Score</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold;">${entry.total_points} points</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Your Rank</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold;">#${entry.rank} of ${standings.length}</td>
                    </tr>
                    ${champion ? `
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Pool Champion</td>
                      <td style="padding: 8px 0; text-align: right; font-weight: bold;">👑 ${champion.entry_name}</td>
                    </tr>
                    ` : ''}
                  </table>
                </div>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${standingsUrl}" style="display: inline-block; padding: 16px 32px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    View Full Standings
                  </a>
                </div>
                
                ${podiumHtml}
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                  PickCrown — Bragging rights only 😄<br>
                  Thanks for playing! Until next time. 🙌
                </p>
              </div>
            `
          })

          // Log the email
          await supabaseAdmin.from('email_log').insert({
            pool_id: pool.id,
            email_type: 'results',
            recipient_email: email
          })

          emailsSent.add(email)
          sent++
        } catch (err) {
          console.error(`Failed to send results to ${email}:`, err)
          errors.push(email)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      sent, 
      deduplicated,
      errors: errors.length > 0 ? errors : undefined,
      podiumEntries: eventPodium.length
    })

  } catch (error: any) {
    console.error('Send results error:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}
