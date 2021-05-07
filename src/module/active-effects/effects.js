/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning entity which manages this effect
 */
export function onManageActiveEffect(event, owner) {
  event.preventDefault();
  const a = event.currentTarget;
  const li = a.closest('li');
  const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
  switch (a.dataset.action) {
    case 'create':
      return owner.createEmbeddedDocuments('ActiveEffect', [
        {
          label: 'New Effect',
          icon: 'icons/svg/aura.svg',
          origin: owner.uuid,
          'duration.rounds': li.dataset.effectType === 'temporary' ? 1 : undefined,
          disabled: li.dataset.effectType === 'inactive',
        },
      ]);
    case 'edit':
      return effect.sheet.render(true);
    case 'delete':
      return effect.delete();
    case 'toggle':
      return effect.update({ disabled: !effect.data.disabled });
  }
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @param {String} effecttype         The name of the selected subtab on Effects page. Filtering on that type.
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects) {
  // Define effect header categories
  let categories = {
    temporary: {
      type: 'temporary',
      label: 'Temporary Effects',
      effects: [],
    },
    passive: {
      type: 'passive',
      label: 'Passive Effects',
      effects: [],
    },
    inactive: {
      type: 'inactive',
      label: 'Inactive Effects',
      effects: [],
    },
  };

  // Iterate over active effects, classifying them into categories
  for (let e of effects) {
    e._getSourceName();

    const source = e.data.origin ? fromUuid(e.data.origin) : null;
    if (source != null) {
      source.then(function (result) {
        const itemtype = result != null ? result.type : e.sourceName;
        if (itemtype === 'ancestry') delete categories.temporary;
      });
    }

    if (e.data.disabled) categories.inactive.effects.push(e);
    else if (e.isTemporary) categories.temporary.effects.push(e);
    else categories.passive.effects.push(e);
  }

  return categories;
}
