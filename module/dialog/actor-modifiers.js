export class DLActorModifiers extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'sheet-globalmod';
        options.template = 'systems/demonlord/templates/dialogs/actor-modifiers-dialog.html';
        options.width = 380;
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
        return this.object.data;
    }
    /* -------------------------------------------- */
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        //Configre initiative Edges/Hindrances
        /*
        html.find('#initConfigButton').click(() => {
            let actorObject = this.object;
            actorObject.configureInitiative();
        });
        */
    }
    /**
     * This method is called upon form submission after form data is validated
     * @param event {Event}       The initial triggering submission event
     * @param formData {Object}   The object of validated form data with which to update the object
     * @private
     */
    async _updateObject(event, formData) {
        event.preventDefault();

        this.object.update(formData);
        this.object.sheet.render(true);
    }
}
