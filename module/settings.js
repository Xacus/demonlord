export const registerSettings = function () {
    game.settings.register('demonlord', 'initMessage', {
        name: game.i18n.localize('DL.SettingInitMessage'),
        hint: game.i18n.localize('DL.SettingInitMessageHint'),
        default: true,
        scope: 'world',
        type: Boolean,
        config: true
    });
};
