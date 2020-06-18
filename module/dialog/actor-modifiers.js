export class DLActorModifiers extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'sheet-modifiers';
        options.classes = ["demonlord", "sheet", "actor"];
        options.template = 'systems/demonlord/templates/dialogs/actor-modifiers-dialog.html';
        options.width = 350;
        options.height = 350;
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

        html.find('.disable').click(ev => {
            html.find(`input[type=checkbox][id="active"]`).prop('checked', false);
        });

        html.find('.radioblockfast').click(ev => {
            this.updateTurnOrder(true);
        });

        html.find('.radioblock').click(ev => {
            this.updateTurnOrder(false);
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
            }
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
}
