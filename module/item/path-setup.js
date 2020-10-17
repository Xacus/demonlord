/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
import {
    PathLevel
} from "../pathlevel.js";
export class DemonlordPathSetup extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["demonlord2", "sheet", "item"],
            width: 620,
            height: 550,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "attributes"
            }]
        });
    }

    /** @override */
    get template() {
        const path = "systems/demonlord/templates/item";
        return `${path}/path-setup.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();

        if (this.item.data.type == 'path') {
            this._prepareLevels(data);
        }

        return data;
    }

    _prepareLevels(data) {
        const itemData = data.item;
        const levels = [];

        for (let level of itemData.data.levels) {
            levels.push(level);
        }

        itemData.levels = levels;
    }

    /* -------------------------------------------- */

    /** @override */
    setPosition(options = {}) {
        const position = super.setPosition(options);
        const sheetBody = this.element.find(".sheet-body");
        const bodyHeight = position.height - 125;
        sheetBody.css("height", bodyHeight);
        return position;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        html.find('.add-level').click(ev => {
            this.addLevel(ev);
        });

        html.find('.delete-level').click(ev => {
            const itemIndex = ev.currentTarget.parentElement.parentElement.getAttribute('data-item-id');
            this.showDeleteDialog(game.i18n.localize('DL.PathsLevelDeleteDialogDeleteLevel'), game.i18n.localize('DL.PathsLevelDeleteDialogDeleteLevelText'), itemIndex)
        });

        // Add drag events.
        html.find('.drop-area')
            .on('dragover', this._onDragOver.bind(this))
            .on('dragleave', this._onDragLeave.bind(this))
            .on('drop', this._onDrop.bind(this));

        html.find('.delete-item').click(ev => {
            const itemLevel = ev.currentTarget.parentElement.parentElement.parentElement.getAttribute('data-level');
            const itemGroup = ev.currentTarget.parentElement.parentElement.parentElement.getAttribute('data-group');
            const itemIndex = ev.currentTarget.parentElement.getAttribute('data-item-id');

            this.deleteItem(itemLevel, itemGroup, itemIndex);
        });
    }

    async _onDragOver(ev) {
        let $self = $(ev.originalEvent.target);
        let $dropTarget = $self;
        $dropTarget.addClass('drop-hover');
        return false;
    }

    async _onDragLeave(ev) {
        let $self = $(ev.originalEvent.target);
        let $dropTarget = $self;
        $dropTarget.removeClass('drop-hover');
        return false;
    }

    async _onDrop(ev) {
        let $self = $(ev.originalEvent.target);
        let $dropTarget = $self;

        // Get data.
        let data;
        try {
            data = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'));
            if (data.type !== "Item") return;
        } catch (err) {
            return false;
        }

        let level = $dropTarget.data('level');
        let group = $dropTarget.data('group');
        this._addItem(data.id, level, group);

        $dropTarget.removeClass('drop-hover');
        return false;
    }

    async _addItem(itemId, level, group) {
        let itemData = duplicate(this.item.data);
        let item = game.items.get(itemId);

        switch (item.type) {
            case 'talent':
                let talents = itemData.data.levels[level]?.talents;
                talents.push(item);
                break;
            case 'spell':
                let spells = itemData.data.levels[level]?.spells;
                spells.push(item);
                break;
            default:
                break;
        }

        await this.item.update(itemData, { diff: false });
        this.render(true);
    }

    /**
     * This method is called upon form submission after form data is validated
     * @param event {Event}       The initial triggering submission event
     * @param formData {Object}   The object of validated form data with which to update the object
     * @private
     */
    async _updateObject(event, formData) {
        const item = this.object;
        const updateData = expandObject(formData);

        if (item.type == "path") {
            for (const [k, v] of Object.entries(formData)) {
                //console.log("k=" + k + ", v=" + v);
                if (k == "level.level") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].level = parseInt(id);
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].level = parseInt(v);
                    }
                } else if (k == "level.attributeSelect") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].attributeSelect = id;

                            if (id == "choosetwo") {
                                item.data.data.levels[index].attributeSelectIsChooseTwo = true;
                                item.data.data.levels[index].attributeSelectIsChooseThree = false;
                                item.data.data.levels[index].attributeSelectIsFixed = false;
                                item.data.data.levels[index].attributeSelectIsTwoSet = false;
                            } else if (id == "choosethree") {
                                item.data.data.levels[index].attributeSelectIsChooseTwo = false;
                                item.data.data.levels[index].attributeSelectIsChooseThree = true;
                                item.data.data.levels[index].attributeSelectIsFixed = false;
                                item.data.data.levels[index].attributeSelectIsTwoSet = false;
                            } else if (id == "fixed") {
                                item.data.data.levels[index].attributeSelectIsChooseTwo = false;
                                item.data.data.levels[index].attributeSelectIsChooseThree = false;
                                item.data.data.levels[index].attributeSelectIsFixed = true;
                                item.data.data.levels[index].attributeSelectIsTwoSet = false;
                            } else if (id == "twosets") {
                                item.data.data.levels[index].attributeSelectIsChooseTwo = false;
                                item.data.data.levels[index].attributeSelectIsChooseThree = false;
                                item.data.data.levels[index].attributeSelectIsFixed = false;
                                item.data.data.levels[index].attributeSelectIsTwoSet = true;
                            } else {
                                item.data.data.levels[index].attributeSelectIsChooseTwo = false;
                                item.data.data.levels[index].attributeSelectIsChooseThree = false;
                                item.data.data.levels[index].attributeSelectIsFixed = false;
                                item.data.data.levels[index].attributeSelectIsTwoSet = false;

                                item.data.data.levels[index].attributeStrength = 0;
                                item.data.data.levels[index].attributeAgility = 0;
                                item.data.data.levels[index].attributeIntellect = 0;
                                item.data.data.levels[index].attributeWill = 0;
                            }
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].attributeSelect = v;

                        if (v == "choosetwo") {
                            item.data.data.levels[index].attributeSelectIsChooseTwo = true;
                            item.data.data.levels[index].attributeSelectIsChooseThree = false;
                            item.data.data.levels[index].attributeSelectIsFixed = false;
                            item.data.data.levels[index].attributeSelectIsTwoSet = false;
                        } else if (v == "choosethree") {
                            item.data.data.levels[index].attributeSelectIsChooseTwo = false;
                            item.data.data.levels[index].attributeSelectIsChooseThree = true;
                            item.data.data.levels[index].attributeSelectIsFixed = false;
                            item.data.data.levels[index].attributeSelectIsTwoSet = false;
                        } else if (v == "fixed") {
                            item.data.data.levels[index].attributeSelectIsChooseTwo = false;
                            item.data.data.levels[index].attributeSelectIsChooseThree = false;
                            item.data.data.levels[index].attributeSelectIsFixed = true;
                            item.data.data.levels[index].attributeSelectIsTwoSet = false;
                        } else if (v == "twosets") {
                            item.data.data.levels[index].attributeSelectIsChooseTwo = false;
                            item.data.data.levels[index].attributeSelectIsChooseThree = false;
                            item.data.data.levels[index].attributeSelectIsFixed = false;
                            item.data.data.levels[index].attributeSelectIsTwoSet = true;
                        } else {
                            item.data.data.levels[index].attributeSelectIsChooseTwo = false;
                            item.data.data.levels[index].attributeSelectIsChooseThree = false;
                            item.data.data.levels[index].attributeSelectIsFixed = false;
                            item.data.data.levels[index].attributeSelectIsTwoSet = false;

                            item.data.data.levels[index].attributeStrength = 0;
                            item.data.data.levels[index].attributeAgility = 0;
                            item.data.data.levels[index].attributeIntellect = 0;
                            item.data.data.levels[index].attributeWill = 0;
                        }
                    }
                } else if (k == "level.talentsSelect") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].talentsSelect = id;

                            if (id == "all")
                                item.data.data.levels[index].talentsSelect = "all";
                            else
                                item.data.data.levels[index].talentsSelect = "chooseone";

                            index++;
                        }
                    } else {
                        item.data.data.levels[index].talentsSelect = v;

                        if (v == "all")
                            item.data.data.levels[index].talentsSelect = "all";
                        else
                            item.data.data.levels[index].talentsSelect = "chooseone";
                    }
                } else if (k == "level.attributeStrength") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].attributeStrength = parseInt(id);
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].attributeStrength = parseInt(v);
                    }
                } else if (k == "level.attributeAgility") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].attributeAgility = parseInt(id);
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].attributeAgility = parseInt(v);
                    }
                } else if (k == "level.attributeIntellect") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].attributeIntellect = parseInt(id);
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].attributeIntellect = parseInt(v);
                    }
                } else if (k == "level.attributeWill") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].attributeWill = parseInt(id);
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].attributeWill = parseInt(v);
                    }
                } else if (k == "level.characteristicsPerception") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].characteristicsPerception = parseInt(id);
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].characteristicsPerception = parseInt(v);
                    }
                } else if (k == "level.characteristicsHealth") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].characteristicsHealth = parseInt(id);
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].characteristicsHealth = parseInt(v);
                    }
                } else if (k == "level.characteristicsPower") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].characteristicsPower = parseInt(id);
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].characteristicsPower = parseInt(v);
                    }
                } else if (k == "level.characteristicsSpeed") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].characteristicsSpeed = parseInt(id);
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].characteristicsSpeed = parseInt(v);
                    }
                } else if (k == "level.characteristicsDefense") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].characteristicsDefense = parseInt(id);
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].characteristicsDefense = parseInt(v);
                    }
                } else if (k == "level.characteristicsCorruption") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].characteristicsCorruption = parseInt(id);
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].characteristicsCorruption = parseInt(v);
                    }
                } else if (k == "level.languagesText") {

                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].languagesText = id;
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].languagesText = v;
                    }
                } else if (k == "level.equipmentText") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].equipmentText = id;
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].equipmentText = v;
                    }
                } else if (k == "level.magicText") {
                    let index = 0;

                    if (Array.isArray(v)) {
                        for (let id of v) {
                            item.data.data.levels[index].magicText = id;
                            index++;
                        }
                    } else {
                        item.data.data.levels[index].magicText = v;
                    }
                }

            }
            await this.object.update({
                "data.levels": duplicate(this.item.data.data.levels)
            });
        }

        return this.entity.update(updateData);
    }

    async addLevel(event) {
        event.preventDefault();

        let itemData = duplicate(this.item.data);
        itemData.data.levels.push(new PathLevel());

        await this.item.update(itemData, { diff: false });
        this.render(true);
    }

    async deleteLevel(index) {
        let itemData = duplicate(this.item.data);
        itemData.data.levels.splice(index, 1);

        await this.item.update(itemData, { diff: false });
        this.render(true);
    }

    async deleteItem(itemLevel, itemGroup, itemIndex) {
        let itemData = duplicate(this.item.data);

        switch (itemGroup) {
            case 'talent':
                let talents = itemData.data.levels[itemLevel].talents;
                talents.splice(itemIndex, 1);
                break;
            case 'spell':
                let spells = itemData.data.levels[itemLevel].spells;
                spells.splice(itemIndex, 1);
                break;
            default:
                break;
        }

        await this.item.update(itemData, { diff: false });
        this.render(true);
    }

    showDeleteDialog(title, content, itemIndex) {
        let d = new Dialog({
            title: title,
            content: content,
            buttons: {
                yes: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize('DL.DialogYes'),
                    callback: (html) => this.deleteLevel(itemIndex)
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