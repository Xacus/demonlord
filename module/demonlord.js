// Import Modules
import { DL } from './config.js'
import { DemonlordActor } from './actor/actor.js'
import { DemonlordActorSheet } from './actor/actor-sheet.js'
import { DemonlordActorSheet2 } from './actor/actor-sheet2.js'
import { DemonlordCreatureSheet } from './actor/creature-sheet.js'
import { DemonlordItem } from './item/item.js'
import { DemonlordItemSheetDefault } from './item/item-sheet2.js'
import { DemonlordPathSetup } from './item/path-setup.js'
import { registerSettings } from './settings.js'
import {
  rollInitiative,
  startCombat,
  nextTurn,
  setupTurns
} from './init/init.js'
import combattracker from './combattracker.js'
import { CharacterBuff } from './buff.js'
import * as migrations from './migration.js'

Hooks.once('init', async function () {
  game.demonlord = {
    DemonlordActor,
    DemonlordItem,
    rollWeaponMacro,
    rollTalentMacro,
    rollSpellMacro,
    rollAttributeMacro,
    rollInitMacro,
    healingPotionMacro,
    migrations
  }

  // Define custom Entity classes
  CONFIG.DL = DL

  Combat.prototype.rollInitiative = rollInitiative
  Combat.prototype.startCombat = startCombat
  Combat.prototype.nextTurn = nextTurn

  if (!isNewerVersion(game.data.version, '0.6.9')) {
    Combat.prototype.setupTurns = setupTurns
  }

  CONFIG.Actor.entityClass = DemonlordActor
  CONFIG.Item.entityClass = DemonlordItem
  CONFIG.ui.combat = combattracker

  registerSettings()

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet)
  Actors.registerSheet('demonlord', DemonlordActorSheet, {
    types: ['character'],
    makeDefault: false
  })
  Actors.registerSheet('demonlord', DemonlordActorSheet2, {
    types: ['character'],
    makeDefault: true
  })

  Actors.registerSheet('demonlord', DemonlordCreatureSheet, {
    types: ['creature'],
    makeDefault: false
  })

  Items.unregisterSheet('core', ItemSheet)
  Items.registerSheet('demonlord', DemonlordItemSheetDefault, {
    types: [
      'item',
      'feature',
      'spell',
      'talent',
      'weapon',
      'armor',
      'ammo',
      'specialaction',
      'endoftheround',
      'mod',
      'ancestry',
      'profession'
    ],
    makeDefault: true
  })
  Items.registerSheet('demonlord', DemonlordPathSetup, {
    types: ['path'],
    makeDefault: true
  })

  window.CharacterBuff = CharacterBuff

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function () {
    var outStr = ''
    for (var arg in arguments) {
      if (typeof arguments[arg] !== 'object') {
        outStr += arguments[arg]
      }
    }
    return outStr
  })

  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase()
  })

  Handlebars.registerHelper('json', JSON.stringify)

  preloadHandlebarsTemplates()
})

async function preloadHandlebarsTemplates () {
  const templatePaths = [
    'systems/demonlord/templates/tabs/character.html',
    'systems/demonlord/templates/tabs/combat.html',
    'systems/demonlord/templates/tabs/talents.html',
    'systems/demonlord/templates/tabs/magic.html',
    'systems/demonlord/templates/tabs/item.html',
    'systems/demonlord/templates/tabs/background.html',
    'systems/demonlord/templates/chat/challenge.html',
    'systems/demonlord/templates/chat/combat.html',
    'systems/demonlord/templates/chat/damage.html',
    'systems/demonlord/templates/chat/description.html',
    'systems/demonlord/templates/chat/heal.html',
    'systems/demonlord/templates/chat/init.html',
    'systems/demonlord/templates/chat/makechallengeroll.html',
    'systems/demonlord/templates/chat/makeinitroll.html',
    'systems/demonlord/templates/chat/rest.html',
    'systems/demonlord/templates/chat/showtalent.html',
    'systems/demonlord/templates/chat/spell.html',
    'systems/demonlord/templates/chat/talent.html',
    'systems/demonlord/templates/chat/useitem.html',
    'systems/demonlord/templates/actor/actor-sheet.html',
    'systems/demonlord/templates/actor/actor-sheet2.html',
    'systems/demonlord/templates/actor/limited-sheet.html',
    'systems/demonlord/templates/actor/sidemenu.html',
    'systems/demonlord/templates/actor/limited-sidemenu.html',
    'systems/demonlord/templates/actor/header.html',
    'systems/demonlord/templates/actor/limited-header.html',
    'systems/demonlord/templates/actor/creature-sheet.html',
    'systems/demonlord/templates/dialogs/actor-modifiers-dialog.html',
    'systems/demonlord/templates/dialogs/choose-turn-dialog.html',
    'systems/demonlord/templates/dialogs/endofround-dialog.html'
  ]
  return loadTemplates(templatePaths)
}

Hooks.once('ready', async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createDemonlordMacro(data, slot))

  // Determine whether a system migration is required and feasible
  if (!game.user.isGM) return
  const currentVersion = game.settings.get(
    'demonlord',
    'systemMigrationVersion'
  )

  const NEEDS_MIGRATION_VERSION = '1.4.15'
  const COMPATIBLE_MIGRATION_VERSION = 0.8

  const needsMigration =
    currentVersion && isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion)
  if (!needsMigration && currentVersion != '') return

  // Perform the migration
  if (
    currentVersion &&
    isNewerVersion(COMPATIBLE_MIGRATION_VERSION, currentVersion)
  ) {
    const warning =
      'Your Demonlord system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.'
    ui.notifications.error(warning, { permanent: true })
  }

  migrations.migrateWorld()
})

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */
Hooks.once('setup', function () {
  // Localize CONFIG objects once up-front
  const toLocalize = ['attributes']
  for (const o of toLocalize) {
    CONFIG.DL[o] = Object.entries(CONFIG.DL[o]).reduce((obj, e) => {
      obj[e[0]] = game.i18n.localize(e[1])
      return obj
    }, {})
  }

  for (const [key, attribute] of Object.entries(CONFIG.DL.statusIcons)) {
    CONFIG.statusEffects.push({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      icon: attribute
    })
  }
})

/**
 * Set default values for new actors' tokens
 */
Hooks.on('preCreateActor', (createData) => {
  let disposition = CONST.TOKEN_DISPOSITIONS.NEUTRAL

  if (createData.type == 'creature') {
    disposition = CONST.TOKEN_DISPOSITIONS.HOSTILE
  }

  // Set wounds, advantage, and display name visibility
  mergeObject(createData, {
    'token.bar1': { attribute: 'characteristics.health' }, // Default Bar 1 to Health
    'token.bar2': { attribute: 'characteristics.insanity' }, // Default Bar 2 to Insanity
    'token.displayName': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER, // Default display name to be on owner hover
    'token.displayBars': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER, // Default display bars to be on owner hover
    'token.disposition': disposition, // Default disposition to neutral
    'token.name': createData.name // Set token name to actor name
  })

  // Default characters to HasVision = true and Link Data = true
  if (createData.type == 'character') {
    createData.token.vision = true
    createData.token.actorLink = true
  }
})

Hooks.on('updateActor', async (actor, updateData, options, userId) => {
  if (updateData.data && (game.user.isGM || actor.owner)) {
    if (game.combat) {
      for (const combatant of game.combat.combatants) {
        let init = 0

        if (combatant.actor == actor) {
          if (actor.data.type == 'character') {
            init = actor.data.data.fastturn ? 70 : 30
          } else {
            init = actor.data.data.fastturn ? 50 : 10
          }

          game.combat.setInitiative(combatant._id, init)
        }
      }
    }

    const actorData = actor.data
    const injured = CONFIG.DL.statusIcons.blood
    const asleep = CONFIG.DL.statusIcons.asleep
    const blinded = CONFIG.DL.statusIcons.blinded
    const charmed = CONFIG.DL.statusIcons.charmed
    const compelled = CONFIG.DL.statusIcons.compelled
    const dazed = CONFIG.DL.statusIcons.dazed
    const deafened = CONFIG.DL.statusIcons.deafened
    const defenseless = CONFIG.DL.statusIcons.defenseless
    const diseased = CONFIG.DL.statusIcons.diseased
    const fatigued = CONFIG.DL.statusIcons.fatigued
    const frightened = CONFIG.DL.statusIcons.frightened
    const horrified = CONFIG.DL.statusIcons.horrified
    const grabbed = CONFIG.DL.statusIcons.grabbed
    const immobilized = CONFIG.DL.statusIcons.immobilized
    const impaired = CONFIG.DL.statusIcons.impaired
    const poisoned = CONFIG.DL.statusIcons.poisoned
    const prone = CONFIG.DL.statusIcons.prone
    const slowed = CONFIG.DL.statusIcons.slowed
    const stunned = CONFIG.DL.statusIcons.stunned
    const surprised = CONFIG.DL.statusIcons.surprised
    const unconscious = CONFIG.DL.statusIcons.unconscious

    for (const t of actor.getActiveTokens()) {
      if (t.data.actorLink && t.scene.id === game.scenes.active.id) {
        toggleEffect(t, actorData.data.afflictions.injured, injured)
        toggleEffect(t, actorData.data.afflictions.asleep, asleep)
        toggleEffect(t, actorData.data.afflictions.blinded, blinded)
        toggleEffect(t, actorData.data.afflictions.charmed, charmed)
        toggleEffect(t, actorData.data.afflictions.compelled, compelled)
        toggleEffect(t, actorData.data.afflictions.dazed, dazed)
        toggleEffect(t, actorData.data.afflictions.deafened, deafened)
        toggleEffect(t, actorData.data.afflictions.defenseless, defenseless)
        toggleEffect(t, actorData.data.afflictions.diseased, diseased)
        toggleEffect(t, actorData.data.afflictions.fatigued, fatigued)
        toggleEffect(t, actorData.data.afflictions.frightened, frightened)
        toggleEffect(t, actorData.data.afflictions.horrified, horrified)
        toggleEffect(t, actorData.data.afflictions.grabbed, grabbed)
        toggleEffect(t, actorData.data.afflictions.immobilized, immobilized)
        toggleEffect(t, actorData.data.afflictions.impaired, impaired)
        toggleEffect(t, actorData.data.afflictions.poisoned, poisoned)
        toggleEffect(t, actorData.data.afflictions.prone, prone)
        toggleEffect(t, actorData.data.afflictions.slowed, slowed)
        toggleEffect(t, actorData.data.afflictions.stunned, stunned)
        toggleEffect(t, actorData.data.afflictions.surprised, surprised)
        toggleEffect(t, actorData.data.afflictions.unconscious, unconscious)
      }
    }
  }
})

// Hooks.on('preCreateToken', async (scene, createData, options, userId) => {
Hooks.on('createToken', async (scene, token) => {
  // When Status Effects exists on the Actor but the token is just created
  const actor = game.actors.get(token.actorId)
  if (!actor) return

  const actorData = actor.data
  const asleep = CONFIG.DL.statusIcons.asleep
  const blinded = CONFIG.DL.statusIcons.blinded
  const charmed = CONFIG.DL.statusIcons.charmed
  const compelled = CONFIG.DL.statusIcons.compelled
  const dazed = CONFIG.DL.statusIcons.dazed
  const deafened = CONFIG.DL.statusIcons.deafened
  const defenseless = CONFIG.DL.statusIcons.defenseless
  const diseased = CONFIG.DL.statusIcons.diseased
  const fatigued = CONFIG.DL.statusIcons.fatigued
  const frightened = CONFIG.DL.statusIcons.frightened
  const horrified = CONFIG.DL.statusIcons.horrified
  const grabbed = CONFIG.DL.statusIcons.grabbed
  const immobilized = CONFIG.DL.statusIcons.immobilized
  const impaired = CONFIG.DL.statusIcons.impaired
  const poisoned = CONFIG.DL.statusIcons.poisoned
  const prone = CONFIG.DL.statusIcons.prone
  const slowed = CONFIG.DL.statusIcons.slowed
  const stunned = CONFIG.DL.statusIcons.stunned
  const surprised = CONFIG.DL.statusIcons.surprised
  const unconscious = CONFIG.DL.statusIcons.unconscious
  const injured = CONFIG.DL.statusIcons.blood

  for (const t of actor.getActiveTokens()) {
    if (t.data.actorLink && t.scene.id === game.scenes.active.id) {
      toggleEffect(t, actorData.data.afflictions.injured, injured)
      toggleEffect(t, actorData.data.afflictions.asleep, asleep)
      toggleEffect(t, actorData.data.afflictions.blinded, blinded)
      toggleEffect(t, actorData.data.afflictions.charmed, charmed)
      toggleEffect(t, actorData.data.afflictions.compelled, compelled)
      toggleEffect(t, actorData.data.afflictions.dazed, dazed)
      toggleEffect(t, actorData.data.afflictions.deafened, deafened)
      toggleEffect(t, actorData.data.afflictions.defenseless, defenseless)
      toggleEffect(t, actorData.data.afflictions.diseased, diseased)
      toggleEffect(t, actorData.data.afflictions.fatigued, fatigued)
      toggleEffect(t, actorData.data.afflictions.frightened, frightened)
      toggleEffect(t, actorData.data.afflictions.horrified, horrified)
      toggleEffect(t, actorData.data.afflictions.grabbed, grabbed)
      toggleEffect(t, actorData.data.afflictions.immobilized, immobilized)
      toggleEffect(t, actorData.data.afflictions.impaired, impaired)
      toggleEffect(t, actorData.data.afflictions.poisoned, poisoned)
      toggleEffect(t, actorData.data.afflictions.prone, prone)
      toggleEffect(t, actorData.data.afflictions.slowed, slowed)
      toggleEffect(t, actorData.data.afflictions.stunned, stunned)
      toggleEffect(t, actorData.data.afflictions.surprised, surprised)
      toggleEffect(t, actorData.data.afflictions.unconscious, unconscious)
    }
  }
})

Hooks.on('preUpdateToken', async (scene, token, updateData, options) => {
  // When you add/remove a Status Effects directly on the token
  const asleep = CONFIG.DL.statusIcons.asleep
  const blinded = CONFIG.DL.statusIcons.blinded
  const charmed = CONFIG.DL.statusIcons.charmed
  const compelled = CONFIG.DL.statusIcons.compelled
  const dazed = CONFIG.DL.statusIcons.dazed
  const deafened = CONFIG.DL.statusIcons.deafened
  const defenseless = CONFIG.DL.statusIcons.defenseless
  const diseased = CONFIG.DL.statusIcons.diseased
  const fatigued = CONFIG.DL.statusIcons.fatigued
  const frightened = CONFIG.DL.statusIcons.frightened
  const horrified = CONFIG.DL.statusIcons.horrified
  const grabbed = CONFIG.DL.statusIcons.grabbed
  const immobilized = CONFIG.DL.statusIcons.immobilized
  const impaired = CONFIG.DL.statusIcons.impaired
  const poisoned = CONFIG.DL.statusIcons.poisoned
  const prone = CONFIG.DL.statusIcons.prone
  const slowed = CONFIG.DL.statusIcons.slowed
  const stunned = CONFIG.DL.statusIcons.stunned
  const surprised = CONFIG.DL.statusIcons.surprised
  const unconscious = CONFIG.DL.statusIcons.unconscious
  const injured = CONFIG.DL.statusIcons.blood

  if (updateData.effects) {
    if (token.actorLink) {
      const tokenActor = game.actors.get(token.actorId)

      await tokenActor.update({
        'data.afflictions': {
          asleep: tokenActor.effects.find((e) => e.data.icon === asleep),
          blinded: tokenActor.effects.find((e) => e.data.icon === blinded),
          charmed: tokenActor.effects.find((e) => e.data.icon === charmed),
          compelled: tokenActor.effects.find((e) => e.data.icon === compelled),
          dazed: tokenActor.effects.find((e) => e.data.icon === dazed),
          deafened: tokenActor.effects.find((e) => e.data.icon === deafened),
          defenseless: tokenActor.effects.find(
            (e) => e.data.icon === defenseless
          ),
          diseased: tokenActor.effects.find((e) => e.data.icon === diseased),
          fatigued: tokenActor.effects.find((e) => e.data.icon === fatigued),
          frightened: tokenActor.effects.find(
            (e) => e.data.icon === frightened
          ),
          horrified: tokenActor.effects.find((e) => e.data.icon === horrified),
          grabbed: tokenActor.effects.find((e) => e.data.icon === grabbed),
          immobilized: tokenActor.effects.find(
            (e) => e.data.icon === immobilized
          ),
          impaired: tokenActor.effects.find((e) => e.data.icon === impaired),
          poisoned: tokenActor.effects.find((e) => e.data.icon === poisoned),
          prone: tokenActor.effects.find((e) => e.data.icon === prone),
          slowed: tokenActor.effects.find((e) => e.data.icon === slowed),
          stunned: tokenActor.effects.find((e) => e.data.icon === stunned),
          surprised: tokenActor.effects.find((e) => e.data.icon === surprised),
          unconscious: tokenActor.effects.find(
            (e) => e.data.icon === unconscious
          )
        },
        'data.characteristics.health': {
          injured: tokenActor.effects.find((e) => e.data.icon === injured)
        }
      })
    }
  }
})

Hooks.on('renderChatLog', (app, html, data) =>
  DemonlordItem.chatListeners(html)
)

Hooks.on('renderChatMessage', async (app, html, msg) => {
  var actor = loadActorForChatMessage(msg.message.speaker)

  /*
    const regex = /(\d+)?d(\d+)([\+\-]\d+)?/ig;
    const text = html.find(".message-content")[0].innerHTML;
    const found = text.match(regex);
    console.log(found);
    var rrr = text.replace(found[1], "<a href=''>" + found[1] + "</a>");
    html.find(".message-content").replaceWith(rrr);
    */

  if (actor && actor.data?.type === 'character') {
    let path =
      actor.data.data.paths.master != '' ? actor.data.data.paths.master : ''
    path =
      actor.data.data.paths.expert != '' ? actor.data.data.paths.expert : ''
    path = actor.data.data.paths.novice

    if (game.settings.get('demonlord', 'usingChatPortraitModule')) {
      html.find('.showinfo').prepend(actor.data.data.ancestry + ', ' + path)
    } else {
      html.find('.showlessinfo').prepend(actor.data.data.ancestry + ', ' + path)
    }
  }

  if (!game.user.isGM) {
    html.find('.gmonly').remove()
    html.find('.gmonlyzero').remove()
  } else {
    html.find('.gmremove').remove()

    if (actor && actor.data?.type === 'creature') {
      let status =
        'Size ' +
        actor.data.data.characteristics.size +
        ' ' +
        actor.data.data.descriptor
      if (actor.data.data.frightening) {
        status += ', ' + game.i18n.localize('DL.CreatureFrightening')
      }
      if (actor.data.data.horrifying) {
        status += ', ' + game.i18n.localize('DL.CreatureHorrifying')
      }

      if (game.settings.get('demonlord', 'usingChatPortraitModule')) {
        html.find('.showinfo').prepend(status)
      } else html.find('.showlessinfo').prepend(status)
    }
  }
})

Hooks.once('diceSoNiceReady', (dice3d) => {
  dice3d.addSystem({ id: 'demonlord', name: 'Demonlord' }, true)
  dice3d.addDicePreset({
    type: 'd6',
    labels: ['1', '2', '3', '4', '5', 'systems/demonlord/ui/icons/logo.png'],
    system: 'demonlord'
  })
  dice3d.addDicePreset({
    type: 'd20',
    labels: [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      'systems/demonlord/ui/icons/logo.png'
    ],
    system: 'demonlord'
  })
  dice3d.addColorset({
    name: 'demonlord',
    description: 'Special',
    category: 'Demonlord',
    foreground: '#f2f2f2',
    background: '#6F0000',
    outline: '#651320',
    edge: '#020202',
    texture: 'marble',
    default: true
  })
})

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createDemonlordMacro (data, slot) {
  if (data.type !== 'Item') return
  if (!('data' in data)) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    )
  }
  const item = data.data
  // DL.WeaponName, WeaponBoonsBanes, WeaponDamageBonus

  // Create the macro command
  let command
  switch (item.type) {
    case 'weapon':
      command =
        '// ' +
        game.i18n.localize('DL.WeaponName') +
        ', ' +
        game.i18n.localize('DL.WeaponBoonsBanes') +
        ', ' +
        game.i18n.localize('DL.WeaponDamageBonus') +
        `\ngame.demonlord.rollWeaponMacro("${item.name}", "0", "");`
      break
    case 'talent':
      command = `// Active = [true/false/], blank = toggle true/false.\ngame.demonlord.rollTalentMacro("${item.name}", "true");`
      break
    case 'spell':
      command = `game.demonlord.rollSpellMacro("${item.name}");`
      break
    default:
      break
  }

  let macro = game.macros.entities.find(
    (m) => m.name === item.name && m.command === command
  )
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: {
        'demonlord.itemMacro': true
      }
    })
  }
  game.user.assignHotbarMacro(macro, slot)
  return false
}

/**
 * Roll Macro from a Weapon.
 * @param {string} itemName
 * @return {Promise}
 */
function rollWeaponMacro (itemName, boonsbanes, damagebonus) {
  const speaker = ChatMessage.getSpeaker()
  let actor
  if (speaker.token) actor = game.actors.tokens[speaker.token]
  if (!actor) actor = game.actors.get(speaker.actor)
  const item = actor ? actor.items.find((i) => i.name === itemName) : null
  if (!item) {
    return ui.notifications.warn(
      `Your controlled Actor does not have an item named ${itemName}`
    )
  }

  return actor.rollWeaponAttackMacro(item.id, boonsbanes, damagebonus)
}

/**
 * Roll Macro from a Talent.
 * @param {string} itemName
 * @return {Promise}
 */
function rollTalentMacro (itemName, state) {
  const speaker = ChatMessage.getSpeaker()
  let actor
  if (speaker.token) actor = game.actors.tokens[speaker.token]
  if (!actor) actor = game.actors.get(speaker.actor)
  const item = actor ? actor.items.find((i) => i.name === itemName) : null
  if (!item) {
    return ui.notifications.warn(
      `Your controlled Actor does not have an item named ${itemName}`
    )
  }

  switch (state) {
    case 'true':
      actor.rollTalent(item._id)
      break

    case 'false':
      item.data.data.uses.value = 0
      item.data.data.addtonextroll = false
      actor.updateEmbeddedEntity('OwnedItem', item.data)
      break

    case '':
      item.data.data.addtonextroll = !item.data.data.addtonextroll
      actor.updateEmbeddedEntity('OwnedItem', item.data)

      if (item.data.data.addtonextroll) actor.rollTalent(item._id)
      break

    default:
      actor.rollTalent(item.id)
      break
  }
}

/**
 * Roll Macro from a Spell.
 * @param {string} itemName
 * @return {Promise}
 */
function rollSpellMacro (itemName) {
  const speaker = ChatMessage.getSpeaker()
  let actor
  if (speaker.token) actor = game.actors.tokens[speaker.token]
  if (!actor) actor = game.actors.get(speaker.actor)
  const item = actor ? actor.items.find((i) => i.name === itemName) : null
  if (!item) {
    return ui.notifications.warn(
      `Your controlled Actor does not have an item named ${itemName}`
    )
  }

  return actor.rollSpell(item.id)
}

/**
 * Create a Macro from an Attribute.
 * @param {string} attributeName
 * @return {Promise}
 */
function rollAttributeMacro (attributeName) {
  var selected = canvas.tokens.controlled
  if (selected.length == 0) {
    ui.notifications.info(
      game.i18n.localize('DL.DialogWarningActorsNotSelected')
    )
  } else {
    const speaker = ChatMessage.getSpeaker()
    let actor
    if (speaker.token) actor = game.actors.tokens[speaker.token]
    if (!actor) actor = game.actors.get(speaker.actor)
    const attribute = actor ? actor.data.data.attributes[attributeName] : null

    return actor.rollChallenge(attribute)
  }
}

/**
 * Create a Macro from an Attribute.
 */
function rollInitMacro () {
  const speaker = ChatMessage.getSpeaker()
  let combatantFound = null
  let actor
  if (speaker.token) actor = game.actors.tokens[speaker.token]
  if (!actor) actor = game.actors.get(speaker.actor)

  for (const combatant of game.combat.combatants) {
    const init = 0

    if (combatant.actor == actor) {
      combatantFound = combatant
    }
  }

  if (combatantFound) game.combat.rollInitiative(combatantFound._id)
}

/**
 * Create a Macro for using a Healing Potion.
 */
function healingPotionMacro () {
  const speaker = ChatMessage.getSpeaker()
  let actor
  if (speaker.token) actor = game.actors.tokens[speaker.token]
  if (!actor) actor = game.actors.get(speaker.actor)

  if (actor) {
    const currentDamage = parseInt(actor.data.data.characteristics.health.value)
    const healingRate = parseInt(
      actor.data.data.characteristics.health.healingrate
    )

    let newdamage = currentDamage - healingRate
    if (newdamage < 0) newdamage = 0

    actor.update({
      'data.characteristics.health.value': newdamage
    })

    var templateData = {
      actor: this.actor,
      token: canvas.tokens.controlled[0]?.data,
      data: {
        itemname: {
          value: game.i18n.localize('DL.DialogUseItemHealingPotion')
        },
        description: {
          value: game.i18n
            .localize('DL.DialogUseItemHealingPotionText')
            .replace('#', healingRate)
        }
      }
    }

    const chatData = {
      user: game.user._id,
      speaker: {
        actor: actor._id,
        token: actor.token,
        alias: actor.name
      }
    }

    const template = 'systems/demonlord/templates/chat/useitem.html'
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content
      ChatMessage.create(chatData)
    })
  }
}

function loadActorForChatMessage (speaker) {
  var actor
  if (speaker.token) {
    actor = game.actors.tokens[speaker.token]
  }
  if (!actor) {
    actor = game.actors.get(speaker.actor)
  }
  if (!actor) {
    game.actors.forEach((value) => {
      if (value.name === speaker.alias) {
        actor = value
      }
    })
  }
  return actor
}

async function toggleEffect (token, affliction, tokenIcon) {
  const actorEffectFound = token.actor.effects.find(
    (e) => e.data.icon === tokenIcon
  )

  if ((affliction && !actorEffectFound) || (!affliction && actorEffectFound)) {
    const effect = CONFIG.statusEffects.find((e) => e.icon === tokenIcon)
    await token.toggleEffect(effect)
  }
}
