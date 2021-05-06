/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class DemonlordItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['demonlord', 'sheet', 'item'],
      width: 520,
      height: 520,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'attributes'
        }
      ]
    })
  }

  /** @override */
  get template () {
    const path = 'systems/demonlord08/templates/item'
    return `${path}/item-${this.item.data.type}-sheet.html`
  }

  /* -------------------------------------------- */

  /** @override */
  getData () {
    const data = super.getData()
    const itemData = data.data;

    data.item = itemData;
    data.data = itemData.data;
    return data
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition (options = {}) {
    const position = super.setPosition(options)
    const sheetBody = this.element.find('.sheet-body')
    const bodyHeight = position.height - 192
    sheetBody.css('height', bodyHeight)
    return position
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners (html) {
    super.activateListeners(html)

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    html.find('.radiotrue').click((ev) => {
      this.updateOption(true)
    })

    html.find('.radiofalse').click((ev) => {
      this.updateOption(false)
    })
  }

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject (event, formData) {
    const item = this.object
    const updateData = expandObject(formData)

    if (item.type == 'talent') {
      // If a Talent has no uses it's always active
      if (
        (updateData.data?.uses?.value == '' &&
          updateData.data?.uses?.max == '') ||
        (updateData.data?.uses?.value == '0' &&
          updateData.data?.uses?.max == '0')
      ) {
        await this.object.update({
          'data.addtonextroll': true
        })
      } else {
        await this.document.update({
          'data.addtonextroll': false
        })
      }
    }

    return this.document.update(updateData)
  }

  async updateOption (selected) {
    await this.object.update({
      'data.level4.option1': selected
    })
  }
}
