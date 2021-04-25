/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
import { FormatDice } from '../dice.js';
import { ActorRolls } from './actor-rolls';
import { ActorAfflictionsEffects } from './actor-afflictions-effects';

export class DemonlordActor extends Actor {
  /** @override */
  prepareBaseData() {
    switch (this.data.type) {
      case 'character':
        return this._prepareCharacterData(this.data);
      case 'creature':
        return this._prepareCharacterData(this.data);
    }
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;
    let will;
    let savedAncestry = null;
    let pathHealthBonus = 0;
    let ancestryFixedArmor = false;

    const characterbuffs = this.generateCharacterBuffs();
    const ancestries = actorData.items.filter((e) => e.type === 'ancestry');

    for (const ancestry of ancestries) {
      savedAncestry = ancestry;

      data.ancestry = ancestry.data.name;

      if (!game.settings.get('demonlord', 'useHomebrewMode')) {
        data.attributes.strength.value = parseInt(ancestry.data.data.attributes?.strength.value);
        data.attributes.agility.value = parseInt(ancestry.data.data.attributes?.agility.value);
        data.attributes.intellect.value = parseInt(ancestry.data.data.attributes?.intellect.value);
        data.attributes.will.value = parseInt(ancestry.data.data.attributes?.will.value);

        data.characteristics.insanity.max = ancestry.data.data.attributes?.will.value;

        // Paths
        if (data.level > 0) {
          for (let i = 1; i <= data.level; i++) {
            const paths = actorData.items.filter((e) => e.type === 'path');
            paths.forEach((path) => {
              path.data.data.levels
                .filter(function ($level) {
                  return $level.level == i;
                })
                .forEach(function ($level) {
                  // Attributes
                  if ($level.attributeStrengthSelected) {
                    data.attributes.strength.value += parseInt($level.attributeStrength);
                  }
                  if ($level.attributeAgilitySelected) {
                    data.attributes.agility.value += parseInt($level.attributeAgility);
                  }
                  if ($level.attributeIntellectSelected) {
                    data.attributes.intellect.value += parseInt($level.attributeIntellect);
                  }
                  if ($level.attributeWillSelected) {
                    data.attributes.will.value += parseInt($level.attributeWill);
                  }

                  if ($level.attributeSelectIsFixed) {
                    if ($level.attributeStrength > 0) {
                      data.attributes.strength.value += parseInt($level.attributeStrength);
                    }
                    if ($level.attributeAgility > 0) {
                      data.attributes.agility.value += parseInt($level.attributeAgility);
                    }
                    if ($level.attributeIntellect > 0) {
                      data.attributes.intellect.value += parseInt($level.attributeIntellect);
                    }
                    if ($level.attributeWill > 0) {
                      data.attributes.will.value += parseInt($level.attributeWill);
                    }
                  }

                  pathHealthBonus += $level.characteristicsHealth;

                  switch (path.data.type) {
                    case 'novice':
                      data.paths.novice = path.name;
                      break;
                    case 'expert':
                      data.paths.expert = path.name;
                      break;
                    case 'master':
                      data.paths.master = path.name;
                      break;
                    default:
                      break;
                  }
                });
            });
          }
        }
      } else {
        // Paths
        if (data.level > 0) {
          for (let i = 1; i <= data.level; i++) {
            const paths = actorData.items.filter((e) => e.type === 'path');
            paths.forEach((path) => {
              path.data.levels
                .filter(function ($level) {
                  return $level.level == i;
                })
                .forEach(function ($level) {
                  pathHealthBonus += $level.characteristicsHealth;

                  switch (path.data.type) {
                    case 'novice':
                      data.paths.novice = path.name;
                      break;
                    case 'expert':
                      data.paths.expert = path.name;
                      break;
                    case 'master':
                      data.paths.master = path.name;
                      break;
                    default:
                      break;
                  }
                });
            });
          }
        }
      }

      // Calculate Health and Healing Rate
      if (game.settings.get('demonlord', 'reverseDamage')) {
        if (data.characteristics.health.value < 0) {
          data.characteristics.health.value =
            parseInt(data.attributes.strength.value) +
            parseInt(ancestry.data.data.characteristics?.healthmodifier) +
            characterbuffs.healthbonus +
            pathHealthBonus;
        }
        data.characteristics.health.max =
          parseInt(data.attributes.strength.value) +
          parseInt(ancestry.data.data.characteristics?.healthmodifier) +
          characterbuffs.healthbonus +
          pathHealthBonus;
      } else {
        data.characteristics.health.max =
          parseInt(data.attributes.strength.value) +
          parseInt(ancestry.data.data.characteristics?.healthmodifier) +
          characterbuffs.healthbonus +
          pathHealthBonus;
      }
      if (data.level >= 4) {
        if (game.settings.get('demonlord', 'reverseDamage')) {
          if (data.characteristics.health.value == 0) {
            data.characteristics.health.value += parseInt(ancestry.data.data.level4?.healthbonus);
          }
          data.characteristics.health.max += parseInt(ancestry.data.data.level4?.healthbonus);
        } else {
          data.characteristics.health.max += parseInt(ancestry.data.data.level4?.healthbonus);
        }
      }
      data.characteristics.health.healingrate =
        Math.floor(parseInt(data.characteristics.health.max) / 4) +
        parseInt(ancestry.data.data.characteristics?.healingratemodifier);
      // ******************

      data.attributes.perception.value =
        parseInt(data.attributes.intellect.value) + parseInt(ancestry.data.data.characteristics.perceptionmodifier);

      if (parseInt(ancestry.data.data.characteristics?.defensemodifier) > 10) {
        data.characteristics.defense = parseInt(ancestry.data.data.characteristics?.defensemodifier);
        ancestryFixedArmor = true;
      } else {
        data.characteristics.defense =
          parseInt(data.attributes.agility.value) + parseInt(ancestry.data.data.characteristics.defensemodifier);
      }

      data.characteristics.power = parseInt(ancestry.data.data.characteristics?.power);
      data.characteristics.speed = parseInt(ancestry.data.data.characteristics?.speed);
      data.characteristics.size = ancestry.data.data.characteristics.size;

      // These were still breaking the sanity/corruption fields..
      // data.characteristics.insanity.value += parseInt(
      //   ancestry.data.characteristics.insanity
      // )
      // data.characteristics.corruption += parseInt(
      //   ancestry.data.characteristics.corruption
      // )
    }

    if (savedAncestry == null && this.data.type != 'creature') {
      data.attributes.perception.value = parseInt(data.attributes.intellect.value);
      data.characteristics.defense = parseInt(data.attributes.agility.value);

      if (game.settings.get('demonlord', 'reverseDamage')) {
        if (data.characteristics.health.value == 0) {
          data.characteristics.health.value = parseInt(data.attributes.strength.value) + characterbuffs.healthbonus;
        }
        data.characteristics.health.max = parseInt(data.attributes.strength.value) + characterbuffs.healthbonus;
      } else {
        data.characteristics.health.max = parseInt(data.attributes.strength.value) + characterbuffs.healthbonus;
      }
    }

    // Paths
    let pathDefenseBonus = 0;
    if (data.level > 0) {
      const actor = this;

      for (let i = 1; i <= data.level; i++) {
        const paths = actorData.items.filter((e) => e.type === 'path');
        paths.forEach((path) => {
          path.data.data.levels
            .filter(function ($level) {
              return $level.level == i;
            })
            .forEach(function ($level) {
              // Characteristics
              data.characteristics.power = parseInt(data.characteristics.power) + parseInt($level.characteristicsPower);
              pathDefenseBonus = $level.characteristicsDefense;
              data.characteristics.speed += $level.characteristicsSpeed;
              data.attributes.perception.value += $level.characteristicsPerception;
            });
        });
      }
    }

    // Loop through ability scores, and add their modifiers to our sheet output.
    for (const [key, attribute] of Object.entries(data.attributes)) {
      if (attribute.value > attribute.max) {
        attribute.value = attribute.max;
      }
      if (attribute.value < attribute.min) {
        attribute.value = attribute.min;
      }

      attribute.modifier = attribute.value - 10;
      attribute.label = CONFIG.DL.attributes[key].toUpperCase();
    }

    const armors = actorData.items.filter((e) => e.type === 'armor');
    let armorpoint = 0;
    let agilitypoint = 0;
    let defenseBonus = 0;
    let speedPenalty = 0;
    for (const armor of armors) {
      if (armor.data.data.wear) {
        // If you wear armor and do not meet or exceed its requirements: -2 speed
        if (
          !armor.data.data.isShield &&
          armor.data.data.strengthmin != '' &&
          !ancestryFixedArmor &&
          parseInt(armor.data.data.strengthmin) > parseInt(data.attributes.strength.value)
        ) {
          speedPenalty = -2;
        }

        if (armor.data.data.agility && agilitypoint == 0) {
          agilitypoint = parseInt(armor.data.agility);
        }
        if (armor.data.data.fixed) armorpoint = parseInt(armor.data.data.fixed);
        if (armor.data.data.defense) defenseBonus = parseInt(armor.data.data.defense);
      }
    }

    if (ancestryFixedArmor) {
      if (armorpoint > data.characteristics.defense) {
        data.characteristics.defense = armorpoint;
      }
      data.characteristics.defense += pathDefenseBonus + defenseBonus + characterbuffs.defensebonus;
    } else if (armorpoint >= 11) {
      data.characteristics.defense =
        parseInt(armorpoint) + parseInt(defenseBonus) + pathDefenseBonus + characterbuffs.defensebonus;
    } else {
      data.characteristics.defense =
        parseInt(data.characteristics.defense) +
        parseInt(defenseBonus) +
        parseInt(agilitypoint) +
        pathDefenseBonus +
        characterbuffs.defensebonus;
    }

    if (data.characteristics.defense > 25) data.characteristics.defense = 25;

    characterbuffs.speedbonus += speedPenalty;

    if (game.settings.get('demonlord', 'useHomebrewMode')) {
      data.characteristics.health.healingrate = Math.floor(parseInt(data.characteristics.health.max) / 4);
    }

    // Afflictions
    if (data.afflictions.slowed) {
      data.characteristics.speed = Math.floor(parseInt(data.characteristics.speed + speedPenalty) / 2);
    } else {
      data.characteristics.speed = parseInt(data.characteristics.speed) + parseInt(characterbuffs.speedbonus);
    }

    if (data.afflictions.defenseless) data.characteristics.defense = 5;

    if (data.afflictions.blinded) {
      data.characteristics.speed = parseInt(data.characteristics.speed) < 2 ? parseInt(data.characteristics.speed) : 2;
    }

    // Calculate Insanity
    data.characteristics.insanity.max = data.attributes.will.value;

    data.characteristics.power += parseInt(characterbuffs.powerbonus);

    if (data.actions.rush) {
      data.characteristics.speed = data.characteristics.speed * 2;
    }

    if (data.actions.retreat) {
      data.characteristics.speed = Math.floor(data.characteristics.speed / 2);
    }

    if (data.afflictions.immobilized) data.characteristics.speed = 0;

    if (data.afflictions.unconscious) data.characteristics.defense = 5;
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
      data: data,
    };

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data.type;

    // Finally, create the item!
    return await this.createItem(itemData);
  }

  async _onDeleteEmbeddedEntity(embeddedName, child, options, userId) {
    const characterbuffs = this.generateCharacterBuffs();

    if (child.data?.addtonextroll) {
      await this.update({
        'data.characteristics.defensebonus':
          parseInt(characterbuffs.defensebonus) -
          (parseInt(child.data.bonuses.defense) ? parseInt(child.data.bonuses.defense) : 0),
        'data.characteristics.healthbonus':
          parseInt(characterbuffs.healthbonus) -
          (parseInt(child.data.bonuses.health) ? parseInt(child.data.bonuses.health) : 0),
        'data.characteristics.speedbonus':
          parseInt(characterbuffs.speedbonus) -
          (parseInt(child.data.bonuses.speed) ? parseInt(child.data.bonuses.speed) : 0),
        'data.characteristics.defense':
          parseInt(this.data.data.characteristics.defense) -
          (parseInt(child.data.bonuses.defense) ? parseInt(child.data.bonuses.defense) : 0),
        'data.characteristics.health.max':
          parseInt(this.data.data.characteristics.health.max) -
          (parseInt(child.data.bonuses.health) ? parseInt(child.data.bonuses.health) : 0),
        'data.characteristics.speed.value':
          parseInt(this.data.data.characteristics.speed.value) -
          (parseInt(child.data.bonuses.speed) ? parseInt(child.data.bonuses.speed) : 0),
      });
    }
  }

  rollChallenge(attribute) {
    ActorRolls.rollChallenge(this, attribute);
  }

  rollAttribute(attribute, boonsbanes, modifier) {
    ActorRolls.rollAttribute(this, attribute, boonsbanes, modifier);
  }

  rollWeaponAttackMacro(itemId, boonsbanes, damagebonus) {
    ActorRolls.rollWeaponAttackMacro(this, itemId, boonsbanes, damagebonus);
  }

  rollWeaponAttack(itemId, options = { event: null }) {
    ActorRolls.rollWeaponAttack(this, itemId, options);
  }

  rollAttack(weapon, boonsbanes, buffs, modifier) {
    ActorRolls.rollAttack(this, weapon, boonsbanes, buffs, modifier);
  }

  rollTalent(itemId, options = { event: null }) {
    ActorRolls.rollTalent(this, itemId, options);
  }

  useTalent(talent, boonsbanes, modifier) {
    const rollMode = game.settings.get('core', 'rollMode');
    const target = this.getTarget();
    let diceformular = '1d20';
    let roll = false;
    let attackRoll = null;
    let attackAttribute = '';
    let targetNumber = 0;
    let usesText = '';
    let damageformular = '';
    let diceData = '';

    // Generate Character Buffs
    const buffs = this.generateCharacterBuffs('TALENT');

    if (talent.data?.vs?.attribute) {
      targetNumber = this.getVSTargetNumber(talent);

      // if (targetNumber != undefined) {
      if (talent.data.vs?.damageactive) {
        this.activateTalent(talent, true);
      } else {
        this.activateTalent(talent, false);
      }

      attackAttribute = talent.data.vs.attribute;
      const attribute = this.data.data.attributes[attackAttribute.toLowerCase()];

      if (attackAttribute) {
        if (attribute && attribute.modifier != 0) {
          diceformular += attribute.modifier > 0 ? '+' + attribute.modifier : attribute.modifier;
        }
        roll = true;

        // Add boonsbanes
        if (talent.data.vs.boonsbanes != 0) {
          boonsbanes = parseInt(boonsbanes) + parseInt(talent.data.vs.boonsbanes);
        }

        // Challenge: Add buffs from Talents
        if (attackAttribute === 'Strength' && buffs.challengestrengthbonus != 0) {
          boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengestrengthbonus);
        }
        if (attackAttribute === 'Agility' && buffs.challengeagilitybonus != 0) {
          boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengeagilitybonus);
        }
        if (attackAttribute === 'Intellect' && buffs.challengeintellectbonus != 0) {
          boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengeintellectbonus);
        }
        if (attackAttribute === 'Will' && buffs.challengewillbonus != 0) {
          boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengewillbonus);
        }
        if (attackAttribute === 'Perception' && buffs.challengeperceptionbonus != 0) {
          boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengeperceptionbonus);
        }

        if (boonsbanes == undefined || isNaN(boonsbanes) || boonsbanes == 0) {
          boonsbanes = 0;
        } else {
          diceformular += '+' + boonsbanes + 'd6kh';
        }

        if (modifier != 0) {
          diceformular = diceformular + '+' + parseInt(modifier);
        }

        attackRoll = new Roll(diceformular, {});
        attackRoll.evaluate();

        // Format Dice
        diceData = FormatDice(attackRoll);

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
      const uses = parseInt(talent.data.uses?.value);
      const usesmax = parseInt(talent.data.uses?.max);
      usesText = game.i18n.localize('DL.TalentUses') + ': ' + uses + ' / ' + usesmax;
    }

    let resultText =
      attackRoll != null && targetNumber != undefined && attackRoll.total >= parseInt(targetNumber)
        ? game.i18n.localize('DL.DiceResultSuccess')
        : game.i18n.localize('DL.DiceResultFailure');
    let diceTotal = attackRoll != null ? attackRoll.total : '';
    if (this.data.type === 'creature' && !game.settings.get('demonlord', 'attackShowAttack')) {
      diceTotal = '?';
      resultText = '';
    }
    if (['blindroll'].includes(rollMode)) {
      diceTotal = '?';
      resultText = '';
    }

    const againstNumber =
      (target != null && target.actor?.data.type == 'character') ||
      (game.settings.get('demonlord', 'attackShowDefense') && targetNumber != undefined)
        ? targetNumber
        : '?';

    var templateData = {
      actor: this,
      item: talent,
      data: {
        id: {
          value: talent.id,
        },
        roll: {
          value: roll,
        },
        diceTotal: {
          value: diceTotal,
        },
        diceTotalGM: {
          value: attackRoll != null ? attackRoll.total : '',
        },
        resultText: {
          value: resultText,
        },
        didHit: {
          value: !!(targetNumber != undefined || attackRoll.total >= targetNumber),
        },
        attack: {
          value: attackAttribute
            ? game.i18n.localize(CONFIG.DL.attributes[attackAttribute.toLowerCase()].toUpperCase())
            : '',
        },
        against: {
          value: talent.data?.vs?.against
            ? game.i18n.localize(CONFIG.DL.attributes[talent.data?.vs?.against.toLowerCase()].toUpperCase())
            : '',
        },
        againstNumber: {
          value: againstNumber,
        },
        againstNumberGM: {
          value: againstNumber == '?' ? targetNumber : againstNumber,
        },
        damageFormular: {
          value: damageformular,
        },
        damageType: {
          value:
            talent.data.vs.damageactive && talent.data.vs.damage
              ? talent.data?.vs?.damagetype
              : talent.data?.action.damagetype,
        },
        damageTypes: {
          value: talent.data?.vs.damagetypes,
        },
        damageExtra20plusFormular: {
          value: talent.data?.action?.plus20,
        },
        effects: {
          value: this.buildTalentEffects(talent, false, 'TALENT'),
        },
        description: {
          value: talent.data?.description,
        },
        uses: {
          value: usesText,
        },
        healing: {
          value:
            talent.data?.healing?.healactive && talent.data?.healing?.healing ? talent.data?.healing?.healing : false,
        },
        targetname: {
          value: target != null ? target.name : '',
        },
        isCreature: {
          value: this.data.type == 'creature',
        },
        pureDamage: {
          value: talent.data?.damage,
        },
        pureDamageType: {
          value: talent.data?.damagetype,
        },
        afflictionEffects: {
          value: this.buildAfflictionsEffects('SPELL'),
        },
        ifBlindedRoll: ['blindroll'].includes(rollMode),
      },
      diceData,
    };

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: this.id,
        token: this.token,
        alias: this.name,
      },
    };

    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM');
    }
    if (rollMode === 'selfroll') chatData.whisper = [game.user.id];
    if (rollMode === 'blindroll') chatData.blind = true;

    if (talent.data?.damage || talent.data?.vs?.attribute || (!talent.data?.vs?.attribute && !talent.data?.damage)) {
      const template = 'systems/demonlord08/templates/chat/talent.html';
      renderTemplate(template, templateData).then((content) => {
        chatData.content = content;
        if (game.dice3d && attackRoll != null) {
          if (this.data.type === 'creature' && !game.settings.get('demonlord', 'attackShowAttack')) {
            if (attackRoll != null) chatData.sound = CONFIG.sounds.dice;
            ChatMessage.create(chatData);
          } else {
            game.dice3d
              .showForRoll(attackRoll, game.user, true, chatData.whisper, chatData.blind)
              .then((displayed) => ChatMessage.create(chatData));
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
    ActorRolls.rollSpell(this, itemId, options);
  }

  useSpell(spell, boonsbanes, buffs, modifier) {
    const rollMode = game.settings.get('core', 'rollMode');
    const target = this.getTarget();
    let diceformular = '1d20';
    let usesText = '';

    // Add Attribute modifer to roll
    const attackAttribute = spell.data?.action?.attack;
    const attribute = this.data.data.attributes[attackAttribute.toLowerCase()];

    const defenseAttribute = spell.data?.action?.defense;
    const challStrength = defenseAttribute == 'Strength';
    const challAgility = defenseAttribute == 'Agility';
    const challIntellect = defenseAttribute == 'Intellect';
    const challWill = defenseAttribute == 'Will';
    const challPerception = defenseAttribute == 'Perception';

    // Challenge: Add buffs from Talents
    if (challStrength && buffs.challengestrengthbonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengestrengthbonus);
    }
    if (challAgility && buffs.challengeagilitybonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengeagilitybonus);
    }
    if (challIntellect && buffs.challengeintellectbonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengeintellectbonus);
    }
    if (challWill && buffs.challengewillbonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengewillbonus);
    }
    if (challPerception && buffs.challengeperceptionbonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengeperceptionbonus);
    }

    // Roll for Attack
    if (attribute && attribute.modifier != 0) {
      diceformular = diceformular + (attribute.modifier > 0 ? '+' + attribute.modifier : attribute.modifier);
    }

    // Add spell attack boonsbanes
    if (spell.data?.action?.boonsbanes != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(spell.data?.action?.boonsbanes);
    }

    // Attack: Add buffs from Talents
    if (attackAttribute === 'Strength' && buffs.attackstrengthbonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackstrengthbonus);
    }
    if (attackAttribute === 'Agility' && buffs.attackagilitybonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackagilitybonus);
    }
    if (attackAttribute === 'Intellect' && buffs.attackintellectbonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackintellectbonus);
    }
    if (attackAttribute === 'Will' && buffs.attackwillbonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackwillbonus);
    }
    if (attackAttribute === 'Perception' && buffs.attackperceptionbonus != 0) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackperceptionbonus);
    }

    if (boonsbanes == undefined || isNaN(boonsbanes) || boonsbanes == 0) {
      boonsbanes = 0;
    } else {
      diceformular += '+' + boonsbanes + 'd6kh';
    }

    if (modifier != 0) {
      diceformular = diceformular + '+' + parseInt(modifier);
    }

    const attackRoll = new Roll(diceformular, {});
    attackRoll.evaluate();

    // Format Dice
    const diceData = FormatDice(attackRoll);

    // Roll Against Target
    const targetNumber = this.getTargetNumber(spell);

    // Plus20 roll
    const plus20 = attackRoll.total >= 20;

    // Effect Dice roll
    let effectdice = '';
    if (spell.data.effectdice != '' && spell.data.effectdice != undefined) {
      const effectRoll = new Roll(spell.data.effectdice, {});
      effectRoll.evaluate();
      effectdice = effectRoll.total;
    }

    if (parseInt(spell.data?.castings?.value) >= 0 && parseInt(spell.data?.castings?.max) > 0) {
      let uses = parseInt(spell.data?.castings?.value);
      const usesmax = parseInt(spell.data?.castings?.max);

      if (uses < usesmax) {
        spell.data.castings.value = '' + (Number(uses) + 1);
        uses++;
      } else {
        spell.data.castings.value = '0';
      }
      Item.updateDocuments([spell], { parent: this });

      usesText = game.i18n.localize('DL.SpellCastingsUses') + ': ' + uses + ' / ' + usesmax;
    }

    let resultText =
      attackRoll != null && targetNumber != undefined && attackRoll.total >= parseInt(targetNumber)
        ? game.i18n.localize('DL.DiceResultSuccess')
        : game.i18n.localize('DL.DiceResultFailure');
    let diceTotal = attackRoll != null ? attackRoll.total : '';
    if (this.data.type === 'creature' && !game.settings.get('demonlord', 'attackShowAttack')) {
      diceTotal = '?';
      resultText = '';
    }
    if (['blindroll'].includes(rollMode)) {
      diceTotal = '?';
      resultText = '';
    }

    const againstNumber =
      (target != null && target.actor?.data.type == 'character') ||
      (game.settings.get('demonlord', 'attackShowDefense') && targetNumber != undefined)
        ? targetNumber
        : '?';

    var templateData = {
      actor: this,
      item: {
        data: spell,
        name: spell.name,
      },
      data: {
        id: {
          value: spell.id,
        },
        diceTotal: {
          value: diceTotal,
        },
        diceTotalGM: {
          value: attackRoll != null ? attackRoll.total : '',
        },
        resultText: {
          value: resultText,
        },
        didHit: {
          value: attackRoll.total >= targetNumber,
        },
        attack: {
          value: attackAttribute
            ? game.i18n.localize(CONFIG.DL.attributes[attackAttribute.toLowerCase()].toUpperCase())
            : '',
        },
        against: {
          value: spell.data.action?.against
            ? game.i18n.localize(CONFIG.DL.attributes[spell.data.action?.against.toLowerCase()].toUpperCase())
            : '',
        },
        againstNumber: {
          value: againstNumber,
        },
        againstNumberGM: {
          value: againstNumber == '?' ? targetNumber : againstNumber,
        },
        damageFormular: {
          value: spell.data.action?.damage,
        },
        damageType: {
          value: spell.data.action?.damagetype,
        },
        damageTypes: {
          value: spell.data?.action?.damagetypes,
        },
        damageExtra20plusFormular: {
          value: spell.data.action?.plus20damage,
        },
        attribute: {
          value: spell.data?.attribute,
        },
        plus20: {
          value: plus20,
        },
        plus20text: {
          value: spell.data?.action?.plus20,
        },
        description: {
          value: spell.data?.description,
        },
        spellcastings: {
          value: spell.data?.castings?.max,
        },
        spellduration: {
          value: spell.data?.duration,
        },
        spelltarget: {
          value: spell.data?.target,
        },
        spellarea: {
          value: spell.data?.area,
        },
        spellrequirements: {
          value: spell.data?.requirements,
        },
        spellsacrifice: {
          value: spell.data?.sacrifice,
        },
        spellpermanence: {
          value: spell.data?.permanence,
        },
        spellspecial: {
          value: spell.data?.special,
        },
        spelltriggered: {
          value: spell.data?.triggered,
        },
        tagetname: {
          value: target != null ? target.name : '',
        },
        effectdice: {
          value: effectdice,
        },
        defense: {
          value: spell.data?.action?.defense,
        },
        defenseboonsbanes: {
          value: parseInt(spell.data?.action?.defenseboonsbanes),
        },
        challStrength: {
          value: challStrength,
        },
        challAgility: {
          value: challAgility,
        },
        challIntellect: {
          value: challIntellect,
        },
        challWill: {
          value: challWill,
        },
        challPerception: {
          value: challPerception,
        },
        uses: {
          value: usesText,
        },
        isCreature: {
          value: this.data.type == 'creature',
        },
        healing: {
          value: spell.data?.healing?.healactive && spell.data?.healing?.healing ? spell.data?.healing?.healing : false,
        },
        effects: {
          value: buffs.attackeffects,
        },
        afflictionEffects: {
          value: this.buildAfflictionsEffects('SPELL'),
        },
        ifBlindedRoll: ['blindroll'].includes(rollMode),
      },
      diceData,
    };

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: this.id,
        token: this.token,
        alias: this.name,
      },
    };

    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM');
    }
    if (rollMode === 'selfroll') chatData.whisper = [game.user.id];
    if (rollMode === 'blindroll') chatData.blind = true;

    const template = 'systems/demonlord08/templates/chat/spell.html';
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content;
      if (game.dice3d && attackRoll != null && attackAttribute) {
        if (this.data.type === 'creature' && !game.settings.get('demonlord', 'attackShowAttack')) {
          if (attackRoll != null) chatData.sound = CONFIG.sounds.dice;
          ChatMessage.create(chatData);
        } else {
          game.dice3d
            .showForRoll(attackRoll, game.user, true, chatData.whisper, chatData.blind)
            .then((displayed) => ChatMessage.create(chatData));
        }
      } else {
        if (attackRoll != null && attackAttribute) {
          chatData.sound = CONFIG.sounds.dice;
        }
        ChatMessage.create(chatData);
      }
    });
  }

  rollCorruption() {
    ActorRolls.rollCorruption(this);
  }

  showItemInfo(item) {
    const uses = parseInt(item.data?.data?.enchantment?.uses?.value);
    const usesmax = parseInt(item.data?.data?.enchantment?.uses?.max);

    const usesText = game.i18n.localize('DL.SpellCastingsUses') + ': ' + uses + ' / ' + usesmax;

    var templateData = {
      actor: this,
      item: {
        data: item,
        name: item.name,
      },
      data: {
        uses: {
          value: usesText,
        },
        healing: {
          value: item.data?.data?.healingoption,
        },
      },
    };

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: this.id,
        token: this.token,
        alias: this.name,
      },
    };

    const rollMode = game.settings.get('core', 'rollMode');
    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM');
    }

    const template = 'systems/demonlord08/templates/chat/enchantment.html';
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content;
      ChatMessage.create(chatData);
    });
  }

  getTarget() {
    let selectedTarget = null;
    game.user.targets.forEach(async (target) => {
      selectedTarget = target;
    });

    return selectedTarget;
  }

  getTargetNumber(item) {
    let tagetNumber;
    game.user.targets.forEach(async (target) => {
      const targetActor = target.actor;
      if (targetActor) {
        let againstSelectedAttribute = item.data.data?.action?.against?.toLowerCase();

        if (againstSelectedAttribute == undefined) {
          againstSelectedAttribute = item.data.action?.against?.toLowerCase();
        }

        if (againstSelectedAttribute == 'defense') {
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

    game.user.targets.forEach(async (target) => {
      const targetActor = target.actor;
      if (targetActor) {
        const againstSelectedAttribute = talent.data.vs.against.toLowerCase();

        if (againstSelectedAttribute == 'defense') {
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
    characterbuffs.challengestrengthbonus = 0;
    characterbuffs.challengeagilitybonus = 0;
    characterbuffs.challengeintellectbonus = 0;
    characterbuffs.challengewillbonus = 0;
    characterbuffs.challengeperceptionbonus = 0;
    characterbuffs.attackstrengthbonus = 0;
    characterbuffs.attackagilitybonus = 0;
    characterbuffs.attackintellectbonus = 0;
    characterbuffs.attackwillbonus = 0;
    characterbuffs.attackperceptionbonus = 0;

    if (this.data.data.actions.prepare) {
      characterbuffs.challengestrengthbonus++;
      characterbuffs.challengeagilitybonus++;
      characterbuffs.challengeintellectbonus++;
      characterbuffs.challengewillbonus++;
      characterbuffs.challengeperceptionbonus++;
      characterbuffs.attackstrengthbonus++;
      characterbuffs.attackagilitybonus++;
      characterbuffs.attackintellectbonus++;
      characterbuffs.attackwillbonus++;
      characterbuffs.attackperceptionbonus++;
    }

    const talents = this.items.filter((e) => e.type === 'talent');
    for (const talent of talents) {
      if (talent.data.data.addtonextroll) {
        // console.log(talent.name)
        if (talent.data.data.action?.boonsbanesactive) {
          characterbuffs.attackbonus =
            parseInt(characterbuffs.attackbonus) + parseInt(talent.data.data.action?.boonsbanes);

          if (talent.data.data.action.strengthboonsbanesselect) {
            characterbuffs.attackstrengthbonus += parseInt(talent.data.data.action?.boonsbanes);
          }
          if (talent.data.data.action.agilityboonsbanesselect) {
            characterbuffs.attackagilitybonus += parseInt(talent.data.data.action?.boonsbanes);
          }
          if (talent.data.data.action.intellectboonsbanesselect) {
            characterbuffs.attackintellectbonus += parseInt(talent.data.data.action?.boonsbanes);
          }
          if (talent.data.data.action.willboonsbanesselect) {
            characterbuffs.attackwillbonus += parseInt(talent.data.data.action?.boonsbanes);
          }
          if (talent.data.data.action.perceptionboonsbanesselect) {
            characterbuffs.attackperceptionbonus += parseInt(talent.data.data.action?.boonsbanes);
          }
        }
        if (talent.data.action?.damageactive && talent.data.action?.damage != '') {
          characterbuffs.attackdamagebonus += '+' + talent.data.action?.damage;
        }
        if (talent.data.action?.plus20active && talent.data.action?.plus20 != '') {
          characterbuffs.attack20plusdamagebonus += '+' + talent.data.action?.plus20;
        }

        if (type === 'ATTACK') {
          characterbuffs.attackeffects += this.buildTalentEffects(talent, true, type);
        } else if (type === 'SPELL') {
          characterbuffs.attackeffects += this.buildTalentEffects(talent, true, type);
        }

        if (talent.data.data?.challenge?.boonsbanesactive) {
          characterbuffs.challengebonus =
            parseInt(characterbuffs.challengebonus) + parseInt(talent.data.data.challenge?.boonsbanes);

          if (talent.data.data.challenge?.strengthboonsbanesselect) {
            characterbuffs.challengestrengthbonus += parseInt(talent.data.data.challenge?.boonsbanes);
            characterbuffs.challengeeffects += this.buildTalentEffects(talent, true, type);
          }
          if (talent.data.data.challenge?.agilityboonsbanesselect) {
            characterbuffs.challengeagilitybonus += parseInt(talent.data.data.challenge?.boonsbanes);
            characterbuffs.challengeeffects += this.buildTalentEffects(talent, true, type);
          }
          if (talent.data.data.challenge?.intellectboonsbanesselect) {
            characterbuffs.challengeintellectbonus += parseInt(talent.data.data.challenge?.boonsbanes);
            characterbuffs.challengeeffects += this.buildTalentEffects(talent, true, type);
          }
          if (talent.data.data.challenge?.willboonsbanesselect) {
            characterbuffs.challengewillbonus += parseInt(talent.data.data.challenge?.boonsbanes);
            characterbuffs.challengeeffects += this.buildTalentEffects(talent, true, type);
          }
          if (talent.data.data.challenge?.perceptionboonsbanesselect) {
            characterbuffs.challengeperceptionbonus += parseInt(talent.data.data.challenge?.boonsbanes);
            characterbuffs.challengeeffects += this.buildTalentEffects(talent, true, type);
          }
        }
        if (talent.data.data.bonuses?.defenseactive && talent.data.data.bonuses?.defense > 0) {
          characterbuffs.defensebonus += parseInt(talent.data.data.bonuses.defense);
        }
        if (talent.data.data.bonuses?.healthactive && talent.data.data.bonuses?.health > 0) {
          characterbuffs.healthbonus += parseInt(talent.data.data.bonuses.health);
        }
        if (talent.data.data.bonuses?.speedactive && talent.data.data.bonuses?.speed > 0) {
          characterbuffs.speedbonus += parseInt(talent.data.data.bonuses.speed);
        }
        if (talent.data.data.bonuses?.poweractive && talent.data.data.bonuses?.power > 0) {
          characterbuffs.powerbonus += parseInt(talent.data.data.bonuses.power);
        }
        if (talent.data.data.healing?.healactive && talent.data.data.healing?.rate > 0) {
          characterbuffs.healing += parseInt(talent.data.data.healing.rate);
        }
      }
    }

    const items = this.items.filter((e) => e.type === 'item');
    let itemAttackbonus = 0;
    let itemChallengebonus = 0;
    let itemDamageBonus = '';
    let itemDefenseBonus = 0;
    let itemSpeedBonus = 0;
    let itemPerceptionBonus = 0;

    for (const item of items) {
      if (item.data.data.wear) {
        if (item.data.data.enchantment?.attackbonus != null) {
          itemAttackbonus += parseInt(item.data.data.enchantment?.attackbonus);
        }
        if (item.data.data.enchantment?.challengebonus != null) {
          itemChallengebonus += parseInt(item.data.data.enchantment?.challengebonus);
        }
        if (item.data.data.enchantment?.damage != '') {
          itemDamageBonus += '+' + item.data.data.enchantment?.damage;
        }
        if (item.data.data.enchantment?.defense != null) {
          itemDefenseBonus += parseInt(item.data.data.enchantment?.defense);
        }
        if (item.data.data.enchantment?.speed != null) {
          itemSpeedBonus += parseInt(item.data.data.enchantment?.speed);
        }
        if (item.data.data.enchantment?.perception != null) {
          itemPerceptionBonus += parseInt(item.data.data.enchantment?.perception);
        }
      }
    }
    characterbuffs.attackbonus += itemAttackbonus;
    characterbuffs.challengebonus += itemChallengebonus;
    characterbuffs.attackdamagebonus += itemDamageBonus;
    characterbuffs.defensebonus += itemDefenseBonus;
    characterbuffs.speedbonus += itemSpeedBonus;
    characterbuffs.perception += itemPerceptionBonus;

    // If you wear armor and do not meet or exceed its requirements: -1 Bane
    const armors = this.items.filter((e) => e.type === 'armor');
    let armorAttackbonus = 0;
    for (const armor of armors) {
      if (armor.data.data?.wear && !armor.data.data?.isShield) {
        if (
          armor.data.data?.strengthmin != '' &&
          parseInt(armor.data.data.strengthmin) > parseInt(this.data.data?.attributes?.strength?.value)
        ) {
          armorAttackbonus = -1;
          characterbuffs.armorRequirementMeet = false;
        }
      }
    }
    characterbuffs.attackbonus += armorAttackbonus;

    const mods = this.items.filter((e) => e.type === 'mod');
    let modAttackbonus = 0;
    let modChallengebonus = 0;
    let modDamageBonus = '';
    let modDefenseBonus = 0;
    let modHealingBonus = 0;
    let modSpeedBonus = 0;
    for (const mod of mods) {
      if (mod.data.data.active) {
        if (mod.data.data.modtype == game.i18n.localize('DL.TalentAttackBoonsBanes')) {
          modAttackbonus += parseInt(mod.data.data.modifier);
        }
        if (mod.data.data.modtype == game.i18n.localize('DL.TalentChallengeBoonsBanes')) {
          modChallengebonus += parseInt(mod.data.data.modifier);
        }
        if (mod.data.data.modtype == game.i18n.localize('DL.ModsListDamage')) {
          modDamageBonus += '+' + mod.data.data.modifier;
        }
        if (mod.data.data.modtype == game.i18n.localize('DL.ItemDefenseModifier')) {
          modDefenseBonus += parseInt(mod.data.data.modifier);
        }
        if (mod.data.data.modtype == game.i18n.localize('DL.ModsListHealth')) {
          modHealingBonus += parseInt(mod.data.data.modifier);
        }
        if (mod.data.data.modtype == game.i18n.localize('DL.ModsListSpeed')) {
          modSpeedBonus += parseInt(mod.data.data.modifier);
        }
      }
    }
    characterbuffs.attackbonus += modAttackbonus;
    characterbuffs.challengebonus += modChallengebonus;
    characterbuffs.attackdamagebonus += modDamageBonus;
    characterbuffs.defensebonus += modDefenseBonus;
    characterbuffs.healthbonus += modHealingBonus;
    characterbuffs.speedbonus += modSpeedBonus;

    // Afflictions
    if (this.data.data.afflictions?.diseased) {
      characterbuffs.attackbonus += -1;
      characterbuffs.attackstrengthbonus += -1;
      characterbuffs.attackagilitybonus += -1;
      characterbuffs.attackintellectbonus += -1;
      characterbuffs.attackwillbonus += -1;
      characterbuffs.attackperceptionbonus += -1;

      characterbuffs.challengebonus += -1;
      characterbuffs.challengestrengthbonus += -1;
      characterbuffs.challengeagilitybonus += -1;
      characterbuffs.challengeintellectbonus += -1;
      characterbuffs.challengewillbonus += -1;
      characterbuffs.challengeperceptionbonus += -1;
    }
    if (this.data.data.afflictions?.frightened) {
      characterbuffs.attackbonus += -1;
      characterbuffs.attackstrengthbonus += -1;
      characterbuffs.attackagilitybonus += -1;
      characterbuffs.attackintellectbonus += -1;
      characterbuffs.attackwillbonus += -1;
      characterbuffs.attackperceptionbonus += -1;

      characterbuffs.challengebonus += -1;
      characterbuffs.challengestrengthbonus += -1;
      characterbuffs.challengeagilitybonus += -1;
      characterbuffs.challengeintellectbonus += -1;
      characterbuffs.challengewillbonus += -1;
      characterbuffs.challengeperceptionbonus += -1;
    }
    if (this.data.data.afflictions?.horrified) {
      characterbuffs.attackbonus += -3;
      characterbuffs.attackstrengthbonus += -3;
      characterbuffs.attackagilitybonus += -3;
      characterbuffs.attackintellectbonus += -3;
      characterbuffs.attackwillbonus += -3;
      characterbuffs.attackperceptionbonus += -3;

      characterbuffs.challengebonus += -3;
      characterbuffs.challengestrengthbonus += -3;
      characterbuffs.challengeagilitybonus += -3;
      characterbuffs.challengeintellectbonus += -3;
      characterbuffs.challengewillbonus += -3;
      characterbuffs.challengeperceptionbonus += -3;
    }
    if (this.data.data.afflictions?.fatigued) {
      characterbuffs.attackbonus += -1;
      characterbuffs.attackstrengthbonus += -1;
      characterbuffs.attackagilitybonus += -1;
      characterbuffs.attackintellectbonus += -1;
      characterbuffs.attackwillbonus += -1;
      characterbuffs.attackperceptionbonus += -1;

      characterbuffs.challengebonus += -1;
      characterbuffs.challengestrengthbonus += -1;
      characterbuffs.challengeagilitybonus += -1;
      characterbuffs.challengeintellectbonus += -1;
      characterbuffs.challengewillbonus += -1;
      characterbuffs.challengeperceptionbonus += -1;
    }
    if (this.data.data.afflictions?.impaired) {
      characterbuffs.attackbonus += -1;
      characterbuffs.attackstrengthbonus += -1;
      characterbuffs.attackagilitybonus += -1;
      characterbuffs.attackintellectbonus += -1;
      characterbuffs.attackwillbonus += -1;
      characterbuffs.attackperceptionbonus += -1;

      characterbuffs.challengebonus += -1;
      characterbuffs.challengestrengthbonus += -1;
      characterbuffs.challengeagilitybonus += -1;
      characterbuffs.challengeintellectbonus += -1;
      characterbuffs.challengewillbonus += -1;
      characterbuffs.challengeperceptionbonus += -1;
    }
    if (this.data.data.afflictions?.poisoned) {
      characterbuffs.attackbonus += -1;
      characterbuffs.attackstrengthbonus += -1;
      characterbuffs.attackagilitybonus += -1;
      characterbuffs.attackintellectbonus += -1;
      characterbuffs.attackwillbonus += -1;
      characterbuffs.attackperceptionbonus += -1;

      characterbuffs.challengebonus += -1;
      characterbuffs.challengestrengthbonus += -1;
      characterbuffs.challengeagilitybonus += -1;
      characterbuffs.challengeintellectbonus += -1;
      characterbuffs.challengewillbonus += -1;
      characterbuffs.challengeperceptionbonus += -1;
    }

    /*
    console.log('attackstrengthbonus = ' + characterbuffs.attackstrengthbonus);
    console.log('attackagilitybonus = ' + characterbuffs.attackagilitybonus);
    console.log('attackintellectbonus = ' + characterbuffs.attackintellectbonus);
    console.log('attackwillbonus = ' + characterbuffs.attackwillbonus);
    console.log('attackperceptionbonus = ' + characterbuffs.attackperceptionbonus);
    console.log('challengestrengthbonus = ' + characterbuffs.challengestrengthbonus);
    console.log('challengeagilitybonus = ' + characterbuffs.challengeagilitybonus);
    console.log('challengeintellectbonus = ' + characterbuffs.challengeintellectbonus);
    console.log('challengewillbonus = ' + characterbuffs.challengewillbonus);
    console.log('challengeperceptionbonus = ' + characterbuffs.challengeperceptionbonus);
    */

    return characterbuffs;
  }

  buildTalentEffects(talent, showTalentName, type) {
    return ActorAfflictionsEffects.buildTalentEffects(this, talent, showTalentName, type);
  }

  buildArmorEffects(armorRequirementsNotMeet) {
    return armorRequirementsNotMeet
      ? `&nbsp;&nbsp;&nbsp;• ${game.i18n.localize(DL.TalentAttackBoonsBanes)}: -1 <br>`
      : '';
  }

  buildActionEffects(type) {
    return ActorAfflictionsEffects.buildAfflictionsEffects(this, type, ['prepare'], 1);
  }

  buildAfflictionsEffects(type) {
    return ActorAfflictionsEffects.buildAfflictionsEffects(
      this,
      type,
      ['diseased', 'fatigued', 'impaired', 'poisoned'],
      -1,
    );
  }

  async activateTalent(talent, setActive) {
    const uses = talent.data.uses?.value;
    const usesmax = talent.data.uses?.max;

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

      await Item.updateDocuments([talent], { parent: this });
    }
  }

  async deactivateTalent(talent) {
    const item = this.getEmbeddedDocument('Item', talent.id);
    const that = this;
    await item
      .update({
        'data.addtonextroll': false,
      })
      .then((item) => {
        that.render();
      });
  }

  async addCharacterBonuses(talent) {
    const healthbonus =
      talent.data.bonuses?.defenseactive && talent.data.bonuses?.health > 0 ? parseInt(talent.data.bonuses?.health) : 0;
    const defensebonus =
      talent.data.bonuses?.healthactive && talent.data.bonuses?.defense > 0
        ? parseInt(talent.data.bonuses?.defense)
        : 0;
    const speedbonus =
      talent.data.bonuses?.speedactive && talent.data.bonuses?.speed > 0 ? parseInt(talent.data.bonuses?.speed) : 0;
    const powerbonus =
      talent.data.bonuses?.poweractive && talent.data.bonuses?.power > 0 ? parseInt(talent.data.bonuses?.power) : 0;

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
    const healthbonus =
      talent.data.bonuses?.defenseactive && talent.data.bonuses?.health > 0 ? parseInt(talent.data.bonuses?.health) : 0;
    const defensebonus =
      talent.data.bonuses?.healthactive && talent.data.bonuses?.defense > 0
        ? parseInt(talent.data.bonuses?.defense)
        : 0;
    const speedbonus =
      talent.data.bonuses?.speedactive && talent.data.bonuses?.speed > 0 ? parseInt(talent.data.bonuses?.speed) : 0;
    const powerbonus =
      talent.data.bonuses?.poweractive && talent.data.bonuses?.power > 0 ? parseInt(talent.data.bonuses?.power) : 0;

    await this.update({
      'data.characteristics.health.max': parseInt(this.data.data.characteristics.health.max) - healthbonus,
      'data.characteristics.defense': parseInt(this.data.data.characteristics.defense) - defensebonus,
      'data.characteristics.speed.value': parseInt(this.data.data.characteristics.speed.value) - speedbonus,
      'data.characteristics.power.value': parseInt(this.data.data.characteristics.power.value) - powerbonus,
      'data.activebonuses': false,
    });
  }

  async addDamageToTarget(damage) {
    game.user.targets.forEach(async (target) => {
      const targetActor = target.actor;
      const currentDamage = parseInt(targetActor.data.data.characteristics.health.value);
      if (game.settings.get('demonlord', 'reverseDamage')) {
        if (currentDamage - damage <= 0) {
          await targetActor.update({
            'data.characteristics.health.value': 0,
          });
        } else {
          await targetActor.update({
            'data.characteristics.health.value': currentDamage - damage,
          });
        }
      } else {
        await targetActor.update({
          'data.characteristics.health.value': currentDamage + damage,
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
      await this.updateEmbeddedDocuments('Item', mod.data);
    }
  }

  async restActor(token) {
    // Talents
    const talents = this.getEmbeddedCollection('Item').filter((e) => e.type === 'talent');
    for (const talent of talents) {
      const item = duplicate(this.items.get(talent.id));
      item.data.uses.value = 0;

      await this.updateEmbeddedDocuments('Item', item.data);
    }

    // Spells
    const spells = this.getEmbeddedCollection('Item').filter((e) => e.type === 'spell');

    for (const spell of spells) {
      const item = duplicate(this.items.get(spell.id));

      item.data.castings.value = 0;

      await this.updateEmbeddedDocuments('Item', item.data);
    }

    this.applyHealing(token, true);

    var templateData = {
      actor: this,
    };

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: this.id,
        token: this.token,
        alias: this.name,
      },
    };

    const template = 'systems/demonlord08/templates/chat/rest.html';
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content;
      ChatMessage.create(chatData);
    });
  }

  async applyHealing(token, fullHealingRate) {
    if (token.actor.data.type === 'character') {
      if (token.data.actorData.data?.characteristics != undefined) {
        const tokenData = duplicate(token.data);
        const hp = tokenData.actorData?.data?.characteristics?.health;
        const rate = tokenData.actorData?.data?.characteristics?.health?.healingrate;

        if (game.settings.get('demonlord', 'reverseDamage')) {
          let newdamage = parseInt(hp.value) + (fullHealingRate ? parseInt(rate) : parseInt(rate / 2));
          if (newdamage > hp.max) newdamage = parseInt(hp.max);

          hp.value = newdamage;
        } else {
          let newdamage = parseInt(hp.value) - (fullHealingRate ? parseInt(rate) : parseInt(rate / 2));
          if (newdamage < 0) newdamage = 0;

          hp.value = newdamage;
        }

        await token.update(tokenData);
      } else {
        const actorData = duplicate(token.actor.data);
        const hp = actorData.data.characteristics.health;
        const rate = actorData.data.characteristics.health.healingrate;

        if (game.settings.get('demonlord', 'reverseDamage')) {
          let newdamage = parseInt(hp.value) + (fullHealingRate ? parseInt(rate) : parseInt(rate / 2));
          if (newdamage > hp.max) newdamage = parseInt(hp.max);

          hp.value = newdamage;
        } else {
          let newdamage = parseInt(hp.value) - (fullHealingRate ? parseInt(rate) : parseInt(rate / 2));
          if (newdamage < 0) newdamage = 0;

          hp.value = newdamage;
        }

        await token.actor.update(actorData);
      }
    }
  }

  async setUsesOnSpells(data) {
    const power = data.data.characteristics.power;

    for (let rank = 0; rank <= power; rank++) {
      const spells = this.getEmbeddedCollection('Item').filter(
        (e) => e.type === 'spell' && parseInt(e.data.rank) === rank,
      );
      spells.forEach((spell) => {
        spell = duplicate(spell);
        const rank = spell.data.rank;
        const usesMax = CONFIG.DL.spelluses[power].split(',')[rank];

        if (spell.data.castings.value === '') {
          spell.data.castings.value = '0';
        }
        spell.data.castings.max = usesMax;

        this.updateEmbeddedDocuments('Item', spell.data);
      });
    }
  }
}
