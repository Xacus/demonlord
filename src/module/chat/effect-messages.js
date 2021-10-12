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
    effect.data.changes.forEach(change => {
      const obj = {
        label: effect.data.label,
        type: effect.data.flags?.sourceType,
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

const changeToMsg = (m, key, title) => {
  title = title ? `&nbsp;&nbsp;${game.i18n.localize(title)}<br>` : ''
  if (m.has(key)) return m.get(key).reduce((acc, change) => acc + _toMsg(change.label, change.value), title)
  return ''
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
export function buildAttackEffectsMessage(attacker, defender, item, attackAttribute, defenseAttribute) {
  const attackerEffects = attacker.getEmbeddedCollection('ActiveEffect').filter(effect => !effect.data.disabled)
  let m = _remapEffects(attackerEffects)

  let defenderBoons = defender?.data.data.bonuses.defense.boons[defenseAttribute] || 0
  const defenderString = defender?.name + '  [' + game.i18n.localize('DL.SpellTarget') + ']'

  let itemBoons
  switch (item.data.type) {
    case 'spell':
      itemBoons = item.data.data.action.boonsbanes
      defenderBoons += defender?.data.data.bonuses.defense.boons.spell || 0
      break
    case 'weapon':
      itemBoons = item.data.data.action.boonsbanes
      defenderBoons += defender?.data.data.bonuses.defense.boons.weapon || 0
      if (item.data.data.wear && +item.data.data.strengthmin > attacker.getAttribute('strength').value) itemBoons-- // If the requirements are not met, decrease the boons on the weapon
      break
    case 'talent':
      if (!attackAttribute) return
      itemBoons = item.data.data.vs.boonsbanes
      break
    default:
      return
  }

  let boonsMsg =
    changeToMsg(m, `data.bonuses.attack.boons.${attackAttribute}`, '') +
    (itemBoons != 0 ? _toMsg(item.name, plusify(itemBoons)) : '') +
    (defenderBoons ? _toMsg(defenderString, -defenderBoons) : '')
  boonsMsg = boonsMsg ? `&nbsp;&nbsp;${game.i18n.localize('DL.TalentAttackBoonsBanes')}<br>` + boonsMsg : ''

  return (
    boonsMsg +
    changeToMsg(m, 'data.bonuses.attack.damage', 'DL.TalentExtraDamage') +
    changeToMsg(m, 'data.bonuses.attack.plus20Damage', 'DL.TalentExtraDamage20plus')
  )
  // + changeToMsg(m, 'data.bonuses.attack.extraEffect', 'DL.TalentExtraEffect')
}

/* -------------------------------------------- */

/**
 * Builds the effect html for an attribute / challenge roll, based on what active effects have afflicted the roll
 * @param actor
 * @param attribute
 * @returns {string}
 */
export function buildAttributeEffectsMessage(actor, attribute) {
  const actorEffects = actor?.getEmbeddedCollection('ActiveEffect').filter(effect => !effect.data.disabled)
  let m = _remapEffects(actorEffects)
  let result = ''
  result += changeToMsg(m, `data.bonuses.challenge.boons.${attribute}`, 'DL.TalentChallengeBoonsBanes')
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
  const effects = actor.getEmbeddedCollection('ActiveEffect').filter(effect => effect.data.origin === talent.uuid)

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
    get(`data.bonuses.attack.boons.strength`, 'DL.AttributeStrength', attackBoonsPrefix) +
    get(`data.bonuses.attack.boons.agility`, 'DL.AttributeAgility', attackBoonsPrefix) +
    get(`data.bonuses.attack.boons.intellect`, 'DL.AttributeIntellect', attackBoonsPrefix) +
    get(`data.bonuses.attack.boons.will`, 'DL.AttributeWill', attackBoonsPrefix) +
    get(`data.bonuses.attack.boons.perception`, 'DL.CharPerception', attackBoonsPrefix) +
    get(`data.bonuses.challenge.boons.strength`, 'DL.AttributeStrength', challengeBoonsPrefix) +
    get(`data.bonuses.challenge.boons.agility`, 'DL.AttributeAgility', challengeBoonsPrefix) +
    get(`data.bonuses.challenge.boons.intellect`, 'DL.AttributeIntellect', challengeBoonsPrefix) +
    get(`data.bonuses.challenge.boons.will`, 'DL.AttributeWill', challengeBoonsPrefix) +
    get(`data.bonuses.challenge.boons.perception`, 'DL.CharPerception', challengeBoonsPrefix) +
    get(`data.bonuses.attack.damage`, 'DL.TalentExtraDamage') +
    get(`data.bonuses.attack.plus20Damage`, 'DL.TalentExtraDamage20plus') +
    get('data.bonuses.attack.extraEffect', 'DL.TalentExtraEffect') +
    get('data.characteristics.defense', 'DL.TalentBonusesDefense') +
    get('data.characteristics.health.max', 'DL.TalentBonusesHealth') +
    get('data.characteristics.speed', 'DL.TalentBonusesSpeed') +
    get('data.characteristics.power', 'DL.TalentBonusesPower')

  return result
}
/* -------------------------------------------- */

export function buildOverview(actor) {
  let m = _remapEffects(actor.effects.filter(e => !e.data.disabled)) // <changeKey> : [{label, type, value}, ]
  m.delete('')
  const sections = []

  for (const [changeKey, label] of Object.entries(DLActiveEffectConfig._availableChangeKeys)) {
    if (m.has(changeKey)) sections.push({ changeLabel: label, sources: m.get(changeKey) })
  }
  return sections // [{changeLabel, sources}]    sources = {label, type, value}
}
