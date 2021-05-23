/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    'systems/demonlord/templates/tabs/activeeffects.html',
    'systems/demonlord/templates/tabs/afflictions.html',
    'systems/demonlord/templates/tabs/background.html',
    'systems/demonlord/templates/tabs/character.html',
    'systems/demonlord/templates/tabs/combat.html',
    'systems/demonlord/templates/tabs/creature-view.html',
    'systems/demonlord/templates/tabs/creature-edit.html',
    'systems/demonlord/templates/tabs/creatureeffects.html',
    'systems/demonlord/templates/tabs/effects.html',
    'systems/demonlord/templates/tabs/effectsoverview.html',
    'systems/demonlord/templates/tabs/item.html',
    'systems/demonlord/templates/tabs/magic.html',
    'systems/demonlord/templates/tabs/talents.html',
    'systems/demonlord/templates/chat/challenge.html',
    'systems/demonlord/templates/chat/combat.html',
    'systems/demonlord/templates/chat/corruption.html',
    'systems/demonlord/templates/chat/damage.html',
    'systems/demonlord/templates/chat/description.html',
    'systems/demonlord/templates/chat/heal.html',
    'systems/demonlord/templates/chat/init.html',
    'systems/demonlord/templates/chat/makechallengeroll.html',
    'systems/demonlord/templates/chat/makeinitroll.html',
    'systems/demonlord/templates/chat/rest.html',
    'systems/demonlord/templates/chat/showtalent.html',
    'systems/demonlord/templates/chat/spell.html',
    'systems/demonlord/templates/chat/talent.html',
    'systems/demonlord/templates/chat/useitem.html',
    'systems/demonlord/templates/actor/actor-sheet.html',
    'systems/demonlord/templates/actor/limited-sheet.html',
    'systems/demonlord/templates/actor/sidemenu.html',
    'systems/demonlord/templates/actor/limited-sidemenu.html',
    'systems/demonlord/templates/actor/header.html',
    'systems/demonlord/templates/actor/limited-header.html',
    'systems/demonlord/templates/dialogs/choose-turn-dialog.html',
    'systems/demonlord/templates/dialogs/endofround-dialog.html',
    'systems/demonlord/templates/actor/creature-sheet.html',
    'systems/demonlord/templates/actor/creature-header.html',
    'systems/demonlord/templates/actor/creature-sidemenu.html',
    'systems/demonlord/templates/item/active-effect-config.html',

    // Item Sheet Partials
    'systems/demonlord/templates/item/partial/item-activation.html',
    'systems/demonlord/templates/item/partial/item-description.html',
    'systems/demonlord/templates/item/partial/item-effects.html',
  ])
}
