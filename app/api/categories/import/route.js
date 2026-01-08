import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const { eventId, categories } = await request.json()

    if (!eventId || !categories || categories.length === 0) {
      return NextResponse.json(
        { error: 'Event ID and categories are required' },
        { status: 400 }
      )
    }

    let categoriesCreated = 0
    let optionsCreated = 0

    // Get existing max order_index for this event
    const { data: existingCats } = await supabase
      .from('categories')
      .select('order_index')
      .eq('event_id', eventId)
      .order('order_index', { ascending: false })
      .limit(1)

    let startIndex = (existingCats?.[0]?.order_index || 0) + 1

    for (const category of categories) {
      // Create category
      const { data: newCategory, error: catError } = await supabase
        .from('categories')
        .insert({
          event_id: eventId,
          name: category.name,
          order_index: startIndex++,
          type: 'single_select'
        })
        .select()
        .single()

      if (catError) {
        console.error('Error creating category:', catError)
        continue
      }

      categoriesCreated++

      // Create options for this category
      if (category.options && category.options.length > 0) {
        const optionsToInsert = category.options.map((optionName, idx) => ({
          category_id: newCategory.id,
          name: optionName,
          order_index: idx + 1
        }))

        const { error: optError } = await supabase
          .from('category_options')
          .insert(optionsToInsert)

        if (optError) {
          console.error('Error creating options:', optError)
        } else {
          optionsCreated += optionsToInsert.length
        }
      }
    }

    return NextResponse.json({
      success: true,
      categoriesCreated,
      optionsCreated
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Import failed: ' + error.message },
      { status: 500 }
    )
  }
}
