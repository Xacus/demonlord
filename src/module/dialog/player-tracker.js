const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api

import { capitalize } from '../utils/utils'


export class PlayerTracker extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: 'form',
    id: 'sheet-modifiers',
    classes: ['playertracker', 'sheet', 'actor'],
    form: {
      handler: PlayerTracker.handler,
      closeOnSubmit: false,
      submitOnChange: false
    },
    actions: {
      updateWindow: this.updateWindow,
    },
    position: {
      top: 60,
      left: 120,
      width: 150,
      height: 'auto'
    },
    window: {
      title: 'Player Tracker',
      controls: [
        {
          label: 'DL.UpdatePlayerTracker',
          class: 'update-playertracker',
          icon: 'fas fa-sync-alt',
          action: 'updateWindow',
        }
      ]
    },
    scrollY: ['.tab.active'],
  }

  static PARTS = {
    body: {
      template: 'systems/demonlord/templates/dialogs/player-tracker.hbs'
    }
  }

  // static TABS = {
  //   primary: {
  //     tabs: [
  //       { id: 'character', icon: 'icon-character', tooltip: 'DL.TabsGeneral'},
  //     ]
  //   }
  // }

  /* -------------------------------------------- */

  static updateWindow(event) {
    event.preventDefault()
    this.render(true)
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options)

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

    context.persons = persons

    return context
  }
  /* -------------------------------------------- */

  _configureRenderOptions(options) {
    super._configureRenderOptions(options)
    options.parts = ['body']
    this.position.width = game.users.players.length * 150
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options)

    if (!this.options.editable) return

    const html = $(this.element)

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
  async handler(event, form, formData) {
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
