import {
    DemonlordActorSheet
} from './actor-sheet.js';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DemonlordCreatureSheet extends DemonlordActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["demonlord", "sheet", "actor", "creature"],
            template: "systems/demonlord/templates/actor/creature-sheet.html",
            width: 525,
            height: 550,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "combat"
            }]
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        data.dtypes = ["String", "Number", "Boolean"];
        for (let attr of Object.values(data.data.attributes)) {
            attr.isCheckbox = attr.dtype === "Boolean";
        }

        if (this.actor.data.type == 'creature') {
            this._prepareCreatureItems(data);
        }

        return data;
    }

    _prepareCreatureItems(sheetData) {
        const actorData = sheetData.actor;

        const weapons = [];
        const spells = [];
        const features = [];
        const specialactions = [];
        const magic = [];
        const endoftheround = [];
        const talents = [];

        for (let i of sheetData.items) {
            let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;

            if (i.type === 'feature') {
                features.push(i);
            } else if (i.type === 'weapon') {
                weapons.push(i);
            } else if (i.type === 'spell') {
                spells.push(i);
            } else if (i.type === 'specialaction') {
                specialactions.push(i);
            } else if (i.type === 'magic') {
                magic.push(i);
            } else if (i.type === 'endoftheround') {
                endoftheround.push(i);
            } else if (i.type === 'talent') {
                talents.push(i);
            }
        }

        actorData.weapons = weapons;
        actorData.spells = spells;
        actorData.features = features;
        actorData.specialactions = specialactions;
        actorData.magic = magic;
        actorData.endoftheround = endoftheround;
        actorData.talents = talents;
    }
}
