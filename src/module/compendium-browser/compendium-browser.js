const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
const { DragDrop } = foundry.applications.ux //eslint-disable-line no-shadow

const indices = {
  common: ['name', 'system.description', 'system.source' ],
  ancestry: ['system.magic'],
  path: ['system.type', 'system.magic'],
  ammo: ['system.availability', 'system.properties', 'system.value'],
  armor: ['system.availability', 'system.requirement.attribute', 'system.isShield', 'system.properties', 'system.value'],
  creaturerole: ['system.frightening', 'system.horrifying'],
  endoftheround: ['system.healing.healing', 'system.action.damage'],
  feature: [],
  item: ['system.consumabletype', 'system.availability', 'system.properties', 'system.value'],
  talent: ['system.groupname', 'system.triggered', 'system.healing.healing', 'system.action.damage', 'system.action.defense', 'system.activatedEffect.uses.max'],
  relic: ['system.requirement.attribute'],
  spell: ['system.tradition', 'system.rank', 'system.spelltype', 'system.attribute', 'system.triggered', 'system.healing.healing', 'system.action.damage', 'system.action.defense', 'system.activatedEffect.uses.max' ],
  weapon: ['system.availability', 'system.requirement.attribute', 'system.properties', 'system.value'],
  creature: ['system.descriptor', 'system.difficulty', 'system.perceptionsenses', 'system.frightening', 'system.horrifying', 'system.characteristics.power'],
  character: ['system.descriptor', 'system.characteristics.power', 'system.isPC'],
  vehicle: ['system.descriptor',],
  table: []
}

let typeOptions = {}
let sourcesOptions = {}
let spellTypeOptions = {}
let spellAttributeOptions = {}
let consumableTypeOptions = {}
let availabilityOptions = {}
let pathTypeOptions = {}
let magicOptions = {}
let frighteningOptions = {}
let characterOptions = {}

export default class DLCompendiumBrowser extends HandlebarsApplicationMixin(ApplicationV2) {
  #dragDrop

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
      editItem: this.onEditItem,
    },
    window: {
      resizable: true
    },
    position: {
      width: 1000,
      height: 700,
    },
    scrollY: [],
    //editable: true,
    dragDrop: [{
      dragSelector: '[data-drag="true"]',
      dropSelector: '.drop-zone'
    }]
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

  state = {
    sources: [],
    search: {
      text: '',
      type: 'path',
      sources: [],
      caseSensitive: false,
      includeLocal: false,
      sortColumn: 'name',
      sortType: 'asc' // asc/desc
    },
    filters: {
      character: {
        description: '',
        ancestry: '',
        path: [],
        characterType: null,
        level: null, // 0-X
        professions: [],
        usesMagic: false,
        //attributes: ?
        // characteristics: ?
      },
      creature: {
        description: '',
        difficulty: null,
        frighteningType: null,
        descriptor: '',
        perceptionSenses: '',
        //attributes: ?
        // characteristics: ?
      },
      vehicle: {
        description: '',
        price: null,
        cargo: null,
        descriptor: '',
        //attributes: ?
        // characteristics: ?
      },
      ancestry: {
        description: '',
        usesMagic: null, // system.levels.some(l => l.spells.length > 0) or system.levels.some(l => l.magic)
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
        hasRequirement: false,
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
        usesMagic: null, // system.levels.some(l => l.spells.length > 0) or system.levels.some(l => l.magic)
        type: '', // Novice, Expert, Master, Legendary
        //attributes: ?
        // characteristics: ?
      },
      profession: {
        description: '',
      },
      relic: {
        description: '',
        hasRequirement: false,
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
        groupname: '',
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
        availability: '', // C/E/R/U
        value: '',
        hasRequirement: false,
        usesAmmo: null,
      },
    }
  }

  constructor(options = {}) {
    super(options)
    this.#dragDrop = this.#createDragDropHandlers()
  }

  #createDragDropHandlers() {
    return this.options.dragDrop.map(d => {
      d.permissions = {
        dragtart: this.canDragStart.bind(this),
        drop: this.canDragDrop.bind(this)
      }
      d.callbacks = {
        dragstart: this.onDragStart.bind(this),
      }

      return new DragDrop(d)
    })
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

    // Filter packs by type
    this.state.sources = await Promise.all(game.packs.filter(p => ['Item', 'Actor', 'RollTable'].includes(p.metadata.type)).map(async p => await game.packs.get(p.metadata.id)))

    if (options.isFirstRender) {
      typeOptions = {
        'character': game.i18n.localize('DL.CharacterTitle'),
        'creature': game.i18n.localize('TYPES.Actor.creature'),
        'vehicle': game.i18n.localize('TYPES.Actor.vehicle'),

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

      spellTypeOptions = {
        'Attack': game.i18n.localize('DL.SpellTypeAttack'),
        'Utility': game.i18n.localize('DL.SpellTypeUtility'),
      }

      spellAttributeOptions = {
        //'strength': game.i18n.localize('DL.AttributeStrength'),
        //'agility': game.i18n.localize('DL.AttributeAgility'),
        'intellect': game.i18n.localize('DL.AttributeIntellect'),
        'will': game.i18n.localize('DL.AttributeWill'),
      }

      consumableTypeOptions = {
        'None': game.i18n.localize('DL.ConsumableNone'),
        'D': game.i18n.localize('DL.ConsumableTypeD'),
        'F': game.i18n.localize('DL.ConsumableTypeF'),
        'P': game.i18n.localize('DL.ConsumableTypeP'),
        'T': game.i18n.localize('DL.ConsumableTypeT'),
        'V': game.i18n.localize('DL.ConsumableTypeV'),
      }

      availabilityOptions = {
        'C': game.i18n.localize('DL.AvailabilityC'),
        'U': game.i18n.localize('DL.AvailabilityU'),
        'R': game.i18n.localize('DL.AvailabilityR'),
        'E': game.i18n.localize('DL.AvailabilityE'),
      }

      pathTypeOptions = {
        'novice': game.i18n.localize('DL.CharPathNovice'),
        'expert': game.i18n.localize('DL.CharPathExpert'),
        'master': game.i18n.localize('DL.CharPathMaster'),
        'legendary': game.i18n.localize('DL.CharPathLegendary'),
      }

      magicOptions = {
        'yes': game.i18n.localize('DL.DialogYes'),
        'no': game.i18n.localize('DL.DialogNo'),
      }

      frighteningOptions = {
        'any': game.i18n.localize('DL.Any'),
        'none': game.i18n.localize('DL.None'),
        'frightening': game.i18n.localize('DL.CreatureFrightening'),
        'horrifying': game.i18n.localize('DL.CreatureHorrifying')
      }

      characterOptions = {
        'pc': game.i18n.localize('DL.ActorTypePC'),
        'npc': game.i18n.localize('DL.ActorTypeNPC'),
      }

      await this.indexCompendia(this.state.sources)
    }

    context.typeOptions = typeOptions
    context.sourcesOptions = sourcesOptions
    context.spellTypeOptions = spellTypeOptions
    context.spellAttributeOptions = spellAttributeOptions
    context.consumableTypeOptions = consumableTypeOptions
    context.availabilityOptions = availabilityOptions
    context.pathTypeOptions = pathTypeOptions
    context.magicOptions = magicOptions
    context.frighteningOptions = frighteningOptions
    context.characterOptions = characterOptions

    context.isGM = game.user.isGM

    // Prepare search
    context.search = {
      text: this.state.search.text,
      type: this.state.search.type,
      sources: this.state.search.sources,
      caseSensitive: this.state.search.caseSensitive,
      includeLocal: this.state.search.includeLocal,
      sortColumn: this.state.search.sortColumn,
      sortType: this.state.search.sortType
    }

    // Prepare filters (stored per type)
    context.filters = {
      character: {
        description: this.state.filters?.character?.description || '',
        ancestry: this.state.filters?.character?.ancestry || '',
        //path: this.state.filters?.character?.path || [],
        characterType: this.state.filters?.character?.characterType || null,
        level: this.state.filters?.character?.level || null, // 0-X
        usesMagic: this.state.filters?.character?.usesMagic || '',
        //professions: this.state.filters?.character?.professions || [],
        //attributes: ?
        // characteristics: ?
      },
      creature: {
        description: this.state.filters?.creature?.description || '',
        type: this.state.filters?.creature?.type || '',
        difficulty: this.state.filters?.creature?.difficulty || null,
        frighteningType: this.state.filters?.creature?.frighteningType || null,
        roles: this.state.filters?.creature?.roles || '',
        descriptor: this.state.filters?.creature?.descriptor || '',
        perceptionSenses: this.state.filters?.creature?.perceptionSenses || '',
        usesMagic: this.state.filters?.creature?.usesMagic || '',
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
        usesMagic: this.state.filters?.ancestry?.usesMagic || null, // system.levels.some(l => l.spells.length > 0) or system.levels.some(l => l.magic)
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
        description: this.state.filters?.armor?.description || '',
        properties: this.state.filters?.armor?.properties || '',
        availability: this.state.filters?.armor?.availability || '', // C/E/R/U
        value: this.state.filters?.armor?.value || '',
        defense: this.state.filters?.armor?.defense || '',
        agility: this.state.filters?.armor?.agility ||'',
        fixed: this.state.filters?.armor?.fixed || '',
        hasRequirement: this.state.filters?.armor?.hasRequirement || false, // TODO [ { attribute: '', min: 0 } ]
        isShield: this.state.filters?.armor?.isShield || null
      },
      creaturerole: {
        description: this.state.filters?.creaturerole?.description || '',
        frighteningType: this.state.filters?.creaturerole?.frighteningType || null,
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
        description: this.state.filters?.item?.description || '',
        properties: this.state.filters?.item?.properties || '',
        consumableType: this.state.filters?.item?.consumableType || '',
        availability: this.state.filters?.item?.availability || '', // C/E/R/U
        value: this.state.filters?.item?.value || '',
      },
      language: {
        description: this.state.filters?.language?.description || '',
      },
      path: {
        description: this.state.filters?.path?.description || '',
        usesMagic: this.state.filters?.path?.usesMagic || null, // system.levels.some(l => l.spells.length > 0) or system.levels.some(l => l.magic)
        type: this.state.filters?.path?.type || '', // Novice, Expert, Master, Legendary
        //attributes: ?
        // characteristics: ?
      },
      profession: {
        description: this.state.filters?.profession?.description ||'',
      },
      relic: {
        description: this.state.filters?.relic?.description || '',
        hasRequirement: this.state.filters?.relic?.hasRequirement || false,
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
        groupname: this.state.filters?.talent?.groupname || '',
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
        availability: this.state.filters?.weapon?.availability || '', // C/E/R/U
        value: this.state.filters?.weapon?.value || '',
        hasRequirement: this.state.filters?.weapon?.hasRequirement || false,
        usesAmmo: this.state.filters?.weapon?.usesAmmo || null,
      },
    }

    // Search items in sources with filters
    context.results = await this.filterItems(this.state.sources, this.state.search, this.state.filters)

    // And sort them
    context.results = await this.sortItems(context.results, this.state.search)

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

  static async onEditItem(event) {
    const id = event.target.closest('[data-item-id]').dataset.itemId
    const item = await fromUuid(id)
    item.sheet.render(true)
  }

  canDragStart() {
    return true
  }

  canDragDrop() {
    return true
  }

  onDragStart(ev) {
    const itemId = ev.currentTarget.closest('[data-item-id]').dataset.itemId
    if (ev.type == 'dragstart') {
      const dragData = { type: 'Item', 'uuid': itemId }
      ev.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }
  }

  /** @override */
  async _onRender(context, options) {
    super._onRender(context, options)
    this.#dragDrop.forEach(d => d.bind(this.element))

    let e = this.element

    e.querySelectorAll('.sortable')?.forEach(s => {
      s.addEventListener('click', async ev => {
        const column = ev.currentTarget
        const columnAsc = column.classList.contains('asc')

        // Remove asc/desc class from other columns and add it on this one
        e.querySelectorAll('.sortable')?.forEach(ce => {
          ce.classList.remove('asc')
          ce.classList.remove('desc')
        })

        column.classList.add(columnAsc ? 'desc' : 'asc')

        // Add the sort properties
        this.state.search.sortType = columnAsc ? 'desc' : 'asc';
        this.state.search.sortColumn = column.dataset.sortProperty

        // Re-render, we'll sort there
        await this.render({ parts: ['results' + context.search.type] })
      })
    })
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

    let results = []
    // Grab all world objects (not in a compendium)
    if (search.includeLocal) {
      results = results.concat(game.items.contents, game.actors.contents, game.tables.contents).filter(e => e.type === search.type)
    }

    // Filter by source...
    let sources = compendia.filter(p => search.sources.length === 0 ||
      (p.metadata.packageType === 'module' && search.sources.includes(p.metadata.packageName)) || // Module selected
      (p.metadata.packageType === 'world' && search.sources.includes('world')) || // World selected
      (p.metadata.packageType === 'system' && search.sources.includes('system')) // System selected
    )

    // ...search type...
    results = results.concat(sources.filter(p => p?.index?.filter(Boolean)?.[0]?.type === search.type)
      .flatMap(p => p.index.filter(Boolean)))

    // ...searched text
    if (search.text) {
      if (search.caseSensitive) {
        //results = results.filter(e => e.name.indexOf(search.text) >= 0 || e.system.description?.indexOf(filters.text) >= 0)
        results = results.filter(e => e.name.indexOf(search.text) >= 0)
        results = results.filter(e => e.description.indexOf(filters[search.type].description) >= 0)
      } else {
        //results = results.filter(e => e.name.toLowerCase().includes(search.text.toLowerCase()) || e.system.description?.toLowerCase()?.indexOf(search.text.toLowerCase()) >= 0)
        results = results.filter(e => e.name.toLowerCase().includes(search.text.toLowerCase()))
        results = results.filter(e => e.description.toLowerCase().includes(filters[search.type].description.toLowerCase()))
      }
    }

    // ...and type-specific filters
    switch (search.type) {
      case 'character':
        results = results.filter(e => {
          if (filters?.character.level && e.system.level !== parseInt(filters.character.level)) return false
          if (!!filters?.character?.usesMagic && (e.system.characteristics.power > 0 ? filters.character.usesMagic !== 'yes' : filters.character.usesMagic !== 'no')) return false
          if (!!filters?.character.characterType && (e.system.isPC ? filters.character.characterType !== 'pc' : filters.character.characterType !== 'npc')) return false

          return true
        })
        break
      case 'creature':
        results = results.filter(e => {
          if (filters?.creature.difficulty && e.system.difficulty !== filters.creature.difficulty) return false
          if (filters?.creature.descriptor && !e.system.descriptor.includes(filters.creature.descriptor)) return false
          if (filters?.creature.perceptionSenses && !e.system.perceptionsenses?.toLowerCase()?.includes(filters.creature.perceptionSenses.toLowerCase())) return false
          if (!!filters?.creature?.usesMagic && (e.system.characteristics.power > 0 ? filters.creature.usesMagic !== 'yes' : filters.creature.usesMagic !== 'no')) return false

          if (filters?.creature.frighteningType === 'none' && (e.system.frightening || e.system.horrifying)) return false
          if (filters?.creature.frighteningType === 'any' && (!e.system.frightening && !e.system.horrifying)) return false
          if (filters?.creature.frighteningType === 'frightening' && !e.system.frightening) return false
          if (filters?.creature.frighteningType === 'horrifying' && !e.system.horrifying) return false

          return true
        })
        break
      case 'vehicle':
        results = results.filter(e => {
          if (filters?.vehicle.difficulty && e.system.difficulty !== filters.vehicle.difficulty) return false
          if (filters?.vehicle.descriptor && !e.system.descriptor.includes(filters.vehicle.descriptor)) return false

          return true
        })
        break
      case 'ancestry':
        results = results.filter(e => {
          if (!!filters?.ancestry?.usesMagic && (e.system.magic ? filters.ancestry.usesMagic !== 'yes' : filters.ancestry.usesMagic !== 'no')) return false

          return true
        })
        break
      case 'ammo':
        results = results.filter(e => {
          if (filters?.armor?.availability && e.system.availability !== filters.armor.availability) return false

          if (filters?.armor?.properties && !e.system.properties.toLowerCase().includes(filters.armor.properties.toLowerCase())) return false
          return true;
        })
        break
      case 'armor':
        results = results.filter(e => {
          if (filters?.armor?.availability && e.system.availability !== filters.armor.availability) return false

          if (filters?.armor?.hasRequirement && !e.system.requirement.attribute) return false
          if (filters?.armor?.isShield && !e.system.isShield) return false
          if (filters?.armor?.properties && !e.system.properties.toLowerCase().includes(filters.armor.properties.toLowerCase())) return false

          return true
        })
        break
      case 'creaturerole':
        results = results.filter(e => {
          if (filters?.creaturerole.frighteningType === 'none' && (e.system.frightening || e.system.horrifying)) return false
          if (filters?.creaturerole.frighteningType === 'any' && (!e.system.frightening && !e.system.horrifying)) return false
          if (filters?.creaturerole.frighteningType === 'frightening' && !e.system.frightening) return false
          if (filters?.creaturerole.frighteningType === 'horrifying' && !e.system.horrifying) return false

          return true
        })
        break
      case 'endoftheround':
        results = results.filter(e => {
          if (filters?.endoftheround?.isHealing && !e.system.healing.healing) return false
          if (filters?.endoftheround?.isDamage && !e.system.action.damage) return false

          return true
        })
        break
      case 'feature':
        // NA
        break
      case 'item':
        results = results.filter(e => {
          if (filters?.item?.availability && e.system.availability !== filters.item.availability) return false
          if (filters?.item?.consumableType && e.system.consumableType !== filters.item.consumableType) return false

          return true
        })
        break
      case 'language':
        // NA
        break
      case 'path':
        results = results.filter(e => {
          if (filters?.path?.type && e.system.type !== filters.path.type) return false

          if (!!filters?.path?.usesMagic && (e.system.magic ? filters.path.usesMagic !== 'yes' : filters.path.usesMagic !== 'no')) return false

          return true
        })
        break
      case 'profession':
        // NA
        break
      case 'relic':
        results = results.filter(e => {
          if (filters?.relic?.hasRequirement && !e.system.requirement.attribute) return false

          return true
        })
        break
      case 'specialaction':
        // NA
        break
      case 'spell':
        results = results.filter(e => {
          if (filters?.spell?.tradition && e.system.tradition !== filters.spell.tradition) return false
          if (filters?.spell?.rank !== null && e.system.rank !== filters.spell.rank) return false
          if (filters?.spell?.type && e.system.spelltype !== filters.spell.type) return false
          if (filters?.spell?.attribute && e.system.attribute !== filters.spell.attribute) return false

          if (filters?.spell?.isTriggered && !e.system.triggered) return false
          if (filters?.spell?.isHealing && !e.system.healing.healing) return false
          if (filters?.spell?.isDamage && !e.system.action.damage) return false
          if (filters?.spell?.hasChallenge && !e.system.action.defense) return false

          return true
        })
        break
      case 'talent':
        results = results.filter(e => {
          if (filters?.talent?.groupname && e.system.groupname !== filters.talent.groupname) return false

          if (filters?.talent?.isTriggered && !e.system.triggered) return false
          if (filters?.talent?.isHealing && !e.system.healing.healing) return false
          if (filters?.talent?.isDamage && !e.system.action.damage) return false
          if (filters?.talent?.hasChallenge && !e.system.action.defense) return false
          if (filters?.talent?.hasUses && !e.system.activatedEffect.uses.max) return false

          return true
        })
        break
      case 'weapon':
        results = results.filter(e => {
          if (filters?.weapon?.availability && e.system.availability != filters.weapon.availability) return false
          if (filters?.weapon?.value && e.system.consume.ammorequired != filters.weapon.value) return false

          if (filters?.weapon?.hasRequirement && !e.system.requirement.attribute) return false
          if (filters?.weapon?.usesAmmo && !e.system.consume.ammorequired) return false
          if (filters?.weapon?.properties && !e.system.properties.toLowerCase().includes(filters.weapon.properties.toLowerCase())) return false

          return true
        })
        break
    }

    return results
  }

  sortItems(items, search) {
    const isAsc = search.sortType === 'asc'

    // Sort by column and then by name if they're equal
    return items.sort((a, b) => {
      if (isAsc) {
        if (foundry.utils.getProperty(a, search.sortColumn) === foundry.utils.getProperty(b, search.sortColumn)) {
          return foundry.utils.getProperty(a, 'name') > foundry.utils.getProperty(b, 'name') ? 1 : -1
        } else {
          return foundry.utils.getProperty(a, search.sortColumn) > foundry.utils.getProperty(b, search.sortColumn) ? 1 : -1
        }
      } else {
        if (foundry.utils.getProperty(a, search.sortColumn) === foundry.utils.getProperty(b, search.sortColumn)) {
          return foundry.utils.getProperty(a, 'name') > foundry.utils.getProperty(b, 'name') ? -1 : 1
        } else {
          return foundry.utils.getProperty(a, search.sortColumn) > foundry.utils.getProperty(b, search.sortColumn) ? -1 : 1
        }
      }
    })
  }

  // #endregion
}
