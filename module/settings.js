export const registerSettings = function () {
    game.settings.register('demonlord', 'initMessage', {
        name: game.i18n.localize('DL.SettingInitMessage'),
        hint: game.i18n.localize('DL.SettingInitMessageHint'),
        default: true,
        scope: 'world',
        type: Boolean,
        config: true
    });
    game.settings.register('demonlord', 'initRandomize', {
        name: game.i18n.localize('DL.SettingInitRandomize'),
        hint: game.i18n.localize('DL.SettingInitRandomizeHint'),
        default: false,
        scope: 'world',
        type: Boolean,
        config: true
    });
};
