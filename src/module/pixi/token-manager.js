export class TokenManager {
  get targets() {
    if (game.settings.get('demonlord', 'targetingOnSelect')) {
      return canvas.tokens.controlled
    }
    return [...game.user.targets]
  }

  getTokenByActorId(actorId) {
    return canvas.tokens.placeables.find(token => token.actor.id === actorId)
  }
}
