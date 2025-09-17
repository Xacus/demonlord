import DLCreatureSheetV2 from './creature-sheet-v2'

export default class DLVehicleSheetV2 extends DLCreatureSheetV2 {
  static DEFAULT_OPTIONS = {
    // All from base plus...
    form: {
      handler: this.onSubmit
    },
    actions: {
    }
  }

  static PARTS = {
    // All from base
    sidebar: { template: 'systems/demonlord/templates/actor/parts/vehicle-sheet-sidemenu.hbs' },
    header: { template: 'systems/demonlord/templates/actor/parts/vehicle-sheet-header.hbs' },
    tabs: { template: 'systems/demonlord/templates/generic/tab-navigation.hbs' },

    // Tabs
    combat: { template: 'systems/demonlord/templates/actor/tabs/creature-combat.hbs' },
    inventory: { template: 'systems/demonlord/templates/actor/tabs/item.hbs' },
    description: { template: 'systems/demonlord/templates/actor/tabs/description.hbs' },
    reference: { template: 'systems/demonlord/templates/actor/tabs/creature-reference.hbs' },
    effects: { template: 'systems/demonlord/templates/actor/tabs/creature-effects.hbs' }
  }

  static TABS = {
    primary: {
      tabs: [
        { id: 'combat', icon: 'icon-combat', tooltip: 'DL.TabsCombat'},
        { id: 'inventory', icon: 'icon-inventory', tooltip: 'DL.TabsInventory'},
        { id: 'description', icon: 'icon-background', tooltip: 'DL.TabsDescription'},
        { id: 'reference', icon: 'icon-talents', tooltip: 'DL.Reference'},
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
      options.parts.push('combat', 'inventory', 'description', 'reference', 'effects')

      //this._adjustSizeByType(this.document.type, this.position)
    }

  /* -------------------------------------------- */

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

  /* -------------------------------------------- */

  /* -------------------------------------------- */
  /*  Listeners                                   */
  /* -------------------------------------------- */
}
