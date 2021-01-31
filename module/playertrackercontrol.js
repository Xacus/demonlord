import { PlayerTracker } from './dialog/player-tracker.js'

class PlayerTrackerLayer extends CanvasLayer {
  constructor () {
    super()
  }

  setButtons () {
    sptLayer.newButtons = {
      activeTool: 'DrawSquare',
      name: 'grid',
      icon: 'fas fa-wrench',
      layer: 'GridLayer',
      title: 'GM Tools',
      tools: [
        {
          icon: 'fas fas fa-users',
          name: 'Users',
          title: 'Player Tracker',
          onClick: sptLayer.renderPlayerTracker
        }
      ]
    }
  }

  initialize () {
    Hooks.on('getSceneControlButtons', (controls) => {
      if (game.user.data.role == 4) {
        controls.push(sptLayer.newButtons)
      }
    })
  }

  async renderPlayerTracker () {
    new PlayerTracker(this.actor, {
      top: 60,
      left: 120
    }).render(true)
  }
}

const sptLayer = new PlayerTrackerLayer()
sptLayer.setButtons()
sptLayer.initialize()

GridLayer.prototype.releaseAll = function () {}
