/* globals fromUuidSync */
/* -------------------------------------------- */
/*  Chat methods                                */
/* -------------------------------------------- */

import {buildActorInfo, formatDice, getChatBaseData} from './base-messages'
import {TokenManager} from '../pixi/token-manager'
import {DLAfflictions} from '../active-effects/afflictions'
import { changesMatch } from '../utils/chat'

const tokenManager = new TokenManager()

export function initChatListeners(html) {
  html.on('click', '.roll-healing', _onChatApplyHealing.bind(this))
  html.on('click', '.roll-damage', _onChatRollDamage.bind(this))
  html.on('click', '.apply-damage', _onChatApplyDamage.bind(this))
  html.on('click', '.apply-effect', _onChatApplyEffect.bind(this))
  html.on('click', '.use-talent', _onChatUseTalent.bind(this))
  html.on('click', '.place-template', _onChatPlaceTemplate.bind(this))
  html.on('click', '.request-challengeroll', _onChatRequestChallengeRoll.bind(this))
  html.on('click', '.make-challengeroll', _onChatMakeChallengeRoll.bind(this))
  html.on('click', '.request-initroll', _onChatRequestInitRoll.bind(this))
  html.on('click', '.make-initroll', _onChatMakeInitRoll.bind(this))
}

/* -------------------------------------------- */

async function _onChatApplyHealing(event) {
  event.preventDefault()
  const li = event.currentTarget
  const item = li.children[0]
  const isFullRate = +item.dataset.healing === 1

  const selected = tokenManager.targets
  if (selected.length === 0) {
    ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'))
    return
  }

  await Promise.all(selected.map(async token => await token.actor.applyHealing(isFullRate)))

  const actor = _getChatCardActor(li.closest('.demonlord'))
  const sourceToken = tokenManager.getTokenByActorId(actor.id)
  const itemId = li.closest('.demonlord').dataset.itemId
  Hooks.call('DL.ApplyHealing', {
    sourceToken,
    targets: selected,
    itemId,
  })
}

/* -------------------------------------------- */

async function _onChatRollDamage(event) {
  event.preventDefault()
  const rollMode = game.settings.get('core', 'rollMode')
  const li = event.currentTarget
  const token = li.closest('.demonlord')
  const actor = _getChatCardActor(token)

  const appliedEffects = tokenManager.getTokenByActorId(actor.id)?.actor?.appliedEffects
  
  if (appliedEffects?.length) {
    for (let effect of appliedEffects) {
      const specialDuration = foundry.utils.getProperty(effect, 'flags.specialDuration')
      if (specialDuration === 'NextDamageRoll') await effect?.delete()
    }
  }

  const item = li.children[0]
  var damageformula = item.dataset.damage
  const damagetype = item.dataset.damagetype
  const selected = tokenManager.targets
  const itemId = item.dataset.itemId || li.closest('.demonlord').dataset.itemId

  if (game.settings.get('demonlord', 'optinalRuleConsistentDamage')) {
    var flattenTree = function(root) {
      const list = []

      var flattenNode = function (node) {
        if (node.class !== 'Node') {
          list.push(node)
          return
        }

        const [left, right] = node.operands
        flattenNode(left)
        list.push({
          class: 'OperatorTerm',
          operator: node.operator,
          evaluated: false,
        })
        flattenNode(right)
      }

      flattenNode(root)
      return list
    }

    let tree = foundry.dice.RollGrammar.parse(damageformula)
    let rollFlattened = flattenTree(tree)
    let damageFormulaNew = ''
    let nrDie
    let remainder
    let result

    for (const element of rollFlattened) {
      switch (element.class) {
        case 'DiceTerm':
          switch (element.formula) {
            case '1d3':
              damageFormulaNew += '2'
              break
            case '2d3':
              damageFormulaNew += '4'
              break
            case '1d6':
              damageFormulaNew += '3'
              break
            case '2d6':
              damageFormulaNew += '7'
              break
            default:
              nrDie = Array.from(element.formula)[0]
              remainder = nrDie % 2
              result = Math.floor(nrDie / 2)
              for (let i = 0; i < result; i++) {
                if (i) damageFormulaNew += '+7'
                else {
                  damageFormulaNew += '7'
                }
              }
              if (remainder) damageFormulaNew += '+3'
          }
          break
        case 'OperatorTerm':
          damageFormulaNew += element.operator
          break
        case 'NumericTerm':
          damageFormulaNew += element.number
          break
      }
    }

    damageformula = damageFormulaNew
  }

  const damageRoll = new Roll(damageformula, actor.system)
  await damageRoll.evaluate()

  let totalDamage = ''
  let totalDamageGM = ''
  if (['blindroll'].includes(rollMode)) {
    totalDamage = '?'
    totalDamageGM = damageRoll.total
  } else {
    totalDamage = damageRoll.total
  }

  var templateData = {
    actor: actor,
    item: {
      id: itemId,
    },
    data: {},
    diceData: formatDice(damageRoll),
  }
  templateData.data['damageTotal'] = totalDamage
  templateData.data['damageTotalGM'] = totalDamageGM
  templateData.data['damageDouble'] = +damageRoll.total * 2
  templateData.data['damageHalf'] = Math.floor(+damageRoll.total / 2)
  templateData.data['damagetype'] = damagetype
  templateData.data['isCreature'] = actor.type === 'creature'
  templateData.data['actorInfo'] = buildActorInfo(actor)

  const chatData = getChatBaseData(actor, rollMode)
  if (damageRoll) {
    chatData.rolls = [damageRoll]
  }
  const template = 'systems/demonlord/templates/chat/damage.hbs'
  renderTemplate(template, templateData).then(content => {
    chatData.content = content
    chatData.sound = CONFIG.sounds.dice
    ChatMessage.create(chatData)
  })
  Hooks.call('DL.RollDamage', {
    sourceToken: tokenManager.getTokenByActorId(actor.id),
    targets: selected,
    itemId,
  })
}

/* -------------------------------------------- */

async function _onChatApplyDamage(event) {
  event.preventDefault()
  const li = event.currentTarget
  const item = li.children[0]
  const damage = parseInt(item.dataset.damage)

  var selected = tokenManager.targets
  if (selected.length == 0) {
    ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'))
    return
  }

  await Promise.all(selected.map(async token => await token.actor.increaseDamage(+damage)))

  const actor = _getChatCardActor(li.closest('.demonlord'))
  const sourceToken = tokenManager.getTokenByActorId(actor.id)
  const itemId = li.closest('.demonlord').dataset.itemId
  Hooks.call('DL.ApplyDamage', {
    sourceToken,
    targets: selected,
    itemId,
    damage,
  })
}

/* -------------------------------------------- */

async function _onChatApplyEffect(event) {
  event.preventDefault()
  const htmlTarget = event.currentTarget
  const effectUuid = htmlTarget.attributes.getNamedItem('data-effect-uuid').value
  const activeEffect = await fromUuid(effectUuid)

  if (!activeEffect) {
    console.warn('Demonlord | _onChatApplyEffect | Effect not found!')
    return
  }
  const selected = tokenManager.targets
  if (selected.length === 0) {
    tokenManager.warnNotSelected()
    return
  }

  const effectData = activeEffect.toObject()
  //Repace origin with Item UUID, otherwise effect cannot be removed
  //specialDuration: TurnStartSource, TurnEndSource

  let aeUuid = activeEffect.uuid
  let effectOrigin = aeUuid.substr(0, aeUuid.search('.ActiveEffect.'))
  let effectOriginName = fromUuidSync(effectOrigin).name
  if (activeEffect.origin.startsWith('Compendium')) {
    effectData.origin = effectOrigin
  }
  if (effectData.name !== effectOriginName)  effectData.name = `${effectData.name} [${effectOriginName}]`  
  
  for await (const target of selected) {
    // First check if the actor already has this effect
    const matchingEffects = target.actor.effects.filter(e => e.name === effectData.name && changesMatch(e.changes, effectData.changes))

    if (matchingEffects.length > 0) {
      // Delete all matching effects
      for await (const e of matchingEffects) {
        await e.delete()
      }
    }

    await ActiveEffect.create(effectData, {parent: target.actor}).then(e => ui.notifications.info(`Added "${e.name}" to "${target.actor.name}"`))
  }
}

/* -------------------------------------------- */

async function _onChatUseTalent(event) {
  const token = event.currentTarget.closest('.demonlord')
  const actor = _getChatCardActor(token)
  if (!actor) return

  const div = event.currentTarget.children[0]
  const talentId = div.dataset.itemId
  actor.rollTalent(talentId)
}

/* -------------------------------------------- */

async function _onChatRequestChallengeRoll(event) {
  event.preventDefault()
  const li = event.currentTarget
  const item = li.children[0]
  const attribute = item.dataset.attribute

  const start = li.closest('.request-challengeroll')
  let boonsbanes = start.children[0].value
  if (boonsbanes == undefined) boonsbanes = parseInt(item.dataset.boba)
  if (isNaN(boonsbanes)) boonsbanes = 0

  var selected = tokenManager.targets
  if (selected.length == 0) {
    ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'))
  }

  let boonsbanestext = ''
  if (boonsbanes == 1) {
    boonsbanestext = boonsbanes + ' ' + game.i18n.localize('DL.DialogBoon')
  }
  if (boonsbanes > 1) {
    boonsbanestext = boonsbanes + ' ' + game.i18n.localize('DL.DialogBoons')
  }
  if (boonsbanes == -1) {
    boonsbanestext = boonsbanes.toString().replace('-', '') + ' ' + game.i18n.localize('DL.DialogBane')
  }
  if (boonsbanes < -1) {
    boonsbanestext = boonsbanes.toString().replace('-', '') + ' ' + game.i18n.localize('DL.DialogBanes')
  }

  selected.forEach(token => {
    const actor = token.actor

    var templateData = {
      actor: actor,
      data: {
        attribute: {
          value: game.i18n.localize(CONFIG.DL.attributes[attribute.toLowerCase()]),
        },
        boonsbanes: {
          value: boonsbanes,
        },
        boonsbanestext: {
          value: boonsbanestext,
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

    chatData.whisper = ChatMessage.getWhisperRecipients(actor.name)

    const template = 'systems/demonlord/templates/chat/makechallengeroll.hbs'
    renderTemplate(template, templateData).then(content => {
      chatData.content = content

      ChatMessage.create(chatData)
    })
  })
}

/* -------------------------------------------- */

async function _onChatMakeChallengeRoll(event) {
  event.preventDefault()
  const li = event.currentTarget
  const item = li.children[0]
  const attributeName = item.dataset.attribute
  const boonsbanes = item.dataset.boonsbanes
  const actorId = item.dataset.actorid
  const actor = game.actors.get(actorId)
  const attribute = actor.getAttribute(attributeName)
  const start = li.closest('.demonlord')
  const boonsbanesEntered = start.children[1].children[0].children[0].children[1]?.value

  if (!DLAfflictions.isActorBlocked(actor, 'challenge', attributeName)) {
    await actor.rollAttribute(attribute, parseInt(boonsbanes) + parseInt(boonsbanesEntered), 0)
  }
}

/* -------------------------------------------- */

async function _onChatRequestInitRoll(event) {
  event.preventDefault()

  var selected = tokenManager.targets
  if (selected.length == 0) {
    ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'))
  }

  selected.forEach(token => {
    const actor = token.actor

    var templateData = {
      actor: actor,
      token: canvas.tokens.controlled[0]?.data,
      data: {},
    }

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: actor.id,
        token: actor.token,
        alias: actor.name,
      },
    }

    chatData.whisper = ChatMessage.getWhisperRecipients(actor.name)

    const template = 'systems/demonlord/templates/chat/makeinitroll.hbs'
    renderTemplate(template, templateData).then(async content => {
      chatData.content = content
      await ChatMessage.create(chatData)
    })
  })
}

/* -------------------------------------------- */

async function _onChatMakeInitRoll(event) {
  event.preventDefault()
  const li = event.currentTarget
  const item = li.children[0]
  const actorId = item.dataset.actorid
  const actor = game.actors.get(actorId)
  let combatantFound = null

  for (const combatant of game.combat.combatants) {
    if (combatant.actor?._id === actor._id) {
      combatantFound = combatant
    }
  }

  if (combatantFound) {
    await game.combat.rollInitiative(combatantFound._id)
  }
}

/* -------------------------------------------- */

/**
 * Get the Actor which is the author of a chat card
 * @param {HTMLElement} card    The chat card being used
 * @return {Actor|null}         The Actor entity or null
 * @private
 */
function _getChatCardActor(card) {
  // Case 1 - a synthetic actor from a Token
  const tokenKey = card.dataset.tokenId
  if (tokenKey) {
    const [sceneId, tokenId] = tokenKey.split('.')
    const scene = game.scenes.get(sceneId)
    if (!scene) return null
    const tokenData = scene.items.get(tokenId)
    if (!tokenData) return null
    const token = new Token(tokenData)
    return token.actor
  }

  // Case 2 - use Actor ID directory
  const actorId = card.dataset.actorId
  return game.actors.get(actorId) || null
}

/* -------------------------------------------- */

/**
 * Get the Actor which is the target of a chat card
 * @param {HTMLElement} _card    The chat card being used
 * @return {Array.<Actor>}      An Array of Actor entities, if any
 * @private
 */
// eslint-disable-next-line no-unused-vars
function _getChatCardTargets(_card) {
  const character = game.user.character
  const controlled = canvas.tokens.controlled
  const targets = controlled.reduce((arr, t) => (t.actor ? arr.concat([t.actor]) : arr), [])
  if (character && controlled.length === 0) targets.push(character)
  return targets
}

/* -------------------------------------------- */

async function _onChatPlaceTemplate(event) {
  event.preventDefault()
  const itemUuid = $(event.currentTarget).data('itemUuid')
  const item = await fromUuid(itemUuid)

  const template = game.demonlord.canvas.ActionTemplate.fromItem(item)
  if (template) {
    template.drawPreview()
  }
}

/* -------------------------------------------- */
