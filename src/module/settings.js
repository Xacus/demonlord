export const registerSettings = function () {
  game.settings.register('demonlord08', 'systemMigrationVersion', {
    name: 'System Migration Version',
    scope: 'world',
    config: false,
    type: String,
    default: '',
  });
  game.settings.register('demonlord08', 'useHomebrewMode', {
    name: game.i18n.localize('DL.SettingUsingHomebrewMode'),
    hint: game.i18n.localize('DL.SettingUsingHomebrewModeHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  });
  game.settings.register('demonlord08', 'lockAncestry', {
    name: game.i18n.localize('DL.SettingLockAncestry'),
    hint: game.i18n.localize('DL.SettingLockAncestrHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  });
  game.settings.register('demonlord08', 'initMessage', {
    name: game.i18n.localize('DL.SettingInitMessage'),
    hint: game.i18n.localize('DL.SettingInitMessageHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
  });
  game.settings.register('demonlord08', 'initRandomize', {
    name: game.i18n.localize('DL.SettingInitRandomize'),
    hint: game.i18n.localize('DL.SettingInitRandomizeHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  });
  game.settings.register('demonlord08', 'attackShowAttack', {
    name: game.i18n.localize('DL.SettingAttackShowEnemyAttributeAtt'),
    hint: game.i18n.localize('DL.SettingAttackShowEnemyAttributeAttHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
  });
  game.settings.register('demonlord08', 'attackShowDefense', {
    name: game.i18n.localize('DL.SettingAttackShowEnemyAttribute'),
    hint: game.i18n.localize('DL.SettingAttackShowEnemyAttributeHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  });
  game.settings.register('demonlord08', 'rollCreaturesToGM', {
    name: game.i18n.localize('DL.SettingRollCreaturesToGM'),
    hint: game.i18n.localize('DL.SettingRollCreaturesToGMHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
  });
  game.settings.register('demonlord08', 'reverseDamage', {
    name: game.i18n.localize('DL.SettingAttackReverseDamage'),
    hint: game.i18n.localize('DL.SettingAttackReverseDamageHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  });
  game.settings.register('demonlord08', 'statusIcons', {
    name: game.i18n.localize('DL.SettingStatusIcons'),
    hint: game.i18n.localize('DL.SettingStatusIconsHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  });
};
