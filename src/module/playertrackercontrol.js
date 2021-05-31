import { PlayerTracker } from './dialog/player-tracker.js'

class PlayerTrackerLayer extends CanvasLayer {
  constructor() {
    super()
  }

  setButtons() {
    sptLayer.newButtons = {
      name: 'dl-gm-tools',
      title: 'SotDL GM Tools',
      layer: 'grid', // TODO: different layer to allow token clicks
      icon: 'fas fa-book-dead', // More demonic themed :) [old: fa-wrench]
      visible: true,
      tools: [
        {
          icon: 'fas fas fa-users',
          name: 'Users',
          title: 'Player Tracker',
          onClick: sptLayer.renderPlayerTracker,
        },
      ],
    }
  }

  initialize() {
    Hooks.on('getSceneControlButtons', controls => {
      if (game.user.data.role == 4) {
        controls.push(sptLayer.newButtons)
      }
    })
  }

  async renderPlayerTracker() {
    new PlayerTracker(this.actor, {
      top: 60,
      left: 120,
    }).render(true)
  }
}

const sptLayer = new PlayerTrackerLayer()
sptLayer.setButtons()
sptLayer.initialize()

GridLayer.prototype.releaseAll = function () {}
