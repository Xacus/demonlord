/**
 * Roll initiative for one or multiple Combatants within the Combat entity
 * @param {Array|string} ids        A Combatant id or Array of ids for which to roll
 * @param {string|null} formula     A non-default initiative formula to roll. Otherwise the system default is used.
 * @param {Object} messageOptions   Additional options with which to customize created Chat Messages
 * @return {Promise.<Combat>}       A promise which resolves to the updated Combat entity once updates are complete.
 */
export const rollInitiative = async function (ids, formula, messageOptions) {
  const combatantUpdates = []
  const initMessages = []
  let init = 0
  let turn = ''

  // Structure input data
  ids = typeof ids === 'string' ? [ids] : ids

  // Iterate over Combatants, performing an initiative draw for each
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    // Get Combatant data
    const c = await this.getCombatant(id)

    // Do not roll defeated combatants
    if (c.defeated) continue

    // FAST/SLOW Turn select
    turn = await selectTurnType(c.actor, c.actor.data.data.fastturn)

    if (turn != '') {
      const fastslow = turn == 'fast'
      if (c.actor.data.type == 'character') {
        init = fastslow ? 70 : 30
      } else {
        init = fastslow ? 50 : 10
      }

      await c.actor.update({
        'data.fastturn': fastslow,
      })
    } else {
      if (c.actor.data.type == 'character') {
        init = c.actor.data.data.fastturn ? 70 : 30
      } else {
        init = c.actor.data.data.fastturn ? 50 : 10
      }
    }

    if (game.settings.get('demonlord', 'initRandomize')) {
      init = init + Math.round(Math.random() * 6)
    }

    combatantUpdates.push({
      id: c.id,
      initiative: init,
    })

    var templateData = {
      actor: this.actor,
      item: {
        name: game.i18n.localize('DL.DialogInitiative'),
      },
      data: {
        turn: {
          value: c.actor.data.data.fastturn
            ? game.i18n.localize('DL.DialogTurnFast')
            : game.i18n.localize('DL.DialogTurnSlow'),
        },
      },
    }

    if (game.settings.get('demonlord', 'initMessage')) {
      const template = 'systems/demonlord/templates/chat/init.html'
      renderTemplate(template, templateData).then(content => {
        const messageData = mergeObject(
          {
            speaker: {
              scene: canvas.scene.id,
              actor: c.actor ? c.actor.id : null,
              token: c.token.id,
              alias: c.token.name,
            },
            whisper: c.token.hidden || c.hidden ? game.users.entities.filter(u => u.isGM) : '',
            content: content,
          },
          messageOptions,
        )
        initMessages.push(messageData)
      })
    }
  }

  if (!combatantUpdates.length) return this

  // Update multiple combatants
  //await this.updateEmbeddedDocument('Combatant', combatantUpdates)
  await ChatMessage.create(initMessages)

  return this
}

export const startCombat = async function () {
  for (const combatant of game.combat.combatants) {
    let init = 0

    // if (combatant.name != "End of Round") {
    if (combatant.actor?.data?.type == 'character') {
      init = combatant.actor?.data?.data.fastturn ? 70 : 30
    } else {
      init = combatant.actor?.data?.data.fastturn ? 50 : 10
    }
    /*
        } else {
            init = 1;
        }
        */
    game.combat.setInitiative(combatant.id, init)
  }

  return this.update({
    round: 1,
    turn: 0,
  })
}

/**
 * Advance the combat to the next turn
 * @return {Promise}
 */
export const nextTurn = async function () {
  const turn = this.turn
  const skip = this.settings.skipDefeated
  // Determine the next turn number
  let next = null
  if (skip) {
    for (const [i, t] of this.turns.entries()) {
      if (t.name == 'End of Round') {
        postEndOfRound()
      }

      if (i <= turn) continue
      if (!t.defeated) {
        next = i
        break
      }
    }
  } else next = turn + 1

  // Maybe advance to the next round
  let round = this.round
  if (this.round === 0 || next === null || next >= this.turns.length) {
    round = round + 1
    next = 0
    if (skip) {
      next = this.turns.findIndex(t => !t.defeated)
      if (next === -1) {
        ui.notifications.warn(game.i18n.localize('COMBAT.NoneRemaining'))
        next = 0
      }
    }
  }
  // Update the encounter
  return this.update({ round: round, turn: next })
}

export const setupTurns = function () {
  const scene = game.scenes.get(this.data.scene, {
    strict: true,
  })
  const players = game.users.players

  let turns = this.data.combatants
    .map(c => {
      c.token = scene.items.get(c.tokenId, {
        strict: false,
      })
      if (!c.token) return c
      c.actor = Actor.fromToken(new Token(c.token, scene))
      c.players = c.actor ? players.filter(u => c.actor.hasPerm(u, 'OWNER')) : []
      c.isOwner = game.user.isGM || (c.actor ? c.actor.isOwner : false)
      c.visible = c.isOwner || !c.hidden
      return c
    })
    .filter(c => c.token)

  turns = turns.sort((a, b) => (a.initiative > b.initiative ? -1 : 1))

  // Ensure the current turn is bounded
  this.data.turn = Math.min(turns.length - 1, Math.max(this.data.turn, 0))
  this.turns = turns
  // When turns change, tracked resources also change
  if (ui.combat) ui.combat.updateTrackedResources()
  return this.turns
}

const selectTurnType = async function (actor, fastturn) {
  let turn = ''
  const template = 'systems/demonlord/templates/dialogs/choose-turn-dialog.html'
  const html = await renderTemplate(template, {
    data: {
      fastturn: fastturn,
    },
  })

  return new Promise(resolve => {
    const dialogData = {
      title: `${actor.name}: ${game.i18n.localize('DL.TurnChooseTurn')}`,
      content: html,
      buttons: {
        cancel: {
          icon: '<i class="fas"></i>',
          label: game.i18n.localize('DL.TurnSlow'),
          callback: _ => (turn = 'slow'),
        },
      },
      close: () => resolve(turn),
    }

    if (!actor.data.data.maluses.noFastTurn)
      dialogData.buttons['ok'] = {
        icon: '<i class="fas"></i>',
        label: game.i18n.localize('DL.TurnFast'),
        callback: _ => (turn = 'fast'),
      }
    new Dialog(dialogData).render(true)
  })
}

const postEndOfRound = async function () {
  for (const combatant of game.combat.combatants) {
    if (combatant.actor?.data?.type != 'character') {
      const endofrounds = combatant.actor.getEmbeddedCollection('Item').filter(e => e.type === 'endoftheround')
      for (const endofround of endofrounds) {
        console.log(endofround.name)
      }
    }
  }
}
