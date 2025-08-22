import { PlayerTracker } from './dialog/player-tracker.js'
const InteractionLayer = foundry.canvas.layers.InteractionLayer

function registerLayer () {
  CONFIG.Canvas.layers.playerTracker = { name: 'sotdl', layerClass: InteractionLayer, group: 'interface' }

}

function registerGetSceneControlButtonsHook () {
  Hooks.on('getSceneControlButtons', getSceneControlButtons)
}

function getSceneControlButtons (controls) {
  if (canvas === null) {
    return
  }

  // Only visible to GM
  if (game.user?.isGM) {
    controls['sotdl'] = {
      name: 'sotdl',
      title: 'SotDL GM Tools',
      layer: 'sotdl', // TODO: different layer to allow token clicks
      icon: 'fas fa-book-dead', // More demonic themed :) [old: fa-wrench]
      visible: true,
      tools: {
        'players': {
          name: 'players',
          title: 'Player Tracker',
          icon: 'fas fas fa-users',
          order: 1,
          button: true,
          onClick: () => {
            new PlayerTracker(this.actor, {
              top: 60,
              left: 120,
            }).render(true)
          }
        }
      }
    }
  }
}

registerLayer()
registerGetSceneControlButtonsHook();
