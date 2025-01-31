import {deleteActorNestedItems} from './nested-objects'
import {DemonlordActor} from '../actor/actor'
import { DLEndOfRound } from '../dialog/endofround'
import { getChatBaseData } from '../chat/base-messages'

export class DemonlordItem extends Item {
  /** @override */
  async update(updateData) {
    // Set spell uses
    if (this.type === 'spell' && this.parent) {
      const power = +this.parent.system?.characteristics.power || 0
      const rank = updateData?.system?.rank ?? +this.system.rank
      const calculatedCastings = CONFIG.DL.spellUses[power]?.[rank] ?? 0
      if (updateData.system?.castings?.ignoreCalculation === false || (updateData?.system?.castings?.ignoreCalculation === undefined && !this.system.castings.ignoreCalculation)) {
        if (updateData?.system?.castings !== undefined) {
          updateData.system.castings.max = calculatedCastings
        } else {
          updateData['system.castings.max'] = calculatedCastings
        }
      }
    }
    return await super.update(updateData)
  }

  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId)
    // Search for open path/ancestry/role sheets and re-render them. This allows the nested objects to fetch new values
    if (!['path', 'ancestry', 'creaturerole', 'relic'].includes(this.type)) {
      // eslint-disable-next-line no-prototype-builtins
      let openSheets = Object.entries(ui.windows).map(i => i[1]).filter(i => Item.prototype.isPrototypeOf(i.object))
      openSheets = openSheets.filter(s => ['path', 'ancestry', 'creaturerole', 'item', 'relic'].includes(s.object.type))
      openSheets.forEach(s => s.render())
    }

    // Refresh any open endoftheround dialogs
    if (this.type === 'endoftheround') {
      const openSheets = Object.entries(ui.windows).map(i => i[1]).filter(i => i instanceof DLEndOfRound)
      openSheets.forEach(s => s.render())
    }
  }

  /** @override */
  static async create(data, options = {}) {
    // Add default image
    if (!data?.img && game.settings.get('demonlord', 'replaceIcons')) {
      data.img = CONFIG.DL.defaultItemIcons[data.type] || 'icons/svg/item-bag.svg'
      if (data.type === 'path') {
        data.img = CONFIG.DL.defaultItemIcons.path.novice
      }
    }
    return await super.create(data, options)
  }

   /** @override */
   async _preCreate(_data, _options, _user) {
    await super._preCreate(_data, _options, _user)

    switch (_data.type) {
      case 'ancestry': 
        return await this._rollAncestryFormulae(_data)
    }
  }

  /** @override */
  async _preDelete(_options, _user) {
    await super._preDelete(_options, _user)
    // Check if item is embedded in Actor
    if (!(this?.parent instanceof DemonlordActor)) return await Promise.resolve()

    // Delete Active effects with this origin
    let aes = this.parent.effects.filter(ae => ae?.origin?.includes(this.id))
    for await (const ae of aes) {
      try {
        await ae.delete({parent: this.parent})
      } catch (e) {
        console.error(e)
      }
    }

    // Delete nested objects if ancestry, path or role
    if (['ancestry', 'path', 'creaturerole', 'relic'].includes(this.type)) await deleteActorNestedItems(this.parent, this.id, null)
    return await Promise.resolve()
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
  }

  hasDamage() {
    return Boolean(this.system.action?.damage)
  }

  hasHealing() {
    return this.system.healing?.healing ?? false
  }

  sameItem(item) {
    const sources = [this.uuid, this._id]
    if (this.flags?.core?.sourceId != undefined) sources.push(this.flags.core.sourceId)
    const itemSources = [item.uuid, item._id]
    if (item.flags?.core?.sourceId != undefined) itemSources.push(item.flags.core.sourceId)
    return (sources.some(r=> itemSources.includes(r)))
  }

  /** Item specific functions */

  async _rollAncestryFormulae(ancestry) {
    // If no system data exists, we're creating it anew, don't roll anything
    if (!ancestry.system?.levels) {
      return ancestry
    }
    // Before adding the item, roll any formulas and apply the values
    // Attributes
    let newStrength = ancestry.system.levels[0].attributes.strength?.value ?? 10
    let newAgility = ancestry.system.levels[0].attributes.agility?.value ?? 10
    let newIntellect = ancestry.system.levels[0].attributes.intellect?.value ?? 10
    let newWill = ancestry.system.levels[0].attributes.will?.value ?? 10
    let newInsanity = ancestry.system.levels[0].characteristics.insanity?.value ?? 0
    let newCorruption = ancestry.system.levels[0].characteristics.corruption?.value ?? 0

    const rolls = []

    if (ancestry.system.levels[0].attributes.strength?.formula) {
      const roll = new Roll(ancestry.system.levels[0].attributes.strength.formula)
      newStrength = (await roll.evaluate()).total
      rolls.push({property: 'strength', roll: roll })
    }
    if (ancestry.system.levels[0].attributes.agility?.formula) {
      const roll = new Roll(ancestry.system.levels[0].attributes.agility.formula)
      newAgility = (await roll.evaluate()).total
      rolls.push({property: 'agility', roll: roll })
    }
    if (ancestry.system.levels[0].attributes.intellect?.formula) {
      const roll = new Roll(ancestry.system.levels[0].attributes.intellect.formula)
      newIntellect = (await roll.evaluate()).total
      rolls.push({property: 'intellect', roll: roll })
    }
    if (ancestry.system.levels[0].attributes.will?.formula) {
      const roll = new Roll(ancestry.system.levels[0].attributes.will.formula)
      newWill = (await roll.evaluate()).total
      rolls.push({property: 'will', roll: roll })
    }

    if (ancestry.system.levels[0].characteristics.insanity?.formula) {
      const roll = new Roll(ancestry.system.levels[0].characteristics.insanity.formula)
      newInsanity = (await roll.evaluate()).total
      rolls.push({property: 'insanity', roll: roll })
    }

    if (ancestry.system.levels[0].characteristics.corruption?.formula) {
      const roll = new Roll(ancestry.system.levels[0].characteristics.corruption.formula)
      newCorruption = (await roll.evaluate()).total
      rolls.push({property: 'corruption', roll: roll })
    }

    const actor = game.user.character ?? canvas.tokens.controlled[0]?.actor

    // If we dropped it into an actor, print the roll data
    if (rolls.length > 0) {
      const templateData = {
        item: ancestry,
        rolls,
      }

      if (actor) {
        const rollMode = game.settings.get('core', 'rollMode')

        const chatData = getChatBaseData(actor, rollMode)

        const template = 'systems/demonlord/templates/chat/formulaeroll.hbs'
        renderTemplate(template, templateData).then(async content => {
          chatData.content = content
          chatData.sound = CONFIG.sounds.dice
          await ChatMessage.create(chatData)
        })
      }
    }

    const l0 = this.system.levels.find(l => l.level === '0')
    l0.attributes.strength.value = newStrength
    l0.attributes.agility.value = newAgility
    l0.attributes.intellect.value = newIntellect
    l0.attributes.will.value = newWill
    l0.characteristics.insanity.value = newInsanity
    l0.characteristics.corruption.value = newCorruption

    return await this.updateSource({
      system: {
        levels: this.system.levels
      }
    })
  }
}
