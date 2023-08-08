export class TokenManager {
  get targets() {
    if (game.settings.get('demonlord', 'targetingOnSelect')) {
      return canvas.tokens.controlled
    }
    return [...game.user.targets]
  }

  async targetTokens(tokens) {
    if (game.settings.get('demonlord', 'targetingOnSelect')) {
      for (let tokenId of tokens) {
        const token = canvas.tokens.placeables.find(t => t.id === tokenId)
        token.control({ releaseOthers: false })
      }
    } else {
      await game.user.updateTokenTargets(tokens)
    }
  }

  getTokenByActorId(actorId) {
    return canvas.tokens.placeables.find(token => token.actor.id === actorId)
  }

  warnNotSelected() {
    if (game.settings.get('demonlord', 'targetingOnSelect')) {
      ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'))
    } else {
      ui.notifications.info(game.i18n.localize('DL.DialogWarningTargetNotSelected'))
    }
  }
}
