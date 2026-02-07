import {buildAttackEffectsMessage, buildAttributeEffectsMessage, buildTalentEffectsMessage} from './effect-messages'
import {buildActorInfo, formatDice, getChatBaseData} from './base-messages'

function changeBobDieColour (attackRoll)
{
  if (attackRoll === null || attackRoll === undefined ) return attackRoll
  if (game.settings.get('demonlord', 'colourBoBDieDSN')) {
    let d6Index = 0
    let bgColor = game.settings.get('demonlord', 'baneColour')
    if (game.modules.get('dice-so-nice')?.active) {
      if (attackRoll._formula.includes('d6kh') || attackRoll._formula.includes('d6r1kh') || attackRoll._formula.includes('d3kh') || attackRoll._formula.includes('d3r1kh')) {
        let operator = attackRoll.terms[attackRoll.terms.length - 2].operator

        if (operator === '+') bgColor = game.settings.get('demonlord', 'boonColour')

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
export function postAttackToChat(attacker, defender, item, attackRoll, attackAttribute, defenseAttribute, inputBoons, inputModifier) {

  attackRoll = changeBobDieColour (attackRoll)

  const itemData = item.system
  const rollMode = game.settings.get('core', 'rollMode')

  const savingAttribute = itemData?.action?.defense?.toLowerCase() || '' // displayed as "Defense" in the sheet

  const attackAttributeImmune = attacker?.getAttribute(attackAttribute)?.immune
  const defenseAttributeImmune = defender?.getAttribute(defenseAttribute)?.immune

  const targetNumber =
    defenseAttribute === 'defense'
      ? defender?.system.characteristics.defense
      : defender?.getAttribute(defenseAttribute)?.value || ''

  const voidRoll = attackAttributeImmune || defenseAttributeImmune || !targetNumber
  const plus20 = attackRoll?.total >= 20 && (targetNumber ? attackRoll?.total > targetNumber + (game.settings.get('demonlord', 'optionalRuleExceedsByFive') ? 5 : 4) : true)
  const didHit = voidRoll ? false : attackRoll?.total >= targetNumber

  let diceTotalGM = attackRoll?.total ?? ''
  let diceTotal = diceTotalGM
  let resultText = didHit ? game.i18n.localize('DL.DiceResultSuccess') : game.i18n.localize('DL.DiceResultFailure')

  const attackShow = game.settings.get('demonlord', 'attackShowAttack')
  if (((attacker.type === 'creature' || attacker.type === 'vehicle') && !attackShow) || rollMode === 'blindroll') {
    diceTotal = '?'
    // resultText = ''
  }
  const resultBoxClass = voidRoll ? '' : (resultText === '' ? '' : didHit ? 'SUCCESS' : 'FAILURE')
  const defenseShow = game.settings.get('demonlord', 'attackShowDefense')
  const againstNumber = ((defender?.type === 'character' && defender?.isPC) || defenseShow) && targetNumber ? targetNumber : '?'

  let extraDamage = (attacker.system.bonuses.attack.damage.weapon ?? '') + (attacker.system.bonuses.attack.damage.all ?? '')
  let extraDamage20Plus = (attacker.system.bonuses.attack.plus20Damage.weapon ?? '') + (attacker.system.bonuses.attack.plus20Damage.all ?? '')

  if (extraDamage.charAt(0).search(/[0-9]/i) === 0) extraDamage = '+' + extraDamage

  const templateData = {
    actor: attacker,
    tokenId: attacker.token ? attacker.token.uuid : null,
    item: item,
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
  if (attackRoll?.total >= targetNumber || targetNumber === undefined || !game.settings.get('demonlord', 'hideDamage'))
  {
    data['damageFormula'] = itemData?.action?.damage
    data['extraDamageFormula'] = extraDamage
    data['damageType'] = itemData.action.damagetype
    data['damageTypes'] = itemData.action.damagetypes
    data['damageExtra20PlusFormula'] = itemData.action?.plus20damage + extraDamage20Plus
    data['itemEffects'] = item.effects
  }
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
  data['isPlus20Roll'] = item?.type === 'attribute' ? false : plus20
  data['hasTarget'] = targetNumber !== undefined
  data['effects'] = attacker.system.bonuses.attack.extraEffect
  data['attackEffects'] = buildAttackEffectsMessage(attacker, defender, item, attackAttribute, defenseAttribute, inputBoons, plus20, inputModifier)
  data['armorEffects'] = '' // TODO
  data['afflictionEffects'] = '' //TODO
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['hasAreaTarget'] = itemData.activatedEffect?.target?.type in CONFIG.DL.actionAreaShape
  data['actorInfo'] = buildActorInfo(attacker)

  const chatData = getChatBaseData(attacker, rollMode)
  if (attackRoll) {
    chatData.rolls = [attackRoll]
  }
  const template = 'systems/demonlord/templates/chat/combat.hbs'
  return foundry.applications.handlebars.renderTemplate(template, templateData).then(content => {
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
export function postAttributeToChat(actor, attribute, challengeRoll, inputBoons, inputModifier = 9) {

  let targetNumber = (game.settings.get('demonlord', 'optionalRuleDieRollsMode') === 'b') ? 11 : 10

  challengeRoll = changeBobDieColour(challengeRoll)

  const rollMode = game.settings.get('core', 'rollMode')

  const voidRoll = actor.getAttribute(attribute)?.immune

  let diceTotal = challengeRoll?.total ?? ''
  let resultTextGM =
    challengeRoll.total >= targetNumber && !voidRoll ? game.i18n.localize('DL.DiceResultSuccess') : game.i18n.localize('DL.DiceResultFailure')

  let resultText = resultTextGM
  if (rollMode === 'blindroll') {
    diceTotal = '?'
    // resultText = ''
  }
  const resultBoxClass = voidRoll ? 'FAILURE' : (resultText === '' ? '' : challengeRoll.total >= targetNumber ? 'SUCCESS' : 'FAILURE')
  const templateData = {
    actor: actor,
    tokenId: actor.token ? actor.token.uuid : null,
    item: {name: game.i18n.localize(CONFIG.DL.attributes[attribute]?.toUpperCase())},
    diceData: formatDice(challengeRoll),
    data: {},
  }

  const data = templateData.data
  data['diceTotal'] = voidRoll ? '-' : diceTotal
  data['diceTotalGM'] = voidRoll ? '-' : challengeRoll.total
  data['resultText'] = resultText
  data['resultTextGM'] = resultTextGM
  data['resultBoxClass'] = resultBoxClass
  data['isCreature'] = actor.type === 'creature' || actor.type === 'vehicle'
  data['actionEffects'] = buildAttributeEffectsMessage(actor, attribute, inputBoons, inputModifier)
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['actorInfo'] = buildActorInfo(actor)
  data['targetNumber'] = targetNumber

  const chatData = getChatBaseData(actor, rollMode)
  if (challengeRoll) {
    chatData.rolls = [challengeRoll]
  }
  const template = 'systems/demonlord/templates/chat/challenge.hbs'
  foundry.applications.handlebars.renderTemplate(template, templateData).then(content => {
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
export function postTalentToChat(actor, talent, attackRoll, target, inputBoons, inputModifier) {

  attackRoll = changeBobDieColour (attackRoll)

  const talentData = talent.system
  const rollMode = game.settings.get('core', 'rollMode')

  const attackAttribute = talentData.action?.attack?.toLowerCase() || ''
  const defenseAttribute = talentData.action?.against?.toLowerCase() || '' // displayed as "against" in the sheet
  const savingAttribute = talentData?.action?.defense?.toLowerCase() || '' // displayed as "Defense" in the sheet

  const attackAttributeImmune = actor?.getAttribute(attackAttribute)?.immune
  const defenseAttributeImmune = target?.getAttribute(defenseAttribute)?.immune

  let usesText = ''
  if (parseInt(talentData?.uses?.value) >= 0 && parseInt(talentData?.uses?.max) > 0) {
    const uses = parseInt(talentData.uses?.value)
    const usesmax = parseInt(talentData.uses?.max)
    usesText = game.i18n.localize('DL.TalentUses') + ': ' + uses + ' / ' + usesmax
  }

  const targetNumber = talentData?.action?.attack ? actor.getTargetNumber(talent) : ''
  const voidRoll = attackAttributeImmune || defenseAttributeImmune || !targetNumber
  const plus20 = attackRoll?.total >= 20 && (targetNumber ? attackRoll?.total > targetNumber + (game.settings.get('demonlord', 'optionalRuleExceedsByFive') ? 5 : 4) : true)

  let resultText =
    !voidRoll && attackRoll != null && targetNumber !== undefined && attackRoll.total >= parseInt(targetNumber)
      ? game.i18n.localize('DL.DiceResultSuccess')
      : game.i18n.localize('DL.DiceResultFailure')

  let diceTotalGM = attackRoll?.total ?? ''
  let diceTotal = diceTotalGM

  const attackShow = game.settings.get('demonlord', 'attackShowAttack')
  if (((actor.type === 'creature' || actor.type === 'vehicle') && !attackShow) || rollMode === 'blindroll') {
    diceTotal = '?'
    // resultText = ''
  }
  const resultBoxClass = voidRoll ? '' : (resultText === '' ? '' : attackRoll?.total >= +targetNumber ? 'SUCCESS' : 'FAILURE')
  const defenseShow = game.settings.get('demonlord', 'attackShowDefense')
  const againstNumber = ((target?.actor?.type === 'character' && target?.actor?.isPC) || defenseShow) && targetNumber ? targetNumber : '?'

  let extraDamage = (actor.system.bonuses.attack.damage.talent ?? '') + (actor.system.bonuses.attack.damage.all ?? '')
  let extraDamage20Plus = (actor.system.bonuses.attack.plus20Damage.talent ?? '') + (actor.system.bonuses.attack.plus20Damage.all ?? '')

  if (extraDamage.charAt(0).search(/[0-9]/i) === 0) extraDamage = '+' + extraDamage

  const templateData = {
    actor: actor,
    tokenId: actor.token ? actor.token.uuid : null,
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
  if (attackRoll?.total >= targetNumber || targetNumber === undefined || !game.settings.get('demonlord', 'hideDamage'))
  {
    data['damageFormula'] = talentData?.action?.damage
    data['extraDamageFormula'] = extraDamage
    data['damageType'] = talentData.action?.damageactive && talentData?.action?.damage ? talentData?.action?.damagetype : talentData?.action?.damagetype
    data['damageTypes'] = talentData.action?.damagetypes
    data['damageExtra20PlusFormula'] = talentData.action?.plus20damage + extraDamage20Plus
    data['itemEffects'] = talent.effects
  }  
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
  data['attackEffects'] = attackRoll !== null ? buildAttackEffectsMessage(actor, target, talent, attackAttribute, defenseAttribute, inputBoons, plus20, inputModifier) : ''
  data['effects'] = buildTalentEffectsMessage(actor, talent)
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['hasAreaTarget'] = talentData?.activatedEffect?.target?.type in CONFIG.DL.actionAreaShape
  data['actorInfo'] = buildActorInfo(actor)

  const chatData = getChatBaseData(actor, rollMode)
  if (attackRoll) {
    chatData.rolls = [attackRoll]
  }
  if (talentData?.damage || talentData?.action?.attack || (!talentData?.action?.attack && !talentData?.damage)) {
    const template = 'systems/demonlord/templates/chat/talent.hbs'
    return foundry.applications.handlebars.renderTemplate(template, templateData).then(content => {
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
export async function postSpellToChat(actor, spell, attackRoll, target, inputBoons, inputModifier) {

  attackRoll = changeBobDieColour (attackRoll)

  const spellData = spell.system
  const rollMode = game.settings.get('core', 'rollMode')

  const attackAttribute = spellData?.action?.attack?.toLowerCase()
  const defenseAttribute = spellData?.action?.against?.toLowerCase()  // displayed as "against" in the sheet
  const savingAttribute = spellData?.action?.defense?.toLowerCase()  // displayed as "Defense" in the sheet

  const attackAttributeImmune = actor?.getAttribute(attackAttribute)?.immune
  const defenseAttributeImmune = target?.getAttribute(defenseAttribute)?.immune

  let uses = parseInt(spellData?.castings?.value)
  let usesMax = parseInt(spellData?.castings?.max)
  let usesText = ''
  if (uses >= 0 && usesMax > 0) usesText = game.i18n.localize('DL.SpellCastingsUses') + ': ' + uses + ' / ' + usesMax

  const targetNumber = actor.getTargetNumber(spell)
  const voidRoll = attackAttributeImmune || defenseAttributeImmune || !targetNumber
  const plus20 = attackRoll?.total >= 20 && (targetNumber ? attackRoll?.total > targetNumber + (game.settings.get('demonlord', 'optionalRuleExceedsByFive') ? 5 : 4) : true)

  let resultText =
    !voidRoll && targetNumber && attackRoll?.total >= parseInt(targetNumber)
      ? game.i18n.localize('DL.DiceResultSuccess')
      : game.i18n.localize('DL.DiceResultFailure')
  let diceTotalGM = attackRoll?.total || ''
  let diceTotal = diceTotalGM

  const attackShow = game.settings.get('demonlord', 'attackShowAttack')
  if (((actor.type === 'creature' || actor.type === 'vehicle') && !attackShow) || rollMode === 'blindroll') {
    diceTotal = '?'
    // resultText = ''
  }
  const resultBoxClass = voidRoll ? '' : (resultText === '' ? '' : attackRoll?.total >= +targetNumber ? 'SUCCESS' : 'FAILURE')
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

  if (extraDamage.charAt(0).search(/[0-9]/i) === 0) extraDamage = '+' + extraDamage

  const templateData = {
    actor: actor,
    tokenId: actor.token ? actor.token.uuid : null,
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
  if (attackRoll?.total >= targetNumber || targetNumber === undefined || !game.settings.get('demonlord', 'hideDamage'))
  {
    data['damageFormula'] = spellData?.action?.damage
    data['extraDamageFormula'] = extraDamage
    data['damageType'] = spellData.action?.damagetype
    data['damageTypes'] = spellData.action?.damagetypes
    data['damageExtra20PlusFormula'] = spellData.action?.plus20damage + extraDamage20Plus
    // Incantation (effects) -  We replace the uuid of the Scene.Actor.SpellItem.effect with the uuid of the SpellItem.effect as we already deleted the spell from the actor.
    if (spell.getFlag('demonlord','incantationSpellUuid')) {
      [...spell.effects].forEach((effect) => {
        effect.incantationspelluuid = `${spell.getFlag('demonlord','incantationSpellUuid')}.ActiveEffect.${effect._id}`
      })
    }
    data['itemEffects'] = spell.effects
  }
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
  data['isCreature'] = actor.type === 'creature' || actor.type === 'vehicle'
  data['isPlus20Roll'] = plus20
  data['effectdice'] = effectdice
  data['effects'] = actor.system.bonuses.attack.extraEffect
  data['attackEffects'] = buildAttackEffectsMessage(actor, target, spell, attackAttribute, defenseAttribute, inputBoons, plus20, inputModifier)
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['hasAreaTarget'] = spellData?.activatedEffect?.target?.type in CONFIG.DL.actionAreaShape
  data['actorInfo'] = buildActorInfo(actor)
  // Incantation (measured templates) -  We replace the uuid of the Scene.Actor.SpellItem with the uuid of the SpellItem as we already deleted the spell from the actor.
  data['incantationspelluuid'] = spell.getFlag('demonlord','incantationSpellUuid')

  const chatData = getChatBaseData(actor, rollMode)
  if (attackRoll) {
    chatData.rolls = [attackRoll]
  }
  const template = 'systems/demonlord/templates/chat/spell.hbs'
  foundry.applications.handlebars.renderTemplate(template, templateData).then(content => {
    chatData.content = content
    if (attackRoll != null && attackAttribute) {
      chatData.sound = CONFIG.sounds.dice
    }
    ChatMessage.create(chatData)
  })
}

/* -------------------------------------------- */

export async function postCustomTextToChat(actor, roll, options, attribute = {}) {
  const templateData = {
    actor: actor,
    data: {},
    diceData: formatDice(roll),
  }
  const data = templateData.data
  const targetNumber = game.settings.get('demonlord', 'optionalRuleDieRollsMode') === 'b' ? 11 : 10

  switch (options.mode) {
    case 'corruptionRoll':
      data['header'] = game.i18n.localize('DL.CharRolCorruption')
      data['tagetValueText'] = game.i18n.localize('DL.CharCorruption').toUpperCase()
      data['source'] = 'D20'
      data['targetValue'] = actor.system.characteristics.corruption.value
      data['failureText'] =
        roll.total >= actor.system.characteristics.corruption.value
          ? ''
          : game.i18n.localize('DL.CharRolCorruptionResult')
      data['resultText'] =
        roll.total >= actor.system.characteristics.corruption.value
          ? game.i18n.localize('DL.DiceResultSuccess')
          : game.i18n.localize('DL.DiceResultFailure')
      break
    case 'stunnedRoll':
      data['header'] = game.i18n.localize('DL.ChallengeRollText')
      data['tagetValueText'] = game.i18n.localize('DL.TalentRollTarget')
      data['source'] = game.i18n.localize(CONFIG.DL.attributes[attribute]?.toUpperCase())
      data['targetValue'] = targetNumber
      data['failureText'] = roll.total >= targetNumber ? '' : game.i18n.format('DL.BecomeStunned', { round: 1 })
      data['actionEffects'] = buildAttributeEffectsMessage(actor, attribute, 0, 0)
      data['resultText'] =
        roll.total >= targetNumber
          ? game.i18n.localize('DL.DiceResultSuccess')
          : game.i18n.localize('DL.DiceResultFailure')
      break
    case 'frightenedForRounds':
      {
        let durationRollFormula = actor.system.characteristics.insanity.value
          ? `1d3+${actor.system.characteristics.insanity.value}`
          : `1d3`
        let durationRollFormulaText = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          `[[/r ${durationRollFormula}]]`,
        )
        data['header'] = game.i18n.localize('DL.ChallengeRollText')
        data['tagetValueText'] = game.i18n.localize('DL.TalentRollTarget')
        data['source'] = game.i18n.localize(CONFIG.DL.attributes[attribute]?.toUpperCase())
        data['targetValue'] = targetNumber
        data['failureText'] =
          roll.total >= targetNumber
            ? game.i18n.localize('DL.YouCannotBeEffectedUntilYouCompleteARest')
            : game.i18n.format('DL.BecomeFrightenedForRounds', { round: `${durationRollFormulaText}` })
        data['actionEffects'] = buildAttributeEffectsMessage(actor, attribute, 0, 0)
        data['resultText'] =
          roll.total >= targetNumber
            ? game.i18n.localize('DL.DiceResultSuccess')
            : game.i18n.localize('DL.DiceResultFailure')
      }
      break
    case 'gained1Insanity':
      {
        const isMad =
          actor.system.characteristics.insanity.value + 1 === actor.system.characteristics.insanity.max ? true : false
        data['header'] = game.i18n.localize('DL.ChallengeRollText')
        data['tagetValueText'] = game.i18n.localize('DL.TalentRollTarget')
        data['source'] = game.i18n.localize(CONFIG.DL.attributes[attribute]?.toUpperCase())
        data['targetValue'] = targetNumber
        if (options.legacyMode) {
          data['failureText'] =
            roll.total >= targetNumber
              ? game.i18n.localize('DL.YouCannotBeEffectedUntilYouCompleteARest')
              : isMad
              ? game.i18n.format('DL.GainedInsanityAndGoMad', { insanity: 1 })
              : game.i18n.format('DL.GainedInsanity', { insanity: 1 })
        }
        else
        {
          data['failureText'] =
            roll.total >= targetNumber
              ? game.i18n.format('DL.ImmuneToHorrifyingOneMinute', { creature: options.target.actor.name })
              : isMad
              ? game.i18n.format('DL.GainedInsanityAndGoMad', { insanity: 1 })
              : game.i18n.format('DL.GainedInsanity', { insanity: 1 })
        }
        data['actionEffects'] = buildAttributeEffectsMessage(actor, attribute, 0, 0)
        data['resultText'] =
          roll.total >= targetNumber
            ? game.i18n.localize('DL.DiceResultSuccess')
            : game.i18n.localize('DL.DiceResultFailure')
      }
      break
    case 'plainTextFrightened':
      data['text'] = Math.abs(roll.total === 1)
        ? game.i18n.format('DL.BecomeFrightenedForRound', { round: roll.total })
        : game.i18n.format('DL.BecomeFrightenedForRounds', { round: roll.total })
      break
    case 'gainedInsanity':
      {
        const isMad =
          roll.total + actor.system.characteristics.insanity.value >= actor.system.characteristics.insanity.max
            ? true
            : false
        data['text'] = isMad
          ? game.i18n.format('DL.GainedInsanityAndGoMad', { insanity: roll.total })
          : game.i18n.format('DL.GainedInsanity', { insanity: roll.total })
      }
      break
    case 'fortuneAwarded':
      data['text'] = game.i18n.localize('DL.DialogFortuneAwarded')
      break
    case 'fortuneExpended':
      data['text'] = game.i18n.localize('DL.DialogFortuneExpended')
      break
    case 'horrifying2025':
      {
        data['header'] = game.i18n.localize('DL.ChallengeRollText')
        data['tagetValueText'] = game.i18n.localize('DL.TalentRollTarget')
        data['source'] = game.i18n.localize(CONFIG.DL.attributes[attribute]?.toUpperCase())
        data['targetValue'] = targetNumber

        if (!options.rollFormula) {
          data['failureText'] =
            roll.total >= targetNumber
              ? game.i18n.format('DL.ImmuneToHorrifyingOneMinute', { creature: options.target.actor.name })
              : game.i18n.format('DL.FrightenedYou', { creature: options.target.actor.name })
        } else {
          let insanityRollFormulaText = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
            `[[/r ${options.rollFormula}]]`,
          )
          if (options.legacyMode) {
            data['failureText'] =
              roll.total >= targetNumber
                ? game.i18n.format('DL.YouCannotBeEffectedUntilYouCompleteARest')
                : game.i18n.format('DL.GainedInsanity', { insanity: `${insanityRollFormulaText}` })
          } else {
            data['failureText'] =
              roll.total >= targetNumber
                ? game.i18n.format('DL.ImmuneToHorrifyingOneMinute', { creature: options.target.actor.name })
                : game.i18n.format('DL.GainedInsanity', { insanity: `${insanityRollFormulaText}` })
          }
        }
        data['actionEffects'] = buildAttributeEffectsMessage(actor, attribute, 0, 0)
        data['resultText'] =
          roll.total >= targetNumber
            ? game.i18n.localize('DL.DiceResultSuccess')
            : game.i18n.localize('DL.DiceResultFailure')
      }
      break
  }

  data['actorInfo'] = buildActorInfo(actor)
  const rollMode = game.settings.get('core', 'rollMode')
  const chatData = getChatBaseData(actor, rollMode)
  if (roll) {
    data['diceTotal'] = roll.total
    chatData.rolls = [roll]
    chatData.sound = CONFIG.sounds.dice
  }
  const template = 'systems/demonlord/templates/chat/text.hbs'

  chatData.content = await foundry.applications.handlebars.renderTemplate(template, templateData)
  await ChatMessage.create(chatData)
  if (roll?.total < actor.system.characteristics.corruption.value && options.mode === 'corruptionRoll') {
    const compendiumRollTables = await game.packs.get('demonlord.sotdl-roll-tables').getDocuments()
    const tableMarkOfDarkess = compendiumRollTables.find(i => i.name === 'Mark of Darkness')
    const result = await tableMarkOfDarkess.draw()
    let resultText = result.results[0].name
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

export async function postRestToChat(actor, restTime, magicRecovery, talentRecovery, healing) {
  const templateData = {
    actor: actor,
    data: {},
  }
  const data = templateData.data
  data['actorInfo'] = buildActorInfo(actor)
  data['restTime'] = restTime
  data['magicRecovery'] = magicRecovery
  data['talentRecovery'] = talentRecovery
  data['healing'] = healing

  const rollMode = game.settings.get('core', 'rollMode')
  const chatData = getChatBaseData(actor, rollMode)
  const template = 'systems/demonlord/templates/chat/rest.hbs'
  chatData.content = await foundry.applications.handlebars.renderTemplate(template, templateData)
  await ChatMessage.create(chatData)
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
  const plus20 = attackRoll?.total >= 20 && (targetNumber ? attackRoll?.total > targetNumber + (game.settings.get('demonlord', 'optionalRuleExceedsByFive') ? 5 : 4) : true)

  let resultText =
    !voidRoll && attackRoll != null && targetNumber !== undefined && attackRoll.total >= parseInt(targetNumber)
      ? game.i18n.localize('DL.DiceResultSuccess')
      : game.i18n.localize('DL.DiceResultFailure')

  let diceTotalGM = attackRoll?.total ?? ''
  let diceTotal = diceTotalGM

  const attackShow = game.settings.get('demonlord', 'attackShowAttack')
  if (((actor.type === 'creature' || actor.type === 'vehicle') && !attackShow) || rollMode === 'blindroll') {
    diceTotal = '?'
    // resultText = ''
  }
  const resultBoxClass = voidRoll ? 'FAILURE' : (resultText === '' ? '' : attackRoll?.total >= +targetNumber ? 'SUCCESS' : 'FAILURE')
  const defenseShow = game.settings.get('demonlord', 'attackShowDefense')
  const againstNumber = ((target?.actor?.type === 'character' && target?.actor?.isPC) || defenseShow) && targetNumber ? targetNumber : '?'

  let extraDamage = (actor.system.bonuses.attack.damage.weapon ?? '') + (actor.system.bonuses.attack.damage.all ?? '')
  let extraDamage20Plus = (actor.system.bonuses.attack.plus20Damage.weapon ?? '') + (actor.system.bonuses.attack.plus20Damage.all ?? '')

  if (extraDamage.charAt(0).search(/[0-9]/i) === 0) extraDamage = '+' + extraDamage

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
  if (attackRoll?.total >= targetNumber || targetNumber === undefined || !game.settings.get('demonlord', 'hideDamage'))
  {
    data['damageFormula'] = itemData?.action?.damage
    data['extraDamageFormula'] = extraDamage
    data['damageType'] = itemData.action?.damagetype
    data['damageTypes'] = itemData.action?.damagetypes
    data['damageExtra20PlusFormula'] = itemData.action?.plus20damage + extraDamage20Plus
    data['itemEffects'] = item.effects
  }
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
  data['attackEffects'] = attackRoll !== null ? buildAttackEffectsMessage(actor, target, item, attackAttribute, defenseAttribute, inputBoons, plus20) : ''
  data['armorEffects'] = '' // TODO
  data['afflictionEffects'] = '' //TODO
  data['ifBlindedRoll'] = rollMode === 'blindroll'
  data['hasAreaTarget'] = itemData.activatedEffect?.target?.type in CONFIG.DL.actionAreaShape
  data['actorInfo'] = buildActorInfo(actor)

  const chatData = getChatBaseData(actor, rollMode)
  if (attackRoll) {
    chatData.rolls = [attackRoll]
  }
  const template = 'systems/demonlord/templates/chat/useitem.hbs'
  return foundry.applications.handlebars.renderTemplate(template, templateData).then(content => {
    chatData.content = content
    if (attackRoll != null) {
      chatData.sound = CONFIG.sounds.dice
    }
    ChatMessage.create(chatData)
  })
}

/* -------------------------------------------- */
