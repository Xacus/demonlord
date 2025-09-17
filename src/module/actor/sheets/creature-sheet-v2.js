import DLBaseActorSheetV2 from './base-actor-sheet-v2'
import { prepareActiveEffectCategories } from '../../active-effects/effects'

export default class DLCreatureSheetV2 extends DLBaseActorSheetV2 {
  static DEFAULT_OPTIONS = {
    // All from base plus...
    form: {
      handler: this.onSubmit
    },
    actions: {
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
    description: { template: 'systems/demonlord/templates/actor/tabs/description.hbs' },
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
        { id: 'description', icon: 'icon-background', tooltip: 'DL.TabsDescription' },
        { id: 'reference', icon: 'icon-talents', tooltip: 'DL.Reference' },
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
      options.parts.push('combat', 'magic', 'inventory', 'description', 'reference', 'afflictions', 'effects')

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

    const actorHasChangeBool = (actor, key) => {
      return Array.from(actor.allApplicableEffects()).filter(e => !e.disabled && e.changes.filter(c => c.key === key && c.value === '1').length > 0).length > 0
    }

    const noSpecialAttacks = actorHasChangeBool(actorData, 'system.maluses.noSpecialAttacks')
    const noSpecialActions = actorHasChangeBool(actorData, 'system.maluses.noSpecialActions')
    const noEndOfRound = actorHasChangeBool(actorData, 'system.maluses.noEndOfRound')

    actorData.talents = noSpecialAttacks ? [] : (m.get('talent') || [])
    actorData.specialactions = noSpecialActions ? [] : (m.get('specialaction') || [])
    actorData.endoftheround = noEndOfRound ? [] : (m.get('endoftheround') || [])
    actorData.roles = m.get('creaturerole') || []
    actorData.gear = m.get('item') || []
    actorData.relics = m.get('relic') || []
  }

  /* -------------------------------------------- */
  /** @override */
  async checkDroppedItem(itemData) {
    let preventedItems = await game.settings.get('demonlord', 'addCreatureInventoryTab') ? ['armor', 'ammo', 'ancestry', 'path', 'profession', 'language'] : ['armor', 'ammo', 'ancestry', 'path', 'profession', 'item', 'language', 'relic']
    if (preventedItems.includes(itemData.type)) return false
    return true
  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */
  /* -------------------------------------------- */

  // static async onSubmit(event, form, formData) {
  //   super.onSubmit(event, form, formData)

  //   //const updateData = foundry.utils.expandObject(formData.object)
  //   return await this.document.update(formData)
  // }

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

    e.querySelectorAll('.characteristic .name')?.forEach(el => el.addEventListener('contextmenu', async ev => {
      const div = $(ev.currentTarget)
      const characteristicName = div.data('key')
      await this.actor.update({ system: { characteristics: { [characteristicName]: { immune : !this.actor.system.characteristics[characteristicName].immune } } } })
    }))
  }
}
