export class DLEndOfRound extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions
    options.id = 'sheet-modifiers'
    options.classes = ['demonlorddialog', 'dialog']
    options.template = 'systems/demonlord08/templates/dialogs/endofround-dialog.html'
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
    const currentCombat = this.object.data
    let creatures = {}
    const registerCreature = (i, actor, token, init) => {
      creatures[i] = {
        tokenActorId: token.actorId,
        initiative: init,
        actor: actor,
        token: token,
        endOfRoundEffects: [],
      }
    }

    var dictCombatants = new Map()
    for (const combatant of currentCombat.combatants.sort((a, b) => (a.initiative > b.initiative ? -1 : 1))) {
      if (!combatant.defeated && combatant.actor?.data?.type !== 'character')
        dictCombatants.set(combatant.token.actorId, combatant)
    }

    let s = 0
    dictCombatants.values().forEach(combatant => {
      const actor = combatant.actor
      registerCreature(s, actor, combatant.token, combatant.initiative)

      const endofrounds = combatant.actor.getEmbeddedCollection('Item').filter(e => 'endoftheround' === e.type)
      for (let endofround of endofrounds) {
        creatures[s].endOfRoundEffects.push(endofround)
      }
      s++
    })
    /*
         let s = 0;
         for (const combatant of currentCombat.combatants) {
             if (!combatant.defeated && combatant.actor?.data?.type != "character") {
                 const actor = combatant.actor;
                 registerCreature(s, actor, combatant.token);

                 const endofrounds = combatant.actor.getEmbeddedCollection("Item").filter(e => "endoftheround" === e.type);
                 for (let endofround of endofrounds) {
                     creatures[s].endOfRoundEffects.push(endofround);
                 }
                 s++
             }
         }
         */

    return {
      creatures,
    }
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
