import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { eventId, newYear, newStartTime, newName } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    }

    // Get source event with categories and options
    const { data: sourceEvent, error: fetchError } = await supabase
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
    const { data: newEvent, error: eventError } = await supabase
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

    // Clone categories and options
    const sortedCategories = (sourceEvent.categories || []).sort((a, b) => a.order_index - b.order_index)

    for (const category of sortedCategories) {
      // Create category
      const { data: newCategory, error: catError } = await supabase
        .from('categories')
        .insert({
          event_id: newEvent.id,
          name: category.name,
          type: category.type,
          order_index: category.order_index
          // phase_id intentionally omitted - phases need manual setup
        })
        .select()
        .single()

      if (catError) {
        console.error('Error creating category:', catError)
        continue
      }

      // Create options (without is_correct)
      const options = (category.options || []).map(opt => ({
        category_id: newCategory.id,
        name: opt.name,
        is_correct: null // Fresh - no results
      }))

      if (options.length > 0) {
        const { error: optError } = await supabase
          .from('category_options')
          .insert(options)

        if (optError) {
          console.error('Error creating options:', optError)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      event: newEvent,
      categoriesCloned: sortedCategories.length
    })

  } catch (error) {
    console.error('Clone event error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}