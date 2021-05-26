import DLBaseItemSheet from './base-item-sheet'
import { getNestedItem, PathLevel, PathLevelItem } from '../nested-objects'
import { DemonlordItem } from '../item'

export default class DLPathSheet extends DLBaseItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      width: 475,
      height: 700,
    })
  }

  /** @override */
  getData(options) {
    const data = super.getData(options)
    data.levels = this.item.data.data.levels || []
    data.levels.sort((a, b) => (a?.level > b?.level ? 1 : -1))

    // Localize Two Set labels if is 'view'
    if (!this.item.data.data.editPath)
      data.levels.forEach(l => {
        l.attributeSelectTwoSet1Label = game.i18n.localize(CONFIG.DL.attributes[l.attributeSelectTwoSet1])
        l.attributeSelectTwoSet2Label = game.i18n.localize(CONFIG.DL.attributes[l.attributeSelectTwoSet2])
        l.attributeSelectTwoSet3Label = game.i18n.localize(CONFIG.DL.attributes[l.attributeSelectTwoSet3])
        l.attributeSelectTwoSet4Label = game.i18n.localize(CONFIG.DL.attributes[l.attributeSelectTwoSet4])
      })

    //data.item.data.editPath = !game.user.isGM;
    return data
  }

  get _width() {
    return 475
  }

  get _height() {
    return 700
  }

  /* -------------------------------------------- */
  /*  Listeners                                   */
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)
    if (!this.options.editable) return

    // Add level
    html.find('.add-level').click(ev => {
      ev.preventDefault()
      this.item.update({
        'data.levels': [...(this.item.data.data.levels || []), new PathLevel()],
      })
    })

    // Delete level
    html.find('.delete-level').click(ev => this.showLevelDeleteDialog(ev))

    // Delete item
    html.find('.delete-item').click(ev => this._deleteItem(ev))

    // Transfer talent
    html.find('.transfer-talent').click(ev => {
      this.showTransferDialog(
        game.i18n.localize('DL.PathsDialogTransferTalent'),
        game.i18n.localize('DL.PathsDialogTransferTalentText'),
        ev,
        'talents',
      )
    })

    // Transfer multiple talents
    html.find('.transfer-talents').click(ev => {
      this.showTransferDialog(
        game.i18n.localize('DL.PathsDialogTransferTalents'),
        game.i18n.localize('DL.PathsDialogTransferTalentsText'),
        ev,
        'transfer-talents',
      )
    })

    // Transfer talent pick
    html.find('.transfer-talentpick').click(ev => {
      this.showTransferDialog(
        game.i18n.localize('DL.PathsDialogTransferTalent'),
        game.i18n.localize('DL.PathsDialogTransferTalentText'),
        ev,
        'talentspick',
      )
    })

    // Transfer spell
    html.find('.transfer-spell').click(ev => {
      this.showTransferDialog(
        game.i18n.localize('DL.PathsDialogTransferSpell'),
        game.i18n.localize('DL.PathsDialogTransferSpellText'),
        ev,
        'spells',
      )
    })
  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */
  /* -------------------------------------------- */

  showLevelDeleteDialog(ev) {
    const itemIndex = ev.currentTarget.parentElement.parentElement.getAttribute('data-item-id')
    const d = new Dialog({
      title: game.i18n.localize('DL.PathsLevelDeleteDialogDeleteLevel'),
      content: game.i18n.localize('DL.PathsLevelDeleteDialogDeleteLevelText'),
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogYes'),
          callback: _ => {
            const levels = this.item.data.data.levels
            levels.splice(itemIndex, 1)
            this.item.update({ 'data.levels': levels })
          },
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

  /* -------------------------------------------- */

  /* -------------------------------------------- */

  showTransferDialog(title, content, event, type) {
    const d = new Dialog({
      title: title,
      content: content,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogYes'),
          callback: _ => this.transferItem(event, type),
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

  async transferItem(event, type) {
    event.preventDefault()
    const levelIndex = event.currentTarget.parentElement.parentElement.getAttribute('data-level')
    if (type === 'transfer-talents') {
      const toAdd = []
      for (const talent of this.object.data.data.levels[levelIndex].talents) {
        const i = await getNestedItem(talent)
        if (i) toAdd.push(duplicate(i.data))
      }
      if (toAdd.length > 0) await this.actor.createEmbeddedDocuments('Item', toAdd)
    } else {
      const itemIndex = event.currentTarget.getAttribute('data-item-id')
      const nestedItemData = this.object.data.data.levels[levelIndex][type][itemIndex]
      const item = await getNestedItem(nestedItemData)
      await DemonlordItem.create(duplicate(item.data), { parent: this.actor })
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _onDrop(ev) {
    const $dropTarget = $(ev.originalEvent.target)
    try {
      $dropTarget.removeClass('drop-hover')
      const data = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'))
      if (data.type !== 'Item') return
      const level = $dropTarget.data('level')
      const group = $dropTarget.data('group')
      this._addItem(data, level, group)
    } catch (err) {
      console.warn(err)
    }
  }

  async _addItem(data, level, group) {
    const levelItem = new PathLevelItem()
    const itemData = duplicate(this.item.data)
    const item = await getNestedItem(data)
    const type = item?.type
    if (!item || !(type === item.data.type)) return

    levelItem.id = item.id
    levelItem.name = item.name
    levelItem.description = item.data.data.description
    levelItem.pack = data.pack ? data.pack : ''

    if (group === 'talent') itemData.data.levels[level]?.talents.push(levelItem)
    else if (group === 'talentpick') itemData.data.levels[level]?.talentspick.push(levelItem)
    else if (group === 'spell') itemData.data.levels[level]?.spells.push(levelItem)

    this.item.update(itemData)
  }

  _deleteItem(ev) {
    const _parent = ev.currentTarget.parentElement
    const itemLevel = _parent.parentElement.parentElement.getAttribute('data-level')
    const itemGroup = _parent.parentElement.parentElement.getAttribute('data-group')
    const itemIndex = _parent.parentElement.getAttribute('data-item-id')
    const itemData = duplicate(this.item.data)

    if (itemGroup === 'talent') itemData.data.levels[itemLevel].talents.splice(itemIndex, 1)
    else if (itemGroup === 'talentpick') itemData.data.levels[itemLevel].talentspick.splice(itemIndex, 1)
    else if (itemGroup === 'spell') itemData.data.levels[itemLevel].spells.splice(itemIndex, 1)
    this.item.update(itemData)
  }

  /* -------------------------------------------- */
  /*  Update Object                               */
  /* -------------------------------------------- */

  async _updateObject(event, formData) {
    const _name = formData['name'] || this.object.name
    const allFormData = this._getPathDataFromForm()
    const updateData = {
      editPath: formData['data.editPath'],
      description: formData['data.description'],
      type: formData['data.type'],
    }

    if (this.object.data.data.editPath) {
      updateData.levels = allFormData.map(ld => new PathLevel(ld)) || []
      // Sort the levels and check for duplicate levels
      updateData.levels.sort((a, b) => (a?.level > b?.level ? 1 : -1))
      this.object.data.data.levels.sort((a, b) => (a?.level > b?.level ? 1 : -1))
      const hasDuplicates = new Set(updateData.levels.map(l => l.level)).size !== updateData.levels.length
      if (hasDuplicates) return ui.notifications.warn('Path items must not have duplicate levels')

      // Match the new levels with the old and keep the nested items
      // TODO: Code below can be fixed by using level ids
      const matches = [] // [[newLevel, oldLevel], ...]
      const notFound = [] // [[newLevel], ...]
      updateData.levels.forEach(newLevel => {
        const match = this.object.data.data.levels.find(l => l.level === newLevel.level)
        if (match) {
          this._keepNestedItems(newLevel, match)
          matches.push([newLevel, match])
        } else notFound.push(newLevel)
      })
      notFound.forEach(newLevel => {
        const levelsLevelList = matches.map(m => m[1].level)
        const oldLevel = this.object.data.data.levels.find(l => !levelsLevelList.includes(l.level))
        this._keepNestedItems(newLevel, oldLevel)
      })

    } else if (allFormData.length > 0) {
      updateData.levels = this._mergeLevels(this.object.data.data.levels, allFormData)
    }

    return this.object.update({ name: _name, data: updateData })
  }

  _keepNestedItems(newLevelData, oldLevelData) {
    newLevelData.talentsSelected = oldLevelData?.talentsSelected || []
    newLevelData.talentspick = oldLevelData?.talentspick || []
    newLevelData.languages = oldLevelData?.languages || []
    newLevelData.talents = oldLevelData?.talents || []
    newLevelData.spells = oldLevelData?.spells || []
  }

  _getPathDataFromForm() {
    // Get all html elements that are 'path-level' and group their inputs by path-level
    const htmlLevels = []
    $(this.form)
      .find('.path-level')
      .each((i, pl) => {
        htmlLevels.push($(pl).find("*[name^='level']"))
      })

    // From the htmlLevels, construct the levels array based on the input names and values
    const objLevels = []
    for (const hl of htmlLevels) {
      const obj = {}
      hl.each((i, input) => {
        if (input.tagName === 'SELECT') {
          obj[input.getAttribute('name')] = input.options[input?.selectedIndex]?.getAttribute('value')
        } else if (input.type === 'checkbox') {
          obj[input.getAttribute('name')] = input.checked || false
        } else if (input.type === 'radio') {
          if (input.checked) obj[input.getAttribute('name')] = input.value === 'true'
        } else {
          obj[input.getAttribute('name')] = input.value
        }
      })
      objLevels.push(expandObject(obj).level)
    }
    return objLevels
  }

  _mergeLevels(currentLevels, formLevels) {
    const warn = () => ui.notifications.warn('More attributes selected than allowed') // FIXME: localize

    let index = 0
    formLevels.sort((a, b) => (a?.level > b?.level ? 1 : -1))
    currentLevels
      .sort((a, b) => (a?.level > b?.level ? 1 : -1))
      .filter(cl => !['', 'fixed'].includes(cl.attributeSelect))
      .forEach(currentLevel => {
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
}
