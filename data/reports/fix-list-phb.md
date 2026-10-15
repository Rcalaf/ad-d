# Fix list: phb.md

Generated 2026-10-15 14:56.

190 tasks: 127 **Fix** (certainly wrong) and 63 **Review** (check against the book).

## How to use this list

1. Open the PDF and this list side by side, and work through the pages in order.
2. Each task links to its line in the Markdown file (open this list in VS Code's preview, Cmd+Shift+V, to follow the links).
3. Read the task's guide the first time you meet a kind of problem; the guides are at the end of the list.
4. After a working session, run `pnpm --filter @dnd/knowledge check-books`: the list is regenerated and fixed tasks disappear. There's no need to tick boxes.
5. A Review task you've checked and found correct will keep appearing; that's expected.

## Tasks by page

### Whole book

- [ ] Review · no line · `table-number-missing` · [guide](#guide-table-number-missing)
  - 13 table numbers are missing from the sequence: 2, 4, 5, 6, 18, 21, 22, 32, 33, 38, 41, 61, 62.

### Page 13

- [ ] **Fix** · [line 299](../books/phb.md#L299) · The Real Basics > Glossary · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: heading "Glossary" starts somewhere on page 13; exact position not detected.
  - Text: `<!-- UNCLEAR: heading "Glossary" starts somewhere on page 13; exact position not detected -->`

### Page 16

- [ ] **Fix** · [line 443](../books/phb.md#L443) · The Real Basics > Step-by-Step Player Character Generation · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: heading "Step-by-Step Player Character Generation" starts somewhere on page 16; exact position not detected.
  - Text: `<!-- UNCLEAR: heading "Step-by-Step Player Character Generation" starts somewhere on page 16; exact ...`

### Page 19

- [ ] Review · [line 597](../books/phb.md#L597) · Chapter 1: Player Character Ability Scores > The Ability Scores > Table 1: Strength · `table-number-duplicate` · [guide](#guide-table-number-duplicate)
  - Table 1 appears 2 times (lines 597, 17938).
  - Text: `#### Table 1: Strength`
- [ ] Review · [line 599](../books/phb.md#L599) · Chapter 1: Player Character Ability Scores > The Ability Scores > Table 1: Strength · `chunk-duplicate` · [guide](#guide-chunk-duplicate)
  - The same text appears in two chunks, at line 599 and also at line 17940.
  - Text: `| Ability Score | Hit Prob. | Damage Adjust. | Weight Allow. | Max. Press | Open Doors | Bend Bars/ `

### Page 20

- [ ] **Fix** · [line 638](../books/phb.md#L638) · Chapter 1: Player Character Ability Scores > The Ability Scores > Table 1: Strength · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 20.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 20 -->`
- [ ] **Fix** · [line 639](../books/phb.md#L639) · Chapter 1: Player Character Ability Scores > The Ability Scores > Table 1: Strength · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 20 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 20 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 641](../books/phb.md#L641) · Chapter 1: Player Character Ability Scores > The Ability Scores > Table 1: Strength · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  | Table 2: Dexterity Missile |  |`

### Page 21

- [ ] **Fix** · [line 704](../books/phb.md#L704) · Chapter 1: Player Character Ability Scores > The Ability Scores > Constitution · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 21.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 21 -->`
- [ ] **Fix** · [line 705](../books/phb.md#L705) · Chapter 1: Player Character Ability Scores > The Ability Scores > Constitution · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 21 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 21 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 707](../books/phb.md#L707) · Chapter 1: Player Character Ability Scores > The Ability Scores > Constitution · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  |  | T Cons | able 3: titution |  |  |`

### Page 22

- [ ] **Fix** · [line 760](../books/phb.md#L760) · Chapter 1: Player Character Ability Scores > The Ability Scores > Intelligence · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 22.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 22 -->`
- [ ] **Fix** · [line 761](../books/phb.md#L761) · Chapter 1: Player Character Ability Scores > The Ability Scores > Intelligence · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 22 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 22 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 763](../books/phb.md#L763) · Chapter 1: Player Character Ability Scores > The Ability Scores > Intelligence · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  |  | In | Table 4: telligen | ce |  |`

### Page 23

- [ ] **Fix** · [line 820](../books/phb.md#L820) · Chapter 1: Player Character Ability Scores > The Ability Scores > Charisma · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 23.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 23 -->`
- [ ] **Fix** · [line 821](../books/phb.md#L821) · Chapter 1: Player Character Ability Scores > The Ability Scores > Charisma · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 23 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 23 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 823](../books/phb.md#L823) · Chapter 1: Player Character Ability Scores > The Ability Scores > Charisma · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  | Magical | Tab Wis | le 5: dom Chance |  |`

### Page 25

- [ ] **Fix** · [line 890](../books/phb.md#L890) · Chapter 1: Player Character Ability Scores > What the Numbers Mean · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 25.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 25 -->`
- [ ] **Fix** · [line 891](../books/phb.md#L891) · Chapter 1: Player Character Ability Scores > What the Numbers Mean · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 25 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 25 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 893](../books/phb.md#L893) · Chapter 1: Player Character Ability Scores > What the Numbers Mean · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  | Table 6: Charisma Maximum |  |`

### Page 27

- [ ] Review · [line 983](../books/phb.md#L983) · Chapter 2: Player Character Races > Dwarves > Table 7: Racial Ability Requirements · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 2: Player Character Races > Dwarves starts in the middle of a sentence.
  - Text: `cheeks, dark eyes, and dark hair. Dwarves generally live for 350 years. Dwarves tend to be dour and`

### Page 28

- [ ] Review · [line 1006](../books/phb.md#L1006) · Chapter 2: Player Character Races > Dwarves > Table 8: Racial Ability Adjustments · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 2: Player Character Races > Dwarves starts in the middle of a sentence.
  - Text: `proficiency slots he allots to languages (if that optional system is used). By nature, dwarves are `
- [ ] Review · [line 1020](../books/phb.md#L1020) · Chapter 2: Player Character Races > Dwarves > Table 9: Constitution Saving Throw Bonuses · `table-number-duplicate` · [guide](#guide-table-number-duplicate)
  - Table 9 appears 2 times (lines 1020, 18040).
  - Text: `#### Table 9: Constitution Saving Throw Bonuses`
- [ ] **Fix** · [line 1030](../books/phb.md#L1030) · Chapter 2: Player Character Races > Dwarves > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 28 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 28 may contain text from the surrounding column; check against the print...`

### Page 30

- [ ] **Fix** · [line 1100](../books/phb.md#L1100) · Chapter 2: Player Character Races > Gnomes · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 30 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 30 may contain text from the surrounding column; check against the print...`

### Page 33

- [ ] **Fix** · [line 1201](../books/phb.md#L1201) · Chapter 2: Player Character Races > Other Characteristics > Table 10 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table "Table 10" on page 33 could not be rebuilt as a table; the content follows as extracted, check the printed page.
  - Text: `<!-- UNCLEAR: table "Table 10" on page 33 could not be rebuilt as a table; the content follows as ex...`
- [ ] **Fix** · [line 1206](../books/phb.md#L1206) · Chapter 2: Player Character Races > Other Characteristics > Table 11: Age · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table "Table 11: Age" on page 33 could not be rebuilt as a table; the content follows as extracted, check the printed page.
  - Text: `<!-- UNCLEAR: table "Table 11: Age" on page 33 could not be rebuilt as a table; the content follows ...`
- [ ] Review · [line 1208](../books/phb.md#L1208) · Chapter 2: Player Character Races > Other Characteristics > Table 11: Age · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 11: Age" has no Markdown table under it.
  - Text: `* Upon attaining this age, an elf does not die. Rather he feels compelled to migrate to some mysteri`
- [ ] **Fix** · [line 1211](../books/phb.md#L1211) · Chapter 2: Player Character Races > Other Characteristics > Table 12: Aging Effects · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table "Table 12: Aging Effects" on page 33 could not be rebuilt as a table; the content follows as extracted, check the printed page.
  - Text: `<!-- UNCLEAR: table "Table 12: Aging Effects" on page 33 could not be rebuilt as a table; the conten...`
- [ ] Review · [line 1213](../books/phb.md#L1213) · Chapter 2: Player Character Races > Other Characteristics > Table 12: Aging Effects · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 12: Aging Effects" has no Markdown table under it.
  - Text: `Middle Age* Old Age** Venerable*** Race (1⁄2 Base Max.) (2⁄3 Base Max.) (Base Max.) Dwarf 125 years `

### Page 35

- [ ] **Fix** · [line 1269](../books/phb.md#L1269) · Chapter 3: Player Character Classes > Class Ability Score Requirements · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 35.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 35 -->`
- [ ] **Fix** · [line 1270](../books/phb.md#L1270) · Chapter 3: Player Character Classes > Class Ability Score Requirements · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 35 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 35 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 1272](../books/phb.md#L1272) · Chapter 3: Player Character Classes > Class Ability Score Requirements · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  |  | Tab | le 13: |  |  |  |`

### Page 38

- [ ] **Fix** · [line 1377](../books/phb.md#L1377) · Chapter 3: Player Character Classes > Warrior > Table 16: Fighter’s Followers · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table "Table 16: Fighter’s Followers" on page 38 could not be rebuilt as a table; the content follows as extracted, check the printed page.
  - Text: `<!-- UNCLEAR: table "Table 16: Fighter’s Followers" on page 38 could not be rebuilt as a table; the ...`
- [ ] Review · [line 1379](../books/phb.md#L1379) · Chapter 3: Player Character Classes > Warrior > Table 16: Fighter’s Followers · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 16: Fighter’s Followers" has no Markdown table under it.
  - Text: `Roll percentile dice on each of the following subtables of Table 16: once for the leader of the troo`
- [ ] Review · [line 1391](../books/phb.md#L1391) · Chapter 3: Player Character Classes > Warrior > Table 16: Fighter’s Followers · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 16: Fighter’s Followers" has no Markdown table under it.
  - Text: `**Die RollElite Units** 01–10 10 mounted knights: 1st-level fighters with field plate, large shield,`

### Page 40

- [ ] **Fix** · [line 1451](../books/phb.md#L1451) · Chapter 3: Player Character Classes > Warrior > Table 17: Paladin Spell Progression · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 40 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 40 has header cells that were not detected; check column headings agains...`

### Page 41

- [ ] **Fix** · [line 1546](../books/phb.md#L1546) · Chapter 3: Player Character Classes > Warrior > Table 19: Ranger’s Followers · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 41.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 41 -->`
- [ ] **Fix** · [line 1547](../books/phb.md#L1547) · Chapter 3: Player Character Classes > Warrior > Table 19: Ranger’s Followers · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 41 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 41 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 1549](../books/phb.md#L1549) · Chapter 3: Player Character Classes > Warrior > Table 19: Ranger’s Followers · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  | Ra | Table nger A | 18: biliti | es |  |  |`

### Page 43

- [ ] **Fix** · [line 1642](../books/phb.md#L1642) · Chapter 3: Player Character Classes > Wizard > Table 20: Wizard Experience Levels · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 43.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 43 -->`
- [ ] **Fix** · [line 1643](../books/phb.md#L1643) · Chapter 3: Player Character Classes > Wizard > Table 20: Wizard Experience Levels · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 43 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 43 may contain text from the surrounding column; check against the print...`
- [ ] **Fix** · [line 1644](../books/phb.md#L1644) · Chapter 3: Player Character Classes > Wizard > Table 20: Wizard Experience Levels · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 43 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 43 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 1646](../books/phb.md#L1646) · Chapter 3: Player Character Classes > Wizard > Table 20: Wizard Experience Levels · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `| 4), the character under- stands the spell and how to cast it. He can |  |  |  |  | Table | 21: |  ...`

### Page 45

- [ ] **Fix** · [line 1701](../books/phb.md#L1701) · Chapter 3: Player Character Classes > Wizard > Specialist Wizards · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 45.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 45 -->`
- [ ] **Fix** · [line 1702](../books/phb.md#L1702) · Chapter 3: Player Character Classes > Wizard > Specialist Wizards · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 45 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 45 has header cells that were not detected; check column headings agains...`
- [ ] Review · [line 1704](../books/phb.md#L1704) · Chapter 3: Player Character Classes > Wizard > Specialist Wizards · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `|  |  | Ta | ble 22: |  |`

### Page 47

- [ ] **Fix** · [line 1810](../books/phb.md#L1810) · Chapter 3: Player Character Classes > Priest > Table 24: Priest Spell Progression · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 47 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 47 has header cells that were not detected; check column headings agains...`

### Page 54

- [ ] **Fix** · [line 2145](../books/phb.md#L2145) · Chapter 3: Player Character Classes > Rogue > Table 27: Thieving Skill Racial Adjustments · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table "Table 27: Thieving Skill Racial Adjustments" on page 54 could not be rebuilt as a table; the content follows as extracted, check the printed page.
  - Text: `<!-- UNCLEAR: table "Table 27: Thieving Skill Racial Adjustments" on page 54 could not be rebuilt as...`
- [ ] Review · [line 2147](../books/phb.md#L2147) · Chapter 3: Player Character Classes > Rogue > Table 27: Thieving Skill Racial Adjustments · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 27: Thieving Skill Racial Adjustments" has no Markdown table under it.
  - Text: `Skill Dwarf Elf Gnome Half-elf Halfling Pick Pockets — +5% — +10% +5% Open Locks +10% –5% +5% — +5% `
- [ ] **Fix** · [line 2150](../books/phb.md#L2150) · Chapter 3: Player Character Classes > Rogue > Table 28: Thieving Skill Dexterity Adjustments · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table "Table 28: Thieving Skill Dexterity Adjustments" on page 54 could not be rebuilt as a table; the content follows as extracted, check the printed page.
  - Text: `<!-- UNCLEAR: table "Table 28: Thieving Skill Dexterity Adjustments" on page 54 could not be rebuilt...`
- [ ] Review · [line 2152](../books/phb.md#L2152) · Chapter 3: Player Character Classes > Rogue > Table 28: Thieving Skill Dexterity Adjustments · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 28: Thieving Skill Dexterity Adjustments" has no Markdown table under it.
  - Text: `Pick Open Find/ Move Hide in Dexterity Pockets Locks Remove Traps Silently Shadows 9 –15% –10% –10% `

### Page 56

- [ ] Review · [line 2204](../books/phb.md#L2204) · Chapter 3: Player Character Classes > Rogue > Table 29: Thieving Skill Armor Adjustments · `table-number-duplicate` · [guide](#guide-table-number-duplicate)
  - Table 29 appears 2 times (lines 2204, 18253).
  - Text: `#### Table 29: Thieving Skill Armor Adjustments`
- [ ] Review · [line 2219](../books/phb.md#L2219) · Chapter 3: Player Character Classes > Rogue > Table 29: Thieving Skill Armor Adjustments · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 3: Player Character Classes > Rogue > Thief > Skill Explanations starts in the middle of a sentence.
  - Text: `find any traps,” it’s up to the player to decide whether that means there are no traps or there are `

### Page 57

- [ ] **Fix** · [line 2265](../books/phb.md#L2265) · Chapter 3: Player Character Classes > Rogue > Table 30 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: Table 30 on page 56: title and table structure were not recovered; its content follows as extracted text, check the printed page.
  - Text: `<!-- UNCLEAR: Table 30 on page 56: title and table structure were not recovered; its content follows...`

### Page 58

- [ ] **Fix** · [line 2267](../books/phb.md#L2267) · Chapter 3: Player Character Classes > Rogue > Table 30 · `table-flattened` · [guide](#guide-table-flattened)
  - Table 30 was written as a single line of text instead of a table.
  - Text: `Table 30: Thief’s Level Damage Multiplier 1–4 2 5–8 3 9–12 4 13+ 5 <!-- page 58 --> magical writings...`
- [ ] **Fix** · [line 2277](../books/phb.md#L2277) · Chapter 3: Player Character Classes > Rogue > Table 31: Thief’s Followers · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 58 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 58 has header cells that were not detected; check column headings agains...`
- [ ] Review · [line 2299](../books/phb.md#L2299) · Chapter 3: Player Character Classes > Rogue > Table 31: Thief’s Followers · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 3: Player Character Classes > Rogue > Thief > Backstab Damage Multipliers starts in the middle of a sentence.
  - Text: `comrades. Table 31 can be used to determine the type and level of followers, or the DM can choose fo`

### Page 59

- [ ] **Fix** · [line 2333](../books/phb.md#L2333) · Chapter 3: Player Character Classes > Rogue > Bard · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 59.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 59 -->`
- [ ] **Fix** · [line 2334](../books/phb.md#L2334) · Chapter 3: Player Character Classes > Rogue > Bard · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 59 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 59 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 2336](../books/phb.md#L2336) · Chapter 3: Player Character Classes > Rogue > Bard · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  |  | Table 32: |  |`

### Page 65

- [ ] Review · [line 2500](../books/phb.md#L2500) · Chapter 4: Alignment > Good, Neutrality, and Evil · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 4: Alignment > Good, Neutrality, and Evil starts in the middle of a sentence.
  - Text: `attitudes is also divided into three parts. Like law and order, the second set of These parts descri`

### Page 71

- [ ] Review · [line 2651](../books/phb.md#L2651) · Chapter 5: Proficiencies (Optional) > Acquiring Proficiencies > Table 34: Proficiency Slots · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 5: Proficiencies (Optional) > Acquiring Proficiencies starts in the middle of a sentence.
  - Text: `three slots and his Intelligence of 11 gives him two additional proficiency slots (according to Tabl`

### Page 72

- [ ] Review · [line 2691](../books/phb.md#L2691) · Chapter 5: Proficiencies (Optional) > Weapon Proficiencies > Table 35: Specialist Attacks Per Round · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 5: Proficiencies (Optional) > Weapon Proficiencies starts in the middle of a sentence.
  - Text: `more, a character can assign weapon proficiency slots only to those weapons allowed to his character`

### Page 75

- [ ] **Fix** · [line 2814](../books/phb.md#L2814) · Chapter 5: Proficiencies (Optional) > Nonweapon Proficiencies > Table 36: Secondary Skills · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table "Table 36: Secondary Skills" on page 75 could not be rebuilt as a table; the content follows as extracted, check the printed page.
  - Text: `<!-- UNCLEAR: table "Table 36: Secondary Skills" on page 75 could not be rebuilt as a table; the con...`
- [ ] Review · [line 2816](../books/phb.md#L2816) · Chapter 5: Proficiencies (Optional) > Nonweapon Proficiencies > Table 36: Secondary Skills · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 36: Secondary Skills" has no Markdown table under it.
  - Text: `D100 Roll Secondary Skill 01–02 Armorer (make, repair & evaluate armor and weapons) 03–04 Bowyer/Fle`

### Page 77

- [ ] Review · [line 2871](../books/phb.md#L2871) · Chapter 5: Proficiencies (Optional) > Nonweapon Proficiencies > Table 37: Nonweapon Proficiency Groups · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 5: Proficiencies (Optional) > Nonweapon Proficiencies > Using Nonweapon Proficiencies starts in the middle of a sentence.
  - Text: `sometimes worse than having none. Nonweapon proficiencies can also be improved beyond the ability s`

### Page 79

- [ ] Review · [line 2925](../books/phb.md#L2925) · Chapter 5: Proficiencies (Optional) > Nonweapon Proficiencies > Nonweapon Proficiency Descriptions · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 5: Proficiencies (Optional) > Nonweapon Proficiencies > Nonweapon Proficiency Descriptions starts in the middle of a sentence.
  - Text: `labor, hunt, track, or fight alongside soldiers (such as a war horse or elephant). A specific trick `

### Page 86

- [ ] **Fix** · [line 3145](../books/phb.md#L3145) · Chapter 5: Proficiencies (Optional) > Nonweapon Proficiencies > Table 39: Tracking Modifiers · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 86 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 86 may contain text from the surrounding column; check against the print...`

### Page 87

- [ ] Review · [line 3196](../books/phb.md#L3196) · Chapter 5: Proficiencies (Optional) > Nonweapon Proficiencies > Table 40: Movement While Tracking · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 5: Proficiencies (Optional) > Nonweapon Proficiencies > Nonweapon Proficiency Descriptions starts in the middle of a sentence.
  - Text: `modified chance to track as found from Table 39. In the earlier example, Thule has a modified track`

### Page 89

- [ ] Review · [line 3284](../books/phb.md#L3284) · Chapter 6: Money and Equipment > Starting Money · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 6: Money and Equipment > Starting Money starts in the middle of a sentence.
  - Text: `amount of cash. This nest egg may be your All player characters begin with some character’s life sav`
- [ ] **Fix** · [line 3296](../books/phb.md#L3296) · Chapter 6: Money and Equipment > Equipment Lists > Table 42: Standard Exchange Rates · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 89 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 89 has header cells that were not detected; check column headings agains...`
- [ ] Review · [line 3307](../books/phb.md#L3307) · Chapter 6: Money and Equipment > Equipment Lists > Table 42: Standard Exchange Rates · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 6: Money and Equipment > Equipment Lists starts in the middle of a sentence.
  - Text: `have been discovered or invented yet! While he should tell you which items are and aren’t available,`
- [ ] Review · [line 3315](../books/phb.md#L3315) · Chapter 6: Money and Equipment > Equipment Descriptions · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 6: Money and Equipment > Equipment Descriptions starts in the middle of a sentence.
  - Text: `described here. The vast majority Not every piece of equipment is of things found on the equipment l`
- [ ] **Fix** · [line 3325](../books/phb.md#L3325) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 43 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: Table 43 on page 89: title and table structure were not recovered; its content follows as extracted text, check the printed page.
  - Text: `<!-- UNCLEAR: Table 43 on page 89: title and table structure were not recovered; its content follows...`
- [ ] **Fix** · [line 3327](../books/phb.md#L3327) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 43 · `table-flattened` · [guide](#guide-table-flattened)
  - Table 43 was written as a single line of text instead of a table.
  - Text: `Table 43: Character Group Die Range Warrior 5d4 × 10 gp Wizard (1d4+1) × 10 gp Rogue 2d6 × 10 gp Pri...`

### Page 90

- [ ] Review · [line 3333](../books/phb.md#L3333) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 44 · `table-number-duplicate` · [guide](#guide-table-number-duplicate)
  - Table 44 appears 2 times (lines 3333, 3337).
  - Text: `#### Table 44`
- [ ] **Fix** · [line 3335](../books/phb.md#L3335) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 44 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: Table 44 on page 90: title and table structure were not recovered; its content follows as extracted text, check the printed page.
  - Text: `<!-- UNCLEAR: Table 44 on page 90: title and table structure were not recovered; its content follows...`
- [ ] **Fix** · [line 3341](../books/phb.md#L3341) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 44 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 90.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 90 -->`
- [ ] **Fix** · [line 3342](../books/phb.md#L3342) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 44 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 90 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 90 may contain text from the surrounding column; check against the print...`
- [ ] **Fix** · [line 3343](../books/phb.md#L3343) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 44 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 90 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 90 has header cells that were not detected; check column headings agains...`
- [ ] Review · [line 3345](../books/phb.md#L3345) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 44 · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Clothing |  | Household Provisioning | Animals |  |`

### Page 91

- [ ] **Fix** · [line 3406](../books/phb.md#L3406) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 44 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 91.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 91 -->`
- [ ] **Fix** · [line 3407](../books/phb.md#L3407) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 44 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 91 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 91 has header cells that were not detected; check column headings agains...`
- [ ] Review · [line 3409](../books/phb.md#L3409) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 44 · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Tack a | nd Harness |  | Grappling hook | 8 sp | 4 lbs. |`

### Page 94

- [ ] **Fix** · [line 3572](../books/phb.md#L3572) · Chapter 6: Money and Equipment > Equipment Descriptions > Miscellaneous Equipment · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 94.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 94 -->`
- [ ] **Fix** · [line 3573](../books/phb.md#L3573) · Chapter 6: Money and Equipment > Equipment Descriptions > Miscellaneous Equipment · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 94 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 94 has header cells that were not detected; check column headings agains...`
- [ ] Review · [line 3575](../books/phb.md#L3575) · Chapter 6: Money and Equipment > Equipment Descriptions > Miscellaneous Equipment · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `|  |  | Weight | Weapons |  | Speed | Dam | age |`

### Page 95

- [ ] **Fix** · [line 3638](../books/phb.md#L3638) · Chapter 6: Money and Equipment > Equipment Descriptions > Miscellaneous Equipment · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 95.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 95 -->`
- [ ] Review · [line 3640](../books/phb.md#L3640) · Chapter 6: Money and Equipment > Equipment Descriptions > Miscellaneous Equipment · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Quarterstaff | — | 4 | L | B | 4 | 1d6 | 1d6 |`
- [ ] **Fix** · [line 3679](../books/phb.md#L3679) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 45: Missile Weapon Ranges · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 95 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 95 may contain text from the surrounding column; check against the print...`
- [ ] **Fix** · [line 3680](../books/phb.md#L3680) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 45: Missile Weapon Ranges · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 95 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 95 has header cells that were not detected; check column headings agains...`
- [ ] Review · [line 3682](../books/phb.md#L3682) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 45: Missile Weapon Ranges · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `|  |  | Ra | nge (yar | ds) | Hand axe | 1 | 10 | 20 | 30 |`

### Page 99

- [ ] **Fix** · [line 3802](../books/phb.md#L3802) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 46 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: Table 46 on page 96: title and table structure were not recovered; its content follows as extracted text, check the printed page.
  - Text: `<!-- UNCLEAR: Table 46 on page 96: title and table structure were not recovered; its content follows...`
- [ ] **Fix** · [line 3804](../books/phb.md#L3804) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 46 · `table-flattened` · [guide](#guide-table-flattened)
  - Table 46 was written as a single line of text instead of a table.
  - Text: `Table 46: Type of Armor AC Rating None 10 Shield only 9 Leather or padded armor 8 Leather or padded ...`

### Page 103

- [ ] **Fix** · [line 3935](../books/phb.md#L3935) · Chapter 6: Money and Equipment > Equipment Descriptions > Table 48: Modified Movement Rates · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 103 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 103 has header cells that were not detected; check column headings again...`

### Page 111

- [ ] Review · [line 4146](../books/phb.md#L4146) · Chapter 7: Magic > Casting Spells · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 7: Magic > Casting Spells starts in the middle of a sentence.
  - Text: `rules for casting spells. To cast a spell, the Both wizards and priests use the same character must `

### Page 113

- [ ] Review · [line 4166](../books/phb.md#L4166) · Chapter 7: Magic > Magical Research · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 7: Magic > Magical Research starts in the middle of a sentence.
  - Text: `and priests is magical research. While One oft-ignored asset of both wizards the spell lists for bot`

### Page 121

- [ ] **Fix** · [line 4433](../books/phb.md#L4433) · Chapter 9: Combat > Calculating THAC0 > Table 54: THAC0 Advancement · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table "Table 54: THAC0 Advancement" on page 121 could not be rebuilt as a table; the content follows as extracted, check the printed page.
  - Text: `<!-- UNCLEAR: table "Table 54: THAC0 Advancement" on page 121 could not be rebuilt as a table; the c...`
- [ ] Review · [line 4435](../books/phb.md#L4435) · Chapter 9: Combat > Calculating THAC0 > Table 54: THAC0 Advancement · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 54: THAC0 Advancement" has no Markdown table under it.
  - Text: `Improvement Rate Group Points/Level Priest 2/3 Rogue 1/2 Warrior 1/1 Wizard 1/3`

### Page 128

- [ ] **Fix** · [line 4800](../books/phb.md#L4800) · Chapter 9: Combat > Attacking Without Killing > Punching and Wrestling · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 128 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 128 may contain text from the surrounding column; check against the prin...`
- [ ] Review · [line 4802](../books/phb.md#L4802) · Chapter 9: Combat > Attacking Without Killing > Table 57 · `table-number-duplicate` · [guide](#guide-table-number-duplicate)
  - Table 57 appears 2 times (lines 4802, 4806).
  - Text: `#### Table 57`
- [ ] **Fix** · [line 4804](../books/phb.md#L4804) · Chapter 9: Combat > Attacking Without Killing > Table 57 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: Table 57 on page 127: title and table structure were not recovered; its content follows as extracted text, check the printed page.
  - Text: `<!-- UNCLEAR: Table 57 on page 127: title and table structure were not recovered; its content follow...`

### Page 132

- [ ] **Fix** · [line 4983](../books/phb.md#L4983) · Chapter 9: Combat > Missile Weapons in Combat > Table 59: Cover and · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table "Table 59: Cover and" on page 132 could not be rebuilt as a table; the content follows as extracted, check the printed page.
  - Text: `<!-- UNCLEAR: table "Table 59: Cover and" on page 132 could not be rebuilt as a table; the content f...`

### Page 134

- [ ] **Fix** · [line 5060](../books/phb.md#L5060) · Chapter 9: Combat > The Saving Throw > Table 60: Character Saving Throws · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table "Table 60: Character Saving Throws" on page 134 could not be rebuilt as a table; the content follows as extracted, check the printed page.
  - Text: `<!-- UNCLEAR: table "Table 60: Character Saving Throws" on page 134 could not be rebuilt as a table;...`
- [ ] **Fix** · [line 5064](../books/phb.md#L5064) · Chapter 9: Combat > The Saving Throw > Table 60: Character Saving Throws · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 134.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 134 -->`
- [ ] Review · [line 5066](../books/phb.md#L5066) · Chapter 9: Combat > The Saving Throw > Table 60: Character Saving Throws · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Priests | Character Class and Experience Level 1–3 | Paralyzation, Poison, or Death Magic 10 | Rod...`

### Page 135

- [ ] Review · [line 5154](../books/phb.md#L5154) · Chapter 9: Combat > Magic Resistance · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Magic Resistance starts in the middle of a sentence.
  - Text: `them more difficult to affect with magical energy than ordinary creatures or items. A rare few crea`

### Page 136

- [ ] Review · [line 5200](../books/phb.md#L5200) · Chapter 9: Combat > Turning Undead · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Turning Undead starts in the middle of a sentence.
  - Text: `combat ability available to priests and pala-One important, and potentially life-saving, dins is the`

### Page 137

- [ ] **Fix** · [line 5212](../books/phb.md#L5212) · Chapter 9: Combat > Turning Undead · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 137.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 137 -->`
- [ ] **Fix** · [line 5213](../books/phb.md#L5213) · Chapter 9: Combat > Turning Undead · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 137 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 137 has header cells that were not detected; check column headings again...`
- [ ] **Fix** · [line 5215](../books/phb.md#L5215) · Chapter 9: Combat > Turning Undead · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  |  |  |  | Tur | Tab ning | le 61: Und | ead |  |  |  |  |  |`
- [ ] Review · [line 5239](../books/phb.md#L5239) · Chapter 9: Combat > Turning Undead · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Turning Undead starts in the middle of a sentence.
  - Text: `character (two levels lower for a paladin). If there is a number listed, roll 1d20. If the number ro`

### Page 139

- [ ] Review · [line 5295](../books/phb.md#L5295) · Chapter 9: Combat > Special Damage · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Special Damage starts in the middle of a sentence.
  - Text: `the only way a character can get hurt. Getting hit by weapons or monsters isn’t In deed, the world i`

### Page 151

- [ ] Review · [line 5599](../books/phb.md#L5599) · Chapter 12: NPCs > Followers · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 12: NPCs > Followers starts in the middle of a sentence.
  - Text: `ters who, while they expect pay, were originally drawn into service by the reputation of the player `

### Page 155

- [ ] **Fix** · [line 5675](../books/phb.md#L5675) · Chapter 13: Vision and Light > Limits of Vision · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 155.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 155 -->`
- [ ] **Fix** · [line 5677](../books/phb.md#L5677) · Chapter 13: Vision and Light > Limits of Vision · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `| Condition | T Visibili Movement | able 62: ty Ran Spotted | ges Type | ID | Detail |`

### Page 161

- [ ] Review · [line 5900](../books/phb.md#L5900) · Chapter 14: Time and Movement > Climbing > Table 65 · `table-number-duplicate` · [guide](#guide-table-number-duplicate)
  - Table 65 appears 2 times (lines 5900, 5904).
  - Text: `#### Table 65`
- [ ] **Fix** · [line 5902](../books/phb.md#L5902) · Chapter 14: Time and Movement > Climbing > Table 65 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: Table 65 on page 161: title and table structure were not recovered; its content follows as extracted text, check the printed page.
  - Text: `<!-- UNCLEAR: Table 65 on page 161: title and table structure were not recovered; its content follow...`

### Page 163

- [ ] **Fix** · [line 5978](../books/phb.md#L5978) · Chapter 14: Time and Movement > Climbing > Actions While Climbing · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 163.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 163 -->`
- [ ] **Fix** · [line 5979](../books/phb.md#L5979) · Chapter 14: Time and Movement > Climbing > Actions While Climbing · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 163 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 163 may contain text from the surrounding column; check against the prin...`
- [ ] **Fix** · [line 5981](../books/phb.md#L5981) · Chapter 14: Time and Movement > Climbing > Actions While Climbing · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `| Type of Surface Very smooth * | Rate —————— Dry 1⁄4 | Table 67: s of Climbing ———Surface Condition...`

### Page 174

- [ ] **Fix** · [line 6611](../books/phb.md#L6611) · Appendix 3: Wizard Spells > First-Level Spells > Find Familiar · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 174.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 174 -->`
- [ ] **Fix** · [line 6612](../books/phb.md#L6612) · Appendix 3: Wizard Spells > First-Level Spells > Find Familiar · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 174 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 174 may contain text from the surrounding column; check against the prin...`
- [ ] Review · [line 6614](../books/phb.md#L6614) · Appendix 3: Wizard Spells > First-Level Spells > Find Familiar · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D20 Roll | Familiar* | Sensory Powers |`

### Page 191

- [ ] **Fix** · [line 8224](../books/phb.md#L8224) · Appendix 3: Wizard Spells > Third-Level Spells > Dispel Magic · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 191.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 191 -->`
- [ ] Review · [line 8226](../books/phb.md#L8226) · Appendix 3: Wizard Spells > Third-Level Spells > Dispel Magic · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Source of Effect | Resists As | Result of Dispel |`

### Page 195

- [ ] Review · [line 8609](../books/phb.md#L8609) · Appendix 3: Wizard Spells > Third-Level Spells > Monster Summoning I · `text-repeated-line` · [guide](#guide-text-repeated-line)
  - The same line appears 5 times (first at line 8609): probably a leftover page header or footer.
  - Text: `The material components of this spell are a tiny bag and a small (not necessarily lit) candle.`

### Page 213

- [ ] **Fix** · [line 10191](../books/phb.md#L10191) · Appendix 3: Wizard Spells > Fifth-Level Spells > Contact Other Plane · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 213.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 213 -->`
- [ ] Review · [line 10193](../books/phb.md#L10193) · Appendix 3: Wizard Spells > Fifth-Level Spells > Contact Other Plane · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Plane | Chance of Insanity * | Chance of Knowledge | Chance of Veracity ** |`

### Page 219

- [ ] **Fix** · [line 10814](../books/phb.md#L10814) · Appendix 3: Wizard Spells > Fifth-Level Spells > Teleport · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 219.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 219 -->`
- [ ] **Fix** · [line 10815](../books/phb.md#L10815) · Appendix 3: Wizard Spells > Fifth-Level Spells > Teleport · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 219 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 219 has header cells that were not detected; check column headings again...`
- [ ] Review · [line 10817](../books/phb.md#L10817) · Appendix 3: Wizard Spells > Fifth-Level Spells > Teleport · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `|  | Prob | ability of Telepor | ting: |`

### Page 236

- [ ] **Fix** · [line 12232](../books/phb.md#L12232) · Appendix 3: Wizard Spells > Seventh-Level Spells > Prismatic Spray · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 236.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 236 -->`
- [ ] **Fix** · [line 12233](../books/phb.md#L12233) · Appendix 3: Wizard Spells > Seventh-Level Spells > Prismatic Spray · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 236 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 236 may contain text from the surrounding column; check against the prin...`
- [ ] **Fix** · [line 12234](../books/phb.md#L12234) · Appendix 3: Wizard Spells > Seventh-Level Spells > Prismatic Spray · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 236 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 236 has header cells that were not detected; check column headings again...`
- [ ] Review · [line 12236](../books/phb.md#L12236) · Appendix 3: Wizard Spells > Seventh-Level Spells > Prismatic Spray · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Color | Order |  |`

### Page 243

- [ ] **Fix** · [line 12877](../books/phb.md#L12877) · Appendix 3: Wizard Spells > Eighth-Level Spells > Prismatic Wall · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 243.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 243 -->`
- [ ] **Fix** · [line 12878](../books/phb.md#L12878) · Appendix 3: Wizard Spells > Eighth-Level Spells > Prismatic Wall · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 243 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 243 may contain text from the surrounding column; check against the prin...`
- [ ] **Fix** · [line 12879](../books/phb.md#L12879) · Appendix 3: Wizard Spells > Eighth-Level Spells > Prismatic Wall · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 243 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 243 has header cells that were not detected; check column headings again...`
- [ ] Review · [line 12881](../books/phb.md#L12881) · Appendix 3: Wizard Spells > Eighth-Level Spells > Prismatic Wall · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `|  |  | Prismatic Wall Effects |  |`

### Page 244

- [ ] **Fix** · [line 12935](../books/phb.md#L12935) · Appendix 3: Wizard Spells > Eighth-Level Spells > Serten’s Spell Immunity · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 244.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 244 -->`
- [ ] Review · [line 12937](../books/phb.md#L12937) · Appendix 3: Wizard Spells > Eighth-Level Spells > Serten’s Spell Immunity · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Spell Level | Wizard Spell | Priest Spell |`

### Page 249

- [ ] **Fix** · [line 13305](../books/phb.md#L13305) · Appendix 3: Wizard Spells > Ninth-Level Spells > Prismatic Sphere · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 249.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 249 -->`
- [ ] **Fix** · [line 13306](../books/phb.md#L13306) · Appendix 3: Wizard Spells > Ninth-Level Spells > Prismatic Sphere · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 249 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 249 may contain text from the surrounding column; check against the prin...`
- [ ] **Fix** · [line 13307](../books/phb.md#L13307) · Appendix 3: Wizard Spells > Ninth-Level Spells > Prismatic Sphere · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 249 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 249 has header cells that were not detected; check column headings again...`
- [ ] Review · [line 13309](../books/phb.md#L13309) · Appendix 3: Wizard Spells > Ninth-Level Spells > Prismatic Sphere · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `|  |  | Prismatic Sphere Effects |  |`

### Page 267

- [ ] **Fix** · [line 14878](../books/phb.md#L14878) · Appendix 4: Priest Spells > Third-Level Spells > Dispel Magic · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 267.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 267 -->`
- [ ] Review · [line 14880](../books/phb.md#L14880) · Appendix 4: Priest Spells > Third-Level Spells > Dispel Magic · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| S | ummary of Dispel Effe | cts |`

### Page 271

- [ ] **Fix** · [line 15278](../books/phb.md#L15278) · Appendix 4: Priest Spells > Third-Level Spells > Speak With Dead · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 271.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 271 -->`
- [ ] Review · [line 15280](../books/phb.md#L15280) · Appendix 4: Priest Spells > Third-Level Spells > Speak With Dead · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Caster’s Level | Max. Length | Time | No. of |`

### Page 274

- [ ] **Fix** · [line 15532](../books/phb.md#L15532) · Appendix 4: Priest Spells > Fourth-Level Spells > Call Woodland Beings · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 274.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 274 -->`
- [ ] **Fix** · [line 15533](../books/phb.md#L15533) · Appendix 4: Priest Spells > Fourth-Level Spells > Call Woodland Beings · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 274 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 274 has header cells that were not detected; check column headings again...`
- [ ] Review · [line 15535](../books/phb.md#L15535) · Appendix 4: Priest Spells > Fourth-Level Spells > Call Woodland Beings · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Creature |  | Type of Woodlands |`

### Page 276

- [ ] **Fix** · [line 15715](../books/phb.md#L15715) · Appendix 4: Priest Spells > Fourth-Level Spells > Giant Insect · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 276.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 276 -->`
- [ ] Review · [line 15717](../books/phb.md#L15717) · Appendix 4: Priest Spells > Fourth-Level Spells > Giant Insect · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Priest’s | Insect | Maximum |`

### Page 290

- [ ] **Fix** · [line 16988](../books/phb.md#L16988) · Appendix 4: Priest Spells > Sixth-Level Spells > Liveoak · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 290.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 290 -->`
- [ ] Review · [line 16990](../books/phb.md#L16990) · Appendix 4: Priest Spells > Sixth-Level Spells > Liveoak · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Tree Size | Height | Hit Dice | Damage per Attack |`

### Page 295

- [ ] **Fix** · [line 17386](../books/phb.md#L17386) · Appendix 4: Priest Spells > Seventh-Level Spells > Control Weather · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 295.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 295 -->`
- [ ] Review · [line 17388](../books/phb.md#L17388) · Appendix 4: Priest Spells > Seventh-Level Spells > Control Weather · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Precipitation | Temperature | Wind |`

### Page 297

- [ ] **Fix** · [line 17563](../books/phb.md#L17563) · Appendix 4: Priest Spells > Seventh-Level Spells > Holy Word · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 297.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 297 -->`
- [ ] Review · [line 17565](../books/phb.md#L17565) · Appendix 4: Priest Spells > Seventh-Level Spells > Holy Word · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Creature’s Hit Dice or Level | General | Attack Move | Dice | Spells |`

### Page 298

- [ ] **Fix** · [line 17634](../books/phb.md#L17634) · Appendix 4: Priest Spells > Seventh-Level Spells > Reincarnate · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 298.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 298 -->`
- [ ] Review · [line 17636](../books/phb.md#L17636) · Appendix 4: Priest Spells > Seventh-Level Spells > Reincarnate · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D100 Roll | Incarnation | D100 Roll | Incarnation |`

### Page 308

- [ ] Review · [line 17934](../books/phb.md#L17934) · Appendix 6: Priest Spells by Sphere > Weather · `page-jump` · [guide](#guide-page-jump)
  - Pages jump from 303 to 308.
  - Text: `<!-- page 308 -->`
- [ ] **Fix** · [line 17967](../books/phb.md#L17967) · Appendix 8: Compiled Tables > Table 1: Strength · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 308.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 308 -->`
- [ ] **Fix** · [line 17969](../books/phb.md#L17969) · Appendix 8: Compiled Tables > Table 1: Strength · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `| Ability Score 1 | Tab Dext Reaction Adj. –6 | le 2: erity Missile Attack Adj. –6 | Defensive Adj. ...`

### Page 310

- [ ] **Fix** · [line 18052](../books/phb.md#L18052) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 310.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 310 -->`
- [ ] **Fix** · [line 18053](../books/phb.md#L18053) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 310 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 310 has header cells that were not detected; check column headings again...`
- [ ] **Fix** · [line 18055](../books/phb.md#L18055) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  |  | In | Table 4: telligen | ce |  |  | Tabl Char | e 6: isma |  |`
- [ ] Review · [line 18085](../books/phb.md#L18085) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: many word fragments (g, t, o, d, s).
  - Text: `* While with g unable t runts an o speak a d gesture language, the s. character can communicate 24 2`
- [ ] **Fix** · [line 18087](../books/phb.md#L18087) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 310.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 310 -->`
- [ ] **Fix** · [line 18088](../books/phb.md#L18088) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 310 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 310 has header cells that were not detected; check column headings again...`
- [ ] **Fix** · [line 18090](../books/phb.md#L18090) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  |  |  |  | Tur | Tab ning | le 61: Und | ead |  |  |  |  |  |`

### Page 311

- [ ] **Fix** · [line 18116](../books/phb.md#L18116) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 311.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 311 -->`
- [ ] **Fix** · [line 18117](../books/phb.md#L18117) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 311 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 311 may contain text from the surrounding column; check against the prin...`
- [ ] **Fix** · [line 18119](../books/phb.md#L18119) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `| Ability Score | Magical Defense Adjust. | Ta Wi Bonus Spells | ble 5: sdom Chance of Spell Failure...`
- [ ] **Fix** · [line 18149](../books/phb.md#L18149) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 311.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 311 -->`
- [ ] **Fix** · [line 18150](../books/phb.md#L18150) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 311 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 311 has header cells that were not detected; check column headings again...`
- [ ] Review · [line 18152](../books/phb.md#L18152) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `|  |  |  |  |  |  | C | AL | CU | T LA | able 5 TED Level | 3: T | HA | C0 | S |  |  |  |  |  |  |`

### Page 312

- [ ] **Fix** · [line 18162](../books/phb.md#L18162) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 312.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 312 -->`
- [ ] **Fix** · [line 18163](../books/phb.md#L18163) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 312 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 312 has header cells that were not detected; check column headings again...`
- [ ] **Fix** · [line 18165](../books/phb.md#L18165) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  |  |  |  | Table 21: |  |  |  |  |`
- [ ] **Fix** · [line 18191](../books/phb.md#L18191) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 312.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 312 -->`
- [ ] **Fix** · [line 18192](../books/phb.md#L18192) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 312 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 312 has header cells that were not detected; check column headings again...`
- [ ] **Fix** · [line 18194](../books/phb.md#L18194) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  |  |  | Table | 24: |  |  |`
- [ ] **Fix** · [line 18223](../books/phb.md#L18223) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 312.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 312 -->`
- [ ] **Fix** · [line 18224](../books/phb.md#L18224) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 312 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 312 has header cells that were not detected; check column headings again...`
- [ ] **Fix** · [line 18226](../books/phb.md#L18226) · Appendix 8: Compiled Tables > Table 9: Constitution Saving Throw Bonuses · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  |  | T | able 32: |  |  |`

### Page 313

- [ ] **Fix** · [line 18254](../books/phb.md#L18254) · Appendix 8: Compiled Tables > Table 29 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table "Table 29" on page 313 could not be rebuilt as a table; the content follows as extracted, check the printed page.
  - Text: `<!-- UNCLEAR: table "Table 29" on page 313 could not be rebuilt as a table; the content follows as e...`

## Guides

<a id="guide-table-number-missing"></a>

### Table number missing from the sequence (`table-number-missing`)

**In the PDF:** Find Table N in the book (the table of contents or the surrounding pages).

**In the Markdown:**

1. Often its title was captured inside another table or flattened: fixing those tasks usually makes this one disappear.
2. If the table exists but is missing from the Markdown, add it with its title, in the right place.
3. If the book skips the number, leave it.

<a id="guide-unclear"></a>

### Passage the converter marked as unclear (`unclear`)

**In the PDF:** Read the passage or table at that point on the printed page; the marker says what the converter was unsure about.

**In the Markdown:**

1. Compare the text, or every cell of the table, with the page.
2. Correct whatever differs. For tables, check the header row first: a missing or shifted header makes every value below it wrong.
3. Delete the <!-- UNCLEAR: ... --> line once the passage matches the page.

<a id="guide-table-number-duplicate"></a>

### Table number used twice (`table-number-duplicate`)

**In the PDF:** Look at both places in the book.

**In the Markdown:**

1. If it's the same table printed twice (as in the Player's Handbook's tables at the end of the book), leave it.
2. If the heading and the title are split across two lines (#### Table 57, then Table 57: Title on its own line), merge them into one heading and delete the extra line.
3. If one of them is a different table with a misread number, correct the number.

Before:

```markdown
#### Table 57

Table 57: Armor Modifiers for Wrestling
```

After:

```markdown
#### Table 57: Armor Modifiers for Wrestling
```

<a id="guide-chunk-duplicate"></a>

### The same text in two places (`chunk-duplicate`)

**In the PDF:** Find where the text belongs on the page.

**In the Markdown:**

1. If it's printed twice in the book, leave it.
2. Otherwise keep the copy in the right place and delete the other.

<a id="guide-table-title-in-table"></a>

### Table title captured inside the table (`table-title-in-table`)

**In the PDF:** Find the table on the page and note its exact title, its column headings and its first rows.

**In the Markdown:**

1. Write the title on its own line above the table: #### Table N: Title.
2. Remove the title fragments from the table's cells.
3. Rewrite the header row with the column headings from the page, then the separator row (| --- | per column).
4. Check every row against the page: when the title was misplaced, values have usually shifted into the wrong columns.

Before:

```markdown
|  | Magical | Tab Wis | le 5: dom Chance |  |
| --- | --- | --- | --- | --- |
| 3 | -3 | 50% | ... |
```

After:

```markdown
#### Table 5: (title from the page)

| (heading 1) | (heading 2) | (heading 3) | (heading 4) | (heading 5) |
| --- | --- | --- | --- | --- |
| 3 | -3 | 50% | ... | ... |
```

<a id="guide-chunk-starts-midsentence"></a>

### Text that starts in the middle of a sentence (`chunk-starts-midsentence`)

**In the PDF:** Read the sentence on the page, and the paragraph around it.

**In the Markdown:**

1. Sentence order scrambled ("based on the assumption Everything in this book is that..."): retype the sentence in the page's order.
2. A blank line inside a paragraph, often at a page break: delete the blank line so the paragraph is whole. A page marker can stay inline: ...the paragraph <!-- page 36 --> continues here.

Before:

```markdown
Everything in this book is based

<!-- page 6 -->

on the assumption that you are familiar with the Player's Handbook.
```

After:

```markdown
Everything in this book is based <!-- page 6 --> on the assumption that you are familiar with the Player's Handbook.
```

<a id="guide-chunk-table-title-without-table"></a>

### Table title with no table under it (`chunk-table-title-without-table`)

**In the PDF:** Find the table on the page.

**In the Markdown:**

1. The converter often couldn't rebuild it: its values may follow as plain text, or there may be an UNCLEAR note.
2. Rebuild it as a Markdown table under its title, from the page.
3. Delete any plain-text leftovers of the table and the UNCLEAR note.

<a id="guide-table-no-title"></a>

### Table without a numbered title above it (`table-no-title`)

**In the PDF:** Look above the table on the page for its number and title.

**In the Markdown:**

1. If the page shows a title, add it on its own line above the table: #### Table N: Title.
2. If the page shows the table without a number, leave it: this task will stay in the list, and that's fine.

<a id="guide-table-flattened"></a>

### Table written as one line of text (`table-flattened`)

**In the PDF:** Find the table on the page: its title, column headings and every row.

**In the Markdown:**

1. Put the full title in the heading: #### Table N: Title.
2. Replace the line of run-together values with a Markdown table: a header row, a separator row, and one line per row of the printed table.
3. If text from the following paragraph ended up on the same line after the values, move it back into its paragraph.

Before:

```markdown
#### Table 30

Table 30: Thief's Level Damage Multiplier 1–4 2 5–8 3 9–12 4 13+ 5
```

After:

```markdown
#### Table 30: (title from the page)

| Thief's Level | Damage Multiplier |
| --- | --- |
| 1–4 | 2 |
| 5–8 | 3 |
| 9–12 | 4 |
| 13+ | 5 |
```

<a id="guide-text-repeated-line"></a>

### Line repeated many times (`text-repeated-line`)

**In the PDF:** Check whether the line is a running header or footer on the printed pages.

**In the Markdown:**

1. If it is, delete every occurrence (search in VS Code with Cmd+F).
2. If it's real text that repeats, leave it.

<a id="guide-page-jump"></a>

### Pages skipped (`page-jump`)

**In the PDF:** Look at the skipped pages in the PDF.

**In the Markdown:**

1. If they hold text (not only illustrations or blank space), that text is missing from the Markdown: add it, with its page markers.
2. If they are full-page illustrations, the cover or blank pages, leave it.

<a id="guide-text-garbled"></a>

### Garbled text (`text-garbled`)

**In the PDF:** Read the line on the page.

**In the Markdown:**

1. Symbols such as D!"#$%" l&'($) fuide are words printed in a decorative font: replace them with the words from the page. The same string often repeats: search and replace across the file (Cmd+Shift+H in VS Code).
2. Scattered fragments ("with g unable t runts an o speak") are two columns or a drop capital read out of order: retype the passage from the page.

Before:

```markdown
The D!"#$%" l&'($) fuide is reserved for Dungeon Masters.
```

After:

```markdown
The (words from the page) is reserved for Dungeon Masters.
```
