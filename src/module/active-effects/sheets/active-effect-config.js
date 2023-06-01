export class DLActiveEffectConfig extends ActiveEffectConfig {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['sheet', 'active-effect-sheet'],
      template: 'systems/demonlord/templates/item/active-effect-config.hbs',
      width: 560,
      height: 'auto',
      tabs: [{ navSelector: '.tabs', contentSelector: 'form', initial: 'details' }],
    })
  }

  /** @override */
  getData() {
    const effect = foundry.utils.deepClone(this.object)
    return {
      effect: effect, // Backwards compatibility
      data: effect,
      isActorEffect: this.object.parent.documentName === 'Actor',
      isItemEffect: this.object.parent.documentName === 'Item',
      submitText: 'EFFECT.Submit',
      availableChangeKeys: DLActiveEffectConfig._availableChangeKeys,
      modes: Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
        obj[e[1]] = game.i18n.localize('EFFECT.MODE_' + e[0])
        return obj
      }, {}),
    }
  }

  activateListeners(html) {
    super.activateListeners(html)
    // Change the duration in rounds based on seconds and vice-versa
    // const inputSeconds = html.find('input[name="duration.seconds"]')
    // const inputRounds = html.find('input[name="duration.rounds"]')
    // inputSeconds.change(_ => inputRounds.val(Math.floor(inputSeconds.val() / 10)))
    // inputRounds.change(_ => inputSeconds.val(inputRounds.val() * 10))
  }

  static initializeChangeKeys() {
    DLActiveEffectConfig._availableChangeKeys = {
      // <key> : <name>
      // No change
      '': '-',
      // Attributes
      'system.attributes.strength.value': i18n('DL.SpellAttribute') + ' - ' + i18n('DL.AttributeStrength'),
      'system.attributes.agility.value': i18n('DL.SpellAttribute') + ' - ' + i18n('DL.AttributeAgility'),
      'system.attributes.intellect.value': i18n('DL.SpellAttribute') + ' - ' + i18n('DL.AttributeIntellect'),
      'system.attributes.will.value': i18n('DL.SpellAttribute') + ' - ' + i18n('DL.AttributeWill'),
      'system.attributes.perception.value': i18n('DL.SpellAttribute') + ' - ' + i18n('DL.AttributePerception'),
      // Characteristics
      'system.characteristics.speed': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharSpeed'),
      'system.characteristics.defense': i18n('DL.Characteristics') + ' - ' + i18n('DL.AttributeDefense'),
      'system.characteristics.power': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharPower'),
      'system.characteristics.size': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharSize'),
      'system.characteristics.health.max': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharHealth'),
      'system.characteristics.health.healingrate':
        i18n('DL.Characteristics') + ' - ' + i18n('DL.CharHealthHealingRating'),
      'system.characteristics.health.insanity.max': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharInsanity'),
      // Attack bonuses
      'system.bonuses.attack.boons.spell': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.MagicSpellsTitle'),
      'system.bonuses.attack.boons.weapon': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.WeaponTitle'),
      'system.bonuses.attack.boons.strength': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AttributeStrength'),
      'system.bonuses.attack.boons.agility': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AttributeAgility'),
      'system.bonuses.attack.boons.intellect': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AttributeIntellect'),
      'system.bonuses.attack.boons.will': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AttributeWill'),
      'system.bonuses.attack.boons.perception': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AttributePerception'),
      'system.bonuses.attack.damage': i18n('DL.TalentExtraDamage'),
      'system.bonuses.attack.plus20Damage': i18n('DL.TalentExtraDamage20plus'),
      'system.bonuses.attack.extraEffect': i18n('DL.TalentExtraEffect'),
      // Challenge bonuses
      'system.bonuses.challenge.boons.strength':
        i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AttributeStrength'),
      'system.bonuses.challenge.boons.agility':
        i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AttributeAgility'),
      'system.bonuses.challenge.boons.intellect':
        i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AttributeIntellect'),
      'system.bonuses.challenge.boons.will': i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AttributeWill'),
      'system.bonuses.challenge.boons.perception':
        i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AttributePerception'),
      // Armor bonuses
      'system.bonuses.armor.fixed': i18n('DL.ArmorTitle') + ' - ' + i18n('DL.ArmorFixed'),
      'system.bonuses.armor.agility': i18n('DL.ArmorTitle') + ' - ' + i18n('DL.AttributeAgility'),
      'system.bonuses.armor.defense': i18n('DL.ArmorTitle') + ' - ' + i18n('DL.AttributeDefense'),
      'system.bonuses.armor.override': i18n('DL.ArmorTitle') + ' - ' + i18n('DL.Override'),
      // Defense
      'system.bonuses.defense.boons.spell': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.MagicSpellsTitle'),
      'system.bonuses.defense.boons.weapon': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.WeaponTitle'),
      'system.bonuses.defense.boons.defense': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.SpellTypeDefense'),
      'system.bonuses.defense.boons.strength': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AttributeStrength'),
      'system.bonuses.defense.boons.agility': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AttributeAgility'),
      'system.bonuses.defense.boons.intellect':
        i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AttributeIntellect'),
      'system.bonuses.defense.boons.will': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AttributeWill'),
      'system.bonuses.defense.boons.perception': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AttributePerception'),
      // AutoFail challenge malus
      'system.maluses.autoFail.challenge.strength': i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.AttributeStrength'),
      'system.maluses.autoFail.challenge.agility': i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.AttributeAgility'),
      'system.maluses.autoFail.challenge.intellect':
        i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.AttributeIntellect'),
      'system.maluses.autoFail.challenge.will': i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.AttributeWill'),
      'system.maluses.autoFail.challenge.perception': i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.AttributePerception'),
      // AutoFail action malus
      'system.maluses.autoFail.action.strength': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.AttributeStrength'),
      'system.maluses.autoFail.action.agility': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.AttributeAgility'),
      'system.maluses.autoFail.action.intellect': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.AttributeIntellect'),
      'system.maluses.autoFail.action.will': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.AttributeWill'),
      'system.maluses.autoFail.action.perception': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.AttributePerception'),
      // Other maluses
      'system.maluses.halfSpeed': i18n('DL.Malus') + ' - ' + i18n('DL.HalfSpeed'),
      'system.maluses.noFastTurn': i18n('DL.Malus') + ' - ' + i18n('DL.NoFastTurns'),
      // Other bonuses
      'system.bonuses.rerollBoon1Dice': i18n('DL.RerollBoons1')
    }
  }
}

const i18n = s => game.i18n.localize(s)
