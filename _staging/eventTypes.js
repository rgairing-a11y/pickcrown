// lib/eventTypes.js
// Central configuration for all event types
// Adding a new event type = add entry here, NOT modify standings page

export const EVENT_TYPES = {
  // Standard bracket (CFB Playoff, March Madness)
  bracket: {
    name: 'Bracket',
    scoringFunction: 'calculate_standings',
    pickTable: 'bracket_picks',
    pickColumn: 'picked_team_id',  // Column name for the team pick
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
    scoringFunction: 'calculate_advancement_standings',
    pickTable: 'advancement_picks',
    pickColumn: 'team_id',
    hasMatchups: false,  // Uses dynamic reseeding, not fixed matchups
    hasCategories: false,
    hasTeamEliminations: true,
    features: {
      scenarioSimulator: false,
      pathToVictory: false,
      popularBracketPicks: false,
      popularCategoryPicks: false,
      popularAdvancementPicks: true,
    }
  },

  // Pick-one / Category picks (Oscars, Awards shows)
  pick_one: {
    name: 'Pick One',
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

  // round_robin: {
  //   name: 'Round Robin',
  //   scoringFunction: 'calculate_round_robin_standings',
  //   pickTable: 'round_robin_picks',
  //   hasMatchups: true,
  //   hasCategories: false,
  //   features: { ... }
  // },

  // double_elimination: {
  //   name: 'Double Elimination',
  //   scoringFunction: 'calculate_double_elim_standings',
  //   pickTable: 'bracket_picks',
  //   hasMatchups: true,
  //   hasCategories: false,
  //   features: { ... }
  // },

  // survivor: {
  //   name: 'Survivor Pool',
  //   scoringFunction: 'calculate_survivor_standings',
  //   pickTable: 'survivor_picks',
  //   hasMatchups: false,
  //   hasCategories: false,
  //   features: { ... }
  // },

  // pick_em_spread: {
  //   name: "Pick'em with Spreads",
  //   scoringFunction: 'calculate_spread_standings',
  //   pickTable: 'spread_picks',
  //   hasMatchups: true,
  //   hasCategories: false,
  //   features: { ... }
  // },
}

// Helper to get event type config
export function getEventTypeConfig(event) {
  // Check uses_reseeding flag first (NFL-style)
  if (event?.uses_reseeding) {
    return EVENT_TYPES.advancement
  }
  
  // Check event_type field
  const eventType = event?.event_type || 'bracket'
  return EVENT_TYPES[eventType] || EVENT_TYPES.bracket
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
