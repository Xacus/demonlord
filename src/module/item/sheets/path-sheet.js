import DLBaseItemSheet from './base-item-sheet'
import {
  createActorNestedItems, deleteActorNestedItems,
  getNestedDocument,
  getNestedItemData,
  PathLevel,
  PathLevelItem
} from '../nested-objects'

export default class DLPathSheet extends DLBaseItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 700,
      height: 680,
    })
  }

  /** @override */
  async getData(options) {
    const data = await super.getData(options)
    data.system.levels = data.system.levels || []
    data.system.levels.sort(_sortLevels)

    // Localize Two Set labels if is 'view'
    if (!this.item.system.editPath)
      data.system.levels.forEach(l => {
        l.attributeSelectTwoSet1Label = game.i18n.localize(CONFIG.DL.attributes[l.attributeSelectTwoSet1])
        l.attributeSelectTwoSet2Label = game.i18n.localize(CONFIG.DL.attributes[l.attributeSelectTwoSet2])
        l.attributeSelectTwoSet3Label = game.i18n.localize(CONFIG.DL.attributes[l.attributeSelectTwoSet3])
        l.attributeSelectTwoSet4Label = game.i18n.localize(CONFIG.DL.attributes[l.attributeSelectTwoSet4])
      })

    //data.item.data.editPath = !game.user.isGM;
    // Which level the user has selected
    data.system.selectedLevelIndex = this._selectedLevelIndex || 0

    // Fetch contents of nested items
    for await (let i of data.system.levels.keys()) {
      data.system.levels[i].talents = await Promise.all(data.system.levels[i].talents.map(await getNestedItemData))
      data.system.levels[i].talentspick = await Promise.all(data.system.levels[i].talentspick.map(await getNestedItemData))
      data.system.levels[i].spells = await Promise.all(data.system.levels[i].spells.map(await getNestedItemData))
    }
    return data
  }

  /* -------------------------------------------- */
  /*  Listeners                                   */

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)
    if (!this.options.editable) return

    // Add level
    html.find('.add-level').click(async ev => {
      ev.preventDefault()
      await this.item.update({
        'system.levels': [...(this.item.system.levels || []), new PathLevel()],
      })
    })

    // Delete level
    html.find('.delete-level').click(async ev => await this.showLevelDeleteDialog(ev))

    // Delete item
    html.find('.delete-item').click(async ev => await this._deleteItem(ev))

    // Display/hide levels on click
    html.find('.dl-path-level-select').click(ev => {
      const levelIndex = $(ev.currentTarget).closest('[data-level-index]').data('levelIndex')
      const form = $(ev.currentTarget).closest("form")
      this._selectedLevelIndex = levelIndex
      form.find('.dl-path-level').each((_, pl) => {
        pl = $(pl)
        if (pl.data('levelIndex') === levelIndex) pl.show()
        else pl.hide()
      })
    })

    // Nested item transfer checkbox
    html.find('.dl-item-transfer').click(async ev => await this._transferItem(ev))
  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */

  /* -------------------------------------------- */

  showLevelDeleteDialog(ev) {
    const itemIndex = $(ev.currentTarget).closest('[data-level-index]').data('levelIndex')
    const d = new Dialog({
      title: game.i18n.localize('DL.PathsLevelDeleteDialogDeleteLevel'),
      content: game.i18n.localize('DL.PathsLevelDeleteDialogDeleteLevelText'),
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogYes'),
          callback: async _ => {
            const levels = this.item.system.levels
            levels.splice(itemIndex, 1)
            await this.item.update({'system.levels': levels})
          },
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('DL.DialogNo'),
          callback: () => {
          },
        },
      },
      default: 'no',
      close: () => {
      },
    })
    d.render(true)
  }

  /** @override */
  async _onDrop(ev) {
    const group = $(ev.currentTarget).closest('[data-group]').data('group')
    const level = $(ev.currentTarget).closest('[data-level]').data('level')
    try {
      $(ev.originalEvent.target).removeClass('drop-hover')
      const data = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'))
      if (data.type !== 'Item') return
      await this._addItem(data, level, group)
    } catch (err) {
      console.warn(err)
    }
  }

  async _addItem(data, level, group) {
    const levelItem = new PathLevelItem()
    const pathData = foundry.utils.duplicate(this.item)
    const item = await getNestedItemData(data)
    if (!item || ['ancestry', 'path', 'creaturerole'].includes(item.type)) return

    levelItem.uuid = item.uuid ?? data.uuid
    levelItem.id = item.id
    levelItem.name = item.name
    levelItem.description = item.system.description
    levelItem.pack = data.pack ? data.pack : ''
    levelItem.data = item

    if (group === 'talents') pathData.system.levels[level]?.talents.push(levelItem)
    else if (group === 'talentspick') pathData.system.levels[level]?.talentspick.push(levelItem)
    else if (group === 'spells') pathData.system.levels[level]?.spells.push(levelItem)

    await this.item.update(pathData)
  }

  async _deleteItem(ev) {
    const itemLevel = $(ev.currentTarget).closest('[data-level]').data('level')
    const itemGroup = $(ev.currentTarget).closest('[data-group]').data('group')
    const itemIndex = $(ev.currentTarget).closest('[data-item-index]').data('itemIndex')
    const itemData = foundry.utils.duplicate(this.item)

    if (itemGroup === 'talents') itemData.system.levels[itemLevel].talents.splice(itemIndex, 1)
    else if (itemGroup === 'talentspick') itemData.system.levels[itemLevel].talentspick.splice(itemIndex, 1)
    else if (itemGroup === 'spells') itemData.system.levels[itemLevel].spells.splice(itemIndex, 1)
    await this.item.update(itemData)
  }

  /* -------------------------------------------- */
  /*  Update Object                               */

  /* -------------------------------------------- */

  async _updateObject(event, formData) {
    const _name = formData['name'] || this.object.name
    const completeFormData = this._getPathDataFromForm()
    const updateData = {}

    updateData.editPath = formData['system.editPath']
    updateData.description = formData['system.description'] || this.object.system.description
    updateData.type = formData['system.type']

    if (completeFormData.length > 0) {
      if (this.object.system.editPath) {
        updateData.levels = this._getEditLevelsUpdateData(completeFormData)
        updateData.levels.sort(_sortLevels)

        // Set default image based on new path type
        const hasADefaultImage = Object.values(CONFIG.DL.defaultItemIcons.path).includes(formData.img)
        if (game.settings.get('demonlord', 'replaceIcons') && hasADefaultImage) {
          formData.img =
            CONFIG.DL.defaultItemIcons.path[formData['system.type']] || CONFIG.DL.defaultItemIcons.path.novice
        }
      } else {
        updateData.levels = this._getViewLevelsUpdateData(completeFormData)
      }
    }

    // Change the levels levels based on path type
    if (updateData.type && this.object.system.editPath && updateData.type !== this.item.system.type) {
      let autoLevels = []
      switch (updateData.type) {
        case 'novice':
          autoLevels = [1, 2, 5, 8];
          break
        case 'expert':
          autoLevels = [3, 6, 9];
          break
        case 'master':
          autoLevels = [7, 10];
          break
        case 'legendary':
          autoLevels = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
      }
      updateData.levels = updateData.levels ?? []
      for (let index of autoLevels.keys()) {
        if (!updateData.levels[index]) updateData.levels[index] = new PathLevel({level: autoLevels[index]})
        else updateData.levels[index].level = autoLevels[index]
      }
    }


    return await this.object.update({name: _name, img: formData.img, system: updateData})
  }

  /* -------------------------------------------- */

  _getViewLevelsUpdateData(completeFormData) {
    return this._mergeLevels(this.object.system.levels, completeFormData)
  }

  _getEditLevelsUpdateData(completeFormData) {
    const newLevels = completeFormData.map(cf => new PathLevel(cf))

    // Check duplicate levels in new data
    const hasDuplicates = new Set(newLevels.map(l => l.level)).size !== newLevels.length
    if (hasDuplicates) {
      ui.notifications.warn('Path items must not have duplicate levels')
      return this.object.system.levels
    }

    // Match the new levels with the old ones and keep the nested items
    const oldLevels = this.item.toObject().system.levels
    const notFound = [] // stores path levels that do not have been found in the current levels
    newLevels.forEach(newLevel => {
      const foundIndex = oldLevels.findIndex(l => +l.level === +newLevel.level)
      if (foundIndex >= 0) {
        // if index is found, remove the relative level from the list of old levels and keep the nested items
        const foundLevel = oldLevels.splice(foundIndex, 1)[0]
        this._keepNestedItems(newLevel, foundLevel)
        // Keep also the chosen user attributes
        if (newLevel.attributeSelectIsChooseTwo === foundLevel.attributeSelectIsChooseTwo || newLevel.attributeSelectIsChooseThree === foundLevel.attributeSelectIsChooseThree) {
          newLevel.attributeStrengthSelected = foundLevel.attributeStrengthSelected
          newLevel.attributeAgilitySelected = foundLevel.attributeAgilitySelected
          newLevel.attributeIntellectSelected = foundLevel.attributeIntellectSelected
          newLevel.attributeWillSelected = foundLevel.attributeWillSelected
        }
      } else notFound.push(newLevel)
    })
    // Assert that there is only one level not matching.
    // Not matching levels happen when a path level level changes so there should only be one
    if ((oldLevels.length > 1 && notFound.length > 1) || oldLevels.length !== notFound.length) {
      throw new Error('Error in path level matching')
    } else if (notFound.length === 1) {
      this._keepNestedItems(notFound[0], oldLevels[0])
    }
    return newLevels
  }

  /* -------------------------------------------- */

  _keepNestedItems(newLevelData, oldLevelData) {
    newLevelData.talentsSelected = oldLevelData?.talentsSelected || []
    newLevelData.talentspick = oldLevelData?.talentspick || []
    newLevelData.languages = oldLevelData?.languages || []
    newLevelData.talents = oldLevelData?.talents || []
    newLevelData.spells = oldLevelData?.spells || []
  }

  /* -------------------------------------------- */

  _getPathDataFromForm() {
    // Get all html elements that are 'path-level' and group their inputs by path-level
    const htmlLevels = []
    $(this.form)
      .find('.dl-path-level')
      .each((i, pl) => {
        htmlLevels.push($(pl).find("*[name^='level']"))
      })

    // From the htmlLevels, construct the levels array based on the input names and values
    const objLevels = []
    for (const hl of htmlLevels) {
      const obj = {}
      hl.each((i, input) => {
        const _name = input.getAttribute('name')
        if (input.tagName === 'SELECT') {
          obj[_name] = input.options[input?.selectedIndex]?.getAttribute('value')
        } else if (input.type === 'checkbox') {
          obj[_name] = input.checked || false
        } else if (input.type === 'radio') {
          if (input.checked) {
            if (_name === 'level.attributeSelect' || _name.startsWith('level.attributeSelectTwoSet')) {
              obj[_name] = input.getAttribute('value')
            } else {
              obj[_name] = input.value === 'true'
            }
          }
          if (_name.startsWith('level.attributeSelectTwoSetSelectedValue') && input.checked) {
            obj[_name] = (input.getAttribute('value') ?? input.value) === 'true'
          }
        } else {
          obj[_name] = input.value ?? input.getAttribute('value')
        }
      })
      objLevels.push(foundry.utils.expandObject(obj).level)
    }
    return objLevels
  }

  /* -------------------------------------------- */

  _mergeLevels(currentLevels, formLevels) {
    const warn = () => ui.notifications.warn('More attributes selected than allowed') // FIXME: localize

    let index = 0
    formLevels.sort(_sortLevels)
    currentLevels.sort(_sortLevels).forEach(currentLevel => {
      // Check if attribute select is none or fixed, if so skip the merging
      if (['', 'fixed'].includes(currentLevel)) {
        index++
        return
      }

      // Convert new level to map
      const newLevel = new Map(Object.entries(formLevels[index++]))

      // Get number of choices
      let newChoices = 0
      newLevel.forEach((v, k) => {
        if (k.includes('attribute') && v === true) newChoices++
      })

      if (currentLevel.attributeSelectIsTwoSet) {
        currentLevel.attributeSelectTwoSetSelectedValue1 = newLevel.get('attributeSelectTwoSetSelectedValue1')
        currentLevel.attributeSelectTwoSetSelectedValue2 = newLevel.get('attributeSelectTwoSetSelectedValue2')
      } else if (currentLevel.attributeSelectIsChooseTwo) {
        if (newChoices > 2) return warn()
        newLevel.forEach((v, k) => (currentLevel[k] = v))
      } else if (currentLevel.attributeSelectIsChooseThree) {
        if (newChoices > 3) return warn()
        newLevel.forEach((v, k) => (currentLevel[k] = v))
      }
    })

    return currentLevels
  }

  /** @override */
  async _onNestedItemCreate(ev) {
    const item = await super._onNestedItemCreate(ev)
    const group = $(ev.currentTarget).closest('[data-group]').data('group')
    const level = $(ev.currentTarget).closest('[data-level]').data('level')
    await this._addItem(item.data, level, group)
    return item
  }


  /** @override */
  async _onNestedItemEdit(ev) {
    const itemId = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
    const group = $(ev.currentTarget).closest('[data-group]').data('group')
    const level = $(ev.currentTarget).closest('[data-level]').data('level')

    const data = await this.getData({})
    const nestedData = data.system.levels[level][group].find(i => i._id === itemId)
    await getNestedDocument(nestedData).then(d => {
      if (d.sheet) d.sheet.render(true)
      else ui.notifications.warn('The item is not present in the game and cannot be edited.')
    })
  }

  async _transferItem(ev) {
    // Grab data from the event
    const itemIndex = $(ev.currentTarget).closest('[data-item-index]').data('itemIndex')
    const itemGroup = $(ev.currentTarget).closest('[data-group]').data('group')
    const itemId = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
    const itemLevelIndex = $(ev.currentTarget).closest('[data-level]').data('level')

    // Grab the nested item data
    const pathData = this.item.toObject()
    const nestedItemData = pathData.system.levels[itemLevelIndex][itemGroup][itemIndex]
    let selected = nestedItemData.selected = !nestedItemData.selected
    await this.document.update(pathData)

    // If the path is inside a character, and the actor level matches the item level, add it to the actor
    const actor = this.document.parent
    if (!actor || actor.type !== 'character') return
    const levelRequired = pathData.system.levels[itemLevelIndex].level
    if (parseInt(actor.system.level) >= levelRequired && selected)
      await createActorNestedItems(actor, [nestedItemData], this.document.id, levelRequired)
    else
      await deleteActorNestedItems(actor, null,  itemId)
  }
}

/* -------------------------------------------- */


const _sortLevels = (a, b) => (+a.level > +b.level ? 1 : -1)
