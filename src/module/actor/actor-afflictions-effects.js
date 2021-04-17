export class ActorAfflictionsEffects {

  /**
   * Map of <afflictionName> : <localizationWarningMessage>
   */
  static afflictionsWarningMessagesMap = {
    "blinded": "DL.DialogWarningBlindedChallengeFailer",
    "dazed": "DL.DialogWarningDazedFailer",
    "defenseless": "DL.DialogWarningDefenselessFailer",
    "stunned": "DL.DialogWarningStunnedFailer",
    "surprised": "DL.DialogWarningSurprisedFailer",
    "unconscious": "DL.DialogWarningUnconsciousFailer"
  }

  /**
   * Checks if an actor is afflicted. Return true and shows an error message if one of the actor afflictions is in
   * blockingAfflictionsList
   * @param actor The actor to check
   * @param blockingAfflictionsList: List[string], the afflictions to check. Example ['stunned', 'dazed']
   */
  static checkRollBlockingAfflictions(actor, blockingAfflictionsList) {

    for (let affliction of blockingAfflictionsList) {
      let isAfflicted = actor.data.data.afflictions[affliction]
      if (isAfflicted) {
        ui.notifications.error(game.i18n.localize(this.afflictionsWarningMessagesMap[affliction]))
        return true
      }
    }
    return false
  }

  /**
   * Checks if an actor is afflicted by the affliction (single value) and it does so only if the booleanValue is true
   * @param actor
   * @param affliction: string
   * @param booleanValue
   */
  static checkConditionalRollBlockingAffliction(actor, affliction, booleanValue) {
    if (!booleanValue) return false
    let isAfflicted = actor.data.data.afflictions[affliction]

    if (isAfflicted) {
      ui.notifications.error(game.i18n.localize(this.afflictionsWarningMessagesMap[affliction]))
      return true
    }
    return false
  }

  /**
   * Build the list of effects that give boons/banes to an action.
   * Used in printing the chat message relative to the action
   * @param actor
   * @param type: string, type of action being performed
   * @param boonsbanesEffectList: List[string] of afflictions/actions to check
   * @param number: {int | string} the number of boons (+) or banes (-) added by the effect
   * @returns {string|null}
   */
  static buildAfflictionsEffects = (actor, type, boonsbanesEffectList, number) => {
    // NOTE: Since the code is the same for all three, i grouped them here
    let boonsbanesString = ""
    switch (type) {
      case 'SPELL':
      case 'CHALLENGE':
        boonsbanesString = game.i18n.localize('DL.TalentChallengeBoonsBanes')
        break
      case 'ATTACK':
        boonsbanesString = game.i18n.localize('DL.TalentAttackBoonsBanes')
        break
      default:
        return null
    }

    let effectsString = ""
    // Also works for ActionEffects
    for (let effect of boonsbanesEffectList) {
      const isAffected = actor.data.data.afflictions[effect] || actor.data.data.actions[effect]
      if (isAffected) {
        const afflictionString = game.i18n.localize(`DL.${effect}`)
        effectsString += `${afflictionString}:<br>
                          &nbsp;&nbsp;&nbsp;• ${boonsbanesString}: ${number}<br>`
      }
    }
    return effectsString
  }

}
