import DLBaseActorSheet from './base-actor-sheet'
import { prepareActiveEffectCategories } from '../../active-effects/effects'
import { DemonlordItem } from '../../item/item'
import { handleLevelChange } from '../../item/nested-objects'

export default class DLCharacterSheet extends DLBaseActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['demonlord', 'sheet', 'actor'],
      width: 865,
      height: 670,
      tabs: [
        {
          navSelector: '.sheet-navigation',
          contentSelector: '.sheet-body',
          initial: 'character',
        },
        {
          navSelector: '.sheet-subnavigation',
          contentSelector: '.sheet-subbody',
          initial: 'general',
        },
      ],
      scrollY: ['.tab.active'],
    })
  }

  /** @override */
  get template() {
    if (!game.user.isGM && this.actor.limited) return 'systems/demonlord/templates/actor/limited-sheet.html'
    return 'systems/demonlord/templates/actor/actor-sheet.html'
  }

  /* -------------------------------------------- */
  /*  Data preparation                            */
  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData()

    // Effects categories
    data.ancestryEffects = prepareActiveEffectCategories(
      this.actor.effects.filter(effect => effect.data.flags?.sourceType === 'ancestry'),
    )
    delete data.ancestryEffects.temporary

    data.pathEffects = prepareActiveEffectCategories(
      this.actor.effects.filter(effect => effect.data.flags?.sourceType === 'path'),
    )
    delete data.pathEffects.temporary

    data.talentEffects = prepareActiveEffectCategories(
      this.actor.effects.filter(effect => effect.data.flags?.sourceType === 'talent'),
    )
    data.spellEffects = prepareActiveEffectCategories(
      this.actor.effects.filter(effect => effect.data.flags?.sourceType === 'spell'),
    )
    data.itemEffects = prepareActiveEffectCategories(
      this.actor.effects.filter(effect => ['armor', 'weapon', 'item'].indexOf(effect.data.flags?.sourceType) >= 0),
    )
    this.prepareItems(data)
    return data
  }

  /* -------------------------------------------- */

  /** @override */
  prepareItems(sheetData) {
    super.prepareItems(sheetData)
    const m = sheetData._itemsByType
    const actorData = sheetData.actor
    actorData.gear = m.get('item') || []
    actorData.armor = m.get('armor') || []
    actorData.ammo = m.get('ammo') || []
    actorData.ancestry = m.get('ancestry') || []
    actorData.professions = m.get('profession') || []
    actorData.languages = m.get('language') || ''
    actorData.paths = m.get('path') || []
    actorData.talentbook = this._prepareBook(actorData.talents, 'groupname', 'talents')

    // Sort paths
    actorData.paths = [
      ...actorData.paths.filter(p => p.data.type === 'novice'),
      ...actorData.paths.filter(p => p.data.type === 'expert'),
      ...actorData.paths.filter(p => p.data.type === 'master'),
    ]
  }

  /* -------------------------------------------- */
  /** @override */
  async checkDroppedItem(itemData) {
    const type = itemData.type
    if (['specialaction', 'endoftheround'].includes(type)) return false

    if (type === 'ancestry') {
      const currentAncestriesIds = this.actor.data?.ancestry?.map(a => a._id)
      if (currentAncestriesIds?.length > 0) await this.actor.deleteEmbeddedDocuments('Item', currentAncestriesIds)
      return true
    } else if (type === 'path' && this.actor.data.paths?.length >= 3) return false

    return true
  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */
  /* -------------------------------------------- */

  _onAncestryCreate() {
    const data = { name: 'New ancestry', type: 'ancestry' }
    DemonlordItem.create(data, { parent: this.document }).then(i => i.sheet.render(true))
  }

  async _onAncestryEdit(ev) {
    const div = $(ev.currentTarget)
    const ancestry = this.actor.getEmbeddedDocument('Item', div.data('itemId'))

    if (ev.button == 0) ancestry.sheet.render(true)
    else if (ev.button == 2) await ancestry.delete({ parent: this.actor })
  }

  /* -------------------------------------------- */

  async _onPathEdit(ev) {
    const div = $(ev.currentTarget)
    const path = this.actor.getEmbeddedDocument('Item', div.data('itemId'))

    if (ev.button == 0) path.sheet.render(true)
    else if (ev.button == 2) await path.delete({ parent: this.actor })
  }

  /* -------------------------------------------- */

  async _updateObject(event, formData) {
    const newLevel = formData['data.level']
    if (newLevel !== this.document.data.data.level) handleLevelChange(this.document, newLevel)
    return this.document.update(formData)
  }

  /* -------------------------------------------- */
  /*  Listeners                                   */
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)
    if (!this.options.editable) return

    // Corruption Roll
    html.find('.corruption-roll').click(_ => this.actor.rollCorruption())

    // Edit HealthBar, Insanity and Corruption
    html.find('.bar-edit').click(() => {
      const actor = this.actor
      const showEdit = actor.data.data.characteristics.editbar
      if (showEdit) actor.data.data.characteristics.editbar = false
      else actor.data.data.characteristics.editbar = true

      actor
        .update({
          'data.characteristics.editbar': actor.data.data.characteristics.editbar,
        })
        .then(_ => this.render())
    })

    // Health bar clicks
    html.on('mousedown', '.addDamage', ev => {
      if (ev.button == 0) this.actor.increaseDamage(+1)
      // Increase damage
      else if (ev.button == 2) this.actor.increaseDamage(-1) // Decrease damage
    })

    // Insanity bar click
    html.on('mousedown', '.addInsanity', ev => {
      let value = parseInt(this.actor.data.data.characteristics.insanity.value)
      const max = parseInt(this.actor.data.data.characteristics.insanity.max)
      if (ev.button == 0) {
        if (value >= max) value = 0
        else value++
      } else if (ev.button == 2) {
        if (value <= 0) value = 0
        else value--
      }
      this.actor.update({ 'data.characteristics.insanity.value': value }).then(_ => this.render())
    })

    // Corruption bar click
    html.on('mousedown', '.addCorruption', ev => {
      let value = parseInt(this.actor.data.data.characteristics.corruption)
      const max = parseInt(20)
      if (ev.button == 0) {
        if (value >= max) value = 0
        else value++
      } else if (ev.button == 2) {
        if (value <= 0) value = 0
        else value--
      }
      this.actor.update({ 'data.characteristics.corruption': value }).then(_ => this.render())
    })

    // Health bar fill
    const healthbar = html.find('.healthbar-fill')
    if (healthbar.length > 0) {
      const health = this.actor.data.data.characteristics.health
      healthbar[0].style.width = Math.floor((+health.value / +health.max) * 100) + '%'
    }

    // Insanity bar fill
    const insanitybar = html.find('.insanity-fill')
    if (insanitybar.length > 0) {
      const insanity = this.actor.data.data.characteristics.insanity
      insanitybar[0].style.width = Math.floor((+insanity.value / +insanity.max) * 100) + '%'
    }

    // Corruption bar fill
    const corruptionbar = html.find('.corruption-fill')
    if (corruptionbar.length > 0) {
      const corruption = this.actor.data.data.characteristics.corruption
      corruptionbar[0].style.width = Math.floor((+corruption / 20) * 100) + '%'
    }

    // Ancestry CRUD
    html.on('mousedown', '.ancestry-create', ev => this._onAncestryCreate(ev))
    html.on('mousedown', '.ancestry-edit', ev => this._onAncestryEdit(ev))

    // Path RUD
    html.on('mousedown', '.path-edit', ev => this._onPathEdit(ev))
    html
      .find('.paths-edit')
      .click(_ => this.actor.update({ 'data.paths.edit': !this.actor.data.data.paths.edit }).then(() => this.render()))

    // Wealth edit
    html
      .find('.wealth-edit')
      .click(_ =>
        this.actor.update({ 'data.wealth.edit': !this.actor.data.data.wealth.edit }).then(() => this.render()),
      )
    // Languages CRUD + Edit
    html.find('.languages-edit').click(_ =>
      this.actor
        .update({
          'data.languages.edit': !this.actor.data.data.languages.edit,
        })
        .then(() => this.render()),
    )

    const _toggleLang = (ev, key) => {
      const dev = ev.currentTarget.closest('.language')
      const item = this.actor.items.get(dev.dataset.itemId)
      item.update({ ['data.' + key]: !item.data.data[key] }, { parent: this.actor })
    }
    html.find('.language-delete').click(ev => this._onItemDelete(ev, '.language'))
    html.find('.language-toggle-r').click(ev => _toggleLang(ev, 'read'))
    html.find('.language-toggle-w').click(ev => _toggleLang(ev, 'write'))
    html.find('.language-toggle-s').click(ev => _toggleLang(ev, 'speak'))

    // Profession
    html.find('.profession-edit').click(_ =>
      this.actor
        .update({
          'data.professions.edit': !this.actor.data.data.professions.edit,
        })
        .then(() => this.render()),
    )
    html.find('.editprofession').change(ev => {
      const id = $(ev.currentTarget).attr('data-item-id')
      const namevalue = ev.currentTarget.children[1].value
      const descriptionvalue = ev.currentTarget.children[2].value
      const item = this.actor.items.get(id)
      item.update({ name: namevalue, 'data.description': descriptionvalue }, { parent: this })
    })

    // Religion
    html
      .find('.religion-edit')
      .click(_ =>
        this.actor.update({ 'data.religion.edit': !this.actor.data.data.religion.edit }).then(() => this.render()),
      )

    // Ammo uses
    html.on('mousedown', '.ammo-amount', ev => {
      const li = ev.currentTarget.closest('.item')
      const item = duplicate(this.actor.items.get(li.dataset.itemId))
      const amount = item.data.quantity
      if (ev.button == 0 && amount >= 0) item.data.quantity = +amount + 1
      else if (ev.button == 2 && amount > 0) item.data.quantity = +amount - 1
      Item.updateDocuments([item], { parent: this.actor })
    })

    // Talent uses
    html.on('mousedown', '.talent-uses', ev => {
      const li = ev.currentTarget.closest('.item')
      const talent = this.actor.items.get(li.dataset.itemId)
      if (ev.button == 0) this.actor.activateTalent(talent, true)
      else if (ev.button == 2) this.actor.deactivateTalent(talent, 1)
    })

    // Spell uses
    html.on('mousedown', '.spell-uses', ev => {
      const li = ev.currentTarget.closest('.item')
      const item = this.actor.items.get(li.dataset.itemId)
      let uses = +item.data.data.castings.value
      const usesmax = +item.data.data.castings.max
      if (ev.button == 0) uses = uses < usesmax ? uses + 1 : 0
      else if (ev.button == 2) uses = uses > 0 ? uses - 1 : 0
      item.update({ 'data.castings.value': uses }, { parent: this.actor })
    })

    // Item uses
    html.on('mousedown', '.item-uses', ev => {
      const li = ev.currentTarget.closest('.item')
      const item = duplicate(this.actor.items.get(li.dataset.itemId))
      if (ev.button == 0) {
        item.data.quantity++
      } else if (ev.button == 2) {
        if (item.data.quantity > 0) {
          item.data.quantity--
        }
      }
      Item.updateDocuments([item], { parent: this.actor })
    })

    // Rest character
    html.find('.rest-char').click(_ => this.actor.restActor())

    // Healing Rate button
    html.find('.healingratebox').on('mousedown', ev => this.actor.applyHealing(ev.button === 0))

    // Talent: Options
    html.find('input[type=checkbox][id^="option"]').click(ev => {
      const div = ev.currentTarget.closest('.option')
      const field = ev.currentTarget.name
      const update = {
        id: div.dataset.itemId,
        [field]: ev.currentTarget.checked,
      }

      Item.updateDocuments(update, { parent: this.actor })
    })
  }
}
