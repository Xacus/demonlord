import DLBaseItemSheet from './base-item-sheet'
import { getNestedItem, getNestedItemsDataList, PathLevelItem } from '../nested-objects'

export default class DLAncestrySheet extends DLBaseItemSheet {
  /* -------------------------------------------- */
  /*  Data                                        */
  /* -------------------------------------------- */

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      width: 575,
      height: 700,
    })
  }

  /** @override */
  getData(options) {
    const data = super.getData(options)
    data.item.editAncestry = false
    return data
  }

  /**
   * Sets actor's spell uses when power changes
   * @override */
  async _updateObject(event, formData) {
    const updateData = expandObject(formData)
    if (this.item.actor && updateData.data?.characteristics?.power) this.item.actor.setUsesOnSpells()
    return this.object.update(updateData)
  }

  /* -------------------------------------------- */
  /*  Listeners                                   */
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)
    if (!this.options.editable) return

    // Radio buttons
    html.find('.radiotrue').click(_ => this.item.update({ 'data.level4.option1': true }))
    html.find('.radiofalse').click(_ => this.item.update({ 'data.level4.option1': false }))

    // Edit ancestry talents
    html
      .find('.edit-ancestrytalents')
      .click(_ => this.item.update({ 'data.editTalents': !this.item.data.data.editTalents }).then(() => this.render()))

    // Delete ancestry item
    html.find('.delete-ancestryitem').click(ev => {
      const itemGroup = ev.currentTarget.parentElement.parentElement.parentElement.getAttribute('data-group')
      const itemIndex = ev.currentTarget.parentElement.getAttribute('data-item-id')
      this._deleteItem(itemIndex, itemGroup)
    })

    // Transfer talents
    html.find('.transfer-talent').click(ev => this.showTransferDialog(ev))
    html.find('.transfer-talents').click(ev => this.showTransferDialog(ev))
  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */
  /* -------------------------------------------- */

  /** @override */
  _onDrop(ev) {
    const $dropTarget = $(ev.originalEvent.target)
    try {
      const data = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'))
      if (data.type === 'Item') {
        const group = $dropTarget.data('group')
        $dropTarget.removeClass('drop-hover')
        this._addItem(data, group)
      }
    } catch (e) {
      console.warn(e)
    }
  }

  async _addItem(data, group) {
    const levelItem = new PathLevelItem()
    const ancestryData = duplicate(this.item.data)
    let item = await getNestedItem(data)
    if (!item) return

    levelItem.id = item.id
    levelItem.name = item.name
    levelItem.description = item.data.description
    levelItem.pack = data.pack ? data.pack : ''
    levelItem.data = item

    if (group === 'talent') ancestryData.data.talents.push(levelItem)
    else if (group === 'talent4') ancestryData.data.level4.talent.push(levelItem)
    else if (group === 'language') ancestryData.data.languagelist.push(levelItem)
    else return
    this.item.update(ancestryData, { diff: false }).then(_ => this.render)
  }

  async _deleteItem(itemIndex, itemGroup) {
    const itemData = duplicate(this.item.data)
    if (itemGroup === 'talent') itemData.data.talents.splice(itemIndex, 1)
    else if (itemGroup === 'talent4') itemData.data.level4.talent.splice(itemIndex, 1)
    else if (itemGroup === 'language') itemData.data.languagelist.splice(itemIndex, 1)
    Item.updateDocuments([itemData], { parent: this.actor }).then(_ => this.render())
  }

  /* -------------------------------------------- */

  showTransferDialog(ev) {
    const d = new Dialog({
      title: game.i18n.localize('DL.PathsDialogTransferTalents'),
      content: game.i18n.localize('DL.PathsDialogTransferTalentsText'),
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogYes'),
          callback: _ => this.transferItem(ev),
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('DL.DialogNo'),
          callback: () => {},
        },
      },
      default: 'no',
      close: () => {},
    })
    d.render(true)
  }

  async transferItem(event) {
    event.preventDefault()
    if (!this.actor) return
    // Transfer all talents
    if (event.currentTarget.className.indexOf('transfer-talents')) {
      const itemGroup = event.currentTarget.getAttribute('data-group')
      let obj = itemGroup === 'talent' ? this.object.data.data.talents : this.object.data.data.level4.talent
      if (!obj) return
      const toAdd = await getNestedItemsDataList(obj)
      if (toAdd.length > 0) await this.actor.createEmbeddedDocuments('Item', toAdd)
    }
    // Transfer single Item
    else {
      const itemIndex = event.currentTarget.getAttribute('data-item-id')
      const itemGroup = event.currentTarget.parentElement.parentElement.getAttribute('data-group')
      let selectedLevelItem =
        itemGroup === 'talent'
          ? this.object.data.data.talents[itemIndex]
          : this.object.data.data.level4.talent[itemIndex]
      if (!selectedLevelItem) return
      let item = await getNestedItem(selectedLevelItem)
      if (item) await this.actor.createEmbeddedDocuments('Item', [item])
    }
  }
}
