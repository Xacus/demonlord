export class DLActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {
  constructor(options) {
      super(options)
    }

  static DEFAULT_OPTIONS = {
    window: {
      title: "EFFECT.ConfigTitle",
      resizable: true
    },
    position: {
      height: "auto",
      width: 580
    },
    classes: ["sheet", "active-effect-sheet"],
  };

  static PARTS = foundry.utils.mergeObject(super.PARTS ?? {}, {
    details: { template: "systems/demonlord/templates/item/parts/AE-config-details.hbs"},
    duration: { template: "systems/demonlord/templates/item/parts/AE-config-duration.hbs"},
    changes: { template: "systems/demonlord/templates/item/parts/AE-config-changes.hbs"}
  })


  /** @override */
  async _prepareContext(options={}) {
    let context = await super._prepareContext(options)
    const legacyTransfer = CONFIG.ActiveEffect.legacyTransferral

    const labels = {
      transfer: {
        name: game.i18n.localize(`EFFECT.Transfer${legacyTransfer ? "Legacy" : ""}`),
        hint: game.i18n.localize(`EFFECT.TransferHint${legacyTransfer ? "Legacy" : ""}`)
      }
    }

    const effect = foundry.utils.deepClone(this.document)
    const data = {
      labels,
      effect: effect, // Backwards compatibility
      data: effect,
      isActorEffect: this.document.parent.documentName === 'Actor',
      isItemEffect: this.document.parent.documentName === 'Item',
      descriptionHTML: foundry.applications.ux.TextEditor.implementation.enrichHTML(this.document.description, {async: true, secrets: this.document.isOwner}),
      modes: Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
        obj[e[1]] = game.i18n.localize('EFFECT.MODE_' + e[0])
        return obj
      }, {}),
    }

    context = foundry.utils.mergeObject(context, data)

    context.descriptionHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(effect.description, { async: true, secrets: effect.isOwner})
    context.availableChangeKeys = DLActiveEffectConfig._availableChangeKeys
    context.specialDurations = DLActiveEffectConfig._specialDurations

    return context
  }

  // eslint-disable-next-line 
  _onRender(context, options) {
    const currTabId = Object.values(context.tabs)?.find(i => i.active)?.id;
    if (currTabId !== "changes") this.position.height = this.element.offsetHeight ?? "auto";
  }

static initializeSpecialDurations() {
    DLActiveEffectConfig._specialDurations = {
        'None': i18n('DL.SpecialDurationNone'),
        'TurnStart': i18n('DL.SpecialDurationTurnStart'),
        'TurnEnd': i18n('DL.SpecialDurationTurnEnd'),
        'TurnStartSource': i18n('DL.SpecialDurationTurnStartSource'),
        'TurnEndSource': i18n('DL.SpecialDurationTurnEndSource'),
        'NextD20Roll': i18n('DL.SpecialDurationNextD20Roll'),
        'NextDamageRoll': i18n('DL.SpecialDurationNextDamageRoll'),
        'RestComplete': i18n('DL.SpecialDurationRestComplete')
    }
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
      // Null attributes
      'system.attributes.strength.immune': i18n('DL.ImmuneAttribute') + ' - ' + i18n('DL.AttributeStrength'),
      'system.attributes.agility.immune': i18n('DL.ImmuneAttribute') + ' - ' + i18n('DL.AttributeAgility'),
      'system.attributes.intellect.immune': i18n('DL.ImmuneAttribute') + ' - ' + i18n('DL.AttributeIntellect'),
      'system.attributes.will.immune': i18n('DL.ImmuneAttribute') + ' - ' + i18n('DL.AttributeWill'),
      'system.attributes.perception.immune': i18n('DL.ImmuneAttribute') + ' - ' + i18n('DL.AttributePerception'),
      // Attribute requirement modifier
      'system.attributes.strength.requirementModifier': i18n('DL.Requirements') + ' - ' + i18n('DL.AttributeStrength'),
      'system.attributes.agility.requirementModifier': i18n('DL.Requirements') + ' - ' + i18n('DL.AttributeAgility'),
      'system.attributes.intellect.requirementModifier': i18n('DL.Requirements') + ' - ' + i18n('DL.AttributeIntellect'),
      'system.attributes.will.requirementModifier': i18n('DL.Requirements') + ' - ' + i18n('DL.AttributeWill'),
      'system.attributes.perception.requirementModifier': i18n('DL.Requirements') + ' - ' + i18n('DL.AttributePerception'),
      // Immune
      'system.bonuses.immune.affliction': i18n('DL.ImmuneAffliction'),
      // Characteristics
      'system.characteristics.speed': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharSpeed'),
      'system.characteristics.defense': i18n('DL.Characteristics') + ' - ' + i18n('DL.AttributeDefense'),
      'system.characteristics.power': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharPower'),
      'system.characteristics.size': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharSize'),
      'system.characteristics.health.max': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharHealth'),
      'system.characteristics.health.healingrate': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharHealthHealingRating'),
      'system.characteristics.insanity.max': i18n('DL.Characteristics') + ' - ' + i18n('DL.CharInsanity'),
      'system.characteristics.insanity.immune': i18n('DL.ImmuneCharacteristic') + ' - ' + i18n('DL.CharInsanity'),
      'system.characteristics.corruption.immune': i18n('DL.ImmuneCharacteristic') + ' - ' + i18n('DL.CharCorruption'),
      // Attack bonuses
      'system.bonuses.attack.boons.spell': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.MagicSpellsTitle'),
      'system.bonuses.attack.boons.weapon': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.WeaponTitle'),
      'system.bonuses.attack.boons.strength': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AttributeStrength'),
      'system.bonuses.attack.boons.agility': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AttributeAgility'),
      'system.bonuses.attack.boons.intellect': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AttributeIntellect'),
      'system.bonuses.attack.boons.will': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AttributeWill'),
      'system.bonuses.attack.boons.perception': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AttributePerception'),
      'system.bonuses.attack.boons.all': i18n('DL.TalentAttackBoonsBanes') + ' - ' + i18n('DL.AllTitle'),
      'system.bonuses.attack.modifier.spell': i18n('DL.AttackRollBonuses') + ' - ' + i18n('DL.MagicSpellsTitle'),
      'system.bonuses.attack.modifier.weapon': i18n('DL.AttackRollBonuses') + ' - ' + i18n('DL.WeaponTitle'),
      'system.bonuses.attack.modifier.strength': i18n('DL.AttackRollBonuses') + ' - ' + i18n('DL.AttributeStrength'),
      'system.bonuses.attack.modifier.agility': i18n('DL.AttackRollBonuses') + ' - ' + i18n('DL.AttributeAgility'),
      'system.bonuses.attack.modifier.intellect': i18n('DL.AttackRollBonuses') + ' - ' + i18n('DL.AttributeIntellect'),
      'system.bonuses.attack.modifier.will': i18n('DL.AttackRollBonuses') + ' - ' + i18n('DL.AttributeWill'),
      'system.bonuses.attack.modifier.perception': i18n('DL.AttackRollBonuses') + ' - ' + i18n('DL.AttributePerception'),
      'system.bonuses.attack.modifier.all': i18n('DL.AttackRollBonuses') + ' - ' + i18n('DL.AllTitle'),
      'system.bonuses.attack.damage.spell': i18n('DL.TalentExtraDamage') + ' - ' + i18n('DL.MagicSpellsTitle'),
      'system.bonuses.attack.damage.weapon': i18n('DL.TalentExtraDamage') + ' - ' + i18n('DL.WeaponTitle'),
      'system.bonuses.attack.damage.talent': i18n('DL.TalentExtraDamage') + ' - ' + i18n('DL.TalentTitle'),
      'system.bonuses.attack.damage.all': i18n('DL.TalentExtraDamage') + ' - ' + i18n('DL.AllTitle'),
      'system.bonuses.attack.plus20Damage.spell': i18n('DL.TalentExtraDamage20plus') + ' - ' + i18n('DL.MagicSpellsTitle'),
      'system.bonuses.attack.plus20Damage.weapon': i18n('DL.TalentExtraDamage20plus') + ' - ' + i18n('DL.WeaponTitle'),
      'system.bonuses.attack.plus20Damage.talent': i18n('DL.TalentExtraDamage20plus') + ' - ' + i18n('DL.TalentTitle'),
      'system.bonuses.attack.plus20Damage.all': i18n('DL.TalentExtraDamage20plus') + ' - ' + i18n('DL.AllTitle'),
      'system.bonuses.attack.extraEffect': i18n('DL.TalentExtraEffect'),
      // Challenge bonuses
      'system.bonuses.challenge.boons.strength': i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AttributeStrength'),
      'system.bonuses.challenge.boons.agility': i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AttributeAgility'),
      'system.bonuses.challenge.boons.intellect': i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AttributeIntellect'),
      'system.bonuses.challenge.boons.will': i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AttributeWill'),
      'system.bonuses.challenge.boons.perception': i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AttributePerception'),
      'system.bonuses.challenge.boons.all': i18n('DL.TalentChallengeBoonsBanes') + ' - ' + i18n('DL.AllTitle'),
      // Armor bonuses
      'system.bonuses.armor.fixed': i18n('DL.ArmorTitle') + ' - ' + i18n('DL.ArmorFixed'),
      'system.bonuses.armor.agility': i18n('DL.ArmorTitle') + ' - ' + i18n('DL.AttributeAgility'),
      'system.bonuses.armor.defense': i18n('DL.ArmorTitle') + ' - ' + i18n('DL.AttributeDefense'),
      // Defense
      'system.bonuses.defense.boons.spell': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.MagicSpellsTitle'),
      'system.bonuses.defense.boons.weapon': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.WeaponTitle'),
      'system.bonuses.defense.boons.defense': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.SpellTypeDefense'),
      'system.bonuses.defense.boons.strength': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AttributeStrength'),
      'system.bonuses.defense.boons.agility': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AttributeAgility'),
      'system.bonuses.defense.boons.intellect': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AttributeIntellect'),
      'system.bonuses.defense.boons.will': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AttributeWill'),
      'system.bonuses.defense.boons.perception': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AttributePerception'),
      'system.bonuses.defense.boons.all': i18n('DL.TalentDefenseBoonsBanes') + ' - ' + i18n('DL.AllTitle'),
      // AutoFail challenge malus
      'system.maluses.autoFail.challenge.strength': i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.AttributeStrength'),
      'system.maluses.autoFail.challenge.agility': i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.AttributeAgility'),
      'system.maluses.autoFail.challenge.intellect': i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.AttributeIntellect'),
      'system.maluses.autoFail.challenge.will': i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.AttributeWill'),
      'system.maluses.autoFail.challenge.perception': i18n('DL.AutoFailChallenges') + ' - ' + i18n('DL.AttributePerception'),
      // AutoFail action malus
      'system.maluses.autoFail.action.strength': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.AttributeStrength'),
      'system.maluses.autoFail.action.agility': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.AttributeAgility'),
      'system.maluses.autoFail.action.intellect': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.AttributeIntellect'),
      'system.maluses.autoFail.action.will': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.AttributeWill'),
      'system.maluses.autoFail.action.perception': i18n('DL.AutoFailActions') + ' - ' + i18n('DL.AttributePerception'),
      // Other maluses
      'system.maluses.noFastTurn': i18n('DL.Malus') + ' - ' + i18n('DL.NoFastTurns'),
      'system.maluses.noAttacks': i18n('DL.Malus') + ' - ' + i18n('DL.NoAttacks'),
      'system.maluses.noSpecialAttacks': i18n('DL.Malus') + ' - ' + i18n('DL.NoSpecialAttacks'),
      'system.maluses.noSpecialActions': i18n('DL.Malus') + ' - ' + i18n('DL.NoSpecialActions'),
      'system.maluses.noSpells': i18n('DL.Malus') + ' - ' + i18n('DL.NoSpells'),
      'system.maluses.noEndOfRound': i18n('DL.Malus') + ' - ' + i18n('DL.NoEndOfRound'),
      'system.maluses.affliction': i18n('DL.Malus') + ' - ' + i18n('DL.Afflictions'),
      // Other bonuses
      'system.bonuses.rerollBoon1Dice': i18n('DL.RerollBoons1'),
      // Creature only
      'system.difficulty' : i18n('DL.CreatureDifficulty'),
      'system.frightening' : i18n('DL.CreatureFrightening'),
      'system.horrifying' : i18n('DL.CreatureHorrifying')
    }
  }
}

const i18n = s => game.i18n.localize(s)
