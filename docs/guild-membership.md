# Guild membership cards and rank experience

## Enrollment and character identity

When a player who owns a character first opens that character's sheet, EWQM opens an unsealed guild card for review. Gamemasters do not receive the enrollment prompt; they can use the character-sheet button to preview a character's card. On a GM's card, **View as player** hides GM controls and enables the same enrollment workflow a player sees, including for a GM-owned PC. The card prefills the character name, class, level, age, gender, and race from dnd5e data where available. Players may complete blank identity fields before selecting **Join Guild**. Enrollment stores the profile and starting experience on that character's actor flag; the information is read-only afterward. Joining switches the card to its sealed artwork and displays the starting rank. The displayed character level always reads from the actor, so it follows level changes without changing guild rank.

Membership is per actor. A player with several characters joins separately with each one. The guild card button in the character sheet header opens that character's saved card and shows its current rank.

The unsealed and sealed blank card artwork and rank letter artwork live in `assets/guild/`. The card is rendered over the appropriate artwork so the text and rank can update without generating or editing a bitmap for every member.

## Rank and experience

Ranks ascend **G → F → E → D → C → B → A → S**. Guild XP is a character-level total; each threshold advances one rank, and falling below a threshold demotes the character. XP cannot go below zero. Rank S is the maximum. The card shows progress toward the next rank as `X/Y`; rank S shows its total XP instead.

Default advancement thresholds are 100 XP (G→F), 150 (F→E), 200 (E→D), 250 (D→C), 300 (C→B), 400 (B→A), and 500 (A→S), for 1,900 total XP to reach S. They are provisional balancing values. A GM can tune each threshold in Foundry's **Module Settings → EmberWolf Quest Manager** section. Ranks are recalculated from each character's saved Guild XP, so editing a threshold may immediately promote or demote existing members. The quest board's **Party identity and quest XP** section controls the shared party name and provisional +25 XP completion / −10 XP failure values.

A GM can assign any rank from a character's guild card, including enrolling an unregistered character. Assigning a rank sets total Guild XP to the beginning of that rank's current threshold band; quest-resolution history and saved identity for existing members are preserved.

Only the GM records an accepted quest as completed or failed. On publication, the GM-selected party actor IDs are snapshotted into the private quest record. On resolution, each enrolled character in that snapshot receives the configured award or penalty. Closing a quest does not change XP. The outcome is terminal, and actor-level quest ledgers prevent repeat awards if resolution is retried.

## Data boundaries

- Character profile, rank progress, guild XP, and resolved quest IDs are stored on that character's actor flag.
- Party name, rank progression thresholds, quest awards and penalties, and the selected party roster are world settings.
- Quest participant snapshots and internal outcome details stay in GM-owned quest journal records.
- The player-visible quest projection does not contain actor IDs, party roster details, or GM notes. The separate world roster setting retains the actor IDs selected for the party.

The party name is a shared label shown on the quest board. Membership and guild XP remain individual to each character.

