import {onManageActiveEffect, prepareActiveEffectCategories} from '../../active-effects/effects'
import {buildOverview} from '../../chat/effect-messages'
import {capitalize, enrichHTMLUnrolled} from '../../utils/utils'
import {DemonlordItem} from '../../item/item'
import {DLAfflictions} from '../../active-effects/afflictions'
import { buildDropdownList } from '../../utils/handlebars-helpers'
import tippy from "tippy.js";

export default class DLBaseActorSheet extends ActorSheet {
  /* -------------------------------------------- */
  /*  Data preparation                            */

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Base data
    const data = {
      isGM: game.user.isGM,
      isOwner: this.actor.isOwner,
      isCreature: this.actor.type === 'creature',
      isCharacter: this.actor.type === 'character',
      isNPC: this.actor.type === 'character' && !this.actor.system.isPC,
      limited: this.document.limited,
      options: this.options,
      editable: this.isEditable,
      config: CONFIG.DL,
      actor: this.actor,
      system: this.actor.system,
      effects: true,
      generalEffects: prepareActiveEffectCategories(Array.from(this.actor.allApplicableEffects()), true),
      effectsOverview: buildOverview(this.actor),
      flags: this.actor.flags,
    }

    // Enrich HTML
    data.system.enrichedDescription = await TextEditor.enrichHTML(this.actor.system.description, {async: true});

    // Attributes checkbox
    for (const attr of Object.entries(data.system.attributes)) {
      attr.isCheckbox = attr.dtype === 'Boolean'
    }

    // Map items by type (used in other operations). Also enrich the items' descriptions
    const m = new Map()
    for await (const item of this.actor.items) {
      const type = item.type
      item.system.enrichedDescription =  await enrichHTMLUnrolled(item.system.description)
      m.has(type) ? m.get(type).push(item) : m.set(type, [item])
    }
    data._itemsByType = m
    return data
  }

  /* -------------------------------------------- */

  prepareItems(sheetData) {
    const m = sheetData._itemsByType
    const actorData = sheetData.actor

    const actorHasChangeBool = (actor, key) => {
      return Array.from(actor.allApplicableEffects()).filter(e => !e.disabled && e.changes.filter(c => c.key === key && c.value === '1').length > 0).length > 0
    }

    const noAttacks = actorHasChangeBool(actorData, 'system.maluses.noAttacks')
    const noSpells = actorHasChangeBool(actorData, 'system.maluses.noSpells')

    actorData.weapons = noAttacks ? [] : (m.get('weapon') || [])
    actorData.spells = noSpells ? [] : (m.get('spell') || [])
    actorData.talents = m.get('talent') || []
    actorData.features = m.get('feature') || []
    // Sort spells in the spellbooks by their rank
    actorData.spells.sort((a, b) => a.system.rank - b.system.rank)
    // Prepare the book (spells divided by tradition)
    actorData.spellbook = noSpells ? [] : this._prepareBook(actorData.spells, 'tradition', 'spells')
  }

  /* -------------------------------------------- */

  _prepareBook(items, dataGroupProperty, returnItemsName) {
    const m = new Map()
    items.forEach(i => {
      const group = i.system[dataGroupProperty] || ''
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
    if (isAllowed) {
      const createdItems = await super._onDropItemCreate(itemData)
      await this.postDropItemCreate(createdItems[0])
    } else {
      console.warn('Wrong item type dragged', this.actor, itemData)
    }
  }

  async checkDroppedItem(_itemData) {
    return true
  }

  async postDropItemCreate(_itemData) {
    return true
  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */

  /* -------------------------------------------- */

  async _onItemCreate(event) {
    event.preventDefault()
    event.stopPropagation()
    const header = event.currentTarget // Get the type of item to create.
    const type = header.dataset.type // Grab any data associated with this control.
    const itemData = {
      name: `New ${type.capitalize()}`,
      type: type,
      system: foundry.utils.duplicate(header.dataset),
    }

    // Remove the type from the dataset since it's in the itemData.type prop.
    return await DemonlordItem.create(itemData, {parent: this.actor})
  }

  // eslint-disable-next-line no-unused-vars
  _onItemEdit(event, cls = '.item') {
    const id = event.currentTarget.closest("[data-item-id]").dataset.itemId
    const item = this.actor.items.get(id)
    item.sheet.render(true)
  }

  async _onItemDelete(event, cls = '.item') {
    const li = $(event.currentTarget).parents(cls + ', .dl-item-row, [data-item-id]')
    await this.showDeleteDialog(game.i18n.localize('DL.DialogAreYouSure'), game.i18n.localize('DL.DialogDeleteItemText'), li)
  }

  /* -------------------------------------------- */

  async showDeleteDialog(title, content, htmlItem) {
    const deleteItem = async () => {
      const id = htmlItem.data('itemId') || htmlItem.data('item-id')
      await Item.deleteDocuments([id], {parent: this.actor})
      htmlItem.slideUp(200, () => this.render(false))
    }

    const d = new Dialog({
      title: title,
      content: content,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogYes'),
          callback: async () => await deleteItem(),
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
    const autoresize = (el) => {
      const jEl = $(el)
      if (jEl.prop("tagName") === 'INPUT') {
        const setSize = () => {
          let size = Math.max(1, (el.value?.length || el.placeholder?.length))
          let ff = jEl.css('font-family')
          if (ff.includes('Libertine')) {
            el.style.width = (size + 4)+ 'ch'
          } else {
            el.size = size
          }
        }
        setSize()
        el.oninput = setSize
      } else if (jEl.prop("tagName") === 'TEXTAREA') {
        const getHeight = () => Math.max(0, el?.scrollHeight)
        jEl.height(0)
        jEl.height(getHeight() + 'px')
        el.oninput = () => {
          jEl.height(0)
          jEl.height(getHeight() + 'px')
        }
      }
    }

    html.find('[autosize]').each((_, el) => autoresize(el))

    // Icons tooltip
    tippy('[data-tippy-content]')
    tippy('[data-tippy-html]', {
      content(reference) {
        return $(reference).data('tippyHtml')
      },
      allowHTML: true
    })
    tippy('.dl-new-project-2.dropdown', {
      content(reference) {
        html = buildDropdownList(reference.attributes.name.value, reference.attributes.value.value, data)
        return html
      },
      allowHTML: true,
      interactive: true,
      trigger: 'click',
      placement: 'bottom',
      arrow: false,
      offset: [0, 0],
      theme: 'demonlord-dropdown',
      animation: 'shift-away',
    })
    
    tippy('[data-tab="afflictions"] [data-tippy-affliction]', {
      content(reference) {
        return $(reference).data('tippyAffliction')
      },
      trigger: 'mouseenter',
      arrow: true,
      placement: 'right-start',
    })
    document.querySelector('[data-tippy-root]')?.remove()
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
    html.find('.effect-control').click(async ev => await onManageActiveEffect(ev, this.document))

    // Disable Afflictions
    html.find('.disableafflictions').click(async () => {
      await DLAfflictions.clearAfflictions(this.actor)
    })

    // Afflictions checkboxes
    html.find('[data-tab="afflictions"] input').click(async ev => {
      const input = ev.currentTarget
      const checked = input.checked
      const afflictionId = $(ev.currentTarget).data('name')
      if (checked) {
        if (this.actor.isImmuneToAffliction(afflictionId)) {
          ui.notifications.warn(game.i18n.localize('DL.DialogWarningActorImmune'));
          return false;
        }
        const affliction = CONFIG.statusEffects.find(a => a.id === afflictionId)
        if (!affliction) return false
        affliction['statuses'] = [affliction.id]
        await ActiveEffect.create(affliction, {parent: this.actor})

      } else {
        const affliction = this.actor.effects.find(e => e?.statuses?.has(afflictionId))
        if (!affliction) return false
        await affliction.delete()
      }
      return true
    })

    // Toggle Accordion
    html.find('.toggleAccordion').click(async ev => {
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
        const k = 'system.afflictionsTab.hideAction' + type
        const v = !this.actor.system.afflictionsTab[`hide${type}`]
        await this.actor.update({[k]: v})
      }
    })

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
    html.find('.item-clone').click(async ev => {
      const li = $(ev.currentTarget).parents('.item')
      const item = foundry.utils.duplicate(this.actor.items.get(li.data('itemId')))
      await Item.create(item, {parent: this.actor})
    })

    // Wear item
    const _itemwear = async (ev, bool) => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      const item = this.actor.items.get(id)
      await item.update({'system.wear': bool}, {parent: this.actor})
    }
    html.find('.item-wear').click(async ev => await _itemwear(ev, false))
    html.find('.item-wearoff').click(async ev => await _itemwear(ev, true))
    html.find('.item-wear').each((i, el) => {
      const itemId = $(el).closest('[data-item-id]').data('itemId')
      const item = this.actor.items.get(itemId)
      if (
        item.system.wear &&
        item.system.requirement?.minvalue != '' &&
        item.system.requirement?.attribute != '' && 
        +item.system.requirement?.minvalue > (+this.actor.getAttribute(item.system.requirement?.attribute)?.value + +this.actor.getAttribute(item.system.requirement?.attribute)?.requirementModifier)
      ) {
        $(el).addClass('dl-text-red')
      }
    })

    // Inventory items CUD
    html.find('.item-create').click(async ev => await this._onItemCreate(ev))
    html.find('.item-edit').click(async ev => await this._onItemEdit(ev))
    html.find('.item-delete').click(async ev => await this._onItemDelete(ev))

    // Spell CUD
    html.find('.spell-create').click(async ev => await this._onItemCreate(ev))
    html.find('.spell-edit').click(async ev => await this._onItemEdit(ev))
    html.find('.spell-delete').click(async ev => await this._onItemDelete(ev))

    // Spell uses
    html.on('mousedown', '.spell-uses', async ev => {
      const li = ev.currentTarget.closest('[data-item-id]')
      const item = this.actor.items.get(li.dataset.itemId)
      let uses = +item.system.castings.value
      const usesmax = +item.system.castings.max
      if (ev.button == 0) uses = uses < usesmax ? uses + 1 : 0
      else if (ev.button == 2) uses = uses > 0 ? uses - 1 : 0
      await item.update({'system.castings.value': uses}, {parent: this.actor})
    })

    // Rollable Attributes
    html.find('.attribute .name').click(ev => {
      const div = $(ev.currentTarget)
      const attributeName = div.data('key')
      const attribute = this.actor.getAttribute(attributeName)
      if (!attribute.immune) {
        // Make an attribute attack if a target is selected, otherwise, challenge roll
        if (game.user.targets?.ids.length && !(event.ctrlKey || event.metaKey)) {
          this.actor.rollAttack(attribute)
        } else {
          this.actor.rollChallenge(attribute)
        }
      }
    })

    // Set immune on rollable attribute
    html.find('.attribute .name').contextmenu(async ev => {
      const div = $(ev.currentTarget)
      const attributeName = div.data('key')
      await this.actor.update({ system: { attributes: { [attributeName]: { immune : !this.actor.system.attributes[attributeName].immune } } } })
    })

    // Rollable Attack
    html.find('.attack-roll').click(async ev => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      await this.actor.rollWeaponAttack(id, {event: ev})
    })

    // Rollable Talent
    html.on('mousedown', '.talent-roll', async ev => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      if (ev.button == 0) await this.actor.rollTalent(id, {event: ev})
      else if (ev.button == 2) await this.actor.deactivateTalent(this.actor.items.get(id), 0)
    })

    // Talent uses
    html.on('mousedown', '.talent-uses', async ev => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      const talent = this.actor.items.get(id)
      if (ev.button == 0) await this.actor.activateTalent(talent, true)
      else if (ev.button == 2) await this.actor.deactivateTalent(talent, 1)
    })


    // Rollable Attack Spell
    html.find('.magic-roll').click(async ev => {
      const id = ev.currentTarget.closest("[data-item-id]").dataset.itemId
      await this.actor.rollSpell(id, {event: ev})
    })

    // Rollable (generic)
    html.find('.rollable, .item-roll').click(async event => {
      event.preventDefault()
      const element = event.currentTarget
      const dataset = element.dataset
      if (dataset.roll) {
        const roll = new Roll(dataset.roll, this.actor.system)
        const label = dataset.label ? `Rolling ${dataset.label}` : ''
        await roll.roll().toMessage({
          speaker: ChatMessage.getSpeaker({actor: this.actor}),
          flavor: label,
        })
      } else {
        const id = event.currentTarget.closest("[data-item-id]").dataset.itemId
        await this.actor.rollItem(id, {event: event})
      }
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
  }
}
