export class DLActorModifiers extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'sheet-modifiers';
        options.classes = ["demonlord", "sheet", "actor"];
        options.template = 'systems/demonlord/templates/dialogs/actor-modifiers-dialog.html';
        options.width = 350;
        options.height = 500;
        return options;
    }
    /* -------------------------------------------- */
    /**
     * Add the Entity name into the window title
     * @type {String}
     */
    get title() {
        return `${this.object.name}: Actor Modifiers`;
    }
    /* -------------------------------------------- */

    /**
     * Construct and return the data object used to render the HTML template for this form application.
     * @return {Object}
     */
    getData() {
        const actor = this.object.data;
        const mods = this.object.getEmbeddedCollection("OwnedItem").filter(e => "mod" === e.type);

        return {
            actor,
            mods
        };
    }
    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;

        // Add Modifier Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Delete Modifier Item
        html.find('.item-delete').click(ev => {
            const liObj = ev.currentTarget.closest("li");
            const li = $(ev.currentTarget).parents(".form-line");

            this.showDeleteDialog(game.i18n.localize('DL.DialogAreYouSure'), game.i18n.localize('DL.DialogDeleteItemText'), li, liObj);
        });

        html.find('.disableafflictions').click(ev => {
            html.find(`input[type=checkbox][id^="data.afflictions"]`).prop('checked', false);
        });

        html.find('.disable').click(ev => {
            html.find(`input[type=checkbox][id="active"]`).prop('checked', false);
        });

        html.find('.radioblock').click(ev => {
            this.updateTurnOrder(false);
        });

        // Affliction Rules
        html.find('.radioblockfast').click(ev => {
            const slowed = html.find(`input[type=checkbox][id="data.afflictions.slowed"]`)[0];
            const frightened = html.find(`input[type=checkbox][id="data.afflictions.frightened"]`)[0];
            if (slowed.checked || frightened.checked) {
                html.find(`input[type=radio][id="data.fastturn.false"]`).prop('checked', true);
            }
            else {
                this.updateTurnOrder(true);
            }
        });

        html.find(`input[type=checkbox][id="data.afflictions.asleep"]`).click(ev => {
            if (ev.currentTarget.checked) {
                const prone = html.find(`input[type=checkbox][id="data.afflictions.prone"]`).prop('checked', true);
                const unconscious = html.find(`input[type=checkbox][id="data.afflictions.unconscious"]`).prop('checked', true);
            }
        });

        html.find(`input[type=checkbox][id="data.afflictions.frightened"]`).click(ev => {
            if (ev.currentTarget.checked) {
                html.find(`input[type=radio][id="data.fastturn.false"]`).prop('checked', true);
                this.updateTurnOrder(false);
            }
        });

        html.find(`input[type=checkbox][id="data.afflictions.slowed"]`).click(ev => {
            if (ev.currentTarget.checked) {
                html.find(`input[type=radio][id="data.fastturn.false"]`).prop('checked', true);
                this.updateTurnOrder(false);
            }
        });
    }

    /**
     * This method is called upon form submission after form data is validated
     * @param event {Event}       The initial triggering submission event
     * @param formData {Object}   The object of validated form data with which to update the object
     * @private
     */
    async _updateObject(event, formData) {
        const mods = this.object.getEmbeddedCollection("OwnedItem").filter(e => "mod" === e.type);
        const ids = [];
        const names = [];
        const active = [];
        const modtype = [];
        const modifiers = [];
        const rounds = [];
        const afflictions = [];

        // Fetch data from form
        for (const [k, v] of Object.entries(formData)) {
            if (k == "id") {
                if (Array.isArray(v)) {
                    for (let id of v) {
                        ids.push(id);
                    }
                } else {
                    ids.push(v);
                }
            } else if (k == "item.name") {
                if (Array.isArray(v)) {
                    for (let id of v) {
                        names.push(id);
                    }
                } else {
                    names.push(v);
                }
            } else if (k == "item.data.active") {
                if (Array.isArray(v)) {
                    for (let id of v) {
                        active.push(id);
                    }
                } else {
                    active.push(v);
                }
            } else if (k == "item.data.modtype") {
                if (Array.isArray(v)) {
                    for (let id of v) {
                        modtype.push(id);
                    }
                } else {
                    modtype.push(v);
                }
            } else if (k == "item.data.modifier") {
                if (Array.isArray(v)) {
                    for (let id of v) {
                        modifiers.push(id);
                    }
                } else {
                    modifiers.push(v);
                }
            } else if (k == "item.data.rounds") {
                if (Array.isArray(v)) {
                    for (let id of v) {
                        rounds.push(id);
                    }
                } else {
                    rounds.push(v);
                }
            } else if (k.includes("afflictions.asleep")) {
                await this.object.update({
                    "data.afflictions.asleep": v
                });
            }
            else if (k.includes("afflictions.blinded")) {
                await this.object.update({
                    "data.afflictions.blinded": v
                });
            }
            else if (k.includes("afflictions.charmed")) {
                await this.object.update({
                    "data.afflictions.charmed": v
                });
            }
            else if (k.includes("afflictions.compelled")) {
                await this.object.update({
                    "data.afflictions.compelled": v
                });
            }
            else if (k.includes("afflictions.dazed")) {
                await this.object.update({
                    "data.afflictions.dazed": v
                });
            }
            else if (k.includes("afflictions.deafened")) {
                await this.object.update({
                    "data.afflictions.deafened": v
                });
            }
            else if (k.includes("afflictions.defenseless")) {
                await this.object.update({
                    "data.afflictions.defenseless": v
                });
            }
            else if (k.includes("afflictions.diseased")) {
                await this.object.update({
                    "data.afflictions.diseased": v
                });
            }
            else if (k.includes("afflictions.fatigued")) {
                await this.object.update({
                    "data.afflictions.fatigued": v
                });
            }
            else if (k.includes("afflictions.frightened")) {
                if (v == true) {
                    await this.object.update({
                        "data.afflictions.frightened": v,
                        "data.fastturn": false
                    });
                } else {
                    await this.object.update({
                        "data.afflictions.frightened": v
                    });
                }
            }
            else if (k.includes("afflictions.grabbed")) {
                await this.object.update({
                    "data.afflictions.grabbed": v
                });
            }
            else if (k.includes("afflictions.immobilized")) {
                await this.object.update({
                    "data.afflictions.immobilized": v
                });
            }
            else if (k.includes("afflictions.impaired")) {
                await this.object.update({
                    "data.afflictions.impaired": v
                });
            }
            else if (k.includes("afflictions.poisoned")) {
                await this.object.update({
                    "data.afflictions.poisoned": v
                });
            }
            else if (k.includes("afflictions.prone")) {
                await this.object.update({
                    "data.afflictions.prone": v
                });
            }
            else if (k.includes("afflictions.slowed")) {
                if (v == true) {
                    await this.object.update({
                        "data.afflictions.slowed": v,
                        "data.fastturn": false
                    });
                } else {
                    await this.object.update({
                        "data.afflictions.slowed": v
                    });
                }
            }
            else if (k.includes("afflictions.stunned")) {
                await this.object.update({
                    "data.afflictions.stunned": v
                });
            }
            else if (k.includes("afflictions.surprised")) {
                await this.object.update({
                    "data.afflictions.surprised": v
                });
            }
            else if (k.includes("afflictions.unconscious")) {
                await this.object.update({
                    "data.afflictions.unconscious": v
                });
            }
        }

        // Afflictions: Asleep 
        if (this.object.data.data.afflictions.asleep) {
            await this.object.update({
                "data.afflictions.prone": true,
                "data.afflictions.unconscious": true
            });
        }

        // Update Mods     
        let i = 0;
        for (let mod of mods) {
            const update = {
                _id: mod._id,
                "name": names[i],
                "data.active": active[i],
                "data.modtype": modtype[i],
                "data.modifier": modifiers[i],
                "data.rounds": rounds[i]
            };

            await this.object.updateEmbeddedEntity("OwnedItem", update);

            i++;
        }

        this.object.update({
            formData
        });
        this.object.sheet.render(true);
    }

    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const data = duplicate(header.dataset);
        const name = `New ${type.capitalize()}`;

        const itemData = {
            name: name,
            type: type,
            data: data
        };

        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data["type"];

        await this.object.createOwnedItem(itemData);
        this.render(false);
    }

    deleteItem(li, liObject) {
        this.object.deleteOwnedItem(liObject.dataset.itemId);
        li.slideUp(200, () => this.render(false));
    }

    showDeleteDialog(title, content, item, liObject) {
        let d = new Dialog({
            title: title,
            content: content,
            buttons: {
                yes: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize('DL.DialogYes'),
                    callback: (html) => this.deleteItem(item, liObject)
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

    async updateTurnOrder(value) {
        await this.object.update({
            "data.fastturn": value
        });
    }

    async updateAfflictions(afflictions) {
        await this.object.update({
            "data.afflictions.asleep": afflictions[0],
            "data.afflictions.blinded": afflictions[1],
            "data.afflictions.charmed": afflictions[2],
            "data.afflictions.compelled": afflictions[3],
            "data.afflictions.dazed": afflictions[4],
            "data.afflictions.deafened": afflictions[5],
            "data.afflictions.defenseless": afflictions[6],
            "data.afflictions.diseased": afflictions[7],
            "data.afflictions.fatigued": afflictions[8],
            "data.afflictions.frightened": afflictions[9],
            "data.afflictions.grabbed": afflictions[10],
            "data.afflictions.immobilized": afflictions[11],
            "data.afflictions.impaired": afflictions[12],
            "data.afflictions.poisoned": afflictions[13],
            "data.afflictions.prone": afflictions[14],
            "data.afflictions.slowed": afflictions[15],
            "data.afflictions.stunned": afflictions[16],
            "data.afflictions.surprised": afflictions[17],
            "data.afflictions.unconscious": afflictions[18]
        });
    }
}
