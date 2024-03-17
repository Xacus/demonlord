import { capitalize } from "../utils/utils"

export class DLStatEditor extends FormApplication {

  constructor(object, options) {
    super(options)
    this.ancestry = object.ancestry
    this.statType = object.statType
    this.statName = object.statName
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['charactergenerator', 'sheet', 'actor'],
      width: 300,
      height: 208,
    })
  }

  /** @override */
  get template() {
    return 'systems/demonlord/templates/dialogs/stat-editor.hbs'
  }

  /* -------------------------------------------- */
  /**
   * Add the Entity name into the window title
   * @type {String}
   */
  get title() {
    return `${game.i18n.localize('DL.StatEditor')}: ${capitalize(this.statName)}`
  }

  /**
   * Construct and return the data object used to render the HTML template for this form application.
   * @return {Object}
   */
  getData() {
    return this.ancestry.system[this.statType][this.statName]
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)

    // Enable roll formula
    html.find('.stat-editor-roll-button').click(async ev => {
      const div = ev.currentTarget
      const target = div.parentElement.parentElement.firstElementChild
      const formula = div.previousElementSibling.value
      const roll = new Roll(formula, this.system)
      await roll.evaluate()
      target.value = roll.total
    })
  }

  /**
 * This method is called upon form submission after form data is validated
 * @param event {Event}       The initial triggering submission event
 * @param formData {Object}   The object of validated form data with which to update the object
 * @private
 */
  async _updateObject(event, formData) {
    console.log(this.ancestry)
    await this.ancestry.update({
      system: {
        [this.statType]: {
          [this.statName]: {
            value: formData.value,
            formula: formData.formula,
            immune: formData.immune
          }
        }
      }
    })

    this.ancestry.sheet.render(true)
  }
}
