import {deleteActorNestedItems} from './nested-objects'
import {DemonlordActor} from '../actor/actor'
import { DLEndOfRound } from '../dialog/endofround'

export class DemonlordItem extends Item {
  /** @override */
  async update(updateData) {
    // Set spell uses
    if (this.type === 'spell' && this.parent) {
      const power = +this.parent.system?.characteristics.power || 0
      const rank = updateData?.data?.rank ?? +this.system.rank
      updateData['system.castings.max'] = CONFIG.DL.spelluses[power]?.[rank] ?? updateData?.data?.castings?.max ?? 0
    }
    return await super.update(updateData)
  }

  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId)
    // Search for open path/ancestry/role sheets and re-render them. This allows the nested objects to fetch new values
    if (!['path', 'ancestry', 'creaturerole', 'item', 'relic'].includes(this.type)) {
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
}
