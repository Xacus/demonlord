import DLBaseItemSheet from './base-item-sheet'
import {
  createActorNestedItems,
  deleteActorNestedItems,
  getNestedDocument,
  getNestedItemData,
  PathLevelItem
} from '../nested-objects'

import { DLStatEditor } from '../../dialog/stat-editor'

export default class DLAncestrySheet extends DLBaseItemSheet {
  /* -------------------------------------------- */
  /*  Data                                        */

  /* -------------------------------------------- */

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 650,
      height: 700,
    })
  }

  /** @override */
  async getData(options) {
    const data = await super.getData(options)
    data.item.editAncestry = false

    // Fetch the updated nested items properties (name, description, img)
    const ancestryData = data.system
    ancestryData.languagelist = await Promise.all(ancestryData.languagelist.map(await getNestedItemData))
    ancestryData.talents = await Promise.all(ancestryData.talents.map(await getNestedItemData))
    ancestryData.level4.talent = await Promise.all(ancestryData.level4.talent.map(await getNestedItemData))
    ancestryData.level4.spells = await Promise.all(ancestryData.level4.spells?.map(await getNestedItemData))
    return data
  }

  /**
   * Sets actor's spell uses when power changes
   * @override */
  async _updateObject(event, formData) {
    const updateData = foundry.utils.expandObject(formData)
    if (this.item.actor && updateData.system?.characteristics?.power) await this.item.actor.setUsesOnSpells()
    return await this.object.update(updateData)
  }

  /* -------------------------------------------- */
  /*  Listeners                                   */

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)
    if (!this.options.editable) return

    // Edit dialogs
    html.find('.editable-stat').contextmenu(async ev => await this._onStatEdit(ev))

    // Radio buttons
    html.find('.radiotrue').click(async _ => await this.item.update({'system.level4.option1': true}))
    html.find('.radiofalse').click(async _ => await this.item.update({'system.level4.option1': false}))

    // Edit ancestry talents
    html.find('.edit-ancestrytalents').click(async _ => await this.item.update({'system.editTalents': !this.item.system.editTalents}).then(() => this.render()))

    // Delete ancestry item
    html.find('.delete-ancestryitem').click(async ev => {
      const itemGroup = $(ev.currentTarget).closest('[data-type]').data('type')
      const itemIndex = $(ev.currentTarget).closest('[data-item-index]').data('itemIndex')
      await this._deleteItem(itemIndex, itemGroup)
    })

    // Nested item transfer checkbox
    html.find('.dl-item-transfer').click(async ev => await this._transferItem(ev))
  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */
  /* -------------------------------------------- */

  /** @override */
  async _onDrop(ev) {
    const $dropTarget = $(ev.originalEvent.target)
    const group = $dropTarget.closest('[data-group]').data('group')
    try {
      const data = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'))
      if (data.type === 'Item') {
        $dropTarget.removeClass('drop-hover')
        await this._addItem(data, group)
      }
    } catch (e) {
      console.warn(e)
    }
  }

  async _addItem(data, group) {
    const levelItem = new PathLevelItem()
    const ancestryData = foundry.utils.duplicate(this.item)
    let item = await getNestedItemData(data)
    if (!item || ['ancestry', 'path', 'creaturerole'].includes(item.type)) return

    levelItem.uuid = item.uuid ?? data.uuid
    levelItem.id = item.id
    levelItem.name = item.name
    levelItem.description = item.system.description
    levelItem.pack = data.pack ? data.pack : ''
    levelItem.data = item

    if (group === 'talent') ancestryData.system.talents.push(levelItem)
    else if (group === 'talent4') ancestryData.system.level4.talent.push(levelItem)
    else if (group === 'language') ancestryData.system.languagelist.push(levelItem)
    else if (group === 'spells4') ancestryData.system.level4.spells.push(levelItem)
    else return
    await this.item.update(ancestryData, {diff: false}).then(_ => this.render)
  }

  async _deleteItem(itemIndex, itemGroup) {
    const itemData = foundry.utils.duplicate(this.item)
    if (itemGroup === 'talent') itemData.system.talents.splice(itemIndex, 1)
    else if (itemGroup === 'talent4') itemData.system.level4.talent.splice(itemIndex, 1)
    else if (itemGroup === 'language') itemData.system.languagelist.splice(itemIndex, 1)
    else if (itemGroup === 'spells4') itemData.system.level4.spells.splice(itemIndex, 1)
    await Item.updateDocuments([itemData], {parent: this.actor}).then(_ => this.render())
  }

  /* -------------------------------------------- */

  /** @override */
  async _onNestedItemCreate(ev) {
    const item = await super._onNestedItemCreate(ev)
    const group = $(ev.currentTarget).closest('[data-group]').data('group')
    await this._addItem(item.data, group)
    return item
  }

  async _transferItem(ev) {
    // Grab data from the event
    const itemIndex = $(ev.currentTarget).closest('[data-item-index]').data('itemIndex')
    const itemGroup = $(ev.currentTarget).closest('[data-group]').data('group')
    const itemId = $(ev.currentTarget).closest('[data-item-id]').data('itemId')

    // Based on the group, index and id, update the nested item to selected
    const ancestryData = this.document.system
    let nestedItemData = undefined
    if (itemGroup === 'talent4')
      nestedItemData = ancestryData.level4.talent[itemIndex]
    else if (itemGroup === 'spells4')
      nestedItemData = ancestryData.level4.spells[itemIndex]
    else return

    let selected = nestedItemData.selected = !nestedItemData.selected
    await this.document.update({system: ancestryData})

    // If the ancestry is inside a character, and the actor's level is >= 4, add or remove the item to the actor
    const actor = this.document.parent
    if (!actor || actor.type !== 'character') return
    if (parseInt(actor.system.level) >= 4 && selected)
      await createActorNestedItems(actor, [nestedItemData], this.document.id, 4)
    else
      await deleteActorNestedItems(actor, null, itemId)
  }


  /** @override */
  async _onNestedItemEdit(ev) {
    const itemId = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
    const ancestryData = this.object.system
    const nestedData =
      ancestryData.languagelist.find(i => i._id === itemId) ??
      ancestryData.talents.find(i => i._id === itemId) ??
      ancestryData.level4.talent.find(i => i._id === itemId) ??
      ancestryData.level4.spells.find(i => i._id === itemId)
    await getNestedDocument(nestedData).then(d => {
      if (d.sheet) d.sheet.render(true)
      else ui.notifications.warn('The item is not present in the game and cannot be edited.')
    })
  }


  async _onStatEdit(ev) {
    const div = $(ev.currentTarget)
    const statType = div.data('statType')
    const statName = div.data('statName')
    new DLStatEditor({ ancestry: this.object, statType: statType, statName: statName }, {
      top: 50,
      right: 700,
    }).render(true)
  }
}
