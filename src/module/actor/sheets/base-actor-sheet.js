import {onManageActiveEffect, prepareActiveEffectCategories} from '../../active-effects/effects'
import {buildOverview} from '../../chat/effect-messages'
import {capitalize} from '../../utils/utils'
import {DemonlordItem} from '../../item/item'
import {DLAfflictions} from '../../active-effects/afflictions'
import {initDlEditor} from "../../utils/editor";
import DLBaseItemSheet from "../../item/sheets/base-item-sheet";

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
    // Sort spells in the spellbooks by their rank
    actorData.spells.sort((a, b) => a.data.rank - b.data.rank)
    // Prepare the book (spells divided by tradition)
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
    })).sort(
      (a, b) => a[dataGroupProperty]?.localeCompare(b[dataGroupProperty]) ?? 0
    )
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
    return DemonlordItem.create(itemData, {parent: this.actor})
  }

  // eslint-disable-next-line no-unused-vars
  _onItemEdit(event, cls = '.item') {
    const id = event.currentTarget.closest("[data-item-id]").dataset.itemId
    const item = this.actor.items.get(id)
    item.sheet.render(true)
  }

  _onItemDelete(event, cls = '.item') {
    const li = $(event.currentTarget).parents(cls + ', .dl-item-row, [data-item-id]')
    this.showDeleteDialog(game.i18n.localize('DL.DialogAreYouSure'), game.i18n.localize('DL.DialogDeleteItemText'), li)
  }

  /* -------------------------------------------- */

  showDeleteDialog(title, content, htmlItem) {
    const deleteItem = () => {
      const id = htmlItem.data('itemId') || htmlItem.data('item-id')
      Item.deleteDocuments([id], {parent: this.actor})
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

  /* -------------------------------------------- */
  /*  Listeners                                   */

  /* -------------------------------------------- */

  static onRenderInner(app, html, data) {
    DLBaseItemSheet.onRenderInner(app, html, data)  // Call onRenderInner of base item sheet, since it's the same
  }

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
        ActiveEffect.create(affliction, {parent: this.actor})
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
        this.actor.update({[k]: v})
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

    // New Toggle Info
    html.find('.dlToggleInfoBtn').click(ev => {
      const root = $(ev.currentTarget).closest('[data-item-id]')
      const elem = $(ev.currentTarget)
      const selector = '.fa-chevron-down, .fa-chevron-up'
      const chevron = elem.is(selector) ? elem : elem.find(selector);
      const elements = $(root).find('.dlInfo')
      elements.each((_, el) => {
        if (el.style.display === 'none') {
          $(el).slideDown(100)
          chevron?.removeClass('fa-chevron-up')
          chevron?.addClass('fa-chevron-down')
        } else {
          $(el).slideUp(100)
          chevron?.removeClass('fa-chevron-down')
          chevron?.addClass('fa-chevron-up')
        }
      })
    })

    // Clone Inventory Item
    html.find('.item-clone').click(ev => {
      const li = $(ev.currentTarget).parents('.item')
      const item = duplicate(this.actor.items.get(li.data('itemId')))
      Item.create(item, {parent: this.actor})
    })

    // Wear item
    const _itemwear = (ev, bool) => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      const item = this.actor.items.get(id)
      item.update({'data.wear': bool}, {parent: this.actor})
    }
    html.find('.item-wear').click(ev => _itemwear(ev, false))
    html.find('.item-wearoff').click(ev => _itemwear(ev, true))
    html.find('.item-wear').each((i, el) => {
      const itemId = $(el).closest('[data-item-id]').data('itemId')
      const item = this.actor.items.get(itemId)
      if (
        item.data.data.wear &&
        item.data.data.strengthmin != '' &&
        +item.data.data.strengthmin > +this.actor.getAttribute("strength").value
      ) {
        $(el).addClass('dl-text-red')
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

    // Spell uses
    html.on('mousedown', '.spell-uses', ev => {
      const li = ev.currentTarget.closest('[data-item-id]')
      const item = this.actor.items.get(li.dataset.itemId)
      let uses = +item.data.data.castings.value
      const usesmax = +item.data.data.castings.max
      if (ev.button == 0) uses = uses < usesmax ? uses + 1 : 0
      else if (ev.button == 2) uses = uses > 0 ? uses - 1 : 0
      item.update({'data.castings.value': uses}, {parent: this.actor})
    })

    // Feature Item UD
    html.find('.feature-delete').click(ev => this._onItemDelete(ev, '.feature'))
    html
      .find('.feature-edit')
      .click(() =>
        this.actor.update({'data.features.edit': !this.actor.data.data.features.edit}).then(() => this.render()),
      )
    html.find('.editfeature').change(ev => {
      const id = $(ev.currentTarget).attr('data-item-id')
      const nameValue = ev.currentTarget.children[1].value
      let descValue = ev.currentTarget.children[2].value
      descValue = descValue.trim()

      const item = this.actor.getOwnedItem(id)
      item.update({name: nameValue, 'data.description': descValue})
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
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      this.actor.rollWeaponAttack(id, {event: ev})
    })

    // Rollable Talent
    html.on('mousedown', '.talent-roll', ev => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      console.log(ev)
      if (ev.button == 0) this.actor.rollTalent(id, {event: ev})
      else if (ev.button == 2) {
        console.log("something")
        this.actor.deactivateTalent(this.actor.items.get(id), 0)
      }
    })

    // Talent uses
    html.on('mousedown', '.talent-uses', ev => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      const talent = this.actor.items.get(id)
      if (ev.button == 0) this.actor.activateTalent(talent, true)
      else if (ev.button == 2) this.actor.deactivateTalent(talent, 1)
    })


    // Rollable Attack Spell
    html.find('.magic-roll').click(ev => {
      const id = ev.currentTarget.closest("[data-item-id]").dataset.itemId
      this.actor.rollSpell(id, {event: ev})
    })

    // Rollable (generic)
    html.find('.rollable, .item-roll').click(event => {
      event.preventDefault()
      const element = event.currentTarget
      const dataset = element.dataset
      if (dataset.roll) {
        const roll = new Roll(dataset.roll, this.actor.data.data)
        const label = dataset.label ? `Rolling ${dataset.label}` : ''
        roll.roll({async: false}).toMessage({
          speaker: ChatMessage.getSpeaker({actor: this.actor}),
          flavor: label,
        })
      } else {
        const id = event.currentTarget.closest("[data-item-id]").dataset.itemId
        this.actor.useItem(id)
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
      html.find('.dropitem').each((i, li) => {
        if (li.classList.contains('inventory-header')) return
        li.setAttribute('draggable', true)
        li.addEventListener('dragstart', handler, false)
      })
    }

    // Custom editor
    initDlEditor(html, this)
  }
}
