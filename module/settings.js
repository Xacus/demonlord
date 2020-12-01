export const registerSettings = function () {
  game.settings.register('demonlord', 'systemMigrationVersion', {
    name: 'System Migration Version',
    scope: 'world',
    config: false,
    type: String,
    default: ''
  })
  game.settings.register('demonlord', 'useHomebrewMode', {
    name: game.i18n.localize('DL.SettingUsingHomebrewMode'),
    hint: game.i18n.localize('DL.SettingUsingHomebrewModeHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true
  })
  game.settings.register('demonlord', 'lockAncestry', {
    name: game.i18n.localize('DL.SettingLockAncestry'),
    hint: game.i18n.localize('DL.SettingLockAncestrHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true
  })
  game.settings.register('demonlord', 'initMessage', {
    name: game.i18n.localize('DL.SettingInitMessage'),
    hint: game.i18n.localize('DL.SettingInitMessageHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true
  })
  game.settings.register('demonlord', 'initRandomize', {
    name: game.i18n.localize('DL.SettingInitRandomize'),
    hint: game.i18n.localize('DL.SettingInitRandomizeHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true
  })
  game.settings.register('demonlord', 'attackShowAttack', {
    name: game.i18n.localize('DL.SettingAttackShowEnemyAttributeAtt'),
    hint: game.i18n.localize('DL.SettingAttackShowEnemyAttributeAttHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true
  })
  game.settings.register('demonlord', 'attackShowDefense', {
    name: game.i18n.localize('DL.SettingAttackShowEnemyAttribute'),
    hint: game.i18n.localize('DL.SettingAttackShowEnemyAttributeHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true
  })
  game.settings.register('demonlord', 'reverseDamage', {
    name: game.i18n.localize('DL.SettingAttackReverseDamage'),
    hint: game.i18n.localize('DL.SettingAttackReverseDamageHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true
  })
  game.settings.register('demonlord', 'usingChatPortraitModule', {
    name: game.i18n.localize('DL.SettingUsingChatPortraitModule'),
    hint: game.i18n.localize('DL.SettingUsingChatPortraitModuleHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true
  })
}
