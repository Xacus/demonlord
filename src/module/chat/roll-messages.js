import {buildAttackEffectsMessage, buildAttributeEffectsMessage, buildTalentEffectsMessage} from './effect-messages'
import {buildActorInfo, formatDice, getChatBaseData} from './base-messages'

function changeBobDieColour (attackRoll)
{
  if (attackRoll === null || attackRoll === undefined ) return attackRoll
  if (game.settings.get('demonlord', 'colourBoBDieDSN')) {
    let d6Index = 0
    let bgColor = '#bf0202'      
    if (game.modules.get('dice-so-nice')?.active) {
      if (attackRoll._formula.includes('d6kh') || attackRoll._formula.includes('d6r1kh')) {
        let operator = attackRoll.terms[attackRoll.terms.length - 2].operator

        if (operator === '+') bgColor = '#104f09'

        for (let die of attackRoll.dice) {
          if (die._faces === 6) d6Index++
        }        

        attackRoll.dice[d6Index].options.appearance = {
          background: bgColor,
          outline: bgColor,
        }          
      }
    }
  }
  return attackRoll
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
export function postAttackToChat(attacker, defender, item, attackRoll, attackAttribute, defenseAttribute, inputBoons) {

  attackRoll = changeBobDieColour (attackRoll)

  const itemData = item.system
  const rollMode = game.settings.get('core', 'rollMode')

  const savingAttribute = itemData?.action?.defense?.toLowerCase() || '' // displayed as "Defense" in the sheet

  const attackAttributeImmune = attacker?.getAttribute(attackAttribute)?.immune
  const defenseAttributeImmune = defender?.getAttribute(defenseAttribute)?.immune
  const voidRoll = attackAttributeImmune || defenseAttributeImmune

  const targetNumber =
    defenseAttribute === 'defense'
      ? defender?.system.characteristics.defense
      : defender?.getAttribute(defenseAttribute)?.value || ''

  const plus20 = attackRoll?.total >= 20 && attackRoll?.total > targetNumber + 5
  const didHit = voidRoll ? false : attackRoll?.total >= targetNumber

  let diceTotalGM = attackRoll?.total ?? ''
  let diceTotal = diceTotalGM
  let resultText = didHit ? game.i18n.localize('DL.DiceResultSuccess') : game.i18n.localize('DL.DiceResultFailure')

  const attackShow = game.settings.get('demonlord', 'attackShowAttack')
  if (((attacker.type === 'creature' || attacker.type === 'vehicle') && !attackShow) || rollMode === 'blindroll') {
    diceTotal = '?'
    resultText = ''
  }
  const resultBoxClass = voidRoll ? 'FAILURE' : (resultText === '' ? '' : didHit ? 'SUCCESS' : 'FAILURE')
  const defenseShow = game.settings.get('demonlord', 'attackShowDefense')
  const againstNumber = ((defender?.type === 'character' && defender?.isPC) || defenseShow) && targetNumber ? targetNumber : '?'

  let extraDamage = (attacker.system.bonuses.attack.damage.weapon ?? '') + (attacker.system.bonuses.attack.damage.all ?? '')
  let extraDamage20Plus = (attacker.system.bonuses.attack.plus20Damage.weapon ?? '') + (attacker.system.bonuses.attack.plus20Damage.all ?? '')

  const templateData = {
    actor: attacker,
    item: {id: item._id, data: item, name: item.name, uuid: item.uuid},
    data: {},
    diceData: formatDice(attackRoll),
  }

  const data = templateData.data
  data['roll'] = Boolean(attackRoll)
  data['diceTotal'] = attackAttributeImmune ? '-' : diceTotal
  data['diceTotalGM'] = attackAttributeImmune ? '-' : diceTotalGM
  data['resultText'] = resultText
  data['resultBoxClass'] = resultBoxClass
  data['attack'] = attackAttribute ? game.i18n.localize(CONFIG.DL.attributes[attackAttribute]?.toUpperCase()) : 'FLAT'
  data['against'] = defenseAttribute ? game.i18n.localize(CONFIG.DL.attributes[defenseAttribute]?.toUpperCase()) : ''
  data['againstNumber'] = defenseAttributeImmune ? '-' : againstNumber
  data['againstNumberGM'] = defenseAttributeImmune ? '-' : (againstNumber === '?' ? targetNumber : againstNumber)
  data['damageFormula'] = itemData?.action?.damage
  data['extraDamageFormula'] = extraDamage
  data['damageType'] = itemData.action.damagetype
  data['damageTypes'] = itemData.action.damagetypes
  data['damageExtra20PlusFormula'] = itemData.action?.plus20damage + extraDamage20Plus
  data['description'] = itemData.description
  data['defense'] = itemData.action?.defense
  data['defenseboonsbanes'] = parseInt(itemData.action?.defenseboonsbanes)
  data['challStrength'] = savingAttribute === 'strength'
  data['challAgility'] = savingAttribute === 'agility'
  data['challIntellect'] = savingAttribute === 'intellect'
  data['challWill'] = savingAttribute === 'will'
  data['challPerception'] = savingAttribute === 'perception'
  data['targetName'] = defender?.name || ''
  data['isCreature'] = attacker.type === 'creature' || attacker.type === 'vehicle'
  data['isPlus20Roll'] = plus20
  data['hasTarget'] = targetNumber !== undefined
  data['effects'] = attacker.system.bonuses.attack.extraEffect
  data['attackEffects'] = buildAttackEffectsMessage(attacker, defender, item, attackAttribute, defenseAttribute, inputBoons, plus20)
  data['armorEffects'] = '' // TODO
  data['afflictionEffects'] = '' //TODO
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['hasAreaTarget'] = itemData.activatedEffect?.target?.type in CONFIG.DL.actionAreaShape
  data['itemEffects'] = item.effects
  data['actorInfo'] = buildActorInfo(attacker)

  const chatData = getChatBaseData(attacker, rollMode)
  if (attackRoll) {
    chatData.rolls = [attackRoll]
  }
  const template = 'systems/demonlord/templates/chat/combat.hbs'
  return renderTemplate(template, templateData).then(content => {
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
export function postAttributeToChat(actor, attribute, challengeRoll, inputBoons) {

  challengeRoll = changeBobDieColour (challengeRoll)  

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

  const data = templateData.data
  data['diceTotal'] = voidRoll ? '-' : diceTotal
  data['diceTotalGM'] = voidRoll ? '-' : challengeRoll.total
  data['resultText'] = resultText
  data['resultTextGM'] = resultTextGM
  data['resultBoxClass'] = resultBoxClass
  data['isCreature'] = actor.type === 'creature'
  data['actionEffects'] = buildAttributeEffectsMessage(actor, attribute, inputBoons)
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['actorInfo'] = buildActorInfo(actor)

  const chatData = getChatBaseData(actor, rollMode)
  if (challengeRoll) {
    chatData.rolls = [challengeRoll]
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
export function postTalentToChat(actor, talent, attackRoll, target, inputBoons) {

  attackRoll = changeBobDieColour (attackRoll)

  const talentData = talent.system
  const rollMode = game.settings.get('core', 'rollMode')

  const attackAttribute = talentData.action?.attack?.toLowerCase() || ''
  const defenseAttribute = talentData.action?.against?.toLowerCase() || '' // displayed as "against" in the sheet
  const savingAttribute = talentData?.action?.defense?.toLowerCase() || '' // displayed as "Defense" in the sheet

  const attackAttributeImmune = actor?.getAttribute(attackAttribute)?.immune
  const defenseAttributeImmune = target?.getAttribute(defenseAttribute)?.immune
  const voidRoll = attackAttributeImmune || defenseAttributeImmune

  let usesText = ''
  if (parseInt(talentData?.uses?.value) >= 0 && parseInt(talentData?.uses?.max) > 0) {
    const uses = parseInt(talentData.uses?.value)
    const usesmax = parseInt(talentData.uses?.max)
    usesText = game.i18n.localize('DL.TalentUses') + ': ' + uses + ' / ' + usesmax
  }

  const targetNumber = talentData?.action?.attack ? actor.getTargetNumber(talent) : ''
  const plus20 = attackRoll?.total >= 20 && attackRoll?.total > targetNumber + 5

  let resultText =
    !voidRoll && attackRoll != null && targetNumber !== undefined && attackRoll.total >= parseInt(targetNumber)
      ? game.i18n.localize('DL.DiceResultSuccess')
      : game.i18n.localize('DL.DiceResultFailure')

  let diceTotalGM = attackRoll?.total ?? ''
  let diceTotal = diceTotalGM

  const attackShow = game.settings.get('demonlord', 'attackShowAttack')
  if (((actor.type === 'creature' || actor.type === 'vehicle') && !attackShow) || rollMode === 'blindroll') {
    diceTotal = '?'
    resultText = ''
  }
  const resultBoxClass = voidRoll ? 'FAILURE' : (resultText === '' ? '' : attackRoll?.total >= +targetNumber ? 'SUCCESS' : 'FAILURE')
  const defenseShow = game.settings.get('demonlord', 'attackShowDefense')
  const againstNumber = ((target?.actor?.type === 'character' && target?.actor?.isPC) || defenseShow) && targetNumber ? targetNumber : '?'

  let extraDamage = (actor.system.bonuses.attack.damage.talent ?? '') + (actor.system.bonuses.attack.damage.all ?? '')
  let extraDamage20Plus = (actor.system.bonuses.attack.plus20Damage.talent ?? '') + (actor.system.bonuses.attack.plus20Damage.all ?? '')

  const templateData = {
    actor: actor,
    item: talent,
    data: {},
    diceData: formatDice(attackRoll || null),
  }

  const data = templateData.data
  data['id'] = talent._id
  data['roll'] = Boolean(attackRoll)
  data['diceTotal'] = attackAttributeImmune ? '-' : diceTotal
  data['diceTotalGM'] = attackAttributeImmune ? '-' : diceTotalGM
  data['resultText'] = resultText
  data['resultBoxClass'] = resultBoxClass
  data['attack'] = attackAttribute ? game.i18n.localize(CONFIG.DL.attributes[attackAttribute]?.toUpperCase()) : ''
  data['against'] = defenseAttribute ? game.i18n.localize(CONFIG.DL.attributes[defenseAttribute]?.toUpperCase()) : ''
  data['againstNumber'] = defenseAttributeImmune ? '-' : againstNumber
  data['againstNumberGM'] = defenseAttributeImmune ? '-' : (againstNumber === '?' ? targetNumber : againstNumber)
  data['damageFormula'] = talentData?.action?.damage
  data['extraDamageFormula'] = extraDamage
  data['damageType'] = talentData.action?.damageactive && talentData?.action?.damage ? talentData?.action?.damagetype : talentData?.action?.damagetype
  data['damageTypes'] = talentData.action?.damagetypes
  data['damageExtra20PlusFormula'] = talentData.action?.plus20damage + extraDamage20Plus
  data['description'] = talentData.description
  data['defense'] = talentData.action?.defense
  data['defenseboonsbanes'] = parseInt(talentData.action?.defenseboonsbanes)
  data['challStrength'] = savingAttribute === 'strength'
  data['challAgility'] = savingAttribute === 'agility'
  data['challIntellect'] = savingAttribute === 'intellect'
  data['challWill'] = savingAttribute === 'will'
  data['challPerception'] = savingAttribute === 'perception'
  data['uses'] = usesText
  data['healing'] = talentData?.healing?.healactive && talentData?.healing?.healing ? talentData?.healing?.healing : false
  data['targetName'] = target?.name || ''
  data['isCreature'] = actor.type === 'creature' || actor.type === 'vehicle'
  data['isPlus20Roll'] = plus20
  data['hasTarget'] = targetNumber !== undefined
  data['pureDamage'] = talentData?.damage
  data['pureDamageType'] = talentData?.damagetype
  data['attackEffects'] = buildAttackEffectsMessage(actor, target, talent, attackAttribute, defenseAttribute, inputBoons, plus20)
  data['effects'] = buildTalentEffectsMessage(actor, talent)
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['hasAreaTarget'] = talentData?.activatedEffect?.target?.type in CONFIG.DL.actionAreaShape
  data['itemEffects'] = talent.effects
  data['actorInfo'] = buildActorInfo(actor)

  const chatData = getChatBaseData(actor, rollMode)
  if (attackRoll) {
    chatData.rolls = [attackRoll]
  }
  if (talentData?.damage || talentData?.action?.attack || (!talentData?.action?.attack && !talentData?.damage)) {
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
export async function postSpellToChat(actor, spell, attackRoll, target, inputBoons) {

  attackRoll = changeBobDieColour (attackRoll)

  const spellData = spell.system
  const rollMode = game.settings.get('core', 'rollMode')

  const attackAttribute = spellData?.action?.attack?.toLowerCase()
  const defenseAttribute = spellData?.action?.against?.toLowerCase()  // displayed as "against" in the sheet
  const savingAttribute = spellData?.action?.defense?.toLowerCase()  // displayed as "Defense" in the sheet

  const attackAttributeImmune = actor?.getAttribute(attackAttribute)?.immune
  const defenseAttributeImmune = target?.getAttribute(defenseAttribute)?.immune
  const voidRoll = attackAttributeImmune || defenseAttributeImmune

  let uses = parseInt(spellData?.castings?.value)
  let usesMax = parseInt(spellData?.castings?.max)
  let usesText = ''
  if (uses >= 0 && usesMax > 0) usesText = game.i18n.localize('DL.SpellCastingsUses') + ': ' + uses + ' / ' + usesMax

  const targetNumber = actor.getTargetNumber(spell)
  const plus20 = attackRoll?.total >= 20 && attackRoll?.total > targetNumber + 5

  let resultText =
    !voidRoll && targetNumber && attackRoll?.total >= parseInt(targetNumber)
      ? game.i18n.localize('DL.DiceResultSuccess')
      : game.i18n.localize('DL.DiceResultFailure')
  let diceTotalGM = attackRoll?.total || ''
  let diceTotal = diceTotalGM

  const attackShow = game.settings.get('demonlord', 'attackShowAttack')
  if (((actor.type === 'creature' || actor.type === 'vehicle') && !attackShow) || rollMode === 'blindroll') {
    diceTotal = '?'
    resultText = ''
  }
  const resultBoxClass = voidRoll ? 'FAILURE' : (resultText === '' ? '' : attackRoll?.total >= +targetNumber ? 'SUCCESS' : 'FAILURE')
  const defenseShow = game.settings.get('demonlord', 'attackShowDefense')
  const againstNumber = ((target?.actor?.type === 'character' && target?.actor?.isPC) || defenseShow) && targetNumber ? targetNumber : '?'

  let effectdice = ''
  if (spellData?.effectdice && spellData?.effectdice !== '') {
    const effectRoll = new Roll(spellData.effectdice, actor.system)
    await effectRoll.evaluate()
    effectdice = effectRoll.total
  }

  let extraDamage = (actor.system.bonuses.attack.damage.spell ?? '') + (actor.system.bonuses.attack.damage.all ?? '')
  let extraDamage20Plus = (actor.system.bonuses.attack.plus20Damage.spell ?? '') + (actor.system.bonuses.attack.plus20Damage.all ?? '')

  const templateData = {
    actor: actor,
    item: spell,
    data: {},
    diceData: formatDice(attackRoll),
  }
  const data = templateData.data
  data['id'] = spell._id
  data['roll'] = Boolean(attackRoll)
  data['diceTotal'] = attackAttributeImmune ? '-' : diceTotal
  data['diceTotalGM'] = attackAttributeImmune ? '-' : diceTotalGM
  data['resultText'] = resultText
  data['resultBoxClass'] = resultBoxClass
  data['attack'] = attackAttribute ? game.i18n.localize(CONFIG.DL.attributes[attackAttribute]?.toUpperCase()) : ''
  data['against'] = defenseAttribute ? game.i18n.localize(CONFIG.DL.attributes[defenseAttribute]?.toUpperCase()) : ''
  data['againstNumber'] = defenseAttributeImmune ? '-' : againstNumber
  data['againstNumberGM'] = defenseAttributeImmune ? '-' : (againstNumber === '?' ? targetNumber : againstNumber)
  data['damageFormula'] = spellData?.action?.damage
  data['extraDamageFormula'] = extraDamage
  data['damageType'] = spellData.action?.damagetype
  data['damageTypes'] = spellData.action?.damagetypes
  data['damageExtra20PlusFormula'] = spellData.action?.plus20damage + extraDamage20Plus
  data['description'] = spellData.description
  data['defense'] = spellData.action?.defense
  data['defenseboonsbanes'] = parseInt(spellData.action?.defenseboonsbanes)
  data['challStrength'] = savingAttribute === 'strength'
  data['challAgility'] = savingAttribute === 'agility'
  data['challIntellect'] = savingAttribute === 'intellect'
  data['challWill'] = savingAttribute === 'will'
  data['challPerception'] = savingAttribute === 'perception'
  data['uses'] = usesText
  data['healing'] = spellData?.healing?.healactive && spellData?.healing?.healing
  data['attribute'] = spellData.attribute
  data['isPlus20Roll'] = plus20
  data['hasTarget'] = targetNumber !== undefined
  data['plus20Text'] = spellData.action?.plus20
  data['spellcastings'] = usesMax
  data['spellduration'] = spellData?.duration
  data['spelltarget'] = spellData?.target
  data['spellarea'] = spellData?.area
  data['spellrequirements'] = spellData?.requirements
  data['spellsacrifice'] = spellData?.sacrifice
  data['spellpermanence'] = spellData?.permanence
  data['spellspecial'] = spellData?.special
  data['spelltriggered'] = spellData?.triggered
  data['targetName'] = target?.name || ''
  data['isCreature'] = actor.type === 'creature'
  data['isPlus20Roll'] = plus20
  data['effectdice'] = effectdice
  data['effects'] = '' // FIXME: what to put in here??
  data['attackEffects'] = buildAttackEffectsMessage(actor, target, spell, attackAttribute, defenseAttribute, inputBoons, plus20)
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['hasAreaTarget'] = spellData?.activatedEffect?.target?.type in CONFIG.DL.actionAreaShape
  data['itemEffects'] = spell.effects
  data['actorInfo'] = buildActorInfo(actor)

  const chatData = getChatBaseData(actor, rollMode)
  if (attackRoll) {
    chatData.rolls = [attackRoll]
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
  data['targetValue'] = actor.system.characteristics.corruption.value
  data['resultText'] =
    corruptionRoll.total >= actor.system.characteristics.corruption.value
      ? game.i18n.localize('DL.DiceResultSuccess')
      : game.i18n.localize('DL.DiceResultFailure')
  data['failureText'] =
    corruptionRoll.total >= actor.system.characteristics.corruption.value
      ? ''
      : game.i18n.localize('DL.CharRolCorruptionResult')

  const rollMode = game.settings.get('core', 'rollMode')
  const chatData = getChatBaseData(actor, rollMode)
  if (corruptionRoll) {
    chatData.rolls = [corruptionRoll]
  }
  const template = 'systems/demonlord/templates/chat/corruption.hbs'

  chatData.content = await renderTemplate(template, templateData)
  chatData.sound = CONFIG.sounds.dice
  await ChatMessage.create(chatData)

  // Get mark of darkess if roll < corruption value
  if (corruptionRoll.total < actor.system.characteristics.corruption.value) {
    const compendiumRollTables = await game.packs.get('demonlord.sotdl roll tabels').getDocuments()
    const tableMarkOfDarkess = compendiumRollTables.find(i => i.name === 'Mark of Darkness')
    const result = await tableMarkOfDarkess.draw()
    let resultText = result.results[0].text
    await actor.createEmbeddedDocuments('Item', [
      {
        name: 'Mark of Darkness',
        type: 'feature',
        img: 'icons/magic/death/skull-energy-light-purple.webp',
        system: {
          description: resultText,
        },
      },
    ])
  }
}

export const postItemToChat = (actor, item, attackRoll, target, inputBoons) => {
  const itemData = item.system
  const rollMode = game.settings.get('core', 'rollMode')

  const attackAttribute = itemData.action?.attack?.toLowerCase() || ''
  const defenseAttribute = itemData.action?.against?.toLowerCase() || '' // displayed as "against" in the sheet
  const savingAttribute = itemData?.action?.defense?.toLowerCase() || '' // displayed as "Defense" in the sheet

  const attackAttributeImmune = actor?.getAttribute(attackAttribute)?.immune
  const defenseAttributeImmune = target?.getAttribute(defenseAttribute)?.immune
  const voidRoll = attackAttributeImmune || defenseAttributeImmune

  /*let usesText = ''
  if (parseInt(itemData?.uses?.value) >= 0 && parseInt(itemData?.uses?.max) > 0) {
    const uses = parseInt(itemData.uses?.value)
    const usesmax = parseInt(itemData.uses?.max)
    usesText = game.i18n.localize('DL.TalentUses') + ': ' + uses + ' / ' + usesmax
  }*/

  const targetNumber = itemData?.action?.attack ? actor.getTargetNumber(item) : ''
  const plus20 = attackRoll?.total >= 20 && attackRoll?.total > targetNumber + 5

  let resultText =
    !voidRoll && attackRoll != null && targetNumber !== undefined && attackRoll.total >= parseInt(targetNumber)
      ? game.i18n.localize('DL.DiceResultSuccess')
      : game.i18n.localize('DL.DiceResultFailure')

  let diceTotalGM = attackRoll?.total ?? ''
  let diceTotal = diceTotalGM

  const attackShow = game.settings.get('demonlord', 'attackShowAttack')
  if (((actor.type === 'creature' || actor.type === 'vehicle') && !attackShow) || rollMode === 'blindroll') {
    diceTotal = '?'
    resultText = ''
  }
  const resultBoxClass = voidRoll ? 'FAILURE' : (resultText === '' ? '' : attackRoll?.total >= +targetNumber ? 'SUCCESS' : 'FAILURE')
  const defenseShow = game.settings.get('demonlord', 'attackShowDefense')
  const againstNumber = ((target?.actor?.type === 'character' && target?.actor?.isPC) || defenseShow) && targetNumber ? targetNumber : '?'

  let extraDamage = (actor.system.bonuses.attack.damage.weapon ?? '') + (actor.system.bonuses.attack.damage.all ?? '')
  let extraDamage20Plus = (actor.system.bonuses.attack.plus20Damage.weapon ?? '') + (actor.system.bonuses.attack.plus20Damage.all ?? '')

  const templateData = {
    actor,
    token: actor.token,
    item: item,
    data: {
      img: item.img,
      itemname: {
        value: item.name,
      },
      description: {
        value: item.system.description,
      },
    },
    diceData: formatDice(attackRoll || null),
  }

  const data = templateData.data
  data['roll'] = Boolean(attackRoll)
  data['diceTotal'] = attackAttributeImmune ? '-' : diceTotal
  data['diceTotalGM'] = attackAttributeImmune ? '-' : diceTotalGM
  data['resultText'] = resultText
  data['resultBoxClass'] = resultBoxClass
  data['attack'] = attackAttribute ? game.i18n.localize(CONFIG.DL.attributes[attackAttribute]?.toUpperCase()) : 'FLAT'
  data['against'] = defenseAttribute ? game.i18n.localize(CONFIG.DL.attributes[defenseAttribute]?.toUpperCase()) : ''
  data['againstNumber'] = defenseAttributeImmune ? '-' : againstNumber
  data['againstNumberGM'] = defenseAttributeImmune ? '-' : (againstNumber === '?' ? targetNumber : againstNumber)
  data['damageFormula'] = itemData?.action?.damage
  data['extraDamageFormula'] = extraDamage
  data['damageType'] = itemData.action?.damagetype
  data['damageTypes'] = itemData.action?.damagetypes
  data['damageExtra20PlusFormula'] = itemData.action?.plus20damage + extraDamage20Plus
  data['description'] = itemData.description
  data['defense'] = itemData.action?.defense
  data['defenseboonsbanes'] = parseInt(itemData.action?.defenseboonsbanes)
  data['challStrength'] = savingAttribute === 'strength'
  data['challAgility'] = savingAttribute === 'agility'
  data['challIntellect'] = savingAttribute === 'intellect'
  data['challWill'] = savingAttribute === 'will'
  data['challPerception'] = savingAttribute === 'perception'
  data['targetName'] = target?.name || ''
  data['isCreature'] = actor.type === 'creature' || actor.type === 'vehicle'
  data['isPlus20Roll'] = plus20
  data['hasTarget'] = targetNumber !== undefined
  data['effects'] = actor.system.bonuses.attack.extraEffect
  data['attackEffects'] = buildAttackEffectsMessage(actor, target, item, attackAttribute, defenseAttribute, inputBoons, plus20)
  data['armorEffects'] = '' // TODO
  data['afflictionEffects'] = '' //TODO
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['hasAreaTarget'] = itemData.activatedEffect?.target?.type in CONFIG.DL.actionAreaShape
  data['itemEffects'] = item.effects
  data['actorInfo'] = buildActorInfo(actor)

  const chatData = getChatBaseData(actor, rollMode)
  if (attackRoll) {
    chatData.rolls = [attackRoll]
  }
  const template = 'systems/demonlord/templates/chat/useitem.hbs'
  return renderTemplate(template, templateData).then(content => {
    chatData.content = content
    if (attackRoll != null) {
      chatData.sound = CONFIG.sounds.dice
    }
    ChatMessage.create(chatData)
  })
}

/* -------------------------------------------- */
