/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
import { PathLevel, PathLevelItem } from '../pathlevel.js'
export class DemonlordPathPlayerView extends ItemSheet {
  /** @override */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['demonlord2', 'sheet', 'item'],
      template: 'systems/demonlord/templates/item/path-playersheet.html',
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
      data.pathtype = game.i18n.localize(CONFIG.DL.pathtype[data.data.type])
    }

    return data
  }

  _prepareLevels (data) {
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
            let maxChoices = item.data.data.levels[v].attributeSelectIsChooseTwo
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
                  item.data.data.levels[index].attributeStrengthSelected = false
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
              if (maxAttChoicesPrLevel[index] > attChoicesMadePrLevel[index]) {
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
                  item.data.data.levels[index].attributeAgilitySelected = false
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
              if (maxAttChoicesPrLevel[index] > attChoicesMadePrLevel[index]) {
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
              if (maxAttChoicesPrLevel[index] > attChoicesMadePrLevel[index]) {
                item.data.data.levels[index].attributeIntellectSelected = v
                attChoicesMadePrLevel[index]++
              } else {
                item.data.data.levels[index].attributeIntellectSelected = false
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
              if (maxAttChoicesPrLevel[index] > attChoicesMadePrLevel[index]) {
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
              item.data.data.levels[index].attributeSelectTwoSetSelectedValue1 =
                id == 'true'

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
              item.data.data.levels[index].attributeSelectTwoSetSelectedValue1,
              index,
              item.data.data.levels[index].attributeSelectTwoSet1,
              item.data.data.levels[index].attributeSelectTwoSetValue1
            )
            this.setTwoSetAttributeValue(
              !item.data.data.levels[index].attributeSelectTwoSetSelectedValue1,
              index,
              item.data.data.levels[index].attributeSelectTwoSet2,
              item.data.data.levels[index].attributeSelectTwoSetValue1
            )
          }
        } else if (k == 'level.attributeSelectTwoSetSelectedValue2') {
          let index = 0

          if (Array.isArray(v)) {
            for (const id of v) {
              item.data.data.levels[index].attributeSelectTwoSetSelectedValue2 =
                id == 'true'

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
              item.data.data.levels[index].attributeSelectTwoSetSelectedValue2,
              index,
              item.data.data.levels[index].attributeSelectTwoSet3,
              item.data.data.levels[index].attributeSelectTwoSetValue2
            )
            this.setTwoSetAttributeValue(
              !item.data.data.levels[index].attributeSelectTwoSetSelectedValue2,
              index,
              item.data.data.levels[index].attributeSelectTwoSet4,
              item.data.data.levels[index].attributeSelectTwoSetValue2
            )
          }
        }
      }

      await this.object.update({
        'data.levels': duplicate(this.item.data.data.levels)
      })
    }

    return this.object.update(formData)
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
