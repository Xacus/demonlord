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

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {}

  hasDamage() {
    return Boolean(this.data.data?.action?.damage || this.data.data?.vs?.damage)
  }
}
