import { capitalize } from '../utils/utils'

export class PlayerTracker extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'sheet-modifiers',
      classes: ['playertracker', 'sheet', 'actor'],
      template: 'systems/demonlord/templates/dialogs/player-tracker.hbs',
      width: game.users.players.length * 150,
      height: 'auto',
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'character',
        },
      ],
      scrollY: ['.tab.active'],
    })
  }

  /* -------------------------------------------- */
  /**
   * Add the Entity name into the window title
   * @type {String}
   */
  get title() {
    return `Player Tracker`
  }
  /* -------------------------------------------- */

  /**
   * Extend and override the sheet header buttons
   * @override
   */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons()
    const canConfigure = game.user.isGM
    if (this.options.editable && canConfigure) {
      buttons = [
        {
          label: game.i18n.localize('DL.UpdatePlayerTracker'),
          class: 'update-playertracker',
          icon: 'fas fa-sync-alt',
          onclick: ev => this._updateWindow(ev),
        },
      ].concat(buttons)
    }
    return buttons
  }

  _updateWindow(event) {
    event.preventDefault()
    this.render(true)
  }

  /**
   * Construct and return the data object used to render the HTML template for this form application.
   * @return {Object}
   */
  getData() {
    const players = game.users.players
    const persons = []

    for (const player of players) {
      var person = {
        playerid: player.character?.id,
        playername: player.name,
        charactername: player.character?.name,
        ancestry: player.character?.items.filter(e => e.type === 'ancestry').map(e => e.name),
        paths: {
          novice: player.character?.items
            .filter(e => e.type === 'path' && e.system.type === 'novice')
            .map(e => e.name),
          expert: player.character?.items
            .filter(e => e.type === 'path' && e.system.type === 'expert')
            .map(e => e.name),
          master: player.character?.items
            .filter(e => e.type === 'path' && e.system.type === 'master')
            .map(e => e.name),
          legendary: player.character?.items
            .filter(e => e.type === 'path' && e.system.type === 'legendary')
            .map(e => e.name),
        },
        professions: player.character?.items.filter(e => e.type === 'profession'),
        defense: player.character?.system.characteristics.defense,
        damage:
          player.character?.system.characteristics.health.value +
          '/' +
          player.character?.system.characteristics.health.max,
        insanity:
          player.character?.system.characteristics.insanity.value +
          '/' +
          player.character?.system.characteristics.insanity.max,
        corruption: player.character?.system.characteristics.corruption.value,
        power: player.character?.system.characteristics.power,
        speed: player.character?.system.characteristics.speed,
        fortune: player.character?.system.characteristics.fortune,
        gmnote: player.character?.system.gmnote,
        gmnoteedit: player.character?.system.gmnoteedit,
      }
      persons.push(person)
    }

    return {
      persons,
    }
  }
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)

    if (!this.options.editable) return

    html.find('.gmnote-control').click(async ev => {
      const a = ev.currentTarget
      const actor = game.actors.get(a.dataset.id)

      if (actor) {
        switch (a.dataset.action) {
          case 'edit':
            return await actor
              .update({
                'data.gmnoteedit': !actor.system.gmnoteedit,
              })
              .then(() => this.render())
          case 'save': {
            const textarea = html.find('textarea[id="person.' + actor.id + '"]')
            return await actor
              .update({
                'data.gmnote': textarea[0].value,
                'data.gmnoteedit': !actor.system.gmnoteedit,
              })
              .then(() => this.render())
          }
        }
      }
    })
  }

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  /** @override */
  async _updateObject(event, formData) {
    formData.id = this.object.id
    return await this.document.update(formData)
  }

  async _onItemCreate(event) {
    event.preventDefault()
    const header = event.currentTarget
    const type = header.dataset.type
    const data = foundry.utils.duplicate(header.dataset)

    const itemData = {
      name: `New ${capitalize(type)}`,
      type: type,
      system: data,
    }

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data.type

    await this.object.createItem(itemData)
    this.render(false)
  }
}
