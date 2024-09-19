const { HandlebarsApplicationMixin } = foundry.applications.api
const { ItemSheetV2 } = foundry.applications.sheets

import {onCreateEffect, onEditEffect, onDeleteEffect, onToggleEffect, prepareActiveEffectCategories} from '../../active-effects/effects'
import {DL} from '../../config'
import {DamageType} from '../nested-objects'
import tippy from "tippy.js";
import {buildDropdownListHover} from "../../utils/handlebars-helpers";
import 'tippy.js/animations/shift-away.css';
import { capitalize } from '../../utils/utils'
import {DemonlordItem} from "../item";
import {enrichHTMLUnrolled, i18n} from "../../utils/utils";
import { 
  getNestedItemData,
  getNestedDocument
} from '../nested-objects';

export default class DLBaseItemSheetV2 extends HandlebarsApplicationMixin(ItemSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    tag: 'form',
    form: {
      handler: this.onSubmit,
      submitOnChange: true,
      closeOnSubmit: false
    },
    classes: ['demonlord-v2-sheet', 'demonlord-v2-item'],
    actions: {
      toggleAmmoRequired: this.onToggleArmorRequired,
      toggleAutoDestroy: this.onToggleAutoDestroy,
      toggleShield: this.onToggleShield,
      createEffect: this.onManageEffect,
      editEffect: this.onManageEffect,
      toggleEffect: this.onManageEffect,
      deleteEffect: this.onManageEffect,
      createDamage: this.onEditDamage,
      deleteDamage: this.onEditDamage,
      toggleInfo: this.onToggleInfo,
      createNestedItem: this.onCreateNestedItem,
      editNestedItem: this.onEditNestedItem,
      deleteItem: this.onDeleteItem,
      toggleSpeak: this.onToggleSpeak,
      toggleRead: this.onToggleRead,
      toggleWrite: this.onToggleWrite,
      toggleHealing: this.onToggleHealing,
      toggleAttackBonus: this.onToggleAttackBonus,
      toggleChallengeBonus: this.onToggleChallengeBonus,
      editImage: this.onEditImage
    },
    window: {
      resizable: true
    },
    position: {
      width: 600,
      height: 650,
    },
    scrollY: ['.tab.paths', '.tab.active'],
  }

  static PARTS = {

    header: { template: 'systems/demonlord/templates/v2/item/parts/item-sheet-header.hbs' },
    tabs: { template: 'systems/demonlord/templates/v2/generic/tab-navigation.hbs' },
    description: { template: 'systems/demonlord/templates/v2/item/parts/item-description.hbs' },
    effects: { template: 'systems/demonlord/templates/v2/item/parts/item-effects.hbs' },

    // Attributes
    ammo: { template: 'systems/demonlord/templates/v2/item/item-ammo-sheet.hbs' },
    armor: { template: 'systems/demonlord/templates/v2/item/item-armor-sheet.hbs' },
    creaturerole: { template: 'systems/demonlord/templates/v2/item/item-role-sheet.hbs'},
    endoftheround: { template: 'systems/demonlord/templates/v2/item/item-endoftheround-sheet.hbs' },
    feature: { template: 'systems/demonlord/templates/v2/item/item-feature-sheet.hbs' }, // Empty
    item: { template: 'systems/demonlord/templates/v2/item/item-item-sheet.hbs' },
    language: { template: 'systems/demonlord/templates/v2/item/item-language-sheet.hbs' },
    profession: { template: 'systems/demonlord/templates/v2/item/item-profession-sheet.hbs' }, // Empty
    relic: { template: 'systems/demonlord/templates/v2/item/item-relic-sheet.hbs' },
    specialaction: { template: 'systems/demonlord/templates/v2/item/item-specialaction-sheet.hbs' }, // Empty
    spell: { template: 'systems/demonlord/templates/v2/item/item-spell-sheet.hbs' },
    talent: { template: 'systems/demonlord/templates/v2/item/item-talent-sheet.hbs' },
    weapon: { template: 'systems/demonlord/templates/v2/item/item-weapon-sheet.hbs' }
  }

  // Default tab
  static PARTS_MAP = {
    'ammo': 'ammo',
    'armor': 'armor',
    'creaturerole': 'role',
    'endoftheround': 'endoftheround',
    'feature': 'description',
    'item': 'item',
    'language': 'language',
    'profession': 'description',
    'relic': 'relic',
    'specialaction': 'description',
    'spell': 'spell',
    'talent': 'talent',
    'weapon': 'weapon'
  }

  /**
   * @override
   */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);

    // These parts are always rendered
    options.parts = [ 'header' ]

    // Optionally add the main tab (attributes)
    const map = {
      'creaturerole': 'role'
    }

    const ignoredParts = [ 'feature', 'profession', 'specialaction' ] // Ideally temporary

    if (!ignoredParts.includes(this.item.type)) {
      options.parts.push(map[this.item.type] || this.item.type)
    }

    // Add the rest of the tabs
    options.parts.push('description', 'effects')
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
    context.isOwner = this.actor?.isOwner,
    context.lockAncestry = game.settings.get('demonlord', 'lockAncestry')
    context.config = DL
    context.item = this.item
    context.system = this.document.system
    if (options.isFirstRender) {
      this.tabGroups['primary'] = this.tabGroups['primary'] ?? options.parts.find(p => Object.values(DLBaseItemSheetV2.PARTS_MAP).includes(p))
    }

    context.tabs = this._getTabs(options.parts)

    // Enrich the description
    context.system.enrichedDescription = await TextEditor.enrichHTML(this.document.system.description);
    context.system.enrichedDescriptionUnrolled = await enrichHTMLUnrolled(this.document.system.description)

    context.effects = prepareActiveEffectCategories(this.document.effects, true, true)

    if (context.item.type === 'weapon' || context.item.type === 'spell' || context.item.type === 'talent' || context.item.type === 'endoftheround') this._prepareDamageTypes(context)

    this.sectionStates = this.sectionStates || new Map()

    if (context?.system?.contents != undefined && context.system.contents.length > 0) {
      context.system.contents = await Promise.all(context.system.contents.map(getNestedItemData))
    }

    return context
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options)

    switch (partId) {
      case 'header':
      case 'feature':
      case 'specialaction':
      case 'profession':
        break
      case 'ammo':
      case 'armor':
      case 'endoftheround':
      case 'item':
      case 'language':
      case 'relic':
      case 'spell':
      case 'talent':
      case 'weapon':
      case 'description':
      case 'effects':
        context.tab = context.tabs[partId]
        context.cssClass = context.tab.cssClass
        context.active = context.tab.active
        break
    }

    return context
  }

  /* -------------------------------------------- */

  /**
   * Handles the damage types updates
   * @override */
  static async onSubmit(event, form, formData) {
    const item = this.item
    const updateData = foundry.utils.expandObject(formData.object)

    if (['talent', 'weapon', 'spell', 'endoftheround'].includes(item.type)) {
      // Set the update key based on type
      const damageKey = 'system.action.damagetypes'
      // Grab damages from form
      let altdamage = updateData.altdamage
      let altdamagetype = updateData.altdamagetype
      altdamage = Array.isArray(altdamage) ? altdamage : [altdamage]
      altdamagetype = Array.isArray(altdamagetype) ? altdamagetype : [altdamagetype]

      // Zip the damage-damagetypes into objects, filtering them for types that do not have a damage
      updateData[damageKey] = altdamage
        .map((damage, index) => ({
          damage: damage,
          damagetype: altdamagetype[index],
        }))
        .filter(d => Boolean(d.damage))
      // Remove the unzipped values from the update data
      delete updateData.altdamage
      delete updateData.altdamagetype
    }

    // If a Talent has no uses it's always active
    if (item.type === 'talent') updateData.system.addtonextroll = !updateData.system?.uses?.max

    return await item.update(updateData)
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */
  static async onToggleArmorRequired() {
    await this.document.update({
      'system.consume.ammorequired': !this.document.system.consume.ammorequired,
      'system.consume.ammoitemid' : ''
   })
  }

  static async onToggleAutoDestroy() {
    await this.document.update({'system.autoDestroy': !this.document.system.autoDestroy})
  }

  static async onToggleShield() {
    await this.document.update({'system.isShield': !this.document.system.isShield})
  }

  static async onManageEffect(event) {
    const a = event.target.closest('a')
    const li = event.target.closest('li')

    switch (a.dataset.action) {
      case 'createEffect': return onCreateEffect(li, this.document)
      case 'editEffect': return onEditEffect(li, this.document)
      case 'deleteEffect': return onDeleteEffect(li, this.document)
      case 'toggleEffect': return onToggleEffect(li, this.document)
    }    
  }

  static async onEditDamage(event) {
    event.preventDefault()
    const a = event.target.closest('a')
    const damageTypes = this.document.system.action.damagetypes
    const updKey = `system.action.damagetypes`

    if (a.dataset.action === 'createDamage') damageTypes.push(new DamageType())
    else if (a.dataset.action === 'deleteDamage') damageTypes.splice(a.dataset.id, 1)
    await this.document.update({[updKey]: damageTypes}, {parent: this.actor}).then(_ => this.render())
  }

  static async onToggleInfo(event) {
    const elem = $(event.target)
    const root = elem.closest('[data-item-id]')
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
  }
  
  static async onCreateNestedItem(event) {
    const type = event.target.closest('[data-type]').dataset.type

    // Create a folder for the quick item to be stored in
    const folderLoc = event.target.closest('[data-folder-loc]').dataset.folderLoc
    const folderName = i18n("DL." + folderLoc)
    let folder = game.folders.find(f => f.name === folderName)
    if (!folder) {
      folder = await Folder.create({name:folderName, type: DemonlordItem.documentName})
    }

    const item = {
      name: `New ${type.capitalize()}`,
      type: type,
      folder: folder.id,
      system: {},
    }

    const newItem = await this.createNestedItem(item, folderName)
    newItem.sheet.render(true)
    this.render()
    return newItem
  }

  static async onEditNestedItem(event) {
    const data = await this.document
    if (!data.system.contents) {
      return
    }
    const itemId = event.target.closest('[data-item-id]').dataset.itemId
    const nestedData = data.system.contents.find(i => i._id === itemId)
    await getNestedDocument(nestedData).then(d => {
      if (d.sheet) d.sheet.render(true)
      else ui.notifications.warn('The item is not present in the game and cannot be edited.')
    })
  }

  static async onDeleteItem(event) {
    const itemIndex = event.target.closest('[data-item-index]').dataset.itemIndex
    await this.deleteContentsItem(itemIndex)
  }

  static async onToggleSpeak () {
    await this.document.update({'system.speak': !this.document.system.speak})
  }

  static async onToggleRead () {
    await this.document.update({'system.read': !this.document.system.read})
  }

  static async onToggleWrite () {
    await this.document.update({'system.write': !this.document.system.write})
  }

  static async onToggleHealing () {
    await this.document.update({'system.healing.healing': !this.document.system.healing.healing})
  }

  static async onToggleAttackBonus (event) {
    const attribute = event.target.closest('div').dataset.attribute
    const property = `system.action.${attribute}boonsbanesselect`
    await this.document.update({[property]: !foundry.utils.getProperty(this.document, property) })
  }

  static async onToggleChallengeBonus (event) {
    const attribute = event.target.closest('div').dataset.attribute
    const property = `system.challenge.${attribute}boonsbanesselect`
    await this.document.update({[property]: !foundry.utils.getProperty(this.document, property) })
  }

  /**
   * Handle changing a Document's image.
   * @param {MouseEvent} event  The click event.
   * @returns {Promise}
   * @protected
   * Credit to Ethanks from the League of Extraordinary FoundryVTT Developers
   */
  static async onEditImage(event, target) {
    const attr = target.dataset.edit
    const documentData = this.document.toObject()
    const current = foundry.utils.getProperty(documentData, attr)
    const { img } = this.document.constructor.getDefaultArtwork?.(documentData) ?? {}
    const fp = new FilePicker({
        current,
        type: "image",
        redirectToRoot: img ? [img] : [],
        callback: (path) => {
            this.document.update({ [attr]: path })
        },
        top: this.position.top + 40,
        left: this.position.left + 10,
    });
    return fp.browse()
}

  /* -------------------------------------------- */
  /*  Listeners                                   */
  /* -------------------------------------------- */

  /** @override */
  async _onRender (context, options) { // eslint-disable-line no-unused-vars
    let e = this.element
    // Tooltips
    tippy(e.querySelectorAll('[data-tippy-content]'))
    tippy(e.querySelectorAll('[data-tippy-html]'), {
      content(reference) {
        return $(reference).data('tippyHtml')
      },
      allowHTML: true
    })

    // Dropdowns
    tippy(e.querySelectorAll('.dropdown-group'), {
      content(reference) {
        return buildDropdownListHover(reference.attributes.name.value, reference.attributes.value.value, context.item)
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


    // Add drag events.
    e.querySelectorAll('.drop-area, .dl-drop-zone, .dl-drop-zone *').forEach(el => {

      el.addEventListener('dragover', this._onDragOver.bind(this))
      .addEventListener('dragleave', this._onDragLeave.bind(this))
      .addEventListener('drop', this._onDrop.bind(this))
    })

    // Create nested items by dropping onto item
    this.element.addEventListener('drop', ev => this._onDropItem(ev))

    // Nested item create, edit
    //e.querySelectorAll('.create-nested-item')?.forEach(el => el.addEventListener('click', async (ev) => await this._onNestedItemCreate(ev)))
    //e.querySelectorAll('.edit-nested-item')?.forEach(el => el.addEventListener('click', async (ev) => await this._onNestedItemEdit(ev)))

    // Delete list items (active effects, contents, etc.)
    //e.querySelectorAll('.item-delete')?.forEach(el => el.addEventListener('click', async ev => await this._onContentsItemDelete(ev)))

    // Max castings
    e.querySelector('.max-castings-control')?.addEventListener('change', async ev => await this._onManageMaxCastings(ev, this))
    e.querySelector('.item-group-spell-castings')?.addEventListener('contextmenu', async ev => await this._onToggleMaxCastingsCalculation(ev, this))

    // Contents item quantity and delete functions
    e.querySelectorAll('.item-uses')?.forEach(el => el.addEventListener('mousedown', async ev => await this._onUpdateContentsItemQuantity(ev)))

    if (this.document.parent?.isOwner) {
      const dragHandler = async ev => await this._onDrag(ev)
      e.querySelectorAll('.dl-nested-item').forEach(el => {
        el.setAttribute('draggable', true)
        el.addEventListener('dragstart', dragHandler, false)
        el.addEventListener('dragend', dragHandler, false)
      })
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async activateListeners(html) {
    super.activateListeners(html)

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    if (this.isEditable) {
      const inputs = html.find('input')
      inputs.focus(ev => ev.currentTarget.select())
    }
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
        label: 'DL.Tabs',
      }

      if (DLBaseItemSheetV2.PARTS_MAP[partId]) {
        tab.id = partId
        tab.label += 'Attributes'
      } else if (['description', 'effects'].includes(partId)) {
        tab.id = partId,
        tab.label += capitalize(partId)
      } else {
        continue
      }

      tab.active = this.tabGroups[tab.group] === tab.id
      tab.cssClass = tab.active ? 'active': ''

      tabs[partId] = tab
    }

    return tabs
  }

  _prepareDamageTypes(sheetData) {
    sheetData.item.damagetypes = this.item.system.action?.damagetypes
  }

  async _onManageDamageType(ev, options = {}) {
    ev.preventDefault()
    const a = ev.currentTarget
    const damageTypes = this.object.system.action.damagetypes
    const updKey = `system.action.damagetypes`

    if (a.dataset.action === 'create') damageTypes.push(new DamageType())
    else if (a.dataset.action === 'delete') damageTypes.splice(a.dataset.id, 1)
    await this.object.update({[updKey]: damageTypes}, {...options, parent: this.actor}).then(_ => this.render())
  }

  async _onManageMaxCastings (ev, sheet) {
    // Set the flag if textbox has been modified. Clear if blank.
    const target = ev.currentTarget
    const spell = sheet.document
    await spell.update({
      system: {
        castings: {
          max: target.value
        }
      }
    })
  }
  
  async _onToggleMaxCastingsCalculation (ev, sheet) {
    // Set the flag if textbox has been modified. Clear if blank.
    const spell = sheet.document
    await spell.update({
      system: {
        castings: {
          ignoreCalculation: !spell.system.castings.ignoreCalculation
        }
      }
    })
  }

  /* -------------------------------------------- */

  async _onDrag(ev){
    const itemIndex = ev.currentTarget.closest('[data-item-index]').dataset.itemIndex
    const data = await this.getData({})
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

  _onDragOver(ev) {
    $(ev.originalEvent.target).addClass('drop-hover')
  }

  _onDragLeave(ev) {
    $(ev.originalEvent.target).removeClass('drop-hover')
  }

  _onDrop(ev) {
    $(ev.originalEvent.target).removeClass('drop-hover')
  }

  async _onDropItem(ev) {
    if (this.item.system?.contents != undefined){
      try {
        const itemData = JSON.parse(ev.dataTransfer.getData('text/plain'))
        if (itemData.type === 'Item') {
          let actor
          const item = await fromUuid(itemData.uuid)
          
          let acceptedItemTypes = []

          // Filter drops depending on the item type
          switch (this.item.type) {
            case 'item': 
              acceptedItemTypes = ['ammo', 'armor', 'item', 'weapon']
              break
            case 'relic':
              acceptedItemTypes = ['talent']
              break
            default:
              acceptedItemTypes = []
              break
          }

          if (!item && !acceptedItemTypes.includes(item.type)) return

          const itemUpdate = {'_id': item._id}
          if (itemData.uuid.startsWith('Actor.')) {
            actor = item.parent
            /*Since item contents aren't actually embedded we don't want to end up with a reference
            to a non-existant item. If our item exists outside of the actor-embedded version, use that as our source.
            Otherwise, create it as a world-level item and update the original's core.sourceId flag accordingly.*/
            if (item.flags?.core?.sourceId != undefined) {
              game.items.getName(item.name) ? itemData.uuid = game.items.getName(item.name).uuid : itemData.uuid = item.flags.core.sourceId
            } else {
              const newItem = await this.createNestedItem(foundry.utils.duplicate(item), `${actor.name}'s Items (${this.item.name})`)
              itemUpdate['flags.core.sourceId'] = newItem.uuid;
              itemData.uuid = newItem.uuid
            }
          }
          if (itemUpdate?.flags?.core?.sourceId == undefined) itemUpdate['flags.core.sourceId'] = itemData.uuid

          //If the item we're adding is the same as the container, bail now
          if (this.item.sameItem(item)) {
            ui.notifications.warn("Can't put an item inside itself!")
            return
          }

          //If the item was in an Actor's inventory, update the quantity there
          if (actor != undefined) {
            if (item.system.quantity > 0) {
              itemUpdate['system.quantity'] = item.system.quantity-1;
              await actor.updateEmbeddedDocuments('Item', [itemUpdate])
            }
          }

          await this.addContentsItem(itemData)
        }
      } catch (e) {
        console.warn(e)
      }
    }
  }

  // async _onNestedItemCreate(ev) {
  //   const type = $(ev.currentTarget).closest('[data-type]').data('type')

  //   // Create a folder for the quick item to be stored in
  //   const folderLoc = $(ev.currentTarget).closest('[data-folder-loc]').data('folderLoc')
  //   const folderName = i18n("DL." + folderLoc)
  //   let folder = game.folders.find(f => f.name === folderName)
  //   if (!folder) {
  //     folder = await Folder.create({name:folderName, type: DemonlordItem.documentName})
  //   }

  //   const item = {
  //     name: `New ${type.capitalize()}`,
  //     type: type,
  //     folder: folder.id,
  //     system: {},
  //   }

  //   const newItem = await this.createNestedItem(item, folderName)
  //   newItem.sheet.render(true)
  //   this.render()
  //   return newItem
  // }

  // eslint-disable-next-line no-unused-vars
  // async _onNestedItemEdit(ev) {
  //   const data = await this.document
  //   if (!data.system.contents) {
  //     return
  //   }
  //   const itemId = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
  //   const nestedData = data.system.contents.find(i => i._id === itemId)
  //   await getNestedDocument(nestedData).then(d => {
  //     if (d.sheet) d.sheet.render(true)
  //     else ui.notifications.warn('The item is not present in the game and cannot be edited.')
  //   })
  // }

  async _onUpdateContentsItemQuantity(ev) {
    const itemIndex = ev.currentTarget.closest('[data-item-index]').dataset.itemIndex

    if (ev.button == 0) {
      await this.increaseContentsItemQuantity(itemIndex)
    } else if (ev.button == 2) {
      await this.decreaseContentsItemQuantity(itemIndex)
    }
  }

  // async _onContentsItemDelete(ev) {
  //   const itemIndex = $(ev.currentTarget).closest('[data-item-index]').data('itemIndex')
  //   await this.deleteContentsItem(itemIndex)
  // }

  async createNestedItem(itemData, folderName) {
    let folder = game.folders.find(f => f.name === folderName)
    if (!folder) {
      folder = await Folder.create({name:folderName, type: DemonlordItem.documentName})
    }
    if (itemData?._id != undefined) delete itemData._id;
    itemData.folder = folder._id
    if (itemData?.system?.quantity != undefined) itemData.system.quantity = 1

    return await DemonlordItem.create(itemData)
  }

  async addContentsItem(data) {
    const item = await getNestedItemData(data)
    const containerData = foundry.utils.duplicate(this.item)
    containerData.system.contents.push(item)
    await this.item.update(containerData, {diff: false}).then(_ => this.render)
  }

  async increaseContentsItemQuantity(itemIndex) {
    const itemData = foundry.utils.duplicate(this.item)
    itemData.system.contents[itemIndex].system.quantity++
    await this.item.update(itemData, {diff: false}).then(_ => this.render)
  }

  async decreaseContentsItemQuantity(itemIndex) {
    const itemData = foundry.utils.duplicate(this.item)
    if (itemData.system.contents[itemIndex].system.quantity > 0) {
      itemData.system.contents[itemIndex].system.quantity--
      await this.item.update(itemData, {diff: false}).then(_ => this.render)
    } else {
      return
    }
  }

  async deleteContentsItem(itemIndex) {
    const itemData = foundry.utils.duplicate(this.item)

    itemData.system.contents.splice(itemIndex, 1)
    await this.item.update(itemData)
  }
}
