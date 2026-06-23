import { capitalize } from "../utils/utils"

export class DLRegionBehaviorEditor extends foundry.applications.sheets.RegionConfig {
  static DEFAULT_OPTIONS = {
    tag: 'form',
    classes: ['sheet', 'item', 'region-behavior-editor'],
    form: {
      handler: this.onSubmit,
      close: this.onClose
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
        type: b.type,
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

    // And delete the ephemeral region
    this.document.delete()
  }

  constructor(options) {
    super(options)
    this.item = options.item
  }
}
