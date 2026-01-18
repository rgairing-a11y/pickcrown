// lib/audit.ts
import { getSupabaseAdmin } from './supabase-admin'

type AuditInput = {
  action: string
  actor_email?: string
  target_type: string
  target_id?: string | null
  metadata?: Record<string, any>
}

export async function logAudit(input: AuditInput) {
  const supabase = getSupabaseAdmin()

  await supabase.from('audit_log').insert({
    action: input.action,
    actor_email: input.actor_email ?? 'system',
    target_type: input.target_type,
    target_id: input.target_id ?? null,
    metadata: input.metadata ?? {},
  })
}
