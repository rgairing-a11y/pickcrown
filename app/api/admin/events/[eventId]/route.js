import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function json(status, payload) {
  return NextResponse.json(payload, { status })
}

export async function DELETE(request, { params }) {
  const supabase = getSupabaseAdmin()

  const { eventId } = params
  const url = new URL(request.url)
  const force = url.searchParams.get('force') === 'true'

  // Optional: accept actor_email from query or body (P1D will replace this with real auth)
  let body = {}
  try {
    body = await request.json()
  } catch (_) {}
  const actorEmail =
    body.actor_email ||
    url.searchParams.get('actor_email') ||
    request.headers.get('x-admin-email') ||
    'system'

  // helper: write audit log using BOTH legacy + new columns (so nothing breaks)
  async function writeAudit({ success, error_message, metadata, entity_id = eventId }) {
    const payload = {
      // legacy columns (your current table requires these)
      action: 'delete_event',
      actor_email: actorEmail,
      target_type: 'event',
      target_id: entity_id,

      // P1C columns (you just added)
      success,
      error_message: error_message ?? null,
      admin_identifier: actorEmail,
      entity_type: 'event',
      entity_id,

      metadata: metadata ?? {}
    }

    // Never throw from audit (don't hide real failures)
    try {
      await supabase.from('audit_log').insert(payload)
    } catch (e) {
      console.error('[AUDIT_LOG INSERT FAILED]', e)
    }
  }

  try {
    // 1) Load event
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('id, name, status')
      .eq('id', eventId)
      .single()

    if (eventErr || !event) {
      await writeAudit({
        success: false,
        error_message: 'Event not found',
        metadata: { force, blocked_by_guardrail: false }
      })

      return json(404, {
        success: false,
        error: 'Event not found',
        code: 'NOT_FOUND',
        hint: 'Check that the event ID is correct'
      })
    }

    // 2) Count pools
    const { count: poolCount, error: poolCountErr } = await supabase
      .from('pools')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)

    if (poolCountErr) {
      console.error('[POOL COUNT ERROR]', poolCountErr)

      await writeAudit({
        success: false,
        error_message: 'Failed to evaluate pool count',
        metadata: { force, event_status: event.status }
      })

      return json(500, {
        success: false,
        error: 'Failed to delete event',
        code: 'SERVER_ERROR',
        hint: 'Check server logs'
      })
    }

    // 3) Guardrail: status
    if (!force && (event.status === 'locked' || event.status === 'completed')) {
      await writeAudit({
        success: false,
        error_message: 'Cannot delete locked/completed event without force flag',
        metadata: {
          force,
          blocked_by_guardrail: true,
          guardrail_type: 'status_check',
          event_status: event.status,
          event_name: event.name,
          pool_count: poolCount ?? 0
        }
      })

      return json(403, {
        success: false,
        error: `Cannot delete ${event.status} event`,
        code: 'FORBIDDEN',
        hint: 'Add ?force=true to bypass this check'
      })
    }

    // 4) Guardrail: pools exist
    if (!force && (poolCount ?? 0) > 0) {
      await writeAudit({
        success: false,
        error_message: 'Event has pools; delete blocked without force flag',
        metadata: {
          force,
          blocked_by_guardrail: true,
          guardrail_type: 'pool_count_check',
          event_status: event.status,
          event_name: event.name,
          pool_count: poolCount ?? 0
        }
      })

      return json(409, {
        success: false,
        error: `Event has ${poolCount} pool(s)`,
        code: 'CONFLICT',
        hint: 'Delete pools first or add ?force=true to cascade delete'
      })
    }

    // 5) If force and pools exist, delete pools first (explicit cascade)
    if (force && (poolCount ?? 0) > 0) {
      const { error: delPoolsErr } = await supabase.from('pools').delete().eq('event_id', eventId)
      if (delPoolsErr) {
        console.error('[FORCE DELETE POOLS FAILED]', delPoolsErr)

        await writeAudit({
          success: false,
          error_message: 'Force delete failed while deleting pools',
          metadata: {
            force,
            event_status: event.status,
            event_name: event.name,
            pool_count: poolCount ?? 0,
            supabase_error: delPoolsErr
          }
        })

        return json(500, {
          success: false,
          error: 'Failed to delete pools for this event',
          code: 'SERVER_ERROR',
          hint: 'Check server logs'
        })
      }
    }

    // 6) Delete event
    const { error: delEventErr } = await supabase.from('events').delete().eq('id', eventId)

    if (delEventErr) {
      console.error('[DELETE EVENT FAILED]', delEventErr)

      await writeAudit({
        success: false,
        error_message: 'Event delete failed',
        metadata: {
          force,
          event_status: event.status,
          event_name: event.name,
          pool_count: poolCount ?? 0,
          supabase_error: delEventErr
        }
      })

      return json(500, {
        success: false,
        error: 'Failed to delete event',
        code: 'SERVER_ERROR',
        hint: 'Check server logs'
      })
    }

    await writeAudit({
      success: true,
      error_message: null,
      metadata: {
        force,
        event_status: event.status,
        event_name: event.name,
        pool_count: poolCount ?? 0
      }
    })

    return json(200, { success: true, data: { deleted: true } })
  } catch (err) {
    console.error('[DELETE EVENT UNHANDLED ERROR]', err)

    // Best-effort audit
    try {
      await supabase.from('audit_log').insert({
        action: 'delete_event',
        actor_email: 'system',
        target_type: 'event',
        target_id: eventId,
        success: false,
        error_message: 'Unhandled server error',
        admin_identifier: 'system',
        entity_type: 'event',
        entity_id: eventId,
        metadata: { force }
      })
    } catch (_) {}

    return json(500, {
      success: false,
      error: 'Unexpected server error',
      code: 'SERVER_ERROR',
      hint: 'Check server logs'
    })
  }
}
