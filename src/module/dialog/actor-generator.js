export class DLCharacterGenerater extends FormApplication {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['charactergenerator', 'sheet', 'actor'],
      width: 600,
      height: 500,
      tabs: [
        {
          navSelector: '.sheet-navigation',
          contentSelector: '.sheet-body',
          initial: 'character',
        },
      ],
      scrollY: ['.tab.active'],
    })
  }

  /** @override */
  get template() {
    return 'systems/demonlord/templates/dialogs/character-generator.hbs'
  }

  /* -------------------------------------------- */
  /**
   * Add the Entity name into the window title
   * @type {String}
   */
  get title() {
    return `${this.object.name}: ` + game.i18n.localize('DL.CharacterGenerator')
  }
  /* -------------------------------------------- */

  /**
   * Construct and return the data object used to render the HTML template for this form application.
   * @return {Object}
   */
  getData() {
    const actor = this.object.data

    const ancestries = game.items.entities.filter(item => item.type === 'ancestry')

    /*
    const pathNovice = actor
      .getEmbeddedCollection('Item')
      .filter((e) => e.type === 'path' && e.data.type === 'novice')
    */
    // const pathExpert = []
    // const pathMaster = []

    const paths = this.preparePaths(game.items.entities.filter(item => item.type === 'path'))

    return {
      actor,
      ancestries,
      paths,
    }
  }
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)

    if (!this.options.editable) return
  }

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject(event, formData) {
    await this.object.update({
      formData,
    })
    this.object.sheet.render(true)
  }

  preparePaths(paths) {
    const categories = {
      novice: {
        type: 'novice',
        label: game.i18n.localize('DL.CharPathNovice'),
        paths: [],
      },
      expert: {
        type: 'expert',
        label: game.i18n.localize('DL.CharPathExpert'),
        paths: [],
      },
      master: {
        type: 'master',
        label: game.i18n.localize('DL.CharPathMaster'),
        paths: [],
      },
      legendary: {
        type: 'legendary',
        label: game.i18n.lozalize('DL.CharPathLegendary'),
        paths: []
      }
    }

    for (const path of paths) {
      if (path.data.data.type == 'novice') {
        categories.novice.paths.push(path)
      } else if (path.data.data.type == 'expert') {
        categories.expert.paths.push(path)
      } else if (path.data.data.type === 'master') {
        categories.master.paths.push(path)
      } else categories.legendary.paths.push(path)
    }
    return categories
  }

  async showDeleteDialog(title, content, item, liObject) {
    const d = new Dialog({
      title: title,
      content: content,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogYes'),
          callback: async () => await this.deleteItem(item, liObject),
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('DL.DialogNo'),
          callback: () => {},
        },
      },
      default: 'no',
      close: () => {},
    })
    d.render(true)
  }
}
