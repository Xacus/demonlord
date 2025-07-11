# Changelog

All notable changes to this project will be documented in this file.

## [5.0.11]
### Fixed
- Active effect config selector

## [5.0.10]
### Added
- Option to add inventory tab to creature sheet
- Option to hide fortune in character sheets

## [5.0.9]
- Make fortune a toggle

## [5.0.8]
### Added
- Chat card alias option to use actor or token name

### Fixed
- Combatant drag and drop
- Standardise rest chat card functions

## [5.0.7]
### Fixed
- Properties text in items not saving

## [5.0.6]
### Added
- TokenRuler integration

## [5.0.5]
### Added
- Option for encounter difficulty in tracker

## [5.0.4]
### Fixed
- Combat tracker

## [5.0.3]
### Fixed
- Flag fixes for v13

## [5.0.2]
### Fixed
- Update minimum version in manifest

## [5.0.1]
### Fixed
- Special duration fixed for v13
- Remove a bunch of deprecation warnings

## [5.0.0]
### Added
- Upgrade to v13
- Default turn marker

### Fixed
- Add hands to weapons in compendium
- Improve descriptions for injured, disabled and dying conditions

## [4.8.8]
### Fixed
- Attack roll dialog for non-English locales

## [4.8.7]
### Added
- Optional Rule: Surrounded

## [4.8.6]
### Added
- Option to toggle visibility of creature activity descriptions

## [4.8.5]
### Added
- Option to automatically mark tokens as defeated in combat tracker

## [4.8.4]
### Added
- Option to roll challenge roll when using Ctrl+Click on attribute

## [4.8.2-4.8.3]
### Added
- Enhancements to attack chat card

## [4.8.1]
### Fixed
- Only plusify truthy values when creating add effects
- Ensure uses are compared as numbers in all cases

## [4.8.0]
### Added
- Ability to roll modifiers on attacks
- Ability to make attribute attacks

### Fixed
- Player tracker not re-opening

## [4.7.1]
### Added
- Make fortune a counter

## [4.7.0]
### Added
- Setting to ignore encumbrance rules
- Active effect for requirement modifier, which is added to attribute value during encumbrance calculation

### Fixed
- Restore content drag from item sheet
- Display issue in frightening/horrifying checkbox in Firefox
- Restore corruption and insanity formula editor

## [4.6.7]
### Added
- Ignore frightened/horrifying bane for characters above a certain level

## [4.6.5-4.6.6]
### Added
- Option to interpred 20+ exceeds by 5 to mean "more than 5"

## [4.6.4]
### Fixed
- Create language button on ancestry
- Path effects not applying
- Wrong item being saved when multiple sheets are open

## [4.6.3]
### Fixed
- Prevent creation of double level 4 on ancestry migration

## [4.6.2]
### Fixed
- Ensure roll formulas are copied when level is edited

## [4.6.1]
### Fixed
- Ancestry import

## [4.6.0]
### Added
- Migrate ancestry to use levels


## [4.5.4]
### Added
- Option to hide actor info (i.e. name, ancestry) from chat messages

## [4.5.3]
### Fixed
- Options text not sticking to level
- Delete effects when modifying an embedded item update if the item name was changed

## [4.5.2]
### Fixed
- Correct missing spell type
- Prevent errors when combatant is deleted

## [4.5.1]
### Added
- Expand item macro creation to embedded and observed items

### Fixed
- Restore end of round dialog
- Path and ancestry sheets not accepting embedded items

## [4.5.0]
### Added
- Migrate all item sheets to ApplicationV2
- Support for powerful ancestries (or any combination of ancestry levels)
- Support for extra effects on weapons and talents

### Fixed
- Binary active effects (i.e. Frightening, Horrifying, Immune)
- Error when rolling damage for a token not present in scene
- Auto-removal of embedded items when removing parent item from actor
- Auto-embedding of items when created from parent item
- Duplicate effects when renaming embedded item
- Affliction immunity for effects from embedded items

## [4.4.6]
### Added
- New special duration: RestComplete

### Fixed
- Logic of SpecialDuration:EndOfRound
- Logic of SpecialDuration:NextD20Roll

## [4.4.4]
### Added
- Individual and group initiatives
- Next roll duration
- Automate concentration

## [4.4.1]
### Added
- Forbidden Rules Support (consistent damage, static boons/banes and bell curve rolls)
- Roman numerals on d3
- Active effect for affliction immunity

### Fixed
- Restore requirements to swift weapons

## [4.3.1-4.3.2]
### Added
- Colouring of Dice So Nice! boon/bane dice
- Settings for dice colour selection

## [4.3.0]
### Added
- Optional new item sheets (excluding ancestries, paths and creature roles)

## [4.2.3]
### Added
- Colour to used die (green for boons, red for banes)

## [4.2.2]
### Added
- Hide active effects from talent when marked "Apply Effect to Actor"

## [4.2.0]
### Added
- System-specific vision modes

## [4.1.2]
### Fixed
- Path stuck on novice

## [4.1.1]
### Added
- Ability to limit extra damage to weapons, spells talents or all
- Move StatEditor and RestDialog to ApplicationV2 (new UI)

## [4.0.0]
### Added
- Support for v12

## [3.10.1]
### Added
- Delete matching active effect when reapplying from chat message

## [3.9.9]
### Added
- Improve rest dialog and chat message

## [3.9.7-3.9.8]
### Added
- Simplify afflictions
- Banes on attack rolls against horrifying creatures

### Fixed
- Afflictions not being removed correctly from creatures
- Frightening and Horrifying checkboxes modifying the wrong creature

## [3.9.1-3.9.6]
### Added
- Manhattan distance for movement calculation
- Replace Demon Lord icon and logo
- Theme UI
- Indicator for nested items' source

## [3.9.0]
### Added
- Setting to use ancestry and path icons as is
- Hide target number for rolls with an NPC as its target

### Fixed
- Broken vehicle stats

## [3.8.7-3.8.9]
### Added
- Ability to assign ammo to weapons
- Diagonal movement calculation options

### Fixed
- Display glitch on creature role tabs

## [3.8.6]
### Added
- Prevent challenge roll if actor's attribute set to immune
- Prevent changing insanity and corruption and hide values if set to immune

## [3.8.3]
### Added
- Improve roll reporting on `actor.use*` functions


## [3.8.1]
### Added
- Display number of content items on inventory items

## [3.8.0]
### Added
- Attributes in rolls (e.g. `1d6 + @level`)
- Default image to system languages

## [3.7.6]
### Added
- Support Babele translations for system compendia

## [3.7.4]
### Added
- French translation
- Improvements to I18N system

## [3.7.2]
### Added
- Fractions and decimals in actor size
- Right click toggle for auto-calculation of max spell castings
- Setting for confirmation of ancestry and path removal

### Fixed
- Correct default max insanity
- Restore healing options

## [3.7.1]
### Fixed
- Combat turn selection
- Restore creature sizes
- Incorrect upper limit on some characteristics

## [3.7.0]
### Added
- Allow players to edit ancestries and paths of owned characters
- Make items in the end of round dialog clickable
- Rollable attributes and characteristics to ancestry
- Differentiate between PCs and NPCs for initiative purposes

## [3.6.0]
### Added
- Normalise appearance of attach messages and damage buttons across item types
- Allow 20+ damage from multiple sources
- Support active effects that affect size
- Hide modifier label for immune attributes
- Support grandchild active effects
- Include special action, special attack and end of round talents to creature reference tab even if the creature has no attack options

### Fixed
- Square measured templates

## [3.5.1]
### Added
- Relics
- Background image for system
- Armor, insanity and corruption to creature reference tab

### Fixed
- Defense calculation

## [3.4.1]
### Added
- Recolour damage bar (green to red as it fills up)
- Make roll evaluation async
- Show roll modifiers individually

### Fixed
- Input boons not showing in chat message
- Enrich End of the Round dialog descriptions
- Restore extra damage from active effects on spells and items

## [3.4.0]
### Added
- Support for containers

## [3.3.1]
### Added
- Defense boons for all
- Improve support for defense calculation of creatures

### Fixed
- Delete effects on expiration

## [3.3.0]
### Added
- Active effects for afflictions
- Active effects for boon/bane on all attacks/challenges

### Fixed
- Remove duplicate "Attack Roll Bonus" from chat message
- Inline rolls clipping in creature reference tab
- Restore Roll Special Action functionality
- Enriched description for creature's Combat tab

## [3.2.0]
### Added
- Measured templates to talents and weapons
- Challenge rolls to weapons
- Attack, damage, challenge rolls and measured templates to end of round items

## [3.1.4]
### Fixed
- Restore Dead icon when default Foundry effects are removed

## [3.1.3]
### Fixed
- Combat skipping first combatant

## [3.1.2]
### Fixed
- Improve item load performance (parallelised nested-item-search)
- Restore DragRuler funcionality
- Localised descriptions to affliction active effects

## [3.1.0]
### Added
- Null attributes and some null characteristics
- Allow disabling auto-calculation of spells (per-actor setting)
- Creature roles
- Legendary paths

### Fixed
- Restore compatibility with Firefox
- Template not being placed with auto-target option active


## [3.0.4]
### Fixed
- Level-up issue where talents were being removed
- Remove lingeging shadow after placing a measured template
- Bane from Cumbersome to Greatsword

## [3.0.2]
### Fixed
- Stuck delete on damage types
- Fall back to different damage values if main damage not present in talent
- 20+ damage box to talent and weapon

## [3.0.0]
### Added
- Injured affliction and UI indicator
- Automatic calculation of injured affliction
- Rest button
- Invisible tooltip

### Fixed
- French turn types

## [2.2.9]
### Added
- Text field for vehicle size

### Fixed
- Healing rate calculation
- Missing attribute bonuse in creature reference sheet
- Talent damage not rolling

## [2.2.8]
### Added
- Support for vehicles
- active effects tab to items, languages and professions
- Automatically update injured condition when taking/healing damage

### Fixed
- Item description in Firefox
- Active effects for healingrate

## [2.2.3]
### Fixed
- Boons incorrectly being always rerolled
- Apply vision macro now updates actors (even in compendiums)

## [2.2.2]
### Added
- Compatibility with foundry v10.
- New macro "Change Token Vision". It allows to apply vision types like Darksight, Sightless, and all the others to the selected tokens, using the new Foundry v10 token vision settings.
- New Active Effect property, which allows character to reroll 1 on boon rolls
- 2 new Active Effect properties: "Attack Boons/Banes - Spell" and "Attack Boons/Banes - Spell"
- New setting "Auto Delete Effects"
- It is now possible to change the initiative order directly inside the combat tracker simply by dragging the combatants:
  - Dragging with the Alt key pressed puts the dragged combatant below instead of above.
  - GMs can drag all combatants, Players only owned combatants
  - Dragging is limited to the initiative "speed slots". For example, characters with fast turns can freely move their order within other character with fast turns, but not creatures with fast or slow turns.
  - Huge thanks to Mana#4176 for providing the initial implementation!
### Changed
- Now measured templates dynamically target tokens even before placing them.
- Auto targeting by measured templates is now enabled by default.
- Code for macros in the system compendium is now internal for easier maintenance.
- Minor UI changes.
- Changed some default item icons (End of round, Special Action, Weapon, Talent, Feature).
- Improved UI of Afflictions tab. The Invisible token effect is now added, integrating with new foundry v10 vision changes.
- Improved Incapacitated, Unconscious and Dying afflictions. Incapacitated is now applied when characters reach maximum damage.
- Active Effects durations improvements:
  - Combat tracker now properly keeps track of effect durations.
  - Note: Spell effects with 1 round duration will last until the end of next round instead of the end of the current round.
  - Effects are now automatically disabled when game time advances, for example when using Simple Calendar module.
  - If the "Auto Delete Effects" setting is on, temporary effects that are "external" to the character, such as effects from spells or afflictions are automatically deleted.
  - Effects inside the character sheet now display their duration in rounds if in combat, and in seconds outside combat.
### Fixed
- Error message when applying afflictions.
### Removed
- Apply afflictions GM macro.
### Notes
- Worlds created prior to version v10 must be migrated to v10. This process is irreversible, so as always doing a backup is strongly advised.
- Some old GM and player macros in the hotbar need to be imported again using the new versions in the compendium. This does not apply to item macros.

## [2.2.1]
### Fixed
- Bug that deleted all character descriptions
- Nested items sometimes were not retreived
### Removed
- All custom editor instances, for stability.

## [2.2.1]
### Fixed
- Bug that deleted all character descriptions
- Nested items sometimes were not retreived
### Removed
- All custom editor instances, for stability.

## [2.2.0]
### Changed
- New item sheet design focused on compactness and insertion speed.
- Path levels are now divided into tabs.
- When clicking on item names inside character sheets now they get posted to chat.
- Changed the design of languages, features and professions inside character sheets.
- Improved how items inside paths and ancestries are retrieved. Now items are looked inside compendiums and items first,
then a fallback method is used.
- Paths and ancestries now always display the updated version of items present within them, instead of displaying the
items in the state that they were dropped in.
- Token targeting is now "on target" instead of "on selected" by default.
### Added
- Now it is possible to create items directly inside ancestries and paths for faster compendium making. The item gets created directly inside a folder
in the sidebar and added to the ancestry or path.
- Selectable talents or spells from ancestries/paths. The players can now select which talents they want to add to their sheet.
- When selecting a path type (novice, expert, master) the levels get filled automatically. Note that levels do not get removed automatically as a
safeguard against involuntarily changing the path type.
- New inline editor for descriptions. When selecting text such as "1d6", it can be transformed into a rollable icon with the "Roll" button or with
ctrl+r shortcut.
- New and improved tooltips.
- New icons.
### Fixed
- Duplication bug that happened if a path or ancestry had an item with the same name in it.
- Bug of item tooltips inside paths when the item description had HTML in it.
### Compatibility
- When deleting paths or ancestries added to characters prior to this version, the items from those paths or ancestries
do not get deleted automatically, so manual deletion is required.

## [2.1.1]
### Added
- Creature reference tab
### Changed
- Design of additional info under spells and talents in actor sheets
- Layout of creature main tab
### Fixed
- Bug with healing rate when health was manually edited in the character sheet

## [2.1.0]
### Changed
- Changed the UI of several character sheet tab
- New creature sheet, with compact main tab, and separate spells tab
- Removed the creature edit view. Now everything can be done in one tab.
- Changed how to interact with actions such as weapons:
  - To roll, click the name of the action
  - To edit, click the icon
  - Right clicking on Talents deactivates them, without reducing the number of uses
- Creature role is back, since it broke worlds where such items were present. Will be removed properly in a future version
### Fixed
- Perception effects now get correctly applied once

## [2.0.8]
### Fixed
- Worlds with Creature Roles items couldn't be started


## [2.0.7]
### Fixed
- Health is now calculated properly. Before, health effects were being applied twice, and healing rate was calculated
only using strength
### Removed
- Creature Role item type


## [2.0.6]
### Fixed
- Active effect sheet now displaying correctly, with easier attribute key selection
- Minimum attribute value is now 0
- Selected Path attributes now remains selected after editing the path

## [2.0.5]
### Fixed
- Mark of Darkness not applying automatically after failed Corruption roll
- Spell defense challenge rolls not appearing in chat message
- Max perception is now 25 instead of 20
- Defense is now correctly applied to creatures
- Creature sheets in view mode now display End of Round section correctly

### Changed
- New character tokens don't have dim vision anymore


## [2.0.4]
### Fixed
- Foundry v9 support

## [2.0.3]
### Added
- Italian localization (thanks to Cugi#0989)
- Added Taiwanese Chinese localization (thanks to zeteticl, Tian#7972)
- Improvements in spanish localization (thanks to ParvusDomus#9612)

### Fixed
- Localization now applies to attributes in character sheet
- Fixed chat success/failure border not correctly showing in languages other than english
- Default character sheet window size is now slightly wider to accommodate other languages words length
- Fixed ancestry and path transfer traits error
- Fixed paths not correctly adding talents to level 10 characters

## [2.0.2] - 2021-06-21

### Fixed

- Measured Template: Selection support
- Damage Types
- Mark of Darkness
- Defense bonus Active Effect now correctly applies
- Perception errors
- Errors on character leveling up
- Fixed multiple damages not being correctly updating in sheets
- Dice So Nice custom dice text color is now white
- Fixed errors when deleting a path from inside an actor
- Improved Path and Ancestry Item fetching inside compendia
- Data of nested Talents, languages, etc... inside Paths or Ancestries is now stored directly inside the container
  This allows items such as talents to be still retrieved even when the original item is deleted

### Added

- Active Effects' duration now decreases at each round (only for 'round' duration)

## [2.0.1] - 2021-06-06

### Fixed

- Added Dice So Nice, Colorset + Preset + Image
- Added Mark of Darkness to Features
- Removed dice sound when attacking and Dice So Nice is used. It made two different sound effects.
- Measured Template on Foundry 0.8.x
- Measured Template: Auto-targeting on Foundry 0.8.x
- Measured Template: Auto remove measured template after action
- Measured Template: Support to target or selection in chat log actions
- Talents inside paths now are correctly handled when path is edited
- Improved migration code
- Fix Encumbrance not correctly applying
- Perception snow correctly uses Intellect as base
- Automated Animations integration
- Macro: Request initiative

## [2.0.0] - 2021-05-28

### Overview

- Foundry 0.8.x support
- New item sheets layouts
- New Character and Creature sheet layout
- Implemented Active Effects
- Icons converted to .webp, saving 90% space

### Active Effects

- Items and Actors now have a new tab "Effects" where effects can be managed
- "Overview" Actor sub-tab, where all effects that modify the character stats are displayed
- When using an item, the Active effects inside it get posted to chat (GM only). When clicking on the chat button, the effect gets transferred to the targeted actors. This allows items, such as spells, to have effects that edit character stats, both temporarily and permanently.
- Temporary active effects get listed inside the combat encounter section. When clicking on an effect from this section, it gets removed (if it's an affliction) or disabled
- Temporay active effects duration automatically decreases when the round advances

### Settings

- Removed "Reverse Damage" mode.
- Removed "Homebrew mode"
- Added "Replace default icons". When it's on (default), newly created items use custom icons instead of the foundry's default ones.
- Added "GM Effects controls". Normally some effects derived by items inside an Actor are not editable or toggleable, such as those derived from Ancestries and paths. With this setting turned on, the game master has the ability of controlling those effects. However, since those effects are automatically generated from the item, if the item is edited again the custom changes made may get overridden.

### Other

- Talents that do not have uses are now "always enabled".
- Talents, spells and languages present in Ancestries and Paths are now correctly added when the character levels up (except "choose one" talents)
- Improved the chat message content for rolls
- Removed the Enchantments section. To enchant items now, active effects can be used
- Roll dialog layout slightly improved. Moved inputs to the left and can now be increased/decreased using the scroll wheel
- Removed Actor Mods
- The behaviour of apply damage and healing has been reverted from "apply to targeted tokens" to "apply to selected tokens"
- When clicking on healing rate, it heals the character. Left click: full healing; Right click: half healing
- Replaced default foundry logo in the upper right corner with the SotDL banner, replaced the default "game paused" icon
- Removed Activated Effects tab to avoid confusion between it and "Effects". Measured template has been moved to the "Attributes" tab
- Moved the folder /icons/ to /assets/icons/
- Added 38 new high quality badge icons for your paths and ancestries! You can find them inside assets/icons/badges
- Changed the design of the character tab inside character sheet. Now badges are used to represent ancestries and paths. If you would like more badges icons and are eager to make a small contribution to this project, don't hesitate to contact us on Discord!

### Behind the scenes changes

- Project structure changed to use rollup, eslint and prettifier
- Completely revamped the way Items influence Actors
- Removed legacy code
- General code improvements in some files
- Reduced js code footprint by 40%

# Info

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Versions prior to 2.0.0 are documented in the github releases
