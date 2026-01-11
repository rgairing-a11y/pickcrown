// =====================================================
// STANDINGS PAGE FIXES FOR NFL RESEEDING EVENTS
// Apply to: app/pool/[poolId]/standings/page.js
// =====================================================

// ==================== CHANGE 1 ====================
// Line 16-20: Update pool query to include uses_reseeding
// 
// FIND:
//   const { data: pool } = await supabase
//     .from('pools')
//     .select('*, event:events(id, name, year, start_time, season_id, event_type, season:seasons(id, name))')
//     .eq('id', poolId)
//     .single()
//
// REPLACE WITH:
  const { data: pool } = await supabase
    .from('pools')
    .select('*, event:events(id, name, year, start_time, season_id, event_type, uses_reseeding, season:seasons(id, name))')
    .eq('id', poolId)
    .single()


// ==================== CHANGE 2 ====================
// After line 24 (after the "if (!pool)" check), add NFL detection
// Then update standings call
//
// FIND (around line 26-27):
//   const { data: standings } = await supabase
//     .rpc('calculate_standings', { p_pool_id: poolId })
//
// REPLACE WITH:
  const usesReseeding = pool.event?.uses_reseeding === true
  
  // Use NFL-specific function for reseeding events
  const { data: standings } = usesReseeding
    ? await supabase.rpc('calculate_advancement_standings', { p_pool_id: poolId })
    : await supabase.rpc('calculate_standings', { p_pool_id: poolId })


// ==================== CHANGE 3 ====================
// Around line 420-427: Update MyPicksButton call
//
// FIND:
//   {isLocked && simulatorMatchups.length > 0 && (
//     <MyPicksButton
//       poolEntries={myPicksEntries}
//       bracketPicks={allBracketPicks}
//       matchups={simulatorMatchups}
//       roundNames={simulatorRoundNames}
//     />
//   )}
//
// REPLACE WITH:
        {isLocked && (usesReseeding || simulatorMatchups.length > 0) && (
          <MyPicksButton
            pool={pool}
            poolId={poolId}
            poolEntries={myPicksEntries}
            bracketPicks={allBracketPicks}
            matchups={simulatorMatchups}
            roundNames={simulatorRoundNames}
          />
        )}


// ==================== CHANGE 4 ====================
// Around line 816: Wrap Popular Bracket Picks to skip for NFL
//
// FIND:
//   {isLocked && bracketPopularPicks.length > 0 && (
//
// REPLACE WITH:
      {isLocked && !usesReseeding && bracketPopularPicks.length > 0 && (


// ==================== CHANGE 5 ====================
// Find the Scenario Simulator section and wrap it to skip for NFL
// Look for ScenarioSimulator component usage and wrap with !usesReseeding
//
// FIND something like:
//   {isLocked && simulatorMatchups.length > 0 && (
//     <ScenarioSimulator ... />
//   )}
//
// REPLACE WITH:
//   {isLocked && !usesReseeding && simulatorMatchups.length > 0 && (
//     <ScenarioSimulator ... />
//   )}


// ==================== OPTIONAL: NFL POPULAR PICKS ====================
// You could add an NFL-specific "Popular Advancement Picks" section
// that shows which teams were most picked for each round.
// This would query advancement_picks instead of bracket_picks.
// (Can add this later if desired)
