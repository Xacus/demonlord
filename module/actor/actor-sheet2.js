import { DLActorModifiers } from '../dialog/actor-modifiers.js'
import { DLCharacterGenerater } from '../dialog/actor-generator.js'
import { CharacterBuff } from '../buff.js'
export class DemonlordActorSheet2 extends ActorSheet {
  /** @override */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['demonlord2', 'sheet', 'actor'],
      width: 742,
      height: 700,
      tabs: [
        {
          navSelector: '.sheet-navigation',
          contentSelector: '.sheet-body',
          initial: 'character'
        }
      ],
      scrollY: ['.tab.active']
    })
  }

  /** @override */
  get template () {
    if (!game.user.isGM && this.actor.limited) {
      return 'systems/demonlord/templates/actor/limited-sheet.html'
    }
    return 'systems/demonlord/templates/actor/actor-sheet2.html'
  }

  /**
   * Extend and override the sheet header buttons
   * @override
   */
  _getHeaderButtons () {
    let buttons = super._getHeaderButtons()
    const canConfigure = game.user.isGM || this.actor.owner
    if (this.options.editable && canConfigure) {
      buttons = [
        /* {
          label: game.i18n.localize('DL.CharacterGenerator'),
          class: 'generate-actor',
          icon: 'fas fa-user',
          onclick: (ev) => this._onGenerateActor(ev)
        }, */
        {
          label: 'Actor Mods',
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

  _onGenerateActor (event) {
    event.preventDefault()
    new DLCharacterGenerater(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2
    }).render(true)
  }

  async _updateObject (event, formData) {
    const actor = this.object
    const updateData = expandObject(formData)

    await actor.update(updateData, {
      diff: false
    })
  }

  /** @override */
  getData () {
    const data = super.getData()
    data.isGM = game.user.isGM
    data.useDemonlordMode = !game.settings.get('demonlord', 'useHomebrewMode')
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
    const professions = []
    const pathNovice = []
    const pathExpert = []
    const pathMaster = []

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
      } else if (i.type === 'profession') {
        professions.push(i)
      } else if (i.type === 'path') {
        switch (i.data.type) {
          case 'novice':
            pathNovice.push(i)
            break
          case 'expert':
            pathExpert.push(i)
            break
          case 'master':
            pathMaster.push(i)
            break
          default:
            break
        }
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
    actorData.professions = professions
    actorData.pathNovice = pathNovice
    actorData.pathExpert = pathExpert
    actorData.pathMaster = pathMaster

    actorData.spellbook = this._prepareSpellBook(actorData)
    actorData.talentbook = this._prepareTalentBook(actorData)
  }

  /** @override */
  async _onDrop (event) {
    // Try to extract the data
    let data
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'))
    } catch (err) {
      return false
    }
    const actor = this.actor

    // Handle the drop with a Hooked function
    const allowed = Hooks.call('dropActorSheetData', actor, this, data)
    if (allowed === false) return

    // Handle different data types
    switch (data.type) {
      case 'Item':
        const item = game.items.get(data.id)
        if (item != null && item.data?.type === 'path') {
          const paths = this.actor
            .getEmbeddedCollection('OwnedItem')
            .filter(
              (e) => e.type === 'path' && item.data.data.type === e.data.type
            )
          if (paths.length > 0) {
            this.actor.deleteEmbeddedEntity('OwnedItem', paths[0]._id)
          }
        } else if (item != null && item.data.type === 'ancestry') {
          const ancestries = this.actor
            .getEmbeddedCollection('OwnedItem')
            .filter((e) => e.type === 'ancestry')
          ancestries.forEach((ancestry) => {
            this.actor.deleteEmbeddedEntity('OwnedItem', ancestry._id)
          })
        }

        return this._onDropItem(event, data)
      case 'Actor':
        return this._onDropActor(event, data)
    }
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
    const talentgroups = [
      ...new Set(actorData.talents.map((talent) => talent.data.groupname))
    ]
    talentgroups.sort().forEach((groupname) => {
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

    // Edit HealthBar, Insanity and Corruption
    html.find('.bar-edit').click((ev) => {
      const actor = this.actor

      const showEdit = actor.data.data.characteristics.editbar
      if (showEdit) {
        actor.data.data.characteristics.editbar = false
      } else {
        actor.data.data.characteristics.editbar = true
      }

      const that = this
      actor
        .update({
          'data.characteristics.editbar':
            actor.data.data.characteristics.editbar
        })
        .then((item) => {
          that.render()
        })
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

    const healthbar = html.find('.healthbar-fill')
    if (healthbar.length > 0) {
      healthbar[0].style.width =
        Math.floor(
          (parseInt(this.actor.data.data.characteristics.health.value) /
            parseInt(this.actor.data.data.characteristics.health.max)) *
            100
        ) + '%'
    }

    html.on('mousedown', '.addDamage', (ev) => {
      let value = parseInt(this.actor.data.data.characteristics.health.value)
      const max = parseInt(this.actor.data.data.characteristics.health.max)

      if (event.button == 0) {
        if (game.settings.get('demonlord', 'reverseDamage')) {
          if (value <= 0) value = max
          else value--
        } else {
          if (value >= max) value = 0
          else value++
        }
      } else if (event.button == 2) {
        if (game.settings.get('demonlord', 'reverseDamage')) {
          if (value <= 0 || value >= max) value = max
          else value++
        } else {
          if (value <= 0) value = 0
          else value--
        }
      }

      const that = this
      this.actor
        .update({
          'data.characteristics.health.value': value
        })
        .then((item) => {
          that.render()
        })
    })

    const insanitybar = html.find('.insanity-fill')
    if (insanitybar.length > 0) {
      insanitybar[0].style.width =
        Math.floor(
          (parseInt(this.actor.data.data.characteristics.insanity.value) /
            parseInt(this.actor.data.data.characteristics.insanity.max)) *
            100
        ) + '%'
    }

    html.on('mousedown', '.addInsanity', (ev) => {
      let value = parseInt(this.actor.data.data.characteristics.insanity.value)
      const max = parseInt(this.actor.data.data.characteristics.insanity.max)

      if (ev.button == 0) {
        if (value >= max) value = 0
        else value++
      } else if (ev.button == 2) {
        if (value <= 0) value = 0
        else value--
      }

      const that = this
      this.actor
        .update({
          'data.characteristics.insanity.value': value
        })
        .then((item) => {
          that.render()
        })
    })

    const corruptionbar = html.find('.corruption-fill')
    if (corruptionbar.length > 0) {
      corruptionbar[0].style.width =
        Math.floor(
          (parseInt(this.actor.data.data.characteristics.corruption) /
            parseInt(20)) *
            100
        ) + '%'
    }

    html.on('mousedown', '.addCorruption', (ev) => {
      let value = parseInt(this.actor.data.data.characteristics.corruption)
      const max = parseInt(20)

      if (ev.button == 0) {
        if (value >= max) value = 0
        else value++
      } else if (ev.button == 2) {
        if (value <= 0) value = 0
        else value--
      }

      const that = this
      this.actor
        .update({
          'data.characteristics.corruption': value
        })
        .then((item) => {
          that.render()
        })
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

      const that = this
      actor
        .update({
          'data.edit': actor.data.data.edit
        })
        .then((item) => {
          that.render()
        })
    })

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this))

    // Update Inventory Item
    html.find('.item-edit').click((ev) => {
      const li = $(ev.currentTarget).parents('.item')
      const item = this.actor.getOwnedItem(li.data('itemId'))

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

    // Update Inventory Item
    html.find('.item-wear').click((ev) => {
      const li = $(ev.currentTarget).parents('.item')
      const item = duplicate(
        this.actor.getEmbeddedEntity('OwnedItem', li.data('itemId'))
      )

      item.data.wear = false
      this.actor.updateEmbeddedEntity('OwnedItem', item)
    })
    html.find('.item-wearoff').click((ev) => {
      const li = $(ev.currentTarget).parents('.item')
      const item = duplicate(
        this.actor.getEmbeddedEntity('OwnedItem', li.data('itemId'))
      )
      item.data.wear = true
      this.actor.updateEmbeddedEntity('OwnedItem', item)
    })

    html.find('.wearitem').each((i, el) => {
      const itemId = el.getAttribute('data-item-id')
      const item = this.actor.getEmbeddedEntity('OwnedItem', itemId)

      if (item.data.wear) {
        if (
          item.data.strengthmin != '' &&
          parseInt(item.data.strengthmin) >
            parseInt(this.actor.data.data.attributes.strength.value)
        ) {
          const controls = el.getElementsByClassName('item-control')
          controls[0].className += ' itemred'
        }
      }
    })

    // Update Feature Item
    html.find('.feature-edit').click((ev) => {
      const actor = this.actor

      const showEdit = actor.data.data.features.edit
      if (showEdit) {
        actor.data.data.features.edit = false
      } else {
        actor.data.data.features.edit = true
      }

      const that = this
      actor
        .update({
          'data.features.edit': actor.data.data.features.edit
        })
        .then((item) => {
          that.render()
        })
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

    html.find('.editfeature').change((ev) => {
      const id = $(ev.currentTarget).attr('data-item-id')
      const namevalue = ev.currentTarget.children[1].value
      const descriptionvalue = ev.currentTarget.children[2].value

      const item = this.actor.getOwnedItem(id)
      item.update({
        name: namevalue,
        'data.description': descriptionvalue
      })
    })

    // Ancestry
    html.on('mousedown', '.ancestry-edit', (ev) => {
      const div = $(ev.currentTarget).parents('.item')
      const item = this.actor.getOwnedItem(div.data('itemId'))

      if (ev.button == 0) {
        item.sheet.render(true)
      } else if (ev.button == 2) {
        this.actor.deleteEmbeddedEntity('OwnedItem', item._id)
      }
    })

    html.on('mousedown', '.ancestry-create', (ev) => {
      this.createAncestry(ev)
    })

    // Paths
    html.on('mousedown', '.path-edit', (ev) => {
      const div = $(ev.currentTarget).parents('.path')
      const item = this.actor.getOwnedItem(div.data('itemId'))

      if (ev.button == 0) {
        item.sheet.render(true)
      } else if (ev.button == 2) {
        this.actor.deleteEmbeddedEntity('OwnedItem', item._id)
      }
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

    html.find('.editprofession').change((ev) => {
      const id = $(ev.currentTarget).attr('data-item-id')
      const namevalue = ev.currentTarget.children[1].value
      const descriptionvalue = ev.currentTarget.children[2].value

      const item = this.actor.getOwnedItem(id)
      item.update({
        name: namevalue,
        'data.description': descriptionvalue
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
      const item = this.actor.getOwnedItem(liSpell.data('itemId'))

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

    html.on('mousedown', '.ammo-amount', (ev) => {
      const li = ev.currentTarget.closest('.item')
      const item = duplicate(
        this.actor.getEmbeddedEntity('OwnedItem', li.dataset.itemId)
      )
      const amount = item.data.quantity

      if (ev.button == 0) {
        if (amount >= 0) {
          item.data.quantity = Number(amount) + 1
        }
      } else if (ev.button == 2) {
        if (amount > 0) {
          item.data.quantity = Number(amount) - 1
        }
      }

      this.actor.updateEmbeddedEntity('OwnedItem', item)
    })

    html.on('mousedown', '.talent-uses', (ev) => {
      const li = ev.currentTarget.closest('.item')
      const item = duplicate(
        this.actor.getEmbeddedEntity('OwnedItem', li.dataset.itemId)
      )
      const uses = item.data.uses.value
      const usesmax = item.data.uses.max

      if (ev.button == 0) {
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
      } else if (ev.button == 2) {
        if (uses == 0 && usesmax == 0) {
          item.data.addtonextroll = true
        } else if (uses > 0 && uses <= usesmax) {
          item.data.uses.value = Number(uses) - 1
          if (Number(uses) - 1 == 0) item.data.addtonextroll = false
          else item.data.addtonextroll = true
        } else {
          item.data.uses.value = 0
          item.data.addtonextroll = false
          this.actor.removeCharacterBonuses(item)
        }
      }

      this.actor.updateEmbeddedEntity('OwnedItem', item)
    })

    // Talent Activate Manual
    html.find('.talent-activate').click((ev) => {
      const li = event.currentTarget.closest('.item')
      const item = duplicate(
        this.actor.getEmbeddedEntity('OwnedItem', li.dataset.itemId)
      )
      const uses = item.data.uses.value
      const usesmax = item.data.uses.max

      if (usesmax > 0) item.data.uses.value = 1

      item.data.addtonextroll = true
      this.actor.updateEmbeddedEntity('OwnedItem', item)
    })

    html.find('.talent-deactivate').click((ev) => {
      const li = event.currentTarget.closest('.item')
      const item = duplicate(
        this.actor.getEmbeddedEntity('OwnedItem', li.dataset.itemId)
      )

      item.data.uses.value = 0
      item.data.addtonextroll = false
      this.actor.removeCharacterBonuses(item)

      this.actor.updateEmbeddedEntity('OwnedItem', item)
    })

    html.on('mousedown', '.spell-uses', (ev) => {
      const li = ev.currentTarget.closest('.item')
      const item = duplicate(
        this.actor.getEmbeddedEntity('OwnedItem', li.dataset.itemId)
      )
      const uses = item.data.castings.value
      const usesmax = item.data.castings.max

      if (ev.button == 0) {
        if (uses < usesmax) {
          item.data.castings.value = Number(uses) + 1
        } else {
          item.data.castings.value = 0
        }
      } else if (ev.button == 2) {
        if (uses > 0 && uses <= usesmax) {
          item.data.castings.value = Number(uses) - 1
          if (Number(uses) - 1 == 0) item.data.addtonextroll = false
          else item.data.addtonextroll = true
        } else {
          item.data.castings.value = 0
        }
      }

      this.actor.updateEmbeddedEntity('OwnedItem', item)
    })

    html.on('mousedown', '.item-uses', (ev) => {
      const li = ev.currentTarget.closest('.item')
      const item = duplicate(
        this.actor.getEmbeddedEntity('OwnedItem', li.dataset.itemId)
      )

      if (ev.button == 0) {
        item.data.quantity++
      } else if (ev.button == 2) {
        if (item.data.quantity > 0) item.data.quantity--
      }

      this.actor.updateEmbeddedEntity('OwnedItem', item)
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
      this.actor.rollWeaponAttack(li.dataset.itemId, {
        event: event
      })
    })

    // Rollable Talent
    html.find('.talent-roll').click((ev) => {
      const li = event.currentTarget.closest('.item')
      this.actor.rollTalent(li.dataset.itemId, {
        event: event
      })
    })

    // Rollable Attack Spell
    html.find('.magic-roll').click((ev) => {
      const li = event.currentTarget.closest('.item')
      this.actor.rollSpell(li.dataset.itemId, {
        event: event
      })
    })

    html.find('.rest-char').click((ev) => {
      // Talents
      const talents = this.actor
        .getEmbeddedCollection('OwnedItem')
        .filter((e) => e.type === 'talent')

      for (const talent of talents) {
        const item = duplicate(
          this.actor.getEmbeddedEntity('OwnedItem', talent._id)
        )
        item.data.uses.value = 0

        this.actor.updateEmbeddedEntity('OwnedItem', item)
      }

      // Spells
      const spells = this.actor
        .getEmbeddedCollection('OwnedItem')
        .filter((e) => e.type === 'spell')

      for (const spell of spells) {
        const item = duplicate(
          this.actor.getEmbeddedEntity('OwnedItem', spell._id)
        )

        item.data.castings.value = 0

        this.actor.updateEmbeddedEntity('OwnedItem', item)
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

      this.actor.updateEmbeddedEntity('OwnedItem', update)
    })

    // Drag events for macros.
    if (this.actor.owner) {
      const handler = (ev) => this._onDragStart(ev)

      html.find('li.dropitem').each((i, li) => {
        if (li.classList.contains('inventory-header')) return
        li.setAttribute('draggable', true)
        li.addEventListener('dragstart', handler, false)
      })
    }
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
    return this.actor.createOwnedItem(itemData)
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
    return this.actor.createOwnedItem(itemData)
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

    return this.actor.createOwnedItem(itemData)
  }

  deleteItem (item) {
    this.actor.deleteOwnedItem(item.data('itemId'))
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
          callback: (html) => this.deleteItem(item)
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

  async createAncestry (ev) {
    const data = { name: 'New ancestry', type: 'ancestry' }
    const item = await this.actor.createEmbeddedEntity('OwnedItem', data)
  }
}
