import { NextResponse, NextRequest } from 'next/server'
import { getAdminClient } from '../../../lib/supabase/clients'
import type { CreateCategoryRequest, Category, ApiErrorResponse, ApiSuccessResponse } from '../../../lib/types'

export async function POST(request: NextRequest): Promise<NextResponse<Category | ApiErrorResponse>> {
  const body = await request.json() as CreateCategoryRequest

  const { data, error } = await getAdminClient()
    .from('categories')
    .insert(body)
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

  const { error } = await getAdminClient()
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}