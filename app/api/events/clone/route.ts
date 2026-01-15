import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { eventId, newYear, newStartTime, newName } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    }

    // Get source event with categories and options
    const { data: sourceEvent, error: fetchError } = await supabaseAdmin
      .from('events')
      .select(`
        *,
        categories (
          *,
          options:category_options (*)
        )
      `)
      .eq('id', eventId)
      .single()

    if (fetchError || !sourceEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Create new event
    const { data: newEvent, error: eventError } = await supabaseAdmin
      .from('events')
      .insert({
        name: newName || sourceEvent.name,
        year: newYear || sourceEvent.year + 1,
        event_type: sourceEvent.event_type,
        start_time: newStartTime || sourceEvent.start_time,
        status: 'upcoming',
        metadata: sourceEvent.metadata,
        season_id: null // Don't copy season assignment
      })
      .select()
      .single()

    if (eventError) {
      console.error('Error creating event:', eventError)
      return NextResponse.json({ error: eventError.message }, { status: 500 })
    }

    let clonedCounts = {
      categories: 0,
      rounds: 0,
      teams: 0,
      matchups: 0
    }

    // Clone categories and options (for pick-one/hybrid events)
    const sortedCategories = (sourceEvent.categories || []).sort((a: any, b: any) => a.order_index - b.order_index)

    for (const category of sortedCategories) {
      const { data: newCategory, error: catError } = await supabaseAdmin
        .from('categories')
        .insert({
          event_id: newEvent.id,
          name: category.name,
          type: category.type,
          order_index: category.order_index
        })
        .select()
        .single()

      if (catError) {
        console.error('Error creating category:', catError)
        continue
      }

      clonedCounts.categories++

      const options = (category.options || []).map((opt: any) => ({
        category_id: newCategory.id,
        name: opt.name,
        is_correct: null
      }))

      if (options.length > 0) {
        await supabaseAdmin.from('category_options').insert(options)
      }
    }

    // Clone rounds (for bracket events)
    const { data: sourceRounds } = await supabaseAdmin
      .from('rounds')
      .select('*')
      .eq('event_id', eventId)
      .order('round_order')

    const roundIdMap = {}

    if (sourceRounds && sourceRounds.length > 0) {
      for (const round of sourceRounds) {
        const { data: newRound } = await supabaseAdmin
          .from('rounds')
          .insert({
            event_id: newEvent.id,
            name: round.name,
            round_order: round.round_order,
            points: round.points
          })
          .select()
          .single()
        
        if (newRound) {
          roundIdMap[round.id] = newRound.id
          clonedCounts.rounds++
        }
      }
    }

    // Clone teams
    const { data: sourceTeams } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('event_id', eventId)
      .order('seed')

    const teamIdMap = {}

    if (sourceTeams && sourceTeams.length > 0) {
      for (const team of sourceTeams) {
        const { data: newTeam } = await supabaseAdmin
          .from('teams')
          .insert({
            event_id: newEvent.id,
            name: team.name,
            seed: team.seed,
            region: team.region
          })
          .select()
          .single()
        
        if (newTeam) {
          teamIdMap[team.id] = newTeam.id
          clonedCounts.teams++
        }
      }
    }

    // Clone matchups (without results)
    const { data: sourceMatchups } = await supabaseAdmin
      .from('matchups')
      .select('*')
      .eq('event_id', eventId)

    if (sourceMatchups && sourceMatchups.length > 0) {
      for (const matchup of sourceMatchups) {
        await supabaseAdmin
          .from('matchups')
          .insert({
            event_id: newEvent.id,
            round_id: roundIdMap[matchup.round_id] || null,
            team_a_id: teamIdMap[matchup.team_a_id] || null,
            team_b_id: teamIdMap[matchup.team_b_id] || null,
            winner_team_id: null,
            matchup_order: matchup.matchup_order
          })
        clonedCounts.matchups++
      }
    }

    return NextResponse.json({ 
      success: true, 
      event: newEvent,
      cloned: clonedCounts
    })

  } catch (error: any) {
    console.error('Clone event error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
