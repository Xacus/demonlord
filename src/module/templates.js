/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    'systems/demonlord08/templates/tabs/character.html',
    'systems/demonlord08/templates/tabs/combat.html',
    'systems/demonlord08/templates/tabs/talents.html',
    'systems/demonlord08/templates/tabs/magic.html',
    'systems/demonlord08/templates/tabs/item.html',
    'systems/demonlord08/templates/tabs/background.html',
    'systems/demonlord08/templates/tabs/effects.html',
    'systems/demonlord08/templates/tabs/neweffects.html',
    'systems/demonlord08/templates/chat/challenge.html',
    'systems/demonlord08/templates/chat/combat.html',
    'systems/demonlord08/templates/chat/corruption.html',
    'systems/demonlord08/templates/chat/damage.html',
    'systems/demonlord08/templates/chat/description.html',
    'systems/demonlord08/templates/chat/heal.html',
    'systems/demonlord08/templates/chat/init.html',
    'systems/demonlord08/templates/chat/makechallengeroll.html',
    'systems/demonlord08/templates/chat/makeinitroll.html',
    'systems/demonlord08/templates/chat/rest.html',
    'systems/demonlord08/templates/chat/showtalent.html',
    'systems/demonlord08/templates/chat/spell.html',
    'systems/demonlord08/templates/chat/talent.html',
    'systems/demonlord08/templates/chat/useitem.html',
    'systems/demonlord08/templates/actor/actor-sheet.html',
    'systems/demonlord08/templates/actor/actor-sheet2.html',
    'systems/demonlord08/templates/actor/limited-sheet.html',
    'systems/demonlord08/templates/actor/sidemenu.html',
    'systems/demonlord08/templates/actor/limited-sidemenu.html',
    'systems/demonlord08/templates/actor/header.html',
    'systems/demonlord08/templates/actor/limited-header.html',
    'systems/demonlord08/templates/actor/creature-sheet.html',
    'systems/demonlord08/templates/dialogs/actor-modifiers-dialog.html',
    'systems/demonlord08/templates/dialogs/choose-turn-dialog.html',
    'systems/demonlord08/templates/dialogs/endofround-dialog.html',
    'systems/demonlord08/templates/actor/new-creature-sheet.html',
    'systems/demonlord08/templates/actor/new-creature-header.html',
    'systems/demonlord08/templates/actor/new-creature-sidemenu.html'
  ])
}
