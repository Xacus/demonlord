const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class DLFrighteningHorrifyingEditor extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: 'form',
    form: {
      handler: this.onSubmit,
      submitOnChange: false,
      closeOnSubmit: true
    },
    classes: ['sheet', 'actor', 'frightening-horrifying-editor'],
    actions: {
    },
    position: {
      width: 300,
      height: 300,
    }
  }

  static PARTS = {
    form: {
      template: 'systems/demonlord/templates/dialogs/frightening-horrifying-editor.hbs'
    }
  }

  /** @inheritDoc */
  get title() {
    return `${game.i18n.localize('DL.FrighteningHorrifyingEditor')}`
  }

/**
 * Prepare application rendering context data for a given render request.
 * @param {RenderOptions} options                 Options which configure application rendering behavior
 * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
 * @protected
 */
  async _prepareContext(options) { // eslint-disable-line no-unused-vars
    let context = await super._prepareContext(options)

    // Placeholders, replace with actual data as needed
    /*context.frightening = this.actor.system.frighteningHorrifyingTrait.frightening
    context.horrifying = this.actor.system.frighteningHorrifyingTrait.horrifying
    context.rollBanes = this.actor.system.frighteningHorrifyingTrait.rollBanes
    context.affectedRolls = this.actor.system.frighteningHorrifyingTrait.affectedRolls
    context.insanityFormula = this.actor.system.frighteningHorrifyingTrait.insanityFormula*/

    return context
  }

   /**
   * Process form submission for the sheet
   * @this {MyApplication}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} _event                   The originating form submission event
   * @param {HTMLFormElement} _form                The form element that was submitted
   * @param {FormDataExtended} _formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async onSubmit(_event, _form, _formData) {
    // Update with data above (like in _prepareContext)
    await this.actor.update({
      system: {
        /*frighteningHorrifyingTrait: {
          frightening: formData.object.frightening,
          horrifying: formData.object.horrifying,
          affectedRolls: formData.object.affectedRolls,
          insanityFormula: formData.object.insanityFormula
        }*/
      }
    })

    this.actor.sheet.render(true)
  }

  constructor(object, options) {
    super(options)
    this.actor = object.actor
  }
}
