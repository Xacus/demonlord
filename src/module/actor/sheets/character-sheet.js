import DLBaseActorSheet from './base-actor-sheet'
import { prepareActiveEffectCategories } from '../../active-effects/effects'
import { handleLevelChange } from '../../item/nested-objects'

export default class DLCharacterSheet extends DLBaseActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['demonlord', 'sheet', 'actor', 'dl-sheet'],
      width: 875,
      height: 700,
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
    if (!game.user.isGM && this.actor.limited) return 'systems/demonlord/templates/actor/limited-sheet.hbs'
    return 'systems/demonlord/templates/actor/actor-sheet.hbs'
  }

  /* -------------------------------------------- */
  /*  Data preparation                            */
  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const data = await super.getData()

    // Effects categories
    data.ancestryEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.sourceType === 'ancestry'),
    )
    delete data.ancestryEffects.temporary

    data.pathEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.sourceType === 'path'),
    )
    delete data.pathEffects.temporary

    data.talentEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.sourceType === 'talent'),
    )
    data.spellEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.sourceType === 'spell'),
    )
    data.itemEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => ['armor', 'weapon', 'item'].indexOf(effect.flags?.sourceType) >= 0),
    )
    data.itemEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.sourceType === 'creaturerole'),
    )
    data.itemEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.sourceType === 'relic'),
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
    actorData.relics = m.get('relic') || []
    actorData.armor = m.get('armor') || []
    actorData.ammo = m.get('ammo') || []
    actorData.ancestry = m.get('ancestry') || []
    actorData.professions = m.get('profession') || []
    actorData.languages = m.get('language') || ''
    actorData.paths = m.get('path') || []
    actorData.talentbook = this._prepareBook(actorData.talents, 'groupname', 'talents')
    actorData.roles = m.get('creaturerole') || []

    // Sort paths
    actorData.paths = [
      ...actorData.paths.filter(p => p.system.type === 'novice'),
      ...actorData.paths.filter(p => p.system.type === 'expert'),
      ...actorData.paths.filter(p => p.system.type === 'master'),
      ...actorData.paths.filter(p => p.system.type === 'legendary')
    ]
  }

  /* -------------------------------------------- */
  /** @override */
  async checkDroppedItem(itemData) {
    const type = itemData.type
    if (['specialaction', 'endoftheround', 'creaturerole'].includes(type)) return false

    if (type === 'ancestry') {
      const currentAncestriesIds = this.actor.items.filter(i => i.type === 'ancestry').map(i => i._id)
      if (currentAncestriesIds?.length > 0) await this.actor.deleteEmbeddedDocuments('Item', currentAncestriesIds)
      return true
    } else if (type === 'path' && this.actor.system.paths?.length >= 3) return false

    return true
  }

  /**
   * @override
   * @param {DemonlordItem} item 
   */
  async postDropItemCreate (item) {     
    if (item.type === 'ancestry') {

      // Add insanity and corruption values
      const insanityImmune = this.actor.system.characteristics.insanity.immune || item.system.characteristics.insanity.immune
      const corruptionImmune = this.actor.system.characteristics.corruption.immune || item.system.characteristics.corruption.immune
      const newInsanity = this.actor.system.characteristics.insanity.value + item.system.characteristics.insanity.value
      const newCorruption = this.actor.system.characteristics.corruption.value + item.system.characteristics.corruption.value

      await this.actor.update({
        'system.characteristics': {
          insanity: {
            value: insanityImmune ? 0 : newInsanity
          },
          corruption: {
            value: corruptionImmune ? 0 : newCorruption
          }
        }
      })
    }
  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */
  /* -------------------------------------------- */

  async _onAncestryEdit(ev) {
    const div = $(ev.currentTarget)
    const ancestry = this.actor.getEmbeddedDocument('Item', div.data('itemId'))

    if (ev.button == 0) ancestry.sheet.render(true)
    else if (ev.button == 2) {
      if (this.actor.system.level > 0 && game.settings.get('demonlord', 'confirmAncestryPathRemoval')) {
          await this.showDeleteDialog(game.i18n.localize('DL.DialogAreYouSure'), game.i18n.localize('DL.DialogDeleteAncestryText'), div)
      } else {
        await ancestry.delete({ parent: this.actor })
      }
    }
  }

  /* -------------------------------------------- */

  async _onPathEdit(ev) {
    const div = $(ev.currentTarget)
    const path = this.actor.getEmbeddedDocument('Item', div.data('itemId'))

    if (ev.button == 0) path.sheet.render(true)
    else if (ev.button == 2) {
      if (this.actor.system.level > 0 && game.settings.get('demonlord', 'confirmAncestryPathRemoval')) {
        await this.showDeleteDialog(game.i18n.localize('DL.DialogAreYouSure'), game.i18n.localize('DL.DialogDeletePathText'), div)
      } else {
        await path.delete({ parent: this.actor })
      }
    }
  }

  /* -------------------------------------------- */
  
  async _onRoleEdit(ev) {
    const div = $(ev.currentTarget)
    const role = this.actor.getEmbeddedDocument('Item', div.data('itemId'))
    
    if (ev.button == 0) role.sheet.render(true)
    else if (ev.button == 2) await role.delete({ parent: this.actor })
}

  /* -------------------------------------------- */

  async _onRelicEdit(ev) {
    const div = $(ev.currentTarget)
    const role = this.actor.getEmbeddedDocument('Item', div.data('itemId'))

    if (ev.button == 0) role.sheet.render(true)
    else if (ev.button == 2) await role.delete({ parent: this.actor })
  }

  /* -------------------------------------------- */
  
  async _updateObject(event, formData) {
    const newLevel = formData['system.level']
    if (newLevel !== this.document.system.level) await handleLevelChange(this.document, newLevel)
    return await this.document.update(formData)
  }

  /* -------------------------------------------- */

  /* -------------------------------------------- */
  /*  Listeners                                   */
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)
    if (!this.options.editable) return

    // Corruption Roll
    html.find('.corruption-roll').click(async _ => await this.actor.rollCorruption())

    // Edit HealthBar, Insanity and Corruption
    html.find('.bar-edit').click(async () => {
      const actor = this.actor
      const showEdit = actor.system.characteristics.editbar
      actor.system.characteristics.editbar = !showEdit

      await actor
        .update({
          'system.characteristics.editbar': actor.system.characteristics.editbar,
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
    html.on('mousedown', '.addInsanity', async ev => {
      let value = parseInt(this.actor.system.characteristics.insanity.value)
      const max = parseInt(this.actor.system.characteristics.insanity.max)
      if (ev.button == 0) {
        if (value >= max) value = 0
        else value++
      } else if (ev.button == 2) {
        if (value <= 0) value = 0
        else value--
      }
      await this.actor.update({ 'system.characteristics.insanity.value': value }).then(_ => this.render())
    })

    // Corruption bar click
    html.on('mousedown', '.addCorruption', async ev => {
      let value = parseInt(this.actor.system.characteristics.corruption.value)
      const max = parseInt(20)
      if (ev.button == 0) {
        if (value >= max) value = 0
        else value++
      } else if (ev.button == 2) {
        if (value <= 0) value = 0
        else value--
      }
      await this.actor.update({ 'system.characteristics.corruption.value': value }).then(_ => this.render())
    })

    // Health bar fill
    const healthbar = html.find('.healthbar-fill')
    if (healthbar.length > 0) {
      const health = this.actor.system.characteristics.health
      healthbar[0].style.width = Math.floor((+health.value / +health.max) * 100) + '%'
    }

    // Insanity bar fill
    const insanitybar = html.find('.insanity-fill')
    if (insanitybar.length > 0) {
      const insanity = this.actor.system.characteristics.insanity
      insanitybar[0].style.width = Math.floor((+insanity.value / +insanity.max) * 100) + '%'
    }

    // Corruption bar fill
    const corruptionbar = html.find('.corruption-fill')
    if (corruptionbar.length > 0) {
      const corruption = this.actor.system.characteristics.corruption.value
      corruptionbar[0].style.width = Math.floor((+corruption / 20) * 100) + '%'
    }

    // Ancestry edit
    html.on('mousedown', '.ancestry-edit', async ev => await this._onAncestryEdit(ev))

    // Path edit
    html.on('mousedown', '.path-edit', async ev => await this._onPathEdit(ev))

    // Role edit
    html.on('mousedown', '.role-edit', async ev => await this._onRoleEdit(ev))

    // Relic edit
    html.on('mousedown', '.relic-edit', async ev => await this._onRelicEdit(ev))

    // Wealth edit
    html
      .find('.wealth-edit')
      .click(async _ =>
        await this.actor.update({ 'system.wealth.edit': !this.actor.system.wealth.edit }).then(() => this.render()),
      )
    // Languages CRUD + Edit
    html.find('.languages-edit').click(async _ =>
      await this.actor
        .update({
          'system.languages.edit': !this.actor.system.languages.edit,
        })
        .then(() => this.render()),
    )

    const _toggleLang = async (ev, key) => {
      const dev = ev.currentTarget.closest('.language')
      const item = this.actor.items.get(dev.dataset.itemId)
      await item.update({[`system.${key}`]: !item.system[key] }, { parent: this.actor })
    }
    html.find('.language-delete').click(ev => this._onItemDelete(ev, '.language'))
    html.find('.language-toggle-r').click(ev => _toggleLang(ev, 'read'))
    html.find('.language-toggle-w').click(ev => _toggleLang(ev, 'write'))
    html.find('.language-toggle-s').click(ev => _toggleLang(ev, 'speak'))

    // Religion
    html
      .find('.religion-edit')
      .click(async _ =>
        await this.actor.update({ 'system.religion.edit': !this.actor.system.religion.edit }).then(() => this.render()),
      )

    // Ammo uses
    html.on('mousedown', '.ammo-amount', async ev => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      const item = duplicate(this.actor.items.get(id))
      const amount = item.system.quantity
      if (ev.button == 0 && amount >= 0) item.system.quantity = +amount + 1
      else if (ev.button == 2 && amount > 0) item.system.quantity = +amount - 1
      await Item.updateDocuments([item], { parent: this.actor })
    })

    // Item uses
    html.on('mousedown', '.item-uses', async ev => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      const item = duplicate(this.actor.items.get(id))
      if (ev.button == 0) {
        item.system.quantity++
      } else if (ev.button == 2) {
        if (item.system.quantity > 0) {
          item.system.quantity--
        }
      }
      await Item.updateDocuments([item], { parent: this.actor })
    })

    // Rest character
    html.find('.rest-char').click(_ => this.actor.restActor())

    // Healing Rate button
    html.find('.healingratebox').on('mousedown', async ev => await this.actor.applyHealing(ev.button === 0))

    // Talent: Options
    html.find('input[type=checkbox][id^="option"]').click(async ev => {
      const div = ev.currentTarget.closest('.option')
      const field = ev.currentTarget.name
      const update = {
        id: div.dataset.itemId,
        [field]: ev.currentTarget.checked,
      }

      await Item.updateDocuments(update, { parent: this.actor })
    })
  }
}
