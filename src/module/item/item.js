import { getAncestryItemsToDel, getPathItemsToDel } from './nested-objects'
import { DemonlordActor } from '../actor/actor'

export class DemonlordItem extends Item {
  /** @override */
  async update(updateData) {
    // Set spell uses
    if (this.type === 'spell' && this.parent) {
      const power = +this.parent.data?.data?.characteristics.power || 0
      const rank = updateData?.data?.rank ?? +this.data.data.rank
      updateData['data.castings.max'] = CONFIG.DL.spelluses[power]?.[rank] ?? updateData?.data?.castings?.max ?? 0
    }
    return super.update(updateData)
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
    return super.create(data, options)
  }

  /** @override */
  async _preDelete(_options, _user) {
    await super._preDelete(_options, _user)
    // Check if item is embedded in Actor
    if (!(this?.parent instanceof DemonlordActor)) return Promise.resolve()

    // Delete Active effects with this origin
    let aes = this.parent.effects.filter(ae => ae.data?.origin?.includes(this.id))
    for (const ae of aes) {
      try {
        await ae.delete({ parent: this.parent })
      } catch (e) {
        console.error(e)
      }
    }

    // Delete nested objects if ancestry or path
    let nestedIds = []
    if (this.type === 'ancestry') nestedIds = getAncestryItemsToDel(this.parent, this.data.data)
    if (this.type === 'path') nestedIds = getPathItemsToDel(this.parent, this.data.data.levels)
    if (nestedIds.length > 0) {
      console.log(`DEMONLORD | Deleting ${nestedIds.length} nested objects`)
      await this.parent.deleteEmbeddedDocuments('Item', nestedIds)
    }

    return Promise.resolve()
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {}

  hasDamage() {
    return Boolean(this.data.data?.action?.damage || this.data.data?.vs?.damage)
  }

  hasHealing() {
    return this.data.data?.healing?.healing ?? false
  }
}
