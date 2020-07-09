/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class DemonlordItem extends Item {
    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData() {
        super.prepareData();

        // Get the Item's data
        const itemData = this.data;
        const actorData = this.actor ? this.actor.data : {};
        const data = itemData.data;
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    async roll() {
    }

    static chatListeners(html) {
        html.on('click', '.roll-healing', this._onChatApplyHealing.bind(this));
        html.on('click', '.roll-damage', this._onChatRollDamage.bind(this));
        html.on('click', '.apply-damage', this._onChatApplyDamage.bind(this));
        html.on('click', '.use-talent', this._onChatUseTalent.bind(this));
    }

    static async _onChatApplyHealing(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const item = li.children[0];
        const healing = item.dataset.healing;
        let targetfound = false;

        game.user.targets.forEach(async target => {
            const targetActor = target.actor;
            const currentDamage = parseInt(targetActor.data.data.characteristics.health.value);
            targetfound = true;

            let newdamage = currentDamage - parseInt(healing);
            if (newdamage < 0)
                newdamage = 0;

            await targetActor.update({
                "data.characteristics.health.value": newdamage
            });
        });

        if (!targetfound) {
            ui.notifications.info(game.i18n.localize('DL.DialogWarningTargetNotSelected'));
        }
    }

    static async _onChatRollDamage(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const token = li.closest(".demonlord");
        const actor = this._getChatCardActor(token);
        const item = li.children[0];
        const damageformular = item.dataset.damage;
        let targetfound = false;

        let damageRoll = new Roll(damageformular, {});
        damageRoll.roll();

        var templateData = {
            actor: this.actor,
            data: {
                damageTotal: {
                    value: damageRoll._total
                },
                damageDouble: {
                    value: parseInt(damageRoll._total) * 2
                },
                damageHalf: {
                    value: Math.floor(parseInt(damageRoll._total) / 2)
                }
            }
        };

        let chatData = {
            user: game.user._id,
            speaker: {
                actor: actor._id,
                token: actor.token,
                alias: actor.name
            }
        };

        let template = 'systems/demonlord/templates/chat/damage.html';
        renderTemplate(template, templateData).then(content => {
            chatData.content = content;
            if (game.dice3d) {
                game.dice3d.showForRoll(damageRoll, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));
            } else {
                chatData.sound = CONFIG.sounds.dice;
                ChatMessage.create(chatData);
            }
        });
    }

    static async _onChatApplyDamage(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const item = li.children[0];
        const damage = parseInt(item.dataset.damage);
        let targetfound = false;

        game.user.targets.forEach(async target => {
            const targetActor = target.actor;
            const currentDamage = parseInt(targetActor.data.data.characteristics.health.value);
            const health = parseInt(targetActor.data.data.characteristics.health.max);

            targetfound = true;

            let newdamage = currentDamage + damage;
            if (newdamage > health)
                newdamage = health;

            await targetActor.update({
                "data.characteristics.health.value": newdamage
            });
        });

        if (!targetfound) {
            ui.notifications.info(game.i18n.localize('DL.DialogWarningTargetNotSelected'));
        }
    }

    static async _onChatUseTalent(event) {
        const token = event.currentTarget.closest(".demonlord");
        const actor = this._getChatCardActor(token);
        if (!actor) return;

        const li = event.currentTarget;
        const div = li.children[0];
        const talentId = div.dataset.itemId;

        //const item = actor.getOwnedItem(talentId);
        /*
        const token = this.actor.token;
        const item = this.data;
        const actorData = this.actor ? this.actor.data.data : {};
        const itemData = item.data;

        console.log(this.actor);
        console.log(itemData);
*/
        /*
        event.preventDefault();
        const li = event.currentTarget;
        const token = event.currentTarget.closest(".demonlord");
        const actor = game.actors.get(token.dataset.actorId);
        const div = li.children[0];
        const talentId = div.dataset.itemId;
        const talent = actor.getEmbeddedEntity("OwnedItem", talentId);

        console.log(this.data);
        */
    }

    /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Actor|null}         The Actor entity or null
   * @private
   */
    static _getChatCardActor(card) {
        // Case 1 - a synthetic actor from a Token
        const tokenKey = card.dataset.tokenId;
        if (tokenKey) {
            const [sceneId, tokenId] = tokenKey.split(".");
            const scene = game.scenes.get(sceneId);
            if (!scene) return null;
            const tokenData = scene.getEmbeddedEntity("Token", tokenId);
            if (!tokenData) return null;
            const token = new Token(tokenData);
            return token.actor;
        }

        // Case 2 - use Actor ID directory
        const actorId = card.dataset.actorId;
        return game.actors.get(actorId) || null;
    }

    /**
   * Get the Actor which is the target of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Array.<Actor>}      An Array of Actor entities, if any
   * @private
   */
    static _getChatCardTargets(card) {
        const character = game.user.character;
        const controlled = canvas.tokens.controlled;
        const targets = controlled.reduce((arr, t) => t.actor ? arr.concat([t.actor]) : arr, []);
        if (character && (controlled.length === 0)) targets.push(character);
        return targets;
    }
}
