/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning entity which manages this effect
 */
import {calcEffectRemainingRounds, calcEffectRemainingSeconds} from "../combat/combat";
import {i18n} from "../utils/utils";

export function onManageActiveEffect(event, owner) {
  event.preventDefault()
  const a = event.currentTarget
  const li = a.closest('li')
  const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null
  const isCharacter = owner.type === 'character'
  switch (a.dataset.action) {
    case 'create':
      return owner
        .createEmbeddedDocuments('ActiveEffect', [
          {
            label: isCharacter ? 'New Effect' : owner.name,
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
      return effect.delete()
    case 'toggle':
      return effect.update({ disabled: !effect.disabled })
  }
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @param {Boolean} showCreateButtons Show create buttons on page
 * @param {Integer} showControls      What controls to show
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects, showCreateButtons = false, showControls = 3) {
  // Define effect header categories
  let categories = {
    temporary: {
      type: 'temporary',
      label: 'Temporary Effects',
      showCreateButtons: showCreateButtons,
      showControls: showControls,
      effects: [],
    },
    passive: {
      type: 'passive',
      label: 'Passive Effects',
      showCreateButtons: showCreateButtons,
      showControls: showControls,
      effects: [],
    },
    inactive: {
      type: 'inactive',
      label: 'Inactive Effects',
      showCreateButtons: showCreateButtons,
      showControls: showControls,
      effects: [],
    },
  }

  // Iterate over active effects, classifying them into categories.
  for (let e of effects) {
    // Also set the 'remaining time' in seconds or rounds depending on if in combat
    if (e.isTemporary && (e.duration.seconds || e.duration.rounds)) {
      if (game.combat) {
        const r = calcEffectRemainingRounds(e, game.combat.round)
        e.dlRemaining = `${r} ${Math.abs(r) > 1 ? i18n("COMBAT.Rounds") : i18n("COMBAT.Round")}`
      } else {
        const r = calcEffectRemainingSeconds(e, game.time.worldTime)
        e.dlRemaining = `${r} ${i18n("TIME.Seconds")}`
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
