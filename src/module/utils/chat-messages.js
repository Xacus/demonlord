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

export function postAttackToChat(attacker, defender, item, attackRoll, attackAttribute, defenseAttribute) {
  const rollMode = game.settings.get('core', 'rollMode')

  const targetNumber = defenseAttribute === 'defense' ?
    defender?.data.data.characteristics.defense : defender?.data.data.attributes[defenseAttribute]

  const plus20 = attackRoll?.total >= 20 && attackRoll?.total > targetNumber + 5

  const didHit = attackRoll?.total >= targetNumber

  let resultText = didHit
    ? game.i18n.localize('DL.DiceResultSuccess')
    : game.i18n.localize('DL.DiceResultFailure')

  let diceTotal = attackRoll != null ? attackRoll.total : ''

  if (
    attacker.data.type === 'creature' &&
    !game.settings.get('demonlord08', 'attackShowAttack')
  ) {
    diceTotal = '?'
    resultText = ''
  }
  if (['blindroll'].includes(rollMode)) {
    diceTotal = '?'
    resultText = ''
  }

  const againstNumber =
    (defender != null && defender.actor.data.type == 'character') ||
    (game.settings.get('demonlord08', 'attackShowDefense') &&
      targetNumber != undefined)
      ? targetNumber
      : '?'



  const templateData = {
    actor: attacker,
    item: {_id: item.id, data: item, name: item.name},
    diceData: FormatDice(attackRoll),
    data: {}
  }

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
  data['armorEffects'] = '' // TODO
  data['afflictionEffects'] = '' //TODO
  data['isCreature'] = attacker.data.type === 'creature'
  data['isPlus20Roll'] = plus20
  data['hasTarget'] = targetNumber !== undefined
  data['actionEffects'] = '' // TODO
  data['ifBlindedRoll'] = rollMode === 'blindroll'


  const chatData = _getChatBaseData(attacker, rollMode)
  console.log(templateData)
  const template = 'systems/demonlord08/templates/chat/combat.html'
  renderTemplate(template, templateData).then((content) => {
    chatData.content = content

    if (game.dice3d && attackRoll != null) {
      if (
        attacker.data.type === 'creature' &&
        !game.settings.get('demonlord08', 'attackShowAttack')
      ) {
        if (attackRoll != null) chatData.sound = CONFIG.sounds.dice
        ChatMessage.create(chatData)
      } else {
        game.dice3d
          .showForRoll(
            attackRoll,
            game.user,
            true,
            chatData.whisper,
            chatData.blind
          )
          .then((displayed) => ChatMessage.create(chatData))
      }
    } else {
      if (attackRoll != null) chatData.sound = CONFIG.sounds.dice
      ChatMessage.create(chatData)
    }
  })
}
