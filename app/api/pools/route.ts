import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CreatePoolRequest, UpdatePoolRequest, Pool, ApiErrorResponse, ApiSuccessResponse } from '../../../lib/types'

export async function POST(request: NextRequest): Promise<NextResponse<Pool | ApiErrorResponse>> {
  const body = await request.json() as CreatePoolRequest

  const { data, error } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
    .from('pools')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest): Promise<NextResponse<Pool | ApiErrorResponse>> {
  const body = await request.json() as UpdatePoolRequest
  const { id, ...updates } = body

  const { data, error } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
    .from('pools')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiSuccessResponse | ApiErrorResponse>> {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const { error } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
    .from('pools')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}