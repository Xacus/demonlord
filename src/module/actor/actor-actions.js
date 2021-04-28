import {FormatDice} from "../dice";

export default class ActorActions {

  static useTalent (actor, talent, boonsbanes, modifier) {
    const rollMode = game.settings.get('core', 'rollMode');
    const target = actor.getTarget();
    let diceformular = '1d20';
    let roll = false;
    let attackRoll = null;
    let attackAttribute = '';
    let targetNumber = 0;
    let usesText = '';
    let damageformular = '';
    let diceData = '';

    // Generate Character Buffs
    const buffs = actor.generateCharacterBuffs('TALENT');

    if (talent.data?.vs?.attribute) {
      targetNumber = actor.getVSTargetNumber(talent);

      // if (targetNumber != undefined) {
      if (talent.data.vs?.damageactive) {
        actor.activateTalent(talent, true);
      } else {
        actor.activateTalent(talent, false);
      }

      attackAttribute = talent.data.vs.attribute;
      const attribute = actor.data.data.attributes[attackAttribute.toLowerCase()];

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
        targetNumber = actor.getVSTargetNumber(talent);
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
      actor.activateTalent(talent, true);
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
    if (actor.data.type === 'creature' && !game.settings.get('demonlord08', 'attackShowAttack')) {
      diceTotal = '?';
      resultText = '';
    }
    if (['blindroll'].includes(rollMode)) {
      diceTotal = '?';
      resultText = '';
    }

    const againstNumber =
      (target != null && target.actor?.data.type == 'character') ||
      (game.settings.get('demonlord08', 'attackShowDefense') && targetNumber != undefined)
        ? targetNumber
        : '?';

    var templateData = {
      actor: actor,
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
          value: actor.buildTalentEffects(talent, false, 'TALENT'),
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
          value: actor.data.type == 'creature',
        },
        pureDamage: {
          value: talent.data?.damage,
        },
        pureDamageType: {
          value: talent.data?.damagetype,
        },
        afflictionEffects: {
          value: actor.buildAfflictionsEffects('SPELL'),
        },
        ifBlindedRoll: ['blindroll'].includes(rollMode),
      },
      diceData,
    };

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: actor.id,
        token: actor.token,
        alias: actor.name,
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
          if (actor.data.type === 'creature' && !game.settings.get('demonlord08', 'attackShowAttack')) {
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


  static useSpell(actor, spell, boonsbanes, buffs, modifier) {
    const rollMode = game.settings.get('core', 'rollMode');
    const target = actor.getTarget();
    let diceformular = '1d20';
    let usesText = '';

    // Add Attribute modifer to roll
    const attackAttribute = spell.data?.action?.attack;
    const attribute = actor.data.data.attributes[attackAttribute.toLowerCase()];

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
    const targetNumber = actor.getTargetNumber(spell);

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
      Item.updateDocuments([spell], { parent: actor });

      usesText = game.i18n.localize('DL.SpellCastingsUses') + ': ' + uses + ' / ' + usesmax;
    }

    let resultText =
      attackRoll != null && targetNumber != undefined && attackRoll.total >= parseInt(targetNumber)
        ? game.i18n.localize('DL.DiceResultSuccess')
        : game.i18n.localize('DL.DiceResultFailure');
    let diceTotal = attackRoll != null ? attackRoll.total : '';
    if (actor.data.type === 'creature' && !game.settings.get('demonlord08', 'attackShowAttack')) {
      diceTotal = '?';
      resultText = '';
    }
    if (['blindroll'].includes(rollMode)) {
      diceTotal = '?';
      resultText = '';
    }

    const againstNumber =
      (target != null && target.actor?.data.type == 'character') ||
      (game.settings.get('demonlord08', 'attackShowDefense') && targetNumber != undefined)
        ? targetNumber
        : '?';

    var templateData = {
      actor: actor,
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
          value: actor.data.type == 'creature',
        },
        healing: {
          value: spell.data?.healing?.healactive && spell.data?.healing?.healing ? spell.data?.healing?.healing : false,
        },
        effects: {
          value: buffs.attackeffects,
        },
        afflictionEffects: {
          value: actor.buildAfflictionsEffects('SPELL'),
        },
        ifBlindedRoll: ['blindroll'].includes(rollMode),
      },
      diceData,
    };

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: actor.id,
        token: actor.token,
        alias: actor.name,
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
        if (actor.data.type === 'creature' && !game.settings.get('demonlord08', 'attackShowAttack')) {
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
}
