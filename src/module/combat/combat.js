export class DLCombat extends Combat {

  /**
   * Returns the appropriate initiative value for the demonlord system
   * @param {Combatant} combatant
   * @param {boolean} isFast      Overrides the combatant's actor selected turn speed
   * @param {number} offset       Adds an offset to the value
   */
  getInitiativeValue(combatant, isFast = undefined, offset = 0) {
    const isPc = combatant.actor.type === 'character'
    isFast = isFast ?? combatant.actor.system.fastturn
    return (isPc * 20) + isFast * 50 + offset
  }

  /**
   * Roll initiative for one or multiple Combatants within the Combat document
   * @param {string|string[]} ids     A Combatant id or Array of ids for which to roll
   * @param {object} [options={}]     Additional options which modify how initiative rolls are created or presented.
   * @param {string|null} [options.formula]         A non-default initiative formula to roll. Otherwise, the system
   *                                                default is used.
   * @param {boolean} [options.updateTurn=true]     Update the Combat turn after adding new initiative scores to
   *                                                keep the turn on the same Combatant.
   * @param {object} [options.messageOptions={}]    Additional options with which to customize created Chat Messages
   * @returns {Promise<Combat>}       A promise which resolves to the updated Combat document once updates are complete.
   */
  // eslint-disable-next-line no-unused-vars
  async rollInitiative(ids, {formula = null, updateTurn = true, messageOptions = {}} = {}) {
    console.log("Calling rollInitiative with", ids, formula, updateTurn, messageOptions)
    // Structure input data
    ids = typeof ids === 'string' ? [ids] : ids
    const currentId = this.combatant?.id;
    const combatantUpdates = []
    const initMessages = []

    // Iterate over Combatants, performing an initiative draw for each
    for await (const id of ids) {
      // Get combatant. Skip if not owner or defeated
      const combatant = this.combatants.get(id)
      if (!combatant?.isOwner || combatant.defeated) continue;

      // Compute value
      const selectedTurnType = await selectTurnType(combatant.actor, combatant.actor.system.fastturn)
      const isFast = selectedTurnType ? selectedTurnType === 'fast' : undefined
      const offset = game.settings.get('demonlord', 'initRandomize') ? Math.round(Math.random() * 6) : 0
      const value = this.getInitiativeValue(combatant, isFast, offset)

      // If turn is selected, also update the actor
      if (selectedTurnType) await combatant.actor.update({'system.fastturn': isFast})

      // Push the update and init message
      combatantUpdates.push({_id: combatant.id, initiative: value})
      initMessages.push(await createInitChatMessage(combatant, messageOptions))
    }

    // Update multiple combatants
    await this.updateEmbeddedDocuments("Combatant", combatantUpdates);

    // Ensure the turn order remains with the same combatant
    if (updateTurn && currentId) {
      await this.update({turn: this.turns.findIndex(t => t.id === currentId)});
    }

    // Create multiple chat messages
    await ChatMessage.implementation.create(initMessages);
    return this;
  }

  /**
   * Begin the combat encounter, advancing to round 1 and turn 1
   * @returns {Promise<Combat>}
   * @override
   */
  async startCombat() {
    this.combatants.forEach(combatant => this.setInitiative(combatant.id, this.getInitiativeValue(combatant)))
    return await this.update({
      round: 1,
      turn: 0,
    })
  }

  /** @override */
  async nextTurn() {
    const _updatedTurn = await super.nextTurn()
    await this._handleTurnEffects()
    return _updatedTurn
  }

  /** @override */
  async previousTurn() {
    const _updatedTurn = await super.previousTurn()
    await this._handleTurnEffects()
    return _updatedTurn
  }

  /** @override */
  async nextRound() {
    const _updatedRound = await super.nextRound()
    await this._handleTurnEffects()
    return _updatedRound
  }

  /** @override */
  async previousRound() {
    const _updatedRound = await super.previousRound()
    await this._handleTurnEffects()
    return _updatedRound
  }


  async _handleTurnEffects() {
    // Disable the effects which have TURN duration
    const actors = this.combatants.map(c => c.actor)
    for (let actor of actors) {
      let updateData = []
      const enabledEffects = actor.effects
      const tempEffects = enabledEffects.filter(e => e.duration?.turns > 0)
      tempEffects.forEach(e => {
        const passedRounds = this.round - e.duration?.startRound
        const isRoundActive = e.duration.rounds !== null
          ? (0 <= passedRounds) && (passedRounds <= e.duration.rounds)
          : true
        const disabled = !isRoundActive || calcEffectRemainingTurn(e, this.turn) <= 0
        if (disabled !== e.disabled)
          updateData.push({_id: e._id, disabled: disabled})
      })
      if (updateData.length) await actor.updateEmbeddedDocuments('ActiveEffect', updateData).then(_ => actor.sheet.render())
    }
    return true
  }
}


// -----------------------------------------------------------------------------------------------

const selectTurnType = async function (actor, fastturn) {
  let turn = ''
  const template = 'systems/demonlord/templates/dialogs/choose-turn-dialog.hbs'
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

    if (!actor.system.maluses.noFastTurn)
      dialogData.buttons['ok'] = {
        icon: '<i class="fas"></i>',
        label: game.i18n.localize('DL.TurnFast'),
        callback: _ => (turn = 'fast'),
      }
    new Dialog(dialogData).render(true)
  })
}

export async function createInitChatMessage(combatant, messageOptions) {
  const c = combatant
  if (!game.settings.get('demonlord', 'initMessage')) return
  var templateData = {
    actor: c.actor,
    item: {
      name: game.i18n.localize('DL.DialogInitiative'),
    },
    data: {
      turn: {
        value: c.actor.system.fastturn
          ? game.i18n.localize('DL.DialogTurnFast')
          : game.i18n.localize('DL.DialogTurnSlow'),
      },
    },
  }

  const template = 'systems/demonlord/templates/chat/init.hbs'
  const content = await renderTemplate(template, templateData)
  return mergeObject(messageOptions, {
    speaker: {
      scene: canvas.scene.id,
      actor: c.actor ? c.actor.id : null,
      token: c.token.id,
      alias: c.token.name,
    },
    whisper: c.token.hidden || c.hidden ? game.users.entities.filter(u => u.isGM) : '',
    content: content,
  })
}

// -----------------------------------------------------------------------------------------------

/**
 * Handles the hook onUpdateWorldTime.
 * The function is used to automatically disable active effects as ROUNDS or SECONDS change
 * @param {number} worldTime  updated world time
 * @param {number} delta      increment of world time
 * @param {Object} _options   unused
 * @param {string} userId     id of the caller
 * @private
 */
export async function _onUpdateWorldTime(worldTime, _delta, _options, _userId) {
  // Automatically disable active effects, based on their start time and duration
  const autoDelete = game.settings.get('demonlord', 'autoDeleteEffects')

  // if (game.userId !== userId) return FIXME: doesn't work currently due to foundry bug (9/9/22)
  // Dirty fix
  const activeGMs = game.users.filter(u => u.isGM && u.active);
  const sortedGMs = activeGMs.sort((a, b) => a.id.localeCompare(b.id));
  if (game.user !== sortedGMs[0]) return;

  // Here we select the actors that are either in the CURRENT SCENE or in the CURRENT COMBAT
  let currentActors
  const inCombat = Boolean(game.combat)
  if (inCombat)
    currentActors = game.combat.combatants.map(c => c.actor)
  else
    currentActors = game.scenes.current.tokens.map(t => t._actor)

  for await (let actor of currentActors) {
    let updateData = []
    let deleteIds = []

    // For each actor, select effects that are enabled and have a duration (either rounds or secs)
    // const enabledEffects = actor.effects.filter(e => !e.disabled && !e.isSuppressed)
    const enabledEffects = actor.effects
    const tempEffects = enabledEffects.filter(e => e.duration?.rounds > 0 || e.duration?.seconds > 0)
    tempEffects.forEach(e => {
      const eType = e.flags?.sourceType
      const isSpell1Round = eType === 'spell' && e.duration.rounds === 1

      // If in combat, handle the duration in rounds, otherwise handle the duration in seconds
      let disabled = false
      if (inCombat)
        disabled = calcEffectRemainingRounds(e, game.combat.round) <= (isSpell1Round ? -1 : 0)
      else
        disabled = calcEffectRemainingSeconds(e, worldTime) <= 0

      // Delete effects that come from spells, characters or afflictions
      if (autoDelete && disabled && ['spell', 'character', 'affliction'].includes(eType))
        deleteIds.push(e._id)
      else if (disabled !== e.disabled)
        updateData.push({_id: e._id, disabled: disabled})
    })

    // Finally, update actor's active effects
    if (deleteIds.length) await actor.deleteEmbeddedDocuments('ActiveEffect', deleteIds)
    if (updateData.length) await actor.updateEmbeddedDocuments('ActiveEffect', updateData).then(_ => actor.sheet.render())
  }
}

// -----------------------------------------------------------------------------------------------

/**
 * Calculates the remaining effect duration in ROUNDS
 * @param {ActiveEffect} e
 * @param {number} currentRound
 * @returns {number}
 */
export function calcEffectRemainingRounds(e, currentRound) {
  const durationRounds = e.duration.rounds || Math.floor(e.duration.seconds / 10) || 0
  const startRound = e.duration.startRound || (currentRound ? 1 : 0)
  const passedRounds = currentRound - startRound
  return durationRounds - passedRounds
}

/**
 * Calculates the remaining effect duration in SECONDS
 * @param {ActiveEffect} e
 * @param {number} currentTime
 * @returns {number}
 */
export function calcEffectRemainingSeconds(e, currentTime) {
  const durationSeconds = e.duration.seconds || e.duration.rounds * 10 || 0
  const startSeconds = e.duration.startTime || e.duration.startRound * 10
  const passedSeconds = currentTime - startSeconds
  return durationSeconds - passedSeconds
}

/**
 * Calculates the remaining effect duration in TURNS
 * @param {ActiveEffect} e
 * @param {number} currentTurn
 * @returns {number}
 */
export function calcEffectRemainingTurn(e, currentTurn) {
  const durationTurns = e.duration.turns || 0
  const startTurn = e.duration.startTurn || 0
  const passedTurns = currentTurn - startTurn
  return durationTurns - passedTurns
}

// -----------------------------------------------------------------------------------------------

// When a combatant is created, get its initiative from the actor
Hooks.on('preCreateCombatant', async (combatant, _data, _options, userId) => {
  if (game.userId !== userId) return
  await combatant.updateSource({initiative: game.combat.getInitiativeValue(combatant)})
})
