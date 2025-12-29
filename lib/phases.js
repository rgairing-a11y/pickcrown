// lib/phases.js

export function getPhaseStatus(phase) {
  const now = new Date()
  const lockTime = new Date(phase.lock_time)
  
  if (phase.status === 'completed') return 'completed'
  if (now >= lockTime) return 'locked'
  return 'open'
}

export function isPhaseUnlocked(phase, phases) {
  if (phase.phase_order === 1) return true
  
  const prevPhase = phases.find(p => p.phase_order === phase.phase_order - 1)
  return prevPhase?.status === 'completed'
}