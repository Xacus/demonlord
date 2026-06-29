import { capitalize } from "../utils/utils"

export class DLRegionBehaviorEditor extends foundry.applications.sheets.RegionConfig {
  static DEFAULT_OPTIONS = {
    tag: 'form',
    classes: ['sheet', 'item', 'region-behavior-editor'],
    form: {
      handler: this.onSubmit
    }
  }

  static PARTS = {
    behaviors: {
      template: "templates/scene/parts/region-behaviors.hbs",
      scrollable: [".scrollable"]
    },
    footer: {
      template: "templates/generic/form-footer.hbs"
    }
  }

  static TABS = {
    sheet: {
      tabs: [
        {id: "behaviors", icon: "fa-solid fa-child-reaching"}
      ],
      initial: "behaviors",
      labelPrefix: "REGION.TABS"
    }
  }

  /** @inheritDoc */
  get title() {
    return `${game.i18n.localize('DL.RegionBehaviorEditor')}: ${capitalize(this.item.name)}`
  }

  /** @override */
  _updateLevelsSelectElement(_event) {
    return
  }

  /**
  * Process form submission for the sheet
  * @this {MyApplication}                      The handler is called with the application as its bound scope
  * @param {SubmitEvent} event                   The originating form submission event
  * @param {HTMLFormElement} form                The form element that was submitted
  * @param {FormDataExtended} formData           Processed data for the submitted form
  * @returns {Promise<void>}
  */
  static async onSubmit(_event, _form, _formData) {
    // Then, when config is submitted, hook into _onUpdate and copy the behaviours back into the item
    const behaviors = this.document.behaviors.map(b => {
      return {
        name: b.name,
        type: b.type,
        disabled: b.disabled,
        system: b.system
      }
    })

    await this.item.update({
      system: {
        activatedEffect: {
          behaviors: behaviors
        }
      }
    })
  }

  /** @override */
  _onClose(_event, _form, _formData) {
    // Delete the ephemeral region
    this.document?.delete()

    return super._onClose(_event, _form, _formData)
  }

  constructor(options) {
    super(options)
    this.item = options.item
  }
}
