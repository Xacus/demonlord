import {
    DLActorModifiers
} from "../dialog/actor-modifiers.js";
import { CharacterBuff } from "../buff.js";
export class DemonlordActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["demonlord", "sheet", "actor"],
            template: "systems/demonlord/templates/actor/actor-sheet.html",
            width: 610,
            height: 700,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "combat"
            }]
        });
    }

    /**
     * Extend and override the sheet header buttons
     * @override
     */
    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        const canConfigure = game.user.isGM || this.actor.owner;
        if (this.options.editable && canConfigure) {
            buttons = [
                {
                    label: 'Actor Mods',
                    class: 'configure-actor',
                    icon: 'fas fa-dice',
                    onclick: (ev) => this._onConfigureActor(ev),
                },
            ].concat(buttons);
        }
        return buttons;
    }
    /* -------------------------------------------- */

    _onConfigureActor(event) {
        event.preventDefault();
        new DLActorModifiers(this.actor, {
            top: this.position.top + 40,
            left: this.position.left + (this.position.width - 400) / 2,
        }).render(true);
    }

    async _updateObject(event, formData) {
        const actor = this.object;
        const updateData = expandObject(formData);

        await actor.update(updateData, { diff: false });
    }

    /** @override */
    getData() {
        const data = super.getData();
        data.dtypes = ["String", "Number", "Boolean"];
        for (let attr of Object.values(data.data.attributes)) {
            attr.isCheckbox = attr.dtype === "Boolean";
        }

        // Prepare items.
        if (this.actor.data.type == 'character') {
            this._prepareCharacterItems(data);
            this._prepareSpellBook(data.actor);
        }

        return data;
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareCharacterItems(sheetData) {
        const actorData = sheetData.actor;

        // Initialize containers.
        const gear = [];
        const features = [];
        const spells = [];
        const weapons = [];
        const armor = [];
        const ammo = [];
        const talents = [];
        const mods = [];
        const ancestry = [];

        // Iterate through items, allocating to containers
        // let totalWeight = 0;
        for (let i of sheetData.items) {
            let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;

            if (i.type === 'item') {
                gear.push(i);
            } else if (i.type === 'feature') {
                features.push(i);
            } else if (i.type === 'spell') {
                spells.push(i);
            } else if (i.type === 'weapon') {
                weapons.push(i);
            } else if (i.type === 'armor') {
                armor.push(i);
            } else if (i.type === 'ammo') {
                ammo.push(i);
            } else if (i.type === 'talent') {
                talents.push(i);
            } else if (i.type === 'mod') {
                mods.push(i);
            } else if (i.type === 'ancestry') {
                ancestry.push(i);
            }
        }

        // Assign and return
        actorData.gear = gear;
        actorData.features = features;
        actorData.spells = spells;
        actorData.weapons = weapons;
        actorData.armor = armor;
        actorData.ammo = ammo;
        actorData.talents = talents;
        actorData.mods = mods;
        actorData.ancestry = ancestry;


        if (ancestry.length == 0) {
            const itemData = {
                name: "Ancestry",
                type: "ancestry",
                data: null
            };

            ancestry.push(this.actor.createOwnedItem(itemData));
        }
    }

    /* -------------------------------------------- */

    _prepareSpellBook(actorData) {
        var dictTraditions = [];
        var dictSpells = [];

        for (let spell of actorData.spells) {
            if (spell.data.traditionid) {
                let tradition = this.actor.getOwnedItem(spell.data.traditionid);
                if (tradition) {
                    dictTraditions[spell.data.traditionid] = tradition;
                    dictSpells.push(spell);
                }
            } else {
                dictTraditions[spell._id] = spell;
            }
        }

        actorData.spells = [];

        for (let [key, tradition] of Object.entries(dictTraditions)) {
            actorData.spells.push(tradition);

            for (let spell of dictSpells) {
                if (key == spell.data.traditionid) {
                    actorData.spells.push(spell);
                }
            }
        }
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Toggle Spell Info
        html.find('.toggleInfo').click(ev => {
            const div = ev.currentTarget;
            const parent = div.parentElement;
            if (parent.children[6].style.display === "none") {
                parent.children[6].style.display = "block";
            } else {
                parent.children[6].style.display = "none";
            }
        });

        // Edit Creature
        html.find('.creature-edit').click(ev => {
            const actor = this.actor;

            let showEdit = actor.data.data.edit;
            if (showEdit) {
                actor.data.data.edit = false;
            } else {
                actor.data.data.edit = true;
            }

            let that = this;
            actor.update({
                "data.edit": actor.data.data.edit
            }).then(item => {
                that.render();
            });
        });

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.getOwnedItem(li.data("itemId"));
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");

            this.showDeleteDialog(game.i18n.localize('DL.DialogAreYouSure'), game.i18n.localize('DL.DialogDeleteItemText'), li);
        });

        // View Talent
        html.find('.item-view').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const talent = this.actor.getOwnedItem(li.data("itemId")).data;
            let usesText = "";

            if (parseInt(talent.data?.uses?.value) >= 0 && parseInt(talent.data?.uses?.max) > 0) {
                let uses = parseInt(talent.data.uses?.value);
                let usesmax = parseInt(talent.data.uses?.max);
                usesText = game.i18n.localize('DL.TalentUses') + ": " + uses + " / " + usesmax;
            }

            var templateData = {
                actor: this.actor,
                item: {
                    name: talent.name
                },
                data: {
                    id: {
                        value: talent._id
                    },
                    effects: {
                        value: this.actor.buildTalentEffects(talent, false, "TALENT")
                    },
                    description: {
                        value: talent.data.description
                    },
                    uses: {
                        value: usesText
                    }
                }
            };

            let chatData = {
                user: game.user._id,
                speaker: {
                    actor: this.actor._id,
                    token: this.actor.token,
                    alias: this.actor.name
                }
            };

            chatData["whisper"] = ChatMessage.getWhisperRecipients(this.actor.name);

            let template = 'systems/demonlord/templates/chat/showtalent.html';
            renderTemplate(template, templateData).then(content => {
                chatData.content = content;
                ChatMessage.create(chatData);
            });
        });

        // Update Inventory Item
        html.find('.item-wear').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", li.data("itemId")))

            item.data.wear = false;
            this.actor.updateEmbeddedEntity('OwnedItem', item);
        });
        html.find('.item-wearoff').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", li.data("itemId")))

            item.data.wear = true;
            this.actor.updateEmbeddedEntity('OwnedItem', item);
        });

        // Update Feature Item
        html.find('.feature-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".feature");
            const item = this.actor.getOwnedItem(li.data("itemId"));
            item.sheet.render(true);
        });

        // Delete Feature Item
        html.find('.feature-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".feature");

            this.showDeleteDialog(game.i18n.localize('DL.DialogAreYouSure'), game.i18n.localize('DL.DialogDeleteFeatureText'), li);
        });

        // Add Tradition Item
        html.find('.tradition-create').click(this._onTraditionCreate.bind(this));

        html.find('.tradition-edit').click(ev => {
            const li = event.currentTarget.closest("li");
            const item = this.actor.getOwnedItem(li.dataset.itemId);

            let showEdit = item.data.data.edit;
            if (showEdit) {
                item.data.data.edit = false;
            } else {
                item.data.data.edit = true;
            }

            let that = this;
            item.update({
                "data.spell.edit": item.data.data.edit
            }).then(item => {
                that.render();
            });
        });

        html.find('.tradition-focus').focusout(ev => {
            let newName = ev.target.value;
            const li = ev.currentTarget.closest("li");
            const item = this.actor.getOwnedItem(li.dataset.itemId);

            let showEdit = item.data.data.edit;
            if (showEdit) {
                item.data.data.edit = false;
            } else {
                item.data.data.edit = true;
            }

            let that = this;
            item.update({
                "name": newName,
                "data.spell.edit": item.data.data.edit
            }).then(item => {
                that.render();
            });
        });

        html.find('.tradition-focus').change(ev => {
            let newName = ev.target.value;
            const li = ev.currentTarget.closest("li");
            const item = this.actor.getOwnedItem(li.dataset.itemId);

            let showEdit = item.data.data.edit;
            if (showEdit) {
                item.data.data.edit = false;
            } else {
                item.data.data.edit = true;
            }

            let that = this;
            item.update({
                "name": newName,
                "data.spell.edit": item.data.data.edit
            }).then(item => {
                that.render();
            });
        });

        html.find('.tradition-delete').click(ev => {
            const li = $(ev.currentTarget).parents("li");

            this.showDeleteDialog(game.i18n.localize('DL.DialogAreYouSure'), game.i18n.localize('DL.DialogDeleteTraditionText'), li);
        });

        // Wealth
        html.find('.wealth-edit').click(ev => {
            const actor = this.actor;

            let showEdit = actor.data.data.wealth.edit;
            if (showEdit) {
                actor.data.data.wealth.edit = false;
            } else {
                actor.data.data.wealth.edit = true;
            }

            let that = this;
            actor.update({
                "data.wealth.edit": actor.data.data.wealth.edit
            }).then(item => {
                that.render();
            });
        });

        // Paths
        html.find('.paths-edit').click(ev => {
            const actor = this.actor;

            let showEdit = actor.data.data.paths.edit;
            if (showEdit) {
                actor.data.data.paths.edit = false;
            } else {
                actor.data.data.paths.edit = true;
            }

            let that = this;
            actor.update({
                "data.paths.edit": actor.data.data.paths.edit
            }).then(item => {
                that.render();
            });
        });

        // Profession
        html.find('.profession-edit').click(ev => {
            const actor = this.actor;

            let showEdit = actor.data.data.professions.edit;
            if (showEdit) {
                actor.data.data.professions.edit = false;
            } else {
                actor.data.data.professions.edit = true;
            }

            let that = this;
            actor.update({
                "data.professions.edit": actor.data.data.professions.edit
            }).then(item => {
                that.render();
            });
        });


        // Religion
        html.find('.religion-edit').click(ev => {
            const actor = this.actor;

            let showEdit = actor.data.data.religion.edit;
            if (showEdit) {
                actor.data.data.religion.edit = false;
            } else {
                actor.data.data.religion.edit = true;
            }

            let that = this;
            actor.update({
                "data.religion.edit": actor.data.data.religion.edit
            }).then(item => {
                that.render();
            });
        });

        // Languages
        html.find('.languages-edit').click(ev => {
            const actor = this.actor;

            let showEdit = actor.data.data.languages.edit;
            if (showEdit) {
                actor.data.data.languages.edit = false;
            } else {
                actor.data.data.languages.edit = true;
            }

            let that = this;
            actor.update({
                "data.languages.edit": actor.data.data.languages.edit
            }).then(item => {
                that.render();
            });
        });

        // Add Spell Item
        html.find('.spell-create').click(this._onSpellCreate.bind(this));

        html.find('.spell-edit').click(ev => {
            const liSpell = $(ev.currentTarget).parents(".item");
            const item = this.actor.getOwnedItem(liSpell.data("itemId"));

            item.sheet.render(true);
        });

        html.find('.spell-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");

            this.showDeleteDialog(game.i18n.localize('DL.DialogAreYouSure'), game.i18n.localize('DL.DialogDeleteSpellText'), li);
        });

        // Rollable
        html.find('.rollable').click(this._onRoll.bind(this));

        // Attibute Checks
        html.find('.ability-name').click(ev => {
            let abl = ev.currentTarget.parentElement.getAttribute('data-ability');
            this.actor.rollAbility(abl);
        });

        html.find('.ammo-amount').click(ev => {
            const li = event.currentTarget.closest(".item");
            const item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", li.dataset.itemId))
            let amount = item.data.amount;

            if (amount > 0) {
                item.data.amount = Number(amount) - 1;
            }

            this.actor.updateEmbeddedEntity('OwnedItem', item);
        });

        html.find('.talent-uses').click(ev => {
            const li = event.currentTarget.closest(".item");
            const item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", li.dataset.itemId))
            let uses = item.data.uses.value;
            let usesmax = item.data.uses.max;

            if (uses < usesmax) {
                item.data.uses.value = Number(uses) + 1;
                item.data.addtonextroll = true;
            } else {
                item.data.uses.value = 0;
                item.data.addtonextroll = false;
                this.actor.removeCharacterBonuses(item);
            }

            this.actor.updateEmbeddedEntity('OwnedItem', item);
        });

        html.find('.spell-uses').click(ev => {
            const li = event.currentTarget.closest(".item");
            const item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", li.dataset.itemId))
            let uses = item.data.castings.value;
            let usesmax = item.data.castings.max;

            if (uses < usesmax) {
                item.data.castings.value = Number(uses) + 1;
            } else {
                item.data.castings.value = 0;
            }

            this.actor.updateEmbeddedEntity('OwnedItem', item);
        });

        // Rollable Attributes
        html.find('.attribute-roll').click(ev => {
            const div = $(ev.currentTarget);
            const attributeName = div.data("key");
            const attribute = this.actor.data.data.attributes[attributeName];
            this.actor.rollChallenge(attribute);
        });

        // Rollable Attack
        html.find('.attack-roll').click(ev => {
            const li = event.currentTarget.closest(".item");
            this.actor.rollWeaponAttack(li.dataset.itemId, { event: event });
        });

        // Rollable Talent
        html.find('.talent-roll').click(ev => {
            const li = event.currentTarget.closest(".item");
            this.actor.rollTalent(li.dataset.itemId, { event: event });
        });

        // Rollable Attack Spell
        html.find('.magic-roll').click(ev => {
            const li = event.currentTarget.closest(".item");
            this.actor.rollSpell(li.dataset.itemId, { event: event });
        });

        html.find('.rest-char').click(ev => {
            // Talents
            const talents = this.actor.getEmbeddedCollection("OwnedItem").filter(e => "talent" === e.type)

            for (let talent of talents) {
                const item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", talent._id))
                item.data.uses.value = 0;

                this.actor.updateEmbeddedEntity("OwnedItem", item);
            }

            // Spells
            const spells = this.actor.getEmbeddedCollection("OwnedItem").filter(e => "spell" === e.type)

            for (let spell of spells) {
                const item = duplicate(this.actor.getEmbeddedEntity("OwnedItem", spell._id))

                item.data.castings.value = 0;

                this.actor.updateEmbeddedEntity("OwnedItem", item);
            }
        });

        // Talent: Options
        html.find(`input[type=checkbox][id^="option"]`).click(ev => {
            const div = ev.currentTarget.closest(".option");
            const field = ev.currentTarget.name;
            const update = {
                _id: div.dataset.itemId,
                [field]: ev.currentTarget.checked
            };

            this.actor.updateEmbeddedEntity("OwnedItem", update);
        });

        // Drag events for macros.
        if (this.actor.owner) {
            let handler = ev => this._onDragItemStart(ev);
            html.find('li.dropitem').each((i, li) => {
                if (li.classList.contains("inventory-header")) return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
        }
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemCreate(event) {
        event.preventDefault();

        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data
        };

        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data["type"];

        // Finally, create the item!
        return this.actor.createOwnedItem(itemData);
    }

    _onTraditionCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New Tradition`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data
        };

        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data["type"];
        return this.actor.createOwnedItem(itemData);
    }

    _onSpellCreate(event) {
        event.preventDefault();

        const li = event.currentTarget.closest("li");
        const tradition = this.actor.getOwnedItem(li.dataset.itemId);

        //arr.splice(2, 0, "Lene");

        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        data.traditionid = li.dataset.itemId;
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data
        };

        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data["type"];

        return this.actor.createOwnedItem(itemData);
    }

    deleteItem(item) {
        this.actor.deleteOwnedItem(item.data("itemId"));
        item.slideUp(200, () => this.render(false));
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.roll) {
            let roll = new Roll(dataset.roll, this.actor.data.data);
            let label = dataset.label ? `Rolling ${dataset.label}` : '';
            roll.roll().toMessage({
                speaker: ChatMessage.getSpeaker({
                    actor: this.actor
                }),
                flavor: label
            });
        }
    }

    showDeleteDialog(title, content, item) {
        let d = new Dialog({
            title: title,
            content: content,
            buttons: {
                yes: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize('DL.DialogYes'),
                    callback: (html) => this.deleteItem(item)
                },
                no: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize('DL.DialogNo'),
                    callback: () => { }
                }
            },
            default: "no",
            close: () => { }
        });
        d.render(true);
    }
}