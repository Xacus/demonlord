import DLBaseActorSheetV2 from './base-actor-sheet-v2'
import { prepareActiveEffectCategories } from '../../active-effects/effects'

export default class DLCreatureSheetV2 extends DLBaseActorSheetV2 {
  static DEFAULT_OPTIONS = {
    // All from base plus...
    form: {
      handler: this.onSubmit
    },
    actions: {
      rollCorruption: this.onRollCorruption,
      editStatBar: this.onEditStatBar,
    }
  }

  static PARTS = {
    // All from base
    sidebar: { template: 'systems/demonlord/templates/actor/parts/creature-sheet-sidemenu.hbs' },
    header: { template: 'systems/demonlord/templates/actor/parts/creature-sheet-header.hbs' },
    tabs: { template: 'systems/demonlord/templates/generic/tab-navigation.hbs' },

    // Tabs
    combat: { template: 'systems/demonlord/templates/actor/tabs/creature-combat.hbs' },
    magic: { template: 'systems/demonlord/templates/actor/tabs/magic.hbs' },
    inventory: { template: 'systems/demonlord/templates/actor/tabs/item.hbs' },
    reference: { template: 'systems/demonlord/templates/actor/tabs/creature-reference.hbs' },
    afflictions: { template: 'systems/demonlord/templates/actor/tabs/afflictions.hbs' },
    effects: { template: 'systems/demonlord/templates/actor/tabs/creature-effects.hbs' }
  }

  static TABS = {
    primary: {
      tabs: [
        { id: 'combat', icon: 'icon-combat', tooltip: 'DL.TabsCombat'},
        { id: 'magic', icon: 'icon-magic', tooltip: 'DL.TabsMagic'},
        { id: 'inventory', icon: 'icon-inventory', tooltip: 'DL.TabsInventory'},
        { id: 'reference', icon: 'icon-background', tooltip: 'DL.Reference'},
        { id: 'afflictions', icon: 'icon-afflictions', tooltip: 'DL.TabsAfflictions'},
        { id: 'effects', icon: 'icon-effects', tooltip: 'DL.TabsEffects'}
      ],
      initial: 'combat'
    }
  }

  /* -------------------------------------------- */
  /*  Data preparation                            */
  /* -------------------------------------------- */

    /** @override */
    _configureRenderOptions(options) {
      super._configureRenderOptions(options)

      // This should be configured per sheet type
      options.parts.push('combat', 'magic', 'inventory', 'reference', 'afflictions', 'effects')

      //this._adjustSizeByType(this.document.type, this.position)
    }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options)

    // Effects categories
    context.ancestryEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.demonlord?.sourceType === 'ancestry'),
    )
    delete context.ancestryEffects.temporary

    context.pathEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.demonlord?.sourceType === 'path'),
    )
    delete context.pathEffects.temporary

    context.talentEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.demonlord?.sourceType === 'talent'),
    )
    context.spellEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.demonlord?.sourceType === 'spell'),
    )
    context.itemEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => ['armor', 'weapon', 'item'].indexOf(effect.flags?.demonlord?.sourceType) >= 0),
    )
    context.itemEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.demonlord?.sourceType === 'creaturerole'),
    )
    context.itemEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.demonlord?.sourceType === 'relic'),
    )
    this._prepareItems(context)
    return context
  }

  /* -------------------------------------------- */

  /** @override */
  _prepareItems(sheetData) {
    super._prepareItems(sheetData)
    const m = sheetData._itemsByType
    const actorData = sheetData.actor
    actorData.gear = m.get('item') || []
    actorData.relics = m.get('relic') || []
    actorData.armor = m.get('armor') || []
    actorData.ammo = m.get('ammo') || []
    actorData.languages = m.get('language') || ''
    actorData.paths = m.get('path') || []
    actorData.talentbook = this._prepareBook(actorData.talents, 'groupname', 'talents')
    actorData.roles = m.get('creaturerole') || []
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
      const insanityImmune = this.actor.system.characteristics.insanity.immune || item.system.levels.filter(l => l.characteristics.insanity.immune).length > 0
      const corruptionImmune = this.actor.system.characteristics.corruption.immune || item.system.levels.filter(l => l.characteristics.corruption.immune).length > 0
      const newInsanity = this.actor.system.characteristics.insanity.value + item.system.levels.reduce((s, l) => s + l.characteristics.insanity.value, 0)
      const newCorruption = this.actor.system.characteristics.corruption.value + item.system.levels.reduce((s, l) => s + l.characteristics.corruption.value, 0)

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

  static async onSubmit(event, form, formData) {
    super.onSubmit(event, form, formData)

    //const updateData = foundry.utils.expandObject(formData.object)
    return await this.document.update(formData)
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  /** Edit HealthBar, Insanity and Corruption */
  static async onEditStatBar() {
    const actor = this.actor
    const showEdit = actor.system.characteristics.editbar
    actor.system.characteristics.editbar = !showEdit

    await actor.update({ 'system.characteristics.editbar': actor.system.characteristics.editbar })
    await this.render({parts: ['sidebar']})
  }

  async onEditRole(ev) {
    const div = $(ev.currentTarget)
    const role = this.actor.getEmbeddedDocument('Item', div.data('itemId'))

    if (ev.button == 0) role.sheet.render(true)
    else if (ev.button == 2) await role.delete({ parent: this.actor })
  }

  async onEditRelic(ev) {
    const div = $(ev.currentTarget)
    const role = this.actor.getEmbeddedDocument('Item', div.data('itemId'))

    if (ev.button == 0) role.sheet.render(true)
    else if (ev.button == 2) await role.delete({ parent: this.actor })
  }

  /* -------------------------------------------- */

  /* -------------------------------------------- */
  /*  Listeners                                   */
  /* -------------------------------------------- */

  /** @override */
  async _onRender(context, options) {
    super._onRender(context, options)

    if (!this.options.editable) return

    let e = this.element

    // Health bar clicks
    e.querySelector('.addDamage')?.addEventListener('mousedown', ev => {
      if (ev.button == 0) this.actor.increaseDamage(+1)
      // Increase damage
      else if (ev.button == 2) this.actor.increaseDamage(-1) // Decrease damage
    })

    // Insanity bar click
    e.querySelector('.addInsanity')?.addEventListener('mousedown', async ev => {
      let value = parseInt(this.actor.system.characteristics.insanity.value)
      const max = parseInt(this.actor.system.characteristics.insanity.max)
      if (ev.button == 0) {
        if (value >= max) value = 0
        else value++
      } else if (ev.button == 2) {
        if (value <= 0) value = 0
        else value--
      }
      await this.actor.update({ 'system.characteristics.insanity.value': value })
    })

    // Corruption bar click
    e.querySelector('.addCorruption')?.addEventListener('mousedown', async ev => {
      let value = parseInt(this.actor.system.characteristics.corruption.value)
      const max = parseInt(20)
      if (ev.button == 0) {
        if (value >= max) value = 0
        else value++
      } else if (ev.button == 2) {
        if (value <= 0) value = 0
        else value--
      }
      await this.actor.update({ 'system.characteristics.corruption.value': value })
    })

    // Health bar fill
    const healthbar = e.querySelector('.healthbar-fill')
    if (healthbar) {
      const health = this.actor.system.characteristics.health
      healthbar.style.width = Math.floor((+health.value / +health.max) * 100) + '%'
    }

    // Insanity bar fill
    const insanitybar = e.querySelector('.insanity-fill')
    if (insanitybar) {
      const insanity = this.actor.system.characteristics.insanity
      insanitybar.style.width = Math.floor((+insanity.value / +insanity.max) * 100) + '%'
    }

    // Corruption bar fill
    const corruptionbar = e.querySelector('.corruption-fill')
    if (corruptionbar) {
      const corruption = this.actor.system.characteristics.corruption.value
      corruptionbar.style.width = Math.floor((+corruption / 20) * 100) + '%'
    }

    // Role edit
    e.querySelectorAll('.role-edit')?.forEach(p => p.addEventListener('mousedown', '.role-edit', async ev => await this.onEditRole(ev)))

    // Relic edit
    e.querySelectorAll('.relic-edit')?.forEach(p => p.addEventListener('mousedown', async ev => await this.onEditRelic(ev)))

    // Ammo uses
    e.querySelectorAll('.ammo-amount')?.forEach(el => el.addEventListener('mousedown', async ev => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      const item = foundry.utils.duplicate(this.actor.items.get(id))
      const amount = item.system.quantity
      if (ev.button == 0 && amount >= 0) item.system.quantity = +amount + 1
      else if (ev.button == 2 && amount > 0) item.system.quantity = +amount - 1
      await Item.updateDocuments([item], { parent: this.actor })
    }))

    // Item uses
    e.querySelectorAll('.item-uses')?.forEach(el => el.addEventListener('mousedown', async ev => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      const item = foundry.utils.duplicate(this.actor.items.get(id))
      if (ev.button == 0) {
        item.system.quantity++
      } else if (ev.button == 2) {
        if (item.system.quantity > 0) {
          item.system.quantity--
        }
      }
      await Item.updateDocuments([item], { parent: this.actor })
    }))
  }
}
