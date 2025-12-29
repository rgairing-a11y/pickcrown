// tests/phases.test.js
// Run with: npm test

import { test, expect } from '@playwright/test'

// Import the functions we're testing
import { getPhaseStatus, isPhaseUnlocked } from '../lib/phases.js'

test.describe('Phase Status Logic', () => {
  
  // Test 1: Open phase (lock time in future)
  test('returns "open" when lock_time is in the future', () => {
    const phase = {
      lock_time: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      status: 'upcoming'
    }
    expect(getPhaseStatus(phase)).toBe('open')
  })

  // Test 2: Locked phase (lock time passed)
  test('returns "locked" when lock_time has passed', () => {
    const phase = {
      lock_time: new Date(Date.now() - 86400000).toISOString(), // yesterday
      status: 'upcoming'
    }
    expect(getPhaseStatus(phase)).toBe('locked')
  })

  // Test 3: Completed phase
  test('returns "completed" when status is completed', () => {
    const phase = {
      lock_time: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed'
    }
    expect(getPhaseStatus(phase)).toBe('completed')
  })

  // Test 4: Phase 1 always unlocked
  test('Phase 1 is always unlocked', () => {
    const phase1 = { phase_order: 1 }
    const phases = [phase1]
    expect(isPhaseUnlocked(phase1, phases)).toBe(true)
  })

  // Test 5: Phase 2 locked when Phase 1 not completed
  test('Phase 2 is locked when Phase 1 is not completed', () => {
    const phase1 = { phase_order: 1, status: 'upcoming' }
    const phase2 = { phase_order: 2, status: 'upcoming' }
    const phases = [phase1, phase2]
    expect(isPhaseUnlocked(phase2, phases)).toBe(false)
  })

  // Test 6: Phase 2 unlocked when Phase 1 completed
  test('Phase 2 is unlocked when Phase 1 is completed', () => {
    const phase1 = { phase_order: 1, status: 'completed' }
    const phase2 = { phase_order: 2, status: 'upcoming' }
    const phases = [phase1, phase2]
    expect(isPhaseUnlocked(phase2, phases)).toBe(true)
  })

  // Test 7: Phase 3 locked when Phase 2 not completed
  test('Phase 3 is locked when Phase 2 is not completed', () => {
    const phase1 = { phase_order: 1, status: 'completed' }
    const phase2 = { phase_order: 2, status: 'locked' }
    const phase3 = { phase_order: 3, status: 'upcoming' }
    const phases = [phase1, phase2, phase3]
    expect(isPhaseUnlocked(phase3, phases)).toBe(false)
  })

  // Test 8: Edge case - lock_time exactly now
  test('returns "locked" when lock_time is exactly now', () => {
    const phase = {
      lock_time: new Date().toISOString(),
      status: 'upcoming'
    }
    expect(getPhaseStatus(phase)).toBe('locked')
  })

  // Test 9: Handles missing previous phase gracefully
  test('returns false if previous phase is missing', () => {
    const phase2 = { phase_order: 2, status: 'upcoming' }
    const phases = [phase2] // phase 1 missing
    expect(isPhaseUnlocked(phase2, phases)).toBe(false)
  })

  // Test 10: Oscars scenario - full flow
  test('Oscars scenario: Nominations open, Winners locked', () => {
    const nominations = {
      id: 'nom-123',
      name: 'Nominations',
      phase_order: 1,
      lock_time: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      status: 'upcoming'
    }
    const winners = {
      id: 'win-456',
      name: 'Winners',
      phase_order: 2,
      lock_time: new Date(Date.now() + 86400000 * 60).toISOString(), // 60 days
      status: 'upcoming'
    }
    const phases = [nominations, winners]

    // Phase 1 should be open and unlocked
    expect(getPhaseStatus(nominations)).toBe('open')
    expect(isPhaseUnlocked(nominations, phases)).toBe(true)

    // Phase 2 should be open but NOT unlocked (waiting for phase 1 results)
    expect(getPhaseStatus(winners)).toBe('open')
    expect(isPhaseUnlocked(winners, phases)).toBe(false)
  })

})