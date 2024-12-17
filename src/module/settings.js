export class AdvancedSettings extends FormApplication {
    constructor() {
        super();
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "advanced-settings",
            title: game.i18n.localize("DL.SettingDSNLabel"),
            template: 'systems/demonlord/templates/setting/advancedsettings.hbs',
            width: 520
        });
    }

    getData() {
        return {
            colourBoBDieDSN: game.settings.get('demonlord', 'colourBoBDieDSN'),
            colourBane: game.settings.get('demonlord', 'baneColour'),
            colourBoon: game.settings.get('demonlord', 'boonColour'),
            replaced3: game.settings.get('demonlord', 'replaced3'),
          };
    }

    async resetToDefault(key) {
      const defaultValue = game.settings.settings.get(`demonlord.${key}`).default;
      await game.settings.set("demonlord", key, defaultValue);
    }
  
    async _updateObject(event, formData) {
      for (let [k, v] of Object.entries(foundry.utils.flattenObject(formData))) {
        let s = game.settings.settings.get(`demonlord.${k}`);
        let current = game.user.isGM
          ? game.settings.get('demonlord', s.key)
          : game.user.getFlag('demonlord', k);
        if (v === current) continue;
        await game.settings.set('demonlord', s.key, v);
      }
    }

    async activateListeners(html) {
      super.activateListeners(html);
      html.find('button').on('click', async (event) => {
        if (event.currentTarget?.dataset?.action === 'reset') {
          const keys = ['colourBoBDieDSN', 'boonColour','baneColour','replaced3'];
            await Promise.all(
              keys.map(async (key) => {
                await this.resetToDefault(key);
              })
            );
          this.close();
        }
      });
    }
}

export class OptionalRulesSettings extends FormApplication {
  constructor() {
    super()
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'optionalrules-settings',
      title: game.i18n.localize('DL.SettingOptionalRulesLabel'),
      template: 'systems/demonlord/templates/setting/optionalrules.hbs',
      width: 720,
    })
  }

  getData() {
    return {
      optinalRuleConsistentDamage: game.settings.get('demonlord', 'optinalRuleConsistentDamage'),
      optionalRuleDieRollsMode: game.settings.get('demonlord', 'optionalRuleDieRollsMode'),
      selectedDieRollsDropDrown: game.settings.get('demonlord', 'optionalRuleDieRollsMode'),
      dieRollsDropDrown: {
        d: game.i18n.localize('DL.SettingOptionalRuleBellStandardRolls'),
        b: game.i18n.localize('DL.SettingOptionalRuleBellCurveRolls'),
        s: game.i18n.localize('DL.SettingOptionalRuleStaticBoonsAndBanes'),
      },
      optionalRuleInitiativeMode : game.settings.get('demonlord', 'optionalRuleInitiativeMode'),
      selectedInitiativeMethodDropDrown : game.settings.get('demonlord', 'optionalRuleInitiativeMode'),
      initiativeMethodDropDrown: {
      s: game.i18n.localize('DL.SettingOptionalRuleInitiativeStd'),
      i: game.i18n.localize('DL.SettingOptionalRuleInitiativeInduvidual'),
      h: game.i18n.localize('DL.SettingOptionalRuleInitiativeGroup'),
      },
      optinalRuleRollInitEachRound: game.settings.get('demonlord', 'optinalRuleRollInitEachRound'),
      optinalRuleExceedsByFive: game.settings.get('demonlord', 'optinalRuleExceedsByFive'),
      horrifyingBane: game.settings.get("demonlord", "horrifyingBane"),      
      optinalRuleLevelDependentBane: game.settings.get('demonlord', 'optinalRuleLevelDependentBane')
    }
  }

  async resetToDefault(key) {
    const defaultValue = game.settings.settings.get(`demonlord.${key}`).default
    await game.settings.set('demonlord', key, defaultValue)
  }

  async _updateObject(event, formData) {
    for (let [k, v] of Object.entries(foundry.utils.flattenObject(formData))) {
      let s = game.settings.settings.get(`demonlord.${k}`)
      let current = game.settings.get('demonlord', s.key)
      if (v === current) continue
      await game.settings.set('demonlord', s.key, v)
    }
  }

  async activateListeners(html) {
    super.activateListeners(html)
    html.find('button').on('click', async event => {
      if (event.currentTarget?.dataset?.action === 'reset') {
        const keys = ['optinalRuleConsistentDamage', 'optionalRuleDieRollsMode','optionalRuleInitiativeMode','optinalRuleRollInitEachRound']
        await Promise.all(
          keys.map(async key => {
            await this.resetToDefault(key)
          }),
        )
        this.close()
      }
    })
  }
}

export const registerSettings = function () {
  game.settings.registerMenu('demonlord', 'advancedSettings', {
    name: game.i18n.localize('DL.SettingDSN'),
    label: game.i18n.localize('Configure'),
    hint: game.i18n.localize("DL.SettingDSNHint"),
    icon: 'fas fa-sliders-h',
    type: AdvancedSettings
  });

  game.settings.register('demonlord', 'colourBoBDieDSN', {
    name: game.i18n.localize('DL.SettingColourBoBDieDSNMessage'),
    hint: game.i18n.localize('DL.SettingColourBoBDieDSNMessageHint'),
    default: false,
    scope: 'client',
    type: Boolean,
    config: false,
  })

  game.settings.register('demonlord', 'boonColour', {
    name: game.i18n.localize('DL.SettingBoonDieColour'),
    scope: 'client',
    type: new foundry.data.fields.ColorField({ required: true, blank: false }),
    default: '#104f09',
    config: false
  })
  game.settings.register('demonlord', 'baneColour', {
    name: game.i18n.localize('DL.SettingBaneDieColour'),
    scope: 'client',
    type: new foundry.data.fields.ColorField({ required: true, blank: false }),
    default: '#bf0202',
    config: false
  })
  game.settings.register('demonlord', 'replaced3', {
    name: game.i18n.localize('DL.SettingDSN3d'),
    scope: 'client',
    type: Boolean,
    default: false,
    config: false,
    onChange: foundry.utils.debouncedReload
  })


  game.settings.registerMenu('demonlord', 'optinalRulesSettings', {
    name: game.i18n.localize('DL.SettingOptionalRules'),
    label: game.i18n.localize('Configure'),
    hint: game.i18n.localize('DL.SettingOptionalRulesHint'),
    icon: 'fas fa-sliders-h',
    type: OptionalRulesSettings,
    restricted: true
  })

  game.settings.register('demonlord', 'optinalRuleConsistentDamage', {
    name: game.i18n.localize('DL.SettingOptionalRuleConsistentDamage'),
    hint: game.i18n.localize('DL.SettingOptionalRuleConsistentDamageHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: false,
  })

  game.settings.register('demonlord', 'optinalRuleExceedsByFive', {
    name: game.i18n.localize('DL.SettingOptinalRuleExceedsByFive'),
    hint: game.i18n.localize('DL.SettingOptinalRuleExceedsByFiveDamageHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: false,
  })

  game.settings.register('demonlord', 'optinalRuleLevelDependentBane', {
    name: game.i18n.localize('DL.SettingOptinalRuleLevelDependentBane'),
    hint: game.i18n.localize('DL.SettingOptinalRuleLevelDependentBaneHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: false,
  })

  game.settings.register('demonlord', 'optionalRuleDieRollsMode', {
    name: game.i18n.localize('DL.SettingOptionalRuleDieRollsMode'),
    scope: 'world',
    type: String,
    config: false,
    default: 'd',
    choices: {
      d: game.i18n.localize('DL.disabled'),
      s: game.i18n.localize('DL.SettingOptionalRuleStaticBoonsAndBanes'),
      b: game.i18n.localize('DL.SettingOptionalRuleBellCurveRolls'),
    },
  })

  game.settings.register('demonlord', 'optionalRuleInitiativeMode', {
    name: game.i18n.localize('DL.SettingOptionalRuleInitiative'),
    scope: 'world',
    type: String,
    config: false,
    default: 's',
    choices: {
      s: game.i18n.localize('DL.SettingOptionalRuleInitiativeStd'),
      i: game.i18n.localize('DL.SettingOptionalRuleInitiativeInduvidual'),
      h: game.i18n.localize('DL.SettingOptionalRuleInitiativeGroup'),
    },
    onChange: foundry.utils.debouncedReload
  })

  game.settings.register('demonlord', 'optinalRuleRollInitEachRound', {
    name: game.i18n.localize('DL.SettingOptinalRuleRollInitEachRound'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: false,
  })

  game.settings.register('demonlord', 'systemMigrationVersion', {
    name: 'System Migration Version',
    scope: 'world',
    config: false,
    type: String,
    default: '',
  })
  game.settings.register('demonlord', 'lockAncestry', {
    name: game.i18n.localize('DL.SettingLockAncestry'),
    hint: game.i18n.localize('DL.SettingLockAncestrHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'initMessage', {
    name: game.i18n.localize('DL.SettingInitMessage'),
    hint: game.i18n.localize('DL.SettingInitMessageHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'initRandomize', {
    name: game.i18n.localize('DL.SettingInitRandomize'),
    hint: game.i18n.localize('DL.SettingInitRandomizeHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'attackShowAttack', {
    name: game.i18n.localize('DL.SettingAttackShowEnemyAttributeAtt'),
    hint: game.i18n.localize('DL.SettingAttackShowEnemyAttributeAttHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'attackShowDefense', {
    name: game.i18n.localize('DL.SettingAttackShowEnemyAttribute'),
    hint: game.i18n.localize('DL.SettingAttackShowEnemyAttributeHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'rollCreaturesToGM', {
    name: game.i18n.localize('DL.SettingRollCreaturesToGM'),
    hint: game.i18n.localize('DL.SettingRollCreaturesToGMHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'hideActorInfo', {
    name: game.i18n.localize('DL.SettingHideActorInfo'),
    hint: game.i18n.localize('DL.SettingHideActorInfoHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'statusIcons', {
    name: game.i18n.localize('DL.SettingStatusIcons'),
    hint: game.i18n.localize('DL.SettingStatusIconsHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'templateAutoTargeting', {
    name: game.i18n.localize('DL.SettingTemplateAutoTargeting'),
    hint: game.i18n.localize('DL.SettingTemplateAutoTargetingHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'replaceIcons', {
    name: game.i18n.localize('DL.SettingReplaceIcons'),
    hint: game.i18n.localize('DL.SettingReplaceIconsHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'convertIntoBadge', {
    name: game.i18n.localize('DL.SettingConvertIntoBadge'),
    hint: game.i18n.localize('DL.SettingConvertIntoBadgeHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'gmEffectsControls', {
    name: game.i18n.localize('DL.SettingGMEffectsControls'),
    hint: game.i18n.localize('DL.SettingGMEffectsControlsHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'targetingOnSelect', {
    name: game.i18n.localize('DL.SettingtargetingOnSelect'),
    hint: game.i18n.localize('DL.SettingtargetingOnSelectHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'templateAutoTargeting', {
    name: game.i18n.localize('DL.SettingTemplateAutoTargeting'),
    hint: game.i18n.localize('DL.SettingTemplateAutoTargetingHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'templateAutoRemove', {
    name: game.i18n.localize('DL.SettingTemplateAutoRemove'),
    hint: game.i18n.localize('DL.SettingTemplateAutoRemoveHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'autoDeleteEffects', {
    name: game.i18n.localize('DL.SettingAutoDeleteEffects'),
    hint: game.i18n.localize('DL.SettingAutoDeleteEffectsHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register('demonlord', 'confirmAncestryPathRemoval', {
    name: game.i18n.localize('DL.SettingConfirmAncestryPathRemoval'),
    hint: game.i18n.localize('DL.SettingConfirmAncestryPathRemovalHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
  })
  game.settings.register("demonlord", "horrifyingBane", {
    name: game.i18n.localize('DL.SettingHorrifyingBane'),
    hint: game.i18n.localize('DL.SettingHorrifyingBaneHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: false,
  })
  game.settings.register("demonlord", "concentrationEffect", {
    name: game.i18n.localize('DL.SettingConcentrationEffect'),
    hint: game.i18n.localize('DL.SettingConcentrationEffectHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
  })  
}
