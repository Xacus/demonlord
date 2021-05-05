import {FormatDice} from "../dice";
import {buildAttackEffectsMessage, buildAttributeEffectsMessage, buildTalentEffectsMessage} from "./effect-messages";

/**
 * Builds the base chat data based on settings, actor and user
 * @param actor
 * @param rollMode
 * @returns ChatData
 * @private
 */
function _getChatBaseData(actor, rollMode) {
  return {
    user: game.user.id,
    speaker: {
      actor: actor.id,
      token: actor.token,
      alias: actor.name
    },
    blind: rollMode === 'blindroll',
    whisper:
      rollMode === 'selfroll'
        ? [game.user.id]
        : rollMode === 'gmroll' || rollMode === 'blindroll'
        ? Chatmessage.getWhisperRecipients('GM')
        : []
  }
}

/**
 * Generates and sends the chat message for an ATTACK
 * @param attacker              DemonlordActor
 * @param defender              DemonlordActor
 * @param item                  DemonlordItem
 * @param attackRoll            Roll
 * @param attackAttribute       string (lowercase)
 * @param defenseAttribute      stromg (lowercase)
 */
export function postAttackToChat(attacker, defender, item, attackRoll, attackAttribute, defenseAttribute) {
  const rollMode = game.settings.get('core', 'rollMode')

  const targetNumber = defenseAttribute === 'defense'
    ? defender?.data.data.characteristics.defense
    : (defender?.data.data.attributes[defenseAttribute]?.value || '' )

  const plus20 = attackRoll?.total >= 20 && attackRoll?.total > targetNumber + 5
  const didHit = attackRoll?.total >= targetNumber

  let diceTotal = attackRoll != null ? attackRoll.total : ''
  let resultText = didHit
    ? game.i18n.localize('DL.DiceResultSuccess')
    : game.i18n.localize('DL.DiceResultFailure')

  const attackShow = game.settings.get('demonlord08', 'attackShowAttack')
  if (attacker.data.type === 'creature' && !attackShow || rollMode === 'blindroll') {
    diceTotal = '?'
    resultText = ''
  }

  const defenseShow = game.settings.get('demonlord08', 'attackShowDefense')
  const againstNumber = (defender?.data.type == 'character' || defenseShow) && targetNumber
    ? targetNumber : '?'


  const templateData = {
    actor: attacker,
    item: {_id: item.id, data: item, name: item.name},
    diceData: FormatDice(attackRoll),
    data: {}
  }

  const data = templateData.data
  data['diceTotal'] = diceTotal
  data['diceTotalGM'] = attackRoll?.total ?? ''
  data['resultText'] = resultText
  data['didHit'] = didHit
  data['attack'] = attackAttribute ? game.i18n.localize(CONFIG.DL.attributes[attackAttribute].toUpperCase()) : ''
  data['against'] = defenseAttribute ? game.i18n.localize(CONFIG.DL.attributes[defenseAttribute].toUpperCase()) : ''
  data['againstNumber'] = againstNumber
  data['againstNumberGM'] = againstNumber === '?' ? targetNumber : againstNumber
  data['damageFormular'] = item.data.data.action.damage + attacker.data.data.bonuses.attack.damage
  data['damageType'] = item.data.data.action.damagetype
  data['damageTypes'] = item.data.data.action.damagetypes
  data['damageExtra20plusFormular'] = attacker.data.data.bonuses.attack.plus20Damage
  data['description'] = item.data.data.description
  data['targetname'] = defender?.name || ''
  data['effects'] = attacker.data.data.bonuses.attack.extraEffect
  data['isCreature'] = attacker.data.type === 'creature'
  data['isPlus20Roll'] = plus20
  data['hasTarget'] = targetNumber !== undefined
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['attackEffects'] = buildAttackEffectsMessage(attacker, defender, item, attackAttribute, defenseAttribute)
  data['armorEffects'] = '' // TODO
  data['afflictionEffects'] = '' //TODO


  const chatData = _getChatBaseData(attacker, rollMode)
  const template = 'systems/demonlord08/templates/chat/combat.html'

  renderTemplate(template, templateData).then((content) => {
    chatData.content = content
    chatData.sound = attackRoll ? CONFIG.sounds.dice : ''
    if (game.dice3d && attackRoll && !(attacker.data.type === 'creature' && !attackShow))
      game.dice3d.showForRoll(attackRoll, game.user, true, chatData.whisper, chatData.blind)
        .then(() => ChatMessage.create(chatData))
    else ChatMessage.create(chatData)
  })
}

/* -------------------------------------------- */

/**
 * Generates and sends the chat message for an ATTRIBUTE (roll)
 * @param actor             DemonlordActor
 * @param attribute         string (lowercase)
 * @param challengeRoll     Roll
 */
export function postAttributeToChat(actor, attribute, challengeRoll) {
  const rollMode = game.settings.get('core', 'rollMode')

  let diceTotal = challengeRoll?.total ?? ''
  let resultTextGM = challengeRoll.total > 10
    ? game.i18n.localize('DL.DiceResultSuccess')
    : game.i18n.localize('DL.DiceResultFailure')

  let resultText = resultTextGM
  if (rollMode === 'blindroll') {
    diceTotal = '?'
    resultText = ''
  }

  const templateData = {
    actor: actor,
    item: {name: attribute.toUpperCase()},
    diceData: FormatDice(challengeRoll),
    data: {}
  }
  const effects = buildAttributeEffectsMessage(actor, attribute)
  const data = templateData.data
  data['diceTotal'] = diceTotal
  data['diceTotalGM'] = challengeRoll.total
  data['resultText'] = resultText
  data['resultTextGM'] = resultTextGM
  data['isCreature'] = actor.data.type === 'creature'
  data['afflictionEffects'] = '' // TODO
  data['actionEffects'] = effects
  data['ifBlindedRoll'] = rollMode === 'blindroll'

  const chatData = _getChatBaseData(actor, rollMode)
  const template = 'systems/demonlord08/templates/chat/challenge.html'
  renderTemplate(template, templateData).then((content) => {
    chatData.content = content
    if (game.dice3d) {
      game.dice3d.showForRoll(challengeRoll, game.user, true, chatData.whisper, chatData.blind)
        .then((displayed) => ChatMessage.create(chatData))
    } else {
      chatData.sound = CONFIG.sounds.dice
      ChatMessage.create(chatData)
    }
  })
}

/* -------------------------------------------- */

/**
 * Generates and sends the chat message for a TALENT
 * @param actor         DemonlordActor
 * @param talent        DemonlordItem
 * @param attackRoll    Roll
 * @param target        DemonlordActor
 */
export function postTalentToChat(actor, talent, attackRoll, target) {
  const talentData = talent.data.data
  const rollMode = game.settings.get('core', 'rollMode')

  let usesText = ''
  if (parseInt(talentData?.uses?.value) >= 0 && parseInt(talentData?.uses?.max) > 0) {
    const uses = parseInt(talentData.uses?.value);
    const usesmax = parseInt(talentData.uses?.max);
    usesText = game.i18n.localize('DL.TalentUses') + ': ' + uses + ' / ' + usesmax;
  }

  const targetNumber = talentData?.vs?.attribute ? actor.getVSTargetNumber(talent) : ''
  let resultText =
    attackRoll != null && targetNumber != undefined && attackRoll.total >= parseInt(targetNumber)
      ? game.i18n.localize('DL.DiceResultSuccess')
      : game.i18n.localize('DL.DiceResultFailure');

  let diceTotalGM = attackRoll?.total ?? '';
  let diceTotal = diceTotalGM
  if (actor.data.type === 'creature' && !game.settings.get('demonlord08', 'attackShowAttack') || rollMode === 'blindroll') {
    diceTotal = '?'
    resultText = ''
  }

  const againstNumber =
    (target?.actor?.data.type === 'character') ||
    (game.settings.get('demonlord08', 'attackShowDefense') && targetNumber)
      ? targetNumber
      : '?';

  const attackAttribute = talentData.vs?.attribute?.toLowerCase() || ''
  const defenseAttribute = talentData.vs?.against?.toLowerCase() || ''
  //
  const templateData = {
    actor: actor,
    item: talent,
    data: {},
    diceData: FormatDice(attackRoll || null)
  }
  const data = templateData.data
  data['id'] = talent.id
  data['roll'] = Boolean(attackRoll)
  data['diceTotal'] = diceTotal
  data['diceTotalGM'] = diceTotalGM
  data['resultText'] = resultText
  data['didHit'] = attackRoll?.total >= targetNumber
  data['attack'] = attackAttribute
    ? game.i18n.localize(CONFIG.DL.attributes[attackAttribute].toUpperCase())
    : ''
  data['against'] = defenseAttribute
    ? game.i18n.localize(CONFIG.DL.attributes[defenseAttribute]?.toUpperCase()) || ''
    : ''
  data['againstNumber'] = againstNumber
  data['againstNumberGM'] = againstNumber === '?' ? targetNumber : againstNumber
  data['damageFormular'] = (talentData?.vs?.damage || '')
    + (actor.data.data.bonuses.attack.damage || '')
  data['damageType'] = talentData?.vs?.damageactive && talentData?.vs?.damage
    ? talentData?.vs?.damagetype
    : talentData?.action?.damagetype
  data['damageTypes'] = talentData?.vs?.damagetypes
  data['damageExtra20plusFormular'] = talentData?.action?.plus20
  data['description'] = talentData?.description
  data['uses'] = usesText
  data['healing'] = talentData?.healing?.healactive && talentData?.healing?.healing
    ? talentData?.healing?.healing : false
  data['targetname'] = target?.name || ''
  data['isCreature'] = actor.data.type === 'creature'
  data['pureDamage'] = talentData?.damage
  data['pureDamageType'] = talentData?.damagetype
  data['attackEffects'] = buildAttackEffectsMessage(actor, target, talent, attackAttribute, defenseAttribute)
  data['talentEffects'] = buildTalentEffectsMessage(actor, talent)
  data['ifBlindedRoll'] = rollMode === 'blindroll'

  const chatData = _getChatBaseData(actor, rollMode)
  if (talentData?.damage || talentData?.vs?.attribute || (!talentData?.vs?.attribute && !talentData?.damage)) {
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
