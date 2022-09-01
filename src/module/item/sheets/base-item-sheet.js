import {onManageActiveEffect, prepareActiveEffectCategories} from '../../active-effects/effects'
import {DL} from '../../config'
import {DamageType} from '../nested-objects'
import tippy, {createSingleton} from "tippy.js";
import {buildDropdownList} from "../../utils/handlebars-helpers";
import 'tippy.js/animations/shift-away.css';
import {initDlEditor} from "../../utils/editor";
import {DemonlordItem} from "../item";
import {enrichHTMLUnrolled, i18n} from "../../utils/utils";

export default class DLBaseItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['demonlord', 'sheet', 'item'],
      width: 600,
      height: 650,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'attributes',
        },
      ],
      scrollY: ['.tab.paths', '.tab.active'],
    })
  }

  /** @override */
  get template() {
    const path = 'systems/demonlord/templates/item'
    return `${path}/item-${this.item.type}-sheet.html`
  }

  /** @override */
  setPosition(options = {}) {
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
  async getData(options) {
    const data = await super.getData(options)
    const itemData = data.data
    data.isGM = game.user.isGM
    data.lockAncestry = game.settings.get('demonlord', 'lockAncestry')
    data.config = DL
    data.item = itemData
    data.data = this.document.system // TODO: remove at end of migration
    data.system = this.document.system

    // Enrich the description
    data.system.enrichedDescription = await TextEditor.enrichHTML(this.actor.system.description, {async: true});
    data.system.enrichedDescriptionUnrolled = await enrichHTMLUnrolled(this.actor.system.description)

    const effControls = data.document.isEmbedded ? -1 : 3
    data.effects =
      this.document.effects.size > 0 || !data.document.isEmbedded
        ? prepareActiveEffectCategories(this.document.effects, !data.document.isEmbedded, effControls)
        : null

    if (data.item.type === 'weapon' || data.item.type === 'spell') this._prepareDamageTypes(data)
    else if (data.item.type === 'talent') this._prepareDamageTypes(data, true)

    this.sectionStates = this.sectionStates || new Map()

    return data
  }

  /* -------------------------------------------- */

  /**
   * Handles the damage types updates
   * @override */
  async _updateObject(event, formData) {
    const item = this.object
    const updateData = expandObject(formData)

    if (['talent', 'weapon', 'spell'].includes(item.type)) {
      // Set the update key based on type
      const damageKey = item.type === 'talent' ? 'system.vs.damagetypes' : 'system.action.damagetypes'
      // Grab damages from form
      let altdamage = updateData.altdamage || updateData.altdamagevs
      let altdamagetype = updateData.altdamagetype || updateData.altdamagetypevs
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
    if (item.type === 'talent') updateData['data.addtonextroll'] = !updateData.data?.uses?.max
    // Bug fix for custom editor
    if (updateData.system?.description === '' && event.type !== 'mcesave') delete updateData.system.description

    return this.object.update(updateData)
  }

  /* -------------------------------------------- */
  /*  Listeners                                   */

  /* -------------------------------------------- */

  // eslint-disable-next-line no-unused-vars
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
    const iconToolTips = tippy('[data-tippy-content]')
    tippy('[data-tippy-html]', {
      content(reference) {
        return $(reference).data('tippyHtml')
      },
      allowHTML: true
    })
    createSingleton(iconToolTips, {delay: 50})
    tippy('.dl-new-project-2.dropdown', {
      content(reference) {
        html = buildDropdownList(reference.attributes.name.value, reference.attributes.value.value)
        return html
      },
      allowHTML: true,
      interactive: true,
      // trigger: 'click',
      placement: 'bottom',
      arrow: false,
      offset: [0, 0],
      theme: 'demonlord-dropdown',
      animation: 'shift-away',
    })
  }

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

    // Active effects edit
    html.find('.effect-control').click(ev => onManageActiveEffect(ev, this.document))

    // Damage types
    html.find('.damagetype-control').click(ev => this._onManageDamageType(ev, 'action'))
    html.find('.vsdamagetype-control').click(ev => this._onManageDamageType(ev, 'vs', {diff: false}))

    // Collapsable tables
    const collapsableContents = html.find('.collapse-content')
    const collapsableTitles = html.find('.collapse-title')

    // Sections init
    if (this.sectionStates.size === 0) {
      // If the state of the sections are not defined, set it all to true and hide the sections
      for (let i = 0; i < collapsableContents.length; i++) this.sectionStates.set(i, true)
      collapsableContents.hide()
    } else {
      // Else if the state is defined, set the visibility of the content and the class of the title
      this.sectionStates.forEach((val, key) => {
        if (val) $(collapsableContents[key]).hide()
        else $(collapsableTitles[key]).addClass('active')
      })
    }

    collapsableTitles.click(ev => {
      const title = $(ev.currentTarget)
      const content = title.next('.collapse-content')
      // Get the index of the current clicked section title
      const index = collapsableTitles
        .map((i, ct) => ct.innerText)
        .toArray()
        .indexOf(title[0].innerText)
      // Hide all contents and set their state to true (meaning hid)
      collapsableContents.slideUp()
      this.sectionStates.forEach((v, k) => this.sectionStates.set(k, true))

      if (!title.is('.active')) {
        this.sectionStates.set(index, false) // Save the state of the current section
        collapsableTitles.removeClass('active')
        title.addClass('active')
        content.slideDown()
      } else collapsableTitles.removeClass('active')
    })

    // Add drag events.
    html
      .find('.drop-area, .dl-drop-zone, .dl-drop-zone *')
      .on('dragover', this._onDragOver.bind(this))
      .on('dragleave', this._onDragLeave.bind(this))
      .on('drop', this._onDrop.bind(this))

    // Custom editor
    initDlEditor(html, this)

    // Nested item create, edit
    html.find('.create-nested-item').click((ev) => this._onNestedItemCreate(ev))
    html.find('.edit-nested-item').click((ev) => this._onNestedItemEdit(ev))

  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */

  /* -------------------------------------------- */

  _prepareDamageTypes(sheetData, isVs = false) {
    sheetData.item.damagetypes = this.item.system.action?.damagetypes
    if (isVs) sheetData.item.vsdamagetypes = this.item.system.vs?.damagetypes
  }

  _onManageDamageType(ev, actionKey, options = {}) {
    ev.preventDefault()
    const a = ev.currentTarget
    const damageTypes = this.object.system[actionKey].damagetypes
    const updKey = `data.${actionKey}.damagetypes`

    if (a.dataset.action === 'create') damageTypes.push(new DamageType())
    else if (a.dataset.action === 'delete') damageTypes.splice(a.dataset.id, 1)
    this.object.update({[updKey]: damageTypes}, {...options, parent: this.actor}).then(_ => this.render())
  }

  /* -------------------------------------------- */

  _onDragOver(ev) {
    $(ev.originalEvent.target).addClass('drop-hover')
  }

  _onDragLeave(ev) {
    $(ev.originalEvent.target).removeClass('drop-hover')
  }

  _onDrop(ev) {
    $(ev.originalEvent.target).removeClass('drop-hover')
  }

  async _onNestedItemCreate(ev) {
    const type = $(ev.currentTarget).closest('[data-type]').data('type')

    // Create a folder for the quick item to be stored in
    const folderLoc = $(ev.currentTarget).closest('[data-folder-loc]').data('folderLoc')
    const folderName = i18n("DL." + folderLoc)
    let folder = game.folders.find(f => f.name === folderName)
    if (!folder) {
      folder = await Folder.create({name:folderName, type: DemonlordItem.documentName})
    }

    const item = await DemonlordItem.create({
      name: `New ${type.capitalize()}`,
      type: type,
      folder: folder.id,
      data: {},
    })

    item.sheet.render(true)
    this.render()
    return item
  }

  // eslint-disable-next-line no-unused-vars
  _onNestedItemEdit(ev) {
  }
}
