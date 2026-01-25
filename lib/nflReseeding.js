// lib/nflReseeding.js
// NFL Playoffs reseeding logic for bracket events
//
// This module handles two distinct concerns:
// 1. CLIENT-SIDE PROJECTION: Generate projected matchups from user picks (memory only)
// 2. SERVER-SIDE GENERATION: Create real matchups from actual game results (persisted)
//
// NFL Reseeding Rules:
// - After Wildcard round, winners are reseeded by seed number
// - #1 seed (bye team) plays lowest remaining seed
// - Next highest plays next lowest
// - This continues until matchups are set

/**
 * Apply NFL reseeding algorithm to generate Divisional matchups
 *
 * @param {Object[]} advancingTeams - Teams that won Wildcard (or have bye)
 *   Each team must have: { id, seed, conference, name, has_bye? }
 * @param {string} conference - 'AFC' or 'NFC'
 * @returns {Object[]} Array of matchup pairings: [{ team_a, team_b, bracket_position }]
 */
export function generateReseedMatchups(advancingTeams, conference) {
  // Filter to specified conference
  const conferenceTeams = advancingTeams.filter(t => t.conference === conference)

  if (conferenceTeams.length === 0) {
    return []
  }

  // Sort by seed (ascending - lowest seed number = highest seed)
  const sorted = [...conferenceTeams].sort((a, b) => a.seed - b.seed)

  // Pair: highest vs lowest, next highest vs next lowest
  const matchups = []
  let position = 1

  while (sorted.length >= 2) {
    const highest = sorted.shift()  // Remove first (lowest seed number = best seed)
    const lowest = sorted.pop()     // Remove last (highest seed number = worst seed)

    matchups.push({
      team_a: highest,  // Higher seed (lower number) is team_a
      team_b: lowest,   // Lower seed (higher number) is team_b
      bracket_position: position
    })
    position++
  }

  return matchups
}

/**
 * PROJECT Divisional matchups based on user's Wildcard picks
 * This is for CLIENT-SIDE bracket UI only - not persisted
 *
 * @param {Object[]} wildcardMatchups - Wildcard round matchups with picks
 *   Each matchup: { id, team_a_id, team_b_id, team_a, team_b }
 * @param {Object} picks - User's picks: { matchup_id: picked_team_id }
 * @param {Object[]} allTeams - All teams in the event (for bye teams)
 * @returns {Object[]} Projected Divisional matchups per conference
 */
export function projectDivisionalMatchups(wildcardMatchups, picks, allTeams) {
  // Collect advancing teams (picked winners + bye teams)
  const advancingTeams = []

  // Add bye teams (they automatically advance)
  allTeams.forEach(team => {
    if (team.has_bye) {
      advancingTeams.push(team)
    }
  })

  // Add picked Wildcard winners
  wildcardMatchups.forEach(matchup => {
    const pickedTeamId = picks[matchup.id]
    if (pickedTeamId) {
      // Find the picked team from matchup
      const pickedTeam = matchup.team_a_id === pickedTeamId
        ? matchup.team_a
        : matchup.team_b
      if (pickedTeam) {
        advancingTeams.push(pickedTeam)
      }
    }
  })

  // Generate matchups for each conference
  const afcMatchups = generateReseedMatchups(advancingTeams, 'AFC')
  const nfcMatchups = generateReseedMatchups(advancingTeams, 'NFC')

  return {
    AFC: afcMatchups,
    NFC: nfcMatchups
  }
}

/**
 * Check if user has completed all picks for a round
 *
 * @param {Object[]} roundMatchups - Matchups in the round
 * @param {Object} picks - User's picks
 * @returns {boolean}
 */
export function isRoundComplete(roundMatchups, picks) {
  return roundMatchups.every(m => {
    // Bye games don't need picks
    if (m.team_a_id && !m.team_b_id) return true
    if (!m.team_a_id && m.team_b_id) return true
    // Real matchups need picks
    return picks[m.id] != null
  })
}

/**
 * Get teams advancing from a round based on picks
 *
 * @param {Object[]} roundMatchups - Matchups in the round
 * @param {Object} picks - User's picks
 * @param {Object} teamMap - Map of team_id -> team object
 * @returns {Object[]} Teams that advance based on picks
 */
export function getAdvancingTeamsFromPicks(roundMatchups, picks, teamMap) {
  const advancing = []

  roundMatchups.forEach(matchup => {
    // Handle bye games (team automatically advances)
    if (matchup.team_a_id && !matchup.team_b_id) {
      const team = teamMap[matchup.team_a_id]
      if (team) advancing.push(team)
      return
    }
    if (!matchup.team_a_id && matchup.team_b_id) {
      const team = teamMap[matchup.team_b_id]
      if (team) advancing.push(team)
      return
    }

    // Real matchup - check pick
    const pickedId = picks[matchup.id]
    if (pickedId) {
      const team = teamMap[pickedId]
      if (team) advancing.push(team)
    }
  })

  return advancing
}

/**
 * Get teams advancing from a round based on actual results
 *
 * @param {Object[]} roundMatchups - Matchups with winner_team_id set
 * @param {Object} teamMap - Map of team_id -> team object
 * @returns {Object[]} Teams that won in this round
 */
export function getAdvancingTeamsFromResults(roundMatchups, teamMap) {
  const advancing = []

  roundMatchups.forEach(matchup => {
    // Handle bye games
    if (matchup.team_a_id && !matchup.team_b_id) {
      const team = teamMap[matchup.team_a_id]
      if (team) advancing.push(team)
      return
    }
    if (!matchup.team_a_id && matchup.team_b_id) {
      const team = teamMap[matchup.team_b_id]
      if (team) advancing.push(team)
      return
    }

    // Real matchup - check actual winner
    if (matchup.winner_team_id) {
      const team = teamMap[matchup.winner_team_id]
      if (team) advancing.push(team)
    }
  })

  return advancing
}

/**
 * Check if a round is complete (all winners determined)
 *
 * @param {Object[]} roundMatchups - Matchups in the round
 * @returns {boolean}
 */
export function isRoundResultsComplete(roundMatchups) {
  return roundMatchups.every(m => {
    // Bye games are automatically complete
    if (m.team_a_id && !m.team_b_id) return true
    if (!m.team_a_id && m.team_b_id) return true
    // Real matchups need winner
    return m.winner_team_id != null
  })
}

/**
 * Build matchup data for database insertion
 * Creates matchup objects ready to be inserted into the matchups table
 *
 * @param {Object[]} reseedMatchups - Output from generateReseedMatchups
 * @param {string} roundId - UUID of the round
 * @param {string} eventId - UUID of the event
 * @param {string} conference - 'AFC' or 'NFC' (for bracket_position offset)
 * @param {number} positionOffset - Starting bracket position (0 for AFC, 2 for NFC)
 * @returns {Object[]} Database-ready matchup objects
 */
export function buildMatchupInserts(reseedMatchups, roundId, eventId, positionOffset = 0) {
  return reseedMatchups.map((m, index) => ({
    event_id: eventId,
    round_id: roundId,
    team_a_id: m.team_a.id,
    team_b_id: m.team_b.id,
    bracket_position: positionOffset + index + 1,
    winner_team_id: null
  }))
}

/**
 * Validate reseeding can proceed
 *
 * @param {Object[]} roundMatchups - Matchups in the source round
 * @param {Object[]} targetRoundMatchups - Existing matchups in target round
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateReseedingReady(roundMatchups, targetRoundMatchups = []) {
  // Check all source round games are complete
  if (!isRoundResultsComplete(roundMatchups)) {
    return {
      valid: false,
      error: 'Not all games in the source round are complete'
    }
  }

  // Check target round doesn't already have matchups with teams
  const hasExistingTeams = targetRoundMatchups.some(
    m => m.team_a_id != null || m.team_b_id != null
  )
  if (hasExistingTeams) {
    return {
      valid: false,
      error: 'Target round already has matchups with teams assigned'
    }
  }

  return { valid: true }
}
