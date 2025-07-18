import DLBaseActorSheet from './base-actor-sheet'

export default class DLCreatureSheet extends DLBaseActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['creature', 'sheet', 'actor', 'dl-sheet'],
      template: 'systems/demonlord/templates/actor/creature-sheet.hbs',
      width: 900,
      height: 700,
      tabs: [
        {
          navSelector: '.sheet-navigation',
          contentSelector: '.sheet-body',
          initial: 'creature',
        },
      ],
      scrollY: ['.tab.active'],
    })
  }

  /* -------------------------------------------- */
  /*  Data preparation                            */

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const data = await super.getData()
    data.dtypes = ['String', 'Number', 'Boolean']
    this.prepareItems(data)
    return data
  }

  prepareItems(sheetData) {
    super.prepareItems(sheetData)
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

  /**
   * @override
   * @param {DemonlordItem} item
   */
  async preDropItemCreate (item) {
    if (item.type === 'armor') item.system.wear = false
    //Creatures do not benefit from the active effect of specific items
    const type = item.type
    if (['armor', 'item', 'relic'].includes(type))
    {
      const itemEffects = item.effects
      if (itemEffects) console.warn('Item effect(s) suspended.', this.actor, item)
      itemEffects.forEach((effect) => {if (effect.transfer) effect.disabled = true})
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)

    // Dynamically set the reference tab layout to two column if its height exceeds a certain threshold
    html.find('.sheet-navigation').click(_ => this._resizeAutoColumns(this.element))
    this._resizeAutoColumns(html)

    // Wealth edit
    html
      .find('.wealth-edit')
      .click(async _ =>
        await this.actor.update({ 'system.wealth.edit': !this.actor.system.wealth.edit }).then(() => this.render()),
      )

    // Role edit
    html.on('mousedown', '.role-edit', async ev => await this._onRoleEdit(ev))

    html.find('.characteristic .name').contextmenu(async ev => {
      const div = $(ev.currentTarget)
      const characteristicName = div.data('key')
      await this.actor.update({ system: { characteristics: { [characteristicName]: { immune : !this.actor.system.characteristics[characteristicName].immune } } } })
    })
  }

  _resizeAutoColumns(element) {
    element.find('.dl-auto-column').each((_, ac) => {
      ac = $(ac)
      if (ac.height() > 700) ac.css({'columns': '2'})
    })
  }

  async _onRoleEdit(ev) {
    const div = $(ev.currentTarget)
    const role = this.actor.getEmbeddedDocument('Item', div.data('itemId'))

    if (ev.button == 0) role.sheet.render(true)
    else if (ev.button == 2) await role.delete({ parent: this.actor })
  }
}
