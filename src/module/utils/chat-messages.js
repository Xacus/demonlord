import {FormatDice} from "../dice";

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

function _remapEffects(effects) {
  let m = new Map()
  effects.forEach(effect => effect.data.changes.forEach((change) => {
    const obj = {label: effect.data.label, type: effect.data.flags?.sourceType, value: change.value}
    if (!m.has(change.key))
      m.set(change.key, [obj])
    else
      m.get(change.key).push(obj)
  }))
  return m
}

const toMsg = (label, value) => `&nbsp;&nbsp;&nbsp;&nbsp;• <i>${label}</i> (${value})<br>`

const changeToMsg = (m, key, title) => {
  title = title ? `&nbsp;&nbsp;${game.i18n.localize(title)}<br>` : ''
  if (m.has(key))
    return m.get(key).reduce(
      (acc, change) => acc + toMsg(change.label, change.value),
      title
    )
  return ''
}

function _buildAttackEffectsMessage(attacker, defender, item, attackAttribute, defenseAttribute, action='attack') {
  const attackerEffects = attacker?.getEmbeddedCollection('ActiveEffect').filter(effect => !effect.data.disabled)
  const defenderEffects = defender?.getEmbeddedCollection('ActiveEffect').filter(effect => !effect.data.disabled)
  // TODO: add the "defense banes" from the defended (example: spell resistance)

  let m = _remapEffects(attackerEffects)

  let result = ""
  const effectBoons = changeToMsg(m, `data.bonuses.attack.boons.${attackAttribute}`, '')
  const itemBoons = item?.data.data.action.boonsbanes != 0 ? toMsg(item.name, item?.data.data.action.boonsbanes) : ''
  if (effectBoons.length > 0 || itemBoons.length > 0)
    result += `&nbsp;&nbsp;${game.i18n.localize('DL.TalentAttackBoonsBanes')}<br>` + itemBoons + effectBoons

  result += changeToMsg(m, 'data.bonuses.attack.damage', 'DL.TalentExtraDamage')
  result += changeToMsg(m, 'data.bonuses.attack.plus20Damage', 'DL.TalentExtraDamage20plus')
  //result += changeToMsg(m, 'data.bonuses.attack.extraEffect', 'DL.TalentExtraEffect')
  return result
}

function _buildAttributeEffectsMessage(actor, attribute) {
  const actorEffects = actor?.getEmbeddedCollection('ActiveEffect').filter(effect => !effect.data.disabled)
  let m = _remapEffects(actorEffects)
  let result = ""
  result += changeToMsg(m, `data.bonuses.challenge.boons.${attribute}`, 'DL.TalentChallengeBoonsBanes')
  return result
}

function _buildTalentEffectsMessage(actor, talent) {
  const effects = actor.getEmbeddedCollection('ActiveEffect')
    .filter(effect => effect.data.origin === talent.uuid && !effect.data.disabled)

  let m = _remapEffects(effects)
  const get = (key, strLocalization, prefix = '') => {
    const value = m.get(key)?.[0].value
    if (!value) return ''
    const str = strLocalization ? prefix + game.i18n.localize(strLocalization) : prefix
    if (!str) return `&nbsp;&nbsp;&nbsp;• ${value}<br>`
    return `&nbsp;&nbsp;&nbsp;• ${str} (${value})<br>`
  }

  const attackBoonsPrefix = game.i18n.localize('DL.TalentAttackBoonsBanes') + " "
  const challengeBoonsPrefix = game.i18n.localize('DL.TalentChallengeBoonsBanes') + " "
  let result
    = get(`data.bonuses.attack.boons.strength`, 'DL.AttributeStrength', attackBoonsPrefix)
    + get(`data.bonuses.attack.boons.agility`, 'DL.AttributeAgility', attackBoonsPrefix)
    + get(`data.bonuses.attack.boons.intellect`, 'DL.AttributeIntellect', attackBoonsPrefix)
    + get(`data.bonuses.attack.boons.will`, 'DL.AttributeWill', attackBoonsPrefix)
    + get(`data.bonuses.attack.boons.perception`, 'DL.CharPerception', attackBoonsPrefix)
    + get(`data.bonuses.challenge.boons.strength`, 'DL.AttributeStrength', challengeBoonsPrefix)
    + get(`data.bonuses.challenge.boons.agility`, 'DL.AttributeAgility', challengeBoonsPrefix)
    + get(`data.bonuses.challenge.boons.intellect`, 'DL.AttributeIntellect', challengeBoonsPrefix)
    + get(`data.bonuses.challenge.boons.will`, 'DL.AttributeWill', challengeBoonsPrefix)
    + get(`data.bonuses.challenge.boons.perception`, 'DL.CharPerception', challengeBoonsPrefix)
    + get(`data.bonuses.attack.damage`, 'DL.TalentExtraDamage')
    + get(`data.bonuses.attack.plus20Damage`, 'DL.TalentExtraDamage20plus')
    + get('data.bonuses.attack.extraEffect', 'DL.TalentExtraEffect')
    + get('data.characteristics.defense', 'DL.TalentBonusesDefense')
    + get('data.characteristics.health.max', 'DL.TalentBonusesHealth')
    + get('data.characteristics.speed', 'DL.TalentBonusesSpeed')
    + get('data.characteristics.power', 'DL.TalentBonusesPower')

  return result
}

/* -------------------------------------------- */

/* -------------------------------------------- */

export function postAttackToChat(attacker, defender, item, attackRoll, attackAttribute, defenseAttribute) {
  const rollMode = game.settings.get('core', 'rollMode')

  const targetNumber = defenseAttribute === 'defense'
    ? defender?.data.data.characteristics.defense
    : defender?.data.data.attributes[defenseAttribute]

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
  const againstNumber = (defender?.actor.data.type == 'character' || defenseShow) && targetNumber
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
  data['attackEffects'] = _buildAttackEffectsMessage(attacker, defender, item, attackAttribute, defenseAttribute)
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
  const effects = _buildAttributeEffectsMessage(actor, attribute)
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
  data['damageFormular'] = talentData?.vs?.damage || ''
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
  data['attackEffects'] = _buildAttackEffectsMessage(actor, target, talent, attackAttribute, defenseAttribute)
  data['talentEffects'] = _buildTalentEffectsMessage(actor, talent)
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
