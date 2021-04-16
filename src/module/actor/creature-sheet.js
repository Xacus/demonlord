import { DemonlordActorSheet } from './actor-sheet.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DemonlordCreatureSheet extends DemonlordActorSheet {
  /** @override */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['demonlord', 'sheet', 'actor', 'creature'],
      template: 'systems/demonlord/templates/actor/creature-sheet.html',
      width: 525,
      height: 550,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'combat'
        }
      ],
      scrollY: ['.creature']
    })
  }

  /* -------------------------------------------- */

  /** @override */
  getData () {
    const data = {
      isGM: game.user.isGM,
      limited: this.entity.limited,
      options: this.options,
      editable: this.isEditable,
      config: CONFIG.DL
    }

    data.actor = duplicate(this.actor.data)
    data.data = data.actor.data
    data.items = this.actor.items.map((i) => {
      i.data.labels = i.labels
      return i.data
    })
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0))

    for (const attr of Object.values(data.data.attributes)) {
      attr.isCheckbox = attr.dtype === 'Boolean'
    }

    if (this.actor.data.type == 'creature') {
      this._prepareCreatureItems(data)
    }

    return data
  }

  _prepareCreatureItems (sheetData) {
    const actorData = sheetData.actor

    const weapons = []
    const spells = []
    const features = []
    const specialactions = []
    const magic = []
    const endoftheround = []
    const talents = []

    for (const i of sheetData.items) {
      const item = i.data
      i.img = i.img || DEFAULT_TOKEN

      if (i.type === 'feature') {
        features.push(i)
      } else if (i.type === 'weapon') {
        weapons.push(i)
      } else if (i.type === 'spell') {
        spells.push(i)
      } else if (i.type === 'specialaction') {
        specialactions.push(i)
      } else if (i.type === 'magic') {
        magic.push(i)
      } else if (i.type === 'endoftheround') {
        endoftheround.push(i)
      } else if (i.type === 'talent') {
        talents.push(i)
      }
    }

    actorData.weapons = weapons
    actorData.spells = spells
    actorData.features = features
    actorData.specialactions = specialactions
    actorData.magic = magic
    actorData.endoftheround = endoftheround
    actorData.talents = talents

    actorData.spellbook = this._prepareSpellBook(actorData)
  }

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
}
