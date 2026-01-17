import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase admin client missing env vars')
  }

  return createClient(url, key)
}

export async function POST(request) {
  const supabase = getSupabaseAdmin()
  try {
    const body = await request.json()
    
    // Support both formats: { eventId, categories } and { event_id, categories }
    const eventId = body.eventId || body.event_id
    const categories = body.categories

    if (!eventId || !categories || categories.length === 0) {
      return NextResponse.json(
        { error: 'Event ID and categories are required' },
        { status: 400 }
      )
    }

    // Validate event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    let categoriesCreated = 0
    let optionsCreated = 0
    const errors = []

    // Get existing max order_index for this event
    const { data: existingCats } = await supabase
      .from('categories')
      .select('order_index')
      .eq('event_id', eventId)
      .order('order_index', { ascending: false })
      .limit(1)

    let startIndex = (existingCats?.[0]?.order_index || 0) + 1

    for (const category of categories) {
      // Validate category
      if (!category.name || typeof category.name !== 'string') {
        errors.push(`Invalid category name: ${JSON.stringify(category)}`)
        continue
      }

      if (!category.options || !Array.isArray(category.options) || category.options.length === 0) {
        errors.push(`Category "${category.name}" has no options`)
        continue
      }

      // Create category
      const { data: newCategory, error: catError } = await supabase
        .from('categories')
        .insert({
          event_id: eventId,
          name: category.name.trim(),
          order_index: category.order || startIndex++,
          type: category.type || 'single_select'
        })
        .select()
        .single()

      if (catError) {
        console.error('Error creating category:', catError)
        errors.push(`Failed to create category "${category.name}": ${catError.message}`)
        continue
      }

      categoriesCreated++

      // Create options for this category
      const optionsToInsert = category.options
        .filter(opt => opt && typeof opt === 'string' && opt.trim())
        .map((optionName, idx) => ({
          category_id: newCategory.id,
          name: optionName.trim(),
          order_index: idx + 1
        }))

      if (optionsToInsert.length > 0) {
        const { error: optError } = await supabase
          .from('category_options')
          .insert(optionsToInsert)

        if (optError) {
          console.error('Error creating options:', optError)
          errors.push(`Failed to create options for "${category.name}": ${optError.message}`)
        } else {
          optionsCreated += optionsToInsert.length
        }
      }
    }

    // Return result
    const result = {
      success: categoriesCreated > 0,
      categories_created: categoriesCreated,
      options_created: optionsCreated,
      event_id: eventId,
      event_name: event.name
    }

    if (errors.length > 0) {
      result.warnings = errors
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Import failed: ' + error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to preview what would be imported
export async function GET(request) {
  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('event_id')

  if (!eventId) {
    return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  }

  // Get existing categories for this event
  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      order_index,
      options:category_options(id, name, order_index, is_correct)
    `)
    .eq('event_id', eventId)
    .order('order_index')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    event_id: eventId,
    categories_count: categories?.length || 0,
    categories: categories || []
  })
}
