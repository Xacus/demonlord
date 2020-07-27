# System: Shadow of the Demonlord

This is Shadow of the Demon Lord for FoundryVTT.

Shadow of the Demonlord has no open license, but permission was granted to make the system.

## **Features**

### **General:**
Remember, that you as a player only can effect your own Actor and not take damage or heal other Actors. It's the job of the GM to micromanage damage/healing etc. 

As a GM when you need to apply damage/healing you just select a single or more actors and then use the apply button in the chat.

### **Combat Tracker:**
Uses the standard Combat Tracker but with a few changes. It still uses the standard way of having a initiative value that determines the order of actors. You can still change the number manually if your players need a different order.

* It shows FAST/SLOW turns for each Actor.
* When rolling/rerolling initiative you are prompted to choose between Fast or Slow turn.
* It's also possible to change turn order directly in the Combat Tracker by clicking on FAST/SLOW on your actor.
* On your character sheet at the top of the window their is a "Actor Mods" menu button. Their you can set the default initiative turn order for you character, npcs and creatures. When you create an Actor the default is set to Slow.
* Use characteristics.health to track damage on your token. It uses characteristics.health.value for damage score and characteristics.health.max as health score.
* System Settings: I added som settings regarding showing messages in the chat log when changing between fast and slow turn and randomizing the initiative a lille.

### **Compendiums:**
The weapons, armors and ammunition from the core rulebook is available for draging and droping onto your character sheet.

### **Dice So Nice!:**
This module is supported.

### **Macros:**
Challenge Roll Macros: 
- game.demonlord.rollAttributeMacro("strength");
- game.demonlord.rollAttributeMacro("agility");
- game.demonlord.rollAttributeMacro("intellect");
- game.demonlord.rollAttributeMacro("will");
- game.demonlord.rollAttributeMacro("perception");

Roll Initiative Macro:
Rolls initiative for the selected actor token.
- game.demonlord.rollInitMacro(); 

Healing Potion Macro:
Takes the selected actors Healing Rate and subtracts it from his/her damage.
- game.demonlord.healingPotionMacro();

Request Roll Macro:
GM Tool for requesting players to make Challenge or Initiative rolls. Select player to send request to. A private message is send to the players with a button to roll.
- game.demonlord.requestRollMacro();

### **Tracking:**
You can track both Health and Insanity and they are set on the token when an Actor is created.
- characteristics.health
- characteristics.insanity

## **Plans**
- [x] Enter Abilities, Characteristics and calculate modifers.
- [x] Weapons.
- [x] Talents.
- [x] Magic(Traditions and Spells)
- [x] Items.
- [x] Creature statblock.
- [x] Compendium.
- [x] Basic Background (Paths, Professions, Wealth).
- [x] Combat Tracker (Fast/Slow Turn).
- [x] Dice So Nice! Support.
- [x] Macros for players.
- [x] Macros for creatures.
- [x] Actor Mods - Fase 1, general structur. 
- [x] Afflictions - Fase 1, saving.
- [x] Afflictions - Fase 2, icons on token, rules.
- [x] Redesign Talents.
- [x] Ancestry.
- [x] Calculating characteristics.
- [x] Creature statblock - Fase 2, Special Attack are Talents.
- [x] New design.
- [ ] Redesign Background (Paths, Professions, Wealth).
- [ ] Redesign Magic.
- [ ] New Paths system. Calculating Attributes and Health.
- [ ] Actor Mods - Fase 2. (Your character buffs)
- [ ] Afflictions - Fase 3.
- [ ] Level up system.
- [ ] Rules Engine.

Shadow of the Demon Lord is ©2015 Schwalb Entertainment, LLC. All rights reserved.
Shadow of the Demon Lord, Schwalb Entertainment, and their associated logos are trademarks of Schwalb Entertainment, LLC.
