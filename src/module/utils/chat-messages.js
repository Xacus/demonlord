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

const toMsg = (m, key, title) => {
  if (m.has(key))
    return  m.get(key).reduce(
      (acc, change) => acc + `&nbsp;&nbsp;&nbsp;• ${change.label} (${change.value})<br>`,
      `<b>${game.i18n.localize(title)}</b><br>`
    )
  return ''
}

function _buildAttackEffectsMessage(attacker, defender, item, attackAttribute, defenseAttribute, action) {
  const attackerEffects = attacker?.getEmbeddedCollection('ActiveEffect').filter(effect => !effect.data.disabled)
  const defenderEffects = defender?.getEmbeddedCollection('ActiveEffect').filter(effect => !effect.data.disabled)
  // TODO: add the "defense banes" from the defended (example: spell resistance)

  let m = _remapEffects(attackerEffects)
  let result = ""
  result += toMsg(m,`data.bonuses.attack.boons.${attackAttribute}`, 'DL.TalentAttackBoonsBanes')
  result += toMsg(m,'data.bonuses.attack.damage', 'DL.TalentExtraDamage')
  result += toMsg(m,'data.bonuses.attack.plus20Damage', 'DL.TalentExtraDamage20plus')
  return result
}

function _buildAttributeEffectsMessage(actor, attribute) {
  const actorEffects = actor?.getEmbeddedCollection('ActiveEffect').filter(effect => !effect.data.disabled)
  let m = _remapEffects(actorEffects)
  let result = ""
  result += toMsg(m, `data.bonuses.challenge.boons.${attribute}`, 'DL.TalentChallengeBoonsBanes')
  console.log(result)
  return result
}

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

  const actionEffects = _buildAttackEffectsMessage(attacker, defender, item, attackAttribute, defenseAttribute, 'action')
  const data = templateData.data
  data['diceTotal'] = diceTotal
  data['diceTotalGM'] = attackRoll?.total || ''
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
  data['actionEffects'] = actionEffects
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

export function postAttributeToChat (actor, attribute, challengeRoll) {
  const rollMode = game.settings.get('core', 'rollMode')

  let diceTotal = challengeRoll?.total || ''
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
    data : {}
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
