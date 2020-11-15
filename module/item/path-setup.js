/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
import { PathLevel, PathLevelItem } from '../pathlevel.js'
export class DemonlordPathSetup extends ItemSheet {
  /** @override */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['demonlord2', 'sheet', 'item'],
      template: 'systems/demonlord/templates/item/path-setup.html',
      width: 620,
      height: 550,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'attributes'
        }
      ],
      scrollY: ['.tab.paths']
    })
  }

  /* -------------------------------------------- */

  /** @override */
  getData () {
    const data = super.getData()

    if (this.item.data.type == 'path') {
      this._prepareLevels(data)
    }

    return data
  }

  _prepareLevels (data) {
    const itemData = data.item
    const levels = []

    for (const level of itemData.data.levels) {
      levels.push(level)
    }

    itemData.levels = levels
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition (options = {}) {
    const position = super.setPosition(options)
    const sheetBody = this.element.find('.sheet-body')
    const bodyHeight = position.height - 125
    sheetBody.css('height', bodyHeight)
    return position
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners (html) {
    super.activateListeners(html)

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    html.find('.add-level').click((ev) => {
      this.addLevel(ev)
    })

    html.find('.delete-level').click((ev) => {
      const itemIndex = ev.currentTarget.parentElement.parentElement.getAttribute(
        'data-item-id'
      )
      this.showDeleteDialog(
        game.i18n.localize('DL.PathsLevelDeleteDialogDeleteLevel'),
        game.i18n.localize('DL.PathsLevelDeleteDialogDeleteLevelText'),
        itemIndex
      )
    })

    // Add drag events.
    html
      .find('.drop-area')
      .on('dragover', this._onDragOver.bind(this))
      .on('dragleave', this._onDragLeave.bind(this))
      .on('drop', this._onDrop.bind(this))

    html.find('.delete-item').click((ev) => {
      const itemLevel = ev.currentTarget.parentElement.parentElement.parentElement.getAttribute(
        'data-level'
      )
      const itemGroup = ev.currentTarget.parentElement.parentElement.parentElement.getAttribute(
        'data-group'
      )
      const itemIndex = ev.currentTarget.parentElement.getAttribute(
        'data-item-id'
      )

      this.deleteItem(itemLevel, itemGroup, itemIndex)
    })
  }

  async _onDragOver (ev) {
    const $self = $(ev.originalEvent.target)
    const $dropTarget = $self
    $dropTarget.addClass('drop-hover')
    return false
  }

  async _onDragLeave (ev) {
    const $self = $(ev.originalEvent.target)
    const $dropTarget = $self
    $dropTarget.removeClass('drop-hover')
    return false
  }

  async _onDrop (ev) {
    const $self = $(ev.originalEvent.target)
    const $dropTarget = $self

    // Get data.
    let data
    try {
      data = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'))
      if (data.type !== 'Item') return
    } catch (err) {
      return false
    }

    const level = $dropTarget.data('level')
    const group = $dropTarget.data('group')
    this._addItem(data.id, level, group)

    $dropTarget.removeClass('drop-hover')
    return false
  }

  async _addItem (itemId, level, group) {
    const itemData = duplicate(this.item.data)
    const item = game.items.get(itemId)
    const levelItem = new PathLevelItem()

    switch (group) {
      case 'talent':
        levelItem.id = item._id
        levelItem.name = item.name
        levelItem.description = item.description

        const talents = itemData.data.levels[level]?.talents
        talents.push(levelItem)
        break
      case 'talentpick':
        levelItem.id = item._id
        levelItem.name = item.name
        levelItem.description = item.description

        const talentspick = itemData.data.levels[level]?.talentspick
        talentspick.push(levelItem)
        break
      case 'spell':
        levelItem.id = item._id
        levelItem.name = item.name
        levelItem.description = item.description

        const spells = itemData.data.levels[level]?.spells
        spells.push(levelItem)
        break
      default:
        break
    }

    await this.item.update(itemData, { diff: false })
    this.render(true)
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

    if (item.type == 'path') {
      for (const [k, v] of Object.entries(formData)) {
        if (k == 'level.level') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].level = parseInt(id)
              index++
            }
          } else {
            item.data.data.levels[index].level = parseInt(v)
          }
        } else if (k == 'level.attributeSelect') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].attributeSelect = id

              if (id == 'choosetwo') {
                item.data.data.levels[index].attributeSelectIsChooseTwo = true
                item.data.data.levels[
                  index
                ].attributeSelectIsChooseThree = false
                item.data.data.levels[index].attributeSelectIsFixed = false
                item.data.data.levels[index].attributeSelectIsTwoSet = false
              } else if (id == 'choosethree') {
                item.data.data.levels[index].attributeSelectIsChooseTwo = false
                item.data.data.levels[index].attributeSelectIsChooseThree = true
                item.data.data.levels[index].attributeSelectIsFixed = false
                item.data.data.levels[index].attributeSelectIsTwoSet = false
              } else if (id == 'fixed') {
                item.data.data.levels[index].attributeSelectIsChooseTwo = false
                item.data.data.levels[
                  index
                ].attributeSelectIsChooseThree = false
                item.data.data.levels[index].attributeSelectIsFixed = true
                item.data.data.levels[index].attributeSelectIsTwoSet = false
              } else if (id == 'twosets') {
                item.data.data.levels[index].attributeSelectIsChooseTwo = false
                item.data.data.levels[
                  index
                ].attributeSelectIsChooseThree = false
                item.data.data.levels[index].attributeSelectIsFixed = false
                item.data.data.levels[index].attributeSelectIsTwoSet = true
              } else {
                item.data.data.levels[index].attributeSelectIsChooseTwo = false
                item.data.data.levels[
                  index
                ].attributeSelectIsChooseThree = false
                item.data.data.levels[index].attributeSelectIsFixed = false
                item.data.data.levels[index].attributeSelectIsTwoSet = false

                item.data.data.levels[index].attributeStrength = 0
                item.data.data.levels[index].attributeAgility = 0
                item.data.data.levels[index].attributeIntellect = 0
                item.data.data.levels[index].attributeWill = 0
              }
              index++
            }
          } else {
            item.data.data.levels[index].attributeSelect = v

            if (v == 'choosetwo') {
              item.data.data.levels[index].attributeSelectIsChooseTwo = true
              item.data.data.levels[index].attributeSelectIsChooseThree = false
              item.data.data.levels[index].attributeSelectIsFixed = false
              item.data.data.levels[index].attributeSelectIsTwoSet = false
            } else if (v == 'choosethree') {
              item.data.data.levels[index].attributeSelectIsChooseTwo = false
              item.data.data.levels[index].attributeSelectIsChooseThree = true
              item.data.data.levels[index].attributeSelectIsFixed = false
              item.data.data.levels[index].attributeSelectIsTwoSet = false
            } else if (v == 'fixed') {
              item.data.data.levels[index].attributeSelectIsChooseTwo = false
              item.data.data.levels[index].attributeSelectIsChooseThree = false
              item.data.data.levels[index].attributeSelectIsFixed = true
              item.data.data.levels[index].attributeSelectIsTwoSet = false
            } else if (v == 'twosets') {
              item.data.data.levels[index].attributeSelectIsChooseTwo = false
              item.data.data.levels[index].attributeSelectIsChooseThree = false
              item.data.data.levels[index].attributeSelectIsFixed = false
              item.data.data.levels[index].attributeSelectIsTwoSet = true
            } else {
              item.data.data.levels[index].attributeSelectIsChooseTwo = false
              item.data.data.levels[index].attributeSelectIsChooseThree = false
              item.data.data.levels[index].attributeSelectIsFixed = false
              item.data.data.levels[index].attributeSelectIsTwoSet = false

              item.data.data.levels[index].attributeStrength = 0
              item.data.data.levels[index].attributeAgility = 0
              item.data.data.levels[index].attributeIntellect = 0
              item.data.data.levels[index].attributeWill = 0
            }
          }
        } else if (k == 'level.attributeSelectTwoSet1') {
          const index = 0
          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].attributeSelectTwoSet1 = id

              index++
            }
          } else {
            item.data.data.levels[index].attributeSelectTwoSet1 = v
          }
        } else if (k == 'level.attributeSelectTwoSet2') {
          const index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].attributeSelectTwoSet2 = id

              index++
            }
          } else {
            item.data.data.levels[index].attributeSelectTwoSet2 = v
          }
        } else if (k == 'level.attributeSelectTwoSet3') {
          const index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].attributeSelectTwoSet3 = id

              index++
            }
          } else {
            item.data.data.levels[index].attributeSelectTwoSet3 = v
          }
        } else if (k == 'level.attributeSelectTwoSet4') {
          const index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].attributeSelectTwoSet4 = id

              index++
            }
          } else {
            item.data.data.levels[index].attributeSelectTwoSet4 = v
          }
        } else if (k == 'level.attributeSelectTwoSetValue1') {
          const index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[
                index
              ].attributeSelectTwoSetValue1 = parseInt(id)
              index++
            }
          } else {
            item.data.data.levels[index].attributeSelectTwoSetValue1 = parseInt(
              v
            )
          }
        } else if (k == 'level.attributeSelectTwoSetValue2') {
          const index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[
                index
              ].attributeSelectTwoSetValue2 = parseInt(id)
              index++
            }
          } else {
            item.data.data.levels[index].attributeSelectTwoSetValue2 = parseInt(
              v
            )
          }
        } else if (k == 'level.attributeStrength') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].attributeStrength = parseInt(id)
              index++
            }
          } else {
            item.data.data.levels[index].attributeStrength = parseInt(v)
          }
        } else if (k == 'level.attributeAgility') {
          let index = 0

          console.log(v)
          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].attributeAgility = parseInt(id)
              index++
            }
          } else {
            item.data.data.levels[index].attributeAgility = parseInt(v)
          }
        } else if (k == 'level.attributeIntellect') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].attributeIntellect = parseInt(id)
              index++
            }
          } else {
            item.data.data.levels[index].attributeIntellect = parseInt(v)
          }
        } else if (k == 'level.attributeWill') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].attributeWill = parseInt(id)
              index++
            }
          } else {
            item.data.data.levels[index].attributeWill = parseInt(v)
          }
        } else if (k == 'level.characteristicsPerception') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].characteristicsPerception = parseInt(
                id
              )
              index++
            }
          } else {
            item.data.data.levels[index].characteristicsPerception = parseInt(v)
          }
        } else if (k == 'level.characteristicsHealth') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].characteristicsHealth = parseInt(id)
              index++
            }
          } else {
            item.data.data.levels[index].characteristicsHealth = parseInt(v)
          }
        } else if (k == 'level.characteristicsPower') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].characteristicsPower = parseInt(id)
              index++
            }
          } else {
            item.data.data.levels[index].characteristicsPower = parseInt(v)
          }
        } else if (k == 'level.characteristicsSpeed') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].characteristicsSpeed = parseInt(id)
              index++
            }
          } else {
            item.data.data.levels[index].characteristicsSpeed = parseInt(v)
          }
        } else if (k == 'level.characteristicsDefense') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].characteristicsDefense = parseInt(id)
              index++
            }
          } else {
            item.data.data.levels[index].characteristicsDefense = parseInt(v)
          }
        } else if (k == 'level.characteristicsCorruption') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].characteristicsCorruption = parseInt(
                id
              )
              index++
            }
          } else {
            item.data.data.levels[index].characteristicsCorruption = parseInt(v)
          }
        } else if (k == 'level.languagesText') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].languagesText = id
              index++
            }
          } else {
            item.data.data.levels[index].languagesText = v
          }
        } else if (k == 'level.equipmentText') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].equipmentText = id
              index++
            }
          } else {
            item.data.data.levels[index].equipmentText = v
          }
        } else if (k == 'level.magicText') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].magicText = id
              index++
            }
          } else {
            item.data.data.levels[index].magicText = v
          }
        }
      }
      await this.object.update({
        'data.levels': duplicate(this.item.data.data.levels)
      })
    }

    return this.entity.update(updateData)
  }

  async addLevel (event) {
    event.preventDefault()

    const itemData = duplicate(this.item.data)
    itemData.data.levels.push(new PathLevel())

    await this.item.update(itemData, { diff: false })
    this.render(true)
  }

  async deleteLevel (index) {
    const itemData = duplicate(this.item.data)
    itemData.data.levels.splice(index, 1)

    await this.item.update(itemData, { diff: false })
    this.render(true)
  }

  async deleteItem (itemLevel, itemGroup, itemIndex) {
    const itemData = duplicate(this.item.data)

    switch (itemGroup) {
      case 'talent':
        const talents = itemData.data.levels[itemLevel].talents
        talents.splice(itemIndex, 1)
        break
      case 'talentpick':
        const talentspick = itemData.data.levels[itemLevel].talentspick
        talentspick.splice(itemIndex, 1)
        break
      case 'spell':
        const spells = itemData.data.levels[itemLevel].spells
        spells.splice(itemIndex, 1)
        break
      default:
        break
    }

    await this.item.update(itemData, { diff: false })
    this.render(true)
  }

  showDeleteDialog (title, content, itemIndex) {
    const d = new Dialog({
      title: title,
      content: content,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogYes'),
          callback: (html) => this.deleteLevel(itemIndex)
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('DL.DialogNo'),
          callback: () => {}
        }
      },
      default: 'no',
      close: () => {}
    })
    d.render(true)
  }
}
