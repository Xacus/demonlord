const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class DLTransformationDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: 'form',
    form: {
      handler: this.onSubmit,
      submitOnChange: false,
      closeOnSubmit: true,
    },
    classes: ['transformation-dialog'],
    actions: {},
    position: {
      width: 550,
      height: 'auto',
    },
  }

  static PARTS = {
    form: {
      template: 'systems/demonlord/templates/dialogs/transformation-dialog.hbs',
    },
  }

  get title() {
    return `${game.i18n.localize('DL.TransformationDialog')}`
  }

  /** @override */
  // eslint-disable-next-line no-unused-vars
  async _onFirstRender(context, options) {
    const checkBoxes = this.element.querySelectorAll("input[type='checkbox']")
    for (const cb of checkBoxes) {
      if (this.disabledCheckBoxes.includes(cb.name)) cb.disabled = true
      if (!this.nonPreselectedCheckBoxes.includes(cb.name) && !this.disabledCheckBoxes.includes(cb.name))
        cb.checked = true
    }
  }

  /** @override */
  async _prepareContext(options) {
    let context = await super._prepareContext(options)
    context.actor = this.actor
    context.source = this.source
    return context
  }

  /** @override */
  async _onSubmitForm(formConfig, event) {
    super._onSubmitForm(formConfig, event)
    let options = new Set([])
    const cbs = this.element.querySelectorAll("input[type='checkbox']")
    const checkBoxes = [...cbs]
    for (const cb of checkBoxes) {
      if (cb.checked) options.add(cb.name)
    }
    this.options = options
    await this.actor.transformInto(this.source, this.options, {renderSheet : true})
  }

  /** @override */
  async _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event)
    const checkBoxes = this.element.querySelectorAll("input[type='checkbox']")
    if (event.srcElement.name === 'keep.self' && event.srcElement.checked) {
      for (const cb of checkBoxes) {
        if (cb.name != 'keep.self') {
          cb.checked = false
          cb.disabled = true
        }
      }
    }
    if (event.srcElement.name === 'keep.self' && !event.srcElement.checked) {
      for (const cb of checkBoxes) {
        if (!this.disabledCheckBoxes.includes(cb.name)) cb.disabled = false
        if (!this.nonPreselectedCheckBoxes.includes(cb.name) && !this.disabledCheckBoxes.includes(cb.name))
          cb.checked = true
      }
    }
    if (event.srcElement.name === 'keep.mental') {
      const cb = this.element.querySelector("input[id='keep-perception']")
      if (event.srcElement.checked) {
        cb.disabled = false
        cb.checked = false
      } else {
        cb.disabled = true
        cb.checked = false
      }
    }
    if (event.srcElement.name === 'keep.perception') {
      const cb = this.element.querySelector("input[id='keep-mental']")
      if (event.srcElement.checked) {
        cb.disabled = true
        cb.checked = true
      } else {
        cb.disabled = false
        cb.checked = true
      }
    }
  }

  disableCheckBoxes() {
    let disabledCheckBoxes = []

    if (this.actor.items.filter(i => i.type === 'language').length === 0) disabledCheckBoxes.push('keep.languages')
    if (this.actor.items.filter(i => i.type === 'profession').length === 0) disabledCheckBoxes.push('keep.professions')
    if (this.actor.items.filter(i => i.type === 'spell').length === 0) disabledCheckBoxes.push('keep.spells')

    return disabledCheckBoxes
  }

  constructor(object, options) {
    super(options)
    this.actor = object.actor
    this.source = object.source
    this.disabledCheckBoxes = this.disableCheckBoxes()
    this.nonPreselectedCheckBoxes = [
      'keep.health',
      'keep.languages',
      'keep.perception',
      'keep.physical',
      'keep.professions',
      'keep.self',
      'keep.spells',
      'keep.vision',
    ]
  }
}
