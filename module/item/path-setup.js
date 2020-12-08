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
    data.isGM = game.user.isGM

    if (this.item.data.type == 'path' && data.item.data.editPath) {
      this._prepareLevels(data)
    } else if (this.item.data.type == 'path' && !data.item.data.editPath) {
      this._prepareLevelsView(data)
    }

    if (!game.user.isGM) {
      data.item.data.editPath = false
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

  _prepareLevelsView (data) {
    const itemData = data.item
    let levels = []

    for (const level of itemData.data.levels) {
      level.attributeSelectTwoSet1Label = game.i18n.localize(
        CONFIG.DL.attributes[level.attributeSelectTwoSet1]
      )
      level.attributeSelectTwoSet2Label = game.i18n.localize(
        CONFIG.DL.attributes[level.attributeSelectTwoSet2]
      )
      level.attributeSelectTwoSet3Label = game.i18n.localize(
        CONFIG.DL.attributes[level.attributeSelectTwoSet3]
      )
      level.attributeSelectTwoSet4Label = game.i18n.localize(
        CONFIG.DL.attributes[level.attributeSelectTwoSet4]
      )

      levels.push(level)
    }

    levels = levels.sort((a, b) => (a.level > b.level ? 1 : -1))

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

    html.find('.transfer-talent').click((ev) => {
      this.showTransferDialog(
        game.i18n.localize('DL.PathsDialogTransferTalent'),
        game.i18n.localize('DL.PathsDialogTransferTalentText'),
        ev,
        'TALENT'
      )
    })

    html.find('.transfer-talents').click((ev) => {
      this.showTransferDialog(
        game.i18n.localize('DL.PathsDialogTransferTalents'),
        game.i18n.localize('DL.PathsDialogTransferTalentsText'),
        ev,
        'TALENTS'
      )
    })

    html.find('.transfer-talentpick').click((ev) => {
      this.showTransferDialog(
        game.i18n.localize('DL.PathsDialogTransferTalent'),
        game.i18n.localize('DL.PathsDialogTransferTalentText'),
        ev,
        'TALENTPICKS'
      )
    })

    html.find('.transfer-spell').click((ev) => {
      this.showTransferDialog(
        game.i18n.localize('DL.PathsDialogTransferSpell'),
        game.i18n.localize('DL.PathsDialogTransferSpellText'),
        ev,
        'SPELL'
      )
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
      const maxAttChoicesPrLevel = {}
      const attChoicesMadePrLevel = {}

      for (const [k, v] of Object.entries(formData)) {
        if (item.data.data.editPath) {
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
                  item.data.data.levels[
                    index
                  ].attributeSelectIsChooseTwo = false
                  item.data.data.levels[
                    index
                  ].attributeSelectIsChooseThree = true
                  item.data.data.levels[index].attributeSelectIsFixed = false
                  item.data.data.levels[index].attributeSelectIsTwoSet = false
                } else if (id == 'fixed') {
                  item.data.data.levels[
                    index
                  ].attributeSelectIsChooseTwo = false
                  item.data.data.levels[
                    index
                  ].attributeSelectIsChooseThree = false
                  item.data.data.levels[index].attributeSelectIsFixed = true
                  item.data.data.levels[index].attributeSelectIsTwoSet = false
                } else if (id == 'twosets') {
                  item.data.data.levels[
                    index
                  ].attributeSelectIsChooseTwo = false
                  item.data.data.levels[
                    index
                  ].attributeSelectIsChooseThree = false
                  item.data.data.levels[index].attributeSelectIsFixed = false
                  item.data.data.levels[index].attributeSelectIsTwoSet = true
                } else {
                  item.data.data.levels[
                    index
                  ].attributeSelectIsChooseTwo = false
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
                item.data.data.levels[
                  index
                ].attributeSelectIsChooseThree = false
                item.data.data.levels[index].attributeSelectIsFixed = false
                item.data.data.levels[index].attributeSelectIsTwoSet = false
              } else if (v == 'choosethree') {
                item.data.data.levels[index].attributeSelectIsChooseTwo = false
                item.data.data.levels[index].attributeSelectIsChooseThree = true
                item.data.data.levels[index].attributeSelectIsFixed = false
                item.data.data.levels[index].attributeSelectIsTwoSet = false
              } else if (v == 'fixed') {
                item.data.data.levels[index].attributeSelectIsChooseTwo = false
                item.data.data.levels[
                  index
                ].attributeSelectIsChooseThree = false
                item.data.data.levels[index].attributeSelectIsFixed = true
                item.data.data.levels[index].attributeSelectIsTwoSet = false
              } else if (v == 'twosets') {
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
              item.data.data.levels[
                index
              ].attributeSelectTwoSetValue1 = parseInt(v)
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
              item.data.data.levels[
                index
              ].attributeSelectTwoSetValue2 = parseInt(v)
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
                item.data.data.levels[
                  index
                ].characteristicsPerception = parseInt(id)
                index++
              }
            } else {
              item.data.data.levels[index].characteristicsPerception = parseInt(
                v
              )
            }
          } else if (k == 'level.characteristicsHealth') {
            let index = 0

            if (Array.isArray(v)) {
              for (const id of v) {
                item.data.data.levels[index].characteristicsHealth = parseInt(
                  id
                )
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
                item.data.data.levels[index].characteristicsDefense = parseInt(
                  id
                )
                index++
              }
            } else {
              item.data.data.levels[index].characteristicsDefense = parseInt(v)
            }
          } else if (k == 'level.characteristicsCorruption') {
            let index = 0

            if (Array.isArray(v)) {
              for (const id of v) {
                item.data.data.levels[
                  index
                ].characteristicsCorruption = parseInt(id)
                index++
              }
            } else {
              item.data.data.levels[index].characteristicsCorruption = parseInt(
                v
              )
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
        } else {
          if (k == 'level') {
            if (Array.isArray(v)) {
              for (const id of v) {
                let maxChoices = item.data.data.levels[id]
                  .attributeSelectIsChooseTwo
                  ? 2
                  : 0
                maxChoices = item.data.data.levels[id]
                  .attributeSelectIsChooseThree
                  ? 3
                  : maxChoices
                maxChoices = item.data.data.levels[id].attributeSelectIsFixed
                  ? 10
                  : maxChoices
                maxChoices = item.data.data.levels[id].attributeSelectIsTwoSet
                  ? 2
                  : maxChoices

                maxAttChoicesPrLevel[id] = maxChoices
                attChoicesMadePrLevel[id] = 0
              }
            } else {
              let maxChoices = item.data.data.levels[v]
                .attributeSelectIsChooseTwo
                ? 2
                : 0
              maxChoices = item.data.data.levels[v].attributeSelectIsChooseThree
                ? 3
                : maxChoices
              maxChoices = item.data.data.levels[v].attributeSelectIsFixed
                ? 10
                : maxChoices
              maxChoices = item.data.data.levels[v].attributeSelectIsTwoSet
                ? 2
                : maxChoices

              maxAttChoicesPrLevel[v] = maxChoices
              attChoicesMadePrLevel[v] = 0
            }
          } else if (k == 'level.attributeStrengthSelected') {
            let index = 0

            if (Array.isArray(v)) {
              for (const id of v) {
                if (id == false) {
                  item.data.data.levels[index].attributeStrengthSelected = id

                  if (
                    item.data.data.levels[index].attributeStrengthSelected &&
                    attChoicesMadePrLevel[index] > 0
                  ) {
                    attChoicesMadePrLevel[index]--
                  }
                } else {
                  if (
                    maxAttChoicesPrLevel[index] > attChoicesMadePrLevel[index]
                  ) {
                    item.data.data.levels[index].attributeStrengthSelected = id
                    attChoicesMadePrLevel[index]++
                  } else {
                    item.data.data.levels[
                      index
                    ].attributeStrengthSelected = false
                    return ui.notifications.warn(
                      'More attributes selected than allowed'
                    )
                  }
                }

                index++
              }
            } else {
              if (v == false) {
                item.data.data.levels[index].attributeStrengthSelected = v

                if (
                  item.data.data.levels[index].attributeStrengthSelected &&
                  attChoicesMadePrLevel[index] > 0
                ) {
                  attChoicesMadePrLevel[index]--
                }
              } else {
                if (
                  maxAttChoicesPrLevel[index] > attChoicesMadePrLevel[index]
                ) {
                  item.data.data.levels[index].attributeStrengthSelected = v
                  attChoicesMadePrLevel[index]++
                } else {
                  item.data.data.levels[index].attributeStrengthSelected = false
                  return ui.notifications.warn(
                    'More attributes selected than allowed'
                  )
                }
              }
            }
          } else if (k == 'level.attributeAgilitySelected') {
            let index = 0

            if (Array.isArray(v)) {
              for (const id of v) {
                if (id == false) {
                  item.data.data.levels[index].attributeAgilitySelected = id

                  if (
                    item.data.data.levels[index].attributeAgilitySelected &&
                    attChoicesMadePrLevel[index] > 0
                  ) {
                    attChoicesMadePrLevel[index]--
                  }
                } else {
                  if (
                    maxAttChoicesPrLevel[index] > attChoicesMadePrLevel[index]
                  ) {
                    item.data.data.levels[index].attributeAgilitySelected = id
                    attChoicesMadePrLevel[index]++
                  } else {
                    item.data.data.levels[
                      index
                    ].attributeAgilitySelected = false
                    return ui.notifications.warn(
                      'More attributes selected than allowed'
                    )
                  }
                }

                index++
              }
            } else {
              if (v == false) {
                item.data.data.levels[index].attributeAgilitySelected = v

                if (
                  item.data.data.levels[index].attributeAgilitySelected &&
                  attChoicesMadePrLevel[index] > 0
                ) {
                  attChoicesMadePrLevel[index]--
                }
              } else {
                if (
                  maxAttChoicesPrLevel[index] > attChoicesMadePrLevel[index]
                ) {
                  item.data.data.levels[index].attributeAgilitySelected = v
                  attChoicesMadePrLevel[index]++
                } else {
                  item.data.data.levels[index].attributeAgilitySelected = false
                  return ui.notifications.warn(
                    'More attributes selected than allowed'
                  )
                }
              }
            }
          } else if (k == 'level.attributeIntellectSelected') {
            let index = 0

            if (Array.isArray(v)) {
              for (const id of v) {
                if (id == false) {
                  item.data.data.levels[index].attributeIntellectSelected = id

                  if (
                    item.data.data.levels[index].attributeIntellectSelected &&
                    attChoicesMadePrLevel[index] > 0
                  ) {
                    attChoicesMadePrLevel[index]--
                  }
                } else {
                  if (
                    maxAttChoicesPrLevel[index] > attChoicesMadePrLevel[index]
                  ) {
                    item.data.data.levels[index].attributeIntellectSelected = id
                    attChoicesMadePrLevel[index]++
                  } else {
                    item.data.data.levels[
                      index
                    ].attributeIntellectSelected = false
                    return ui.notifications.warn(
                      'More attributes selected than allowed'
                    )
                  }
                }

                index++
              }
            } else {
              if (v == false) {
                item.data.data.levels[index].attributeIntellectSelected = v

                if (
                  item.data.data.levels[index].attributeIntellectSelected &&
                  attChoicesMadePrLevel[index] > 0
                ) {
                  attChoicesMadePrLevel[index]--
                }
              } else {
                if (
                  maxAttChoicesPrLevel[index] > attChoicesMadePrLevel[index]
                ) {
                  item.data.data.levels[index].attributeIntellectSelected = v
                  attChoicesMadePrLevel[index]++
                } else {
                  item.data.data.levels[
                    index
                  ].attributeIntellectSelected = false
                  return ui.notifications.warn(
                    'More attributes selected than allowed'
                  )
                }
              }
            }
          } else if (k == 'level.attributeWillSelected') {
            let index = 0

            if (Array.isArray(v)) {
              for (const id of v) {
                if (id == false) {
                  item.data.data.levels[index].attributeWillSelected = id

                  if (
                    item.data.data.levels[index].attributeWillSelected &&
                    attChoicesMadePrLevel[index] > 0
                  ) {
                    attChoicesMadePrLevel[index]--
                  }
                } else {
                  if (
                    maxAttChoicesPrLevel[index] > attChoicesMadePrLevel[index]
                  ) {
                    item.data.data.levels[index].attributeWillSelected = id
                    attChoicesMadePrLevel[index]++
                  } else {
                    item.data.data.levels[index].attributeWillSelected = false
                    return ui.notifications.warn(
                      'More attributes selected than allowed'
                    )
                  }
                }

                index++
              }
            } else {
              if (v == false) {
                item.data.data.levels[index].attributeWillSelected = v

                if (
                  item.data.data.levels[index].attributeWillSelected &&
                  attChoicesMadePrLevel[index] > 0
                ) {
                  attChoicesMadePrLevel[index]--
                }
              } else {
                if (
                  maxAttChoicesPrLevel[index] > attChoicesMadePrLevel[index]
                ) {
                  item.data.data.levels[index].attributeWillSelected = v
                  attChoicesMadePrLevel[index]++
                } else {
                  item.data.data.levels[index].attributeWillSelected = false
                  return ui.notifications.warn(
                    'More attributes selected than allowed'
                  )
                }
              }
            }
          } else if (k == 'level.attributeSelectTwoSetSelectedValue1') {
            let index = 0

            if (Array.isArray(v)) {
              for (const id of v) {
                item.data.data.levels[
                  index
                ].attributeSelectTwoSetSelectedValue1 = id == 'true'

                this.setTwoSetAttributeValue(
                  item.data.data.levels[index]
                    .attributeSelectTwoSetSelectedValue1,
                  index,
                  item.data.data.levels[index].attributeSelectTwoSet1,
                  item.data.data.levels[index].attributeSelectTwoSetValue1
                )
                this.setTwoSetAttributeValue(
                  !item.data.data.levels[index]
                    .attributeSelectTwoSetSelectedValue1,
                  index,
                  item.data.data.levels[index].attributeSelectTwoSet2,
                  item.data.data.levels[index].attributeSelectTwoSetValue1
                )

                index++
              }
            } else {
              item.data.data.levels[index].attributeSelectTwoSetSelectedValue1 =
                v == 'true'

              this.setTwoSetAttributeValue(
                item.data.data.levels[index]
                  .attributeSelectTwoSetSelectedValue1,
                index,
                item.data.data.levels[index].attributeSelectTwoSet1,
                item.data.data.levels[index].attributeSelectTwoSetValue1
              )
              this.setTwoSetAttributeValue(
                !item.data.data.levels[index]
                  .attributeSelectTwoSetSelectedValue1,
                index,
                item.data.data.levels[index].attributeSelectTwoSet2,
                item.data.data.levels[index].attributeSelectTwoSetValue1
              )
            }
          } else if (k == 'level.attributeSelectTwoSetSelectedValue2') {
            let index = 0

            if (Array.isArray(v)) {
              for (const id of v) {
                item.data.data.levels[
                  index
                ].attributeSelectTwoSetSelectedValue2 = id == 'true'

                this.setTwoSetAttributeValue(
                  item.data.data.levels[index]
                    .attributeSelectTwoSetSelectedValue2,
                  index,
                  item.data.data.levels[index].attributeSelectTwoSet3,
                  item.data.data.levels[index].attributeSelectTwoSetValue2
                )
                this.setTwoSetAttributeValue(
                  !item.data.data.levels[index]
                    .attributeSelectTwoSetSelectedValue2,
                  index,
                  item.data.data.levels[index].attributeSelectTwoSet4,
                  item.data.data.levels[index].attributeSelectTwoSetValue2
                )

                index++
              }
            } else {
              item.data.data.levels[index].attributeSelectTwoSetSelectedValue2 =
                v == 'true'

              this.setTwoSetAttributeValue(
                item.data.data.levels[index]
                  .attributeSelectTwoSetSelectedValue2,
                index,
                item.data.data.levels[index].attributeSelectTwoSet3,
                item.data.data.levels[index].attributeSelectTwoSetValue2
              )
              this.setTwoSetAttributeValue(
                !item.data.data.levels[index]
                  .attributeSelectTwoSetSelectedValue2,
                index,
                item.data.data.levels[index].attributeSelectTwoSet4,
                item.data.data.levels[index].attributeSelectTwoSetValue2
              )
            }
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

  async transferItem (event, type) {
    event.preventDefault()

    if (event.currentTarget.className.indexOf('transfer-talents')) {
      const levelIndex = event.currentTarget.getAttribute('data-level')

      for (const talent of this.object.data.data.levels[levelIndex].talents) {
        const item = game.items.get(talent.id)
        if (item != null) await this.actor.createOwnedItem(item)
      }
    } else {
      const levelIndex = event.currentTarget
        .closest('.level')
        .getAttribute('data-item-id')
      const itemIndex = event.currentTarget.getAttribute('data-item-id')

      if (type === 'TALENT') {
        const selectedLevelItem = this.object.data.data.levels[levelIndex]
          .talents[itemIndex]
        const item = game.items.get(selectedLevelItem.id)

        await this.actor.createOwnedItem(item)
      } else if (type === 'TALENTPICKS') {
        const selectedLevelItem = this.object.data.data.levels[levelIndex]
          .talentspick[itemIndex]
        const item = game.items.get(selectedLevelItem.id)

        await this.actor.createOwnedItem(item)
      } else {
        const selectedLevelItem = this.object.data.data.levels[levelIndex]
          .spells[itemIndex]
        const item = game.items.get(selectedLevelItem.id)

        await this.actor.createOwnedItem(item)
      }
    }
  }

  showTransferDialog (title, content, event, type) {
    const d = new Dialog({
      title: title,
      content: content,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogYes'),
          callback: (html) => this.transferItem(event, type)
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

  setTwoSetAttributeValue (isSelected, index, attribute, attributeValue) {
    const item = this.object

    switch (attribute) {
      case 'Strength':
        isSelected
          ? (item.data.data.levels[index].attributeStrength = attributeValue)
          : (item.data.data.levels[index].attributeStrength = 0)

        item.data.data.levels[index].attributeStrengthSelected = isSelected
        break
      case 'Agility':
        isSelected
          ? (item.data.data.levels[index].attributeAgility = attributeValue)
          : (item.data.data.levels[index].attributeAgility = 0)

        item.data.data.levels[index].attributeAgilitySelected = isSelected
        break
      case 'Intellect':
        isSelected
          ? (item.data.data.levels[index].attributeIntellect = attributeValue)
          : (item.data.data.levels[index].attributeIntellect = 0)

        item.data.data.levels[index].attributeIntellectSelected = isSelected
        break
      case 'Will':
        isSelected
          ? (item.data.data.levels[index].attributeWill = attributeValue)
          : (item.data.data.levels[index].attributeWill = 0)

        item.data.data.levels[index].attributeWillSelected = isSelected
        break
      default:
        break
    }
  }
}
