import DLBaseActorSheet from './base-actor-sheet'
import DLFrighteningHorrifyingEditor from '../../dialog/frightening-horrifying-editor'

export default class DLCreatureSheet extends DLBaseActorSheet {
  static DEFAULT_OPTIONS = {
    // All from base plus...
    form: {
      handler: this.onSubmit,
      submitOnChange: true
    },
    actions: {
      openFrighteningHorrifyingEditor: this.onOpenFrighteningHorrifyingEditor
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
        { id: 'combat', icon: 'icon-combat', tooltip: 'DL.TabsCombat' },
        { id: 'magic', icon: 'icon-magic', tooltip: 'DL.TabsMagic' },
        { id: 'inventory', icon: 'icon-inventory', tooltip: 'DL.TabsInventory' },
        { id: 'description', icon: 'icon-background', tooltip: 'DL.TabsDescription', alwaysShow: true },
        { id: 'reference', icon: 'icon-talents', tooltip: 'DL.Reference' },
        { id: 'afflictions', icon: 'icon-afflictions', tooltip: 'DL.TabsAfflictions' },
        { id: 'effects', icon: 'icon-effects', tooltip: 'DL.TabsEffects' }
      ],
      initial: 'reference',
      limitedInitial: 'description'
    }
  }

  /* -------------------------------------------- */
  /*  Data preparation                            */
  /* -------------------------------------------- */

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options)

    // This should be configured per sheet type
    options.parts.push('combat', 'magic')

    if (game.settings.get('demonlord', 'addCreatureInventoryTab')) {
      options.parts.push('inventory')
    }

    options.parts.push('description', 'reference', 'afflictions', 'effects')

  //this._adjustSizeByType(this.document.type, this.position)
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options)

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
    actorData.armor = m.get('armor') || []
    actorData.ammo = m.get('ammo') || []
  }

  /* -------------------------------------------- */
  /** @override */
  async checkDroppedItem(itemData) {
    let preventedItems = await game.settings.get('demonlord', 'addCreatureInventoryTab') ? ['ancestry', 'path', 'profession', 'language'] : ['armor', 'ammo', 'ancestry', 'path', 'profession', 'item', 'language', 'relic']
    if (preventedItems.includes(itemData.type)) return false
    return true
  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */
  /* -------------------------------------------- */

  static async onSubmit(event, form, formData) {
    const updateData = foundry.utils.expandObject(formData.object)
    return await this.document.update(updateData)
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  async onEditRole(ev) {
    const div = ev.target.closest('.role-edit')
    const role = this.actor.getEmbeddedDocument('Item', div.dataset.itemId)

    if (ev.button == 0) role.sheet.render(true)
    else if (ev.button == 2) {
      if (game.settings.get('demonlord', 'confirmCreatureRoleRemoval')) {
        await this.showDeleteDialog(game.i18n.localize('DL.DialogAreYouSure'), game.i18n.localize('DL.DialogDeleteCreatureRoleText'), div)
      } else {
        await role.delete({ parent: this.actor })
      }
    }
  }

  async onEditRelic(ev) {
    const div = $(ev.currentTarget)
    const relic = this.actor.getEmbeddedDocument('Item', div.data('itemId'))

    if (ev.button == 0) relic.sheet.render(true)
    else if (ev.button == 2) await relic.delete({ parent: this.actor })
  }

    static async onOpenFrighteningHorrifyingEditor(event) {
      event.preventDefault()
      event.stopPropagation()
      new DLFrighteningHorrifyingEditor({ actor: this.actor, }, {
          top: 50,
          right: 700,
        }).render(true)
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
    e.querySelectorAll('.role-edit')?.forEach(p => p.addEventListener('mousedown', async ev => await this.onEditRole(ev)))

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
      await this.actor.update({ system: { characteristics: { [characteristicName]: { immune: !this.actor.system.characteristics[characteristicName].immune } } } })
    }))
  }
}
