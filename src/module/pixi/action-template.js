import { DL } from '../config.js'
import { TokenManager } from './token-manager'

const tokenManager = new TokenManager()

/**
 * A helper class for building MeasuredTemplates for 5e spells and abilities
 * @extends {MeasuredTemplate}
 */
export class ActionTemplate extends MeasuredTemplate {
  static fromItem(item) {
    const target = getProperty(item.data, 'data.activatedEffect.target') || {}
    const templateShape = DL.actionAreaShape[target.type]
    if (!templateShape) return null

    // Prepare template data
    const templateData = {
      t: templateShape,
      user: game.user._id,
      distance: target.value,
      direction: 0,
      x: 0,
      y: 0,
      fillColor: game.user.color,
      texture: item.data.data.activatedEffect.texture,
      flags: {
        actionTemplate: true,
      },
    }

    // Additional type-specific data
    switch (templateShape) {
      case 'cone':
        templateData.angle = CONFIG.MeasuredTemplate.defaults.angle
        break
      case 'rect': // 5e rectangular AoEs are always cubes
        templateData.distance = Math.hypot(target.value, target.value)
        templateData.width = target.value
        templateData.direction = 45
        break
      case 'ray': // 5e rays are most commonly 1 square (5 ft) in width
        templateData.width = target.width ?? canvas.dimensions.distance
        break
      default:
        break
    }

    // Return the template constructed from the item data
    const cls = CONFIG.MeasuredTemplate.documentClass
    const template = new cls(templateData, { parent: canvas.scene })
    const object = new this(template)
    object.item = item
    object.actorSheet = item.actor?.sheet || null
    return object
  }

  /* -------------------------------------------- */

  /**
   * Creates a preview of the spell template
   */
  drawPreview() {
    const initialLayer = canvas.activeLayer

    // Draw the template and switch to the template layer
    this.draw()
    this.layer.activate()
    this.layer.preview.addChild(this)

    // Hide the sheet that originated the preview
    if (this.actorSheet) this.actorSheet.minimize()

    // Activate interactivity
    this.activatePreviewListeners(initialLayer)
  }

  /* -------------------------------------------- */

  /**
   * Activate listeners for the template preview
   * @param {CanvasLayer} initialLayer  The initially active CanvasLayer to re-activate after the workflow is complete
   */
  activatePreviewListeners(initialLayer) {
    const handlers = {}
    let moveTime = 0

    // Update placement (mouse-move)
    handlers.mm = event => {
      event.stopPropagation()
      let now = Date.now() // Apply a 20ms throttle
      if (now - moveTime <= 20) return
      const center = event.data.getLocalPosition(this.layer)
      const snapped = canvas.grid.getSnappedPosition(center.x, center.y, 2)
      this.data.x = snapped.x
      this.data.y = snapped.y
      this.refresh()
      moveTime = now
    }

    // Cancel the workflow (right-click)
    handlers.rc = _event => {
      this.layer.preview.removeChildren()
      canvas.stage.off('mousemove', handlers.mm)
      canvas.stage.off('mousedown', handlers.lc)
      canvas.app.view.oncontextmenu = null
      canvas.app.view.onwheel = null
      initialLayer.activate()
      this.actorSheet.maximize()
    }

    // Confirm the workflow (left-click)
    handlers.lc = event => {
      handlers.rc(event)

      // Confirm final snapped position
      const destination = canvas.grid.getSnappedPosition(this.data.x, this.data.y, 2)
      this.data.update(destination)

      if (game.settings.get('demonlord', 'templateAutoTargeting')) {
        this.autoTargeting()
      }

      // Create the template
      canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [this.data])
    }

    // Rotate the template by 3 degree increments (mouse-wheel)
    handlers.mw = event => {
      if (event.ctrlKey) event.preventDefault() // Avoid zooming the browser window
      event.stopPropagation()
      let delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15
      let snap = event.shiftKey ? delta : 5
      this.data.direction += snap * Math.sign(event.deltaY)
      this.refresh()
    }

    // Activate listeners
    canvas.stage.on('mousemove', handlers.mm)
    canvas.stage.on('mousedown', handlers.lc)
    canvas.app.view.oncontextmenu = handlers.rc
    canvas.app.view.onwheel = handlers.mw
  }

  isTokenInside(token) {
    const grid = canvas.scene.data.grid,
      templatePos = { x: this.data.x, y: this.data.y }
    // Check for center of  each square the token uses.
    // e.g. for large tokens all 4 squares
    const startX = token.data.width >= 1 ? 0.5 : token.data.width / 2
    const startY = token.data.height >= 1 ? 0.5 : token.data.height / 2
    for (let x = startX; x < token.data.width; x++) {
      for (let y = startY; y < token.data.height; y++) {
        const currGrid = {
          x: token.data.x + x * grid - templatePos.x,
          y: token.data.y + y * grid - templatePos.y,
        }
        const contains = this.shape.contains(currGrid.x, currGrid.y)
        if (contains) return true
      }
    }
    return false
  }

  autoTargeting() {
    const tokens = canvas.scene.getEmbeddedCollection('Token')
    let targets = []

    for (const token of tokens) {
      if (this.isTokenInside(token)) {
        targets.push(token._id)
      }
    }
    tokenManager.targetTokens(targets)
  }
}
