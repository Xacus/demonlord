export class DLActiveEffectConfig extends ActiveEffectConfig {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['sheet', 'active-effect-sheet'],
      template: 'systems/demonlord/templates/item/active-effect-config.html',
      width: 560,
      height: 'auto',
      tabs: [{ navSelector: '.tabs', contentSelector: 'form', initial: 'details' }],
    })
  }

  /** @override */
  getData() {
    const effect = foundry.utils.deepClone(this.object.data)
    return {
      effect: effect, // Backwards compatibility
      data: foundry.utils.deepClone(this.object.data),
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

  static initializeChangeKeys() {
    DLActiveEffectConfig._availableChangeKeys = {
      // <key> : <label>
      // No change
      '': '-',
      // Attributes
      'data.attributes.strength.value': i18n('DL.SpellAttribute') + ' - ' + i18n('DL.AttributeStrength'),
      'data.attributes.agility.value': i18n('DL.SpellAttribute') + ' - ' + i18n('DL.AttributeAgility'),
      'data.attributes.intellect.value': i18n('DL.SpellAttribute') + ' - ' + i18n('DL.AttributeIntellect'),
      'data.attributes.will.value': i18n('DL.SpellAttribute') + ' - ' + i18n('DL.AttributeWill'),
      'data.attributes.perception.value': i18n('DL.SpellAttribute') + ' - ' + i18n('DL.CharPerception'),
      // Characteristics
      'data.characteristics.speed': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharSpeed'),
      'data.characteristics.defense': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharDefense'),
      'data.characteristics.power': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharPower'),
      'data.characteristics.size': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharSize'),
      'data.characteristics.health.max': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharHealth'),
      'data.characteristics.health.healingrate':
        i18n('DL.Characteristics') + ' - ' + i18n('DL.CharHealthHealingRating'),
      'data.characteristics.health.insanity.max': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharInsanity'),
      // Attack bonuses
      'data.bonuses.attack.boons.strength': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AttributeStrength'),
      'data.bonuses.attack.boons.agility': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AttributeAgility'),
      'data.bonuses.attack.boons.intellect': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AttributeIntellect'),
      'data.bonuses.attack.boons.will': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AttributeWill'),
      'data.bonuses.attack.boons.perception': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.CharPerception'),
      'data.bonuses.attack.damage': i18n('DL.TalentExtraDamage'),
      'data.bonuses.attack.plus20Damage': i18n('DL.TalentExtraDamage20plus'),
      'data.bonuses.attack.extraEffect': i18n('DL.TalentExtraEffect'),
      // Challenge bonuses
      'data.bonuses.challenge.boons.strength':
        i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AttributeStrength'),
      'data.bonuses.challenge.boons.agility':
        i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AttributeAgility'),
      'data.bonuses.challenge.boons.intellect':
        i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AttributeIntellect'),
      'data.bonuses.challenge.boons.will': i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AttributeWill'),
      'data.bonuses.challenge.boons.perception':
        i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.CharPerception'),
      // Armor bonuses
      'data.bonuses.armor.fixed': i18n('DL.ArmorTitle') + ' - ' + i18n('DL.ArmorFixed'),
      'data.bonuses.armor.agility': i18n('DL.ArmorTitle') + ' - ' + i18n('DL.AttributeAgility'),
      'data.bonuses.armor.defense': i18n('DL.ArmorTitle') + ' - ' + i18n('DL.CharDefense'),
      'data.bonuses.armor.override': i18n('DL.ArmorTitle') + ' - ' + i18n('DL.Override'),
      // Defense
      'data.bonuses.defense.boons.spell': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.MagicSpellsTitle'),
      'data.bonuses.defense.boons.weapon': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.WeaponTitle'),
      'data.bonuses.defense.boons.defense': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.SpellTypeDefense'),
      'data.bonuses.defense.boons.strength': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AttributeStrength'),
      'data.bonuses.defense.boons.agility': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AttributeAgility'),
      'data.bonuses.defense.boons.intellect':
        i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AttributeIntellect'),
      'data.bonuses.defense.boons.will': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AttributeWill'),
      'data.bonuses.defense.boons.perception': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.CharPerception'),
      // AutoFail challenge malus
      'data.maluses.autoFail.challenge.strength': i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.AttributeStrength'),
      'data.maluses.autoFail.challenge.agility': i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.AttributeAgility'),
      'data.maluses.autoFail.challenge.intellect':
        i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.AttributeIntellect'),
      'data.maluses.autoFail.challenge.will': i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.AttributeWill'),
      'data.maluses.autoFail.challenge.perception': i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.CharPerception'),
      // AutoFail action malus
      'data.maluses.autoFail.action.strength': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.AttributeStrength'),
      'data.maluses.autoFail.action.agility': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.AttributeAgility'),
      'data.maluses.autoFail.action.intellect': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.AttributeIntellect'),
      'data.maluses.autoFail.action.will': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.AttributeWill'),
      'data.maluses.autoFail.action.perception': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.CharPerception'),
      // Other maluses
      'data.maluses.halfSpeed': i18n('DL.Malus') + ' - ' + i18n('DL.HalfSpeed'),
      'data.maluses.noFastTurn': i18n('DL.Malus') + ' - ' + i18n('DL.NoFastTurns'),
    }
  }
}

const i18n = s => game.i18n.localize(s)
