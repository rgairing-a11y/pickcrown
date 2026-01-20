import { createClient } from '@/lib/supabase/server'

type AuditInput = {
  action: string
  actor_email?: string
  target_type: string
  target_id?: string | null
  metadata?: Record<string, any>
}

export async function logAudit(input: AuditInput): Promise<void> {
  const supabase = createClient()

  await supabase.rpc('log_audit_event', {
    p_action: input.action,
    p_actor_email: input.actor_email,
    p_target_type: input.target_type,
    p_target_id: input.target_id,
    p_metadata: input.metadata
  })
}
