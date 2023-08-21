// Import Modules
import {DL} from './config.js'
import {DemonlordActor} from './actor/actor.js'
import {DemonlordItem} from './item/item.js'
import {ActionTemplate} from './pixi/action-template.js'
import {registerSettings} from './settings.js'
import {DLCombatTracker} from './combat/combat-tracker.js'
import {preloadHandlebarsTemplates} from './templates.js'
import * as migrations from './migration.js'
import {handleMigrations} from './migration.js'
import * as macros from './macros/item-macros.js'
import * as gmMacros from './macros/gm-macros.js'
import * as playerMacros from './macros/player-macros'
import {DLAfflictions} from './active-effects/afflictions'
import {DLActiveEffectConfig} from './active-effects/sheets/active-effect-config'
import DLCharacterSheet from './actor/sheets/character-sheet'
import DLCreatureSheet from './actor/sheets/creature-sheet'
import DLVehicleSheet from './actor/sheets/vehicle-sheet'
import DLBaseItemSheet from './item/sheets/base-item-sheet'
import DLAncestrySheet from './item/sheets/ancestry-sheet'
import DLPathSheet from './item/sheets/path-sheet'
import './playertrackercontrol'
import {initChatListeners} from './chat/chat-listeners'
import 'tippy.js/dist/tippy.css';
import {registerHandlebarsHelpers} from "./utils/handlebars-helpers";
import DLBaseActorSheet from "./actor/sheets/base-actor-sheet";
import {_onUpdateWorldTime, DLCombat} from "./combat/combat"; // optional for styling


Hooks.once('init', async function () {
  game.demonlord = {
    content: {
      DemonlordActor,
      DemonlordItem,
    },
    canvas: {
      ActionTemplate,
    },
    migrations: migrations,
    macros: {...macros, ...gmMacros, ...playerMacros},
    rollWeaponMacro: macros.rollWeaponMacro,
    rollTalentMacro: macros.rollTalentMacro,
    rollSpellMacro: macros.rollSpellMacro,
    rollAttributeMacro: macros.rollAttributeMacro,
    rollInitMacro: macros.rollInitMacro,
    healingPotionMacro: macros.healingPotionMacro,
  }

  CONFIG.MeasuredTemplate.defaults.angle = 53.13

  // Define custom Entity classes
  CONFIG.DL = DL
  CONFIG.Actor.documentClass = DemonlordActor
  CONFIG.Item.documentClass = DemonlordItem
  DocumentSheetConfig.registerSheet(ActiveEffect, "demonlord", DLActiveEffectConfig, {makeDefault: true})
  CONFIG.ui.combat = DLCombatTracker
  CONFIG.Combat.documentClass = DLCombat
  CONFIG.time.roundTime = 10
  // CONFIG.debug.hooks = true

  registerSettings()

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet)
  Actors.registerSheet('demonlord', DLCharacterSheet, {
    types: ['character'],
    makeDefault: true,
  })

  Actors.registerSheet('demonlord', DLCreatureSheet, {
    types: ['creature'],
    makeDefault: false,
  })

  Actors.registerSheet('demonlord', DLVehicleSheet, {
    types: ['vehicle'],
    makeDefault: false,
  })

  Items.unregisterSheet('core', ItemSheet)
  Items.registerSheet('demonlord', DLBaseItemSheet, {
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
      'profession',
      'language',
    ],
    makeDefault: true,
  })
  Items.registerSheet('demonlord', DLAncestrySheet, {
    types: ['ancestry'],
    makeDefault: true,
  })
  Items.registerSheet('demonlord', DLPathSheet, {
    types: ['path'],
    makeDefault: true,
  })

  preloadHandlebarsTemplates()
  registerHandlebarsHelpers()
})

Hooks.once('ready', async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => macros.createDemonlordMacro(data, slot))
  // Migration
  handleMigrations()
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

  const effects = DLAfflictions.buildAll()

  // Add the default status icons if the setting is not on
  if (!game.settings.get('demonlord', 'statusIcons')) {
    for (const effect of CONFIG.statusEffects) {
      effects.push({
        id: effect.id,
        name: effect.name,
        icon: effect.icon,
      })
    }
  }
  // Regardless of the setting, add the "invisible" status so that actors can turn invisible
  else {
    effects.push(CONFIG.statusEffects.find(e => e.id === 'invisible'))
  }


  CONFIG.statusEffects = effects

  // Set active effect keys-labels
  DLActiveEffectConfig.initializeChangeKeys()
})

/**
 * Set default values for new actors' tokens
 */
Hooks.on('createActor', async (actor, _options, _id) => {
  let disposition = CONST.TOKEN_DISPOSITIONS.NEUTRAL
  if (actor.type === 'creature') disposition = CONST.TOKEN_DISPOSITIONS.HOSTILE

  const tokenData = {
    name: actor.name,
    bar1: {attribute: 'characteristics.health'},
    displayName: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
    displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
    disposition: disposition,
  }

  if (actor.type == 'character') {
    tokenData.vision = true
    tokenData.actorLink = true
    // tokenData.dimSight = 5 // Give some squares of dim vision
  }
  await actor.update({token: tokenData})
})

Hooks.on('createToken', async _tokenDocument => {
  return 0
})

Hooks.on('updateActor', async (actor, updateData) => {
  // Update the combat initiative if the actor has changed its turn speed
  const isUpdateTurn = typeof updateData?.system?.fastturn !== 'undefined' && updateData?.system?.fastturn !== null
  if (!(isUpdateTurn && (game.user.isGM || actor.isOwner) && game.combat)) return
  const linkedCombatants = game.combat.combatants.filter(c => c.actorId === actor.id)
  for await (const c of linkedCombatants) {
    game.combat.setInitiative(c.id, game.combat.getInitiativeValue(c))
  }
})

export async function findAddEffect(actor, effectId, overlay) {
  if (!actor.effects.find(e => e.statuses?.has(effectId))) {
    const effect = CONFIG.statusEffects.find(e => e.id === effectId)
    effect.statuses = [effectId]
    if (overlay) {
      if (!effect.flags) {
        effect.flags = {
          core: {
            overlay: true
          }
        }
      } else if (!effect.flags.core) {
        effect.flags.core = {
          overlay: true
        }
      } else {
        effect.flags.core.overlay = true
      }
    }
    return await ActiveEffect.create(effect, {parent: actor})
  }
}

Hooks.on('createActiveEffect', async (activeEffect, _, userId) => {
  if (game.user.id !== userId) return
  const statuses = activeEffect.statuses
  const _parent = activeEffect?.parent
  if (statuses?.size > 0 && _parent) {
    for await (const statusId of statuses) {
      await _parent.setFlag('demonlord', statusId, true)
      
      // If asleep, also add prone and uncoscious
      if (statusId === 'asleep') {
        await findAddEffect(_parent, 'prone')
        await findAddEffect(_parent, 'unconscious')
      }
      // If incapacitated, add prone and disabled
      if (statusId === 'incapacitated') {
        await findAddEffect(_parent, 'prone')
        if (_parent.type === 'character') await findAddEffect(_parent, 'disabled')
      }
      // If disabled, add defenseless
      if (statusId === 'disabled') {
        await findAddEffect(_parent, 'defenseless')
      }
      // If dying, add unconscious
      if (statusId === 'dying') {
        await findAddEffect(_parent, 'unconscious')
      }
    }
  }
})

export async function findDeleteEffect(actor, effectId) {
  const effect = actor.effects.find(e => e.statuses?.has(effectId))
  return await effect?.delete()
}

Hooks.on('deleteActiveEffect', async (activeEffect, _, userId) => {
  if (game.user.id !== userId) return
  const statuses = activeEffect.statuses
  const _parent = activeEffect?.parent
  if (statuses?.size > 0 && _parent) {
    for await (const statusId of statuses) {
      await _parent.unsetFlag('demonlord', statusId)

      if (statusId === 'asleep') {
        await findDeleteEffect(_parent, 'prone')
        await findDeleteEffect(_parent, 'unconscious')
      }
      if (statusId === 'incapacitated') {
        await findDeleteEffect(_parent, 'prone')
        await findDeleteEffect(_parent, 'disabled')
      }
      if (statusId === 'disabled') {
        await findDeleteEffect(_parent, 'defenseless')
      }
      if (statusId === 'dying') {
        await findDeleteEffect(_parent, 'unconscious')
      }
    }
  }
})

Hooks.on("updateWorldTime", _onUpdateWorldTime)

Hooks.on('renderChatLog', (app, html, _data) => initChatListeners(html))

Hooks.on('renderChatMessage', async (app, html, _msg) => {
  if (!game.user.isGM) {
    html.find('.gmonly').remove()
    html.find('.gmonlyzero').remove()
  } else html.find('.gmremove').remove()
})

Hooks.once('diceSoNiceReady', dice3d => {
  dice3d.addSystem({id: 'demonlord', name: 'Demonlord'}, true)
  dice3d.addDicePreset({
    type: 'd6',
    labels: ['1', '2', '3', '4', '5', 'systems/demonlord/assets/ui/icons/logo.png'],
    system: 'demonlord',
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
      'systems/demonlord/assets/ui/icons/logo.png',
    ],
    system: 'demonlord',
  })
  dice3d.addColorset({
    name: 'demonlord',
    description: 'Special',
    category: 'Demonlord',
    foreground: '#d0d0d0',
    background: '#651510',
    outline: '#651510',
    texture: 'marble',
    material: 'metal',
    font: 'Luminari',
    default: true,
  })
})

Hooks.once('dragRuler.ready', SpeedProvider => {
  class DemonLordSpeedProvider extends SpeedProvider {
    get colors() {
      return [
        {id: 'walk', default: 0x00ff00, name: 'demonlord.speeds.walk'},
        {id: 'rush', default: 0xffff00, name: 'demonlord.speeds.rush'},
      ]
    }

    getSpeedModifier(token) {
      const itemsHeavy = token.actor.items.filter(
        item => Number(item.system.requirement.minvalue) > token.actor.getAttribute(item.system.requirement.attribute).value,
      )
      if (itemsHeavy.length > 0) {
        return -2
      }
      return 0
    }

    getRanges(token) {
      const baseSpeed = token.actor.system.characteristics.speed + this.getSpeedModifier(token)
      const ranges = [
        {range: baseSpeed, color: 'walk'},
        {range: baseSpeed * 2, color: 'rush'},
      ]
      return ranges
    }
  }

  // eslint-disable-next-line no-undef
  dragRuler.registerSystem('demonlord', DemonLordSpeedProvider)
})

// eslint-disable-next-line no-unused-vars
function loadActorForChatMessage(speaker) {
  var actor
  if (speaker.token) {
    actor = game.actors.tokens[speaker.token]
  }
  if (!actor) {
    actor = game.actors.get(speaker.actor)
  }
  if (!actor) {
    game.actors.forEach(value => {
      if (value.name === speaker.alias) {
        actor = value
      }
    })
  }
  return actor
}

Hooks.on('DL.UseTalent', data => {
  Hooks.call('DL.Action', {type: 'use-talent', ...data})
})
Hooks.on('DL.UseSpell', data => {
  Hooks.call('DL.Action', {type: 'use-spell', ...data})
})
Hooks.on('DL.RollAttack', data => {
  Hooks.call('DL.Action', {type: 'roll-attack', ...data})
})
Hooks.on('DL.RollDamage', data => {
  Hooks.call('DL.Action', {type: 'roll-damage', ...data})
})
Hooks.on('DL.ApplyDamage', data => {
  Hooks.call('DL.Action', {type: 'apply-damage', ...data})
})
Hooks.on('DL.ApplyHealing', data => {
  Hooks.call('DL.Action', {type: 'apply-healing', ...data})
})

Hooks.on('DL.Action', async () => {
  if (!game.settings.get('demonlord', 'templateAutoRemove')) return
  const actionTemplates = canvas.scene.templates.filter(a => a.flags.actionTemplate).map(a => a.id)
  if (actionTemplates.length > 0) await canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', actionTemplates)
})

Hooks.on('renderDLBaseItemSheet', (app, html, data) => DLBaseItemSheet.onRenderInner(app, html, data))
Hooks.on('renderDLBaseActorSheet', (app, html, data) => DLBaseActorSheet.onRenderInner(app, html, data))
