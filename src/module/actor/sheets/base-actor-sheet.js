const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api
const { ActorSheetV2 } = foundry.applications.sheets

import { onManageActiveEffect, prepareActiveEffectCategories } from '../../active-effects/effects'
import { buildOverview } from '../../chat/effect-messages'
import { DL } from '../../config'
import { DemonlordItem } from '../../item/item'

import tippy from "tippy.js";
import { buildDropdownListHover } from "../../utils/handlebars-helpers";
import { DLAfflictions } from '../../active-effects/afflictions'
import launchRollDialog from '../../dialog/roll-dialog'
import {TokenManager} from '../../pixi/token-manager'

const tokenManager = new TokenManager()

const { TextEditor } = foundry.applications.ux //eslint-disable-line no-shadow

export default class DLBaseActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    tag: 'form',
    form: {
      //handler: this.onSubmit,
      //submitOnChange: true,
      //closeOnSubmit: false
    },
    classes: ['demonlord-v2-sheet', 'demonlord-v2-actor'], // TODO: Add actor type to classes: this.type === 'character' ? (this.isPC ? 'pc' : 'npc') : this.type
    actions: {
      createItem: this.onCreateItem,
      editItem: this.onEditItem,
      deleteItem: this.onDeleteItem,
      toggleWear: this.onToggleWear,
      toggleInfo: this.onToggleInfo,

      editWealth: this.onEditWealth,
    },
    window: {
      resizable: true
    },
    position: {
      width: 960,
      height: 800,
    },
    scrollY: [],
    editable: true
  }

  static PARTS = {
    sidebar: { template: 'systems/demonlord/templates/actor/parts/character-sheet-sidemenu.hbs' },
    header: { template: 'systems/demonlord/templates/actor/parts/character-sheet-header.hbs' },
    tabs: { template: 'systems/demonlord/templates/generic/tab-navigation.hbs' },

    // Tabs
    character: { template: 'systems/demonlord/templates/actor/tabs/character.hbs' },
    combat: { template: 'systems/demonlord/templates/actor/tabs/combat.hbs' },
    talents: { template: 'systems/demonlord/templates/actor/tabs/talents.hbs' },
    magic: { template: 'systems/demonlord/templates/actor/tabs/magic.hbs' },
    inventory: { template: 'systems/demonlord/templates/actor/tabs/item.hbs' },
    background: { template: 'systems/demonlord/templates/actor/tabs/background.hbs' },
    afflictions: { template: 'systems/demonlord/templates/actor/tabs/afflictions.hbs' },
    effects: { template: 'systems/demonlord/templates/actor/tabs/effects.hbs' }
  }

  get canEdit() {
    let editable = this.options.editable && (this.document.isOwner || this.document.isGM)

    if (this.document.pack) {
      const pack = game.packs.get(this.document.pack)
      if (pack.locked) editable = false
    }

    return editable
  }

  get limited() {
    return this.document.limited
  }

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options)

    // These parts are always rendered
    options.parts = ['sidebar', 'header', 'tabs']
  }

  /** @override */
  static setPosition(options = {}) {
    const position = super.setPosition(options)
    const sheetBody = this.element.find('.sheet-body')
    const bodyHeight = position.height - 125
    sheetBody.css('height', bodyHeight)
    return position
  }

  /* -------------------------------------------- */
  /*  Data                                        */
  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options)
    context.isGM = game.user.isGM
    context.isOwner = this.document.isOwner
    context.config = DL
    context.actor = this.document
    context.system = this.document.system
    context.isCreature = this.document.type === 'creature'
    context.isCharacter = this.document.type === 'character'
    context.isNPC = this.document.type === 'character' && !this.document.system.isPC
    context.effects = true
    context.generalEffects = prepareActiveEffectCategories(Array.from(this.document.allApplicableEffects()), true)
    context.effectsOverview = buildOverview(this.document)
    context.flags = this.document.flags
    context.addCreatureInventoryTab = game.settings.get('demonlord', 'addCreatureInventoryTab')
    context.hideTurnMode = game.settings.get('demonlord', 'optionalRuleInitiativeMode') === 's' ? false : true
    context.hideFortune = game.settings.get('demonlord', 'fortuneHide') ? true : false

    //context.tabs = this._getTabs(options.parts)
    context.tabs = this._prepareTabs('primary')
    context.effectsTabs = this._prepareTabs('effects')

    if ((context.isCreature || context.isVehicle) && !context.addCreatureInventoryTab) {
      context.tabs.inventory.hide = true
    }

    // Enrich HTML
    context.system.enrichedDescription = await TextEditor.implementation.enrichHTML(this.document.system.description, { async: true });

    // Attributes checkbox
    for (const attr of Object.entries(context.system.attributes)) {
      attr.isCheckbox = attr.dtype === 'Boolean'
    }

    // Retrieve data for nested items
    const m = new Map()
    for await (const item of this.document.items) {
      const type = item.type
      item.system.enrichedDescription = await TextEditor.implementation.enrichHTML(item.system.description, { async: true })
      m.has(type) ? m.get(type).push(item) : m.set(type, [item])
    }

    context._itemsByType = m;

    return context;
  }

  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options)

    switch (partId) {
      case 'sidebar':
      case 'header':
      case 'tabs':
        break
      case 'effects':
        context.tab = context.tabs[partId]
        context.cssClass = context.tab.cssClass
        context.active = context.tab.active
        context.effectsTab = context.effectsTabs.general
        break
      default:
        context.tab = context.tabs[partId]
        context.cssClass = context.tab.cssClass
        context.active = context.tab.active
    }

    return context
  }

  _prepareItems(sheetData) {
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
  /*  Actions                                     */
  /* -------------------------------------------- */
  static async onCreateItem(event) {
    event.preventDefault()
    event.stopPropagation()
    const header = event.target.closest('[data-type]') // Get the type of item to create.
    const type = header.dataset.type // Grab any data associated with this control.
    const itemData = {
      name: `New ${type.capitalize()}`,
      type: type,
      system: foundry.utils.duplicate(header.dataset),
    }

    // Remove the type from the dataset since it's in the itemData.type prop.
    return await DemonlordItem.create(itemData, { parent: this.document })
  }

  // eslint-disable-next-line no-unused-vars
  static async onEditItem(event) {
    const id = event.target.closest('[data-item-id]').dataset.itemId
    const item = this.document.items.get(id)
    item.sheet.render(true)
  }

  static async onDeleteItem(event) {
    const li = event.target.closest('[data-item-id]')
    await this.showDeleteDialog(game.i18n.localize('DL.DialogAreYouSure'), game.i18n.localize('DL.DialogDeleteItemText'), li)
  }

  static async onEditWealth() {
    await this.actor.update({ 'system.wealth.edit': !this.actor.system.wealth.edit }).then(() => this.render())
  }

  static async onToggleWear(event) {
    const id = event.target.closest('[data-item-id]').dataset.itemId
    const item = this.actor.items.get(id)
    await item.update({ 'system.wear': !item.system.wear }, { parent: this.actor })
  }

  static async onToggleInfo(event) {
    const elem = $(event.target)
    const root = elem.closest('[data-item-id]')
    const selector = '.fa-chevron-down, .fa-chevron-up'
    const chevron = elem.is(selector) ? elem : elem.find(selector);
    const elements = $(root).find('.dlInfo')
    elements.each((_, i) => {
        if (i.style.display === 'none') {
          $(i).slideDown(100)
          chevron?.removeClass('fa-chevron-up')
          chevron?.addClass('fa-chevron-down')
        } else {
          $(i).slideUp(100)
          chevron?.removeClass('fa-chevron-down')
          chevron?.addClass('fa-chevron-up')
        }
      })
  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */
  /* -------------------------------------------- */

  _getTabs(parts) {
    const tabGroup = 'primary'

    const tabs = {}

    for (const partId of parts) {
      const tab = {
        id: '',
        group: tabGroup,
        //label: 'DL.Tabs'
        icon: `icon-${partId}`
      }

      if (['character', 'combat', 'talents', 'magic', 'inventory', 'background', 'afflictions', 'effects'].includes(partId)) {
        tab.id = partId
        //tab.label += capitalize(partId)
      } else {
        continue
      }

      tab.active = this.tabGroups[tab.group] === tab.id
      tab.cssClass = tab.active ? 'active' : ''

      tabs[partId] = tab
    }

    return tabs
  }

  /* -------------------------------------------- */

  async showDeleteDialog(title, content, htmlItem) {
    const deleteItem = async () => {
      const id = htmlItem.dataset.itemId || htmlItem.dataset['item-id']
      await Item.deleteDocuments([id], { parent: this.document })
      //htmlItem.slideUp(200, () => this.render(false))
    }

    const d = new DialogV2({
      window: {
        title: title,
      },
      content: content,
      buttons: [
        {
          action: 'yes',
          icon: 'fas fa-check',
          label: game.i18n.localize('DL.DialogYes'),
          callback: async () => await deleteItem(),
          default: true
        },
        {
          action: 'no',
          icon: 'fas fa-times',
          label: game.i18n.localize('DL.DialogNo'),
        }
      ],
      close: () => { }
    })
    d.render(true)
  }

  /* -------------------------------------------- */
  /*  Listeners                                   */
  /* -------------------------------------------- */

  /** @override */
  async _onRender(context, options) { // eslint-disable-line no-unused-vars
    super._onRender(context, options)

    let e = this.element

    const autoresize = (el) => {
      const jEl = $(el)
      if (jEl.prop("tagName") === 'INPUT') {
        const setSize = () => {
          let size = Math.max(1, (el.value?.length || el.placeholder?.length))
          let ff = jEl.css('font-family')
          if (ff.includes('Libertine')) {
            el.style.width = (size + 4) + 'ch'
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

    e.querySelectorAll('[autosize]').forEach(el => autoresize(el))

    // Tooltips
    tippy(e.querySelectorAll('[data-tippy-content]'))
    tippy(e.querySelectorAll('[data-tippy-html]'), {
      content(reference) {
        return $(reference).data('tippyHtml')
      },
      allowHTML: true
    })
    tippy(e.querySelectorAll('.dl-new-project-2.dropdown'), {
      content(reference) {
        return buildDropdownListHover(reference.attributes.name.value, reference.attributes.value.value, context.actor)
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
    tippy(e.querySelectorAll('[data-tab="afflictions"] [data-tippy-affliction]'), {
      content(reference) {
        return $(reference).data('tippyAffliction')
      },
      trigger: 'mouseenter',
      arrow: true,
      placement: 'right-start',
    })
    document.querySelector('[data-tippy-root]')?.remove()

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    if (this.document.parent?.isOwner) {
      const dragHandler = async ev => await this._onDrag(ev)
      e.querySelectorAll('.nested-item').forEach(el => {
        el.setAttribute('draggable', true)
        el.addEventListener('dragstart', dragHandler, false)
        el.addEventListener('dragend', dragHandler, false)
      })
    }

    /*if (this.canEdit()) {
      const inputs = e.querySelectorAll('input')
      inputs.focus(ev => ev.currentTarget.select())
    }*/

    // Effects control
    e.querySelectorAll('.effect-control')?.forEach(el => el.addEventListener('click', async ev => await onManageActiveEffect(ev, this.document)))

    // Disable afflictions
    e.querySelector('.disableafflictions')?.addEventListener('click', async () => {
      await DLAfflictions.clearAfflictions(this.document)
    })

    // Affliction checkboxes
    e.querySelectorAll('[data-tab="afflictions"] .item-group-affliction.checkable')?.forEach(el => el.addEventListener('click', async ev => {
      const input = ev.target.parentElement.firstElementChild
      const checked = input.checked
      const afflictionId = input.dataset.name
      if (checked) {
        input.checked = false
        const affliction = this.actor.effects.find(ef => ef?.statuses?.has(afflictionId))
        if (!affliction) return false
        await affliction.delete()
      } else {
        input.checked = true
        if (this.actor.isImmuneToAffliction(afflictionId)) {
          ui.notifications.warn(game.i18n.localize('DL.DialogWarningActorImmune'));
          return false;
        }
        const affliction = CONFIG.statusEffects.find(a => a.id === afflictionId)
        if (!affliction) return false
        affliction['statuses'] = [affliction.id]
        await ActiveEffect.create(affliction, { parent: this.actor })
        const targets = tokenManager.targets
        switch (afflictionId) {
            case 'help': {
                const attribute = this.actor.system.attributes.intellect
                if (!DLAfflictions.isActorBlocked(this.actor, 'challenge', attribute.key) && targets.length === 1)
                    launchRollDialog(this.actor.name + ' - ' + game.i18n.localize('DL.DialogChallengeRoll') + attribute.label, async (event, html) => {
                        let result = await this.actor.rollAttributeChallenge(attribute, html.form.elements.boonsbanes.value, html.form.elements.modifier.value)
                        if (result._total >= 10 || game.settings.get('demonlord', 'optionalRuleDieRollsMode') === 'b' && result._total >= 11) {
                            affliction['statuses'] = [affliction.id]
                            const effect = CONFIG.statusEffects.find(a => a.id === "helped")
                            effect['statuses'] = [effect.id]
                            if (game.user.isGM) {
                                await ActiveEffect.create(effect, {
                                    parent: targets[0].actor
                                })
                            } else {
                                game.socket.emit('system.demonlord', {
                                    request: "createEffect",
                                    tokenuuid: targets[0].document.uuid,
                                    effectData: effect
                                })
                            }
                        }
                    })
                break;
            }
            case 'stabilize': {
                const attribute = this.actor.system.attributes.intellect
                const isIncapacitated = targets.length === 1 ? targets[0].actor.appliedEffects.find(ef => ef?.statuses?.has('incapacitated')) : false
                if (!DLAfflictions.isActorBlocked(this.actor, 'challenge', attribute.key) && isIncapacitated)
                    launchRollDialog(this.actor.name + ' - ' + game.i18n.localize('DL.DialogChallengeRoll') + attribute.label, async (event, html) => {
                        let result = await this.actor.rollAttributeChallenge(attribute, html.form.elements.boonsbanes.value, html.form.elements.modifier.value)
                        if (result._total >= 10 || game.settings.get('demonlord', 'optionalRuleDieRollsMode') === 'b' && result._total >= 11) {
                            if (game.user.isGM) {
                                await targets[0].actor.increaseDamage(-1)
                            } else {
                                game.socket.emit('system.demonlord', {
                                    request: "increaseDamage",
                                    tokenuuid: targets[0].document.uuid,
                                    increment: -1
                                })
                            }
                        }
                    })
                break;
            }
        }
      }
      return true
    }))

    // Toggle accordion
    // e.querySelectorAll('.toggleAccordion').forEach(el => el.addEventListener('click', async ev => {
    //   const div = ev.currentTarget

    //   if (div.nextElementSibling.style.display === 'none') {
    //     div.nextElementSibling.style.display = 'block'
    //     div.className = 'toggleAccordion change'
    //   } else {
    //     div.nextElementSibling.style.display = 'none'
    //     div.className = 'toggleAccordion'
    //   }
    //   if (['action', 'afflictions', 'damage'].includes(div.dataset.type)) {
    //     const type = capitalize(div.dataset.type)
    //     const k = 'system.afflictionsTab.hideAction' + type
    //     const v = !this.actor.system.afflictionsTab[`hide${type}`]
    //     await this.actor.update({[k]: v})
    //   }
    // }))

    // Clone inventory item
    e.querySelectorAll('.item-clone')?.forEach(el => el.addEventListener('click', async ev => {
      const li = $(ev.currentTarget).parents('.item')
      const item = foundry.utils.duplicate(this.actor.items.get(li.data('itemId')))
      await Item.create(item, { parent: this.actor })
    }))

    // Wear item style
    e.querySelectorAll('.item-wear')?.forEach(el => {
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

    // Spell uses
    e.querySelectorAll('.spell-uses')?.forEach(el => el.addEventListener('mousedown', async ev => {
      const li = ev.target.closest('[data-item-id]')
      const item = this.actor.items.get(li.dataset.itemId)
      let uses = +item.system.castings.value
      const usesmax = +item.system.castings.max
      if (ev.button == 0) uses = uses < usesmax ? uses + 1 : 0
      else if (ev.button == 2) uses = uses > 0 ? uses - 1 : 0
      await item.update({ 'system.castings.value': uses }, { parent: this.actor })
    }))

    // Rollable Attributes
    e.querySelectorAll('.attribute .name')?.forEach(el => el.addEventListener('click', ev => {
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
    }))

    // Set immune on rollable attribute
    e.querySelectorAll('.attribute .name')?.forEach(el => el.addEventListener('contextmenu', async ev => {
      const div = $(ev.currentTarget)
      const attributeName = div.data('key')
      await this.actor.update({ system: { attributes: { [attributeName]: { immune: !this.actor.system.attributes[attributeName].immune } } } })
    }))

    // Rollable Attack
    e.querySelectorAll('.attack-roll')?.forEach(el => el.addEventListener('click', async ev => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      await this.actor.rollWeaponAttack(id, { event: ev })
    }))

    // Rollable Talent
    e.querySelectorAll('.talent-roll').forEach(el => el.addEventListener('mousedown', async ev => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      if (ev.button == 0) await this.actor.rollTalent(id, { event: ev })
      else if (ev.button == 2) await this.actor.deactivateTalent(this.actor.items.get(id), 0)
    }))

    // Talent uses
    e.querySelectorAll('.talent-uses').forEach(el => el.addEventListener('mousedown', async ev => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      const talent = this.actor.items.get(id)
      if (ev.button == 0) await this.actor.activateTalent(talent, true)
      else if (ev.button == 2) await this.actor.deactivateTalent(talent, 1)
    }))

    // Rollable Attack Spell
    e.querySelectorAll('.magic-roll').forEach(el => el.addEventListener('click', async ev => {
      const id = ev.currentTarget.closest("[data-item-id]").dataset.itemId
      await this.actor.rollSpell(id, { event: ev })
    }))

    // Rollable (generic)
    e.querySelectorAll('.rollable, .item-roll').forEach(el => el.addEventListener('click', async event => {
      event.preventDefault()
      const element = event.currentTarget
      const dataset = element.dataset
      if (dataset.roll) {
        const roll = new Roll(dataset.roll, this.actor.system)
        const label = dataset.label ? `Rolling ${dataset.label}` : ''
        await roll.roll().toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label,
        })
      } else {
        const id = event.currentTarget.closest("[data-item-id]").dataset.itemId
        await this.actor.rollItem(id, { event: event })
      }
    }))

    // Drag events for macros.
    if (this.actor.isOwner) {
      const handler = ev => this._onDragStart(ev)
      e.querySelectorAll('.dropitem').forEach(el => {
        if (el.classList.contains('inventory-header')) return
        el.setAttribute('draggable', true)
        el.addEventListener('dragstart', handler, false)
      })
    }
  }

  /* -------------------------------------------- */
  /*  Drop item event                             */
  /* -------------------------------------------- */
  async _onDrag(ev) {
    const itemIndex = ev.currentTarget.closest('[data-item-index]').dataset.itemIndex
    const data = this.document
    if (ev.type == 'dragend') {
      if (data.system.contents[itemIndex].system.quantity <= 1) {
        await this.deleteContentsItem(itemIndex)
      } else {
        await this.decreaseContentsItemQuantity(itemIndex)
      }
    } else if (ev.type == 'dragstart') {
      const dragData = { type: 'Item', 'uuid': data.system.contents[itemIndex].uuid }
      ev.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }
  }

  // async _addItem(data, level, group) {
  //   const levelItem = new PathLevelItem()
  //   const itemData = foundry.utils.duplicate(this.document)
  //   const item = await getNestedItemData(data)
  //   if (!item || ['ancestry', 'path', 'creaturerole'].includes(item.type)) return

  //   levelItem.uuid = item.uuid ?? data.uuid
  //   levelItem.id = item.id || item._id
  //   levelItem._id = item._id || item.id
  //   levelItem.name = item.name
  //   levelItem.description = item.system.description
  //   levelItem.pack = data.pack ? data.pack : ''
  //   levelItem.data = item
  //   levelItem.img = item.img

  //   if (this.document.type === 'ancestry' || this.document.type === 'path') {
  //     if (level === '0') {
  //       if (group === 'feature') itemData.system.levels[level].talents.push(levelItem)
  //       else itemData.system.levels[level][group].push(levelItem)
  //     } else {
  //       itemData.system.levels[level][group].push(levelItem)
  //     }
  //   } else {
  //     // Anything without levels
  //     itemData.system[group].push(levelItem)
  //   }

  //   await this.document.update(itemData)
  // }

  /*
  _onDragOver(event) {
    $(event.target).addClass('drop-hover')
  }

  _onDragLeave(event) {
    $(event.target).removeClass('drop-hover')
  }*/

  /** @override */
  async _onDropItem(ev, _item) {
    try {
      const item = _item

      const isAllowed = await this.checkDroppedItem(_item)
      if (isAllowed) {
        const data = foundry.utils.duplicate(item);
        this.actor.createEmbeddedDocuments('Item', [data])
        await this.postDropItemCreate(data)
      } else {
        console.warn('Wrong item type dragged', this.document, item)
      }
    } catch (err) {
      console.warn(err)
    }
  }

  async checkDroppedItem(_itemData) {
    return true
  }

  async postDropItemCreate(_itemData) {
    return true
  }
}
