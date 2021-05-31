export class DLEndOfRound extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions
    options.id = 'sheet-modifiers'
    options.classes = ['demonlorddialog', 'dialog']
    options.template = 'systems/demonlord/templates/dialogs/endofround-dialog.html'
    options.width = 430
    options.height = 430
    return options
  }
  /* -------------------------------------------- */
  /**
   * Add the Entity name into the window title
   * @type {String}
   */
  get title() {
    return `End of the Round Effects`
  }
  /* -------------------------------------------- */

  /**
   * Construct and return the data object used to render the HTML template for this form application.
   * @return {Object}
   */
  getData() {
    let creatures = {}
    const currentCombat = game.combat
    const combatants = Array.from(currentCombat.combatants?.values()) || []

    combatants
      .filter(combatant => !combatant.data.defeated && combatant.actor.data.type === 'creature')
      .sort((a, b) => (a.initiative > b.initiative ? -1 : 1))
      .forEach((combatant, index) => {
        creatures[index] = {
          tokenActorId: combatant.token.actorId,
          initiative: combatant.initiative,
          actor: combatant.actor,
          token: combatant.token,
          endOfRoundEffects: combatant.actor.items.filter(i => i.type === 'endoftheround'),
        }
      })

    return { creatures }
  }
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)

    // Toggle Spell Info
    html.find('.toggleEffectInfo').click(ev => {
      const div = ev.currentTarget
      const _parent = div.parentElement
      if (_parent.children[2].style.display === 'none') {
        _parent.children[2].style.display = 'block'
      } else {
        _parent.children[2].style.display = 'none'
      }
    })
  }

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject(event, formData) {
    this.object.update({
      formData,
    })
    this.object.sheet.render(true)
  }
}
