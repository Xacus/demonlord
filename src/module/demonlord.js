// Import Modules
import { DL } from './config.js'
import { DemonlordActor } from './actor/actor.js'
import { DemonlordItem } from './item/item.js'
import { ActionTemplate } from './pixi/action-template.js'
import { registerSettings } from './settings.js'
import { nextTurn, rollInitiative, setupTurns, startCombat } from './init/init.js'
import combattracker, { _onUpdateCombat } from './combattracker.js'
import { preloadHandlebarsTemplates } from './templates.js'
import * as migrations from './migration.js'
import { handleMigrations } from './migration.js'
import * as macros from './macros.js'
import { capitalize } from './utils/utils'
import { DLAfflictions } from './active-effects/afflictions'
import { DLActiveEffectConfig } from './active-effects/sheets/active-effect-config'
import DLCharacterSheet from './actor/sheets/character-sheet'
import DLCreatureSheet from './actor/sheets/creature-sheet'
import DLBaseItemSheet from './item/sheets/base-item-sheet'
import DLAncestrySheet from './item/sheets/ancestry-sheet'
import DLPathSheet from './item/sheets/path-sheet'
import './playertrackercontrol'
import { initChatListeners } from './chat/chat-listeners'

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
    macros: macros,
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

  Combat.prototype.rollInitiative = rollInitiative
  Combat.prototype.startCombat = startCombat
  Combat.prototype.nextTurn = nextTurn

  if (!isNewerVersion(game.version ?? game.data.version, '0.6.9') && !game.data.release?.generation) {
    Combat.prototype.setupTurns = setupTurns
  }

  CONFIG.Actor.documentClass = DemonlordActor
  CONFIG.Item.documentClass = DemonlordItem
  DocumentSheetConfig.registerSheet("demonlord", DLActiveEffectConfig, {makeDefault: true})
  CONFIG.ui.combat = combattracker
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

  Handlebars.registerHelper('toUpperCase', str => str.toUpperCase())

  Handlebars.registerHelper('capitalize', str => capitalize(str))

  Handlebars.registerHelper('readonly', val => (val ? 'readonly' : ''))

  Handlebars.registerHelper('notreadonly', val => (val ? '' : 'readonly'))

  Handlebars.registerHelper('json', JSON.stringify)

  Handlebars.registerHelper('not', val => !val)

  Handlebars.registerHelper('hideIf', val => (val ? 'style="display:none";' : ''))

  Handlebars.registerHelper('replaceNewline', val =>
    val.split('\n').reduce((acc, v) => acc + v.trim() + '&#13;&#10;', ''),
  )

  Handlebars.registerHelper('hiddenEffect', val =>
    val && game.user.isGM && !game.settings.get('demonlord', 'gmEffectsControls') ? 'visibility: hidden;' : '',
  )

  Handlebars.registerHelper('isBadgeImg', img => img.includes('/demonlord/assets/icons/badges'))

  Handlebars.registerHelper('plusify', x => (x >= 0 ? '+' + x : x))

  preloadHandlebarsTemplates()
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

  if (!game.settings.get('demonlord', 'statusIcons')) {
    for (const effect of CONFIG.statusEffects) {
      effects.push({
        id: effect.id,
        label: effect.label,
        icon: effect.icon,
      })
    }
  }

  CONFIG.statusEffects = effects

  // Set active effect keys-labels
  DLActiveEffectConfig.initializeChangeKeys()
})

/**
 * Set default values for new actors' tokens
 */
Hooks.on('preCreateActor', (actor, data, _options, _userId) => {
  let disposition = CONST.TOKEN_DISPOSITIONS.NEUTRAL
  if (data.type === 'creature') disposition = CONST.TOKEN_DISPOSITIONS.HOSTILE

  //console.log(actor, data)
  const tokenData = {
    name: data.name,
    bar1: { attribute: 'characteristics.health' },
    displayName: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
    displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
    disposition: disposition,
  }

  if (data.type == 'character') {
    tokenData.vision = true
    tokenData.actorLink = true
    tokenData.dimSight = 5 // Give some squares of dim vision
  }
  actor.data.update({ token: tokenData })
})

Hooks.on('createToken', async _tokenDocument => {
  return 0
})

Hooks.on('updateActor', async (actor, updateData) => {
  if (updateData.data && (game.user.isGM || actor.isOwner)) {
    if (game.combat) {
      for (const combatant of game.combat.combatants) {
        let init = 0

        if (combatant.actor == actor) {
          if (actor.data.type == 'character') {
            init = actor.data.data.fastturn ? 70 : 30
          } else {
            init = actor.data.data.fastturn ? 50 : 10
          }

          game.combat.setInitiative(combatant.id, init)
        }
      }
    }
  }
})

Hooks.on('createActiveEffect', async activeEffect => {
  const statusId = activeEffect.data.flags?.core?.statusId
  const _parent = activeEffect?.parent
  if (statusId && _parent) {
    await _parent.setFlag('demonlord', statusId, true)

    // If asleep, also add prone and uncoscious
    if (statusId === 'asleep') {
      if (!_parent.effects.find(e => e.data.flags?.core?.statusId === 'prone')) {
        const prone = CONFIG.statusEffects.find(e => e.id === 'prone')
        prone['flags.core.statusId'] = 'prone'
        await ActiveEffect.create(prone, { parent: _parent })
      }

      if (!_parent.effects.find(e => e.data.flags?.core?.statusId === 'unconscious')) {
        const unconscious = CONFIG.statusEffects.find(e => e.id === 'unconscious')
        unconscious['flags.core.statusId'] = 'unconscious'
        await ActiveEffect.create(unconscious, { parent: _parent })
      }
    }
  }
})

Hooks.on('deleteActiveEffect', async activeEffect => {
  const statusId = activeEffect.data.flags?.core?.statusId
  const _parent = activeEffect?.parent
  if (statusId && _parent) {
    await _parent.unsetFlag('demonlord', statusId)

    // If asleep, also remove prone and uncoscious
    if (statusId === 'asleep') {
      const prone = _parent.effects.find(e => e.data.flags?.core?.statusId === 'prone')
      await prone?.delete()

      const unconscious = _parent.effects.find(e => e.data.flags?.core?.statusId === 'unconscious')
      await unconscious?.delete()
    }
  }
})

Hooks.on('updateCombat', _onUpdateCombat)

Hooks.on('renderChatLog', (app, html, _data) => initChatListeners(html))

Hooks.on('renderChatMessage', async (app, html, _msg) => {
  if (!game.user.isGM) {
    html.find('.gmonly').remove()
    html.find('.gmonlyzero').remove()
  } else html.find('.gmremove').remove()
})

Hooks.once('diceSoNiceReady', dice3d => {
  dice3d.addSystem({ id: 'demonlord', name: 'Demonlord' }, true)
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
        { id: 'walk', default: 0x00ff00, name: 'demonlord.speeds.walk' },
        { id: 'rush', default: 0xffff00, name: 'demonlord.speeds.rush' },
      ]
    }

    getSpeedModifier(token) {
      const itemsHeavy = token.actor.items.filter(
        item => Number(item.data.data.strengthmin) > token.actor.getAttribute("strength").value,
      )
      if (itemsHeavy.length > 0) {
        return -2
      }
      return 0
    }

    getRanges(token) {
      const baseSpeed = token.actor.data.data.characteristics.speed + this.getSpeedModifier(token)
      const ranges = [
        { range: baseSpeed, color: 'walk' },
        { range: baseSpeed * 2, color: 'rush' },
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
  Hooks.call('DL.Action', { type: 'use-talent', ...data })
})
Hooks.on('DL.UseSpell', data => {
  Hooks.call('DL.Action', { type: 'use-spell', ...data })
})
Hooks.on('DL.RollAttack', data => {
  Hooks.call('DL.Action', { type: 'roll-attack', ...data })
})
Hooks.on('DL.RollDamage', data => {
  Hooks.call('DL.Action', { type: 'roll-damage', ...data })
})
Hooks.on('DL.ApplyDamage', data => {
  Hooks.call('DL.Action', { type: 'apply-damage', ...data })
})
Hooks.on('DL.ApplyHealing', data => {
  Hooks.call('DL.Action', { type: 'apply-healing', ...data })
})

Hooks.on('DL.Action', () => {
  if (!game.settings.get('demonlord', 'templateAutoRemove')) {
    return
  }
  const actionTemplates = canvas.scene.templates.filter(a => a.data.flags.actionTemplate).map(a => a.id)
  if (actionTemplates.length > 0) canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', actionTemplates)
})
