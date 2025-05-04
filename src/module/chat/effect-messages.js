/* -------------------------------------------- */
/* Utils                                        */
/* -------------------------------------------- */

import { DLActiveEffectConfig } from '../active-effects/sheets/active-effect-config'
import { plusify } from '../utils/utils'

/**
 * Groups the effects by change key
 * @param effects
 * @returns {Map<string, {string, string, string}>}
 * @private
 */
function _remapEffects(effects) {
  let m = new Map()
  effects.forEach(effect =>
    effect.changes.forEach(change => {
      const obj = {
        name: effect.name,
        type: effect.flags?.sourceType,
        value: change.value,
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
export function buildAttackEffectsMessage(attacker, defender, item, attackAttribute, defenseAttribute, inputBoons, plus20) {
  const attackerEffects = Array.from(attacker.allApplicableEffects()).filter(effect => !effect.disabled)
  let m = _remapEffects(attackerEffects)
  const defenderEffects = defender ? Array.from(defender.allApplicableEffects()).filter(effect => !effect.disabled) : []
  let d = _remapEffects(defenderEffects)
  let defenderBoonsArray = [`system.bonuses.defense.boons.${defenseAttribute}`,"system.bonuses.defense.boons.all"]

  const horrifyingBane = game.settings.get('demonlord', 'horrifyingBane')
  const ignoreLevelDependentBane = (game.settings.get('demonlord', 'optionalRuleLevelDependentBane') && ((attacker.system?.level >=3 && attacker.system?.level <=6 && defender?.system?.difficulty <= 25) || (attacker.system?.level >=7 && defender?.system?.difficulty <= 50))) ? false : true
  let applyHorrifyingBane = (horrifyingBane && ignoreLevelDependentBane && !attacker.system.horrifying && !attacker.system.frightening && defender?.system.horrifying && 1 || 0)
  let otherBoons = ''
  let inputBoonsMsg = inputBoons ? _toMsg(game.i18n.localize('DL.DialogInput'), plusify(inputBoons)) : ''
  let itemBoons
  switch (item.type) {
    case 'spell':
      itemBoons = item.system.action.boonsbanes
      otherBoons = changeToMsg(m, 'system.bonuses.attack.boons.spell', '')
      defenderBoonsArray.push('system.bonuses.defense.boons.spell')      
      break
    case 'weapon':
      itemBoons = item.system.action.boonsbanes
      otherBoons = changeToMsg(m, 'system.bonuses.attack.boons.weapon', '')
      defenderBoonsArray.push('system.bonuses.defense.boons.weapon')
      if (item.system.wear && +item.system.requirement?.minvalue > attacker.getAttribute(item.system.requirement?.attribute)?.value) itemBoons-- // If the requirements are not met, decrease the boons on the weapon      
      break
    case 'talent':
      if (!attackAttribute) break
      itemBoons = item.system.action.boonsbanes
      break
    case 'attribute':
      // Nothing to do, just continue with chatcard creation
      break
    default:
      return
  }

  let revealHorrifyingBane = game.settings.get('demonlord', 'optionalRuleRevealHorrifyingBane')
  let horrifyingTextPlayer = revealHorrifyingBane ? '<div class="gmremove">' + _toMsg(`${game.i18n.localize('DL.CreatureHorrifying')} [${game.i18n.localize('DL.ActionTarget')}]`, -1) + '</div>' :  
      '<div class="gmremove">' + _toMsg(`${game.i18n.localize('DL.OtherUnknown')} [${game.i18n.localize('DL.ActionTarget')}]`, -1) + '</div>'

  let horrifyingTextGM =  '<div class="gmonly">' + _toMsg(`${game.i18n.localize('DL.CreatureHorrifying')} [${game.i18n.localize('DL.ActionTarget')}]`, -1) + '</div>'

  let gmOnlyResult = changeListToMsgDefender(d, defenderBoonsArray, '', false)
  let playerOnlyResult = changeListToMsgDefender(d, defenderBoonsArray, '', true)
  let gmOnlyMsg = gmOnlyResult ? '<div class="gmonly">' + gmOnlyResult + '</div>' : ''
  let playerOnlyMsg = playerOnlyResult ? '<div class="gmremove">' +  playerOnlyResult + '</div>' : ''
  let boonsMsg =
    changeListToMsg(m, [`system.bonuses.attack.boons.${attackAttribute}`, "system.bonuses.attack.boons.all"], '') +
    (itemBoons ? _toMsg(item.name, plusify(itemBoons)) : '') +
    otherBoons +
    (applyHorrifyingBane ? horrifyingTextPlayer : '') +
    (applyHorrifyingBane ? horrifyingTextGM : '') +
    (playerOnlyMsg ? playerOnlyMsg : '') +
    (gmOnlyMsg ? gmOnlyMsg : '')
  boonsMsg = boonsMsg ? `&nbsp;&nbsp;${game.i18n.localize('DL.TalentAttackBoonsBanes')}<br>` + boonsMsg : ''

  const extraDamageMsg = item.system.action?.damage ? changeToMsg(m, 'system.bonuses.attack.damage', 'DL.TalentExtraDamage') : ''
  // We may want to show the extra damage
  const extraDamage20PlusMsg = ((!defender && attackAttribute) || plus20) ? changeToMsg(m, 'system.bonuses.attack.plus20Damage', 'DL.TalentExtraDamage20plus') : ''
  return (
    boonsMsg +
    inputBoonsMsg + 
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
export function buildAttributeEffectsMessage(actor, attribute, inputBoons) {
  const actorEffects = Array.from(actor.allApplicableEffects()).filter(effect => !effect.disabled)
  let m = _remapEffects(actorEffects)
  let inputBoonsMsg = inputBoons ? _toMsg(game.i18n.localize('DL.DialogInput'), plusify(inputBoons)) : ''
  let result = ''
  result += changeListToMsg(m, [`system.bonuses.challenge.boons.${attribute}`, 'system.bonuses.challenge.boons.all' ], 'DL.TalentChallengeBoonsBanes') +
  inputBoonsMsg
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
