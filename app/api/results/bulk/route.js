import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = createClient()
    const { eventId, results } = await request.json()
    
    const actorEmail = request.headers.get('x-user-email') || 'system'
    
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
    await supabase.rpc('log_audit_event', {
      p_action: 'bulk_results_entry',
      p_actor_email: actorEmail,
      p_target_type: 'event',
      p_target_id: eventId,
      p_metadata: {
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
      { error: 'Failed to bulk update results' },
      { status: 500 }
    )
  }
}