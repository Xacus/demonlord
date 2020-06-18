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
        let d = new Dialog({
            title: game.i18n.localize('DL.DialogAttackRoll') + game.i18n.localize(this.data.name),
            content: "<b>" + game.i18n.localize('DL.DialogAddBonesAndBanes') + "</b><input style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/>",
            buttons: {
                roll: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize('DL.DialogRoll'),
                    callback: (html) => this.rollMacro(this.data, html.children()[1].value)
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize('DL.DialogCancel'),
                    callback: () => {}
                }
            },
            default: "roll",
            close: () => {}
        });
        d.render(true);
    }

    async rollMacro(boonsbanes) {
        const token = this.actor.token;
        const item = this.data;
        const datatype = item.type.toLowerCase();
        let template = "";
        let templateData = null;

        const roll = this.makeAttackRoll(item, boonsbanes);

        if (datatype == "weapon") {
            template = "systems/demonlord/templates/chat/combat.html"
            templateData = this.getChatData(roll, item, boonsbanes);
        } else if (datatype == "spell") {
            template = "systems/demonlord/templates/chat/spell.html"
            templateData = this.getChatData(roll, item, boonsbanes);
        } else if (datatype == "talent") {
            template = "systems/demonlord/templates/chat/talent.html"
            templateData = this.getChatData(roll, item, boonsbanes);
        }

        let chatData = {
            user: game.user._id,
            speaker: {
                actor: this.actor._id,
                token: this.actor.token,
                alias: this.actor.name
            }
        };

        // Toggle default roll mode
        let rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u._id);
        if (rollMode === "blindroll") chatData["blind"] = true;

        renderTemplate(template, templateData).then(content => {
            chatData.content = content;
            if (game.dice3d) {
                game.dice3d.showForRoll(roll, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));
              } else {
                chatData.sound = CONFIG.sounds.dice;
                ChatMessage.create(chatData);
              }
        });

/*
        // Render the template
        chatData["content"] = await renderTemplate(template, templateData);

        // Create the chat message
        return ChatMessage.create(chatData, {
            displaySheet: false
        });
        */
    }

    makeAttackRoll(item, boonsbanes) {
        let diceformular = "1d20";
        let roll = false;

        // Add Attribute modifer to roll
        let attackAttribute = item.data.action.attack;
        const attribute = this.actor.data.data.attributes[attackAttribute.toLowerCase()];

        // Roll for Attack
        if (attackAttribute) {
            diceformular = diceformular + "+" + attribute.modifier;
            roll = true;
        }
        // Add weapon boonsbanes
        if (item.data.action.boonsbanes != 0) {
            boonsbanes = parseInt(boonsbanes) + parseInt(item.data.action.boonsbanes);
        }

        if (boonsbanes != 0) {
            diceformular = diceformular + "+" + boonsbanes + "d6kh";
        }
        let attackRoll = new Roll(diceformular, {});
        return attackRoll.roll();
    }

    getChatData(attackRoll, item, boonsbanes) {
        const datatype = item.type.toLowerCase();
        let dataTemplate;

        let attackAttribute = item.data.action.attack;

        // Roll Against Target
        const targetNumber = this.getTargetNumber(item);

        // Roll Damage
        let damageformular = item.data.action.damage;
        let damageRoll = new Roll(damageformular, {});
        damageRoll.roll();

        if (datatype == "weapon") {
            dataTemplate = this.createCombatTemplateData(item, attackRoll, damageRoll, attackAttribute, targetNumber);
        } else if (datatype == "spell") {
            dataTemplate = this.createSpellTemplateData(item, attackRoll, damageRoll, attackAttribute, targetNumber);
        } else if (datatype == "talent") {
            dataTemplate = this.createTalentTemplateData(item, attackRoll, damageRoll, attackAttribute, targetNumber, roll);
        }

        return dataTemplate;
    }

    createCombatTemplateData(weapon, attackRoll, damageRoll, attackAttribute, targetNumber) {
        const plus20 = (attackRoll._total >= 20 ? true : false);

        var templateData = {
            actor: this.actor,
            item: {
                name: weapon.name
            },
            data: {
                diceTotal: {
                    value: attackRoll._total
                },
                diceResult: {
                    value: attackRoll.result.toString()
                },
                resultText: {
                    value: (attackRoll._total >= targetNumber ? "SUCCESS" : "FAILURE")
                },
                attack: {
                    value: attackAttribute.toUpperCase()
                },
                against: {
                    value: weapon.data.action.against.toUpperCase()
                },
                againstNumber: {
                    value: targetNumber
                },
                damage: {
                    value: damageRoll._total
                },
                plus20: {
                    value: plus20
                },
                plus20text: {
                    value: weapon.data.action.plus20
                },
                description: {
                    value: weapon.data.description
                },
                tagetname: {
                    value: this.getTargetName()
                }
            }
        };

        return templateData;
    }

    createSpellTemplateData(spell, attackRoll, damageRoll, attackAttribute, targetNumber) {
        const plus20 = (attackRoll._total >= 20 ? true : false);

        var templateData = {
            actor: this.actor,
            item: {
                name: spell.name
            },
            data: {
                diceTotal: {
                    value: attackRoll._total
                },
                diceResult: {
                    value: attackRoll.result.toString()
                },
                resultText: {
                    value: (attackRoll._total >= targetNumber ? "SUCCESS" : "FAILURE")
                },
                attack: {
                    value: attackAttribute.toUpperCase()
                },
                against: {
                    value: spell.data.action.against.toUpperCase()
                },
                againstNumber: {
                    value: targetNumber
                },
                damage: {
                    value: damageRoll._total
                },
                attribute: {
                    value: spell.data.attribute
                },
                plus20: {
                    value: plus20
                },
                plus20text: {
                    value: spell.data.action.plus20
                },
                description: {
                    value: spell.data.description
                },
                spellcastings: {
                    value: spell.data.castings.max
                },
                spellduration: {
                    value: spell.data.duration
                },
                spelltarget: {
                    value: spell.data.target
                },
                spellarea: {
                    value: spell.data.area
                },
                spellrequirements: {
                    value: spell.data.requirements
                },
                spellsacrifice: {
                    value: spell.data.sacrifice
                },
                spellpermanence: {
                    value: spell.data.permanence
                },
                spellspecial: {
                    value: spell.data.special
                },
                spelltriggered: {
                    value: spell.data.triggered
                },
                tagetname: {
                    value: this.getTargetName()
                }
            }
        };

        return templateData;
    }

    createTalentTemplateData(talent, attackRoll, damageRoll, attackAttribute, targetNumber, roll) {
        const plus20 = (attackRoll._total >= 20 ? true : false);

        var templateData = {
            actor: this.actor,
            item: {
                name: talent.name
            },
            data: {
                roll: {
                    value: roll
                },
                diceTotal: {
                    value: attackRoll._total
                },
                diceResult: {
                    value: attackRoll.result.toString()
                },
                resultText: {
                    value: (attackRoll._total >= targetNumber ? "SUCCESS" : "FAILURE")
                },
                attack: {
                    value: attackAttribute.toUpperCase()
                },
                against: {
                    value: talent.data.action.against.toUpperCase()
                },
                againstNumber: {
                    value: targetNumber
                },
                damage: {
                    value: damageRoll._total
                },
                plus20: {
                    value: plus20
                },
                plus20text: {
                    value: talent.data.action.plus20
                },
                description: {
                    value: talent.data.description
                },
                tagetname: {
                    value: this.getTargetName()
                }
            }
        };

        return templateData;
    }

    getTargetNumber(item) {
        let tagetNumber;

        game.user.targets.forEach(async target => {
            const targetActor = target.actor;
            let againstSelectedAttribute = item.data.action.against.toLowerCase();

            if (againstSelectedAttribute == "defense") {
                tagetNumber = targetActor.data.data.characteristics.defense;
            } else {
                tagetNumber = targetActor.data.data.attributes[againstSelectedAttribute].value;
            }
        });

        return tagetNumber;
    }

    getTargetName() {
        let tagetName;

        game.user.targets.forEach(async target => {
            tagetName = target.name;
        });

        return tagetName;
    }
}
