// Import Modules
import {DL} from './config.js'
import {DemonlordActor} from './actor/actor.js'
import {DemonlordToken} from './actor/token.js'
import {DemonlordItem} from './item/item.js'
import {ActionTemplate} from './pixi/action-template.js'
import {registerSettings} from './settings.js'
import {registerVisionModes} from './vision.js'
import KeyState from './utils/key-state.js'
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
import DLCharacterSheetV2 from './actor/sheets/character-sheet-v2.js'
import DLCreatureSheet from './actor/sheets/creature-sheet'
import DLVehicleSheet from './actor/sheets/vehicle-sheet'
import DLBaseItemSheet from './item/sheets/base-item-sheet.js'

import CharacterDataModel from './data/actor/CharacterDataModel.js'
import CreatureDataModel from './data/actor/CreatureDataModel.js'
import VehicleDataModel from './data/actor/VehicleDataModel.js'
import AmmoDataModel from './data/item/AmmoDataModel.js'
import AncestryDataModel from './data/item/AncestryDataModel.js'
import ArmorDataModel from './data/item/ArmorDataModel.js'
import CreatureRoleDataModel from './data/item/CreatureRoleDataModel.js'
import EndOfTheRoundDataModel from './data/item/EndOfTheRoundDataModel.js'
import FeatureDataModel from './data/item/FeatureDataModel.js'
import ItemDataModel from './data/item/ItemDataModel.js'
import LanguageDataModel from './data/item/LanguageDataModel.js'
import PathDataModel from './data/item/PathDataModel.js'
import ProfessionDataModel from './data/item/ProfessionDataModel.js'
import RelicDataModel from './data/item/RelicDataModel.js'
import SpecialActionDataModel from './data/item/SpecialActionDataModel.js'
import SpellDataModel from './data/item/SpellDataModel.js'
import TalentDataModel from './data/item/TalentDataModel.js'
import WeaponDataModel from './data/item/WeaponDataModel.js'
import './playertrackercontrol'
import {initChatListeners} from './chat/chat-listeners'
import 'tippy.js/dist/tippy.css';
import {registerHandlebarsHelpers} from "./utils/handlebars-helpers";
import DLBaseActorSheet from "./actor/sheets/base-actor-sheet";
import {_onUpdateWorldTime, DLCombat} from "./combat/combat"; // optional for styling
import { activateSocketListener } from "./utils/socket.js";

const { Actors, Items } = foundry.documents.collections //eslint-disable-line no-shadow
const { ActorSheet, ItemSheet } = foundry.appv1.sheets //eslint-disable-line no-shadow


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
  CONFIG.Token.objectClass = DemonlordToken
  CONFIG.Item.documentClass = DemonlordItem
  foundry.applications.apps.DocumentSheetConfig.registerSheet(ActiveEffect, "demonlord", DLActiveEffectConfig, {makeDefault: true})
  CONFIG.ui.combat = DLCombatTracker
  CONFIG.Combat.documentClass = DLCombat
  CONFIG.time.roundTime = 10
  // CONFIG.debug.hooks = true
  
  // Move to new ActiveEffect transferral
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register data models
  CONFIG.Actor.dataModels.character = CharacterDataModel
  CONFIG.Actor.dataModels.creature = CreatureDataModel
  CONFIG.Actor.dataModels.vehicle = VehicleDataModel
  CONFIG.Item.dataModels.ammo = AmmoDataModel
  CONFIG.Item.dataModels.ancestry = AncestryDataModel
  CONFIG.Item.dataModels.armor = ArmorDataModel
  CONFIG.Item.dataModels.creaturerole = CreatureRoleDataModel
  CONFIG.Item.dataModels.endoftheround = EndOfTheRoundDataModel
  CONFIG.Item.dataModels.feature = FeatureDataModel
  CONFIG.Item.dataModels.item = ItemDataModel
  CONFIG.Item.dataModels.language = LanguageDataModel
  CONFIG.Item.dataModels.path = PathDataModel
  CONFIG.Item.dataModels.profession = ProfessionDataModel
  CONFIG.Item.dataModels.relic = RelicDataModel
  CONFIG.Item.dataModels.specialaction = SpecialActionDataModel
  CONFIG.Item.dataModels.spell = SpellDataModel
  CONFIG.Item.dataModels.talent = TalentDataModel
  CONFIG.Item.dataModels.weapon = WeaponDataModel

  // Vision modes
  registerVisionModes()

  registerSettings()

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet)
  Actors.registerSheet('demonlord', DLCharacterSheet, {
    types: ['character'],
    makeDefault: true,
  })

  Actors.registerSheet('demonlord', DLCharacterSheetV2, {
    types: ['character'],
    makeDefault: false,
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
      'ancestry',
      'ammo',
      'armor',
      'creaturerole',
      'endoftheround',
      'feature',
      'item',
      'language',
      'path',
      'profession',
      'relic',
      'specialaction',
      'spell',
      'talent',
      'weapon'
    ],
    makeDefault: true
  })

  preloadHandlebarsTemplates()
  registerHandlebarsHelpers()

  // Support Babele translations
  if (typeof Babele !== 'undefined') {
    Babele.get().setSystemTranslationsDir('packs/translations')
  }
  activateSocketListener()
})

Hooks.once('ready', async function () {
  // If the turn marker is not set, use ours as a themed fallback
  const combatConfig = game.settings.get('core', 'combatTrackerConfig')
  if (!combatConfig.turnMarker.src) {
    combatConfig.turnMarker.src = 'systems/demonlord/assets/ui/turn-marker.png'
    combatConfig.turnMarker.animation = 'spin'
    game.settings.set('core', 'combatTrackerConfig', combatConfig)
  }

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => macros.createDemonlordMacro(data, slot))
  // Migration
  await handleMigrations()

  game.demonlord.KeyState = new KeyState()

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
        img: effect.img,
      })
    }
  }
  // Regardless of the setting, add the "invisible" status so that actors can turn invisible
  // And dead, otherwise can't "kill 'em ded"
  else {
    effects.push(CONFIG.statusEffects.find(e => e.id === 'dead'))
    effects.push(CONFIG.statusEffects.find(e => e.id === 'invisible'))
    effects.push(CONFIG.statusEffects.find(e => e.id === 'dead'))
  }


  CONFIG.statusEffects = effects

  // Set active effect keys-labels
  DLActiveEffectConfig.initializeChangeKeys()
  DLActiveEffectConfig.initializeSpecialDurations()
})

/**
 * Set default values for new actors' tokens
 */
Hooks.on('createActor', async (actor, _options, _id) => {
  if (!actor.isOwner) return
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
  if (!actor.isOwner || !game.combat) return

  let token = actor.token || game.combats?.viewed?.combatants.find(c => c.actor?.id == actor.id)?.token
  let combatant = token?.combatant
  let defeated = (actor?.system.characteristics.health.value >= actor?.system.characteristics.health.max) ? true : false

     if (combatant != undefined && combatant.defeated != defeated && game.settings.get('demonlord', 'autoSetDefeated')) {
         await combatant.update({ defeated: defeated })
     }

  // Update the combat initiative if the actor has changed its turn speed
  const isUpdateTurn = typeof updateData?.system?.fastturn !== 'undefined' && updateData?.system?.fastturn !== null
  if (!(isUpdateTurn && (game.user.isGM || actor.isOwner))) return
  const linkedCombatants = game.combat.combatants.filter(c => c.actorId === actor.id)
  for await (const c of linkedCombatants) {
    game.combat.setInitiative(c.id, game.combat.getInitiativeValue(c))
  }
})

export async function findAddEffect(actor, effectId, overlay) {
  if (!actor.effects.find(e => e.statuses?.has(effectId)) && !actor.isImmuneToAffliction(effectId)) {
    const effect = CONFIG.statusEffects.find(e => e.id === effectId)
    if (!effect) {
      ui.notifications.error(game.i18n.localize('DL.UnknownEffect') + ': ' + effectId)
      return
    }
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
      // Skip immunities
      if (_parent.isImmuneToAffliction(statusId)) continue

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

  // If it's an affliction (system.maluses.affliction), add it
  const changes = activeEffect.changes
  if (['character', 'creature'].includes(_parent.type)) {
    for (const affliction of changes.filter(c => c.key === 'system.maluses.affliction')) {
      if (!_parent.isImmuneToAffliction(affliction.value.toLowerCase())) {
        await _parent.setFlag('demonlord', affliction.value.toLowerCase(), true)
        await findAddEffect(_parent, affliction.value.toLowerCase())
      }
    }
  }
})

export async function findDeleteEffect(actor, effectId) {
  const effect = actor.effects.find(e => e.statuses?.has(effectId))
  return await effect?.delete()
}

 Hooks.on('preUpdateActiveEffect', async (activeEffect, changes, _, userId ) => {
    // Set specialDuration effects to temporary
    if (game.user.id !== userId) return
    const specialDuration = foundry.utils.getProperty(changes, `flags.${game.system.id}.specialDuration`)
    if (specialDuration !== "None" && specialDuration !== undefined)
    {
      changes.duration.rounds = 1
    }
})

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

  // If it's an affliction (system.maluses.affliction), remove it
  const changes = activeEffect.changes
  if (['character', 'creature'].includes(_parent.type)) {
    for (const affliction of changes.filter(c => c.key === 'system.maluses.affliction')) {
      await _parent.setFlag('demonlord', affliction.value.toLowerCase(), false)
      await findDeleteEffect(_parent, affliction.value.toLowerCase())
    }
  }
})

Hooks.on('updateActiveEffect', async (activeEffect, diff, _, userId) => {
  if (game.user.id !== userId) return
  const changes = activeEffect.changes
  const _parent = activeEffect.parent
  if (changes?.length > 0 && _parent) {
    // If it's an affliction (system.maluses.affliction), add it
    if (['character', 'creature'].includes(_parent.type)) {
      for (const affliction of changes.filter(c => c.key === 'system.maluses.affliction')) {
        if (diff.disabled || _parent.isImmuneToAffliction(affliction.value.toLowerCase())) {
          await _parent.setFlag('demonlord', affliction.value.toLowerCase(), false)
          await findDeleteEffect(_parent, affliction.value.toLowerCase())
        } else {
          await _parent.setFlag('demonlord', affliction.value.toLowerCase(), true)
          await findAddEffect(_parent, affliction.value.toLowerCase())
        }
      }
    }
  }
})

Hooks.on("updateWorldTime", _onUpdateWorldTime)

Hooks.on('renderChatLog', (app, html, _data) => initChatListeners(html))

Hooks.on('renderChatMessageHTML', async (app, html, _msg) => {
  if (!game.user.isGM) {
    html.querySelectorAll('.gmonly').forEach(el => el.remove())
    html.querySelectorAll('.gmonlyzero').forEach(el => el.remove())
    let messageActor = app.speaker.actor
    if (!game.actors.get(messageActor)?.isOwner && game.settings.get('demonlord', 'hideActorInfo')) html.find('.showlessinfo').remove()
    if (!game.actors.get(messageActor)?.isOwner && game.settings.get('demonlord', 'hideDescription')) html.find('.showdescription').empty()
  } else html.querySelectorAll('.gmremove').forEach(el => el.remove())
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
  if (game.settings.get('demonlord', 'replaced3')) {
    dice3d.addDicePreset({
      type: 'd3',
      labels: ['I', 'II', 'systems/demonlord/assets/ui/icons/logo.png'],
      system: 'demonlord',
    })
  }  
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
        item => Number(item.system.requirement?.minvalue) > token.actor.getAttribute(item.system.requirement?.attribute)?.value,
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

Hooks.on('renderDLBaseActorSheet', (app, html, data) => DLBaseActorSheet.onRenderInner(app, html, data))
