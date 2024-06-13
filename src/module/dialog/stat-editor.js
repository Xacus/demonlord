import { capitalize } from "../utils/utils"

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class DLStatEditor extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: 'form',
    form: {
      handler: this.onSubmit,
      submitOnChange: false,
      closeOnSubmit: true
    },
    classes: ['sheet', 'actor', 'stat-editor'],
    actions: {
      rollStat: this.rollStat
    },
    position: {
      width: 300,
      height: 230,
    }
  }

  static PARTS = {
    form: {
      template: 'systems/demonlord/templates/dialogs/stat-editor.hbs'
    }
  }

  /** @inheritDoc */
  get title() {
    return `${game.i18n.localize('DL.StatEditor')}: ${capitalize(this.statName)}`
  }

/**
 * Prepare application rendering context data for a given render request.
 * @param {RenderOptions} options                 Options which configure application rendering behavior
 * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
 * @protected
 */
  async _prepareContext(options) { // eslint-disable-line no-unused-vars
    return this.ancestry.system[this.statType][this.statName]
  }

   /**
   * Process form submission for the sheet
   * @this {MyApplication}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async onSubmit(event, form, formData) {
    console.log(this.ancestry)
    await this.ancestry.update({
      system: {
        [this.statType]: {
          [this.statName]: {
            value: formData.object.value,
            formula: formData.object.formula,
            immune: formData.object.immune
          }
        }
      }
    })

    this.ancestry.sheet.render(true)
  }

  /**
   * 
   * @param {SubmitEvent} event 
   * @param {HtmlElement} target 
   */
  static async rollStat(event, target) { // eslint-disable-line no-unused-vars
    const divTarget = document.getElementById('stat-editor-roll-target')
    const formula = document.getElementById('stat-editor-roll-formula').value
    const roll = new Roll(formula, this.ancestry.system)
    await roll.evaluate()
    divTarget.value = roll.total
  }

  constructor(object, options) {
    super(options)
    this.ancestry = object.ancestry
    this.statType = object.statType
    this.statName = object.statName
  }

  // /**
  //  * Construct and return the data object used to render the HTML template for this form application.
  //  * @return {Object}
  //  */
  // getData() {
  //   return this.ancestry.system[this.statType][this.statName]
  // }
}