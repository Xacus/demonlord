/* -------------------------------------------- */
/*  Hotbar Macros                               */

/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export function createDemonlordMacro(data, slot) {
  if (data.type !== 'Item') return
  fromUuid(data.uuid).then(item => _createDemonlordItemMacro(item, slot))
  return false
}

async function _createDemonlordItemMacro(item, slot) {
  if (!item) throw "DEMONLORD | Item not found in macro creation"
  if (item.ownership[game.userId] < CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER && item.parent?.ownership?.[game.userId] < CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER) {
    return ui.notifications.warn('You can only create macro buttons for owned Items')
  }

  // Create the macro command
  let command
  switch (item.type) {
    case 'weapon':
      command =
        '// ' +
        game.i18n.localize('DL.WeaponName') +
        ', ' +
        game.i18n.localize('DL.WeaponBoonsBanes') +
        ', ' +
        game.i18n.localize('DL.WeaponDamageBonus') +
        `\ngame.demonlord.rollWeaponMacro("${item.name}", "0", "")`
      break
    case 'talent':
      command = `// Active = [true/false/], blank = toggle true/false.\ngame.demonlord.rollTalentMacro("${item.name}", "true")`
      break
    case 'spell':
      command = `game.demonlord.rollSpellMacro("${item.name}")`
      break
    default:
      break
  }

  let macro = game.macros.find(m => m.name === item.name && m.command === command)
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: {
        'demonlord.itemMacro': true,
      },
    })
  }
  await game.user.assignHotbarMacro(macro, slot)
}

/**
 * Roll Macro from a Weapon.
 * @param {string} itemName
 * @return {Promise}
 */
export async function rollWeaponMacro(itemName) {
  const speaker = ChatMessage.getSpeaker()
  let actor
  if (speaker.token) actor = game.actors.tokens[speaker.token]
  if (!actor) actor = game.actors.get(speaker.actor)
  const item = actor ? actor.items.find(i => i.name === itemName) : null
  if (!item) {
    return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`)
  }

  return await actor.rollWeaponAttack(item.id) //FIXME: boons banes damage bonus ignored?
}

/**
 * Roll Macro from a Talent.
 * @param {string} itemName
 * @return {Promise}
 */
export async function rollTalentMacro(itemName, state) {
  const speaker = ChatMessage.getSpeaker()
  let actor
  if (speaker.token) actor = game.actors.tokens[speaker.token]
  if (!actor) actor = game.actors.get(speaker.actor)
  const item = actor ? actor.items.find(i => i.name === itemName) : null
  if (!item) {
    return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`)
  }

  switch (state) {
    case 'true':
      actor.rollTalent(item.id)
      break

    case 'false':
      item.system.uses.value = 0
      item.system.addtonextroll = false
      await actor.updateEmbeddedDocuments('Item', item.data)
      break

    case '':
      item.system.addtonextroll = !item.system.addtonextroll
      await actor.updateEmbeddedDocuments('Item', item.data)

      if (item.system.addtonextroll) actor.rollTalent(item.id)
      break

    default:
      actor.rollTalent(item.id)
      break
  }
}

/**
 * Roll Macro from a Spell.
 * @param {string} itemName
 * @return {Promise}
 */
export function rollSpellMacro(itemName) {
  const speaker = ChatMessage.getSpeaker()
  let actor
  if (speaker.token) actor = game.actors.tokens[speaker.token]
  if (!actor) actor = game.actors.get(speaker.actor)
  const item = actor ? actor.items.find(i => i.name === itemName) : null
  if (!item) {
    return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`)
  }

  return actor.rollSpell(item.id)
}

/**
 * Create a Macro from an Attribute.
 * @param {string} attributeName
 * @return {Promise}
 */
export function rollAttributeMacro(attributeName) {
  var selected = canvas.tokens.controlled
  if (selected.length == 0) {
    ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'))
  } else {
    const speaker = ChatMessage.getSpeaker()
    let actor
    if (speaker.token) actor = game.actors.tokens[speaker.token]
    if (!actor) actor = game.actors.get(speaker.actor)
    const attribute = actor ? actor.getAttribute(attributeName) : null

    return actor.rollChallenge(attribute, attributeName)
  }
}

/**
 * Create a Macro from an Attribute.
 */
export async function rollInitMacro() {
  if (!game.combat) return
  const speaker = ChatMessage.getSpeaker()
  let combatantFound = null
  let actor
  if (speaker.token) actor = game.actors.tokens[speaker.token]
  if (!actor) actor = game.actors.get(speaker.actor)

  for (const combatant of game.combat.combatants) {
    if (combatant.actor == actor) {
      combatantFound = combatant
    }
  }

  if (combatantFound) await game.combat.rollInitiative(combatantFound.id)
}

/**
 * Create a Macro for using a Healing Potion.
 */
export async function healingPotionMacro() {
  const speaker = ChatMessage.getSpeaker()
  let actor
  if (speaker.token) actor = game.actors.tokens[speaker.token]
  if (!actor) actor = game.actors.get(speaker.actor)

  if (actor) {
    const currentDamage = parseInt(actor.system.characteristics.health.value)
    const healingRate = parseInt(actor.system.characteristics.health.healingrate)

    let newdamage = currentDamage - healingRate
    if (newdamage < 0) newdamage = 0

    await Actor.updateDocuments({
      'system.characteristics.health.value': newdamage,
    })

    var templateData = {
      actor: this.actor,
      token: canvas.tokens.controlled[0]?.data,
      data: {
        itemname: {
          value: game.i18n.localize('DL.DialogUseItemHealingPotion'),
        },
        description: {
          value: game.i18n.localize('DL.DialogUseItemHealingPotionText').replace('#', healingRate),
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
}
