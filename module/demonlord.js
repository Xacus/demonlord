// Import Modules
import { DL } from './config.js'
import { DemonlordActor } from './actor/actor.js'
import { DemonlordActorSheet } from './actor/actor-sheet.js'
import { DemonlordActorSheet2 } from './actor/actor-sheet2.js'
import { DemonlordCreatureSheet } from './actor/creature-sheet.js'
import { DemonlordItem } from './item/item.js'
import { DemonlordItemSheetDefault } from './item/item-sheet2.js'
import { DemonlordPathSetup } from './item/path-setup.js'
import { DemonlordPathPlayerView } from './item/path-playersheet.js'
import { registerSettings } from './settings.js'
import {
  rollInitiative,
  startCombat,
  nextTurn,
  setupTurns
} from './init/init.js'
import combattracker from './combattracker.js'
import { CharacterBuff } from './buff.js'

Hooks.once('init', async function () {
  game.demonlord = {
    DemonlordActor,
    DemonlordItem,
    rollWeaponMacro,
    rollTalentMacro,
    rollSpellMacro,
    rollAttributeMacro,
    rollInitMacro,
    healingPotionMacro
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
      'magic',
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
  Items.registerSheet('demonlord', DemonlordPathPlayerView, {
    types: ['path'],
    makeDefault: false
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
        if (
          actorData.data.characteristics.health.injured &&
          !t.data.effects.includes(injured)
        ) {
          await t.toggleEffect(injured)
        } else if (
          !actorData.data.characteristics.health.injured &&
          t.data.effects.includes(injured)
        ) {
          await t.toggleEffect(injured)
        }
        if (
          actorData.data.afflictions.asleep &&
          !t.data.effects.includes(asleep)
        ) {
          await t.toggleEffect(asleep)
        } else if (
          !actorData.data.afflictions.asleep &&
          t.data.effects.includes(asleep)
        ) {
          await t.toggleEffect(asleep)
        }
        if (
          actorData.data.afflictions.blinded &&
          !t.data.effects.includes(blinded)
        ) {
          await t.toggleEffect(blinded)
        } else if (
          !actorData.data.afflictions.blinded &&
          t.data.effects.includes(blinded)
        ) {
          await t.toggleEffect(blinded)
        }
        if (
          actorData.data.afflictions.charmed &&
          !t.data.effects.includes(charmed)
        ) {
          await t.toggleEffect(charmed)
        } else if (
          !actorData.data.afflictions.charmed &&
          t.data.effects.includes(charmed)
        ) {
          await t.toggleEffect(charmed)
        }
        if (
          actorData.data.afflictions.compelled &&
          !t.data.effects.includes(compelled)
        ) {
          await t.toggleEffect(compelled)
        } else if (
          !actorData.data.afflictions.compelled &&
          t.data.effects.includes(compelled)
        ) {
          await t.toggleEffect(compelled)
        }
        if (
          actorData.data.afflictions.dazed &&
          !t.data.effects.includes(dazed)
        ) {
          await t.toggleEffect(dazed)
        } else if (
          !actorData.data.afflictions.dazed &&
          t.data.effects.includes(dazed)
        ) {
          await t.toggleEffect(dazed)
        }
        if (
          actorData.data.afflictions.deafened &&
          !t.data.effects.includes(deafened)
        ) {
          await t.toggleEffect(deafened)
        } else if (
          !actorData.data.afflictions.deafened &&
          t.data.effects.includes(deafened)
        ) {
          await t.toggleEffect(deafened)
        }
        if (
          actorData.data.afflictions.defenseless &&
          !t.data.effects.includes(defenseless)
        ) {
          await t.toggleEffect(defenseless)
        } else if (
          !actorData.data.afflictions.defenseless &&
          t.data.effects.includes(defenseless)
        ) {
          await t.toggleEffect(defenseless)
        }
        if (
          actorData.data.afflictions.diseased &&
          !t.data.effects.includes(diseased)
        ) {
          await t.toggleEffect(diseased)
        } else if (
          !actorData.data.afflictions.diseased &&
          t.data.effects.includes(diseased)
        ) {
          await t.toggleEffect(diseased)
        }
        if (
          actorData.data.afflictions.fatigued &&
          !t.data.effects.includes(fatigued)
        ) {
          await t.toggleEffect(fatigued)
        } else if (
          !actorData.data.afflictions.fatigued &&
          t.data.effects.includes(fatigued)
        ) {
          await t.toggleEffect(fatigued)
        }
        if (
          actorData.data.afflictions.frightened &&
          !t.data.effects.includes(frightened)
        ) {
          await t.toggleEffect(frightened)
        } else if (
          !actorData.data.afflictions.frightened &&
          t.data.effects.includes(frightened)
        ) {
          await t.toggleEffect(frightened)
        }
        if (
          actorData.data.afflictions.horrified &&
          !t.data.effects.includes(horrified)
        ) {
          await t.toggleEffect(horrified)
        } else if (
          !actorData.data.afflictions.horrified &&
          t.data.effects.includes(horrified)
        ) {
          await t.toggleEffect(horrified)
        }
        if (
          actorData.data.afflictions.grabbed &&
          !t.data.effects.includes(grabbed)
        ) {
          await t.toggleEffect(grabbed)
        } else if (
          !actorData.data.afflictions.grabbed &&
          t.data.effects.includes(grabbed)
        ) {
          await t.toggleEffect(grabbed)
        }
        if (
          actorData.data.afflictions.immobilized &&
          !t.data.effects.includes(immobilized)
        ) {
          await t.toggleEffect(immobilized)
        } else if (
          !actorData.data.afflictions.immobilized &&
          t.data.effects.includes(immobilized)
        ) {
          await t.toggleEffect(immobilized)
        }
        if (
          actorData.data.afflictions.impaired &&
          !t.data.effects.includes(impaired)
        ) {
          await t.toggleEffect(impaired)
        } else if (
          !actorData.data.afflictions.impaired &&
          t.data.effects.includes(impaired)
        ) {
          await t.toggleEffect(impaired)
        }
        if (
          actorData.data.afflictions.poisoned &&
          !t.data.effects.includes(poisoned)
        ) {
          await t.toggleEffect(poisoned)
        } else if (
          !actorData.data.afflictions.poisoned &&
          t.data.effects.includes(poisoned)
        ) {
          await t.toggleEffect(poisoned)
        }
        if (
          actorData.data.afflictions.prone &&
          !t.data.effects.includes(prone)
        ) {
          await t.toggleEffect(prone)
        } else if (
          !actorData.data.afflictions.prone &&
          t.data.effects.includes(prone)
        ) {
          await t.toggleEffect(prone)
        }
        if (
          actorData.data.afflictions.slowed &&
          !t.data.effects.includes(slowed)
        ) {
          await t.toggleEffect(slowed)
        } else if (
          !actorData.data.afflictions.slowed &&
          t.data.effects.includes(slowed)
        ) {
          await t.toggleEffect(slowed)
        }
        if (
          actorData.data.afflictions.stunned &&
          !t.data.effects.includes(stunned)
        ) {
          await t.toggleEffect(stunned)
        } else if (
          !actorData.data.afflictions.stunned &&
          t.data.effects.includes(stunned)
        ) {
          await t.toggleEffect(stunned)
        }
        if (
          actorData.data.afflictions.surprised &&
          !t.data.effects.includes(surprised)
        ) {
          await t.toggleEffect(surprised)
        } else if (
          !actorData.data.afflictions.surprised &&
          t.data.effects.includes(surprised)
        ) {
          await t.toggleEffect(surprised)
        }
        if (
          actorData.data.afflictions.unconscious &&
          !t.data.effects.includes(unconscious)
        ) {
          await t.toggleEffect(unconscious)
        } else if (
          !actorData.data.afflictions.unconscious &&
          t.data.effects.includes(unconscious)
        ) {
          await t.toggleEffect(unconscious)
        }
      }
    }
  }
})

Hooks.on('preCreateToken', async (scene, createData, options, userId) => {
  // return if the token has no linked actor
  if (!createData.actorLink) return
  const actor = game.actors.get(createData.actorId)
  // return if this token has no actor
  if (!actor) return

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

  const actorData = actor.data
  const createEffects = []
  if (actorData.data.characteristics.health.injured) createEffects.push(injured)
  if (actorData.data.afflictions.asleep) createEffects.push(asleep)
  if (actorData.data.afflictions.blinded) createEffects.push(blinded)
  if (actorData.data.afflictions.charmed) createEffects.push(charmed)
  if (actorData.data.afflictions.compelled) createEffects.push(compelled)
  if (actorData.data.afflictions.dazed) createEffects.push(dazed)
  if (actorData.data.afflictions.deafened) createEffects.push(deafened)
  if (actorData.data.afflictions.defenseless) createEffects.push(defenseless)
  if (actorData.data.afflictions.diseased) createEffects.push(diseased)
  if (actorData.data.afflictions.fatigued) createEffects.push(fatigued)
  if (actorData.data.afflictions.frightened) createEffects.push(frightened)
  if (actorData.data.afflictions.horrified) createEffects.push(horrified)
  if (actorData.data.afflictions.grabbed) createEffects.push(grabbed)
  if (actorData.data.afflictions.immobilized) createEffects.push(immobilized)
  if (actorData.data.afflictions.impaired) createEffects.push(impaired)
  if (actorData.data.afflictions.poisoned) createEffects.push(poisoned)
  if (actorData.data.afflictions.prone) createEffects.push(prone)
  if (actorData.data.afflictions.slowed) createEffects.push(slowed)
  if (actorData.data.afflictions.stunned) createEffects.push(stunned)
  if (actorData.data.afflictions.surprised) createEffects.push(surprised)
  if (actorData.data.afflictions.unconscious) createEffects.push(unconscious)
  createData.effects = createEffects
})

Hooks.on('preUpdateToken', async (scene, token, updateData, options) => {
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
      // linked token
      const tokenActor = game.actors.get(token.actorId)
      await tokenActor.update({
        'data.afflictions': {
          asleep: updateData.effects.includes(asleep),
          blinded: updateData.effects.includes(blinded),
          charmed: updateData.effects.includes(charmed),
          compelled: updateData.effects.includes(compelled),
          dazed: updateData.effects.includes(dazed),
          deafened: updateData.effects.includes(deafened),
          defenseless: updateData.effects.includes(defenseless),
          diseased: updateData.effects.includes(diseased),
          fatigued: updateData.effects.includes(fatigued),
          frightened: updateData.effects.includes(frightened),
          horrified: updateData.effects.includes(horrified),
          grabbed: updateData.effects.includes(grabbed),
          immobilized: updateData.effects.includes(immobilized),
          impaired: updateData.effects.includes(impaired),
          poisoned: updateData.effects.includes(poisoned),
          prone: updateData.effects.includes(prone),
          slowed: updateData.effects.includes(slowed),
          stunned: updateData.effects.includes(stunned),
          surprised: updateData.effects.includes(surprised),
          unconscious: updateData.effects.includes(unconscious)
        },
        'data.characteristics.health': {
          injured: updateData.effects.includes(injured)
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
