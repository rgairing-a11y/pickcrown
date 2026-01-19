import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logAudit } from '@/lib/audit'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ poolId: string }> }
) {
  const supabase = getSupabaseAdmin()
  const { poolId } = await params

  const url = new URL(request.url)
  const force = url.searchParams.get('force') === 'true'

  // 1️⃣ Load pool
  const { data: pool, error: fetchError } = await supabase
    .from('pools')
    .select('*')
    .eq('id', poolId)
    .single()

  if (!pool || fetchError) {
    await logAudit({
      action: 'delete_pool',
      target_type: 'pool',
      target_id: poolId,
      metadata: {
        success: false,
        error_message: 'Pool not found',
        force
      }
    })

    return NextResponse.json(
      { success: false, error: 'Pool not found', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // 2️⃣ Soft delete → archive
  if (pool.status !== 'archived') {
    const { error: archiveError } = await supabase
      .from('pools')
      .update({ status: 'archived' })
      .eq('id', poolId)

    if (archiveError) {
      await logAudit({
        action: 'archive_pool',
        target_type: 'pool',
        target_id: poolId,
        metadata: {
          success: false,
          error_message: archiveError.message,
          previous_status: pool.status,
          force
        }
      })

      return NextResponse.json(
        { success: false, error: 'Failed to archive pool' },
        { status: 500 }
      )
    }

    await logAudit({
      action: 'archive_pool',
      target_type: 'pool',
      target_id: poolId,
      metadata: {
        success: true,
        previous_status: pool.status,
        new_status: 'archived',
        force
      }
    })

    return NextResponse.json({
      success: true,
      data: { archived: true }
    })
  }

  // 3️⃣ Hard delete (only if already archived)
  const { error: deleteError } = await supabase
    .from('pools')
    .delete()
    .eq('id', poolId)

  if (deleteError) {
    await logAudit({
      action: 'delete_pool',
      target_type: 'pool',
      target_id: poolId,
      metadata: {
        success: false,
        error_message: deleteError.message,
        previous_status: 'archived',
        force
      }
    })

    return NextResponse.json(
      { success: false, error: 'Failed to delete pool' },
      { status: 500 }
    )
  }

  await logAudit({
    action: 'delete_pool',
    target_type: 'pool',
    target_id: poolId,
    metadata: {
      success: true,
      previous_status: 'archived',
      force
    }
  })

  return NextResponse.json({
    success: true,
    data: { deleted: true }
  })
}
