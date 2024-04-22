export const registerSettings = function () {
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
  game.settings.register("demonlord", "diagonalMovement", {
    name: "DL.Setting.DiagonalRule",
    hint: "DL.Setting.DiagonalRuleHint",
    scope: "world",
    config: true,
    default: "111",
    type: String,
    choices: {
      111: "DL.Setting.DiagonalRuleStd",
      121: "DL.Setting.DiagonalRuleAlt",
      EUCL: "DL.Setting.DiagonalRuleEuc",
      MANH: "DL.Setting.DiagonalRuleManh"
    },
    onChange: rule => canvas.grid.diagonalRule = rule
  });  
}
