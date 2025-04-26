/* global fromUuidSync */
export function activateSocketListener() {
  game.socket.on('system.demonlord', async (...[message]) => {
    let actor = fromUuidSync(message.tokenuuid).actor
    // Execute it once if multiple GMs are connected.
    if (game.users.activeGM?.isSelf) {
      switch (message.request) {
        case 'createEffect':
          await actor.createEmbeddedDocuments('ActiveEffect', [message.effectData])
          break
        case 'deleteEffect':
          await actor.deleteEmbeddedDocuments('ActiveEffect', message.effectData)
          break
        default:
          break
      }
    }
  })
}