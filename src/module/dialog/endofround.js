const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class DLEndOfRound extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: 'form',
    form: {
      handler: this.onSubmit,
      submitOnChange: false,
      closeOnSubmit: true
    },
    //id: 'sheet-modifiers',
    //title: 'End of the Round Effects',
    classes: ['sheet', 'end-of-round'],
    actions: {
      toggleEffectInfo: this.toggleEffectInfo,
      editItem: this.editItem,
      rollItem: this.rollItem,
    },
    position: {
      width: 430,
      height: 430
    }
  }

  static PARTS = {
    form: {
      template: 'systems/demonlord/templates/dialogs/endofround-dialog.hbs'
    }
  }
  
  /** @inheritDoc */
  get title() {
    return game.i18n.localize('DL.CreatureSpecialEndRound')
  }

  /**
   * Prepare application rendering context data for a given render request.
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
   * @protected
   */
  async _prepareContext() {
    const creatures = []
    //const currentCombat = game.combat
    const combatants = Array.from(this.currentCombat.combatants?.values()) || []

    await combatants
      .filter(combatant => !combatant.defeated && combatant.actor.type === 'creature')
      .filter(combatant => combatant.actor.items.filter(i => i.type === 'endoftheround').length > 0)
      .sort((a, b) => (a.initiative > b.initiative ? -1 : 1))
      .forEach(async (combatant, index) => {
        creatures[index] = {
          tokenActorId: combatant.token.actorId,
          initiative: combatant.initiative,
          actor: combatant.actor,
          token: combatant.token,
          endOfRoundEffects: await combatant.actor.items.filter(i => i.type === 'endoftheround'),
        }
      })

    // Enrich descriptions
    for (const creature of creatures) {
      creature.endOfRoundEffects.forEach(async e => {
        e.system.enrichedDescription = await TextEditor.enrichHTML(e.system.description)
      })
    }

    return { creatures }
  }

  // /* -------------------------------------------- */

   /**
   * Process form submission for the sheet
   * @this {MyApplication}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
   static async onSubmit(event, form, formData) {
    await this.object.update({
      formData
    })
    this.object.sheet.render(true)
  }

  /**
   * Toggle Spell Info
   * @param {*} event 
   * @param {*} target 
   */
  static async toggleEffectInfo(event) {
    const infoElement = event.target.parentElement.querySelector('.effectInfo')
    infoElement.style.display = infoElement.style.display === 'none' ? 'block' : 'none'
  }

  static async editItem(event) {
    const itemId = event.target.closest("[data-item-id]").dataset.itemId
    const actorId = event.target.closest("[data-actor-id]").dataset.actorId
    const actor = this.object.combatants.find(c => c.actor._id === actorId).actor
    const item = actor.items.get(itemId)
    item.sheet.render(true)
  }

  static async rollItem(event) {
    event.preventDefault()
      const dataset = event.target.dataset
      if (dataset.roll) {
        const roll = new Roll(dataset.roll, this.actor.system)
        const label = dataset.label ? `Rolling ${dataset.label}` : ''
        await roll.roll().toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label,
        })
      } else {
        const itemId = event.target.closest("[data-item-id]").dataset.itemId
        const actorId = event.target.closest("[data-actor-id]").dataset.actorId
        const actor = this.currentCombat.combatants.find(c => c.actor._id === actorId).actor
        await actor.rollItem(itemId, { event: event })
      }
  }

  constructor(object, options) {
    super(options)
    this.currentCombat = object
  }
}
