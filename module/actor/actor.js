/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class DemonlordActor extends Actor {

    /**
     * Augment the basic actor data with additional dynamic data.
     */
    prepareData() {
        super.prepareData();

        const actorData = this.data;
        const data = actorData.data;
        const flags = actorData.flags;

        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        if (actorData.type === 'character') this._prepareCharacterData(actorData);
    }

    /**
     * Prepare Character type specific data
     */
    _prepareCharacterData(actorData) {
        const data = actorData.data;

        // Loop through ability scores, and add their modifiers to our sheet output.
        for (let [key, attribute] of Object.entries(data.attributes)) {
            if (attribute.value > attribute.max) {
                attribute.value = attribute.max;
            }
            if (attribute.value < attribute.min) {
                attribute.value = attribute.min;
            }

            attribute.modifier = (attribute.value - 10);

            // Add labels.
            attribute.label = CONFIG.DL.attributes[key].toUpperCase();
        }
    }

}
