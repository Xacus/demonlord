/* -------------------------------------------- */
/* Utils                                        */
/* -------------------------------------------- */

import { DLActiveEffectConfig } from '../active-effects/sheets/active-effect-config'
import { plusify } from '../utils/utils'
import { capitalize } from '../utils/utils'

/**
 * Groups the effects by change key
 * @param effects
 * @returns {Map<string, {string, string, string}>}
 * @private
 */
function _remapEffects(effects) {
  let m = new Map()
  // Active Auras module support
  effects = game.modules.get('ActiveAuras')?.active ? effects.filter(e => !e.flags?.ActiveAuras || foundry.utils.getProperty(e, `flags.ActiveAuras.isAura`) === undefined) : effects
  effects.forEach(effect =>
    effect.changes.forEach(change => {
      const obj = {
        name: effect.name,
        type: effect.flags?.demonlord?.sourceType,
        value: isNaN(change.value) ? change.value : parseInt(change.value),
      }
      if (!m.has(change.key)) m.set(change.key, [obj])
      else m.get(change.key).push(obj)
    }),
  )
  return m
}

/* -------------------------------------------- */

const _toMsg = (label, value) => `&nbsp;&nbsp;&nbsp;&nbsp;• ${value} <i>(${label})</i><br>`

const changeToMsg = (m, key, title, f=plusify) => {
  title = title ? `&nbsp;&nbsp;${game.i18n.localize(title)}<br>` : ''
  if (m.has(key)) return m.get(key).reduce((acc, change) => acc + _toMsg(change.name, f(change.value)), title)
  return ''
}

const changeListToMsg = (m, keys, title, f=plusify) => {
  const changes = []
  title = title ? `&nbsp;&nbsp;${game.i18n.localize(title)}<br>` : ''
  keys.forEach(key => {
    if (m.has(key)) changes.push(m.get(key))
  })

  if (changes.length > 0) return changes.flat(Infinity).reduce((acc, change) => acc + _toMsg(change.name, f(change.value)), title)
  return ''
}

const changeListToMsgDefender = (m, keys, title, anonymize, f = plusify) => {
	// Boon on defender -> Bane on attacker and vice versa
	const changes = []
	title = title ? `&nbsp;&nbsp;${game.i18n.localize(title)}<br>` : ""
	keys.forEach(key => {
		if (m.has(key)) {
			let newChanges = m.get(key)
			newChanges.forEach(item => {
				if (anonymize) {
          if (!(item.name.startsWith(game.i18n.localize('DL.surrounded')) && game.settings.get('demonlord', 'optionalRuleSurroundingRevealChatCard'))) 
					item.name = game.i18n.localize('DL.OtherUnknown') + ` [${game.i18n.localize('DL.ActionTarget')}]`
				} else {
					item.name = item.name + ` [${game.i18n.localize('DL.ActionTarget')}]`
          item.value = item.value * -1
				}
			})
			changes.push(newChanges)
		}
	})

	if (changes.length > 0) return changes.flat(Infinity).reduce((acc, change) => acc + _toMsg(change.name, f(change.value)), title)
	return ""
}

/* -------------------------------------------- */
/* Message builders                             */
/* -------------------------------------------- */

/**
 * Build the effect html for an attack (weapon, talent-vs, spell-attack),
 * based on what has active effects have afflicted the attack
 * @param attacker
 * @param defender
 * @param item
 * @param attackAttribute
 * @param defenseAttribute
 * @returns {*}
 */
export function buildAttackEffectsMessage(attacker, defender, item, attackAttribute, defenseAttribute, inputBoons, plus20, inputModifier) {
  const attackerEffects = Array.from(attacker.allApplicableEffects()).filter(effect => !effect.disabled)
  let m = _remapEffects(attackerEffects)
  const defenderEffects = defender ? Array.from(defender.allApplicableEffects()).filter(effect => !effect.disabled) : []
  let d = _remapEffects(defenderEffects)
  let defenderBoonsArray = [`system.bonuses.defense.boons.${defenseAttribute}`,"system.bonuses.defense.boons.all"]

  const applyHorrifyingBane = attacker.getTargetAttackBane(defender)
  let otherBoons = ''
  let modifiers = ''
  let inputBoonsMsg = inputBoons ? _toMsg(game.i18n.localize('DL.DialogInput'), plusify(inputBoons)) : ''
  let inputModifierMsg = inputModifier ? _toMsg(game.i18n.localize('DL.DialogInput'), plusify(inputModifier)) : ''
  let itemBoons
  let itemRollbonus
  let itemAttributePenalty
  let itemAttributeRequirement

  switch (item.type) {
    case 'spell':
      itemBoons = parseInt(item.system.action.boonsbanes) || 0
      otherBoons = changeToMsg(m, 'system.bonuses.attack.boons.spell', '')
      modifiers = changeToMsg(m, 'system.bonuses.attack.modifier.spell','')
      itemRollbonus =  parseInt(item.system.action.rollbonus) || 0
      defenderBoonsArray.push('system.bonuses.defense.boons.spell')      
      break
    case 'endoftheround':
      itemBoons = parseInt(item.system.action.boonsbanes) || 0
      otherBoons = changeToMsg(m, 'system.bonuses.attack.boons.weapon', '')
      modifiers = changeToMsg(m, 'system.bonuses.attack.modifier.weapon','')
      itemRollbonus =  parseInt(item.system.action.rollbonus) || 0
      defenderBoonsArray.push('system.bonuses.defense.boons.weapon')
      if (item.system.wear && +item.system.requirement?.minvalue > attacker.getAttribute(item.system.requirement?.attribute)?.value)
        {
          itemAttributePenalty = -1
          itemAttributeRequirement = attacker.getAttribute(item.system.requirement?.attribute)?.label + ' ' + game.i18n.localize('DL.Requirement')
        }
      break
    case 'weapon':
      itemBoons = parseInt(item.system.action.boonsbanes) || 0
      otherBoons = changeToMsg(m, 'system.bonuses.attack.boons.weapon', '')
      modifiers = changeToMsg(m, 'system.bonuses.attack.modifier.weapon','')
      itemRollbonus =  parseInt(item.system.action.rollbonus) || 0
      defenderBoonsArray.push('system.bonuses.defense.boons.weapon')
      if (item.system.wear && +item.system.requirement?.minvalue > attacker.getAttribute(item.system.requirement?.attribute)?.value) 
        {
          itemAttributePenalty = -1
          itemAttributeRequirement = attacker.getAttribute(item.system.requirement?.attribute)?.label + ' ' + game.i18n.localize('DL.Requirement')
        }
      break
    case 'talent':
      if (!attackAttribute) break
      itemBoons = parseInt(item.system.action.boonsbanes) || 0
      itemRollbonus =  parseInt(item.system.action.rollbonus) || 0
      break
    case 'attribute':
      // Nothing to do, just continue with chatcard creation
      break
    default:
      return
  }

  let attributeMod = attacker.getAttribute(attackAttribute)?.modifier || 0
  let attributeText = 'DL.Attribute' + capitalize(attackAttribute)
  let attributeModMsg = attributeMod ? _toMsg(`${game.i18n.localize(attributeText)}`, plusify(attributeMod)) : ''

  let revealHorrifyingBane = game.settings.get('demonlord', 'optionalRuleRevealHorrifyingBane')
  let creatureType

  if (!game.settings.get('demonlord', 'optionalRuleTraitMode2025'))
    creatureType = game.i18n.localize('DL.CreatureHorrifying')
  else
    creatureType =
      defender?.system.frightening && defender?.system.horrifying
        ? game.i18n.localize('DL.CreatureHorrifying')
        : defender?.system.frightening
        ? game.i18n.localize('DL.CreatureFrightening')
        : defender?.system.horrifying
        ? game.i18n.localize('DL.CreatureHorrifying')
        : ''

  const horrifyingText = applyHorrifyingBane > 1 ? game.i18n.localize('DL.CanSeeSoureOfAffliction') : `${game.i18n.localize(creatureType)} [${game.i18n.localize('DL.ActionTarget')}]`
  let horrifyingHTMLPlayer = revealHorrifyingBane 
        ? '<div class="gmremove">' + _toMsg(horrifyingText, applyHorrifyingBane*-1) + '</div>'
        : '<div class="gmremove">' + _toMsg(`${game.i18n.localize('DL.OtherUnknown')} [${game.i18n.localize('DL.ActionTarget')}]`, applyHorrifyingBane*-1) + '</div>'

  let horrifyingHTMLGM = '<div class="gmonly">' + _toMsg(horrifyingText, applyHorrifyingBane*-1) + '</div>'

  let gmOnlyResult = changeListToMsgDefender(d, defenderBoonsArray, '', false)
  let playerOnlyResult = changeListToMsgDefender(d, defenderBoonsArray, '', true)
  let gmOnlyMsg = gmOnlyResult ? '<div class="gmonly">' + gmOnlyResult + '</div>' : ''
  let playerOnlyMsg = playerOnlyResult ? '<div class="gmremove">' +  playerOnlyResult + '</div>' : ''
  let boonsMsg =
    (itemBoons ? _toMsg(item.name, plusify(itemBoons)) : '') +
    (itemAttributePenalty ? _toMsg(itemAttributeRequirement, plusify(itemAttributePenalty)) : '') +
    changeListToMsg(m, [`system.bonuses.attack.boons.${attackAttribute}`, "system.bonuses.attack.boons.all"], '') +
    otherBoons +
    (applyHorrifyingBane ? horrifyingHTMLPlayer : '') +
    (applyHorrifyingBane ? horrifyingHTMLGM : '') +
    (playerOnlyMsg ? playerOnlyMsg : '') +
    (gmOnlyMsg ? gmOnlyMsg : '')
  boonsMsg = boonsMsg+inputBoonsMsg ? `&nbsp;&nbsp;${game.i18n.localize('DL.TalentAttackBoonsBanes')}<br>` + boonsMsg+inputBoonsMsg : ''
  
  let modifiersMsg =
    changeListToMsg(m, [`system.bonuses.attack.modifier.${attackAttribute}`,"system.bonuses.attack.modifier.all"], '') +
    modifiers + (itemRollbonus ? _toMsg(item.name, plusify(itemRollbonus)) : '')
  modifiersMsg = attributeModMsg+modifiersMsg+inputModifierMsg ? `&nbsp;&nbsp;${game.i18n.localize('DL.TalentAttackModifiers')}<br>` + attributeModMsg+modifiersMsg+inputModifierMsg : ''

  const extraDamageMsg = item.system.action?.damage ? changeToMsg(m, 'system.bonuses.attack.damage', 'DL.TalentExtraDamage') : ''
  // We may want to show the extra damage
  const extraDamage20PlusMsg = ((!defender && attackAttribute) || plus20) ? changeToMsg(m, 'system.bonuses.attack.plus20Damage', 'DL.TalentExtraDamage20plus') : ''
  return (
    boonsMsg +
    modifiersMsg +
    extraDamageMsg +
    extraDamage20PlusMsg
  )
  // + changeToMsg(m, 'system.bonuses.attack.extraEffect', 'DL.TalentExtraEffect')
}

/* -------------------------------------------- */

/**
 * Builds the effect html for an attribute / challenge roll, based on what active effects have afflicted the roll
 * @param actor
 * @param attribute
 * @returns {string}
 */
export function buildAttributeEffectsMessage(actor, attribute, inputBoons,  inputModifier) {
  const actorEffects = Array.from(actor.allApplicableEffects()).filter(effect => !effect.disabled)
  let m = _remapEffects(actorEffects)
  let inputBoonsMsg = inputBoons ? _toMsg(game.i18n.localize('DL.DialogInput'), plusify(inputBoons)) : ''
  let inputModifierMsg = inputModifier ? _toMsg(game.i18n.localize('DL.DialogInput'), plusify(inputModifier)) : ''
  
  let boonsMsg =
    changeListToMsg(m, [`system.bonuses.challenge.boons.${attribute}`, 'system.bonuses.challenge.boons.all' ], '')

  let attributeMod = actor.getAttribute(attribute)?.modifier || 0
  let attributeText = 'DL.Attribute' + capitalize(attribute)
  let attributeModMsg = attributeMod ? _toMsg(`${game.i18n.localize(attributeText)}`, plusify(attributeMod)) : ''
    
  inputModifierMsg = attributeModMsg+inputModifierMsg ? `&nbsp;&nbsp;${game.i18n.localize('DL.TalentChallengeModifiers')}<br>` + attributeModMsg + inputModifierMsg : ''

  boonsMsg = boonsMsg + inputBoonsMsg ? `&nbsp;&nbsp;${game.i18n.localize('DL.TalentChallengeBoonsBanes')}<br>` + boonsMsg : ''
    
   let result = ''
  result +=  boonsMsg +
  inputBoonsMsg +
  inputModifierMsg

  return result
}

/* -------------------------------------------- */

/**
 * Builds the effect html for a talent. The effect is based on the effects generated from the talent
 * @param actor
 * @param talent
 * @returns {string}
 */
export function buildTalentEffectsMessage(actor, talent) {
  const effects = Array.from(actor.allApplicableEffects()).filter(effect => effect.origin === talent.uuid)

  let m = _remapEffects(effects)
  const get = (key, strLocalization, prefix = '') => {
    const value = m.get(key)?.[0].value
    if (!value) return ''
    const str = strLocalization ? prefix + game.i18n.localize(strLocalization) : prefix
    if (!str) return `&nbsp;&nbsp;&nbsp;• ${value}<br>`
    return `&nbsp;&nbsp;&nbsp;• ${str} (${value})<br>`
  }

  const attackBoonsPrefix = game.i18n.localize('DL.TalentAttackBoonsBanes') + ' '
  const challengeBoonsPrefix = game.i18n.localize('DL.TalentChallengeBoonsBanes') + ' '
  let result =
    get(`system.bonuses.attack.boons.strength`, 'DL.AttributeStrength', attackBoonsPrefix) +
    get(`system.bonuses.attack.boons.agility`, 'DL.AttributeAgility', attackBoonsPrefix) +
    get(`system.bonuses.attack.boons.intellect`, 'DL.AttributeIntellect', attackBoonsPrefix) +
    get(`system.bonuses.attack.boons.will`, 'DL.AttributeWill', attackBoonsPrefix) +
    get(`system.bonuses.attack.boons.perception`, 'DL.AttributePerception', attackBoonsPrefix) +
    get(`system.bonuses.challenge.boons.strength`, 'DL.AttributeStrength', challengeBoonsPrefix) +
    get(`system.bonuses.challenge.boons.agility`, 'DL.AttributeAgility', challengeBoonsPrefix) +
    get(`system.bonuses.challenge.boons.intellect`, 'DL.AttributeIntellect', challengeBoonsPrefix) +
    get(`system.bonuses.challenge.boons.will`, 'DL.AttributeWill', challengeBoonsPrefix) +
    get(`system.bonuses.challenge.boons.perception`, 'DL.AttributePerception', challengeBoonsPrefix) +
    get(`system.bonuses.attack.damage`, 'DL.TalentExtraDamage') +
    get(`system.bonuses.attack.plus20Damage`, 'DL.TalentExtraDamage20plus') +
    get('system.bonuses.attack.extraEffect', 'DL.TalentExtraEffect') +
    get('system.characteristics.defense', 'DL.TalentBonusesDefense') +
    get('system.characteristics.health.max', 'DL.TalentBonusesHealth') +
    get('system.characteristics.speed', 'DL.TalentBonusesSpeed') +
    get('system.characteristics.power', 'DL.TalentBonusesPower')

  return result
}
/* -------------------------------------------- */

export function buildOverview(actor) {
  let m = _remapEffects(Array.from(actor.allApplicableEffects()).filter(e => !e.disabled)) // <changeKey> : [{label, type, value}, ]
  m.delete('')
  const sections = []

  for (const [changeKey, label] of Object.entries(DLActiveEffectConfig._availableChangeKeys)) {
    if (m.has(changeKey)) sections.push({ changeLabel: label, sources: m.get(changeKey) })
  }
  return sections // [{changeLabel, sources}]    sources = {label, type, value}
}
