// Import Modules
import { DL } from './config.js';
import { DemonlordActor } from './actor/actor.js';
import { DemonlordActorSheet } from './actor/sheets/actor-sheet.js';
import { DemonlordActorSheet2 } from './actor/sheets/actor-sheet2.js';
import { DemonlordCreatureSheet } from './actor/sheets/creature-sheet.js';
import { DemonlordNewCreatureSheet } from './actor/sheets/new-creature-sheet.js';
import { DemonlordItem } from './item/item.js';
import { DemonlordItemSheetDefault } from './item/sheets/item-sheet2.js';
import { DemonlordPathSetup } from './item/path-setup.js';
import { ActionTemplate } from './item/action-template.js';
import { registerSettings } from './settings.js';
import { rollInitiative, startCombat, nextTurn, setupTurns } from './init/init.js';
import combattracker, { _onUpdateCombat } from './combattracker.js';
import { preloadHandlebarsTemplates } from './templates.js';
import * as migrations from './migration.js';
import * as macros from './macros.js';
import * as playertracker from './playertrackercontrol.js';
import { capitalize } from './utils/utils';
import { DLAfflictions } from './active-effects/afflictions';
import { DLActiveEffectConfig } from './active-effects/sheets/active-effect-config';

Hooks.once('init', async function () {
  game.demonlord = {
    content: {
      DemonlordActor,
      DemonlordItem,
    },
    canvas: {
      ActionTemplate,
    },
    migrations: migrations,
    macros: macros,
    rollWeaponMacro: macros.rollWeaponMacro,
    rollTalentMacro: macros.rollTalentMacro,
    rollSpellMacro: macros.rollSpellMacro,
    rollAttributeMacro: macros.rollAttributeMacro,
    rollInitMacro: macros.rollInitMacro,
    healingPotionMacro: macros.healingPotionMacro,
  };

  CONFIG.MeasuredTemplate.defaults.angle = 53.13;

  // Define custom Entity classes
  CONFIG.DL = DL;

  Combat.prototype.rollInitiative = rollInitiative;
  Combat.prototype.startCombat = startCombat;
  Combat.prototype.nextTurn = nextTurn;

  if (!isNewerVersion(game.data.version, '0.6.9')) {
    Combat.prototype.setupTurns = setupTurns;
  }

  CONFIG.Actor.documentClass = DemonlordActor;
  CONFIG.Item.documentClass = DemonlordItem;
  CONFIG.ActiveEffect.sheetClass = DLActiveEffectConfig;
  CONFIG.ui.combat = combattracker;
  CONFIG.time.roundTime = 10;
  // CONFIG.debug.hooks = true

  registerSettings();

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('demonlord08', DemonlordActorSheet2, {
    types: ['character'],
    makeDefault: true,
  });

  Actors.registerSheet('demonlord08', DemonlordNewCreatureSheet, {
    types: ['creature'],
    makeDefault: false,
  });

  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('demonlord08', DemonlordItemSheetDefault, {
    types: [
      'item',
      'feature',
      'spell',
      'talent',
      'weapon',
      'armor',
      'ammo',
      'specialaction',
      'endoftheround',
      'ancestry',
      'profession',
      'language',
    ],
    makeDefault: true,
  });
  Items.registerSheet('demonlord08', DemonlordPathSetup, {
    types: ['path'],
    makeDefault: true,
  });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function () {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] !== 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper('toUpperCase', (str) => str.toUpperCase());

  Handlebars.registerHelper('capitalize', (str) => capitalize(str));

  Handlebars.registerHelper('readonly', (val) => (val ? 'readonly' : ''));

  Handlebars.registerHelper('notreadonly', (val) => (val ? '' : 'readonly'));

  Handlebars.registerHelper('json', JSON.stringify);

  preloadHandlebarsTemplates();
});

Hooks.once('ready', async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => macros.createDemonlordMacro(data, slot));

  // Determine whether a system migration is required and feasible
  if (!game.user.isGM) return;
  const currentVersion = game.settings.get('demonlord08', 'systemMigrationVersion');

  const NEEDS_MIGRATION_VERSION = '1.7.7';
  const COMPATIBLE_MIGRATION_VERSION = 0.8;

  const needsMigration = currentVersion && isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);
  if (!needsMigration && currentVersion != '') return;

  // Perform the migration
  if (currentVersion && isNewerVersion(COMPATIBLE_MIGRATION_VERSION, currentVersion)) {
    const warning =
      'Your Demonlord system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.';
    ui.notifications.error(warning, { permanent: true });
  }

  migrations.migrateWorld();
});

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */
Hooks.once('setup', function () {
  // Localize CONFIG objects once up-front
  const toLocalize = ['attributes'];
  for (const o of toLocalize) {
    CONFIG.DL[o] = Object.entries(CONFIG.DL[o]).reduce((obj, e) => {
      obj[e[0]] = game.i18n.localize(e[1]);
      return obj;
    }, {});
  }

  const effects = DLAfflictions.buildAll();

  if (!game.settings.get('demonlord08', 'statusIcons')) {
    for (const effect of CONFIG.statusEffects) {
      effects.push({
        id: effect.id,
        label: effect.label,
        icon: effect.icon,
      });
    }
  }

  CONFIG.statusEffects = effects;

  // Set active effect keys-labels
  DLActiveEffectConfig.initializeChangeKeys()
});

/**
 * Set default values for new actors' tokens
 */
Hooks.on('preCreateActor', (createData, changes) => {
  let disposition = CONST.TOKEN_DISPOSITIONS.NEUTRAL;

  if (createData.type == 'creature') {
    disposition = CONST.TOKEN_DISPOSITIONS.HOSTILE;
  }

  mergeObject(changes, {
    'token.bar1': { attribute: 'characteristics.health' }, // Default Bar 1 to Health
    //'token.bar2': { attribute: 'characteristics.insanity' }, // Default Bar 2 to Insanity
    'token.displayName': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER, // Default display name to be on owner hover
    'token.displayBars': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER, // Default display bars to be on owner hover
    'token.disposition': disposition, // Default disposition to neutral
    'token.name': createData.name, // Set token name to actor name
  });

  // Default characters to HasVision = true and Link Data = true
  if (createData.type == 'character') {
    changes.token.vision = true;
    changes.token.actorLink = true;
  }
});

Hooks.on('createToken', async (tokenDocument) => {
  return 0;
});

Hooks.on('updateActor', async (actor, updateData) => {
  if (updateData.data && (game.user.isGM || actor.isOwner)) {
    if (game.combat) {
      for (const combatant of game.combat.combatants) {
        let init = 0;

        if (combatant.actor == actor) {
          if (actor.data.type == 'character') {
            init = actor.data.data.fastturn ? 70 : 30;
          } else {
            init = actor.data.data.fastturn ? 50 : 10;
          }

          game.combat.setInitiative(combatant.id, init);
        }
      }
    }
  }
});

Hooks.on('createActiveEffect', async (activeEffect) => {
  const statusId = activeEffect.data.flags?.core?.statusId;
  const parent = activeEffect?.parent;
  if (statusId && parent) {
    await parent.setFlag('demonlord08', statusId, true)

    // If asleep, also add prone and uncoscious
    if (statusId === 'asleep') {
      if (!parent.effects.find((e) => e.data.flags?.core?.statusId === 'prone')) {
        const prone = CONFIG.statusEffects.find((e) => e.id === 'prone');
        prone['flags.core.statusId'] = 'prone';
        await ActiveEffect.create(prone, { parent: parent });
      }

      if (!parent.effects.find((e) => e.data.flags?.core?.statusId === 'unconscious')) {
        const unconscious = CONFIG.statusEffects.find((e) => e.id === 'unconscious');
        unconscious['flags.core.statusId'] = 'unconscious';
        await ActiveEffect.create(unconscious, { parent: parent });
      }
    }
  }
});

Hooks.on('deleteActiveEffect', async (activeEffect) => {
  const statusId = activeEffect.data.flags?.core?.statusId;
  const parent = activeEffect?.parent;
  if (statusId && parent) {
    await parent.unsetFlag('demonlord08', statusId)

    // If asleep, also remove prone and uncoscious
    if (statusId === 'asleep') {
      const prone = parent.effects.find((e) => e.data.flags?.core?.statusId === 'prone');
      await prone?.delete();

      const unconscious = parent.effects.find((e) => e.data.flags?.core?.statusId === 'unconscious');
      await unconscious?.delete();
    }
  }
});

Hooks.on('updateCombat', _onUpdateCombat);

Hooks.on('renderChatLog', (app, html, data) => DemonlordItem.chatListeners(html));

Hooks.on('renderChatMessage', async (app, html, msg) => {
  var actor = loadActorForChatMessage(msg.message.speaker);

  /*
    const regex = /(\d+)?d(\d+)([\+\-]\d+)?/ig;
    const text = html.find(".message-content")[0].innerHTML;
    const found = text.match(regex);
    var rrr = text.replace(found[1], "<a href=''>" + found[1] + "</a>");
    html.find(".message-content").replaceWith(rrr);
    */

  if (actor && actor.data?.type === 'character') {
    let path = actor.data.data.paths.master != '' ? actor.data.data.paths.master : '';
    path = actor.data.data.paths.expert != '' ? actor.data.data.paths.expert : '';
    path = actor.data.data.paths.novice;

    html.find('.showlessinfo').prepend(actor.data.data.ancestry + ', ' + path);
  }

  if (!game.user.isGM) {
    html.find('.gmonly').remove();
    html.find('.gmonlyzero').remove();
  } else {
    html.find('.gmremove').remove();

    if (actor && actor.data?.type === 'creature') {
      let status = 'Size ' + actor.data.data.characteristics.size + ' ' + actor.data.data.descriptor;
      if (actor.data.data.frightening) {
        status += ', ' + game.i18n.localize('DL.CreatureFrightening');
      }
      if (actor.data.data.horrifying) {
        status += ', ' + game.i18n.localize('DL.CreatureHorrifying');
      }

      html.find('.showlessinfo').prepend(status);
    }
  }
});

Hooks.once('diceSoNiceReady', (dice3d) => {
  dice3d.addSystem({ id: 'demonlord08', name: 'Demonlord' }, true);
  dice3d.addDicePreset({
    type: 'd6',
    labels: ['1', '2', '3', '4', '5', 'systems/demonlord08/ui/icons/logo.png'],
    system: 'demonlord08',
  });
  dice3d.addDicePreset({
    type: 'd20',
    labels: [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      'systems/demonlord08/ui/icons/logo.png',
    ],
    system: 'demonlord08',
  });
  dice3d.addColorset({
    name: 'demonlord08',
    description: 'Special',
    category: 'Demonlord',
    foreground: '#f2f2f2',
    background: '#6F0000',
    outline: '#651320',
    edge: '#020202',
    texture: 'marble',
    default: true,
  });
});

Hooks.once('dragRuler.ready', (SpeedProvider) => {
  class DemonLordSpeedProvider extends SpeedProvider {
    get colors() {
      return [
        { id: 'walk', default: 0x00ff00, name: 'demonlord.speeds.walk' },
        { id: 'rush', default: 0xffff00, name: 'demonlord.speeds.rush' },
      ];
    }

    getSpeedModifier(token) {
      const itemsHeavy = token.actor.items.filter(
        (item) => Number(item.data.data.strengthmin) > token.actor.data.data.attributes.strength.value,
      );
      if (itemsHeavy.length > 0) {
        return -2;
      }
      return 0;
    }

    getRanges(token) {
      const baseSpeed = token.actor.data.data.characteristics.speed + this.getSpeedModifier(token);
      const ranges = [
        { range: baseSpeed, color: 'walk' },
        { range: baseSpeed * 2, color: 'rush' },
      ];
      return ranges;
    }
  }

  dragRuler.registerSystem('demonlord', DemonLordSpeedProvider);
});

function loadActorForChatMessage(speaker) {
  var actor;
  if (speaker.token) {
    actor = game.actors.tokens[speaker.token];
  }
  if (!actor) {
    actor = game.actors.get(speaker.actor);
  }
  if (!actor) {
    game.actors.forEach((value) => {
      if (value.name === speaker.alias) {
        actor = value;
      }
    });
  }
  return actor;
}
