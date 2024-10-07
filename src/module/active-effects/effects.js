/* global fromUuidSync */
/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning entity which manages this effect
 */
import { DemonlordActor } from "../actor/actor";
import {calcEffectRemainingRounds, calcEffectRemainingSeconds, calcEffectRemainingTurn} from "../combat/combat";
import { DemonlordItem } from "../item/item";
import {i18n} from "../utils/utils";

export async function onManageActiveEffect(event, owner) {
  event.preventDefault()
  const a = event.currentTarget
  const li = a.closest('li')
  const effect = li.dataset.effectId ? (owner instanceof DemonlordActor ? Array.from(owner.allApplicableEffects()).find(e => e._id === li.dataset.effectId) : owner.effects.get(li.dataset.effectId)) : null
  const isCharacter = owner.type === 'character'
  switch (a.dataset.action) {
    case 'create':
      return await owner
        .createEmbeddedDocuments('ActiveEffect', [
          {
            name: isCharacter ? 'New Effect' : owner.name,
            icon: isCharacter ? 'icons/magic/symbols/chevron-elipse-circle-blue.webp' : owner.img,
            origin: owner.uuid,
            transfer: false,
            flags: { sourceType: owner.type },
            'duration.rounds': li.dataset.effectType === 'temporary' ? 1 : undefined,
            disabled: li.dataset.effectType === 'inactive',
          },
        ])
        .then(effects => effects[0].sheet.render(true))
    case 'edit':
      return effect.sheet.render(true)
    case 'delete':
      return await effect.delete()
    case 'toggle':
      return await effect.update({ disabled: !effect.disabled })
  }
}

export async function onCreateEffect(listItem, owner) {
  const isCharacter = owner.type === 'character'
  return await owner
        .createEmbeddedDocuments('ActiveEffect', [
          {
            name: isCharacter ? 'New Effect' : owner.name,
            icon: isCharacter ? 'icons/magic/symbols/chevron-elipse-circle-blue.webp' : owner.img,
            origin: owner.uuid,
            transfer: false,
            flags: { sourceType: owner.type },
            'duration.rounds': listItem.dataset.effectType === 'temporary' ? 1 : undefined,
            disabled: listItem.dataset.effectType === 'inactive',
          },
        ])
        .then(effects => effects[0].sheet.render(true))
}

export async function onEditEffect(listItem, owner) {
  const effect = listItem.dataset.effectId ? (owner instanceof DemonlordActor ? Array.from(owner.allApplicableEffects()).find(e => e._id === listItem.dataset.effectId) : owner.effects.get(listItem.dataset.effectId)) : null
  return effect.sheet.render(true)
}

export async function onDeleteEffect(listItem, owner) {
    const effect = listItem.dataset.effectId ? (owner instanceof DemonlordActor ? Array.from(owner.allApplicableEffects()).find(e => e._id === listItem.dataset.effectId) : owner.effects.get(listItem.dataset.effectId)) : null
  return await effect.delete()
}

export async function onToggleEffect(listItem, owner) {
  const effect = listItem.dataset.effectId ? (owner instanceof DemonlordActor ? Array.from(owner.allApplicableEffects()).find(e => e._id === listItem.dataset.effectId) : owner.effects.get(listItem.dataset.effectId)) : null
  return await effect.update({ disabled: !effect.disabled })
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @param {Boolean} showCreateButtons Show create buttons on page
 * @param {Integer} showControls      What controls to show
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects, showCreateButtons = false, ownerIsItem = false) {
  // Define effect header categories
  let categories = {
    temporary: {
      type: 'temporary',
      name: game.i18n.localize('DL.EffectTemporary'),
      showCreateButtons: showCreateButtons,
      showControls: 3,
      effects: [],
    },
    passive: {
      type: 'passive',
      name: game.i18n.localize('DL.EffectPassive'),
      showCreateButtons: showCreateButtons,
      showControls: 3,
      effects: [],
    },
    inactive: {
      type: 'inactive',
      name: game.i18n.localize('DL.EffectInactive'),
      showCreateButtons: showCreateButtons,
      showControls: 3,
      effects: [],
    },
  }

  // Iterate over active effects, classifying them into categories.
  for (let e of effects) {
    // First thing, set notEditable flag on effects that come from items where !ownerIsItem
    e.flags.notDeletable = e.flags.notDeletable ?? (e.parent instanceof DemonlordItem && !ownerIsItem)

    // Also set the 'remaining time' in seconds or rounds depending on if in combat
    if (e.isTemporary && (e.duration.seconds || e.duration.rounds || e.duration.turns)) {
      if (game.combat) {
        if (e.duration.turns > 0) {
          const rr = calcEffectRemainingRounds(e, game.combat.round)
          const rt = calcEffectRemainingTurn(e, game.combat.turn)
          const sr = `${rr} ${Math.abs(rr) > 1 ? i18n("COMBAT.Rounds") : i18n("COMBAT.Round")}`
          const st = `${rt} ${Math.abs(rt) > 1 ? i18n("COMBAT.Turns") : i18n("COMBAT.Turn")}`
          e.dlRemaining = sr + ' ' + st
        }
        else {
          const r = calcEffectRemainingRounds(e, game.combat.round)
          e.dlRemaining = `${r} ${Math.abs(r) > 1 ? i18n("COMBAT.Rounds") : i18n("COMBAT.Round")}`
        }
      } else {
        const r = calcEffectRemainingSeconds(e, game.time.worldTime)
        e.dlRemaining = `${r} ${i18n("TIME.Seconds")}`
      }
    } else {
      e.dlRemaining = e.duration.label
    }

    let specialDuration = foundry.utils.getProperty(e, 'flags.specialDuration')
    let tokenName
    if (specialDuration !== 'None' && specialDuration !== undefined) {
      tokenName = fromUuidSync(e.origin.substr(0, e.origin.search('.Actor.')))?.name
      switch (specialDuration) {
        case 'TurnEndSource':
          e.dlRemaining = `TurnEnd [${tokenName}]`
          break
        case 'TurnStartSource':
          e.dlRemaining = `TurnStart [${tokenName}]`
          break
        default:
          e.dlRemaining = specialDuration
      }
    }

    if (e.disabled) categories.inactive.effects.push(e)
      else if (e.isTemporary) categories.temporary.effects.push(e)
      else categories.passive.effects.push(e)
    
  }

  return categories
}

Hooks.on('renderActiveEffectConfig', (app, html) => {
  // if (!game.user.isGM) return

  var dropDownConfig = function ({ default_value, values }) {
    let flags = app.object.flags

    const formGroup = document.createElement('div')
    formGroup.classList.add('form-group')
    parentN.append(formGroup)

    const formFields = document.createElement('div')
    formFields.classList.add('form-fields')
    formGroup.append(formFields)

    const cur = flags?.['specialDuration'] ?? default_value
    const input = document.createElement('select')
    input.name = 'flags.specialDuration'

    for (let o of values) {
      let opt = document.createElement('option')
      opt.value = o
      opt.text = game.i18n.localize('DL.SpecialDuration' + o)
      if (cur === o) opt.classList.add('selected')
      input.append(opt)
    }
    input.value = cur

    formFields.append(input)
  }

  const parentN = document.createElement('fieldset')
  const legend = document.createElement('legend')
  legend.textContent = game.i18n.localize('DL.SpecialDurationLabel')
  parentN.append(legend)

  dropDownConfig({
    specialDuration: 'specialDuration',
    values: ['None', 'TurnStart', 'TurnEnd', 'TurnStartSource', 'TurnEndSource','NextD20Roll','RestComplete'],
    default_value: 'None',
  })

  html[0].querySelector("section[data-tab='duration']").append(parentN)
  app.setPosition()
})