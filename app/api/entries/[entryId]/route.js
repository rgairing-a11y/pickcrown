import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function PATCH(request, { params }) {
  try {
    const { entryId } = await params
    const { entry_name, email } = await request.json()

    if (!entry_name?.trim()) {
      return NextResponse.json({ error: 'Entry name is required' }, { status: 400 })
    }

    if (!email?.trim() || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('pool_entries')
      .update({
        entry_name: entry_name.trim(),
        email: email.trim().toLowerCase()
      })
      .eq('id', entryId)
      .select()
      .single()

    if (error) {
      console.error('Update entry error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, entry: data })

  } catch (error) {
    console.error('Update entry error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { entryId } = await params

    // Delete picks first (foreign key constraints)
    await supabaseAdmin
      .from('bracket_picks')
      .delete()
      .eq('pool_entry_id', entryId)

    await supabaseAdmin
      .from('category_picks')
      .delete()
      .eq('pool_entry_id', entryId)

    // Delete the entry
    const { error } = await supabaseAdmin
      .from('pool_entries')
      .delete()
      .eq('id', entryId)

    if (error) {
      console.error('Delete entry error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete entry error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
