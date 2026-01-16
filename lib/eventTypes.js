// lib/eventTypes.js
// Central configuration for all event types
// Adding a new event type = add entry here, NOT modify standings page

// =====================================================
// ARCHETYPES (from Master Product Document - LOCKED)
// =====================================================
// These are the product-level concepts that cannot change without a version bump:
// - Bracket: Single-elimination, round-based, cascading results
// - Pick-One: Category-based selections with no rounds
// - Hybrid: Combination of bracket + pick-one
// - Multi-Phase: Sequential phases (e.g., nominations → winners)
//
// Event types below are IMPLEMENTATION FLAVORS of these archetypes.
// =====================================================

export const EVENT_TYPES = {
  // Standard bracket (CFB Playoff, March Madness)
  bracket: {
    name: 'Bracket',
    archetype: 'bracket',  // LOCKED archetype
    scoringFunction: 'calculate_standings',
    pickTable: 'bracket_picks',
    pickColumn: 'picked_team_id',
    hasMatchups: true,
    hasCategories: false,
    hasTeamEliminations: false,
    features: {
      scenarioSimulator: true,
      pathToVictory: true,
      popularBracketPicks: true,
      popularCategoryPicks: false,
      popularAdvancementPicks: false,
    }
  },

  // NFL Playoff style (reseeding, advancement picks)
  advancement: {
    name: 'Advancement',
    archetype: 'bracket',  // Still a bracket archetype - just with reseeding
    scoringFunction: 'calculate_advancement_standings',
    pickTable: 'advancement_picks',
    pickColumn: 'team_id',
    hasMatchups: false,  // Uses dynamic reseeding, not fixed matchups
    hasCategories: false,
    hasTeamEliminations: true,
    features: {
      scenarioSimulator: false,
      pathToVictory: false,  // Could add NFL-specific version later
      popularBracketPicks: false,
      popularCategoryPicks: false,
      popularAdvancementPicks: true,
    }
  },

  // Pick-one / Category picks (Oscars, Awards shows)
  pick_one: {
    name: 'Pick One',
    archetype: 'pick-one',  // LOCKED archetype
    scoringFunction: 'calculate_standings',
    pickTable: 'category_picks',
    pickColumn: 'option_id',
    hasMatchups: false,
    hasCategories: true,
    hasTeamEliminations: false,
    features: {
      scenarioSimulator: false,
      pathToVictory: false,
      popularBracketPicks: false,
      popularCategoryPicks: true,
      popularAdvancementPicks: false,
    }
  },

  // Hybrid (Bracket + Categories, e.g., WrestleMania)
  hybrid: {
    name: 'Hybrid',
    archetype: 'hybrid',  // LOCKED archetype
    scoringFunction: 'calculate_standings',
    pickTable: ['bracket_picks', 'category_picks'],
    hasMatchups: true,
    hasCategories: true,
    hasTeamEliminations: false,
    features: {
      scenarioSimulator: true,
      pathToVictory: true,
      popularBracketPicks: true,
      popularCategoryPicks: true,
      popularAdvancementPicks: false,
    }
  },

  // ============ FUTURE EVENT TYPES ============
  // Uncomment and configure when needed
  // All must map to a LOCKED archetype

  // survivor: {
  //   name: 'Survivor Pool',
  //   archetype: 'pick-one',  // Survivor is pick-one: one pick per week, append-only
  //   scoringFunction: 'calculate_survivor_standings',
  //   pickTable: 'survivor_picks',
  //   hasMatchups: false,
  //   hasCategories: false,
  //   hasTeamEliminations: true,
  //   features: {
  //     scenarioSimulator: false,
  //     pathToVictory: false,
  //     popularBracketPicks: false,
  //     popularCategoryPicks: false,
  //     popularAdvancementPicks: false,
  //     popularSurvivorPicks: true,  // New feature for survivor
  //   }
  // },

  // round_robin: {
  //   name: 'Round Robin',
  //   archetype: 'bracket',  // Multi-game bracket variant
  //   scoringFunction: 'calculate_round_robin_standings',
  //   pickTable: 'round_robin_picks',
  //   hasMatchups: true,
  //   hasCategories: false,
  //   features: { ... }
  // },

  // double_elimination: {
  //   name: 'Double Elimination',
  //   archetype: 'bracket',  // Bracket variant
  //   scoringFunction: 'calculate_double_elim_standings',
  //   pickTable: 'bracket_picks',
  //   hasMatchups: true,
  //   hasCategories: false,
  //   features: { ... }
  // },

  // pick_em_spread: {
  //   name: "Pick'em with Spreads",
  //   archetype: 'pick-one',  // Weekly picks against the spread
  //   scoringFunction: 'calculate_spread_standings',
  //   pickTable: 'spread_picks',
  //   hasMatchups: true,
  //   hasCategories: false,
  //   features: { ... }
  // },

  // multi_phase: {
  //   name: 'Multi-Phase',
  //   archetype: 'multi-phase',  // LOCKED archetype (e.g., Oscars nominations → winners)
  //   scoringFunction: 'calculate_standings',
  //   pickTable: 'category_picks',
  //   hasMatchups: false,
  //   hasCategories: true,
  //   hasPhases: true,
  //   features: { ... }
  // },
}

// Helper to get event type config
// Priority: explicit event_type > uses_reseeding inference > default bracket
export function getEventTypeConfig(event) {
  // 1. Check explicit event_type field first (preferred)
  if (event?.event_type && EVENT_TYPES[event.event_type]) {
    return EVENT_TYPES[event.event_type]
  }
  
  // 2. Fallback: infer from uses_reseeding flag (legacy support)
  if (event?.uses_reseeding) {
    return EVENT_TYPES.advancement
  }
  
  // 3. Default to bracket
  return EVENT_TYPES.bracket
}

// Helper to determine which scoring function to use
export function getScoringFunction(event) {
  const config = getEventTypeConfig(event)
  return config.scoringFunction
}

// Helper to check if a feature is enabled for this event type
export function hasFeature(event, featureName) {
  const config = getEventTypeConfig(event)
  return config.features?.[featureName] || false
}

// Helper to get the archetype for an event
export function getArchetype(event) {
  const config = getEventTypeConfig(event)
  return config.archetype
}
