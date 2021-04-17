import { DLActorModifiers } from '../../dialog/actor-modifiers.js'
import { CharacterBuff } from '../../buff.js'
export class DemonlordActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['demonlord', 'sheet', 'actor'],
      template: 'systems/demonlord08/templates/actor/actor-sheet.html',
      width: 610,
      height: 700,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'combat'
        }
      ]
    })
  }

  /**
   * Extend and override the sheet header buttons
   * @override
   */
  _getHeaderButtons () {
    let buttons = super._getHeaderButtons()
    const canConfigure = game.user.isGM || this.actor.isOwner
    if (this.options.editable && canConfigure) {
      buttons = [
        {
          label: game.i18n.localize('DL.ActorMods'),
          class: 'configure-actor',
          icon: 'fas fa-dice',
          onclick: (ev) => this._onConfigureActor(ev)
        }
      ].concat(buttons)
    }
    return buttons
  }
  /* -------------------------------------------- */

  _onConfigureActor (event) {
    event.preventDefault()
    new DLActorModifiers(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2
    }).render(true)
  }

  async _updateObject (event, formData) {
    const actor = this.object
    const updateData = expandObject(formData)

    await Actor.updateDocuments(updateData)
  }

  /** @override */
  getData () {
    const data = super.getData()
    data.dtypes = ['String', 'Number', 'Boolean']
    for (const attr of Object.values(data.data.attributes)) {
      attr.isCheckbox = attr.dtype === 'Boolean'
    }

    // Prepare items.
    if (this.actor.data.type == 'character') {
      this._prepareCharacterItems(data)
    }

    return data
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems (sheetData) {
    const actorData = sheetData.actor

    // Initialize containers.
    const gear = []
    const features = []
    const spells = []
    const weapons = []
    const armor = []
    const ammo = []
    const talents = []
    const mods = []
    const ancestry = []
    const spellbook = {}
    const talentbook = {}

    // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (const i of sheetData.items) {
      const item = i.data
      i.img = i.img || DEFAULT_TOKEN

      if (i.type === 'item') {
        gear.push(i)
      } else if (i.type === 'feature') {
        features.push(i)
      } else if (i.type === 'spell') {
        spells.push(i)
      } else if (i.type === 'weapon') {
        weapons.push(i)
      } else if (i.type === 'armor') {
        armor.push(i)
      } else if (i.type === 'ammo') {
        ammo.push(i)
      } else if (i.type === 'talent') {
        talents.push(i)
      } else if (i.type === 'mod') {
        mods.push(i)
      } else if (i.type === 'ancestry') {
        ancestry.push(i)
      }
    }

    // Assign and return
    actorData.gear = gear
    actorData.features = features
    actorData.spells = spells
    actorData.weapons = weapons
    actorData.armor = armor
    actorData.ammo = ammo
    actorData.talents = talents
    actorData.mods = mods
    actorData.ancestry = ancestry

    if (ancestry.length == 0) {
      const itemData = {
        name: 'Ancestry',
        type: 'ancestry',
        data: null
      }

      ancestry.push(Item.create(itemData, {parent: this.actor}))
    } else if (ancestry.length > 1) {
      this.actor.deleteEmbeddedDocuments('Item', [ancestry[0].id])
      this.actor.render(false)
    }

    actorData.spellbook = this._prepareSpellBook(actorData)
    actorData.talentbook = this._prepareTalentBook(actorData)
  }

  /* -------------------------------------------- */
  _prepareSpellBook (actorData) {
    const spellbook = {}
    const registerTradition = (i, label) => {
      spellbook[i] = {
        tradition: label,
        spells: []
      }
    }

    let s = 0
    const traditions = [
      ...new Set(actorData.spells.map((spell) => spell.data.tradition))
    ]
    traditions.sort().forEach((tradition) => {
      if (tradition != undefined) {
        registerTradition(s, tradition)

        actorData.spells.forEach((spell) => {
          if (spell.data.tradition == tradition) {
            spellbook[s].spells.push(spell)
          }
        })
        s++
      }
    })

    return spellbook
  }

  _prepareTalentBook (actorData) {
    const talentbook = {}
    const registerTalentGroup = (i, label) => {
      talentbook[i] = {
        groupname: label,
        talents: []
      }
    }

    let s = 0
    const talentgroup = [
      ...new Set(actorData.talents.map((talent) => talent.data.groupname))
    ]
    talentgroup.sort().forEach((groupname) => {
      if (groupname != undefined) {
        registerTalentGroup(s, groupname)

        actorData.talents.forEach((talent) => {
          if (talent.data.groupname == groupname) {
            talentbook[s].talents.push(talent)
          }
        })
        s++
      }
    })

    return talentbook
  }

  /** @override */
  activateListeners (html) {
    super.activateListeners(html)

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    if (this.isEditable) {
      const inputs = html.find('input')
      inputs.focus((ev) => ev.currentTarget.select())
    }

    // Toggle Accordion
    html.find('.toggleAccordion').click((ev) => {
      const div = ev.currentTarget
      if (div.nextElementSibling.style.display === 'none') {
        div.nextElementSibling.style.display = 'block'
        div.className = 'toggleAccordion change'
      } else {
        div.nextElementSibling.style.display = 'none'
        div.className = 'toggleAccordion'
      }
    })

    // Toggle Spell Info
    html.find('.toggleInfo').click((ev) => {
      const div = ev.currentTarget
      const parent = div.parentElement
      if (parent.children[6].style.display === 'none') {
        parent.children[6].style.display = 'block'
      } else {
        parent.children[6].style.display = 'none'
      }
    })

    // Toggle Spell Info
    html.find('.toggleTalentInfo').click((ev) => {
      const div = ev.currentTarget
      const parent = div.parentElement
      if (parent.children[4].style.display === 'none') {
        parent.children[4].style.display = 'block'
      } else {
        parent.children[4].style.display = 'none'
      }
    })

    // Toggle Item Info
    html.find('.toggleItemInfo').click((ev) => {
      const div = ev.currentTarget
      const parent = div.parentElement
      if (parent.children[3].style.display === 'none') {
        parent.children[3].style.display = 'block'
      } else {
        parent.children[3].style.display = 'none'
      }
    })

    // Edit Creature
    html.find('.creature-edit').click((ev) => {
      const actor = this.actor
      const showEdit = actor.data.data.edit
      if (showEdit) {
        actor.data.data.edit = false
      } else {
        actor.data.data.edit = true
      }

      this.setEditCreatureMode(actor)
    })

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this))

    // Update Inventory Item
    html.find('.item-edit').click((ev) => {
      const li = $(ev.currentTarget).parents('.item')
      const item = this.actor.getEmbeddedDocument('Item', li.data('itemId'))
      item.sheet.render(true)
    })

    // Delete Inventory Item
    html.find('.item-delete').click((ev) => {
      const li = $(ev.currentTarget).parents('.item')

      this.showDeleteDialog(
        game.i18n.localize('DL.DialogAreYouSure'),
        game.i18n.localize('DL.DialogDeleteItemText'),
        li
      )
    })

    // CLone Inventory Item
    html.find('.item-clone').click((ev) => {
      const li = $(ev.currentTarget).parents('.item')
      const item = duplicate(
        this.actor.items.get(li.data('itemId'))
      )

      Item.create(item, {parent: this.actor})
    })

    // Update Inventory Item
    html.find('.item-wear').click((ev) => {
      const li = $(ev.currentTarget).parents('.item')
      const item = duplicate(
        this.actor.items.get(li.data('itemId'))
      )

      item.data.wear = false
      this.actor.updateEmbeddedDocument('Item', item.data)
    })
    html.find('.item-wearoff').click((ev) => {
      const li = $(ev.currentTarget).parents('.item')
      const item = duplicate(
        this.actor.items.get(li.data('itemId'))
      )

      item.data.wear = true
      this.actor.updateEmbeddedDocument('Item', item.data)
    })

    // Update Feature Item
    html.find('.feature-edit').click((ev) => {
      const li = $(ev.currentTarget).parents('.feature')
      const item = this.actor.getEmbeddedDocument('Item', li.data('itemId'))
      item.sheet.render(true)
    })

    // Delete Feature Item
    html.find('.feature-delete').click((ev) => {
      const li = $(ev.currentTarget).parents('.feature')

      this.showDeleteDialog(
        game.i18n.localize('DL.DialogAreYouSure'),
        game.i18n.localize('DL.DialogDeleteFeatureText'),
        li
      )
    })

    // Wealth
    html.find('.wealth-edit').click((ev) => {
      const actor = this.actor

      const showEdit = actor.data.data.wealth.edit
      if (showEdit) {
        actor.data.data.wealth.edit = false
      } else {
        actor.data.data.wealth.edit = true
      }

      const that = this
      actor
        .update({
          'data.wealth.edit': actor.data.data.wealth.edit
        })
        .then((item) => {
          that.render()
        })
    })

    // Paths
    html.find('.paths-edit').click((ev) => {
      const actor = this.actor

      const showEdit = actor.data.data.paths.edit
      if (showEdit) {
        actor.data.data.paths.edit = false
      } else {
        actor.data.data.paths.edit = true
      }

      const that = this
      actor
        .update({
          'data.paths.edit': actor.data.data.paths.edit
        })
        .then((item) => {
          that.render()
        })
    })

    // Profession
    html.find('.profession-edit').click((ev) => {
      const actor = this.actor

      const showEdit = actor.data.data.professions.edit
      if (showEdit) {
        actor.data.data.professions.edit = false
      } else {
        actor.data.data.professions.edit = true
      }

      const that = this
      actor
        .update({
          'data.professions.edit': actor.data.data.professions.edit
        })
        .then((item) => {
          that.render()
        })
    })

    // Religion
    html.find('.religion-edit').click((ev) => {
      const actor = this.actor

      const showEdit = actor.data.data.religion.edit
      if (showEdit) {
        actor.data.data.religion.edit = false
      } else {
        actor.data.data.religion.edit = true
      }

      const that = this
      actor
        .update({
          'data.religion.edit': actor.data.data.religion.edit
        })
        .then((item) => {
          that.render()
        })
    })

    // Languages
    html.find('.languages-edit').click((ev) => {
      const actor = this.actor

      const showEdit = actor.data.data.languages.edit
      if (showEdit) {
        actor.data.data.languages.edit = false
      } else {
        actor.data.data.languages.edit = true
      }

      const that = this
      actor
        .update({
          'data.languages.edit': actor.data.data.languages.edit
        })
        .then((item) => {
          that.render()
        })
    })

    // Add Spell Item
    html.find('.spell-create').click(this._onSpellCreate.bind(this))

    html.find('.spell-edit').click((ev) => {
      const liSpell = $(ev.currentTarget).parents('.item')
      const item = this.actor.get(liSpell.data('itemId'))

      item.sheet.render(true)
    })

    html.find('.spell-delete').click((ev) => {
      const li = $(ev.currentTarget).parents('.item')

      this.showDeleteDialog(
        game.i18n.localize('DL.DialogAreYouSure'),
        game.i18n.localize('DL.DialogDeleteSpellText'),
        li
      )
    })

    // Rollable
    html.find('.rollable').click(this._onRoll.bind(this))

    // Attibute Checks
    html.find('.ability-name').click((ev) => {
      const abl = ev.currentTarget.parentElement.getAttribute('data-ability')
      this.actor.rollAbility(abl)
    })

    html.find('.ammo-amount').click((ev) => {
      const li = event.currentTarget.closest('.item')
      const item = duplicate(
        this.actor.items.get(li.dataset.itemId)
      )
      const amount = item.data.quantity

      if (amount > 0) {
        item.data.quantity = Number(amount) - 1
      }

      this.actor.updateEmbeddedDocument('Item', item.data)
    })

    html.find('.talent-uses').click((ev) => {
      const li = event.currentTarget.closest('.item')
      const item = duplicate(
        this.actor.items.get(li.dataset.itemId)
      )
      const uses = item.data.uses.value
      const usesmax = item.data.uses.max

      if (uses == 0 && usesmax == 0) {
        item.data.addtonextroll = true
      } else if (uses < usesmax) {
        item.data.uses.value = Number(uses) + 1
        item.data.addtonextroll = true
      } else {
        item.data.uses.value = 0
        item.data.addtonextroll = false
        this.actor.removeCharacterBonuses(item)
      }

      this.actor.updateEmbeddedDocument('Item', item.data)
    })

    html.find('.spell-uses').click((ev) => {
      const li = event.currentTarget.closest('.item')
      const item = duplicate(
        this.actor.items.get(li.dataset.itemId)
      )
      const uses = item.data.castings.value
      const usesmax = item.data.castings.max

      if (uses < usesmax) {
        item.data.castings.value = Number(uses) + 1
      } else {
        item.data.castings.value = 0
      }

      this.actor.updateEmbeddedDocument('Item', item.data)
    })

    // Rollable Attributes
    html.find('.attribute-roll').click((ev) => {
      const div = $(ev.currentTarget)
      const attributeName = div.data('key')
      const attribute = this.actor.data.data.attributes[attributeName]
      this.actor.rollChallenge(attribute)
    })

    // Rollable Attack
    html.find('.attack-roll').click((ev) => {
      const li = event.currentTarget.closest('.item')
      this.actor.rollWeaponAttack(li.dataset.itemId, { event: event })
    })

    // Rollable Talent
    html.find('.talent-roll').click((ev) => {
      const li = event.currentTarget.closest('.item')
      this.actor.rollTalent(li.dataset.itemId, { event: event })
    })

    // Rollable Attack Spell
    html.find('.magic-roll').click((ev) => {
      const li = event.currentTarget.closest('.item')
      this.actor.rollSpell(li.dataset.itemId, { event: event })
    })

    html.find('.rest-char').click((ev) => {
      // Talents
      const talents = this.actor
        .getEmbeddedCollection('')
        .filter((e) => e.type === 'talent')

      for (const talent of talents) {
        const item = duplicate(
          this.actor.items.get(talent.id)
        )
        item.data.uses.value = 0

        this.actor.updateEmbeddedDocument('Item', item.data)
      }

      // Spells
      const spells = this.actor
        .getEmbeddedCollection('Item')
        .filter((e) => e.type === 'spell')

      for (const spell of spells) {
        const item = duplicate(
          this.actor.items.get(spell._id)
        )

        item.data.castings.value = 0

        this.actor.updateEmbeddedDocument('Item', item.data)
      }
    })

    // Talent: Options
    html.find('input[type=checkbox][id^="option"]').click((ev) => {
      const div = ev.currentTarget.closest('.option')
      const field = ev.currentTarget.name
      const update = {
        _id: div.dataset.itemId,
        [field]: ev.currentTarget.checked
      }

      this.actor.updateEmbeddedDocument('Item', update)
    })

    // Drag events for macros.
    if (this.actor.isOwner) {
      const handler = (ev) => this._onDragStart(ev)
      html.find('li.dropitem').each((i, li) => {
        if (li.classList.contains('inventory-header')) return
        li.setAttribute('draggable', true)
        li.addEventListener('dragstart', handler, false)
      })
    }
  }

  async _onDropItemCreate (itemData) {
    switch (itemData.type) {
      case 'armor':
        if (this.actor.data.type === 'creature') {
          ui.notifications.error(
            game.i18n.localize('DL.DialogWarningCreatureArmor')
          )

          return
        }
        break

      default:
        break
    }
    return super._onDropItemCreate(itemData)
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate (event) {
    event.preventDefault()

    const header = event.currentTarget
    // Get the type of item to create.
    const type = header.dataset.type
    // Grab any data associated with this control.
    const data = duplicate(header.dataset)
    // Initialize a default name.
    const name = `New ${type.capitalize()}`
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    }

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data.type

    // Finally, create the item!
    return Item.create(itemData, {parent: this.actor})
  }

  _onTraditionCreate (event) {
    event.preventDefault()
    const header = event.currentTarget
    // Get the type of item to create.
    const type = header.dataset.type
    // Grab any data associated with this control.
    const data = duplicate(header.dataset)
    // Initialize a default name.
    const name = 'New Tradition'
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    }

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data.type
    return Item.create(itemData, {parent: this.actor})
  }

  _onSpellCreate (event) {
    event.preventDefault()

    const header = event.currentTarget
    // Get the type of item to create.
    const type = header.dataset.type
    // Grab any data associated with this control.
    const data = duplicate(header.dataset)
    // Initialize a default name.
    const name = `New ${type.capitalize()}`
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    }

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data.type

    return Item.create(itemData, {parent: this.actor})
  }

  deleteItem(item) {
    Item.deleteDocuments([item.data('itemId')], {parent: this.actor});
    item.slideUp(200, () => this.render(false))
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll (event) {
    event.preventDefault()
    const element = event.currentTarget
    const dataset = element.dataset

    if (dataset.roll) {
      const roll = new Roll(dataset.roll, this.actor.data.data)
      const label = dataset.label ? `Rolling ${dataset.label}` : ''
      roll.roll().toMessage({
        speaker: ChatMessage.getSpeaker({
          actor: this.actor
        }),
        flavor: label
      })
    }
  }

  showDeleteDialog (title, content, item) {
    const d = new Dialog({
      title: title,
      content: content,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogYes'),
          callback: (html) => Item.deleteDocuments(item, {parent: this.actor})
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

  async setEditCreatureMode (actor) {
    await actor
      .update({
        'data.edit': actor.data.data.edit
      })
      .then((actor) => {
        actor.render()
      })
  }
}
