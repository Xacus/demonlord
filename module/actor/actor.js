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
        if (actorData.type === 'character' ||
            actorData.type === 'creature') this._prepareCharacterData(actorData);
    }

    /**
     * Prepare Character type specific data
     */
    _prepareCharacterData(actorData) {
        const data = actorData.data;
        let will;
        data.characteristics.insanity.max = data.attributes.will.value;

        const characterbuffs = this.generateCharacterBuffs();

        const ancestries = this.getEmbeddedCollection("OwnedItem").filter(e => "ancestry" === e.type);
        let savedAncestry = null;
        for (let ancestry of ancestries) {
            savedAncestry = ancestry;
            data.attributes.perception.value = parseInt(data.attributes.intellect.value) + parseInt(ancestry.data.characteristics.perceptionmodifier);

            if (parseInt(ancestry.data.characteristics?.defensemodifier) > 5) {
                data.characteristics.defense = parseInt(ancestry.data.characteristics?.defensemodifier);
            } else {
                data.characteristics.defense = parseInt(data.attributes.agility.value) + parseInt(ancestry.data.characteristics.defensemodifier);
            }
            if (game.settings.get('demonlord', 'reverseDamage')) {
                if (data.characteristics.health.value == 0) {
                    data.characteristics.health.value = parseInt(data.attributes.strength.value) + parseInt(ancestry.data.characteristics?.healthmodifier) + characterbuffs.healthbonus;
                }
                data.characteristics.health.max = parseInt(data.attributes.strength.value) + parseInt(ancestry.data.characteristics?.healthmodifier) + characterbuffs.healthbonus;
            } else {
                data.characteristics.health.max = parseInt(data.attributes.strength.value) + parseInt(ancestry.data.characteristics?.healthmodifier) + characterbuffs.healthbonus;
            }
            if (data.level >= 4) {
                if (game.settings.get('demonlord', 'reverseDamage')) {
                    if (data.characteristics.health.value == 0) {
                        data.characteristics.health.value += parseInt(ancestry.data.level4?.healthbonus);
                    }
                    data.characteristics.health.max += parseInt(ancestry.data.level4?.healthbonus);
                } else {
                    data.characteristics.health.max += parseInt(ancestry.data.level4?.healthbonus);
                }
            }

            data.characteristics.speed = parseInt(ancestry.data.characteristics?.speed);
            data.characteristics.health.healingrate = Math.floor(parseInt(data.characteristics.health.max) / 4) + parseInt(ancestry.data.characteristics?.healingratemodifier);
            data.characteristics.size = ancestry.data.characteristics.size;

            //data.characteristics.power = parseInt(data.characteristics.power);
            //data.characteristics.insanity.value = parseInt(data.characteristics.insanity.value) + parseInt(ancestry.data.characteristics.insanity);
            //data.characteristics.corruption = parseInt(data.characteristics.corruption) + parseInt(ancestry.data.characteristics.corruption);
        }

        // Loop through ability scores, and add their modifiers to our sheet output.
        for (let [key, attribute] of Object.entries(data.attributes)) {
            if (attribute.value > attribute.max) {
                attribute.value = attribute.max;
            }
            if (attribute.value < attribute.min) {
                attribute.value = attribute.min;
            }

            attribute.modifier = (attribute.value - 10);
            attribute.label = CONFIG.DL.attributes[key].toUpperCase();
        }

        const armors = this.getEmbeddedCollection("OwnedItem").filter(e => "armor" === e.type);
        let armorpoint = 0;
        let agilitypoint = 0;
        let defenseBonus = 0;
        let speedPenalty = 0;
        for (let armor of armors) {
            if (armor.data.wear) {
                // If you wear armor and do not meet or exceed its requirements: -2 speed
                if (!armor.data.isShield && armor.data.strengthmin != "" && (parseInt(armor.data.strengthmin) > parseInt(data.attributes.strength.value))) {
                    speedPenalty = -2;
                }

                if (armor.data.agility && agilitypoint == 0)
                    agilitypoint = parseInt(armor.data.agility);
                if (armor.data.fixed)
                    armorpoint = parseInt(armor.data.fixed);
                if (armor.data.defense)
                    defenseBonus = parseInt(armor.data.defense);
            }
        }

        if (armorpoint >= 11)
            data.characteristics.defense = parseInt(armorpoint) + parseInt(defenseBonus);
        else
            data.characteristics.defense = parseInt(data.characteristics.defense) + parseInt(defenseBonus) + parseInt(agilitypoint);

        data.characteristics.defense = parseInt(data.characteristics.defense) + parseInt(characterbuffs.defensebonus);
        data.characteristics.power = parseInt(characterbuffs.powerbonus);

        characterbuffs.speedbonus += speedPenalty;

        if (data.afflictions.slowed)
            data.characteristics.speed = Math.floor(parseInt(data.characteristics.speed + speedPenalty) / 2);
        else
            data.characteristics.speed = parseInt(data.characteristics.speed) + parseInt(characterbuffs.speedbonus);
    }

    async createItemCreate(event) {
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
        return await this.createOwnedItem(itemData);
    }

    async _onDeleteEmbeddedEntity(embeddedName, child, options, userId) {
        const characterbuffs = this.generateCharacterBuffs();

        if (child.data.addtonextroll) {
            await this.update({
                "data.characteristics.defensebonus": parseInt(characterbuffs.defensebonus) - (parseInt(child.data.bonuses.defense) ? parseInt(child.data.bonuses.defense) : 0),
                "data.characteristics.healthbonus": parseInt(characterbuffs.healthbonus) - (parseInt(child.data.bonuses.health) ? parseInt(child.data.bonuses.health) : 0),
                "data.characteristics.powerbonus": parseInt(characterbuffs.powerbonus) - (parseInt(child.data.bonuses.power) ? parseInt(child.data.bonuses.power) : 0),
                "data.characteristics.speedbonus": parseInt(characterbuffs.speedbonus) - (parseInt(child.data.bonuses.speed) ? parseInt(child.data.bonuses.speed) : 0),
                "data.characteristics.defense": parseInt(this.data.data.characteristics.defense) - (parseInt(child.data.bonuses.defense) ? parseInt(child.data.bonuses.defense) : 0),
                "data.characteristics.health.max": parseInt(this.data.data.characteristics.health.max) - (parseInt(child.data.bonuses.health) ? parseInt(child.data.bonuses.health) : 0),
                "data.characteristics.speed.value": parseInt(this.data.data.characteristics.speed.value) - (parseInt(child.data.bonuses.speed) ? parseInt(child.data.bonuses.speed) : 0)
            });
        }
    }

    rollChallenge(attribute) {
        const attLabel = attribute.label.charAt(0).toUpperCase() + attribute.label.toLowerCase().slice(1);

        let d = new Dialog({
            title: game.i18n.localize('DL.DialogChallengeRoll') + game.i18n.localize(attLabel),
            content: "<b>" + game.i18n.localize('DL.DialogAddBonesAndBanes') + "</b><input style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/>",
            buttons: {
                roll: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize('DL.DialogRoll'),
                    callback: (html) => this.rollAttribute(attribute, html.children()[1].value)
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize('DL.DialogCancel'),
                    callback: () => { }
                }
            },
            default: "roll",
            close: () => { }
        });
        d.render(true);
    }

    rollAttribute(attribute, boonsbanes) {
        const buffs = this.generateCharacterBuffs("");
        let attribueName = attribute.label.charAt(0).toUpperCase() + attribute.label.toLowerCase().slice(1);

        // Roll
        let diceformular = "1d20";
        if (attribute && attribute.modifier != 0)
            diceformular = diceformular + (attribute.modifier > 0 ? "+" + attribute.modifier : attribute.modifier);

        if (buffs?.challengebonus != "") {
            boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengebonus);
        }
        if (boonsbanes != undefined && boonsbanes != NaN && boonsbanes != 0) {
            diceformular = diceformular + "+" + boonsbanes + "d6kh";
        }
        let r = new Roll(diceformular, {});
        r.roll();

        // Format Dice
        const diceData = this.formatDice(r);

        var templateData = {
            actor: this,
            item: {
                name: attribueName.toUpperCase()
            },
            data: {
                diceTotal: {
                    value: r._total
                },
                diceResult: {
                    value: r.result.toString()
                },
                resultText: {
                    value: (r._total >= 10 ? "SUCCESS" : "FAILURE")
                },
                isCreature: {
                    value: this.data.type == "creature" ? true : false
                }
            },
            diceData
        };

        let chatData = {
            user: game.user._id,
            speaker: {
                actor: this._id,
                token: this.token,
                alias: this.name
            }
        };

        let rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");

        /*
                if (this.data.type == "creature") {
                    chatData.whisper = game.user._id;
                }
        */
        let template = 'systems/demonlord/templates/chat/challenge.html';
        renderTemplate(template, templateData).then(content => {
            chatData.content = content;
            if (game.dice3d) {
                game.dice3d.showForRoll(r, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));
            } else {
                chatData.sound = CONFIG.sounds.dice;
                ChatMessage.create(chatData);
            }
        });
    }

    rollWeaponAttack(itemId, options = { event: null }) {
        const item = this.getOwnedItem(itemId);
        let attackAttribute = item.data.data.action?.attack;
        const characterbuffs = this.generateCharacterBuffs("ATTACK");

        if (attackAttribute) {
            let d = new Dialog({
                title: game.i18n.localize('DL.DialogAttackRoll') + game.i18n.localize(item.name),
                content: "<b>" + game.i18n.localize('DL.DialogAddBonesAndBanes') + "</b><input style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/>",
                buttons: {
                    roll: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize('DL.DialogRoll'),
                        callback: (html) => this.rollAttack(item, html.children()[1].value, characterbuffs)
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize('DL.DialogCancel'),
                        callback: () => { }
                    }
                },
                default: "roll",
                close: () => { }
            });
            d.render(true);
        } else {
            this.rollAttack(item, 0, characterbuffs)
        }
    }

    rollAttack(weapon, boonsbanes, buffs) {
        const target = this.getTarget();
        let diceformular = "1d20";
        let attackRoll = null;

        // Roll Against Target
        const targetNumber = this.getTargetNumber(weapon);

        // Add Attribute modifer to roll
        let attackAttribute = weapon.data.data.action?.attack;
        const attribute = this.data.data?.attributes[attackAttribute.toLowerCase()];

        if (attackAttribute) {
            // Roll for Attack
            if (attribute && attribute.modifier != 0)
                diceformular = diceformular + (attribute.modifier > 0 ? "+" + attribute.modifier : attribute.modifier);

            // Add weapon boonsbanes
            if (weapon.data.data.action.boonsbanes != 0) {
                boonsbanes = parseInt(boonsbanes) + parseInt(weapon.data.data.action.boonsbanes);
            }

            // Add buffs from Talents
            if (buffs?.attackbonus != "") {
                boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackbonus);
            }

            // If you wear a weapon and do not meet or exceed its requirements: -1 Bane
            if (weapon.data.data.wear) {
                if (weapon.data.data.strengthmin != "" && (parseInt(weapon.data.data.strengthmin) > parseInt(this.data.data?.attributes?.strength?.value))) {
                    boonsbanes--;
                }
            }

            if (boonsbanes == undefined || boonsbanes == NaN || boonsbanes == 0) {
                boonsbanes = 0;
            } else {
                diceformular += "+" + boonsbanes + "d6kh";
            }

            attackRoll = new Roll(diceformular, {});
            attackRoll.roll();
        }

        // Format Dice
        let diceData = this.formatDice(attackRoll);

        //Plus20 roll
        let plus20 = false;
        if (targetNumber != undefined) {
            plus20 = attackRoll._total >= 20 && (attackRoll._total >= parseInt(targetNumber) + 5) ? true : false;
        }

        let resultText = attackRoll != null && targetNumber != undefined && attackRoll._total >= parseInt(targetNumber) ? "SUCCESS" : "FAILURE";
        let diceTotal = attackRoll != null ? attackRoll._total : "";
        if (this.data.type === 'creature' && !game.settings.get('demonlord', 'attackShowAttack')) {
            diceTotal = "?";
            resultText = "";
        }

        const againstNumber = (target != null && target.actor.data.type == "character") || game.settings.get('demonlord', 'attackShowDefense') && targetNumber != undefined ? targetNumber : "?";

        var templateData = {
            actor: this,
            item: {
                data: weapon,
                name: weapon.name
            },
            data: {
                diceTotal: {
                    value: diceTotal
                },
                diceTotalGM: {
                    value: attackRoll != null ? attackRoll._total : ""
                },
                diceResult: {
                    value: attackRoll != null ? attackRoll.result.toString() : ""
                },
                resultText: {
                    value: resultText
                },
                didHit: {
                    value: targetNumber == undefined || attackRoll._total >= targetNumber ? true : false
                },
                attack: {
                    value: attackAttribute.toUpperCase()
                },
                against: {
                    value: weapon.data.data.action.against.toUpperCase()
                },
                againstNumber: {
                    value: againstNumber
                },
                againstNumberGM: {
                    value: againstNumber == "?" ? targetNumber : againstNumber
                },
                damageFormular: {
                    value: weapon.data.data.action.damage + buffs.attackdamagebonus
                },
                damageExtra20plusFormular: {
                    value: buffs.attack20plusdamagebonus.charAt(0) == "+" ? buffs.attack20plusdamagebonus.substr(1) : buffs.attack20plusdamagebonus
                },
                description: {
                    value: weapon.data.data.description
                },
                targetname: {
                    value: target != null ? target.name : ""
                },
                effects: {
                    value: buffs.attackeffects
                },
                isCreature: {
                    value: this.data.type == "creature" ? true : false
                }
            },
            diceData
        };

        let chatData = {
            user: game.user._id,
            speaker: {
                actor: this._id,
                token: this.token,
                alias: this.name
            }
        };

        let rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");

        let template = 'systems/demonlord/templates/chat/combat.html';
        renderTemplate(template, templateData).then(content => {
            chatData.content = content;

            if (game.dice3d && attackRoll != null) {
                if (this.data.type === 'creature' && !game.settings.get('demonlord', 'attackShowAttack')) {
                    if (attackRoll != null)
                        chatData.sound = CONFIG.sounds.dice;
                    ChatMessage.create(chatData);
                } else {
                    game.dice3d.showForRoll(attackRoll, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));
                }
            } else {
                if (attackRoll != null)
                    chatData.sound = CONFIG.sounds.dice;
                ChatMessage.create(chatData);
            }
        });
        /*
        } else {
            ui.notifications.info(game.i18n.localize('DL.DialogWarningTargetNotSelected'));
        }
        */
    }

    rollTalent(itemId, options = { event: null }) {
        let item = duplicate(this.getEmbeddedEntity("OwnedItem", itemId));
        let uses = parseInt(item.data?.uses?.value);
        let usesmax = parseInt(item.data?.uses?.max);

        if ((uses == 0 && usesmax == 0) || uses != usesmax) {
            if (item.data?.vs?.attribute) {
                let d = new Dialog({
                    title: game.i18n.localize('DL.TalentVSRoll') + game.i18n.localize(item.name),
                    content: "<b>" + game.i18n.localize('DL.DialogAddBonesAndBanes') + "</b><input style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/>",
                    buttons: {
                        roll: {
                            icon: '<i class="fas fa-check"></i>',
                            label: game.i18n.localize('DL.DialogRoll'),
                            callback: (html) => this.useTalent(item, html.children()[1].value)
                        },
                        cancel: {
                            icon: '<i class="fas fa-times"></i>',
                            label: game.i18n.localize('DL.DialogCancel'),
                            callback: () => { }
                        }
                    },
                    default: "roll",
                    close: () => { }
                });
                d.render(true);
            } else {
                this.useTalent(item, null)
            }
        } else {
            ui.notifications.warn(game.i18n.localize('DL.TalentMaxUsesReached'));
        }
    }

    useTalent(talent, boonsbanes) {
        const target = this.getTarget();
        let diceformular = "1d20";
        let roll = false;
        let attackRoll = null;
        let attackAttribute = "";
        let targetNumber = 0;
        let usesText = "";
        let damageformular = "";
        let diceData = "";

        // Generate Character Buffs
        const buffs = this.generateCharacterBuffs("TALENT");

        if (talent.data?.vs?.attribute) {
            targetNumber = this.getVSTargetNumber(talent);

            //if (targetNumber != undefined) {
            if (talent.data.vs?.damageactive) {
                this.activateTalent(talent, true);
            } else {
                this.activateTalent(talent, false);
            }

            attackAttribute = talent.data.vs.attribute;
            const attribute = this.data.data.attributes[attackAttribute.toLowerCase()];

            if (attackAttribute) {
                if (attribute && attribute.modifier != 0)
                    diceformular += (attribute.modifier > 0 ? "+" + attribute.modifier : attribute.modifier);
                roll = true;

                // Add boonsbanes
                if (talent.data.vs.boonsbanes != 0) {
                    boonsbanes = parseInt(boonsbanes) + parseInt(talent.data.vs.boonsbanes);
                }
                // Add buffs from Talents
                if (buffs?.challengebonus != 0) {
                    boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengebonus);
                }
                if (boonsbanes == undefined || boonsbanes == NaN || boonsbanes == 0) {
                    boonsbanes = 0;
                } else {
                    diceformular += "+" + boonsbanes + "d6kh";
                }

                attackRoll = new Roll(diceformular, {});
                attackRoll.roll();

                // Format Dice
                diceData = this.formatDice(attackRoll);

                // Roll Against Target
                targetNumber = this.getVSTargetNumber(talent);
            }

            if (talent.data.vs.damageactive && talent.data.vs.damage) {
                damageformular = talent.data.vs.damage;
            }
            /*
            } else {
                ui.notifications.info(game.i18n.localize('DL.DialogWarningTargetNotSelected'));
            }
            */
        } else {
            this.activateTalent(talent, true);
        }

        /*
        if (talent.data?.damage && target == null) {
            ui.notifications.info(game.i18n.localize('DL.DialogWarningTargetNotSelected'));
        }
        */

        if (parseInt(talent.data?.uses?.value) >= 0 && parseInt(talent.data?.uses?.max) > 0) {
            let uses = parseInt(talent.data.uses?.value);
            let usesmax = parseInt(talent.data.uses?.max);
            usesText = game.i18n.localize('DL.TalentUses') + ": " + uses + " / " + usesmax;
        }

        let resultText = attackRoll != null && targetNumber != undefined && attackRoll._total >= parseInt(targetNumber) ? "SUCCESS" : "FAILURE";
        let diceTotal = attackRoll != null ? attackRoll._total : "";
        if (this.data.type === 'creature' && !game.settings.get('demonlord', 'attackShowAttack')) {
            diceTotal = "?";
            resultText = "";
        }

        const againstNumber = target != null && target.actor?.data.type == "character" || game.settings.get('demonlord', 'attackShowDefense') && targetNumber != undefined ? targetNumber : "?";

        var templateData = {
            actor: this,
            item: {
                data: talent,
                name: talent.name
            },
            data: {
                id: {
                    value: talent._id
                },
                roll: {
                    value: roll
                },
                diceTotal: {
                    value: diceTotal
                },
                diceTotalGM: {
                    value: attackRoll != null ? attackRoll._total : ""
                },
                diceResult: {
                    value: attackRoll != null ? attackRoll.result.toString() : ""
                },
                resultText: {
                    value: resultText
                },
                didHit: {
                    value: targetNumber != undefined || attackRoll._total >= targetNumber ? true : false
                },
                attack: {
                    value: attackAttribute.toUpperCase()
                },
                against: {
                    value: talent.data?.vs?.against.toUpperCase()
                },
                againstNumber: {
                    value: againstNumber
                },
                againstNumberGM: {
                    value: againstNumber == "?" ? targetNumber : againstNumber
                },
                damageFormular: {
                    value: damageformular
                },
                damageExtra20plusFormular: {
                    value: talent.data?.action?.plus20
                },
                effects: {
                    value: this.buildTalentEffects(talent, false, "TALENT")
                },
                description: {
                    value: talent.data?.description
                },
                uses: {
                    value: usesText
                },
                healing: {
                    value: talent.data?.healing?.healactive && talent.data?.healing?.healing ?
                        talent.data?.healing?.healing : false
                },
                targetname: {
                    value: target != null ? target.name : ""
                },
                isCreature: {
                    value: this.data.type == "creature" ? true : false
                },
                pureDamage: {
                    value: talent.data?.damage
                }
            },
            diceData
        }

        let chatData = {
            user: game.user._id,
            speaker: {
                actor: this._id,
                token: this.token,
                alias: this.name
            }
        };

        let rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");

        if (talent.data?.damage || talent.data?.vs?.attribute || (!talent.data?.vs?.attribute && !talent.data?.damage)) {
            let template = 'systems/demonlord/templates/chat/talent.html';
            renderTemplate(template, templateData).then(content => {
                chatData.content = content;
                if (game.dice3d && attackRoll != null) {
                    if (this.data.type === 'creature' && !game.settings.get('demonlord', 'attackShowAttack')) {
                        if (attackRoll != null)
                            chatData.sound = CONFIG.sounds.dice;
                        ChatMessage.create(chatData);
                    } else {
                        game.dice3d.showForRoll(attackRoll, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));
                    }
                } else {
                    if (attackRoll != null) {
                        chatData.sound = CONFIG.sounds.dice;
                    }
                    ChatMessage.create(chatData);
                }
            });
        }
    }

    rollSpell(itemId, options = { event: null }) {
        const item = duplicate(this.getEmbeddedEntity("OwnedItem", itemId));
        let attackAttribute = item.data?.action?.attack;
        let uses = parseInt(item.data?.castings?.value);
        let usesmax = parseInt(item.data?.castings?.max);

        if ((uses == 0 && usesmax == 0) || uses != usesmax) {
            if (attackAttribute) {
                if (item.data.spelltype == game.i18n.localize('DL.SpellTypeAttack')) {
                    let d = new Dialog({
                        title: game.i18n.localize('DL.DialogSpellRoll') + game.i18n.localize(item.name),
                        content: "<b>" + game.i18n.localize('DL.DialogAddBonesAndBanes') + "</b><input style='width: 50px;margin-left: 5px;text-align: center' type='text' value=0 data-dtype='Number'/>",
                        buttons: {
                            roll: {
                                icon: '<i class="fas fa-check"></i>',
                                label: game.i18n.localize('DL.DialogRoll'),
                                callback: (html) => this.useSpell(item, html.children()[1].value)
                            },
                            cancel: {
                                icon: '<i class="fas fa-times"></i>',
                                label: game.i18n.localize('DL.DialogCancel'),
                                callback: () => { }
                            }
                        },
                        default: "roll",
                        close: () => { }
                    });
                    d.render(true);
                } else {
                    this.useSpell(item, 0);
                }
            } else {
                this.useSpell(item, 0);
            }
        } else {
            ui.notifications.warn(game.i18n.localize('DL.SpellMaxUsesReached'));
        }
    }

    useSpell(spell, boonsbanes) {
        const target = this.getTarget();
        let diceformular = "1d20";
        let usesText = "";

        // Add Attribute modifer to roll
        let attackAttribute = spell.data?.action?.attack;
        const attribute = this.data.data.attributes[attackAttribute.toLowerCase()];

        let defenseAttribute = spell.data?.action?.defense;
        let challStrength = defenseAttribute == game.i18n.localize('DL.AttributeStrength') ? true : false;
        let challAgility = defenseAttribute == game.i18n.localize('DL.AttributeAgility') ? true : false;
        let challIntellect = defenseAttribute == game.i18n.localize('DL.AttributeIntellect') ? true : false;
        let challWill = defenseAttribute == game.i18n.localize('DL.AttributeWill') ? true : false;
        let challPerception = defenseAttribute == game.i18n.localize('DL.AttributePerception') ? true : false;

        // Roll for Attack
        if (attribute && attribute.modifier != 0) {
            diceformular = diceformular + (attribute.modifier > 0 ? "+" + attribute.modifier : attribute.modifier);
        }

        // Add weapon boonsbanes
        if (spell.data?.action?.boonsbanes != 0) {
            boonsbanes = parseInt(boonsbanes) + parseInt(spell.data?.action?.boonsbanes);
        }
        if (boonsbanes == undefined || boonsbanes == NaN || boonsbanes == 0) {
            boonsbanes = 0;
        } else {
            diceformular += "+" + boonsbanes + "d6kh";
        }
        let attackRoll = new Roll(diceformular, {});
        attackRoll.roll();

        // Format Dice
        let diceData = this.formatDice(attackRoll);

        // Roll Against Target
        const targetNumber = this.getTargetNumber(spell);

        //Plus20 roll
        let plus20 = (attackRoll._total >= 20 ? true : false);

        // Effect Dice roll
        let effectdice = "";
        if (spell.data.effectdice != "" && spell.data.effectdice != undefined) {
            let effectRoll = new Roll(spell.data.effectdice, {});
            effectRoll.roll();
            effectdice = effectRoll._total;
        }

        if (parseInt(spell.data?.castings?.value) >= 0 && parseInt(spell.data?.castings?.max) > 0) {
            let uses = parseInt(spell.data?.castings?.value);
            let usesmax = parseInt(spell.data?.castings?.max);

            if (uses < usesmax) {
                spell.data.castings.value = Number(uses) + 1;
                uses++;
            } else {
                spell.data.castings.value = 0;
            }
            this.updateEmbeddedEntity('OwnedItem', spell);

            usesText = game.i18n.localize('DL.SpellCastingsUses') + ": " + uses + " / " + usesmax;
        }

        let resultText = attackRoll != null && targetNumber != undefined && attackRoll._total >= parseInt(targetNumber) ? "SUCCESS" : "FAILURE";
        let diceTotal = attackRoll != null ? attackRoll._total : "";
        if (this.data.type === 'creature' && !game.settings.get('demonlord', 'attackShowAttack')) {
            diceTotal = "?";
            resultText = "";
        }

        const againstNumber = target != null && target.actor?.data.type == "character" || game.settings.get('demonlord', 'attackShowDefense') && targetNumber != undefined ? targetNumber : "?";

        var templateData = {
            actor: this,
            item: {
                data: spell,
                name: spell.name
            },
            data: {
                id: {
                    value: spell._id
                },
                diceTotal: {
                    value: diceTotal
                },
                diceTotalGM: {
                    value: attackRoll != null ? attackRoll._total : ""
                },
                diceResult: {
                    value: attackRoll.result.toString()
                },
                resultText: {
                    value: resultText
                },
                didHit: {
                    value: attackRoll._total >= targetNumber ? true : false
                },
                attack: {
                    value: attackAttribute.toUpperCase()
                },
                against: {
                    value: spell.data.action?.against.toUpperCase()
                },
                againstNumber: {
                    value: againstNumber
                },
                againstNumberGM: {
                    value: againstNumber == "?" ? targetNumber : againstNumber
                },
                damageFormular: {
                    value: spell.data.action?.damage
                },
                damageExtra20plusFormular: {
                    value: spell.data.action?.plus20damage
                },
                attribute: {
                    value: spell.data?.attribute
                },
                plus20: {
                    value: plus20
                },
                plus20text: {
                    value: spell.data?.action?.plus20
                },
                description: {
                    value: spell.data?.description
                },
                spellcastings: {
                    value: spell.data?.castings?.max
                },
                spellduration: {
                    value: spell.data?.duration
                },
                spelltarget: {
                    value: spell.data?.target
                },
                spellarea: {
                    value: spell.data?.area
                },
                spellrequirements: {
                    value: spell.data?.requirements
                },
                spellsacrifice: {
                    value: spell.data?.sacrifice
                },
                spellpermanence: {
                    value: spell.data?.permanence
                },
                spellspecial: {
                    value: spell.data?.special
                },
                spelltriggered: {
                    value: spell.data?.triggered
                },
                tagetname: {
                    value: target != null ? target.name : ""
                },
                effectdice: {
                    value: effectdice
                },
                defense: {
                    value: spell.data?.action?.defense
                },
                defenseboonsbanes: {
                    value: parseInt(spell.data?.action?.defenseboonsbanes)
                },
                challStrength: {
                    value: challStrength
                },
                challAgility: {
                    value: challAgility
                },
                challIntellect: {
                    value: challIntellect
                },
                challWill: {
                    value: challWill
                },
                challPerception: {
                    value: challPerception
                },
                uses: {
                    value: usesText
                },
                isCreature: {
                    value: this.data.type == "creature" ? true : false
                },
                healing: {
                    value: spell.data?.healing?.healactive && spell.data?.healing?.healing ?
                        spell.data?.healing?.healing : false
                }
            },
            diceData
        };

        let chatData = {
            user: game.user._id,
            speaker: {
                actor: this._id,
                token: this.token,
                alias: this.name
            }
        };

        let rollMode = game.settings.get("core", "rollMode");
        if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");

        let template = 'systems/demonlord/templates/chat/spell.html';
        renderTemplate(template, templateData).then(content => {
            chatData.content = content;
            if (game.dice3d && attackRoll != null && attackAttribute) {
                if (this.data.type === 'creature' && !game.settings.get('demonlord', 'attackShowAttack')) {
                    if (attackRoll != null)
                        chatData.sound = CONFIG.sounds.dice;
                    ChatMessage.create(chatData);
                } else {
                    game.dice3d.showForRoll(attackRoll, game.user, true, chatData.whisper, chatData.blind).then(displayed => ChatMessage.create(chatData));
                }
            } else {
                if (attackRoll != null && attackAttribute) {
                    chatData.sound = CONFIG.sounds.dice;
                }
                ChatMessage.create(chatData);
            }
        });
    }

    getTarget() {
        let selectedTarget = null
        game.user.targets.forEach(async target => {
            selectedTarget = target;
        });

        return selectedTarget;
    }

    getTargetNumber(item) {
        let tagetNumber;
        game.user.targets.forEach(async target => {
            const targetActor = target.actor;
            if (targetActor) {
                let againstSelectedAttribute = item.data.data?.action?.against?.toLowerCase();

                if (againstSelectedAttribute == undefined)
                    againstSelectedAttribute = item.data.action?.against?.toLowerCase();

                if (againstSelectedAttribute == "defense") {
                    tagetNumber = targetActor.data.data?.characteristics?.defense;
                } else {
                    tagetNumber = targetActor.data.data?.attributes[againstSelectedAttribute]?.value;
                }
            }
        });

        return tagetNumber;
    }

    getVSTargetNumber(talent) {
        let tagetNumber;

        game.user.targets.forEach(async target => {
            const targetActor = target.actor;
            if (targetActor) {
                let againstSelectedAttribute = talent.data.vs.against.toLowerCase();

                if (againstSelectedAttribute == "defense") {
                    tagetNumber = targetActor.data.data.characteristics.defense;
                } else {
                    tagetNumber = targetActor.data.data.attributes[againstSelectedAttribute].value;
                }
            }
        });

        return tagetNumber;
    }

    generateCharacterBuffs(type) {
        const characterbuffs = new CharacterBuff();
        const talents = this.getEmbeddedCollection("OwnedItem").filter(e => "talent" === e.type)

        for (let talent of talents) {
            if (talent.data.addtonextroll) {
                if (talent.data?.boonsbanesactive && talent.data.action?.boonsbanes != "") {
                    characterbuffs.attackbonus = parseInt(characterbuffs.attackbonus) + parseInt(talent.data.action?.boonsbanes);
                }
                if (talent.data?.damageactive && talent.data.action?.damage != "") {
                    characterbuffs.attackdamagebonus += "+" + talent.data.action?.damage;
                }
                if (talent.data?.plus20active && talent.data.action?.plus20 != "") {
                    characterbuffs.attack20plusdamagebonus += "+" + talent.data.action?.plus20;
                }
                if (talent.data?.challenge?.boonsbanesactive && talent.data.challenge?.boonsbanes != "") {
                    characterbuffs.challengebonus = parseInt(characterbuffs.challengebonus) + parseInt(talent.data.challenge?.boonsbanes);
                    characterbuffs.challengeeffects += this.buildTalentEffects(talent, true, type);
                } else {
                    characterbuffs.attackeffects += this.buildTalentEffects(talent, true, type);
                }
                if (talent.data.bonuses?.defenseactive && talent.data.bonuses?.defense != "") {
                    characterbuffs.defensebonus += parseInt(talent.data.bonuses.defense);
                }
                if (talent.data.bonuses?.healthactive && talent.data.bonuses?.health != "") {
                    characterbuffs.healthbonus += parseInt(talent.data.bonuses.health);
                }
                if (talent.data.bonuses?.poweractive && talent.data.bonuses?.power != "") {
                    characterbuffs.powerbonus += parseInt(talent.data.bonuses.power);
                }
                if (talent.data.bonuses?.speedactive && talent.data.bonuses?.speed != "") {
                    characterbuffs.speedbonus += parseInt(talent.data.bonuses.speed);
                }
                if (talent.data.healing?.healactive && talent.data.healing?.rate != "") {
                    characterbuffs.healing += parseInt(talent.data.healing.rate);
                }
            }
        }

        const items = this.getEmbeddedCollection("OwnedItem").filter(e => "item" === e.type);
        let itemAttackbonus = 0;
        let itemChallengebonus = 0;
        let itemDamageBonus = "";
        let itemDefenseBonus = 0;
        let itemSpeedBonus = 0;
        let itemPerceptionBonus = 0;

        for (let item of items) {
            if (item.data.wear) {
                if (item.data.enchantment?.attackbonus != null)
                    itemAttackbonus += parseInt(item.data.enchantment?.attackbonus);
                if (item.data.enchantment?.challengebonus != null)
                    itemChallengebonus += parseInt(item.data.enchantment?.challengebonus);
                if (item.data.enchantment?.damage != "")
                    itemDamageBonus += "+" + item.data.enchantment?.damage;
                if (item.data.enchantment?.defense != null)
                    itemDefenseBonus += parseInt(item.data.enchantment?.defense);
                if (item.data.enchantment?.speed != null)
                    itemSpeedBonus += parseInt(item.data.enchantment?.speed);
                if (item.data.enchantment?.perception != null)
                    itemPerceptionBonus += parseInt(item.data.enchantment?.perception);
            }
        }
        characterbuffs.attackbonus += itemAttackbonus;
        characterbuffs.challengebonus += itemChallengebonus;
        characterbuffs.attackdamagebonus += itemDamageBonus;
        characterbuffs.defensebonus += itemDefenseBonus;
        characterbuffs.speedbonus += itemSpeedBonus;
        characterbuffs.perception += itemPerceptionBonus;

        // If you wear armor and do not meet or exceed its requirements: -1 Bane
        const armors = this.getEmbeddedCollection("OwnedItem").filter(e => "armor" === e.type);
        let armorAttackbonus = 0;
        for (let armor of armors) {
            if (armor.data.wear && !armor.data.isShield) {
                if (armor.data.strengthmin != "" && (parseInt(armor.data.strengthmin) > parseInt(this.data.data?.attributes?.strength?.value))) {
                    armorAttackbonus = -1;
                }
            }
        }
        characterbuffs.attackbonus += armorAttackbonus;

        const mods = this.getEmbeddedCollection("OwnedItem").filter(e => "mod" === e.type);
        let modAttackbonus = 0;
        let modChallengebonus = 0;
        let modDamageBonus = "";
        let modDefenseBonus = 0;
        let modHealingBonus = 0;
        let modSpeedBonus = 0;
        for (let mod of mods) {
            if (mod.data.active) {
                if (mod.data.modtype == game.i18n.localize('DL.TalentAttackBoonsBanes'))
                    modAttackbonus += parseInt(mod.data.modifier);
                if (mod.data.modtype == game.i18n.localize('DL.TalentChallengeBoonsBanes'))
                    modChallengebonus += parseInt(mod.data.modifier);
                if (mod.data.modtype == game.i18n.localize('DL.ModsListDamage'))
                    modDamageBonus += "+" + mod.data.modifier;
                if (mod.data.modtype == game.i18n.localize('DL.ItemDefenseModifier'))
                    modDefenseBonus += parseInt(mod.data.modifier);
                if (mod.data.modtype == game.i18n.localize('DL.ModsListHealth'))
                    modHealingBonus += parseInt(mod.data.modifier);
                if (mod.data.modtype == game.i18n.localize('DL.ModsListSpeed'))
                    modSpeedBonus += parseInt(mod.data.modifier);
            }
        }
        characterbuffs.attackbonus += modAttackbonus;
        characterbuffs.challengebonus += modChallengebonus;
        characterbuffs.attackdamagebonus += modDamageBonus;
        characterbuffs.defensebonus += modDefenseBonus;
        characterbuffs.healthbonus += modHealingBonus;
        characterbuffs.speedbonus += modSpeedBonus;

        // Afflictions
        if (this.data.data.afflictions?.fatigued) {
            characterbuffs.attackbonus += -1;
            characterbuffs.challengebonus += -1;
        }
        if (this.data.data.afflictions?.diseased) {
            characterbuffs.attackbonus += -1;
            characterbuffs.challengebonus += -1;
        }
        if (this.data.data.afflictions?.impaired) {
            characterbuffs.attackbonus += -1;
            characterbuffs.challengebonus += -1;
        }
        if (this.data.data.afflictions?.poisoned) {
            characterbuffs.attackbonus += -1;
            characterbuffs.challengebonus += -1;
        }

        return characterbuffs;
    }

    buildTalentEffects(talent, showTalentName, type) {
        let effects = "";

        if (showTalentName) {
            effects = talent.name + ":<br>";
        }

        if (talent.data?.boonsbanesactive && talent.data?.action?.boonsbanes)
            effects += "&nbsp;&nbsp;&nbsp;• " + game.i18n.localize('DL.TalentAttackBoonsBanes') + ": " + talent.data.action?.boonsbanes + "<br>";
        if (talent.data?.damageactive && talent.data?.action?.damage)
            effects += "&nbsp;&nbsp;&nbsp;• " + game.i18n.localize('DL.TalentExtraDamage') + ": " + talent.data.action?.damage + "<br>";
        if (talent.data?.plus20active && talent.data?.action?.plus20)
            effects += "&nbsp;&nbsp;&nbsp;• " + game.i18n.localize('DL.TalentExtraDamage20plus') + ": " + talent.data.action?.plus20 + "<br>";
        if (talent.data?.challenge?.boonsbanesactive && talent.data?.challenge?.boonsbanes)
            effects += "&nbsp;&nbsp;&nbsp;• " + game.i18n.localize('DL.TalentChallengeBoonsBanes') + ": " + talent.data.challenge?.boonsbanes + "<br>";
        if (type == "TALENT" && talent.data?.vs?.boonsbanesactive && talent.data?.vs?.boonsbanes)
            effects += "&nbsp;&nbsp;&nbsp;• " + game.i18n.localize('DL.TalentVSBoonsBanes') + ": " + talent.data.vs?.boonsbanes
                + "<br>";
        if (type == "TALENT" && talent.data?.vs?.damageactive && talent.data?.vs?.damage)
            effects += "&nbsp;&nbsp;&nbsp;• " + game.i18n.localize('DL.TalentVSDamage') + ": " + talent.data.vs?.damage
                + "<br>";
        if (type == "TALENT" && talent.data?.healing?.healactive && talent.data?.healing?.rate)
            effects += "&nbsp;&nbsp;&nbsp;• " + game.i18n.localize('DL.TalentHealing') + ": " + talent.data.healing?.rate
                + "<br>";
        if (type == "TALENT" && talent.data?.damage)
            effects += "&nbsp;&nbsp;&nbsp;• " + game.i18n.localize('DL.TalentDamage') + ": " + talent.data?.damage
                + "<br>";
        if (!showTalentName && type == "TALENT") {
            if (talent.data?.bonuses?.defenseactive && talent.data?.bonuses?.defense)
                effects += "&nbsp;&nbsp;&nbsp;• " + game.i18n.localize('DL.TalentBonusesDefense') + ": " + talent.data.bonuses?.defense
                    + "<br>";
            if (talent.data?.bonuses?.healthactive && talent.data?.bonuses?.health)
                effects += "&nbsp;&nbsp;&nbsp;• " + game.i18n.localize('DL.TalentBonusesHealth') + ": " + talent.data.bonuses?.health
                    + "<br>";
            if (talent.data?.bonuses?.poweractive && talent.data?.bonuses?.power)
                effects += "&nbsp;&nbsp;&nbsp;• " + game.i18n.localize('DL.TalentBonusesPower') + ": " + talent.data.bonuses?.power
                    + "<br>";
            if (talent.data?.bonuses?.speedactive && talent.data?.bonuses?.speed)
                effects += "&nbsp;&nbsp;&nbsp;• " + game.i18n.localize('DL.TalentBonusesSpeed') + ": " + talent.data.bonuses?.speed
                    + "<br>";
        }
        if (effects == talent.name + ":<br>")
            effects = "";

        return effects;
    }

    async activateTalent(talent, setActive) {
        let uses = talent.data.uses?.value;
        let usesmax = talent.data.uses?.max;

        if (parseInt(uses) >= 0) {
            if (uses < usesmax) {
                talent.data.uses.value = Number(uses) + 1;
                talent.data.addtonextroll = setActive;
            } else {
                talent.data.uses.value = 0;
                talent.data.addtonextroll = false;

                if (this.data.data.activebonuses) {
                    this.removeCharacterBonuses(talent);
                }
            }

            if (!this.data.data.activebonuses) {
                this.addCharacterBonuses(talent);
            }

            await this.updateEmbeddedEntity('OwnedItem', talent);
        }
    }

    async deactivateTalent(talent) {
        const item = this.getOwnedItem(talent._id);
        let that = this;
        await item.update({
            "data.addtonextroll": false
        }).then(item => {
            that.render();
        });
    }

    async addCharacterBonuses(talent) {
        const healthbonus = talent.data.bonuses?.defenseactive && talent.data.bonuses?.health != "" ? parseInt(talent.data.bonuses?.health) : 0;
        const defensebonus = talent.data.bonuses?.healthactive && talent.data.bonuses?.defense != "" ? parseInt(talent.data.bonuses?.defense) : 0;
        const powerbonus = talent.data.bonuses?.poweractive && talent.data.bonuses?.power != "" ? parseInt(talent.data.bonuses?.power) : 0;
        const speedbonus = talent.data.bonuses?.speedactive && talent.data.bonuses?.speed != "" ? parseInt(talent.data.bonuses?.speed) : 0;
        /*
                await this.update({
                    "data.characteristics.health.max": parseInt(this.data.data.characteristics.health.max) + healthbonus,
                    "data.characteristics.defense": parseInt(this.data.data.characteristics.defense) + defensebonus,
                    "data.characteristics.speed.value": parseInt(this.data.data.characteristics.speed.value) + speedbonus,
                    "data.activebonuses": true
                });
                */
    }

    async removeCharacterBonuses(talent) {
        const healthbonus = talent.data.bonuses?.defenseactive && talent.data.bonuses?.health != "" ? parseInt(talent.data.bonuses?.health) : 0;
        const defensebonus = talent.data.bonuses?.healthactive && talent.data.bonuses?.defense != "" ? parseInt(talent.data.bonuses?.defense) : 0;
        const powerbonus = talent.data.bonuses?.poweractive && talent.data.bonuses?.power != "" ? parseInt(talent.data.bonuses?.power) : 0;
        const speedbonus = talent.data.bonuses?.speedactive && talent.data.bonuses?.speed != "" ? parseInt(talent.data.bonuses?.speed) : 0;

        await this.update({
            "data.characteristics.health.max": parseInt(this.data.data.characteristics.health.max) - healthbonus,
            "data.characteristics.defense": parseInt(this.data.data.characteristics.defense) - defensebonus,
            "data.characteristics.power": parseInt(this.data.data.characteristics.power) - powerbonus,
            "data.characteristics.speed.value": parseInt(this.data.data.characteristics.speed.value) - speedbonus,
            "data.activebonuses": false
        });
    }

    async addDamageToTarget(damage) {
        game.user.targets.forEach(async target => {
            const targetActor = target.actor;
            const currentDamage = parseInt(targetActor.data.data.characteristics.health.value);
            alert(damage);
            if (game.settings.get('demonlord', 'reverseDamage')) {
                if (currentDamage - damage <= 0) {
                    await targetActor.update({
                        "data.characteristics.health.value": 0
                    });
                } else {
                    await targetActor.update({
                        "data.characteristics.health.value": currentDamage - damage
                    });
                }
            } else {
                await targetActor.update({
                    "data.characteristics.health.value": currentDamage + damage
                });
            }
        });
    }

    async updateCharacterMods(modItem) {
        const mod = duplicate(modItem);

        let roundsleft = parseInt(mod.data.roundsleft);
        if (roundsleft > 0) {
            roundsleft--;
            mod.data.roundsleft = roundsleft;
            if (roundsleft == 0) {
                mod.data.roundsleft = mod.data.rounds;
                mod.data.active = false;
            }
            await this.updateEmbeddedEntity("OwnedItem", mod);
            this.render(true);
        }
    }

    formatDice(diceRoll) {
        let diceData = { dice: [] };

        if (diceRoll != null) {
            let pushDice = (diceData, total, faces, color) => {
                let img = null;
                if ([4, 6, 8, 10, 12, 20].indexOf(faces) > -1) {
                    img = `../icons/svg/d${faces}-grey.svg`;
                }
                diceData.dice.push({
                    img: img,
                    result: total,
                    dice: true,
                    color: color
                });
            };

            for (let i = 0; i < diceRoll.parts.length; i++) {
                if (diceRoll.parts[i] instanceof Die) {
                    let pool = diceRoll.parts[i].rolls;
                    let faces = diceRoll.parts[i].faces;

                    pool.forEach((pooldie) => {
                        if (pooldie.discarded) {
                            pushDice(diceData, pooldie.roll, faces, "#777");
                        } else {
                            pushDice(diceData, pooldie.roll, faces, "white");
                        }

                    });
                } else if (typeof diceRoll.parts[i] == 'string') {
                    const parsed = parseInt(diceRoll.parts[i]);
                    if (!isNaN(parsed)) {
                        diceData.dice.push({
                            img: null,
                            result: parsed,
                            dice: false,
                            color: 'white'
                        });
                    } else {
                        diceData.dice.push({
                            img: null,
                            result: diceRoll.parts[i],
                            dice: false
                        });
                    }
                }
            }
        }

        return diceData;
    }
}
