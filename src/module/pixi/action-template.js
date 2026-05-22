import { DL } from '../config.js'
import { TokenManager } from './token-manager'

const tokenManager = new TokenManager()

/**
 * A helper class for building scene regions for 5e spells and abilities
 * @extends {SceneRegion|MeasuredTemplate}
 */
export class ActionTemplate extends foundry.canvas.placeables.Region {
  static defaults = {
    angle: 53.13,
    width: 1
  }

  static async fromItem(item) {
    const target = foundry.utils.getProperty(item, 'system.activatedEffect.target') || {}
    const templateShape = DL.actionAreaShape[target.type]
    if (!templateShape) return null

    // Prepare template data
    const templateData = {
      type: templateShape,
      user: game.user._id,
      rotation: 0,
      x: 0,
      y: 0,
      fillColor: game.user.color,
      texture: item.system.activatedEffect.texture,
      gridBased: false,
      hole: false,

      flags: {
        demonlord: {
        actionTemplate: true,
        }
      },
    }

    let value = Number.parseInt(target.value) * canvas.dimensions.size // The radius is in pixels, but the value is in grid units

    // Additional type-specific data
    switch (templateShape) {
      case 'cone':
        templateData.angle = this.defaults.angle
        templateData.radius = value
        templateData.curvature = 'round'
        break
      case 'rectangle': // All rectangles are square
        templateData.anchorX = 0.5
        templateData.anchorY = 0.5
        templateData.width = value
        templateData.height = value
        break
      case 'line':
        //templateData.height = value
        templateData.length = value
        templateData.width = canvas.dimensions.size  // Lines are most commonly 1 square in width
        break
      case 'circle':
        templateData.radius = value
        break
      case 'circle':
        template.radius = value
        break
      default:
        break
    }

    // Return the template constructed from the item data
    const template = await canvas.regions.placeRegion({
      name: `${item.name}`,
      shapes: [templateData]
    }, { create: false })

    //const cls = CONFIG.Region.documentClass
    //const template = new cls(templateData, { parent: canvas.scene })

    if (template) {
      // Only do the following if the template was actually created
      const object = new this(template)
      object.item = item
      object.actorSheet = item.actor?.sheet || null

      // First clear the tokens
      canvas.tokens.setTargets([])

      // Automatically target tokens
      for (let token of canvas.tokens.placeables) {
        if (template.testPoint(token.document.getCenterPoint())) {
          // TODO: Should it ignore self?
          token.setTarget(true, { releaseOthers: false })
        }
      }

      return object
    }
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
    handlers.mm = async event => {
      event.stopPropagation()
      let now = Date.now() // Apply a 20ms throttle
      if (now - moveTime <= 20) return
      const center = event.data.getLocalPosition(this.layer)
      const interval = canvas.grid.type === CONST.GRID_TYPES.GRIDLESS ? 0 : 2
      const snapped = canvas.grid.getSnappedPoint(center, { mode: 1, resolution: interval })
      await this.document.updateSource({x: snapped.x, y: snapped.y})
      this.refresh()
      this.autoTargeting()

      moveTime = now
    }

    // Cancel the workflow (right-click)
    handlers.rc = _event => {
      _event.stopPropagation()
      event.preventDefault()
      this.layer._onDragLeftCancel(_event)
      canvas.stage.off('mousemove', handlers.mm)
      canvas.stage.off('mousedown', handlers.lc)
      canvas.app.view.oncontextmenu = null
      canvas.app.view.onwheel = null
      initialLayer.activate()
      // Incantations: Measured template does not have parent actor.
      if (this.actorSheet) this.actorSheet.maximize()
    }

    // Confirm the workflow (left-click)
    handlers.lc = async event => {
      handlers.rc(event)

      // Confirm final snapped position
      const interval = canvas.grid.type === CONST.GRID_TYPES.GRIDLESS ? 0 : 2
      const destination = canvas.grid.getSnappedPoint(this.document, {mode: 1, resolution: interval})
      await this.document.updateSource(destination)
      const data = this.document.toObject()
      this.autoTargeting()

      // Create the template
      await canvas.scene.createEmbeddedDocuments('Region', [data])
    }

    // Rotate the template by 3 degree increments (mouse-wheel)
    handlers.mw = async event => {
      if (event.ctrlKey) event.preventDefault() // Avoid zooming the browser window
      event.stopPropagation()
      let delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15
      let snap = event.shiftKey ? delta : 5
      // this.direction +=
      await this.document.updateSource({direction: this.document.direction + snap * Math.sign(event.deltaY)})
      this.refresh()
      this.autoTargeting()
    }

    // Activate listeners
    canvas.stage.addEventListener('mousemove', handlers.mm)
    canvas.stage.addEventListener('mousedown', handlers.lc)
    canvas.app.view.oncontextmenu = handlers.rc
    canvas.app.view.onwheel = handlers.mw
  }

  isTokenInside(token) {
    const gridSize = canvas.scene.grid.size,
      templatePos = { x: this.document.x, y: this.document.y }
    // Check for center of  each square the token uses.
    // e.g. for large tokens all 4 squares
    const startX = token.width >= 1 ? 0.5 : token.width / 2
    const startY = token.height >= 1 ? 0.5 : token.height / 2
    for (let x = startX; x < token.width; x++) {
      for (let y = startY; y < token.height; y++) {
        const currGrid = {
          x: token.x + x * gridSize - templatePos.x,
          y: token.y + y * gridSize - templatePos.y,
        }
        const contains = this.shape?.contains(currGrid.x, currGrid.y)
        if (contains) return true
      }
    }
    return false
  }

  autoTargeting() {
    if (!game.settings.get('demonlord', 'templateAutoTargeting')) return
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
