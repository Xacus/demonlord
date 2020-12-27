/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning entity which manages this effect
 */
export function onManageActiveEffect (event, owner) {
  event.preventDefault()
  const a = event.currentTarget
  const li = a.closest('li')
  const effect = li.dataset.effectId
    ? owner.effects.get(li.dataset.effectId)
    : null
  switch (a.dataset.action) {
    case 'create':
      return ActiveEffect.create(
        {
          label: 'New Effect',
          icon: 'icons/svg/aura.svg',
          origin: owner.uuid,
          'duration.rounds':
            li.dataset.effectType === 'temporary' ? 1 : undefined,
          disabled:
            li.dataset.effectType === 'inactive' ||
            li.dataset.effectType === 'affliction'
        },
        owner
      ).create()
    case 'edit':
      return effect.sheet.render(true)
    case 'delete':
      return effect.delete()
    case 'toggle':
      return effect.update({ disabled: !effect.data.disabled })
  }
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories (effects) {
  // Define effect header categories
  const categories = {
    temporary: {
      type: 'temporary',
      label: 'Temporary Effects',
      effects: [],
      isNotAffliction: true
    },
    passive: {
      type: 'passive',
      label: 'Passive Effects',
      effects: [],
      isNotAffliction: true
    },
    inactive: {
      type: 'inactive',
      label: 'Inactive Effects',
      effects: [],
      isNotAffliction: true
    },
    affliction: {
      type: 'affliction',
      label: 'Afflictions',
      effects: [],
      isNotAffliction: false
    }
  }

  // Iterate over active effects, classifying them into categories
  for (const e of effects) {
    e._getSourceName()

    const source = e.data.origin ? fromUuid(e.data.origin) : null
    if (source != null) {
      source.then(function (result) {
        e.itemtype = result != null ? result.type : e.sourceName
      })
    }

    if (
      (source != null && e.itemtype === 'affliction' && e.data.disabled) ||
      (e.data.disabled && e.data.duration.rounds === 99)
    ) {
      categories.affliction.effects.push(e)
    } else if (e.data.disabled) categories.inactive.effects.push(e)
    else if (e.isTemporary) categories.temporary.effects.push(e)
    else categories.passive.effects.push(e)
  }
  return categories
}
