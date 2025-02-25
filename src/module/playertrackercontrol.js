/* globals InteractionLayer */
import { PlayerTracker } from './dialog/player-tracker.js'

function registerLayer () {
  CONFIG.Canvas.layers.playerTracker = { layerClass: InteractionLayer, group: 'interface' }
}

function registerGetSceneControlButtonsHook () {
  Hooks.on('getSceneControlButtons', getSceneControlButtons)
}

function getSceneControlButtons (controls) {
  if (canvas === null) {
    return
  }

  controls.push({
    name: 'dl-gm-tools',
    title: 'SotDL GM Tools',
    layer: 'controls', // TODO: different layer to allow token clicks
    icon: 'fas fa-book-dead', // More demonic themed :) [old: fa-wrench]
    visible: true,
    tools: [
      {
        icon: 'fas fas fa-users',
        name: 'Users',
        title: 'Player Tracker',
        button: true,
        visible: true,
        onClick: () => {
          new PlayerTracker(this.actor, {
            top: 60,
            left: 120,
          }).render(true)
        }
      }
    ],
  })
}

registerLayer()
registerGetSceneControlButtonsHook();
