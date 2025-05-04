import { multiplyEffect, addEffect, downgradeEffect, overrideEffect } from './item-effects'
import { capitalize } from '../utils/utils'

const effectPriority = 110

const _buildBaseAffliction = (label, icon, changes = [], flags = {}) => ({
  id: label, // TODO: Check corrections here?
  name: game.i18n.localize('DL.' + label),
  icon: icon,
  disabled: false,
  transfer: true,
  duration: {},
  flags: {
    sourceType: 'affliction',
    permanent: false,
    ...flags,
  },
  changes: changes,
  description: game.i18n.localize('DL.Afflictions' + capitalize(label))
})

export class DLAfflictions {
  /**
   * Checks if the actor can do the action he is trying to perform, with the relative attribute
   * @param actor                 The actor
   * @param actionType            The type of action: [action / challenge]
   * @param actionAttribute       The attribute name, lowercase
   * @returns {boolean}           True if the actor is blocked
   */
  static isActorBlocked(actor, actionType, actionAttribute) {
    actionAttribute = actionAttribute.toLowerCase()
    const isBlocked = actor.system.maluses.autoFail[actionType]?.[actionAttribute] > 0
    if (isBlocked) {
      // TODO: more precise message? Currently it picks the first message
      let msg = Array.from(actor.allApplicableEffects()).find(effect => Boolean(effect.flags?.warningMessage))
        ?.flags.warningMessage
      msg = msg ?? game.i18n.localize(`DL.AutoFail${actionType.capitalize()}s`)
      ui.notifications.error(msg)
    }
    return isBlocked
  }

  static async clearAfflictions(actor) {
    if (!actor) return
    const afflictions = Array.from(actor.allApplicableEffects())
      .filter(e => e.statuses.size > 0)
      .map(e => e._id)
    await actor.deleteEmbeddedDocuments('ActiveEffect', afflictions)
  }

  /**
   * Builds the Afflictions Active Effects for the token quick menu
   * @returns list of active effect data
   */
  static buildAll() {
    const effectsDataList = []

    // Asleep
    effectsDataList.push(_buildBaseAffliction('asleep', 'icons/svg/sleep.svg'))

    // Blinded
    effectsDataList.push(
      _buildBaseAffliction(
        'blinded',
        'icons/svg/blind.svg',
        [
          addEffect('system.bonuses.defense.boons.defense', -1, effectPriority),
          addEffect('system.bonuses.defense.boons.agility', -1, effectPriority),
          downgradeEffect('system.characteristics.speed', 2, effectPriority),
          // overrideEffect('system.maluses.autoFail.challenge.perception', 1)  fails only perc challenges based on SIGHT
        ],
        {
          warningMessage: game.i18n.localize('DL.DialogWarningBlindedChallengeFailer'),
        },
      ),
    )

    // Charmed
    effectsDataList.push(_buildBaseAffliction('charmed', 'systems/demonlord/assets/icons/effects/charmed.svg'))

    // Compelled
    effectsDataList.push(_buildBaseAffliction('compelled', 'systems/demonlord/assets/icons/effects/compelled.svg'))

    // Dazed
    effectsDataList.push(
      _buildBaseAffliction(
        'dazed',
        'icons/svg/daze.svg',
        [
          overrideEffect('system.maluses.autoFail.challenge.strength', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.agility', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.intellect', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.will', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.perception', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.strength', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.agility', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.intellect', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.will', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.perception', 1, effectPriority),
        ],
        {
          warningMessage: game.i18n.localize('DL.DialogWarningDazedFailer'),
        },
      ),
    )

    // Deafened
    effectsDataList.push(
      _buildBaseAffliction('deafened', 'icons/svg/deaf.svg', [
        //overrideEffect('system.maluses.autoFail.challenge.perception', 1) fails only perc challenges based on HEARING
      ]),
    )

    // Defenseless
    effectsDataList.push(
      _buildBaseAffliction(
        'defenseless',
        'systems/demonlord/assets/icons/effects/defenseless.svg',
        [
          overrideEffect('system.characteristics.defense', 5, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.strength', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.agility', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.intellect', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.will', 1, effectPriority),
          //overrideEffect('system.maluses.autoFail.challenge.perception', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.strength', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.agility', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.intellect', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.will', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.perception', 1, effectPriority),
        ],
        {
          warningMessage: game.i18n.localize('DL.DialogWarningDefenselessFailer'),
        },
      ),
    )

    // Diseased
    effectsDataList.push(
      _buildBaseAffliction(
        'diseased',
        'systems/demonlord/assets/icons/effects/diseased.svg',
        [
          addEffect('system.bonuses.challenge.boons.all', -1, effectPriority),
          addEffect('system.bonuses.attack.boons.all', -1, effectPriority),
        ]
      ),
    )

    // Fatigued
    effectsDataList.push(
      _buildBaseAffliction(
        'fatigued',
        'systems/demonlord/assets/icons/effects/fatigued.svg',
        [
          addEffect('system.bonuses.challenge.boons.all', -1, effectPriority),
          addEffect('system.bonuses.attack.boons.all', -1, effectPriority),
        ]
      ),
    )

    // Frightened
    effectsDataList.push(
      _buildBaseAffliction(
        'frightened',
        'icons/svg/terror.svg',
        [
          addEffect('system.bonuses.challenge.boons.all', -1, effectPriority),
          addEffect('system.bonuses.attack.boons.all', -1, effectPriority),
        ]
      ),
    )

    // Grabbed
    effectsDataList.push(_buildBaseAffliction('grabbed', 'systems/demonlord/assets/icons/effects/grabbed.svg'))

    // Horrified
    effectsDataList.push(
      _buildBaseAffliction('horrified', 'systems/demonlord/assets/icons/effects/horrified.svg', [
        addEffect('system.bonuses.challenge.boons.all', -3, effectPriority),
        addEffect('system.bonuses.attack.boons.all', -3, effectPriority),
      ]),
    )

    // Immobilized
    effectsDataList.push(
      _buildBaseAffliction('immobilized', 'systems/demonlord/assets/icons/effects/immobilized.svg', [
        downgradeEffect('system.characteristics.speed', 0, effectPriority),
        addEffect('system.bonuses.defense.boons.defense', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.strength', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.agility', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.will', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.intellect', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.perception', -1, effectPriority),
      ]),
    )

    // Impaired
    effectsDataList.push(
      _buildBaseAffliction(
        'impaired',
        'systems/demonlord/assets/icons/effects/impaired.svg',
        [
          addEffect('system.bonuses.challenge.boons.all', -1, effectPriority),
          addEffect('system.bonuses.attack.boons.all', -1, effectPriority),
        ]
      ),
    )

    // Poisoned
    effectsDataList.push(_buildBaseAffliction('poisoned', 'icons/svg/poison.svg', [
      addEffect('system.bonuses.challenge.boons.all', -1, effectPriority),
      addEffect('system.bonuses.attack.boons.all', -1, effectPriority),
    ]))

    // Prone
    effectsDataList.push(
      _buildBaseAffliction('prone', 'icons/svg/falling.svg', [
        addEffect('system.bonuses.attack.boons.strength', -1, effectPriority),
        addEffect('system.bonuses.attack.boons.agility', -1, effectPriority),
        addEffect('system.bonuses.challenge.boons.strength', -1, effectPriority),
        addEffect('system.bonuses.challenge.boons.agility', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.defense', -1, effectPriority),
        // FIXME: depends if the attacker is nearby or not
        addEffect('system.bonuses.defense.boons.strength', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.agility', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.will', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.intellect', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.perception', -1, effectPriority),
      ]),
    )

    // Slowed
    effectsDataList.push(
      _buildBaseAffliction('slowed', 'systems/demonlord/assets/icons/effects/slowed.svg', [
        overrideEffect('system.maluses.noFastTurn', 1, effectPriority),
        multiplyEffect('system.characteristics.speed', 0.5, effectPriority),
      ]),
    )

    // Stunned
    effectsDataList.push(
      _buildBaseAffliction(
        'stunned',
        'icons/svg/stoned.svg',
        [
          overrideEffect('system.maluses.autoFail.challenge.strength', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.agility', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.intellect', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.will', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.perception', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.strength', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.agility', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.intellect', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.will', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.perception', 1, effectPriority),
          addEffect('system.bonuses.defense.boons.defense', -1, effectPriority),
          addEffect('system.bonuses.defense.boons.strength', -1, effectPriority),
          addEffect('system.bonuses.defense.boons.agility', -1, effectPriority),
          addEffect('system.bonuses.defense.boons.will', -1, effectPriority),
          addEffect('system.bonuses.defense.boons.intellect', -1, effectPriority),
          addEffect('system.bonuses.defense.boons.perception', -1, effectPriority),
        ],
        {
          warningMessage: game.i18n.localize('DL.DialogWarningStunnedFailer'),
        },
      ),
    )

    // Suprised
    effectsDataList.push(
      _buildBaseAffliction(
        'surprised',
        'systems/demonlord/assets/icons/effects/surprised.svg',
        [
          overrideEffect('system.maluses.autoFail.challenge.strength', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.agility', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.intellect', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.will', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.perception', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.strength', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.agility', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.intellect', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.will', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.perception', 1, effectPriority),
          downgradeEffect('system.characteristics.speed', 0, effectPriority),
        ],
        {
          warningMessage: game.i18n.localize('DL.DialogWarningSurprisedFailer'),
        },
      ),
    )

    // Surrounded
    effectsDataList.push(
      _buildBaseAffliction(
        'surrounded',
        'systems/demonlord/assets/icons/effects/surrounded.svg',
        [
          addEffect('system.bonuses.defense.boons.weapon', -1, effectPriority),
          addEffect('system.bonuses.defense.boons.spell', -1, effectPriority),
        ],
      ),
    )    

    // Unconscious
    effectsDataList.push(
      _buildBaseAffliction(
        'unconscious',
        'icons/svg/unconscious.svg',
        [
          overrideEffect('system.maluses.autoFail.challenge.strength', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.agility', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.intellect', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.will', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.perception', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.strength', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.agility', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.intellect', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.will', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.perception', 1, effectPriority),
          downgradeEffect('system.characteristics.speed', 0, effectPriority),
          overrideEffect('system.characteristics.defense', 5, effectPriority),
        ],
        {
          warningMessage: game.i18n.localize('DL.DialogWarningUnconsciousFailer'),
        },
      ),
    )

    // ----------------------- ACTIONS -------------------------- //

    // Concentrate
    effectsDataList.push(_buildBaseAffliction('concentrate', 'systems/demonlord/assets/icons/effects/concentrate.svg'))

    // Defend
    effectsDataList.push(
      _buildBaseAffliction('defend', 'systems/demonlord/assets/icons/effects/defend.svg', [
        addEffect('system.bonuses.defense.boons.defense', 1, effectPriority),
        addEffect('system.bonuses.defense.boons.strength', 1, effectPriority),
        addEffect('system.bonuses.defense.boons.agility', 1, effectPriority),
        addEffect('system.bonuses.defense.boons.will', 1, effectPriority),
        addEffect('system.bonuses.defense.boons.intellect', 1, effectPriority),
        addEffect('system.bonuses.defense.boons.perception', 1, effectPriority),
        // TODO: Auto disable when Dazed, Stunned or Unconscious
      ]),
    )

    // Help
    effectsDataList.push(
      _buildBaseAffliction(
        'help',
        'systems/demonlord/assets/icons/effects/help.svg',
        [], // TODO: Add boons? Aka help should be applied to the receiver
      ),
    )

    // Prepare
    effectsDataList.push(
      _buildBaseAffliction('prepare', 'systems/demonlord/assets/icons/effects/prepare.svg', [
        addEffect('system.bonuses.challenge.boons.strength', 1, effectPriority),
        addEffect('system.bonuses.challenge.boons.agility', 1, effectPriority),
        addEffect('system.bonuses.challenge.boons.intellect', 1, effectPriority),
        addEffect('system.bonuses.challenge.boons.will', 1, effectPriority),
        addEffect('system.bonuses.challenge.boons.perception', 1, effectPriority),
        addEffect('system.bonuses.attack.boons.strength', 1, effectPriority),
        addEffect('system.bonuses.attack.boons.agility', 1, effectPriority),
        addEffect('system.bonuses.attack.boons.intellect', 1, effectPriority),
        addEffect('system.bonuses.attack.boons.will', 1, effectPriority),
        addEffect('system.bonuses.attack.boons.perception', 1, effectPriority),
      ]),
    )

    // Reload
    effectsDataList.push(_buildBaseAffliction('reload', 'systems/demonlord/assets/icons/effects/reload.svg'))

    // Retreat
    effectsDataList.push(_buildBaseAffliction('retreat', 'systems/demonlord/assets/icons/effects/retreat.svg'))

    // Rush
    effectsDataList.push(_buildBaseAffliction('rush', 'systems/demonlord/assets/icons/effects/rush.svg'))

    // Stabilize
    effectsDataList.push(_buildBaseAffliction('stabilize', 'systems/demonlord/assets/icons/effects/stabilize.svg'))

    // ----------------------- DAMAGE EFFECTS -------------------------- //

    // Injured
    effectsDataList.push(_buildBaseAffliction('injured', 'icons/svg/blood.svg'))

    // Incapacitated
    effectsDataList.push(
      _buildBaseAffliction('incapacitated', 'systems/demonlord/assets/icons/effects/incapacitated.svg'),
    )

    // Disabled
    effectsDataList.push(_buildBaseAffliction('disabled', 'systems/demonlord/assets/icons/effects/disabled.svg', [], {'core.overlay': true}))

    // Dying
    effectsDataList.push(_buildBaseAffliction('dying', 'systems/demonlord/assets/icons/effects/dying.svg', [], {'core.overlay': true}))

    return effectsDataList
  }
}
