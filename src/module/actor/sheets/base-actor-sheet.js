import { onManageActiveEffect, prepareActiveEffectCategories } from '../../active-effects/effects'
import { buildOverview } from '../../chat/effect-messages'
import { capitalize } from '../../utils/utils'
import { DemonlordItem } from '../../item/item'
import { DLAfflictions } from '../../active-effects/afflictions'

export default class DLBaseActorSheet extends ActorSheet {
  /* -------------------------------------------- */
  /*  Data preparation                            */
  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Base data
    const data = {
      isGM: game.user.isGM,
      isOwner: this.actor.isOwner,
      isCreature: this.actor.type === 'creature',
      isCharacter: this.actor.type === 'character',
      isNPC: this.actor.type === 'character' && !this.actor.data.isPC,
      limited: this.document.limited,
      options: this.options,
      editable: this.isEditable,
      config: CONFIG.DL,
      actor: this.actor.data,
      data: this.actor.data.data,
      effects: true,
      generalEffects: prepareActiveEffectCategories(this.actor.effects, true),
      effectsOverview: buildOverview(this.actor),
      flags: this.actor.data.flags,
    }

    // Items
    data.items = this.actor.items
      .map(i => {
        i.data.labels = i.labels
        return i.data
      })
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))

    // Attributes checkbox
    for (const attr of Object.entries(data.data.attributes)) {
      attr.isCheckbox = attr.dtype === 'Boolean'
    }

    // Map items by type (used in other operations)
    const m = new Map()
    data.items.map(item => {
      const type = item.type
      m.has(type) ? m.get(type).push(item) : m.set(type, [item])
    })
    data._itemsByType = m
    return data
  }

  /* -------------------------------------------- */

  prepareItems(sheetData) {
    const m = sheetData._itemsByType
    const actorData = sheetData.actor
    actorData.weapons = m.get('weapon') || []
    actorData.spells = m.get('spell') || []
    actorData.talents = m.get('talent') || []
    actorData.features = m.get('feature') || []
    actorData.spellbook = this._prepareBook(actorData.spells, 'tradition', 'spells')
  }

  /* -------------------------------------------- */

  _prepareBook(items, dataGroupProperty, returnItemsName) {
    const m = new Map()
    items.forEach(i => {
      const group = i.data[dataGroupProperty] || ''
      if (m.has(group)) m.get(group).push(i)
      else m.set(group, [i])
    })
    return Array.from(m.keys()).map(k => ({
      [dataGroupProperty]: k,
      [returnItemsName]: m.get(k),
    }))
  }

  /* -------------------------------------------- */
  /*  Drop item event                             */
  /* -------------------------------------------- */

  /** @override */
  async _onDropItemCreate(itemData) {
    const isAllowed = await this.checkDroppedItem(itemData)
    if (isAllowed) return super._onDropItemCreate(itemData)
    console.warn('Wrong item type dragged', this.actor, itemData)
  }

  async checkDroppedItem(_itemData) {
    return true
  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */
  /* -------------------------------------------- */

  _onItemCreate(event) {
    event.preventDefault()
    event.stopPropagation()
    const header = event.currentTarget // Get the type of item to create.
    const type = header.dataset.type // Grab any data associated with this control.
    const itemData = {
      name: `New ${type.capitalize()}`,
      type: type,
      data: duplicate(header.dataset),
    }

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data.type
    return DemonlordItem.create(itemData, { parent: this.actor })
  }

  _onItemEdit(event, cls = '.item') {
    const li = $(event.currentTarget).parents(cls)
    const id = li.data('itemId') || li.data('item-id')
    const item = this.actor.items.get(id)
    item.sheet.render(true)
  }

  _onItemDelete(event, cls = '.item') {
    const li = $(event.currentTarget).parents(cls)
    this.showDeleteDialog(game.i18n.localize('DL.DialogAreYouSure'), game.i18n.localize('DL.DialogDeleteItemText'), li)
  }
  /* -------------------------------------------- */

  showDeleteDialog(title, content, htmlItem) {
    const deleteItem = () => {
      const id = htmlItem.data('itemId') || htmlItem.data('item-id')
      Item.deleteDocuments([id], { parent: this.actor })
      htmlItem.slideUp(200, () => this.render(false))
    }

    const d = new Dialog({
      title: title,
      content: content,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogYes'),
          callback: () => deleteItem(),
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
  /*  Listeners                                   */
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html)
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    if (this.isEditable) {
      const inputs = html.find('input')
      inputs.focus(ev => ev.currentTarget.select())
    }

    // Effects control
    html.find('.effect-control').click(ev => onManageActiveEffect(ev, this.document))

    // Disable Afflictions
    html.find('.disableafflictions').click(() => {
      DLAfflictions.clearAfflictions(this.actor)
    })

    // Afflictions checkboxes
    html.find('.affliction > input').click(ev => {
      ev.preventDefault()
      const input = ev.currentTarget
      const checked = input.checked
      const afflictionName = input.labels[0].innerText

      if (checked) {
        const affliction = CONFIG.statusEffects.find(e => e.label === afflictionName)
        if (!affliction) return false
        affliction['flags.core.statusId'] = affliction.id
        ActiveEffect.create(affliction, { parent: this.actor })
        return true
      } else {
        const affliction = this.actor.effects.find(e => e.data.label === afflictionName)
        if (!affliction) return false
        affliction.delete()
      }
    })

    // Toggle Accordion
    html.find('.toggleAccordion').click(ev => {
      const div = ev.currentTarget

      if (div.nextElementSibling.style.display === 'none') {
        div.nextElementSibling.style.display = 'block'
        div.className = 'toggleAccordion change'
      } else {
        div.nextElementSibling.style.display = 'none'
        div.className = 'toggleAccordion'
      }
      if (['action', 'afflictions', 'damage'].includes(div.dataset.type)) {
        const type = capitalize(div.dataset.type)
        const k = 'data.afflictionsTab.hideAction' + type
        const v = !this.actor.data.data.afflictionsTab[`hide${type}`]
        this.actor.update({ [k]: v })
      }
    })

    // Toggle info
    const _toggleInfo = (ev, n) => {
      const div = ev.currentTarget
      const _parent = div.parentElement
      if (_parent.children[n].style.display === 'none') _parent.children[n].style.display = 'block'
      else _parent.children[n].style.display = 'none'
    }
    html.find('.toggleInfo').click(ev => _toggleInfo(ev, 6))
    html.find('.toggleTalentInfo').click(ev => _toggleInfo(ev, 4))
    html.find('.toggleItemInfo').click(ev => _toggleInfo(ev, 3))

    // Clone Inventory Item
    html.find('.item-clone').click(ev => {
      const li = $(ev.currentTarget).parents('.item')
      const item = duplicate(this.actor.items.get(li.data('itemId')))
      Item.create(item, { parent: this.actor })
    })

    // Wear item
    const _itemwear = (ev, bool) => {
      const li = $(ev.currentTarget).parents('.item')
      const item = this.actor.items.get(li.data('itemId'))
      item.update({ 'data.wear': bool }, { parent: this.actor })
    }
    html.find('.item-wear').click(ev => _itemwear(ev, false))
    html.find('.item-wearoff').click(ev => _itemwear(ev, true))
    html.find('.wearitem').each((i, el) => {
      const itemId = el.getAttribute('data-item-id')
      const item = this.actor.items.get(itemId)
      if (
        item.data.data.wear &&
        item.data.data.strengthmin != '' &&
        +item.data.data.strengthmin > +this.actor.getAttribute("strength").value
      ) {
        const controls = el.getElementsByClassName('item-control')
        controls[0].className += ' itemred'
      }
    })

    // Inventory items CUD
    html.find('.item-create').click(ev => this._onItemCreate(ev))
    html.find('.item-edit').click(ev => this._onItemEdit(ev))
    html.find('.item-delete').click(ev => this._onItemDelete(ev))

    // Spell CUD
    html.find('.spell-create').click(ev => this._onItemCreate(ev))
    html.find('.spell-edit').click(ev => this._onItemEdit(ev))
    html.find('.spell-delete').click(ev => this._onItemDelete(ev))

    // Feature Item UD
    html.find('.feature-delete').click(ev => this._onItemDelete(ev, '.feature'))
    html
      .find('.feature-edit')
      .click(() =>
        this.actor.update({ 'data.features.edit': !this.actor.data.data.features.edit }).then(() => this.render()),
      )
    html.find('.editfeature').change(ev => {
      const id = $(ev.currentTarget).attr('data-item-id')
      const nameValue = ev.currentTarget.children[1].value
      let descValue = ev.currentTarget.children[2].value
      descValue = descValue.trim()

      const item = this.actor.getOwnedItem(id)
      item.update({ name: nameValue, 'data.description': descValue })
    })

    // Rollable Attributes
    html.find('.attribute .name').click(ev => {
      const div = $(ev.currentTarget)
      const attributeName = div.data('key')
      const attribute = this.actor.getAttribute(attributeName)
      this.actor.rollChallenge(attribute)
    })

    // Rollable Attack
    html.find('.attack-roll').click(ev => {
      const li = ev.currentTarget.closest('.item')
      this.actor.rollWeaponAttack(li.dataset.itemId, { event: ev })
    })

    // Rollable Talent
    html.find('.talent-roll').click(ev => {
      const li = ev.currentTarget.closest('.item')
      this.actor.rollTalent(li.dataset.itemId, { event: ev })
    })

    // Rollable Attack Spell
    html.find('.magic-roll').click(ev => {
      const li = ev.currentTarget.closest('.item')
      this.actor.rollSpell(li.dataset.itemId, { event: ev })
    })

    // Rollable (generic)
    html.find('.rollable').click(event => {
      event.preventDefault()
      const element = event.currentTarget
      const dataset = element.dataset
      if (dataset.roll) {
        const roll = new Roll(dataset.roll, this.actor.data.data)
        const label = dataset.label ? `Rolling ${dataset.label}` : ''
        roll.roll({async: false}).toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label,
        })
      } else {
        const li = element.closest('.item')
        const itemId = li.dataset.itemId
        if (itemId) {
          this.actor.useItem(itemId)
        }
      }
    })

    // Attribute Checks
    html.find('.ability-name').click(ev => {
      const abl = ev.currentTarget.parentElement.getAttribute('data-ability')
      this.actor.rollAbility(abl)
    })

    // Drag events for macros.
    if (this.actor.isOwner) {
      const handler = ev => this._onDragStart(ev)
      html.find('li.dropitem').each((i, li) => {
        if (li.classList.contains('inventory-header')) return
        li.setAttribute('draggable', true)
        li.addEventListener('dragstart', handler, false)
      })
    }
  }
}
