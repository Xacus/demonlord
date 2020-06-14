// Import Modules
import {
    DL
} from "./config.js";
import {
    DemonlordActor
} from "./actor/actor.js";
import {
    DemonlordActorSheet
} from "./actor/actor-sheet.js";
import {
    DemonlordCreatureSheet
} from "./actor/creature-sheet.js";
import {
    DemonlordItem
} from "./item/item.js";
import {
    DemonlordItemSheet
} from "./item/item-sheet.js";

Hooks.once('init', async function () {

    game.demonlord = {
        DemonlordActor,
        DemonlordItem,
        rollItemMacro
    };

    // Define custom Entity classes
    CONFIG.DL = DL;
    CONFIG.Actor.entityClass = DemonlordActor;
    CONFIG.Item.entityClass = DemonlordItem;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("demonlord", DemonlordActorSheet, {
        types: ['character'],
        makeDefault: true
    });

    Actors.registerSheet("demonlord", DemonlordCreatureSheet, {
        types: ['creature'],
        makeDefault: true
    });

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("demonlord", DemonlordItemSheet, {
        makeDefault: true
    });

    // If you need to add Handlebars helpers, here are a few useful examples:
    Handlebars.registerHelper('concat', function () {
        var outStr = '';
        for (var arg in arguments) {
            if (typeof arguments[arg] != 'object') {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper('toLowerCase', function (str) {
        return str.toLowerCase();
    });

    preloadHandlebarsTemplates();
});

async function preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/demonlord/templates/tabs/combat.html",
        "systems/demonlord/templates/tabs/talents.html",
        "systems/demonlord/templates/tabs/magic.html",
        "systems/demonlord/templates/tabs/item.html",
        "systems/demonlord/templates/tabs/background.html",
    ];
    return loadTemplates(templatePaths);
}

Hooks.once("ready", async function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createDemonlordMacro(data, slot));
});

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */
Hooks.once("setup", function () {

    // Localize CONFIG objects once up-front
    const toLocalize = [
    "attributes"
  ];
    for (let o of toLocalize) {
        CONFIG.DL[o] = Object.entries(CONFIG.DL[o]).reduce((obj, e) => {
            obj[e[0]] = game.i18n.localize(e[1]);
            return obj;
        }, {});
    }
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createDemonlordMacro(data, slot) {
    if (data.type !== "Item") return;
    if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
    const item = data.data;

    // Create the macro command
    const command = `game.demonlord.rollItemMacro("${item.name}");`;
    let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: {
                "demonlord.itemMacro": true
            }
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find(i => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

    // Trigger the item roll
    return item.roll();
}
