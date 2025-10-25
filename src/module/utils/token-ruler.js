/**
 * Modified version of the awesome https://github.com/moo-man/WFRP4e-FoundryVTT/pull/2435
 * Big thanks to Forien
 */

export default class TokenRulerDemonLord extends foundry.canvas.placeables.tokens.TokenRuler {
  static STYLES = {
    move: { color: 0x33bc4e, alpha: 0.5},
    run: { color: 0xf1d836, alpha: 0.5 },
    exceed: { color: 0xe72124, alpha: 0.5 },
  }

  /** @override */
  _getGridHighlightStyle(waypoint, offset) {
    const style = super._getGridHighlightStyle(waypoint, offset)
    if (!this.token.actor) return style

    const movement = this.token.actor.system.ranges[waypoint.action] || 0
    const maxMovement = typeof movement === 'object' ? movement[1] : movement

    const cost = waypoint.measurement.cost

    if (cost === 0) return this.constructor.STYLES.move
    if (maxMovement < cost) return this.constructor.STYLES.exceed

    // 2-step gradient
    let color = this.constructor.STYLES.move
    if (Array.isArray(movement) && movement[0] < cost) color = this.constructor.STYLES.run

    return foundry.utils.mergeObject(style, color)
  }

  /** @override */
  _getSegmentStyle(waypoint) {
    const scale = canvas.dimensions.uiScale
    const movement = this.token.actor.system.ranges[waypoint.action] || 0
    const maxMovement = typeof movement === 'object' ? movement[1] : movement
    const cost = waypoint.measurement.cost

    let color = this.constructor.STYLES.move.color
    if (movement[0] < cost && cost <= maxMovement) color = this.constructor.STYLES.run.color
    else if (maxMovement < cost) color = this.constructor.STYLES.exceed.color
    return { width: 4 * scale, color: color}
  }
}

export function getSpeedModifier(dataModel) {
  const itemsHeavy = dataModel.parent.items.filter(
    item =>
      Number(item.system.requirement?.minvalue) >
      dataModel.parent.getAttribute(item.system.requirement?.attribute)?.value,
  )
  if (itemsHeavy.length > 0) {
    return -2
  }
  return 0
}

export function isSwimPenalty(dataModel) {
  if (dataModel.parent.type === 'character') {
    if (Object.prototype.hasOwnProperty.call(dataModel.parent, 'features')) {
      if (dataModel.parent.features.find(x => x.name.toLowerCase() === 'swimmer')) return false
    }

    if (Object.prototype.hasOwnProperty.call(dataModel.parent, 'talents')) {
      if (dataModel.parent.talents.find(x => x.name.toLowerCase() === 'swimmer')) return false
    }
    return true
  } else return !dataModel.speedtraits.toLowerCase().includes('swimmer')
}

export function getRanges(dataModel) {
  const baseSpeed = dataModel.parent.system.characteristics.speed + getSpeedModifier(dataModel)
  const walk = [baseSpeed, baseSpeed * 2]
  return {
    walk,
    swim: isSwimPenalty(dataModel) ? walk.map(v => v * 0.5) : walk,
    climb: walk.map(v => v * 0.5),
    crawl: walk.map(v => v * 0.5),
    fly: walk,
  }
}

export function getCanFly(dataModel) {
  if (dataModel.parent.type === 'character') {
    if (Object.prototype.hasOwnProperty.call(dataModel.parent, 'features')) {
      if (dataModel.parent.features.find(x => x.name.toLowerCase() === 'flutter' || x.name.toLowerCase() === 'flier'))
        return true
    }
    if (Object.prototype.hasOwnProperty.call(dataModel.parent, 'talents')) {
      if (dataModel.parent.talents.find(x => x.name.toLowerCase() === 'flight')) return true
    }
    return false
  } else return dataModel.speedtraits.toLowerCase().includes('flier')
}
