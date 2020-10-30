/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
import { PathLevelItem } from '../pathlevel.js'

export class DemonlordItemSheetDefault extends ItemSheet {
  /** @override */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['demonlord2', 'sheet', 'item'],
      width: 520,
      height: 520,
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

  /** @override */
  get template () {
    const path = 'systems/demonlord/templates/item'
    return `${path}/item-${this.item.data.type}-sheet.html`
  }

  /* -------------------------------------------- */

  /** @override */
  getData () {
    const data = super.getData()
    data.isGM = game.user.isGM

    if (this.item.data.type == 'path') {
      this._prepareLevels(data)
    }

    return data
  }

  _prepareLevels (data) {
    const itemData = data.item
    const levels = []
    const talents = []
    const talents4 = []

    for (const level of itemData.data.levels) {
      levels.push(level)
    }

    for (const talent of itemData.data.talents) {
      talents.push(talent)
    }

    for (const talent of itemData.data.level4.talent) {
      talents4.push(talent)
    }

    itemData.levels = levels
    itemData.talents = talents
    itemData.talents4 = talents4
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

    html.find('.radiotrue').click((ev) => {
      this.updateOption(true)
    })

    html.find('.radiofalse').click((ev) => {
      this.updateOption(false)
    })

    // Add drag events.
    html
      .find('.drop-area')
      .on('dragover', this._onDragOver.bind(this))
      .on('dragleave', this._onDragLeave.bind(this))
      .on('drop', this._onDrop.bind(this))

    html.find('.delete-ancestryitem').click((ev) => {
      const itemGroup = ev.currentTarget.parentElement.parentElement.parentElement.getAttribute(
        'data-group'
      )
      const itemIndex = ev.currentTarget.parentElement.getAttribute(
        'data-item-id'
      )

      this.deleteItem(itemIndex, itemGroup)
    })

    html.find('.transfer-talent').click((ev) => {
      this.showTransferDialog(
        game.i18n.localize('DL.PathsDialogTransferTalent'),
        game.i18n.localize('DL.PathsDialogTransferTalentText'),
        ev
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
    if (game.user.isGM) {
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

      const group = $dropTarget.data('group')
      this._addItem(data.id, group)

      $dropTarget.removeClass('drop-hover')
    }
    return false
  }

  async _addItem (itemId, group) {
    const itemData = duplicate(this.item.data)
    const item = game.items.get(itemId)
    const levelItem = new PathLevelItem()

    switch (item.type) {
      case 'talent':
        levelItem.id = item._id
        levelItem.name = item.name
        levelItem.description = item.description

        if (group === 'talent') itemData.data.talents.push(levelItem)
        else itemData.data.level4.talent.push(levelItem)

        break
      default:
        break
    }

    await this.item.update(itemData, { diff: false })
    this.render(true)
  }

  async deleteItem (itemIndex, itemGroup) {
    const itemData = duplicate(this.item.data)

    switch (itemGroup) {
      case 'talent':
        itemData.data.talents.splice(itemIndex, 1)
        break
      case 'talent4':
        itemData.data.level4.talent.splice(itemIndex, 1)
        break
      default:
        break
    }

    await this.item.update(itemData, { diff: false })
    this.render(true)
  }

  showTransferDialog (title, content, event) {
    const d = new Dialog({
      title: title,
      content: content,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogYes'),
          callback: (html) => this.transferItem(event)
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

  async transferItem (event) {
    event.preventDefault()

    const itemIndex = event.currentTarget.getAttribute('data-item-id')
    const itemGroup = event.currentTarget.parentElement.parentElement.getAttribute(
      'data-group'
    )

    if (itemGroup === 'talent') {
      const selectedLevelItem = this.object.data.data.talents[itemIndex]
      const item = game.items.get(selectedLevelItem.id)

      await this.actor.createOwnedItem(item)
    } else if (itemGroup === 'talent4') {
      const selectedLevelItem = this.object.data.data.level4.talent[itemIndex]
      const item = game.items.get(selectedLevelItem.id)

      await this.actor.createOwnedItem(item)
    }
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

        const characterbuffs = this.generateCharacterBuffs()
        await this.actor?.update({
          'data.characteristics.defensebonus': parseInt(
            characterbuffs.defensebonus
          ),
          'data.characteristics.healthbonus': parseInt(
            characterbuffs.healthbonus
          ),
          'data.characteristics.speedbonus': parseInt(characterbuffs.speedbonus)
        })
      } else {
        await this.entity.update({
          'data.addtonextroll': false
        })
      }
    }

    return this.entity.update(updateData)
  }

  generateCharacterBuffs () {
    const characterbuffs = new CharacterBuff()
    const talents = this.actor
      ?.getEmbeddedCollection('OwnedItem')
      .filter((e) => e.type === 'talent')

    if (talents) {
      for (const talent of talents) {
        if (talent.data.addtonextroll) {
          if (
            this.actor.data.data.activebonuses ||
            (talent.data.uses.value == '' && talent.data.uses.max == '')
          ) {
            if (
              talent.data.bonuses.defenseactive &&
              talent.data.bonuses.defense != ''
            ) {
              characterbuffs.defensebonus += parseInt(
                talent.data.bonuses.defense
              )
            }
            if (
              talent.data.bonuses.healthactive &&
              talent.data.bonuses.health != ''
            ) {
              characterbuffs.healthbonus += parseInt(talent.data.bonuses.health)
            }
            if (
              talent.data.bonuses.speedactive &&
              talent.data.bonuses.speed != ''
            ) {
              characterbuffs.speedbonus += parseInt(talent.data.bonuses.speed)
            }
          }
        }
      }
    }
    return characterbuffs
  }

  async updateOption (selected) {
    await this.object.update({
      'data.level4.option1': selected
    })
  }
}
