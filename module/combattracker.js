export default class extends CombatTracker {
    constructor(options) {
        super(options);
    }

    async getData(options) {
        return await super.getData();
    }

    /** @override */
    activateListeners(html) {
        let init;
        html.find('.combatant').each((i, el) => {
            const currentCombat = this.getCurrentCombat();

            const combId = el.getAttribute('data-combatant-id');
            const combatant = currentCombat.combatants.find((c) => c._id == combId);

            init = combatant.actor.data?.data?.fastturn ? game.i18n.localize('DL.TurnFast') : game.i18n.localize('DL.TurnSlow');
            el.getElementsByClassName('token-initiative')[0].innerHTML = `<a class="combatant-control dlturnorder" title="` + game.i18n.localize('DL.TurnChangeTurn') + `">` + init + `</a>`;
        });

        super.activateListeners(html);

        html.find('.dlturnorder').click(ev => {
            const li = ev.currentTarget.closest("li");
            const combId = li.dataset.combatantId;
            const currentCombat = this.getCurrentCombat();
            const combatant = currentCombat.combatants.find((c) => c._id == combId);
            const initMessages = [];

            if (game.user.isGM || combatant.actor.owner) {
                if (game.settings.get('demonlord', 'initMessage')) {
                    var templateData = {
                        actor: combatant.actor,
                        item: {
                            name: game.i18n.localize('DL.DialogInitiative')
                        },
                        data: {
                            turn: {
                                value: combatant.actor.data?.data?.fastturn ? game.i18n.localize('DL.DialogTurnSlow') : game.i18n.localize('DL.DialogTurnFast')
                            }
                        }
                    };

                    let chatData = {
                        user: game.user._id,
                        speaker: {
                            actor: combatant.actor._id,
                            token: combatant.actor.token,
                            alias: combatant.actor.name
                        }
                    };

                    let template = 'systems/demonlord/templates/chat/init.html';
                    renderTemplate(template, templateData).then(content => {
                        chatData.content = content;
                        ChatMessage.create(chatData);
                    });
                }

                this.updateActorsFastturn(combatant.actor);
            }
        });
    }

    getCurrentCombat() {
        const combat = this.combat;
        const hasCombat = combat !== null;
        const view = canvas.scene;
        const combats = view ? game.combats.entities.filter(c => c.data.scene === view._id) : [];
        const currentIdx = combats.findIndex(c => c === this.combat);

        return combats[currentIdx];
    }

    async updateActorsFastturn(actor) {
        await actor.update({
            "data.fastturn": !actor.data.data.fastturn
        });

        if (game.combat) {
            for (const combatant of game.combat.combatants) {
                let init = 0;

                if (combatant.actor == actor) {
                    if (actor.data.type == "character") {
                        init = actor.data.data.fastturn ? 70 : 30;
                    } else {
                        init = actor.data.data.fastturn ? 50 : 10;
                    }

                    game.combat.setInitiative(combatant._id, init);
                }
            }
        }
    }
}