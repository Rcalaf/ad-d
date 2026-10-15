# Fix list: dmg.md

Generated 2026-10-15 14:56.

227 tasks: 98 **Fix** (certainly wrong) and 129 **Review** (check against the book).

## How to use this list

1. Open the PDF and this list side by side, and work through the pages in order.
2. Each task links to its line in the Markdown file (open this list in VS Code's preview, Cmd+Shift+V, to follow the links).
3. Read the task's guide the first time you meet a kind of problem; the guides are at the end of the list.
4. After a working session, run `pnpm --filter @dnd/knowledge check-books`: the list is regenerated and fixed tasks disappear. There's no need to tick boxes.
5. A Review task you've checked and found correct will keep appearing; that's expected.

## Tasks by page

### Page 2

- [ ] Review · [line 21](../books/dmg.md#L21) · Foreword to the 2nd Edition · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("!"#$%"").
  - Text: `The Player’s Handbook and the D!"#$%" l&'($) fuide give you what you’re expected to know, but that d`
- [ ] Review · [line 27](../books/dmg.md#L27) · Foreword to the 2nd Edition · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("!"#$%"").
  - Text: `At the beginning of the first D!"#$%" l&'($) fuide, Gary Gygax stressed that each of us, working fro`
- [ ] Review · [line 35](../books/dmg.md#L35) · Foreword to the 2nd Edition · `chunk-oversized-text` · [guide](#guide-chunk-oversized-text)
  - Text of 2061 characters in Foreword to the 2nd Edition > Credits, with no paragraph break the chunker could use.
  - Text: `Hundreds of players assisted us in playtesting the AD&D 2nd Edition game. Their efforts were invalua`
- [ ] Review · [line 39](../books/dmg.md#L39) · Foreword to the 2nd Edition · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("!"#$%&!").
  - Text: `This is a derivative work based on the original A!"#$%&! c'$(&)$* E c,#()$*™ Players Handbook and th`

### Page 3

- [ ] Review · [line 55](../books/dmg.md#L55) · Foreword · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("!"#$%"").
  - Text: `After six years, it was time for the Player’s Handbook and D!"#$%" l&'($) _Guide_, the two most impo`
- [ ] Review · [line 57](../books/dmg.md#L57) · Foreword · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("!"#$%&!").
  - Text: `Bringing this project together rekindled a lot of memories. In particular, one day from 1987 stands `

### Page 8

- [ ] Review · [line 63](../books/dmg.md#L63) · Foreword · `page-jump` · [guide](#guide-page-jump)
  - Pages jump from 3 to 8.
  - Text: `<!-- page 8 -->`
- [ ] Review · [line 69](../books/dmg.md#L69) · Introduction · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("!"#$%"").
  - Text: `The D!"#$%" l&'($) fuide is reserved for Dungeon Masters. Discourage players from reading this book,`
- [ ] Review · [line 71](../books/dmg.md#L71) · Introduction · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("!"#$%"").
  - Text: `Also, this book contains essential rules that are not discussed in the _Player’s_ _Handbook_. Some o`

### Page 9

- [ ] Review · [line 91](../books/dmg.md#L91) · Introduction > A Word About Organization · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("!"#$%"").
  - Text: `based on the assumption Everything in this book is that you are familiar with the_Player’s Handbook_`
- [ ] Review · [line 91](../books/dmg.md#L91) · Introduction > A Word About Organization · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Introduction > A Word About Organization starts in the middle of a sentence.
  - Text: `based on the assumption Everything in this book is that you are familiar with the_Player’s Handbook_`
- [ ] Review · [line 101](../books/dmg.md#L101) · Introduction > The Fine Art of Being a DM · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("!"#$%"").
  - Text: `But you won’t find them in the D!"#$%" l&'($) fuide. This is a reference book for running the AD&D g`
- [ ] Review · [line 103](../books/dmg.md#L103) · Introduction > The Fine Art of Being a DM · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("*+&",$*").
  - Text: `If you have never played a role-playing game before but are eager to learn, our advice from the _Pla`

### Page 11

- [ ] Review · [line 123](../books/dmg.md#L123) · Chapter 1: Player Character Ability Scores > Choosing a Character Creation Method · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 1: Player Character Ability Scores > Choosing a Character Creation Method starts in the middle of a sentence.
  - Text: `from one another. Some produce The following methods are different more powerful characters than oth`
- [ ] **Fix** · [line 141](../books/dmg.md#L141) · Chapter 1: Player Character Ability Scores > Choosing a Character Creation Method > Table 1: Method I Characters · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 11 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 11 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 165](../books/dmg.md#L165) · Chapter 1: Player Character Ability Scores > Choosing a Character Creation Method > Table 2: Method II Characters · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 11 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 11 has header cells that were not detected; check column headings agains...`

### Page 13

- [ ] **Fix** · [line 189](../books/dmg.md#L189) · Chapter 1: Player Character Ability Scores > Choosing a Character Creation Method > Table 3: Method III Characters · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 13 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 13 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 210](../books/dmg.md#L210) · Chapter 1: Player Character Ability Scores > Choosing a Character Creation Method > Table 4: Method IV Characters · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 13 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 13 has header cells that were not detected; check column headings agains...`
- [ ] Review · [line 212](../books/dmg.md#L212) · Chapter 1: Player Character Ability Scores > Choosing a Character Creation Method > Table 4: Method IV Characters · `chunk-duplicate` · [guide](#guide-chunk-duplicate)
  - The same text appears in two chunks, at line 212 and also at line 243.
  - Text: `| | #1 | #2 | #3 | #4 | #5 | |---|---|---|---|---|---| | Strength | 15 | 14 | 15 | 16 | 15 | | Dext`
- [ ] **Fix** · [line 241](../books/dmg.md#L241) · Chapter 1: Player Character Ability Scores > Choosing a Character Creation Method > Table 5: Method V Characters · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 13 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 13 has header cells that were not detected; check column headings agains...`

### Page 14

- [ ] **Fix** · [line 256](../books/dmg.md#L256) · Chapter 1: Player Character Ability Scores > Choosing a Character Creation Method > Table 6: Method VI Characters · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 14 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 14 has header cells that were not detected; check column headings agains...`
- [ ] Review · [line 277](../books/dmg.md#L277) · Chapter 1: Player Character Ability Scores > Super Characters · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 1: Player Character Ability Scores > Super Characters starts in the middle of a sentence.
  - Text: `players is to create super characters. One of the great temptations for While this is not true of ev`

### Page 18

- [ ] Review · [line 385](../books/dmg.md#L385) · Chapter 1: Player Character Ability Scores > Character Background · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("!"#$%"").
  - Text: `There are no rules to answer these questions. _The Player’s_ Handbook and D!"#$%" l&'($) fuide are d`

### Page 27

- [ ] Review · [line 716](../books/dmg.md#L716) · Chapter 3: Player Character Classes > 0-Level Characters > Table 10: 0-Level Hit Points by Title · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 3: Player Character Classes > 0-Level Characters starts in the middle of a sentence.
  - Text: `chance a clerk is going to be skilled with any type of weapon. In nonweapon proficiencies, 0-level `

### Page 30

- [ ] Review · [line 822](../books/dmg.md#L822) · Chapter 3: Player Character Classes > High-Level Characters · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 3: Player Character Classes > High-Level Characters starts in the middle of a sentence.
  - Text: `els comes the natural tendency to Along with character classes and levclassify campaigns according t`

### Page 33

- [ ] **Fix** · [line 980](../books/dmg.md#L980) · Chapter 3: Player Character Classes > Beginning Character Levels > Table 18: Optional Abilities · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 33 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 33 may contain text from the surrounding column; check against the print...`

### Page 34

- [ ] **Fix** · [line 1014](../books/dmg.md#L1014) · Chapter 3: Player Character Classes > Beginning Character Levels > Table 19: Thief Average Ability Table · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 34 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 34 has header cells that were not detected; check column headings agains...`
- [ ] Review · [line 1039](../books/dmg.md#L1039) · Chapter 3: Player Character Classes > Beginning Character Levels > Table 19: Thief Average Ability Table · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 3: Player Character Classes > Beginning Character Levels > Creating New Character Classes (Optional Rule) starts in the middle of a sentence.
  - Text: `through role-playing and careful choice of proficiencies. A mountaineer could easily be a fighter or`
- [ ] **Fix** · [line 1071](../books/dmg.md#L1071) · Chapter 3: Player Character Classes > Beginning Character Levels > Table 20: Restrictions · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 34 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 34 may contain text from the surrounding column; check against the print...`

### Page 35

- [ ] Review · [line 1077](../books/dmg.md#L1077) · Chapter 3: Player Character Classes > Beginning Character Levels > Table 20: Restrictions · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 3: Player Character Classes > Beginning Character Levels > Creating New Character Classes (Optional Rule) starts in the middle of a sentence.
  - Text: `the abilities for your class and add the multiples together. After you have chosen all the abilities`

### Page 37

- [ ] Review · [line 1149](../books/dmg.md#L1149) · Chapter 4: Alignment > Society Alignment · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 4: Alignment > Society Alignment starts in the middle of a sentence.
  - Text: `are not alone in having alignment. Since Player characters, NPCs, and monsters a kingdom is nothing `

### Page 40

- [ ] Review · [line 1255](../books/dmg.md#L1255) · Chapter 4: Alignment > Alignment as a Tool · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 4: Alignment > Alignment as a Tool starts in the middle of a sentence.
  - Text: `times already, this point is important Even though it has been said several enough to repeat—alignme`

### Page 41

- [ ] Review · [line 1295](../books/dmg.md#L1295) · Chapter 4: Alignment > Changing Alignment · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 4: Alignment > Changing Alignment starts in the middle of a sentence.
  - Text: `change alignment. A character might Sooner or later, a player character will change alignment for ma`

### Page 45

- [ ] Review · [line 1373](../books/dmg.md#L1373) · Chapter 5: Proficiencies (Optional) > Weapon Proficiencies · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 5: Proficiencies (Optional) > Weapon Proficiencies starts in the middle of a sentence.
  - Text: `complain that the weapon profi-Sooner or later a player will ciencies are too restrictive. But the r`
- [ ] Review · [line 1409](../books/dmg.md#L1409) · Chapter 5: Proficiencies (Optional) > Nonweapon Proficiencies · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 5: Proficiencies (Optional) > Nonweapon Proficiencies starts in the middle of a sentence.
  - Text: `optional, but, if chosen, can be Nonweapon proficiencies are very useful. If you are uncertain wheth`

### Page 49

- [ ] Review · [line 1471](../books/dmg.md#L1471) · Chapter 6: Money and Equipment > Monetary Systems · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 6: Money and Equipment > Monetary Systems starts in the middle of a sentence.
  - Text: `your campaign, you can use money as Even before you play the first session in a tool in creating you`
- [ ] Review · [line 1475](../books/dmg.md#L1475) · Chapter 6: Money and Equipment > A Short History of Commerce · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 6: Money and Equipment > A Short History of Commerce starts in the middle of a sentence.
  - Text: `always based on coins. Many Monetary systems aren’t different forms of exchange can be in use simult`

### Page 50

- [ ] Review · [line 1533](../books/dmg.md#L1533) · Chapter 6: Money and Equipment > Expense · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 6: Money and Equipment > Expense starts in the middle of a sentence.
  - Text: `for player characters, tracing day-to-day As exciting and important as money is expenses just isn’t `

### Page 52

- [ ] Review · [line 1572](../books/dmg.md#L1572) · Chapter 6: Money and Equipment > Expense > Table 22: Player Character Living Expenses · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 6: Money and Equipment > Expense > Wealthy Conditions starts in the middle of a sentence.
  - Text: `political maneuverings, mainly to protect their own privileges. Upon building or claiming his own s`
- [ ] Review · [line 1578](../books/dmg.md#L1578) · Chapter 6: Money and Equipment > Draining the Coffers · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: many word fragments (m, u, c, h, m, o).
  - Text: `given the player characters too Sometimes you discover you have m u c h m o n e y. Wh i l e l i v i `
- [ ] Review · [line 1578](../books/dmg.md#L1578) · Chapter 6: Money and Equipment > Draining the Coffers · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 6: Money and Equipment > Draining the Coffers starts in the middle of a sentence.
  - Text: `given the player characters too Sometimes you discover you have m u c h m o n e y. Wh i l e l i v i `

### Page 53

- [ ] Review · [line 1678](../books/dmg.md#L1678) · Chapter 6: Money and Equipment > Equipment by Time Period > Table 23: Equipment by Time Period T · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 6: Money and Equipment > Equipment by Time Period > The Ancient World starts in the middle of a sentence.
  - Text: `bronze, others of iron, and a few were made of steel. Most household items were pottery, wood, stone`

### Page 54

- [ ] Review · [line 1709](../books/dmg.md#L1709) · Chapter 6: Money and Equipment > Equipment by Time Period > Table 24: Lock Quality · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 6: Money and Equipment > Equipment by Time Period > Adjusting Equipment Lists starts in the middle of a sentence.
  - Text: `were commonly used in the time period. For example, flails (as an agricultural instrument) have exis`
- [ ] Review · [line 1713](../books/dmg.md#L1713) · Chapter 6: Money and Equipment > Quality of Equipment · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 6: Money and Equipment > Quality of Equipment starts in the middle of a sentence.
  - Text: `buys is assumed to be of average Most of the equipment a character quality—neither too cheaply made `

### Page 55

- [ ] **Fix** · [line 1767](../books/dmg.md#L1767) · Chapter 6: Money and Equipment > Quality of Equipment > Table 26: Horse Traits · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 55 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 55 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 1769](../books/dmg.md#L1769) · Chapter 6: Money and Equipment > Quality of Equipment > Table 26: Horse Traits · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  | Table 26: Horse Trai | ts |`
- [ ] Review · [line 1784](../books/dmg.md#L1784) · Chapter 6: Money and Equipment > Quality of Equipment > Table 26: Horse Traits · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 6: Money and Equipment > Quality of Equipment > Risks of Horse Buying starts in the middle of a sentence.
  - Text: `often equally severe for both the thief and the buyer— assuming, of course, that the buyer isn’t mis`

### Page 56

- [ ] Review · [line 1832](../books/dmg.md#L1832) · Chapter 6: Money and Equipment > Damaging Equipment · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 6: Money and Equipment > Damaging Equipment starts in the middle of a sentence.
  - Text: `damage isn’t applied to For the most part, specific equipment under the AD&D rules. This doesn’t mea`

### Page 58

- [ ] **Fix** · [line 1896](../books/dmg.md#L1896) · Chapter 6: Money and Equipment > Damaging Equipment > Table 29: Item Saving Throws · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 58 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 58 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 1898](../books/dmg.md#L1898) · Chapter 6: Money and Equipment > Damaging Equipment > Table 29: Item Saving Throws · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  |  |  | Item | Table Savi | 29: ng Thro | ws |  |  |  |`

### Page 61

- [ ] Review · [line 1961](../books/dmg.md#L1961) · Chapter 7: Magic > Acquisition of Spells Beyond 1st Level · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 7: Magic > Acquisition of Spells Beyond 1st Level starts in the middle of a sentence.
  - Text: `begun adventuring, he Once a character has won’t be able to have additional spell books instantly ap`

### Page 62

- [ ] **Fix** · [line 2035](../books/dmg.md#L2035) · Chapter 7: Magic > Spell Books > Table 30: Spell Book Capacities · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 62 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 62 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 2037](../books/dmg.md#L2037) · Chapter 7: Magic > Spell Books > Table 30: Spell Book Capacities · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  | Spell | Table 30: Book Capacities |  |`

### Page 63

- [ ] Review · [line 2052](../books/dmg.md#L2052) · Chapter 7: Magic > Spell Books > Table 30: Spell Book Capacities · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 7: Magic > Spell Books > Spell Book Preparation starts in the middle of a sentence.
  - Text: `while other preparations should be used to protect against mold, mildew, and dry rot. All this costs`

### Page 66

- [ ] **Fix** · [line 2168](../books/dmg.md#L2168) · Chapter 7: Magic > Too Much or Too Little? · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: heading "Too Much or Too Little?" starts somewhere on page 66; exact position not detected.
  - Text: `<!-- UNCLEAR: heading "Too Much or Too Little?" starts somewhere on page 66; exact position not dete...`

### Page 69

- [ ] **Fix** · [line 2300](../books/dmg.md#L2300) · Chapter 8: Experience > Experience Point Awards > Table 31: Creature Experience Point Values · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 69: the first column seems to contain values from the next column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 69: the first column seems to contain values from the next column; check...`
- [ ] **Fix** · [line 2320](../books/dmg.md#L2320) · Chapter 8: Experience > Experience Point Awards > Table 32: Hit Dice Value Modifiers · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 69 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 69 may contain text from the surrounding column; check against the print...`
- [ ] **Fix** · [line 2321](../books/dmg.md#L2321) · Chapter 8: Experience > Experience Point Awards > Table 32: Hit Dice Value Modifiers · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 69: the first column seems to contain values from the next column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 69: the first column seems to contain values from the next column; check...`
- [ ] Review · [line 2323](../books/dmg.md#L2323) · Chapter 8: Experience > Experience Point Awards > Table 32: Hit Dice Value Modifiers · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Ability Hit Die Modifier |`

### Page 73

- [ ] Review · [line 2481](../books/dmg.md#L2481) · Chapter 9: Combat > Definitions · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Definitions starts in the middle of a sentence.
  - Text: `out the combat rules. To understand Many game terms are used throughthe rules, players must understa`

### Page 84

- [ ] **Fix** · [line 3084](../books/dmg.md#L3084) · Chapter 9: Combat > Attacking Without Killing > Table 42: Armor Modifiers · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 84 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 84 may contain text from the surrounding column; check against the print...`
- [ ] **Fix** · [line 3085](../books/dmg.md#L3085) · Chapter 9: Combat > Attacking Without Killing > Table 42: Armor Modifiers · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 84: the first column seems to contain values from the next column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 84: the first column seems to contain values from the next column; check...`
- [ ] **Fix** · [line 3087](../books/dmg.md#L3087) · Chapter 9: Combat > Attacking Without Killing > Table 42: Armor Modifiers · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `| Table 42: Armor Modifiers for Wrestling |`

### Page 85

- [ ] **Fix** · [line 3144](../books/dmg.md#L3144) · Chapter 9: Combat > Attacking Without Killing > Table 43: Punching and Wrestling Results · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 85 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 85 has header cells that were not detected; check column headings agains...`
- [ ] **Fix** · [line 3146](../books/dmg.md#L3146) · Chapter 9: Combat > Attacking Without Killing > Table 43: Punching and Wrestling Results · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  |  | Table 43: |  |  |`

### Page 86

- [ ] Review · [line 3174](../books/dmg.md#L3174) · Chapter 9: Combat > Attacking Without Killing > Table 43: Punching and Wrestling Results · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Attacking Without Killing > Weapons in Nonlethal Combat starts in the middle of a sentence.
  - Text: `defender is automatically allowed to strike with his weapon before the unarmed attack is made, regar`
- [ ] Review · [line 3196](../books/dmg.md#L3196) · Chapter 9: Combat > Touch Spells and Combat · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Touch Spells and Combat starts in the middle of a sentence.
  - Text: `wizards take effect only when the Many spells used by priests and target is touched by the caster. `

### Page 87

- [ ] Review · [line 3244](../books/dmg.md#L3244) · Chapter 9: Combat > Missile Weapons in Combat · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Missile Weapons in Combat starts in the middle of a sentence.
  - Text: `bat is handled identically In general, missile comto standard melee. Intentions are announced, initi`

### Page 88

- [ ] **Fix** · [line 3294](../books/dmg.md#L3294) · Chapter 9: Combat > Missile Weapons in Combat > Table 44: Cover and Concealment · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `| Cover | Table 44: and Concealment Modifiers |`

### Page 91

- [ ] Review · [line 3438](../books/dmg.md#L3438) · Chapter 9: Combat > Special Defenses · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Special Defenses starts in the middle of a sentence.
  - Text: `with ways to attack. In addition, there are So far, the bulk of this chapter has dealt several ways `
- [ ] Review · [line 3444](../books/dmg.md#L3444) · Chapter 9: Combat > The Saving Throw · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > The Saving Throw starts in the middle of a sentence.
  - Text: `gives a chance, however slim, that The saving throw is a die roll that the character or creature fin`

### Page 92

- [ ] Review · [line 3497](../books/dmg.md#L3497) · Chapter 9: Combat > The Saving Throw > Table 46: Character Saving Throws · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > The Saving Throw > Rolling Saving Throws starts in the middle of a sentence.
  - Text: `saving throw numbers by group and level, since they have neither. All creatures save against poison `

### Page 94

- [ ] Review · [line 3561](../books/dmg.md#L3561) · Chapter 9: Combat > Magic Resistance · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Magic Resistance starts in the middle of a sentence.
  - Text: `resist the effects of magic (or impart Some creatures or items strongly such resistance to others). `
- [ ] Review · [line 3607](../books/dmg.md#L3607) · Chapter 9: Combat > Turning Undead · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Turning Undead starts in the middle of a sentence.
  - Text: `combat ability available to priests and pala-One important, and potentially life-saving, dins is the`

### Page 96

- [ ] Review · [line 3667](../books/dmg.md#L3667) · Chapter 9: Combat > Turning Undead > Table 47: Turning Undead · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Turning Undead > Evil Priests and Undead starts in the middle of a sentence.
  - Text: `din (7 HD) and would not be able to turn one of 8th level (using the paladin’s level as the HD to be`
- [ ] Review · [line 3671](../books/dmg.md#L3671) · Chapter 9: Combat > Immunity to Weapons · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Immunity to Weapons starts in the middle of a sentence.
  - Text: `thropes and powerful undead such Some monsters, particularly lycanas vampires, are immune to normal `

### Page 98

- [ ] **Fix** · [line 3815](../books/dmg.md#L3815) · Chapter 9: Combat > Morale > Table 50: Situational Modifiers · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 98 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 98 may contain text from the surrounding column; check against the print...`

### Page 99

- [ ] Review · [line 3893](../books/dmg.md#L3893) · Chapter 9: Combat > Injury and Death · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Injury and Death starts in the middle of a sentence.
  - Text: `ability, or resistance to various attacks Sometimes, no degree of luck, skill, can prevent harm from`

### Page 102

- [ ] Review · [line 4048](../books/dmg.md#L4048) · Chapter 9: Combat > Healing · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 9: Combat > Healing starts in the middle of a sentence.
  - Text: `can heal either by natural or magical means. Natural healing is slow, but it’s available to all char`

### Page 109

- [ ] **Fix** · [line 4316](../books/dmg.md#L4316) · Chapter 9: Combat > Unusual Combat Situations > Aerial Combat (Optional Rule) · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: heading "Aerial Combat (Optional Rule)" starts somewhere on page 109; exact position not detected.
  - Text: `<!-- UNCLEAR: heading "Aerial Combat (Optional Rule)" starts somewhere on page 109; exact position n...`

### Page 112

- [ ] **Fix** · [line 4410](../books/dmg.md#L4410) · Chapter 9: Combat > Who Needs Money? · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: heading "Who Needs Money?" starts somewhere on page 112; exact position not detected.
  - Text: `<!-- UNCLEAR: heading "Who Needs Money?" starts somewhere on page 112; exact position not detected -...`

### Page 114

- [ ] **Fix** · [line 4480](../books/dmg.md#L4480) · Chapter 10: Treasure and Magical Items > Placement of Treasure > Planned and Random Encounter Treasures · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: heading "Planned and Random Encounter Treasures" starts somewhere on page 114; exact position not detected.
  - Text: `<!-- UNCLEAR: heading "Planned and Random Encounter Treasures" starts somewhere on page 114; exact p...`
- [ ] Review · [line 4522](../books/dmg.md#L4522) · Chapter 10: Treasure and Magical Items > Placement of Treasure > Planned and Random Encounter Treasures · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("%"'()%!'").
  - Text: `Monster descriptions in the M%"'()%!' l&"!&. differentiate between treasures found in a creature’s l`

### Page 115

- [ ] Review · [line 4532](../books/dmg.md#L4532) · Chapter 10: Treasure and Magical Items > Treasure Tables · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("%"'()%!'").
  - Text: `To simplify the assignment of treasures to lairs and monsters, the AD&D game uses a set of alphabeti`
- [ ] Review · [line 4536](../books/dmg.md#L4536) · Chapter 10: Treasure and Magical Items > Maintaining Balance · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 10: Treasure and Magical Items > Maintaining Balance starts in the middle of a sentence.
  - Text: `later the DM is likely to err in the For all his good intentions, sooner or awarding of treasure. Ei`

### Page 135

- [ ] Review · [line 5451](../books/dmg.md#L5451) · Chapter 11: Encounters > Creating Encounter Tables > Table 55: Dungeon Level · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 11: Encounters > Creating Encounter Tables > Dungeon Encounter Tables starts in the middle of a sentence.
  - Text: `between creature and table decreases the frequency of appearance by one (a common creature becomes u`

### Page 138

- [ ] **Fix** · [line 5567](../books/dmg.md#L5567) · Chapter 11: Encounters > Creating Encounter Tables > Table 56: Frequency & Chance of Wilderness Encounters · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 138 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 138 has header cells that were not detected; check column headings again...`
- [ ] **Fix** · [line 5571](../books/dmg.md#L5571) · Chapter 11: Encounters > Creating Encounter Tables > Table 56: Frequency & Chance of Wilderness Encounters · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  | Frequen | cy & | Table Chance of | 56: Wilder | ness Enc | ounters |  |`
- [ ] Review · [line 5588](../books/dmg.md#L5588) · Chapter 11: Encounters > DMing Encounters · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 11: Encounters > DMing Encounters starts in the middle of a sentence.
  - Text: `play begins. During a game session, Encounter tables are created before the DM has to take the infor`

### Page 139

- [ ] Review · [line 5620](../books/dmg.md#L5620) · Chapter 11: Encounters > DMing Encounters > Encounter Size · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("%"'()%!'").
  - Text: `If the DM decides that yes, this encounter should happen, he determines how many creatures or NPCs a`

### Page 143

- [ ] Review · [line 5799](../books/dmg.md#L5799) · Chapter 12: NPCs > The Assassin, the Spy, and the Sage · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 12: NPCs > The Assassin, the Spy, and the Sage starts in the middle of a sentence.
  - Text: `and sage, require special treat-Three experts, the assassin, spy, ment. Each of these, unlike other `

### Page 144

- [ ] **Fix** · [line 5831](../books/dmg.md#L5831) · Chapter 12: NPCs > The Assassin, the Spy, and the Sage > Table 60: NPC Professions · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: Table 60 on page 144 is scrambled (cells cut mid-word) and the end of the list (from "Quarrier" onwards) is missing; transcribe from the printed page.
  - Text: `<!-- UNCLEAR: Table 60 on page 144 is scrambled (cells cut mid-word) and the end of the list (from "...`

### Page 145

- [ ] **Fix** · [line 5872](../books/dmg.md#L5872) · Chapter 12: NPCs > The Assassin, the Spy, and the Sage > Table 61: Fields of Study · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 145 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 145 may contain text from the surrounding column; check against the prin...`
- [ ] Review · [line 5906](../books/dmg.md#L5906) · Chapter 12: NPCs > The Assassin, the Spy, and the Sage > Table 61: Fields of Study · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 12: NPCs > The Assassin, the Spy, and the Sage > Spies starts in the middle of a sentence.
  - Text: `can appear to succeed while, actually, failing—even if he does return with information, it may not b`

### Page 146

- [ ] **Fix** · [line 5936](../books/dmg.md#L5936) · Chapter 12: NPCs > The Assassin, the Spy, and the Sage > Table 62: Sage Modifiers · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 146: the first column seems to contain values from the next column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 146: the first column seems to contain values from the next column; chec...`
- [ ] **Fix** · [line 5938](../books/dmg.md#L5938) · Chapter 12: NPCs > The Assassin, the Spy, and the Sage > Table 62: Sage Modifiers · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `| Table 62: |`

### Page 148

- [ ] Review · [line 6015](../books/dmg.md#L6015) · Chapter 12: NPCs > Soldiers > Table 64: Military Occupations · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 12: NPCs > Soldiers > Descriptions of Troop Types starts in the middle of a sentence.
  - Text: `shield. Turkish sipahis, noted light cavalrymen, carried a wide variety of weapons, usually a sword,`

### Page 149

- [ ] Review · [line 6061](../books/dmg.md#L6061) · Chapter 12: NPCs > Employing Hirelings · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 12: NPCs > Employing Hirelings starts in the middle of a sentence.
  - Text: `rare experts, the methods PCs use for Whether seeking everyday workers or employing hirelings are ge`

### Page 152

- [ ] **Fix** · [line 6232](../books/dmg.md#L6232) · Chapter 12: NPCs > Henchmen > Table 66: European Titles · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: Table 66 on page 152: the Russian and Turkish columns appear as loose text further down this page, and two lines of the example dialogue printed below the table are missing; check the printed page.
  - Text: `<!-- UNCLEAR: Table 66 on page 152: the Russian and Turkish columns appear as loose text further dow...`

### Page 154

- [ ] Review · [line 6359](../books/dmg.md#L6359) · Chapter 12: NPCs > Personality · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 12: NPCs > Personality starts in the middle of a sentence.
  - Text: `they cost, or how loyal they are, NPCs live only when they have personalities. Poorly played, an NPC`

### Page 155

- [ ] Review · [line 6436](../books/dmg.md#L6436) · Chapter 12: NPCs > Personality > Table 69: NPC Spell Costs · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 12: NPCs > Personality > Walk-On NPCs starts in the middle of a sentence.
  - Text: `greed, optimism, precision, or whatever—and exaggerate it, take it to an extreme. This is most effec`

### Page 156

- [ ] **Fix** · [line 6494](../books/dmg.md#L6494) · Chapter 12: NPCs > Personality > Table 70: General Traits · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: Table 70 is printed on page 156 but was not separated from the neighbouring table; transcribe it from the printed page.
  - Text: `<!-- UNCLEAR: Table 70 is printed on page 156 but was not separated from the neighbouring table; tra...`
- [ ] **Fix** · [line 6496](../books/dmg.md#L6496) · Chapter 12: NPCs > Personality > Table 70: General Traits · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 156.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 156 -->`
- [ ] **Fix** · [line 6497](../books/dmg.md#L6497) · Chapter 12: NPCs > Personality > Table 70: General Traits · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 156 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 156 has header cells that were not detected; check column headings again...`
- [ ] **Fix** · [line 6499](../books/dmg.md#L6499) · Chapter 12: NPCs > Personality > Table 70: General Traits · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  |  |  | Table | 70: |  |  |  |`

### Page 157

- [ ] **Fix** · [line 6585](../books/dmg.md#L6585) · Chapter 12: NPCs > Quick NPCs > Table 71 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table "Table 71" on page 157 is printed on a shaded panel and its structure was not recovered; its text follows line by line, check the printed page.
  - Text: `<!-- UNCLEAR: table "Table 71" on page 157 is printed on a shaded panel and its structure was not re...`

### Page 158

- [ ] **Fix** · [line 6639](../books/dmg.md#L6639) · Chapter 12: NPCs > Effects of Light Sources · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: heading "Effects of Light Sources" starts somewhere on page 158; exact position not detected.
  - Text: `<!-- UNCLEAR: heading "Effects of Light Sources" starts somewhere on page 158; exact position not de...`
- [ ] Review · [line 6647](../books/dmg.md#L6647) · Chapter 13: Vision and Light > Being Seen · `heading-jump` · [guide](#guide-heading-jump)
  - Heading jumps from level 2 to level 4.
  - Text: `#### Being Seen`

### Page 161

- [ ] **Fix** · [line 6725](../books/dmg.md#L6725) · Chapter 13: Vision and Light > Invisibility > Table 72: Optional Degrees of Darkness · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 161 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 161 has header cells that were not detected; check column headings again...`
- [ ] **Fix** · [line 6727](../books/dmg.md#L6727) · Chapter 13: Vision and Light > Invisibility > Table 72: Optional Degrees of Darkness · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `| Table Optional Degre | 72: es of Da | rkness |  |`
- [ ] Review · [line 6735](../books/dmg.md#L6735) · Chapter 13: Vision and Light > Invisibility > Table 72: Optional Degrees of Darkness · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 13: Vision and Light > Invisibility > Detecting Invisible Creatures starts in the middle of a sentence.
  - Text: `and smoke do not reveal invisible creatures. Smoke and fog are filled with swirls and eddies, preven`

### Page 168

- [ ] Review · [line 7004](../books/dmg.md#L7004) · Chapter 14: Time and Movement > Terrain Obstacles and Hindrances · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 14: Time and Movement > Terrain Obstacles and Hindrances starts in the middle of a sentence.
  - Text: `have no high-banked streams; rains haven’t turned the plains to mud; the tundra hasn’t been blankete`

### Page 169

- [ ] Review · [line 7037](../books/dmg.md#L7037) · Chapter 14: Time and Movement > Terrain Obstacles and Hindrances > Table 75: Terrain Modifiers · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 14: Time and Movement > Terrain Obstacles and Hindrances starts in the middle of a sentence.
  - Text: `or multipliers. When additional movement costs are listed, these are added to the cost of the surro`

### Page 170

- [ ] **Fix** · [line 7077](../books/dmg.md#L7077) · Chapter 14: Time and Movement > Movement on Water > Table 77: Ship Types · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 170 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 170 has header cells that were not detected; check column headings again...`
- [ ] **Fix** · [line 7079](../books/dmg.md#L7079) · Chapter 14: Time and Movement > Movement on Water > Table 77: Ship Types · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  | Table 77: |  |`

### Page 172

- [ ] Review · [line 7185](../books/dmg.md#L7185) · Chapter 14: Time and Movement > Getting Lost · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 14: Time and Movement > Getting Lost starts in the middle of a sentence.
  - Text: `ous knights can all make travel in the wil-Monsters, bandits, evil wizards, and villainderness dange`
- [ ] **Fix** · [line 7210](../books/dmg.md#L7210) · Chapter 14: Time and Movement > Getting Lost > Table 81: Chance of Getting Hopelessly Lost · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table "Table 81: Chance of Getting Hopelessly Lost" on page 172 is printed on a shaded panel and its structure was not recovered; its text follows line by line, check the printed page.
  - Text: `<!-- UNCLEAR: table "Table 81: Chance of Getting Hopelessly Lost" on page 172 is printed on a shaded...`
- [ ] Review · [line 7212](../books/dmg.md#L7212) · Chapter 14: Time and Movement > Getting Lost > Table 81: Chance of Getting Hopelessly Lost · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 81: Chance of Getting Hopelessly Lost" has no Markdown table under it.
  - Text: `Surroundings % Chance Level, open ground 10% Rolling ground 20% Lightly wooded 30% Rough (wo`
- [ ] **Fix** · [line 7253](../books/dmg.md#L7253) · Chapter 14: Time and Movement > Getting Lost > Table 82: Lost Modifiers · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table "Table 82: Lost Modifiers" on page 172 is printed on a shaded panel and its structure was not recovered; its text follows line by line, check the printed page.
  - Text: `<!-- UNCLEAR: table "Table 82: Lost Modifiers" on page 172 is printed on a shaded panel and its stru...`
- [ ] Review · [line 7255](../books/dmg.md#L7255) · Chapter 14: Time and Movement > Getting Lost > Table 82: Lost Modifiers · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 82: Lost Modifiers" has no Markdown table under it.
  - Text: `Condition Modifier Featureless (no distinguishable landmarks)* +50 Darkness +70 Overcast +30`

### Page 175

- [ ] **Fix** · [line 7349](../books/dmg.md#L7349) · Chapter 15: A DM’s Miscellany > Table 83 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: Table 83 on page 175: title and table structure were not recovered; its content follows as extracted text, check the printed page.
  - Text: `<!-- UNCLEAR: Table 83 on page 175: title and table structure were not recovered; its content follow...`
- [ ] **Fix** · [line 7351](../books/dmg.md#L7351) · Chapter 15: A DM’s Miscellany > Table 83 · `table-flattened` · [guide](#guide-table-flattened)
  - Table 83 was written as a single line of text instead of a table.
  - Text: `Table 83: Dwarf Elf Gnome 15% (3) 20% (4) 25% (5) Half-elf Halfling Human 15% (3) 20% (4) 15% (3)`

### Page 176

- [ ] Review · [line 7417](../books/dmg.md#L7417) · Chapter 15: A DM’s Miscellany > Lycanthropy · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Chapter 15: A DM’s Miscellany > Lycanthropy starts in the middle of a sentence.
  - Text: `a character, one of the most feared Of all the afflictions that can strike is lycanthropy. While oft`

### Page 178

- [ ] Review · [line 7439](../books/dmg.md#L7439) · Chapter 15: A DM’s Miscellany > Lycanthropy > Other Magical Diseases · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("%"'()%!'").
  - Text: `Lycanthropy is not the only type of weird and magical affliction that can strike a character. Filthy`

### Page 180

- [ ] Review · [line 7523](../books/dmg.md#L7523) · Appendix 1 > Table 84: Treasure Types · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 84: Treasure Types" has no Markdown table under it.
  - Text: `LAIR TREASURES INDIVIDUAL AND SMALL LAIR TREASURES`
- [ ] Review · [line 7527](../books/dmg.md#L7527) · Appendix 1 > Table 84: Treasure Types · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Treasure Type A | Copper 1,000–3,000 25% | Silver 200–2,000 30% | Gold 1,000–6,000 40% | Electrum*...`
- [ ] Review · [line 7560](../books/dmg.md#L7560) · Appendix 1 > Table 84: Treasure Types · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 84: Treasure Types" has no Markdown table under it.
  - Text: `* DM’s choice`

### Page 183

- [ ] Review · [line 7757](../books/dmg.md#L7757) · Appendix 2 > Magical Item Tables > Table 89: Potions and Oils (D6) · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 89: Potions and Oils (D6)" has no Markdown table under it.
  - Text: `* The type of creature affected can be determined by die roll (see the specific item description for`

### Page 184

- [ ] Review · [line 7803](../books/dmg.md#L7803) · Appendix 2 > Magical Item Tables > Table 90: Scrolls (D6) · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 90: Scrolls (D6)" has no Markdown table under it.
  - Text: `* See “Scrolls” in Appendix 3 to determine whether a priest scroll or a wizard scroll is found. ** `

### Page 186

- [ ] Review · [line 7993](../books/dmg.md#L7993) · Appendix 2 > Magical Item Tables > Table 96: Miscellaneous Magic: Jewels, Jewelry, Phylacteries (D6) · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 96: Miscellaneous Magic: Jewels, Jewelry, Phylacteries (D6)" has no Markdown table under it.
  - Text: `* Per level ** Per die of damage *** Per special bead **** See item description`

### Page 190

- [ ] Review · [line 8375](../books/dmg.md#L8375) · Appendix 2 > Magical Item Tables > Table 110: Special Weapons (D10) · `chunk-table-title-without-table` · [guide](#guide-chunk-table-title-without-table)
  - "Table 110: Special Weapons (D10)" has no Markdown table under it.
  - Text: `* See item description * See item description`

### Page 191

- [ ] Review · [line 8385](../books/dmg.md#L8385) · Appendix 3 > Potions · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Appendix 3 > Potions starts in the middle of a sentence.
  - Text: `glass, or metal flasks or vials (though you can Potions are typically found in ceramic, crystal, cha`
- [ ] **Fix** · [line 8417](../books/dmg.md#L8417) · Appendix 3 > Potions > Table 111: Potion Compatibility · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 191 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 191 may contain text from the surrounding column; check against the prin...`

### Page 193

- [ ] **Fix** · [line 8541](../books/dmg.md#L8541) · Appendix 3 > Potions > Table 111: Potion Compatibility · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 193.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 193 -->`
- [ ] **Fix** · [line 8542](../books/dmg.md#L8542) · Appendix 3 > Potions > Table 111: Potion Compatibility · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 193 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 193 has header cells that were not detected; check column headings again...`
- [ ] Review · [line 8544](../books/dmg.md#L8544) · Appendix 3 > Potions > Table 111: Potion Compatibility · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `|  | Number of | Additional |`
- [ ] **Fix** · [line 8589](../books/dmg.md#L8589) · Appendix 3 > Potions > Table 111: Potion Compatibility · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 193.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 193 -->`
- [ ] **Fix** · [line 8590](../books/dmg.md#L8590) · Appendix 3 > Potions > Table 111: Potion Compatibility · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 193 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 193 has header cells that were not detected; check column headings again...`
- [ ] Review · [line 8592](../books/dmg.md#L8592) · Appendix 3 > Potions > Table 111: Potion Compatibility · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `|  |  |  |  |  |  |  | Each flask contains sufficient oil to protect |`

### Page 195

- [ ] **Fix** · [line 8664](../books/dmg.md#L8664) · Appendix 3 > Potions > Table 111: Potion Compatibility · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 195.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 195 -->`
- [ ] Review · [line 8666](../books/dmg.md#L8666) · Appendix 3 > Potions > Table 111: Potion Compatibility · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Level of | Number of | Additonal |`
- [ ] Review · [line 8716](../books/dmg.md#L8716) · Appendix 3 > Scrolls · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Appendix 3 > Scrolls starts in the middle of a sentence.
  - Text: `ivory, jade, leather, metal, or wood. Some tubes Scrolls are generally found in cylinders—tubes of a`

### Page 196

- [ ] **Fix** · [line 8750](../books/dmg.md#L8750) · Appendix 3 > Scrolls > Table 112 · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: Table 112 on page 196: title and table structure were not recovered; its content follows as extracted text, check the printed page.
  - Text: `<!-- UNCLEAR: Table 112 on page 196: title and table structure were not recovered; its content follo...`
- [ ] **Fix** · [line 8752](../books/dmg.md#L8752) · Appendix 3 > Scrolls > Table 112 · `table-flattened` · [guide](#guide-table-flattened)
  - Table 112 was written as a single line of text instead of a table.
  - Text: `Table 112: Caster Level Total Reverse or Difference Failure Harmful Effect 1–3 95% 5% 4–6 85% 15% 7–...`

### Page 198

- [ ] Review · [line 8888](../books/dmg.md#L8888) · Appendix 3 > Rings · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Appendix 3 > Rings starts in the middle of a sentence.
  - Text: `mystic means. Furthermore, all magical rings look alike, so determination of a given ring’s magical `

### Page 200

- [ ] Review · [line 8948](../books/dmg.md#L8948) · Appendix 3 > Rings > List of Rings · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("%"'()%!'").
  - Text: `Ring of Djinni Summoning: One of the many fabled rings of fantasy legend, the “genie’’ ring is most `

### Page 204

- [ ] **Fix** · [line 9246](../books/dmg.md#L9246) · Appendix 3 > Rings > List of Rings · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 204.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 204 -->`
- [ ] **Fix** · [line 9247](../books/dmg.md#L9247) · Appendix 3 > Rings > List of Rings · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 204 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 204 has header cells that were not detected; check column headings again...`
- [ ] Review · [line 9249](../books/dmg.md#L9249) · Appendix 3 > Rings > List of Rings · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `|  | Thickness Penetrated per |  |`
- [ ] Review · [line 9267](../books/dmg.md#L9267) · Appendix 3 > Rods · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Appendix 3 > Rods starts in the middle of a sentence.
  - Text: `thumb. They are normally found in cases or similar stor-Rods are about three feet long and as thick `

### Page 206

- [ ] **Fix** · [line 9389](../books/dmg.md#L9389) · Appendix 3 > Rods > List of Rods · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 206.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 206 -->`
- [ ] Review · [line 9391](../books/dmg.md#L9391) · Appendix 3 > Rods > List of Rods · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Class | Charges | Race | Charges |`

### Page 207

- [ ] **Fix** · [line 9461](../books/dmg.md#L9461) · Appendix 3 > Staves > List of Staves · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 207.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 207 -->`
- [ ] Review · [line 9463](../books/dmg.md#L9463) · Appendix 3 > Staves > List of Staves · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D20 Roll | To Hit & Damage | XP Value |`

### Page 214

- [ ] **Fix** · [line 9890](../books/dmg.md#L9890) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 214.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 214 -->`
- [ ] Review · [line 9892](../books/dmg.md#L9892) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D100 | Weight | Weight Limit | Volume Limit |`

### Page 215

- [ ] **Fix** · [line 9911](../books/dmg.md#L9911) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 215.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 215 -->`
- [ ] **Fix** · [line 9912](../books/dmg.md#L9912) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 215 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 215 may contain text from the surrounding column; check against the prin...`
- [ ] **Fix** · [line 9913](../books/dmg.md#L9913) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 215 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 215 has header cells that were not detected; check column headings again...`
- [ ] **Fix** · [line 9915](../books/dmg.md#L9915) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `|  | Bag | of Tr | icks Ani A (1–5) | mals (D | 10) | create 1d4 + 1 doses of 1d4 + 1 potions. (The ...`
- [ ] Review · [line 9946](../books/dmg.md#L9946) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Appendix 3 > Miscellaneous Magic > List of Magical Items starts in the middle of a sentence.
  - Text: `each time an animal is drawn from the bag. There are three types of _bags of tricks_, each capable `

### Page 216

- [ ] **Fix** · [line 9990](../books/dmg.md#L9990) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 216 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 216 may contain text from the surrounding column; check against the prin...`

### Page 217

- [ ] **Fix** · [line 10076](../books/dmg.md#L10076) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 217.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 217 -->`
- [ ] Review · [line 10078](../books/dmg.md#L10078) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D4 | Flying | Maneuverability |`
- [ ] Review · [line 10088](../books/dmg.md#L10088) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("%"'()%!'").
  - Text: `Note that if salt water is used, the elemental will be stronger (+2 per Hit Die, maximum 8 hp per di`

### Page 218

- [ ] Review · [line 10124](../books/dmg.md#L10124) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("%"'()%!'").
  - Text: `Brazier Commanding Fire Elementals: This device appears to be a normal container for holding burning`

### Page 219

- [ ] **Fix** · [line 10158](../books/dmg.md#L10158) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 219.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 219 -->`
- [ ] Review · [line 10160](../books/dmg.md#L10160) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D100 Roll | Size | Capacity | Speed |`
- [ ] Review · [line 10167](../books/dmg.md#L10167) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("%"'()%!'").
  - Text: `Censer Controlling Air Elementals: This 6-inch wide, 1-inch high perforated golden vessel resembles `

### Page 220

- [ ] Review · [line 10219](../books/dmg.md#L10219) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("%"'()%!'").
  - Text: `The wearer can breathe underwater and has a movement rate of 18, like a manta ray (see the M%"'()%!'`
- [ ] **Fix** · [line 10267](../books/dmg.md#L10267) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 220.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 220 -->`
- [ ] **Fix** · [line 10268](../books/dmg.md#L10268) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 220: the first column seems to contain values from the next column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 220: the first column seems to contain values from the next column; chec...`
- [ ] **Fix** · [line 10269](../books/dmg.md#L10269) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 220 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 220 has header cells that were not detected; check column headings again...`
- [ ] Review · [line 10271](../books/dmg.md#L10271) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Chances of | Viewing |  |`

### Page 221

- [ ] **Fix** · [line 10319](../books/dmg.md#L10319) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 221.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 221 -->`
- [ ] **Fix** · [line 10320](../books/dmg.md#L10320) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 221 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 221 may contain text from the surrounding column; check against the prin...`
- [ ] Review · [line 10322](../books/dmg.md#L10322) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Cube Face | Charge Cost Per Turn/ Movement Rate | Effect |`

### Page 222

- [ ] **Fix** · [line 10391](../books/dmg.md#L10391) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 222.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 222 -->`
- [ ] **Fix** · [line 10392](../books/dmg.md#L10392) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 222 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 222 may contain text from the surrounding column; check against the prin...`
- [ ] **Fix** · [line 10393](../books/dmg.md#L10393) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 222 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 222 has header cells that were not detected; check column headings again...`
- [ ] Review · [line 10395](../books/dmg.md#L10395) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `|  | De | ck of Many Things |`
- [ ] Review · [line 10426](../books/dmg.md#L10426) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: many word fragments (K, Q, J).
  - Text: `_Deck of Illusions_ **CardsHearts** A: Red dragon K: Fighter & 4 guards Q: Female Wizard J: Druid 10`

### Page 224

- [ ] Review · [line 10556](../books/dmg.md#L10556) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("%"'()%!'").
  - Text: `Efreeti Bottle: This item is typically fashioned of brass or bronze, with a lead stopper bearing spe`

### Page 225

- [ ] Review · [line 10612](../books/dmg.md#L10612) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("%"'()%!'").
  - Text: `_Onyx Dog:_ When commanded, this statuette changes into a creature with the same properties as a war`
- [ ] Review · [line 10614](../books/dmg.md#L10614) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("%"'()%!'").
  - Text: `_Serpentine Owl:_ A _serpentine owl_ becomes a normal-sized horned owl (AC 7; move 24; 2d2 hit point`

### Page 226

- [ ] **Fix** · [line 10668](../books/dmg.md#L10668) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 226.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 226 -->`
- [ ] **Fix** · [line 10669](../books/dmg.md#L10669) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 226 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 226 has header cells that were not detected; check column headings again...`
- [ ] Review · [line 10671](../books/dmg.md#L10671) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D100 | Giant | Strength | Bonuses |  | Open |`
- [ ] **Fix** · [line 10685](../books/dmg.md#L10685) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 226.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 226 -->`
- [ ] **Fix** · [line 10686](../books/dmg.md#L10686) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 226 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 226 has header cells that were not detected; check column headings again...`
- [ ] Review · [line 10688](../books/dmg.md#L10688) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Rock Hurling | Weight |  | Base | Rock | Bend Bars/ |`

### Page 229

- [ ] **Fix** · [line 10818](../books/dmg.md#L10818) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 229.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 229 -->`
- [ ] Review · [line 10820](../books/dmg.md#L10820) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D20 Roll | Type of Horn | Berserk Fighters Summoned | Usable By |`

### Page 231

- [ ] **Fix** · [line 10921](../books/dmg.md#L10921) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 231.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 231 -->`
- [ ] Review · [line 10923](../books/dmg.md#L10923) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D20 | Type of | Construction | GP |`

### Page 233

- [ ] **Fix** · [line 10991](../books/dmg.md#L10991) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 233.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 233 -->`
- [ ] **Fix** · [line 10992](../books/dmg.md#L10992) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 233 has header cells that were not detected; check column headings against the printed page.
  - Text: `<!-- UNCLEAR: table on page 233 has header cells that were not detected; check column headings again...`
- [ ] Review · [line 10994](../books/dmg.md#L10994) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D20 |  | Nu | mber | of Mis | siles | and | Power | In Dic | e |  |`

### Page 234

- [ ] **Fix** · [line 11073](../books/dmg.md#L11073) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 234.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 234 -->`
- [ ] Review · [line 11075](../books/dmg.md#L11075) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D20 | Special | Plus of |`

### Page 238

- [ ] **Fix** · [line 11277](../books/dmg.md#L11277) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 238.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 238 -->`
- [ ] Review · [line 11279](../books/dmg.md#L11279) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D100 | Type(s) of Golem | XP |`

### Page 239

- [ ] **Fix** · [line 11319](../books/dmg.md#L11319) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 239.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 239 -->`
- [ ] Review · [line 11321](../books/dmg.md#L11321) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| Level of Wizard | Movement/ Round | Probability of Control/Round |`
- [ ] Review · [line 11351](../books/dmg.md#L11351) · Appendix 3 > Miscellaneous Magic > List of Magical Items · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: a run of mixed symbols ("%"'()%!'").
  - Text: `Stone of Controlling Earth Elementals: A stone of this nature is typically an oddly shaped bit of ro`

### Page 240

- [ ] Review · [line 11413](../books/dmg.md#L11413) · Appendix 3 > Armor and Shields · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Appendix 3 > Armor and Shields starts in the middle of a sentence.
  - Text: `some very special kinds of armor and In this section, you will find descriptions of shields. Before `

### Page 242

- [ ] **Fix** · [line 11505](../books/dmg.md#L11505) · Appendix 3 > Magical Weapons > List of Magical Weapons · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 242.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 242 -->`
- [ ] Review · [line 11507](../books/dmg.md#L11507) · Appendix 3 > Magical Weapons > List of Magical Weapons · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| 1. | Arachnids | 11. | Illusionists |`
- [ ] **Fix** · [line 11529](../books/dmg.md#L11529) · Appendix 3 > Magical Weapons > List of Magical Weapons · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 242.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 242 -->`
- [ ] Review · [line 11531](../books/dmg.md#L11531) · Appendix 3 > Magical Weapons > List of Magical Weapons · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D20 Roll | Magical Bonus | XP Value |`

### Page 243

- [ ] **Fix** · [line 11553](../books/dmg.md#L11553) · Appendix 3 > Magical Weapons > List of Magical Weapons · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 243.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 243 -->`
- [ ] Review · [line 11555](../books/dmg.md#L11555) · Appendix 3 > Magical Weapons > List of Magical Weapons · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D100 Roll | Magical Bonus | XP Value |`
- [ ] **Fix** · [line 11604](../books/dmg.md#L11604) · Appendix 3 > Magical Weapons > List of Magical Weapons · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 243.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 243 -->`
- [ ] Review · [line 11606](../books/dmg.md#L11606) · Appendix 3 > Magical Weapons > List of Magical Weapons · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D10 Roll | Type | XP Value |`

### Page 244

- [ ] **Fix** · [line 11645](../books/dmg.md#L11645) · Appendix 3 > Magical Weapons > List of Magical Weapons · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 244.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 244 -->`
- [ ] Review · [line 11647](../books/dmg.md#L11647) · Appendix 3 > Magical Weapons > List of Magical Weapons · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D20 Roll | Type | XP Value |`
- [ ] **Fix** · [line 11661](../books/dmg.md#L11661) · Appendix 3 > Magical Weapons > List of Magical Weapons · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: no table number/title detected next to this table on page 244.
  - Text: `<!-- UNCLEAR: no table number/title detected next to this table on page 244 -->`
- [ ] Review · [line 11663](../books/dmg.md#L11663) · Appendix 3 > Magical Weapons > List of Magical Weapons · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D100 Roll | Type | XP Value |`

### Page 245

- [ ] Review · [line 11701](../books/dmg.md#L11701) · Appendix 3 > Magical Weapons > List of Magical Weapons · `text-garbled` · [guide](#guide-text-garbled)
  - Text looks garbled: many word fragments (CE, LG, LE, LE, CG, CE).
  - Text: `1 black (CE) 6 gold (LG) 2 blue (LE) 7 green (LE) 3 brass (CG) 8 red (CE) 4 bronze (LG) 9 silver (LG`

### Page 247

- [ ] Review · [line 11796](../books/dmg.md#L11796) · Appendix 3 > Magical Weapons > Table 113: Weapon Intelligence and Capabilities · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Appendix 3 > Magical Weapons > List of Magical Weapons starts in the middle of a sentence.
  - Text: `should be checked as a single entity. A trident of this type contains 1d4+16 charges. It is otherwi`

### Page 248

- [ ] Review · [line 11848](../books/dmg.md#L11848) · Appendix 3 > Intelligent Weapons > Table 114: Weapon Alignment · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Appendix 3 > Intelligent Weapons > Weapon Abilities starts in the middle of a sentence.
  - Text: `one thing at a time. Other abilities can be created by the DM. If the same power is rolled twice, `

### Page 249

- [ ] Review · [line 11951](../books/dmg.md#L11951) · Appendix 3 > Intelligent Weapons > Table 117: Special Purpose Weapons · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D100 Roll | Purpose |`
- [ ] Review · [line 11970](../books/dmg.md#L11970) · Appendix 3 > Intelligent Weapons > Table 117: Special Purpose Weapons · `table-no-title` · [guide](#guide-table-no-title)
  - No 'Table N:' title in the lines above this table.
  - Text: `| D100 Roll | Power |`
- [ ] Review · [line 12001](../books/dmg.md#L12001) · Appendix 3 > Intelligent Weapons > Table 118: Languages Spoken by Weapon · `chunk-starts-midsentence` · [guide](#guide-chunk-starts-midsentence)
  - Chunk in Appendix 3 > Intelligent Weapons > Weapons versus Characters > B. Special Purpose Power starts in the middle of a sentence.
  - Text: `of having to face grim odds to do so. Weapons of this nature will never be totally controlled or si`
- [ ] **Fix** · [line 12009](../books/dmg.md#L12009) · Appendix 3 > Intelligent Weapons > Table 119: Weapon Ego · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 249 may contain text from the surrounding column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 249 may contain text from the surrounding column; check against the prin...`
- [ ] **Fix** · [line 12010](../books/dmg.md#L12010) · Appendix 3 > Intelligent Weapons > Table 119: Weapon Ego · `unclear` · [guide](#guide-unclear)
  - Marked unclear by the converter: table on page 249: the first column seems to contain values from the next column; check against the printed page.
  - Text: `<!-- UNCLEAR: table on page 249: the first column seems to contain values from the next column; chec...`
- [ ] **Fix** · [line 12012](../books/dmg.md#L12012) · Appendix 3 > Intelligent Weapons > Table 119: Weapon Ego · `table-title-in-table` · [guide](#guide-table-title-in-table)
  - The table's title seems to have been captured inside the table, broken across cells.
  - Text: `| Table 119: |`

## Guides

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

<a id="guide-chunk-oversized-text"></a>

### Long text without paragraph breaks (`chunk-oversized-text`)

**In the PDF:** Look at the paragraphs on the page.

**In the Markdown:**

1. Add a blank line between paragraphs or entries, as the page shows them.

<a id="guide-page-jump"></a>

### Pages skipped (`page-jump`)

**In the PDF:** Look at the skipped pages in the PDF.

**In the Markdown:**

1. If they hold text (not only illustrations or blank space), that text is missing from the Markdown: add it, with its page markers.
2. If they are full-page illustrations, the cover or blank pages, leave it.

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

<a id="guide-unclear"></a>

### Passage the converter marked as unclear (`unclear`)

**In the PDF:** Read the passage or table at that point on the printed page; the marker says what the converter was unsure about.

**In the Markdown:**

1. Compare the text, or every cell of the table, with the page.
2. Correct whatever differs. For tables, check the header row first: a missing or shifted header makes every value below it wrong.
3. Delete the <!-- UNCLEAR: ... --> line once the passage matches the page.

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

<a id="guide-table-no-title"></a>

### Table without a numbered title above it (`table-no-title`)

**In the PDF:** Look above the table on the page for its number and title.

**In the Markdown:**

1. If the page shows a title, add it on its own line above the table: #### Table N: Title.
2. If the page shows the table without a number, leave it: this task will stay in the list, and that's fine.

<a id="guide-heading-jump"></a>

### Heading more than one level below the previous one (`heading-jump`)

**In the PDF:** Look at how the book nests this section.

**In the Markdown:**

1. If the section belongs directly under the previous heading, use one more # than that heading (the hint suggests the level).
2. If the book really nests it this way, leave it.

<a id="guide-chunk-table-title-without-table"></a>

### Table title with no table under it (`chunk-table-title-without-table`)

**In the PDF:** Find the table on the page.

**In the Markdown:**

1. The converter often couldn't rebuild it: its values may follow as plain text, or there may be an UNCLEAR note.
2. Rebuild it as a Markdown table under its title, from the page.
3. Delete any plain-text leftovers of the table and the UNCLEAR note.

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
