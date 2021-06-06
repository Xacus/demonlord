# Changelog

All notable changes to this project will be documented in this file.

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

### Overviewss

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
