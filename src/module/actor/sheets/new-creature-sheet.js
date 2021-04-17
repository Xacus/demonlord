import { DemonlordActorSheet } from './actor-sheet.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DemonlordNewCreatureSheet extends DemonlordActorSheet {
  /** @override */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['newcreature', 'sheet', 'actor'],
      template: 'systems/demonlord08/templates/actor/new-creature-sheet.html',
      width: 742,
      height: 700,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'combat'
        }
      ],
      scrollY: ['.accordion']
    })
  }

  /* -------------------------------------------- */

  /** @override */
  getData () {
    const data = super.getData()
    data.dtypes = ['String', 'Number', 'Boolean']
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

  async setUsesOnSpells () {
    const power = this.actor.data.data.characteristics.power

    for (let rank = 0; rank <= power; rank++) {
      const spells = this.actor
        .getEmbeddedCollection('Owned')
        .filter((e) => e.type === 'spell' && parseInt(e.data.rank) === rank)
      spells.forEach((spell) => {
        spell = duplicate(spell)
        const rank = spell.data.rank
        const usesMax = CONFIG.DL.spelluses[power].split(',')[rank]

        if (spell.data.castings.value === '') {
          spell.data.castings.value = '0'
        }
        spell.data.castings.max = usesMax

        Item.updateDocuments([spell], {parent: this.actor})
      })
    }
  }
}
