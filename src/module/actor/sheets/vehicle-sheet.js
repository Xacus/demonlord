import DLBaseActorSheet from './base-actor-sheet'

export default class DLVehicleSheet extends DLBaseActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['vehicle', 'sheet', 'actor', 'dl-sheet'],
      template: 'systems/demonlord/templates/actor/vehicle-sheet.hbs',
      width: 900,
      height: 700,
      tabs: [
        {
          navSelector: '.sheet-navigation',
          contentSelector: '.sheet-body',
          initial: 'vehicle',
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
    actorData.specialactions = m.get('specialaction') || []
    actorData.endoftheround = m.get('endoftheround') || []
    actorData.magic = m.get('magic') || []
  }

  /* -------------------------------------------- */

  /** @override */
  async checkDroppedItem(itemData) {
    if (['armor', 'ammo', 'ancestry', 'path', 'profession', 'item', 'language', 'creaturerole', 'relic'].includes(itemData.type)) return false
    return true
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)

    // Dynamically set the reference tab layout to two column if its height exceeds a certain threshold
    html.find('.sheet-navigation').click(_ => this._resizeAutoColumns(this.element))
    this._resizeAutoColumns(html)
  }

  _resizeAutoColumns(element) {
    element.find('.dl-auto-column').each((_, ac) => {
      ac = $(ac)
      if (ac.height() > 700) ac.css({'columns': '2'})
    })
  }

}
