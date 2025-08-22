const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

const indices = {
  common: ['name', 'system.description', 'system.source' ],
  ancestry: [],
  path: [],
  feature: [],
  item: [ 'system.type', ],
  talent: [],
  spell: [ 'system.tradition', 'system.rank', 'system.type', 'system.attribute' ],
  creature: [],
  character: [],
  vehicle: [],
  table: []
}

export class DLCompendiumBrowser extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: 'div',
    form: {
      handler: this.onSubmit(),
      submitOnChange: true,
      closeOnSubmit: false
    },
    classes: ['demonlord-compendium-browser'],
    actions: {

    },
    window: {
      resizable: true
    },
    position: {
      width: 700,
      height: 600,
    },
    scrollY: ['.tab.paths', '.tab.active'],
    editable: true
  }

  static PARTS = {
    search: { template: 'systems/demonlord/templates/compendium-browser/search.hbs' },

    // One part for each filter type
    filterscharacter: { template: 'systems/demonlord/templates/compendium-browser/filters-character.hbs' },
    filterscreature: { template: 'systems/demonlord/templates/compendium-browser/filters-creature.hbs' },
    filtersvehicle: { template: 'systems/demonlord/templates/compendium-browser/filters-vehicle.hbs' },
    filtersancestry: { template: 'systems/demonlord/templates/compendium-browser/filters-ancestry.hbs' },
    filtersammo: { template: 'systems/demonlord/templates/compendium-browser/filters-ammo.hbs' },
    filtersarmor: { template: 'systems/demonlord/templates/compendium-browser/filters-armor.hbs' },
    filterscreaturerole: { template: 'systems/demonlord/templates/compendium-browser/filters-creaturerole.hbs' },
    filtersendoftheround: { template: 'systems/demonlord/templates/compendium-browser/filters-endoftheround.hbs' },
    filtersfeature: { template: 'systems/demonlord/templates/compendium-browser/filters-feature.hbs' },
    filtersitem: { template: 'systems/demonlord/templates/compendium-browser/filters-item.hbs' },
    filterslanguage: { template: 'systems/demonlord/templates/compendium-browser/filters-language.hbs' },
    filterspath: { template: 'systems/demonlord/templates/compendium-browser/filters-path.hbs' },
    filtersprofession: { template: 'systems/demonlord/templates/compendium-browser/filters-profession.hbs' },
    filtersrelic: { template: 'systems/demonlord/templates/compendium-browser/filters-relic.hbs' },
    filtersspecialaction: { template: 'systems/demonlord/templates/compendium-browser/filters-specialaction.hbs' },
    filtersspell: { template: 'systems/demonlord/templates/compendium-browser/filters-spell.hbs' },
    filterstalent: { template: 'systems/demonlord/templates/compendium-browser/filters-talent.hbs' },
    filtersweapon: { template: 'systems/demonlord/templates/compendium-browser/filters-weapon.hbs' },

    // One part for each result type
    resultscharacter: { template: 'systems/demonlord/templates/compendium-browser/results-character.hbs' },
    resultscreature: { template: 'systems/demonlord/templates/compendium-browser/results-creature.hbs' },
    resultsvehicle: { template: 'systems/demonlord/templates/compendium-browser/results-vehicle.hbs' },
    resultsancestry: { template: 'systems/demonlord/templates/compendium-browser/results-ancestry.hbs' },
    resultsammo: { template: 'systems/demonlord/templates/compendium-browser/results-ammo.hbs' },
    resultsarmor: { template: 'systems/demonlord/templates/compendium-browser/results-armor.hbs' },
    resultscreaturerole: { template: 'systems/demonlord/templates/compendium-browser/results-creaturerole.hbs' },
    resultsendoftheround: { template: 'systems/demonlord/templates/compendium-browser/results-endoftheround.hbs' },
    resultsfeature: { template: 'systems/demonlord/templates/compendium-browser/results-feature.hbs' },
    resultsitem: { template: 'systems/demonlord/templates/compendium-browser/results-item.hbs' },
    resultslanguage: { template: 'systems/demonlord/templates/compendium-browser/results-language.hbs' },
    resultspath: { template: 'systems/demonlord/templates/compendium-browser/results-path.hbs' },
    resultsprofession: { template: 'systems/demonlord/templates/compendium-browser/results-profession.hbs' },
    resultsrelic: { template: 'systems/demonlord/templates/compendium-browser/results-relic.hbs' },
    resultsspecialaction: { template: 'systems/demonlord/templates/compendium-browser/results-specialaction.hbs' },
    resultsspell: { template: 'systems/demonlord/templates/compendium-browser/results-spell.hbs' },
    resultstalent: { template: 'systems/demonlord/templates/compendium-browser/results-talent.hbs' },
    resultsweapon: { template: 'systems/demonlord/templates/compendium-browser/results-weapon.hbs' },
  }

  // #region Data Preparation

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);

    // These parts are always rendered
    options.parts = ['search']

    if (!ignoredParts.includes(this.document.type)) {
      options.parts.push(this.document.type)
    }

    // Add parts depending on the current selected  type (in search)
    options.parts.push(`filters${context.search.type}`)
    options.parts.push(`results${context.search.type}`)

    // Finally, adjust the window position according to the type
    // this._adjustSizeByItemType(this.document.type, this.position) // Maybe not needed
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options)

    if (options.isFirstRender) {
      await this.indexCompendia()
    }

    context.isGM = game.user.isGM
    // x.metadata.label includes a user-friendly name
    // Should also be filtered by ownership (i.e. prevent players from seeing compendia where they're not at least observer)
    // Retrieve specific pack with game.packs.get(x.metadata.id)
    // Filter for specific type with x.filter(p => p.index.some(e => e.type === 'creature'))
    // Finally, open wanted document with (await game.packs.get(x.pack).getDocument(x._id)).sheet.render()
    // TODO: Prepare specific indices for each type which allows us to quickly list and filter them
    context.sources = game.packs.filter(p => ['Item', 'Actor', 'RollTable'].includes(p.metadata.type)).map(async p => await game.packs.get(p.metadata.id))

    // Prepare search
    context.search = {
      text: context.search?.text || '',
      type: context.search?.type || '',
      caseSensitive: context.search?.caseSensitive || false,
    }

    // Prepare filters (stored per type)
    context.filters = {
      character: {
        source: context.filters?.character?.source || '',
        description: context.filters?.character?.description || '',
        ancestry: context.filters?.character?.ancestry || '',
        path: context.filters?.character?.path || [],
        isPC: context.filters?.character?.isPC || null,
        level: context.filters?.character?.level || null, // 0-X
        professions: context.filters?.character?.professions || [],
        //attributes: ?
        // characteristics: ?
      },
      creature: {
        source: context.filters?.creature?.source ||'',
        description: context.filters?.creature?.description ||'',
        type: context.filters?.creature?.type ||'',
        difficulty: context.filters?.creature?.difficulty ||null,
        isFrightening: context.filters?.creature?.isFrightening ||null,
        isHorrifying: context.filters?.creature?.isHorrifying ||null,
        roles: context.filters?.creature?.roles ||[],
        perceptionSenses: context.filters?.creature?.perceptionSenses ||[],
        //attributes: ?
        // characteristics: ?
      },
      vehicle: {
        source: context.filters?.vehicle?.source || '',
        description: context.filters?.vehicle?.description || '',
        price: context.filters?.vehicle?.price || null,
        cargo: context.filters?.vehicle?.cargo || null,
        //attributes: ?
        // characteristics: ?
      },
      ancestry: {
        source: context.filters?.ancestry?.source || '',
        description: context.filters?.ancestry?.description || '',
        levels: context.filters?.ancestry?.levels || null, // 1-X
        isMagic: context.filters?.ancestry?.isMagic || null, // system.levels.some(l => l.spells.length > 0) or system.levels.some(l => l.magic)
        //attributes: ?
        // characteristics: ?
      },
      ammo: {
        source: context.filters?.ammo?.source || '',
        description: context.filters?.ammo?.description || '',
        properties: context.filters?.ammo?.properties || '',
        availability: context.filters?.ammo?.availability || '', // C/E/R/U
        value: context.filters?.ammo?.value || ''
      },
      armor: {
        source: context.filters?.armor?.source ||'',
        description: context.filters?.armor?.description ||'',
        properties: context.filters?.armor?.properties ||'',
        availability: context.filters?.armor?.availability ||'', // C/E/R/U
        value: context.filters?.armor?.value ||'',
        defense: context.filters?.armor?.defense ||'',
        agility: context.filters?.armor?.agility ||'',
        fixed: context.filters?.armor?.fixed ||'',
        requirement: context.filters?.armor?.requirement ||[], // TODO [ { attribute: '', min: 0 } ]
        isShield: context.filters?.armor?.isShield ||null
      },
      creaturerole: {
        source: context.filters?.creaturerole?.source ||'',
        description: context.filters?.creaturerole?.description ||'',
        isFrightening: context.filters?.creaturerole?.isFrightening ||null,
        isHorrifying: context.filters?.creaturerole?.isHorrifying ||null,
        //attributes: ?
        // characteristics: ?
      },
      endoftheround: {
        source: context.filters?.endoftheround?.source || '',
        description: context.filters?.endoftheround?.description || '',
        isHealing: context.filters?.endoftheround?.isHealing || null, // Whether it has system.healing.healactive
        isDamage: context.filters?.endoftheround?.isDamage || null, // Whether it has system.action.damage* (any of them)
      },
      feature: {
        source: context.filters?.feature?.source ||'',
        description: context.filters?.feature?.description ||'',
      },
      item: {
        source: context.filters?.item?.source ||'',
        description: context.filters?.item?.description ||'',
        properties: context.filters?.item?.properties ||'',
        isConsumable: context.filters?.item?.isConsumable ||null,
        consumableType: context.filters?.item?.consumableType ||'',
        availability: context.filters?.item?.availability ||'', // C/E/R/U
        value: context.filters?.item?.value ||'',

      },
      language: {
        source: context.filters?.language?.source || '',
        description: context.filters?.language?.description || '',
      },
      path: {
        source: context.filters?.path?.source || '',
        description: context.filters?.path?.description || '',
        levels: context.filters?.path?.levels || null, // 1-X
        isMagic: context.filters?.path?.isMagic || null, // system.levels.some(l => l.spells.length > 0) or system.levels.some(l => l.magic)
        pathType: context.filters?.path?.pathType || '', // Novice, Expert, Master, Legendary
        //attributes: ?
        // characteristics: ?
      },
      profession: {
        source: context.filters?.profession?.source ||'',
        description: context.filters?.profession?.description ||'',
      },
      relic: {
        source: context.filters?.relic?.source || '',
        description: context.filters?.relic?.description || '',
        requirement: context.filters?.relic?.requirement || [], // TODO [ { attribute: '', min: 0 } ]
      },
      specialaction: {
        source: context.filters?.specialaction?.source ||'',
        description: context.filters?.specialaction?.description ||'',
      },
      spell: {
        source: context.filters?.spell?.source || '',
        description: context.filters?.spell?.description || '',
        tradition: context.filters?.spell?.tradition || '',
        rank: context.filters?.spell?.rank || null, // 0-9
        type: context.filters?.spell?.type || '', // Attack/Utility
        attribute: context.filters?.spell?.attribute || '', // Intellect/Will
        isTriggered: context.filters?.spell?.isTriggered || null, // Whether it has system.triggered
        isHealing: context.filters?.spell?.isHealing || null, // Whether it has system.healing.healactive
        isDamage: context.filters?.spell?.isDamage || null, // Whether it has system.action.damage* (any of them)
        hasChallenge: context.filters?.spell?.hasChallenge || null,
        // isInsanity: null, // Future, whether it deals insanity damage
        // isCorruption: null, // Future, whether it deals corruption damage

      },
      talent: {
        source: context.filters?.talent?.source || '',
        description: context.filters?.talent?.description || '',
        isTriggered: context.filters?.talent?.isTriggered || null, // Whether it has system.triggered
        isHealing: context.filters?.talent?.isHealing || null, // Whether it has system.healing.healactive
        isDamage: context.filters?.talent?.isDamage || null, // Whether it has system.action.damage* (any of them)
        hasChallenge: context.filters?.talent?.hasChallenge || null,
        hasUses: context.filters?.talent?.hasUses || null,
        // isInsanity: null, // Future, whether it deals insanity damage
        // isCorruption: null, // Future, whether it deals corruption damage

      },
      weapon: {
        source: context.filters?.weapon?.source || '',
        description: context.filters?.weapon?.description || '',
        requirement: context.filters?.weapon?.requirement || [], // TODO [ { attribute: '', min: 0 } ]
        availability: context.filters?.weapon?.availability || '', // C/E/R/U
        value: context.filters?.weapon?.value || '',
        usesAmmo: context.filters?.weapon?.usesAmmo || null,
      },
    }

    // Search items in sources with filters
    context.results = await filterItems(context)

  }

  // /** @override */
  // async _preparePartContext(partId, context, options) {
  //   await super._preparePartContext(partId, context, options)

  //   return context
  // }

  // #endregion

  async indexCompendia(compendia) {
    return await Promise.all(compendia.map(async compendiumId => {
      const compendium = game.packs.get(compendiumId)
      const itemType = compendium.index.filter(Boolean)[0]?.type

      if (!itemType) return

      const index = indices.common.concat(indices[itemType]).filter(Boolean)
      return await compendium.getIndex({ fields: index })
    }))
  }

  async filterItems(cb) {
    // Deal with quick returns
    if (!cb.search.type) return []

    // Filter sources by search type...
    let results = cb.sources.filter(p => p?.index?.filter(Boolean)?.[0]?.type === cb.search.type)
    .flatMap(p => p.index.filter(Boolean))

    // ...searched text
    if (cb.search.text) {
      if (cb.search.caseSensitive) {
        results = results.filter(e => e.name.indexOf(cb.search.text) >= 0 || e.description.indexOf(cb.search.text) >= 0)
      } else {
        results = results.filter(e => e.name.toLowerCase().includes(cb.search.text.toLowerCase()) || e.description.toLowerCase().indexOf(cb.search.text.toLowerCase()) >= 0)
      }
    }

    // ...and type-specific filters
    switch (cb.search.type) {
      case 'character':
        break
      case 'creature':
        break
      case 'vehicle':
        break
      case 'ancestry':
        break
      case 'ammo':
        break
      case 'armor':
        break
      case 'creaturerole':
        break
      case 'endoftheround':
        break
      case 'feature':
        break
      case 'item':
        break
      case 'language':
        break
      case 'path':
        break
      case 'profession':
        break
      case 'relic':
        break
      case 'specialaction':
        break
      case 'spell':
        results = results.filter(e => {
          if (cb.filters?.spell?.tradition && e.system.tradition !== cb.filters.spell.tradition) return false
          if (cb.filters?.spell?.rank !== null && e.system.rank !== cb.filters.spell.rank) return false
          if (cb.filters?.spell?.type !== null && e.system.type !== cb.filters.spell.type) return false
          if (cb.filters?.spell?.attribute !== null && e.system.attribute !== cb.filters.spell.attribute) return false

          // TODO: Bool filters
          //if (cb.filters?.spell?.isTriggered !== null && !e.system.triggered) return false

          return true
        })
        break
      case 'talent':
        break
      case 'weapon':
        break
    }

    return results
  }
}
