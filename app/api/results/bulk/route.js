import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { assertEventAllowsResults } from '@/lib/assertEventAllowsResults'
import { logAudit } from '@/lib/audit'

export async function POST(request) {
  try {
    const supabase = createClient()
    const { eventId, results } = await request.json()

    const actorEmail = request.headers.get('x-user-email') || 'system'

    // Fetch event to check status
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, status')
      .eq('id', eventId)
      .single()

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 400 })
    }

    assertEventAllowsResults(event)

    const errors = []
    const updated = []

    for (const result of results) {
      if (result.matchupId) {
        // Update bracket matchup
        const { error } = await supabase
          .from('matchups')
          .update({ winner_id: result.winnerId })
          .eq('id', result.matchupId)

        if (error) {
          errors.push(`Matchup ${result.matchupId}: ${error.message}`)
        } else {
          updated.push(`matchup:${result.matchupId}`)
        }
      } else if (result.categoryId) {
        // Update category
        const { error } = await supabase
          .from('categories')
          .update({ correct_option_id: result.winnerId })
          .eq('id', result.categoryId)

        if (error) {
          errors.push(`Category ${result.categoryId}: ${error.message}`)
        } else {
          updated.push(`category:${result.categoryId}`)
        }
      }
    }

    // Log the bulk update
    await logAudit({
      action: 'bulk_results_entry',
      actor_email: actorEmail,
      target_type: 'event',
      target_id: eventId,
      metadata: {
        results_count: results.length,
        updated_count: updated.length,
        errors_count: errors.length,
        errors: errors.length > 0 ? errors : undefined
      }
    })

    return NextResponse.json({
      success: errors.length === 0,
      updated: updated.length,
      errors
    })
  } catch (error) {
    console.error('Error bulk updating results:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to bulk update results' },
      { status: 500 }
    )
  }
}
