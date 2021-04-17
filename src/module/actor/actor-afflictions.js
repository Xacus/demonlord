
export class ActorAfflictions {

  static afflictionsErrorMessagesMap = {
    "asleep": "",
    "blinded": "DL.DialogWarningBlindedChallengeFailer",
    "charmed": "",
    "compelled": "",
    "dazed": "DL.DialogWarningDazedFailer",
    "deafened": "",
    "defenseless": "DL.DialogWarningDefenselessFailer",
    "diseased": "",
    "fatigued": "",
    "frightened": "",
    "horrified": "",
    "grabbed": "",
    "immobilized": "",
    "impaired": "",
    "poisoned": "",
    "prone": "",
    "slowed": "",
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

      if (isAfflicted){
        ui.notifications.error(game.i18n.localize(this.afflictionsErrorMessagesMap[affliction]))
        return true
      }
    }
    return false
  }

  static checkConditionalRollBlockingAffliction (actor, affliction, booleanValue) {
    if (!booleanValue) return false
    let isAfflicted = actor.data.data.afflictions[affliction]

    if (isAfflicted){
      ui.notifications.error(game.i18n.localize(this.afflictionsErrorMessagesMap[affliction]))
      return true
    }
    return false
  }
}
