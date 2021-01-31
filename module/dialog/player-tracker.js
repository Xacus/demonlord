export class PlayerTracker extends FormApplication {
  static get defaultOptions () {
    const options = super.defaultOptions
    options.id = 'sheet-modifiers'
    options.classes = ['playertracker', 'sheet', 'actor']
    options.template = 'systems/demonlord/templates/dialogs/player-tracker.html'
    options.width = game.users.players.length * 150
    options.height = 'auto'
    return options
  }

  /* -------------------------------------------- */
  /**
   * Add the Entity name into the window title
   * @type {String}
   */
  get title () {
    return `Player Tracker`
  }
  /* -------------------------------------------- */

  /**
   * Construct and return the data object used to render the HTML template for this form application.
   * @return {Object}
   */
  getData () {
    const players = game.users.players
    const persons = []

    for (const player of players) {
      var person = {
        playerid: player.character?._id,
        playername: player.name,
        charactername: player.character?.name,
        ancestry: player.character?.items
          .filter((e) => e.type === 'ancestry')
          .map((e) => e.name),
        paths: {
          novice: player.character?.items
            .filter((e) => e.type === 'path' && e.data.data.type === 'novice')
            .map((e) => e.name),
          expert: player.character?.items
            .filter((e) => e.type === 'path' && e.data.data.type === 'expert')
            .map((e) => e.name),
          master: player.character?.items
            .filter((e) => e.type === 'path' && e.data.data.type === 'master')
            .map((e) => e.name)
        },
        professions: player.character?.items.filter(
          (e) => e.type === 'profession'
        ),
        defense: player.character?.data.data.characteristics.defense,
        damage:
          player.character?.data.data.characteristics.health.value +
          '/' +
          player.character?.data.data.characteristics.health.max,
        gmnote: player.character?.data.data.gmnote,
        gmnoteedit: player.character?.data.data.gmnoteedit
      }
      persons.push(person)
    }

    return {
      persons
    }
  }
  /* -------------------------------------------- */

  /** @override */
  activateListeners (html) {
    super.activateListeners(html)

    if (!this.options.editable) return

    html.find('.gmnote-control').click((ev) => {
      const a = ev.currentTarget
      const actor = game.actors.get(a.dataset.id)

      if (actor) {
        switch (a.dataset.action) {
          case 'edit':
            return actor
              .update({
                'data.gmnoteedit': !actor.data.data.gmnoteedit
              })
              .then((item) => {
                this.render()
              })
          case 'save':
            const textarea = html.find(
              'textarea[id="person.' + actor._id + '"]'
            )

            return actor
              .update({
                'data.gmnote': textarea[0].value,
                'data.gmnoteedit': !actor.data.data.gmnoteedit
              })
              .then((item) => {
                this.render()
              })
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
  async _updateObject (event, formData) {
    formData._id = this.object._id
    return this.entity.update(formData)
  }

  async _onItemCreate (event) {
    event.preventDefault()
    const header = event.currentTarget
    const type = header.dataset.type
    const data = duplicate(header.dataset)
    const name = `New ${type.capitalize()}`

    const itemData = {
      name: name,
      type: type,
      data: data
    }

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data.type

    await this.object.createOwnedItem(itemData)
    this.render(false)
  }
}
