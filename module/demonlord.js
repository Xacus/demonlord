// Import Modules
import { DL } from './config.js'
import { DemonlordActor } from './actor/actor.js'
import { DemonlordActorSheet } from './actor/actor-sheet.js'
import { DemonlordActorSheet2 } from './actor/actor-sheet2.js'
import { DemonlordCreatureSheet } from './actor/creature-sheet.js'
import { DemonlordNewCreatureSheet } from './actor/new-creature-sheet.js'
import { DemonlordItem } from './item/item.js'
import { DemonlordItemSheetDefault } from './item/item-sheet2.js'
import { DemonlordPathSetup } from './item/path-setup.js'
import { ActionTemplate } from "./item/action-template.js"
import { registerSettings } from './settings.js'
import {
  rollInitiative,
  startCombat,
  nextTurn,
  setupTurns
} from './init/init.js'
import combattracker from './combattracker.js'
import { CharacterBuff } from './buff.js'
import { preloadHandlebarsTemplates } from './templates.js'
import * as migrations from './migration.js'
import * as macros from './macros.js'
import * as playertracker from './playertrackercontrol.js'

Hooks.once('init', async function () {
  game.demonlord = {
    entities: {
      DemonlordActor,
      DemonlordItem
    },
    canvas: {
      ActionTemplate
    },
    migrations: migrations,
    macros: macros,
    rollWeaponMacro: macros.rollWeaponMacro,
    rollTalentMacro: macros.rollTalentMacro,
    rollSpellMacro: macros.rollSpellMacro,
    rollAttributeMacro: macros.rollAttributeMacro,
    rollInitMacro: macros.rollInitMacro,
    healingPotionMacro: macros.healingPotionMacro
  }

  CONFIG.MeasuredTemplate.defaults.angle = 53.13;

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
  CONFIG.time.roundTime = 10
  // CONFIG.debug.hooks = true

  registerSettings()

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet)
  Actors.registerSheet('demonlord', DemonlordActorSheet2, {
    types: ['character'],
    makeDefault: true
  })

  Actors.registerSheet('demonlord', DemonlordNewCreatureSheet, {
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
      'profession',
      'language'
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

Hooks.once('ready', async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) =>
    macros.createDemonlordMacro(data, slot)
  )

  // Determine whether a system migration is required and feasible
  if (!game.user.isGM) return
  const currentVersion = game.settings.get(
    'demonlord',
    'systemMigrationVersion'
  )

  const NEEDS_MIGRATION_VERSION = '1.7.10'
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

  // Status Effects Icons
  const effects = []
  for (const [key, attribute] of Object.entries(CONFIG.DL.statusIcons)) {
    effects.push({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      icon: attribute
    })
  }
  if (!game.settings.get('demonlord', 'statusIcons')) {
    for (const effect of CONFIG.statusEffects) {
      effects.push({
        id: effect.id,
        label: effect.label,
        icon: effect.icon
      })
    }
  }

  CONFIG.statusEffects = effects
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
    const injured = CONFIG.DL.statusIcons.injured

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

    const concentrate = CONFIG.DL.statusIcons.concentrate
    const defend = CONFIG.DL.statusIcons.defend
    const help = CONFIG.DL.statusIcons.help
    const prepare = CONFIG.DL.statusIcons.prepare
    const reload = CONFIG.DL.statusIcons.reload
    const retreat = CONFIG.DL.statusIcons.retreat
    const rush = CONFIG.DL.statusIcons.rush
    const stabilize = CONFIG.DL.statusIcons.stabilize

    for (const t of actor.getActiveTokens()) {
      if (t.scene.id === game.scenes.active.id) {
        toggleEffect(t, actorData.data.characteristics.health.injured, injured)

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

        toggleEffect(t, actorData.data.actions.concentrate, concentrate)
        toggleEffect(t, actorData.data.actions.defend, defend)
        toggleEffect(t, actorData.data.actions.help, help)
        toggleEffect(t, actorData.data.actions.prepare, prepare)
        toggleEffect(t, actorData.data.actions.reload, reload)
        toggleEffect(t, actorData.data.actions.retreat, retreat)
        toggleEffect(t, actorData.data.actions.rush, rush)
        toggleEffect(t, actorData.data.actions.stabilize, stabilize)
      }
    }
  }
})

Hooks.on('createActiveEffect', async (actor, effect) => {
  // When you add a Status Effects directly on the token
  if (effect) {
    switch (effect.label) {
      case 'Injured':
        await actor.update({
          'data.characteristics.health.injured': true
        })
        break
      case 'Asleep':
        await actor.update({
          'data.afflictions.asleep': true,
          'data.afflictions.prone': true,
          'data.afflictions.unconscious': true
        })
        break
      case 'Blinded':
        await actor.update({
          'data.afflictions.blinded': true
        })
        break
      case 'Charmed':
        await actor.update({
          'data.afflictions.charmed': true
        })
        break
      case 'Compelled':
        await actor.update({
          'data.afflictions.compelled': true
        })
        break
      case 'Dazed':
        await actor.update({
          'data.afflictions.dazed': true
        })
        break
      case 'Deafened':
        await actor.update({
          'data.afflictions.deafened': true
        })
        break
      case 'Defenseless':
        await actor.update({
          'data.afflictions.defenseless': true
        })
        break
      case 'Diseased':
        await actor.update({
          'data.afflictions.diseased': true
        })
        break
      case 'Fatigued':
        await actor.update({
          'data.afflictions.fatigued': true
        })
        break
      case 'Frightened':
        await actor.update({
          'data.afflictions.frightened': true
        })
        break
      case 'Horrified':
        await actor.update({
          'data.afflictions.horrified': true
        })
        break
      case 'Grabbed':
        await actor.update({
          'data.afflictions.grabbed': true
        })
        break
      case 'Immobilized':
        await actor.update({
          'data.afflictions.immobilized': true
        })
        break
      case 'Impaired':
        await actor.update({
          'data.afflictions.impaired': true
        })
        break
      case 'Poisoned':
        await actor.update({
          'data.afflictions.poisoned': true
        })
        break
      case 'Prone':
        await actor.update({
          'data.afflictions.prone': true
        })
        break
      case 'Slowed':
        await actor.update({
          'data.afflictions.slowed': true
        })
        break
      case 'Stunned':
        await actor.update({
          'data.afflictions.stunned': true
        })
        break
      case 'Surprised':
        await actor.update({
          'data.afflictions.surprised': true
        })
        break
      case 'Unconscious':
        await actor.update({
          'data.afflictions.unconscious': true
        })
        break
      case 'Concentrate':
        await actor.update({
          'data.actions.concentrate': true
        })
        break
      case 'Defend':
        await actor.update({
          'data.actions.defend': true
        })
        break
      case 'Help':
        await actor.update({
          'data.actions.help': true
        })
        break
      case 'Prepare':
        await actor.update({
          'data.actions.prepare': true
        })
        break
      case 'Reload':
        await actor.update({
          'data.actions.reload': true
        })
        break
      case 'Retreat':
        await actor.update({
          'data.actions.retreat': true
        })
        break
      case 'Rush':
        await actor.update({
          'data.actions.rush': true
        })
        break
      case 'Stabilize':
        await actor.update({
          'data.actions.stabilize': true
        })
        break
      default:
        break
    }
  }
})

Hooks.on('deleteActiveEffect', async (actor, effect) => {
  // When you add a Status Effects directly on the token
  if (effect) {
    switch (effect.label) {
      case 'Injured':
        await actor.update({
          'data.characteristics.health.injured': false
        })
        break
      case 'Asleep':
        await actor.update({
          'data.afflictions.asleep': false,
          'data.afflictions.prone': false,
          'data.afflictions.unconscious': false
        })
        break
      case 'Blinded':
        await actor.update({
          'data.afflictions.blinded': false
        })
        break
      case 'Charmed':
        await actor.update({
          'data.afflictions.charmed': false
        })
        break
      case 'Compelled':
        await actor.update({
          'data.afflictions.compelled': false
        })
        break
      case 'Dazed':
        await actor.update({
          'data.afflictions.dazed': false
        })
        break
      case 'Deafened':
        await actor.update({
          'data.afflictions.deafened': false
        })
        break
      case 'Defenseless':
        await actor.update({
          'data.afflictions.defenseless': false
        })
        break
      case 'Diseased':
        await actor.update({
          'data.afflictions.diseased': false
        })
        break
      case 'Fatigued':
        await actor.update({
          'data.afflictions.fatigued': false
        })
        break
      case 'Frightened':
        await actor.update({
          'data.afflictions.frightened': false
        })
        break
      case 'Horrified':
        await actor.update({
          'data.afflictions.horrified': false
        })
        break
      case 'Grabbed':
        await actor.update({
          'data.afflictions.grabbed': false
        })
        break
      case 'Immobilized':
        await actor.update({
          'data.afflictions.immobilized': false
        })
        break
      case 'Impaired':
        await actor.update({
          'data.afflictions.impaired': false
        })
        break
      case 'Poisoned':
        await actor.update({
          'data.afflictions.poisoned': false
        })
        break
      case 'Prone':
        await actor.update({
          'data.afflictions.prone': false
        })
        break
      case 'Slowed':
        await actor.update({
          'data.afflictions.slowed': false
        })
        break
      case 'Stunned':
        await actor.update({
          'data.afflictions.stunned': false
        })
        break
      case 'Surprised':
        await actor.update({
          'data.afflictions.surprised': false
        })
        break
      case 'Unconscious':
        await actor.update({
          'data.afflictions.unconscious': false
        })
        break
      case 'Concentrate':
        await actor.update({
          'data.actions.concentrate': false
        })
        break
      case 'Defend':
        await actor.update({
          'data.actions.defend': false
        })
        break
      case 'Help':
        await actor.update({
          'data.actions.help': false
        })
        break
      case 'Prepare':
        await actor.update({
          'data.actions.prepare': false
        })
        break
      case 'Reload':
        await actor.update({
          'data.actions.reload': false
        })
        break
      case 'Retreat':
        await actor.update({
          'data.actions.retreat': false
        })
        break
      case 'Rush':
        await actor.update({
          'data.actions.rush': false
        })
        break
      case 'Stabilize':
        await actor.update({
          'data.actions.stabilize': false
        })
        break
      default:
        break
    }
  }
})

Hooks.on('createToken', async (scene, token) => {
  // When Status Effects exists on the Actor but the token is just created
  const actor = game.actors.get(token.actorId)
  if (!actor) return

  const actorData = actor.data
  const injured = CONFIG.DL.statusIcons.injured

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

  const concentrate = CONFIG.DL.statusIcons.concentrate
  const defend = CONFIG.DL.statusIcons.defend
  const help = CONFIG.DL.statusIcons.help
  const prepare = CONFIG.DL.statusIcons.prepare
  const reload = CONFIG.DL.statusIcons.reload
  const retreat = CONFIG.DL.statusIcons.retreat
  const rush = CONFIG.DL.statusIcons.rush
  const stabilize = CONFIG.DL.statusIcons.stabilize

  for (const t of actor.getActiveTokens()) {
    if (t.scene.id === game.scenes.active.id) {
      toggleEffect(t, actorData.data.characteristics.health.injured, injured)

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

      toggleEffect(t, actorData.data.actions.concentrate, concentrate)
      toggleEffect(t, actorData.data.actions.defend, defend)
      toggleEffect(t, actorData.data.actions.help, help)
      toggleEffect(t, actorData.data.actions.prepare, prepare)
      toggleEffect(t, actorData.data.actions.reload, reload)
      toggleEffect(t, actorData.data.actions.retreat, retreat)
      toggleEffect(t, actorData.data.actions.rush, rush)
      toggleEffect(t, actorData.data.actions.stabilize, stabilize)
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

    html.find('.showlessinfo').prepend(actor.data.data.ancestry + ', ' + path)
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

      html.find('.showlessinfo').prepend(status)
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

Hooks.once('dragRuler.ready', (SpeedProvider) => {
  class DemonLordSpeedProvider extends SpeedProvider {
    get colors () {
      return [
        { id: 'walk', default: 0x00ff00, name: 'demonlord.speeds.walk' },
        { id: 'rush', default: 0xffff00, name: 'demonlord.speeds.rush' }
      ]
    }

    getRanges (token) {
      const baseSpeed = token.actor.data.data.characteristics.speed
      const ranges = [
        { range: baseSpeed, color: 'walk' },
        { range: baseSpeed * 2, color: 'rush' }
      ]
      return ranges
    }
  }

  dragRuler.registerSystem('demonlord', DemonLordSpeedProvider)
})
