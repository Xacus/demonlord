import DLBaseActorSheet from './base-actor-sheet'

export default class DLCreatureSheet extends DLBaseActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['creature', 'sheet', 'actor'],
      template: 'systems/demonlord/templates/actor/creature-sheet.html',
      width: 800,
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
  getData() {
    const data = super.getData()
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
    if (['armor', 'ammo', 'ancestry', 'path', 'profession', 'item', 'language'].includes(itemData.type)) return false
    return true
  }
}
