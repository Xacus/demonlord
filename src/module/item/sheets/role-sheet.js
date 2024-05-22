import DLBaseItemSheet from './base-item-sheet'
import {
  createActorNestedItems,
  deleteActorNestedItems,
  getNestedDocument,
  getNestedItemData,
  PathLevelItem
} from '../nested-objects'

export default class DLRoleSheet extends DLBaseItemSheet {
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
    data.item.editRole = false

    // Fetch the updated nested items properties (name, description, img)
    const roleData = data.system
    roleData.talents = await Promise.all(roleData.talents.map(await getNestedItemData))
    roleData.specialActions = await Promise.all(roleData.specialActions.map(await getNestedItemData))
    roleData.spells = await Promise.all(roleData.spells.map(await getNestedItemData))
    roleData.weapons = await Promise.all(roleData.weapons.map(await getNestedItemData))
    roleData.endOfRound = await Promise.all(roleData.endOfRound.map(await getNestedItemData))
    return data
  }

  /**
   * Sets actor's spell uses when power changes
   * @override */
  async _updateObject(event, formData) {
    const updateData = expandObject(formData)
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

    // Edit role talents
    html
      .find('.edit-roletalents')
      .click(async _ => await this.item.update({'system.editTalents': !this.item.system.editTalents}).then(() => this.render()))

    // Delete role item
    html.find('.delete-roleitem').click(async ev => {
      const itemGroup = $(ev.currentTarget).closest('[data-type]').data('type')
      const itemIndex = $(ev.currentTarget).closest('[data-item-index]').data('itemIndex')
      await this._deleteItem(itemIndex, itemGroup)
    })

    // Nested item transfer checkbox
    html.find('.dl-item-transfer').click(async ev => await this._transferItem(ev))

    html.find('.dl-stat-toggle').click(async ev => await this._toggleStat(ev))

    // Set immune on rollable attribute
    html.find('.attribute .name').contextmenu(async ev => {
      const div = $(ev.currentTarget)
      const keyName = `${div.data('key')}Immune`
      await this.item.update({ system: { attributes: { [keyName]: !this.item.system.attributes[keyName] } } })
    })
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
    const roleData = foundry.utils.duplicate(this.item)
    let item = await getNestedItemData(data)
    if (!item || ['ancestry', 'path', 'creaturerole'].includes(item.type)) return

    levelItem.uuid = item.uuid ?? data.uuid
    levelItem.id = item.id
    levelItem.name = item.name
    levelItem.description = item.system.description
    levelItem.pack = data.pack ? data.pack : ''
    levelItem.data = item

    if (group === 'talent') roleData.system.talents.push(levelItem)
    else if (group === 'weapon') roleData.system.weapons.push(levelItem)
    else if (group === 'spell') roleData.system.spells.push(levelItem)
    else if (group === 'endoftheround') roleData.system.endOfRound.push(levelItem)
    else return
    await this.item.update(roleData, {diff: false}).then(_ => this.render)
  }

  async _deleteItem(itemIndex, itemGroup) {
    const itemData = foundry.utils.duplicate(this.item)
    if (itemGroup === 'talent') itemData.system.talents.splice(itemIndex, 1)
    else if (itemGroup === 'weapon') itemData.system.weapons.splice(itemIndex, 1)
    else if (itemGroup === 'spell') itemData.system.spells.splice(itemIndex, 1)
    else if (itemGroup === 'endoftheround') itemData.system.endOfRound.splice(itemIndex, 1)
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
    const roleData = this.document.system
    let nestedItemData = undefined
    if (itemGroup === 'talent')
      nestedItemData = roleData.talents[itemIndex]
    else if (itemGroup === 'weapon')
      nestedItemData = roleData.weapons[itemIndex]
    else if (itemGroup === 'spell')
      nestedItemData = roleData.spells[itemIndex]
    else if (itemGroup === 'endoftheround')
      nestedItemData = roleData.endOfRound[itemIndex]
    else return

    let selected = nestedItemData.selected = !nestedItemData.selected
    await this.document.update({data: roleData})

    // If the role is inside a character, add or remove the item to the actor
    const actor = this.document.parent
    if (!actor) return
    if (selected)
      await createActorNestedItems(actor, [nestedItemData], this.document.id)
    else
      await deleteActorNestedItems(actor, null, itemId)
  }

  async _toggleStat(ev) {
    let path = $(ev.currentTarget).closest('[data-toggle-name').data('toggleName').trim()
    const currentValue = $(ev.currentTarget).hasClass('checked')

    await this.document.update({[path]: !currentValue})
  }


  /** @override */
  async _onNestedItemEdit(ev) {
    const itemId = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
    const roleData = this.object.system
    const nestedData =
      roleData.talents.find(i => i._id === itemId) ??
      roleData.weapons.find(i => i._id === itemId) ?? 
      roleData.spells.find(i => i._id === itemId) ??
      roleData.endOfRound.find(i => i._id === itemId)
    await getNestedDocument(nestedData).then(d => {
      if (d.sheet) d.sheet.render(true)
      else ui.notifications.warn('The item is not present in the game and cannot be edited.')
    })
  }

}
