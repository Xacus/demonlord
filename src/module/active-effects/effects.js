/* global fromUuidSync */
/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning entity which manages this effect
 */
import { DemonlordActor } from "../actor/actor";
import { DemonlordItem } from "../item/item";
import {i18n} from "../utils/utils";

export async function onManageActiveEffect(event, owner) {
  event.preventDefault()
  const a = event.target.closest('a')
  const li = a.closest('li')
  switch (a.dataset.action) {
    case 'create':
    case 'createEffect':
      return await onCreateEffect(li, owner)
    case 'edit':
    case 'editEffect':
      return await onEditEffect(li, owner)
    case 'delete':
    case 'deleteEffect':
      return await onDeleteEffect(li, owner)
    case 'toggle':
    case 'toggleEffect':
      return await onToggleEffect(li, owner)
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
            flags: { demonlord: {sourceType: owner.type } },
            duration: {
              value: listItem.dataset.effectType === 'temporary' ? 1 : null,
              units: 'rounds',
              expiry: null
            },
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
  const isActor = owner instanceof DemonlordActor
  const effect = listItem.dataset.effectId ? (isActor ? Array.from(owner.allApplicableEffects()).find(e => e._id === listItem.dataset.effectId) : owner.effects.get(listItem.dataset.effectId)) : null
  const actorInCombat = isActor ? game.combat.combatants.some(c => c.actor._id === owner._id) : false
  const effectUpdate = { disabled: !effect.disabled }
  // Also set the activation time
  if (effect.isTemporary) {
    effectUpdate.start = {
      round: actorInCombat ? game.combat.round : 0,
      turn: actorInCombat ? game.combat.turn : 0
    }
  }
  return await effect.update(effectUpdate)
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
    // First thing, create flags if not present
    if (!e.flags.demonlord) {
      e.flags.demonlord = {}
    }

    // Set notEditable flag on effects that come from items where !ownerIsItem
    e.flags.demonlord.notDeletable = e.flags.demonlord?.notDeletable ?? (e.parent instanceof DemonlordItem && !ownerIsItem)

    // Handle custom expiry events
    let expiryEvent = e.duration.expiry
    if (expiryEvent) {
      const actorName = e.origin !== null ? fromUuidSync(e.origin)?.name : ''
      switch (expiryEvent) {
        case 'nextAttackRoll':
        case 'nextChallengeRoll':
        case 'nextD20Roll':
        case 'nextDamageRoll':
        case 'restComplete':
          e.dlRemaining = i18n(CONFIG.ActiveEffect.expiryEvents[expiryEvent])
          break
        case 'turnEndSource':
          e.dlRemaining = i18n('DL.ExpiryEventTurnEndSourceDisplay').replace('{actorName}', actorName)
          break
        case 'turnStartSource':
          e.dlRemaining = i18n('DL.ExpiryEventTurnStartSourceDisplay').replace('{actorName}', actorName)
          break
        default:
          e.dlRemaining = i18n('EFFECT.DURATION.EXPIRY_EVENTS.' + expiryEvent)
      }
    } else {
      e.dlRemaining = e.duration.label
    }

    if (e.disabled) categories.inactive.effects.push(e)
      else if (e.isTemporary) categories.temporary.effects.push(e)
      else categories.passive.effects.push(e)
  }

  return categories
}
