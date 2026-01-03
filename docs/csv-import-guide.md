# CSV Import Guide

How to bulk import categories, options, teams, and matchups using CSV files.

---

## Overview

PickCrown supports CSV import for:

- **Categories & Options** — Pick-one events (Oscars, award shows)
- **Teams** — Bracket participants
- **Matchups** — Bracket structure

---

## Categories Import (Pick-One Events)

### Format

```csv
Category,Option
Best Picture,Anora
Best Picture,The Brutalist
Best Picture,A Complete Unknown
Best Picture,Conclave
Best Picture,Dune: Part Two
Best Director,Sean Baker
Best Director,Brady Corbet
Best Director,James Mangold
Best Actress,Demi Moore
Best Actress,Mikey Madison
Best Actress,Cynthia Erivo
```

### Rules

- First row is header (Category, Option)
- Category name in first column
- Option name in second column
- Repeat category name for each option
- Categories are created in order they first appear
- Options are created in order within each category

### Import Process

1. Go to `/admin/events/[eventId]/import`
2. Paste CSV content
3. Click "Preview Import"
4. Review categories and options
5. Click "Import"

### Example: Oscars 2025

```csv
Category,Option
Best Picture,Anora
Best Picture,The Brutalist
Best Picture,A Complete Unknown
Best Picture,Conclave
Best Picture,Dune: Part Two
Best Picture,Emilia Pérez
Best Picture,I'm Still Here
Best Picture,Nickel Boys
Best Picture,The Substance
Best Picture,Wicked
Best Director,Sean Baker
Best Director,Brady Corbet
Best Director,James Mangold
Best Director,Coralie Fargeat
Best Director,Jacques Audiard
Best Actor,Adrien Brody
Best Actor,Timothée Chalamet
Best Actor,Colman Domingo
Best Actor,Ralph Fiennes
Best Actor,Sebastian Stan
Best Actress,Cynthia Erivo
Best Actress,Karla Sofía Gascón
Best Actress,Mikey Madison
Best Actress,Demi Moore
Best Actress,Fernanda Torres
```

---

## Teams Import (Brackets)

### Format

```csv
Seed,Name
1,Indiana
2,Ohio State
3,Georgia
4,Texas Tech
5,Oregon
6,Ole Miss
7,Texas A&M
8,Oklahoma
9,Alabama
10,Miami
11,Tulane
12,James Madison
```

### Rules

- First row is header (Seed, Name)
- Seed is optional but recommended for display
- Names must be unique within the event
- Teams are created in order listed

### Import Process

1. Go to `/admin/events/[eventId]/bracket-setup`
2. Click "Import Teams"
3. Paste CSV content
4. Click "Import"

---

## Matchups Import (Brackets)

### Format

```csv
Round,Position,Team A,Team B
First Round,1,#8 Oklahoma,#9 Alabama
First Round,2,#5 Oregon,#12 James Madison
First Round,3,#7 Texas A&M,#10 Miami
First Round,4,#6 Ole Miss,#11 Tulane
Quarterfinals,1,#1 Indiana,TBD
Quarterfinals,2,#4 Texas Tech,TBD
Quarterfinals,3,#2 Ohio State,TBD
Quarterfinals,4,#3 Georgia,TBD
Semifinals,1,TBD,TBD
Semifinals,2,TBD,TBD
Championship,1,TBD,TBD
```

### Rules

- First row is header
- Round name must match existing round
- Position is bracket_position (1, 2, 3, etc.)
- Team names must match existing teams
- Use "TBD" or leave blank for undetermined matchups
- Use "BYE" for bye matchups (one team advances automatically)

### Bye Matchups

For tournaments with byes (like CFB Playoff):

```csv
Round,Position,Team A,Team B
First Round,1,#8 Oklahoma,#9 Alabama
First Round,2,#5 Oregon,#12 James Madison
First Round,3,#7 Texas A&M,#10 Miami
First Round,4,#6 Ole Miss,#11 Tulane
Quarterfinals,1,#1 Indiana,BYE
Quarterfinals,2,#4 Texas Tech,BYE
```

When Team B is "BYE":
- No matchup is played
- Team A advances automatically
- Users don't pick this matchup

---

## Rounds Setup

Before importing matchups, ensure rounds exist:

### Via Admin UI

1. Go to `/admin/events/[eventId]/bracket-setup`
2. Add rounds with:
   - Name (e.g., "First Round")
   - Order (1, 2, 3...)
   - Points (e.g., 5, 8, 13, 21)

### Via SQL

```sql
INSERT INTO rounds (event_id, name, round_order, points) VALUES
('event-uuid', 'First Round', 1, 5),
('event-uuid', 'Quarterfinals', 2, 8),
('event-uuid', 'Semifinals', 3, 13),
('event-uuid', 'Championship', 4, 21);
```

---

## Common Errors

### "Category not found"
- Category name in CSV doesn't match exactly
- Check for extra spaces or typos

### "Team not found"
- Team name doesn't exist in database
- Import teams before matchups

### "Round not found"
- Round name doesn't match
- Create rounds before importing matchups

### "Duplicate entry"
- Same category/option or team already exists
- Clear existing data or use update mode

---

## Clearing Existing Data

Before re-importing, you may need to clear existing data:

```sql
-- Clear options for an event
DELETE FROM category_options 
WHERE category_id IN (
  SELECT id FROM categories WHERE event_id = 'your-event-id'
);

-- Clear categories for an event
DELETE FROM categories WHERE event_id = 'your-event-id';

-- Clear matchups for an event
DELETE FROM matchups WHERE event_id = 'your-event-id';

-- Clear teams for an event
DELETE FROM teams WHERE event_id = 'your-event-id';
```

⚠️ **Warning:** This deletes all picks for these categories/matchups!

---

## Validation Checklist

Before importing:

- [ ] CSV has correct headers
- [ ] No trailing commas
- [ ] No extra blank rows
- [ ] Names match exactly (case-sensitive)
- [ ] Rounds exist (for matchups)
- [ ] Teams exist (for matchups)
- [ ] Event ID is correct

---

## Tips

1. **Start with a template** — Export existing data to see format
2. **Use a spreadsheet** — Build in Excel/Sheets, export as CSV
3. **Preview first** — Always preview before importing
4. **Test with one category** — Import one category to verify format
5. **Keep backups** — Export current data before bulk changes

---

## Sample Files

### Oscars Template
```csv
Category,Option
Best Picture,Film 1
Best Picture,Film 2
Best Director,Director 1
Best Director,Director 2
```

### March Madness Template
```csv
Seed,Name
1,Team 1
2,Team 2
3,Team 3
4,Team 4
```

### Bracket Matchups Template
```csv
Round,Position,Team A,Team B
Round of 64,1,Team 1,Team 64
Round of 64,2,Team 32,Team 33
```
