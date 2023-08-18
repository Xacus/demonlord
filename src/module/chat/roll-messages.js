import {buildAttackEffectsMessage, buildAttributeEffectsMessage, buildTalentEffectsMessage} from './effect-messages'
import {buildActorInfo, formatDice, getChatBaseData} from './base-messages'

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

  const attackAttributeImmune = attacker?.getAttribute(attackAttribute)?.immune
  const defenseAttributeImmune = defender?.getAttribute(defenseAttribute)?.immune
  const voidRoll = attackAttributeImmune || defenseAttributeImmune

  const targetNumber =
    defenseAttribute === 'defense'
      ? defender?.system.characteristics.defense
      : defender?.getAttribute(defenseAttribute)?.value || ''

  const plus20 = attackRoll?.total >= 20 && attackRoll?.total > targetNumber + 5
  const didHit = voidRoll ? false : attackRoll?.total >= targetNumber

  let diceTotal = attackRoll != null ? attackRoll.total : ''
  let resultText = didHit ? game.i18n.localize('DL.DiceResultSuccess') : game.i18n.localize('DL.DiceResultFailure')

  const attackShow = game.settings.get('demonlord', 'attackShowAttack')
  if (((attacker.type === 'creature' || attacker.type === 'vehicle') && !attackShow) || rollMode === 'blindroll') {
    diceTotal = '?'
    resultText = ''
  }
  const resultBoxClass = voidRoll ? 'FAILURE' : (resultText === '' ? '' : didHit ? 'SUCCESS' : 'FAILURE')
  const defenseShow = game.settings.get('demonlord', 'attackShowDefense')
  const againstNumber = (defender?.type == 'character' || defenseShow) && targetNumber ? targetNumber : '?'

  const templateData = {
    actor: attacker,
    item: {id: item.id, data: item, name: item.name},
    diceData: formatDice(attackRoll),
    data: {},
  }

  const data = templateData.data
  data['diceTotal'] = attackAttributeImmune ? '-' : diceTotal
  data['diceTotalGM'] = attackAttributeImmune ? '-' : attackRoll?.total ?? ''
  data['resultText'] = resultText
  data['didHit'] = didHit
  data['resultBoxClass'] = resultBoxClass
  data['attack'] = attackAttribute ? game.i18n.localize(CONFIG.DL.attributes[attackAttribute]?.toUpperCase()) : 'FLAT'
  data['against'] = defenseAttribute ? game.i18n.localize(CONFIG.DL.attributes[defenseAttribute]?.toUpperCase()) : ''
  data['againstNumber'] = defenseAttributeImmune ? '-' : againstNumber
  data['againstNumberGM'] = defenseAttributeImmune ? '-' : (againstNumber === '?' ? targetNumber : againstNumber)
  data['damageFormular'] = item.system.action.damage + attacker.system.bonuses.attack.damage
  data['damageType'] = item.system.action.damagetype
  data['damageTypes'] = item.system.action.damagetypes
  data['damageExtra20plusFormular'] = item.system.action.plus20damage ? item.system.action.plus20damage : attacker.system.bonuses.attack.plus20Damage
  data['description'] = item.system.description
  data['targetname'] = defender?.name || ''
  data['effects'] = attacker.system.bonuses.attack.extraEffect
  data['isCreature'] = attacker.type === 'creature' || attacker.type === 'vehicle'
  data['isPlus20Roll'] = plus20
  data['hasTarget'] = targetNumber !== undefined
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['attackEffects'] = buildAttackEffectsMessage(attacker, defender, item, attackAttribute, defenseAttribute)
  data['armorEffects'] = '' // TODO
  data['afflictionEffects'] = '' //TODO
  data['itemEffects'] = item.effects
  data['actorInfo'] = buildActorInfo(attacker)

  const chatData = getChatBaseData(attacker, rollMode)
  if (attackRoll) {
    chatData.rolls = [attackRoll]
    chatData.type = CONST.CHAT_MESSAGE_TYPES.ROLL
  }
  const template = 'systems/demonlord/templates/chat/combat.hbs'

  renderTemplate(template, templateData).then(content => {
    chatData.content = content
    chatData.sound = CONFIG.sounds.dice
    ChatMessage.create(chatData)
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

  const voidRoll = actor.getAttribute(attribute)?.immune

  let diceTotal = challengeRoll?.total ?? ''
  let resultTextGM =
    challengeRoll.total >= 10 && !voidRoll ? game.i18n.localize('DL.DiceResultSuccess') : game.i18n.localize('DL.DiceResultFailure')

  let resultText = resultTextGM
  if (rollMode === 'blindroll') {
    diceTotal = '?'
    resultText = ''
  }
  const resultBoxClass = voidRoll ? 'FAILURE' : (resultText === '' ? '' : challengeRoll.total >= 10 ? 'SUCCESS' : 'FAILURE')
  const templateData = {
    actor: actor,
    item: {name: attribute?.toUpperCase()},
    diceData: formatDice(challengeRoll),
    data: {},
  }
  const effects = buildAttributeEffectsMessage(actor, attribute)

  const data = templateData.data
  data['diceTotal'] = voidRoll ? '-' : diceTotal
  data['diceTotalGM'] = voidRoll ? '-' : challengeRoll.total
  data['resultText'] = resultText
  data['resultTextGM'] = resultTextGM
  data['resultBoxClass'] = resultBoxClass
  data['isCreature'] = actor.type === 'creature'
  data['actionEffects'] = effects
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['actorInfo'] = buildActorInfo(actor)

  const chatData = getChatBaseData(actor, rollMode)
  if (challengeRoll) {
    chatData.rolls = [challengeRoll]
    chatData.type = CONST.CHAT_MESSAGE_TYPES.ROLL
  }
  const template = 'systems/demonlord/templates/chat/challenge.hbs'
  renderTemplate(template, templateData).then(content => {
    chatData.content = content
    chatData.sound = CONFIG.sounds.dice
    ChatMessage.create(chatData)
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
  const talentData = talent.system
  const rollMode = game.settings.get('core', 'rollMode')

  const attackAttributeImmune = actor.getAttribute(talentData?.vs?.attribute)?.immune
  const defenseAttributeImmune = target.getAttribute(talentData?.vs?.attribute)?.immune
  const voidRoll = attackAttributeImmune || defenseAttributeImmune

  let usesText = ''
  if (parseInt(talentData?.uses?.value) >= 0 && parseInt(talentData?.uses?.max) > 0) {
    const uses = parseInt(talentData.uses?.value)
    const usesmax = parseInt(talentData.uses?.max)
    usesText = game.i18n.localize('DL.TalentUses') + ': ' + uses + ' / ' + usesmax
  }

  const targetNumber = talentData?.vs?.attribute ? actor.getVSTargetNumber(talent) : ''
  let resultText =
    !voidRoll && attackRoll != null && targetNumber !== undefined && attackRoll.total >= parseInt(targetNumber)
      ? game.i18n.localize('DL.DiceResultSuccess')
      : game.i18n.localize('DL.DiceResultFailure')

  let diceTotalGM = attackRoll?.total ?? ''
  let diceTotal = diceTotalGM
  if (
    (actor.type === 'creature' && !game.settings.get('demonlord', 'attackShowAttack')) ||
    rollMode === 'blindroll'
  ) {
    diceTotal = '?'
    resultText = ''
  }
  const resultBoxClass = voidRoll ? 'FAILURE' : (resultText === '' ? '' : attackRoll?.total >= +targetNumber ? 'SUCCESS' : 'FAILURE')
  const againstNumber =
    target?.actor?.type === 'character' || (game.settings.get('demonlord', 'attackShowDefense') && targetNumber)
      ? targetNumber
      : '?'

  const attackAttribute = talentData.vs?.attribute?.toLowerCase() || ''
  const defenseAttribute = talentData.vs?.against?.toLowerCase() || ''
  const savingAttribute = talentData?.action?.defense?.toLowerCase() || ''
  const talentEffects = buildTalentEffectsMessage(actor, talent)
  //
  const templateData = {
    actor: actor,
    item: talent,
    data: {},
    diceData: formatDice(attackRoll || null),
  }
  const data = templateData.data
  data['id'] = talent.id
  data['roll'] = Boolean(attackRoll)
  data['diceTotal'] = attackAttributeImmune ? '-' : diceTotal
  data['diceTotalGM'] = attackAttributeImmune ? '-' : diceTotalGM
  data['resultText'] = resultText
  data['resultBoxClass'] = resultBoxClass
  data['didHit'] = attackRoll?.total >= targetNumber
  data['attack'] = attackAttribute ? game.i18n.localize(CONFIG.DL.attributes[attackAttribute]?.toUpperCase()) : ''
  data['against'] = defenseAttribute
    ? game.i18n.localize(CONFIG.DL.attributes[defenseAttribute]?.toUpperCase())
    : ''
  data['againstNumber'] = defenseAttributeImmune ? '-' : againstNumber
  data['againstNumberGM'] = defenseAttributeImmune ? '-' : (againstNumber === '?' ? targetNumber : againstNumber)
  data['damageFormular'] = talentData?.vs?.damage
    ? talentData?.vs?.damage + actor.system.bonuses.attack.damage || ''
    : talentData?.action?.damage
  data['damageType'] =
    talentData?.vs?.damageactive && talentData?.vs?.damage ? talentData?.vs?.damagetype : talentData?.action?.damagetype
  data['damageTypes'] = talentData?.vs?.damagetypes
  data['damageExtra20plusFormular'] = talentData?.vs?.plus20damage ? talentData?.vs?.plus20damage : talentData?.action?.plus20damage
  data['description'] = talentData?.description
  data['defense'] = talentData?.action?.defense
  data['defenseboonsbanes'] = parseInt(talentData?.action?.defenseboonsbanes)
  data['challStrength'] = savingAttribute === 'strength'
  data['challAgility'] = savingAttribute === 'agility'
  data['challIntellect'] = savingAttribute === 'intellect'
  data['challWill'] = savingAttribute === 'will'
  data['challPerception'] = savingAttribute === 'perception'
  data['uses'] = usesText
  data['healing'] =
    talentData?.healing?.healactive && talentData?.healing?.healing ? talentData?.healing?.healing : false
  data['targetname'] = target?.name || ''
  data['isCreature'] = actor.type === 'creature'
  data['pureDamage'] = talentData?.damage
  data['pureDamageType'] = talentData?.damagetype
  data['attackEffects'] = buildAttackEffectsMessage(actor, target, talent, attackAttribute, defenseAttribute)
  data['talentEffects'] = talentEffects
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['hasAreaTarget'] = talentData?.activatedEffect?.target?.type in CONFIG.DL.actionAreaShape
  data['itemEffects'] = talent.effects
  data['actorInfo'] = buildActorInfo(actor)

  const chatData = getChatBaseData(actor, rollMode)
  if (attackRoll) {
    chatData.rolls = [attackRoll]
    chatData.type = CONST.CHAT_MESSAGE_TYPES.ROLL
  }
  if (talentData?.damage || talentData?.vs?.attribute || (!talentData?.vs?.attribute && !talentData?.damage)) {
    const template = 'systems/demonlord/templates/chat/talent.hbs'
    return renderTemplate(template, templateData).then(content => {
      chatData.content = content
      if (attackRoll != null) {
        chatData.sound = CONFIG.sounds.dice
      }
      ChatMessage.create(chatData)
    })
  }
}

/* -------------------------------------------- */

/**
 * Generates and sends the chat message for a SPELL
 * @param actor
 * @param spell
 * @param attackRoll
 * @param target
 */
export function postSpellToChat(actor, spell, attackRoll, target) {
  const spellData = spell.system
  const rollMode = game.settings.get('core', 'rollMode')

  const attackAttribute = spellData?.action?.attack?.toLowerCase()
  const defenseAttribute = spellData?.action?.against?.toLowerCase()  // displayed as "against" in the sheet
  const savingAttribute = spellData?.action?.defense?.toLowerCase()  // displayed as "Defense" in the sheet
  // const challengeAttribute = spellData?.attribute?.toLowerCase() // FIXME
  const targetNumber = actor.getTargetNumber(spell)
  const plus20 = attackRoll?.total >= 20 && attackRoll?.total > targetNumber + 5

  const attackAttributeImmune = actor?.getAttribute(attackAttribute)?.immune
  const defenseAttributeImmune = target?.getAttribute(defenseAttribute)?.immune
  const voidRoll = attackAttributeImmune || defenseAttributeImmune

  let uses = parseInt(spellData?.castings?.value)
  let usesMax = parseInt(spellData?.castings?.max)
  let usesText = ''
  if (uses >= 0 && usesMax > 0) usesText = game.i18n.localize('DL.SpellCastingsUses') + ': ' + uses + ' / ' + usesMax

  let resultText =
    !voidRoll && targetNumber && attackRoll?.total >= parseInt(targetNumber)
      ? game.i18n.localize('DL.DiceResultSuccess')
      : game.i18n.localize('DL.DiceResultFailure')
  let diceTotalGM = attackRoll?.total || ''
  let diceTotal = diceTotalGM
  if (
    (actor.type === 'creature' && !game.settings.get('demonlord', 'attackShowAttack')) ||
    rollMode === 'blindroll'
  ) {
    diceTotal = '?'
    resultText = ''
  }
  const resultBoxClass = voidRoll ? 'FAILURE' : (resultText === '' ? '' : attackRoll?.total >= +targetNumber ? 'SUCCESS' : 'FAILURE')
  let againstNumber =
    target?.actor?.type === 'character' || (game.settings.get('demonlord', 'attackShowDefense') && targetNumber)
      ? targetNumber
      : '?'

  let effectdice = ''
  if (spellData?.effectdice && spellData?.effectdice !== '') {
    const effectRoll = new Roll(spellData.effectdice, {})
    effectRoll.evaluate({async: false})
    effectdice = effectRoll.total
  }

  const templateData = {
    actor: actor,
    item: spell,
    data: {},
    diceData: formatDice(attackRoll),
  }
  const data = templateData.data
  data['id'] = spell.id
  data['diceTotal'] = attackAttributeImmune ? '-' : diceTotal
  data['diceTotalGM'] = attackAttributeImmune ? '-' : diceTotalGM
  data['resultText'] = resultText
  data['resultBoxClass'] = resultBoxClass
  data['attack'] = attackAttribute ? game.i18n.localize(CONFIG.DL.attributes[attackAttribute]?.toUpperCase()) : ''
  data['against'] = defenseAttribute ? game.i18n.localize(CONFIG.DL.attributes[defenseAttribute]?.toUpperCase()) : ''
  data['againstNumber'] = defenseAttributeImmune ? '-' : againstNumber
  data['againstNumberGM'] = defenseAttributeImmune ? '-' : (againstNumber === '?' ? targetNumber : againstNumber)
  data['damageFormular'] = spellData.action?.damage
  data['damageType'] = spellData.action?.damagetype
  data['damageTypes'] = spellData.action?.damagetypes
  data['damageExtra20plusFormular'] = spellData.action?.plus20damage
  data['attribute'] = spellData.attribute
  data['plus20'] = attackRoll?.total >= 20
  data['isPlus20Roll'] = plus20
  data['hasTarget'] = targetNumber !== undefined
  data['plus20text'] = spellData.action?.plus20
  data['description'] = spellData.description
  data['spellcastings'] = usesMax
  data['spellduration'] = spellData?.duration
  data['spelltarget'] = spellData?.target
  data['spellarea'] = spellData?.area
  data['spellrequirements'] = spellData?.requirements
  data['spellsacrifice'] = spellData?.sacrifice
  data['spellpermanence'] = spellData?.permanence
  data['spellspecial'] = spellData?.special
  data['spelltriggered'] = spellData?.triggered
  data['targetname'] = target?.name || ''
  data['effectdice'] = effectdice
  data['defense'] = spellData?.action?.defense
  data['defenseboonsbanes'] = parseInt(spellData?.action?.defenseboonsbanes)
  data['challStrength'] = savingAttribute === 'strength'
  data['challAgility'] = savingAttribute === 'agility'
  data['challIntellect'] = savingAttribute === 'intellect'
  data['challWill'] = savingAttribute === 'will'
  data['challPerception'] = savingAttribute === 'perception'
  data['uses'] = usesText
  data['isCreature'] = actor.type === 'creature'
  data['healing'] = spellData?.healing?.healactive && spellData?.healing?.healing
  data['effects'] = '' // FIXME: what to put in here??
  data['attackEffects'] = buildAttackEffectsMessage(actor, target, spell, attackAttribute, defenseAttribute)
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['hasAreaTarget'] = spellData?.activatedEffect?.target?.type in CONFIG.DL.actionAreaShape
  data['itemEffects'] = spell.effects
  data['actorInfo'] = buildActorInfo(actor)

  const chatData = getChatBaseData(actor, rollMode)
  if (attackRoll) {
    chatData.rolls = [attackRoll]
    chatData.type = CONST.CHAT_MESSAGE_TYPES.ROLL
  }
  const template = 'systems/demonlord/templates/chat/spell.hbs'
  renderTemplate(template, templateData).then(content => {
    chatData.content = content
    if (attackRoll != null && attackAttribute) {
      chatData.sound = CONFIG.sounds.dice
    }
    ChatMessage.create(chatData)
  })
}

/* -------------------------------------------- */

export async function postCorruptionToChat(actor, corruptionRoll) {
  const templateData = {
    actor: actor,
    data: {},
    diceData: formatDice(corruptionRoll),
  }
  const data = templateData.data
  data['diceTotal'] = corruptionRoll.total
  data['actorInfo'] = buildActorInfo(actor)
  data['tagetValueText'] = game.i18n.localize('DL.CharCorruption').toUpperCase()
  data['targetValue'] = actor.system.characteristics.corruption
  data['resultText'] =
    corruptionRoll.total >= actor.system.characteristics.corruption
      ? game.i18n.localize('DL.DiceResultSuccess')
      : game.i18n.localize('DL.DiceResultFailure')
  data['failureText'] =
    corruptionRoll.total >= actor.system.characteristics.corruption
      ? ''
      : game.i18n.localize('DL.CharRolCorruptionResult')

  const rollMode = game.settings.get('core', 'rollMode')
  const chatData = getChatBaseData(actor, rollMode)
  if (corruptionRoll) {
    chatData.rolls = [corruptionRoll]
    chatData.type = CONST.CHAT_MESSAGE_TYPES.ROLL
  }
  const template = 'systems/demonlord/templates/chat/corruption.hbs'

  chatData.content = await renderTemplate(template, templateData)
  chatData.sound = CONFIG.sounds.dice
  await ChatMessage.create(chatData)

  // Get mark of darkess if roll < corruption value
  if (corruptionRoll.total < actor.system.characteristics.corruption) {
    const compendiumRollTables = await game.packs.get('demonlord.sotdl roll tabels').getDocuments()
    const tableMarkOfDarkess = compendiumRollTables.find(i => i.name === 'Mark of Darkness')
    const result = await tableMarkOfDarkess.draw()
    let resultText = result.results[0].text
    await actor.createEmbeddedDocuments('Item', [
      {
        name: 'Mark of Darkness',
        type: 'feature',
        img: 'icons/magic/death/skull-energy-light-purple.webp',
        data: {
          description: resultText,
        },
      },
    ])
  }
}

export const postItemToChat = (actor, item) => {
  const templateData = {
    actor,
    token: actor.token,
    data: {
      img: item.img,
      itemname: {
        value: item.name,
      },
      description: {
        value: item.system.description,
      },
    },
  }

  const chatData = {
    user: game.user.id,
    speaker: {
      actor: actor.id,
      token: actor.token,
      alias: actor.name,
    },
  }
  const template = 'systems/demonlord/templates/chat/useitem.hbs'
  renderTemplate(template, templateData).then(content => {
    chatData.content = content
    ChatMessage.create(chatData)
  })
}

/* -------------------------------------------- */
