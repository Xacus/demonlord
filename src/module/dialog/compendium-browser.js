export class CompendiumBrowser extends Application {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'sheet-modifiers',
            classes: ['browser', 'sheet', 'actor'],
            template: 'systems/demonlord/templates/dialogs/compendium-browser.hbs',
            width: game.users.players.length * 150,
            height: 'auto',
            tabs: [
              {
                navSelector: '.sheet-tabs',
                contentSelector: '.sheet-body',
                initial: 'ancestries',
              },
            ],
            scrollY: ['.tab.active'],
        })
    }

    
    /* -------------------------------------------- */
    /**
     * Add the Entity name into the window title
     * @type {String}
     */
    get title() {
        return 'Compendium Browser'
    }
    
    _updateWindow(event) {
        event.preventDefault()
        this.render(true)
    }

    /**
     * Construct and return the data object used to render the HTML template for this form application.
     * @return {Object}
     */
    getData() {
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html)
    }

}