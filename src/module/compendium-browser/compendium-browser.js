const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

const indices = {
  common: ['name', 'system.description', 'system.source' ],
  ancestry: [],
  path: [],
  feature: [],
  item: [ 'system.type', ],
  talent: [],
  spell: ['system.tradition', 'system.rank', 'system.spelltype', 'system.attribute'],
  creature: [],
  character: [],
  vehicle: [],
  table: []
}

let typeOptions = {} // eslint-disable-line no-unused-vars
let sourcesOptions = []  // eslint-disable-line no-unused-vars

export default class DLCompendiumBrowser extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: 'dl-compendium-browser',
    tag: 'form',
    form: {
      handler: this.onSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    },
    classes: ['demonlord-compendium-browser'],
    actions: {
      //searchCompendia: this.onSearchCompendia
    },
    window: {
      resizable: true
    },
    position: {
      width: 1000,
      height: 600,
    },
    scrollY: [],
    //editable: true
  }

  static PARTS = {
    search: { template: 'systems/demonlord/templates/compendium-browser/search.hbs' },

    // One part for each filter type
    //filterscharacter: { template: 'systems/demonlord/templates/compendium-browser/filters-character.hbs' },
    //filterscreature: { template: 'systems/demonlord/templates/compendium-browser/filters-creature.hbs' },
    //filtersvehicle: { template: 'systems/demonlord/templates/compendium-browser/filters-vehicle.hbs' },
    //filtersancestry: { template: 'systems/demonlord/templates/compendium-browser/filters-ancestry.hbs' },
    //filtersammo: { template: 'systems/demonlord/templates/compendium-browser/filters-ammo.hbs' },
    //filtersarmor: { template: 'systems/demonlord/templates/compendium-browser/filters-armor.hbs' },
    //filterscreaturerole: { template: 'systems/demonlord/templates/compendium-browser/filters-creaturerole.hbs' },
    //filtersendoftheround: { template: 'systems/demonlord/templates/compendium-browser/filters-endoftheround.hbs' },
    //filtersfeature: { template: 'systems/demonlord/templates/compendium-browser/filters-feature.hbs' },
    //filtersitem: { template: 'systems/demonlord/templates/compendium-browser/filters-item.hbs' },
    //filterslanguage: { template: 'systems/demonlord/templates/compendium-browser/filters-language.hbs' },
    //filterspath: { template: 'systems/demonlord/templates/compendium-browser/filters-path.hbs' },
    //filtersprofession: { template: 'systems/demonlord/templates/compendium-browser/filters-profession.hbs' },
    //filtersrelic: { template: 'systems/demonlord/templates/compendium-browser/filters-relic.hbs' },
    //filtersspecialaction: { template: 'systems/demonlord/templates/compendium-browser/filters-specialaction.hbs' },
    filtersspell: { template: 'systems/demonlord/templates/compendium-browser/filters-spell.hbs' },
    filterstalent: { template: 'systems/demonlord/templates/compendium-browser/filters-talent.hbs' },
    //filtersweapon: { template: 'systems/demonlord/templates/compendium-browser/filters-weapon.hbs' },

    // One part for each result type
    //resultscharacter: { template: 'systems/demonlord/templates/compendium-browser/results-character.hbs' },
    //resultscreature: { template: 'systems/demonlord/templates/compendium-browser/results-creature.hbs' },
    //resultsvehicle: { template: 'systems/demonlord/templates/compendium-browser/results-vehicle.hbs' },
    //resultsancestry: { template: 'systems/demonlord/templates/compendium-browser/results-ancestry.hbs' },
    //resultsammo: { template: 'systems/demonlord/templates/compendium-browser/results-ammo.hbs' },
    //resultsarmor: { template: 'systems/demonlord/templates/compendium-browser/results-armor.hbs' },
    //resultscreaturerole: { template: 'systems/demonlord/templates/compendium-browser/results-creaturerole.hbs' },
    //resultsendoftheround: { template: 'systems/demonlord/templates/compendium-browser/results-endoftheround.hbs' },
    //resultsfeature: { template: 'systems/demonlord/templates/compendium-browser/results-feature.hbs' },
    //resultsitem: { template: 'systems/demonlord/templates/compendium-browser/results-item.hbs' },
    //resultslanguage: { template: 'systems/demonlord/templates/compendium-browser/results-language.hbs' },
    //resultspath: { template: 'systems/demonlord/templates/compendium-browser/results-path.hbs' },
    //resultsprofession: { template: 'systems/demonlord/templates/compendium-browser/results-profession.hbs' },
    //resultsrelic: { template: 'systems/demonlord/templates/compendium-browser/results-relic.hbs' },
    //resultsspecialaction: { template: 'systems/demonlord/templates/compendium-browser/results-specialaction.hbs' },
    resultsspell: { template: 'systems/demonlord/templates/compendium-browser/results-spell.hbs' },
    resultstalent: { template: 'systems/demonlord/templates/compendium-browser/results-talent.hbs' },
    //resultsweapon: { template: 'systems/demonlord/templates/compendium-browser/results-weapon.hbs' },
  }

  state = {
    sources: [],
    search: {
      text: '',
      type: 'spell',
      sources: [],
      caseSensitive: false
    },
    filters: {
      character: {
        description: '',
        ancestry: '',
        path: [],
        isPC: null,
        level: null, // 0-X
        professions: [],
        //attributes: ?
        // characteristics: ?
      },
      creature: {
        description: '',
        type: '',
        difficulty: null,
        isFrightening: null,
        isHorrifying: null,
        roles: [],
        perceptionSenses: [],
        //attributes: ?
        // characteristics: ?
      },
      vehicle: {
        description: '',
        price: null,
        cargo: null,
        //attributes: ?
        // characteristics: ?
      },
      ancestry: {
        description: '',
        levels: null, // 1-X
        isMagic: null, // system.levels.some(l => l.spells.length > 0) or system.levels.some(l => l.magic)
        //attributes: ?
        // characteristics: ?
      },
      ammo: {
        description: '',
        properties: '',
        availability: '', // C/E/R/U
        value: ''
      },
      armor: {
        description: '',
        properties: '',
        availability: '', // C/E/R/U
        value: '',
        defense: '',
        agility: '',
        fixed: '',
        requirement: [], // TODO [ { attribute: '', min: 0 } ]
        isShield: null
      },
      creaturerole: {
        description: '',
        isFrightening: null,
        isHorrifying: null,
        //attributes: ?
        // characteristics: ?
      },
      endoftheround: {
        description:  '',
        isHealing:  null, // Whether it has system.healing.healactive
        isDamage:  null, // Whether it has system.action.damage* (any of them)
      },
      feature: {
        description: '',
      },
      item: {
        description: '',
        properties: '',
        isConsumable: null,
        consumableType: '',
        availability: '', // C/E/R/U
        value: '',

      },
      language: {
        description: '',
      },
      path: {
        description: '',
        levels: null, // 1-X
        isMagic: null, // system.levels.some(l => l.spells.length > 0) or system.levels.some(l => l.magic)
        pathType: '', // Novice, Expert, Master, Legendary
        //attributes: ?
        // characteristics: ?
      },
      profession: {
        description: '',
      },
      relic: {
        description: '',
        requirement: [], // TODO [ { attribute: '', min: 0 } ]
      },
      specialaction: {
        description: '',
      },
      spell: {
        description: '',
        tradition: '',
        rank: null, // 0-9
        type: '', // Attack/Utility
        attribute: '', // Intellect/Will
        isTriggered: null, // Whether it has system.triggered
        isHealing: null, // Whether it has system.healing.healactive
        isDamage: null, // Whether it has system.action.damage* (any of them)
        hasChallenge: null,
        // isInsanity: null, // Future, whether it deals insanity damage
        // isCorruption: null, // Future, whether it deals corruption damage

      },
      talent: {
        description: '',
        isTriggered: null, // Whether it has system.triggered
        isHealing: null, // Whether it has system.healing.healactive
        isDamage: null, // Whether it has system.action.damage* (any of them)
        hasChallenge: null,
        hasUses: null,
        // isInsanity: null, // Future, whether it deals insanity damage
        // isCorruption: null, // Future, whether it deals corruption damage

      },
      weapon: {
        description: '',
        requirement: [], // TODO [ { attribute: '', min: 0 } ]
        availability: '', // C/E/R/U
        value: '',
        usesAmmo: null,
      },
    }
  }

  get title() {
    return game.i18n.localize('DL.CompendiumBrowser')
  }

  // #region Data Preparation

  /** @override */
  /*_configureRenderOptions(options) {
    super._configureRenderOptions(options);

    // These parts are always rendered
    options.parts = ['search']


    if (this.state.search.type) {
      // Add parts depending on the current selected  type (in search)
      options.parts.push(`filters${this.state.search.type}`)
      options.parts.push(`results${this.state.search.type}`)
    }

    // Finally, adjust the window position according to the type
    // this._adjustSizeByItemType(this.document.type, this.position) // Maybe not needed
  }*/

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options)

    // x.metadata.label includes a user-friendly name
    // Should also be filtered by ownership (i.e. prevent players from seeing compendia where they're not at least observer)
    // Retrieve specific pack with game.packs.get(x.metadata.id)
    // Filter for specific type with x.filter(p => p.index.some(e => e.type === 'creature'))
    // Finally, open wanted document with (await game.packs.get(x.pack).getDocument(x._id)).sheet.render()
    // TODO: Prepare specific indices for each type which allows us to quickly list and filter them
    this.state.sources = await Promise.all(game.packs.filter(p => ['Item', 'Actor', 'RollTable'].includes(p.metadata.type)).map(async p => await game.packs.get(p.metadata.id)))

    if (options.isFirstRender) {
      typeOptions = {
        'ammo': game.i18n.localize('TYPES.Item.ammo'),
        'ancestry': game.i18n.localize('TYPES.Item.ancestry'),
        'armor': game.i18n.localize('TYPES.Item.armor'),
        'creaturerole': game.i18n.localize('TYPES.Item.creaturerole'),
        'endoftheround': game.i18n.localize('TYPES.Item.endoftheround'),
        'feature': game.i18n.localize('TYPES.Item.feature'),
        'item': game.i18n.localize('TYPES.Item.item'),
        'language': game.i18n.localize('TYPES.Item.language'),
        'path': game.i18n.localize('TYPES.Item.path'),
        'profession': game.i18n.localize('TYPES.Item.profession'),
        'relic': game.i18n.localize('TYPES.Item.relic'),
        'specialaction': game.i18n.localize('TYPES.Item.specialaction'),
        'spell': game.i18n.localize('TYPES.Item.spell'),
        'talent': game.i18n.localize('TYPES.Item.talent'),
        'weapon': game.i18n.localize('TYPES.Item.weapon'),
      }

      sourcesOptions = {
        'world': game.i18n.localize('PACKAGE.Type.world'),
        'system': game.i18n.localize('PACKAGE.Type.system'),
      }

      var uniqueModules = game.packs.filter(p => p.metadata.packageType === 'module') // Modules
        .map(p => p.metadata.packageName) // Module names
        .filter((e, i, a) => a.indexOf(e) === i) // Unique

      for (const moduleId of uniqueModules) {
        sourcesOptions[moduleId] = game.modules.get(moduleId).title
      }

      await this.indexCompendia(this.state.sources)
    }
    context.typeOptions = typeOptions
    context.sourcesOptions = sourcesOptions

    context.isGM = game.user.isGM

    // Prepare search
    context.search = {
      text: this.state.search.text,
      type: this.state.search.type,
      sources: this.state.search.sources,
      caseSensitive: this.state.search.caseSensitive,
    }

    // Prepare filters (stored per type)
    context.filters = {
      character: {
        description: this.state.filters?.character?.description || '',
        ancestry: this.state.filters?.character?.ancestry || '',
        path: this.state.filters?.character?.path || [],
        isPC: this.state.filters?.character?.isPC || null,
        level: this.state.filters?.character?.level || null, // 0-X
        professions: this.state.filters?.character?.professions || [],
        //attributes: ?
        // characteristics: ?
      },
      creature: {
        description: this.state.filters?.creature?.description ||'',
        type: this.state.filters?.creature?.type ||'',
        difficulty: this.state.filters?.creature?.difficulty ||null,
        isFrightening: this.state.filters?.creature?.isFrightening ||null,
        isHorrifying: this.state.filters?.creature?.isHorrifying ||null,
        roles: this.state.filters?.creature?.roles ||[],
        perceptionSenses: this.state.filters?.creature?.perceptionSenses ||[],
        //attributes: ?
        // characteristics: ?
      },
      vehicle: {
        description: this.state.filters?.vehicle?.description || '',
        price: this.state.filters?.vehicle?.price || null,
        cargo: this.state.filters?.vehicle?.cargo || null,
        //attributes: ?
        // characteristics: ?
      },
      ancestry: {
        description: this.state.filters?.ancestry?.description || '',
        levels: this.state.filters?.ancestry?.levels || null, // 1-X
        isMagic: this.state.filters?.ancestry?.isMagic || null, // system.levels.some(l => l.spells.length > 0) or system.levels.some(l => l.magic)
        //attributes: ?
        // characteristics: ?
      },
      ammo: {
        description: this.state.filters?.ammo?.description || '',
        properties: this.state.filters?.ammo?.properties || '',
        availability: this.state.filters?.ammo?.availability || '', // C/E/R/U
        value: this.state.filters?.ammo?.value || ''
      },
      armor: {
        description: this.state.filters?.armor?.description ||'',
        properties: this.state.filters?.armor?.properties ||'',
        availability: this.state.filters?.armor?.availability ||'', // C/E/R/U
        value: this.state.filters?.armor?.value ||'',
        defense: this.state.filters?.armor?.defense ||'',
        agility: this.state.filters?.armor?.agility ||'',
        fixed: this.state.filters?.armor?.fixed ||'',
        requirement: this.state.filters?.armor?.requirement ||[], // TODO [ { attribute: '', min: 0 } ]
        isShield: this.state.filters?.armor?.isShield ||null
      },
      creaturerole: {
        description: this.state.filters?.creaturerole?.description ||'',
        isFrightening: this.state.filters?.creaturerole?.isFrightening ||null,
        isHorrifying: this.state.filters?.creaturerole?.isHorrifying ||null,
        //attributes: ?
        // characteristics: ?
      },
      endoftheround: {
        description: this.state.filters?.endoftheround?.description || '',
        isHealing: this.state.filters?.endoftheround?.isHealing || null, // Whether it has system.healing.healactive
        isDamage: this.state.filters?.endoftheround?.isDamage || null, // Whether it has system.action.damage* (any of them)
      },
      feature: {
        description: this.state.filters?.feature?.description ||'',
      },
      item: {
        description: this.state.filters?.item?.description ||'',
        properties: this.state.filters?.item?.properties ||'',
        isConsumable: this.state.filters?.item?.isConsumable ||null,
        consumableType: this.state.filters?.item?.consumableType ||'',
        availability: this.state.filters?.item?.availability ||'', // C/E/R/U
        value: this.state.filters?.item?.value ||'',

      },
      language: {
        description: this.state.filters?.language?.description || '',
      },
      path: {
        description: this.state.filters?.path?.description || '',
        levels: this.state.filters?.path?.levels || null, // 1-X
        isMagic: this.state.filters?.path?.isMagic || null, // system.levels.some(l => l.spells.length > 0) or system.levels.some(l => l.magic)
        pathType: this.state.filters?.path?.pathType || '', // Novice, Expert, Master, Legendary
        //attributes: ?
        // characteristics: ?
      },
      profession: {
        description: this.state.filters?.profession?.description ||'',
      },
      relic: {
        description: this.state.filters?.relic?.description || '',
        requirement: this.state.filters?.relic?.requirement || [], // TODO [ { attribute: '', min: 0 } ]
      },
      specialaction: {
        description: this.state.filters?.specialaction?.description ||'',
      },
      spell: {
        description: this.state.filters?.spell?.description || '',
        tradition: this.state.filters?.spell?.tradition || '',
        rank: this.state.filters?.spell?.rank || null, // 0-9
        type: this.state.filters?.spell?.type || '', // Attack/Utility
        attribute: this.state.filters?.spell?.attribute || '', // Intellect/Will
        isTriggered: this.state.filters?.spell?.isTriggered || null, // Whether it has system.triggered
        isHealing: this.state.filters?.spell?.isHealing || null, // Whether it has system.healing.healactive
        isDamage: this.state.filters?.spell?.isDamage || null, // Whether it has system.action.damage* (any of them)
        hasChallenge: this.state.filters?.spell?.hasChallenge || null,
        // isInsanity: null, // Future, whether it deals insanity damage
        // isCorruption: null, // Future, whether it deals corruption damage

      },
      talent: {
        description: this.state.filters?.talent?.description || '',
        isTriggered: this.state.filters?.talent?.isTriggered || null, // Whether it has system.triggered
        isHealing: this.state.filters?.talent?.isHealing || null, // Whether it has system.healing.healactive
        isDamage: this.state.filters?.talent?.isDamage || null, // Whether it has system.action.damage* (any of them)
        hasChallenge: this.state.filters?.talent?.hasChallenge || null,
        hasUses: this.state.filters?.talent?.hasUses || null,
        // isInsanity: null, // Future, whether it deals insanity damage
        // isCorruption: null, // Future, whether it deals corruption damage

      },
      weapon: {
        description: this.state.filters?.weapon?.description || '',
        requirement: this.state.filters?.weapon?.requirement || [], // TODO [ { attribute: '', min: 0 } ]
        availability: this.state.filters?.weapon?.availability || '', // C/E/R/U
        value: this.state.filters?.weapon?.value || '',
        usesAmmo: this.state.filters?.weapon?.usesAmmo || null,
      },
    }


    // Search items in sources with filters
    context.results = await this.filterItems(this.state.sources, this.state.search, this.state.filters)

    return context
  }

  // #endregion

  // #region Actions

  /**
   * Handles all specific item changes
   * @override */
  static async onSubmit(event, form, formData) {
    const data = foundry.utils.expandObject(formData.object)

    this.state.search = foundry.utils.mergeObject(this.state.search, data.search)
    this.state.filters = foundry.utils.mergeObject(this.state.filters, data.filters)

    await this.render()
  }

  // #endregion

  // #region Other Functions

  async indexCompendia(compendia) {
    return await Promise.all(compendia.map(async compendium => {
      const itemType = compendium.index.filter(Boolean)[0]?.type

      if (!itemType) return

      const index = indices.common.concat(indices[itemType]).filter(Boolean)
      return await compendium.getIndex({ fields: index })
    }))
  }

  async filterItems(compendia, search, filters) {
    // Deal with quick returns
    if (!search.type) return []

    // TODO: Filter by source...
    let sources = compendia.filter(p => search.sources.length === 0 ||
      (p.metadata.packageType === 'module' && search.sources.includes(p.metadata.packageName)) || // Module selected
      (p.metadata.packageType === 'world' && search.sources.includes('world')) || // World selected
      (p.metadata.packageType === 'system' && search.sources.includes('system')) // System selected
    )

    // ...search type...
    let results = sources.filter(p => p?.index?.filter(Boolean)?.[0]?.type === search.type)
    .flatMap(p => p.index.filter(Boolean))

    // ...searched text
    if (search.text) {
      if (search.caseSensitive) {
        results = results.filter(e => e.name.indexOf(search.text) >= 0 || e.system.description?.indexOf(filters.text) >= 0)
      } else {
        results = results.filter(e => e.name.toLowerCase().includes(search.text.toLowerCase()) || e.system.description?.toLowerCase()?.indexOf(search.text.toLowerCase()) >= 0)
      }
    }

    // ...and type-specific filters
    switch (search.type) {
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
          if (filters?.spell?.tradition && e.system.tradition !== filters.spell.tradition) return false
          if (filters?.spell?.rank !== null && e.system.rank !== filters.spell.rank) return false
          if (filters?.spell?.type && e.system.spelltype !== filters.spell.type) return false
          if (filters?.spell?.attribute && e.system.attribute !== filters.spell.attribute) return false

          // TODO: Bool filters
          //if (filters?.spell?.isTriggered !== null && !e.system.triggered) return false

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

  // #endregion
}
