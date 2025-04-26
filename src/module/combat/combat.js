/* global fromUuidSync */
export class DLCombat extends Combat {

  /**
   * Returns the appropriate initiative value for the demonlord system
   * @param {Combatant} combatant
   * @param {boolean} isFast      Overrides the combatant's actor selected turn speed
   * @param {number} offset       Adds an offset to the value
   */
  getInitiativeValue(combatant, isFast = undefined, offset = 0) {
    const isPc = combatant.actor.system.isPC ?? 0
    isFast = isFast ?? combatant.actor.system.fastturn
    return (isPc * 20) + isFast * 50 + offset
  }

  async rollInitiative(ids, options) {
    switch (game.settings.get('demonlord', 'optionalRuleInitiativeMode')) {
        case "s":
            await this.rollInitiativeStandard(ids, options)
            return this
        case "i":
            await this.rollInitiativeInduvidual(ids, options)
            return this
        case "h":
            await this.rollInitiativeGroup(ids, options)
            return this            
    }
}

// eslint-disable-next-line no-unused-vars
async rollInitiativeInduvidual(ids, {formula = null, updateTurn = true, messageOptions = {}} = {}) {
  console.log("Calling rollInitiativeInduvidual with", ids, formula, updateTurn, messageOptions)
  // Structure input data
  ids = typeof ids === 'string' ? [ids] : ids
  const combatantUpdates = []
  const initMessages = []
  let initValue

  // Iterate over Combatants, performing an initiative draw for each
  for await (const id of ids) {
    // Get combatant. Skip if not owner or defeated
    const combatant = this.combatants.get(id)
    if (!combatant?.isOwner || combatant.defeated) continue;

      let actorMod = combatant.actor.system.attributes.agility.modifier
      var roll
      if (!actorMod) roll = new Roll('1d20')
      else roll = new Roll(`1d20+${actorMod}`)

      await roll.evaluate()
      initValue = roll._total 
      if (initValue>=0) initValue += Math.random()

      // No Fast turn malus -> at the end of the round
      if (combatant.actor.system.maluses.noFastTurn) initValue = -5
      let messageData = foundry.utils.mergeObject(
        {
          speaker: ChatMessage.getSpeaker({
            actor: combatant.actor,
            token: combatant.token,
          }),
          flavor: game.i18n.format('COMBAT.RollsInitiative', {
            name: combatant.name,
          }),
          flags: {
            'core.initiativeRoll': true,
          },
        },
        {},
      )
      const chatData = await roll.toMessage(messageData, {
        create: false,
      })

      chatData.rollMode = combatant.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : CONST.DICE_ROLL_MODES.PUBLIC

      if (game.settings.get('demonlord','initMessage')) await ChatMessage.create(chatData)

    // Push the update and init message
    combatantUpdates.push({ _id: combatant.id, initiative: initValue })
    if (game.settings.get('demonlord', 'initMessage')) initMessages.push(await createInitChatMessage(combatant, messageOptions))
}  

  // Update multiple combatants
  await this.updateEmbeddedDocuments("Combatant", combatantUpdates)
  await this.update({ turn: 0 });
  return this;
}

// eslint-disable-next-line no-unused-vars
async rollInitiativeGroup(ids, { formula = null, updateTurn = true, messageOptions = {} } = {}) {
	console.log("Calling rollInitiativeGroup with", ids, formula, updateTurn, messageOptions)
	// Structure input data
	ids = typeof ids === "string" ? [ids] : ids
	let combatantUpdates = []
	let allCombatantUpdates = []
	const initMessages = []
	let initValue
	let groupInitiative
	let currentGroup

	// Iterate over Combatants, performing an initiative draw for each
	for await (const id of ids) {
		// Get combatant. Skip if not owner or defeated
		const combatant = this.combatants.get(id)
		if (!combatant?.isOwner || combatant.defeated) continue

		let currentInitiative = this.combatants.get(id).initiative
		if (currentInitiative != null) continue
		//Do not overwrite initiative if a combatant already has but not yet updated
		if (allCombatantUpdates.find(x => x._id === id)) continue

		currentGroup = combatant.flags.group
		groupInitiative = game.combat.combatants.find(x => x.flags.group === currentGroup && x.initiative != null)?.initiative

    // Check if a group member already has initative, we do not rull just reuse
		if (!groupInitiative) {
			let roll = new Roll("1d6")
			await roll.evaluate()
			initValue = roll._total
			if (initValue >= 0) initValue += Math.random()

			// Set the initiative all the group members
			const combatantsInGroup = this.combatants.filter(x => x.flags.group === currentGroup)
			for (const c of combatantsInGroup) {
				if (c.actor.system.maluses.noFastTurn)
					combatantUpdates.push({
						_id: c._id,
						initiative: 0
					})
				else
					combatantUpdates.push({
						_id: c._id,
						initiative: initValue
					})
			}

			allCombatantUpdates = allCombatantUpdates.concat(combatantUpdates)
			combatantUpdates = []

			let messageData = foundry.utils.mergeObject(
				{
					speaker: ChatMessage.getSpeaker({
						actor: combatant.actor,
						token: combatant.token
					}),
					flavor: game.i18n.format("COMBAT.RollsInitiative", {
						name: combatant.name
					}),
					flags: {
						"core.initiativeRoll": true
					}
				},
				{}
			)
			const chatData = await roll.toMessage(messageData, {
				create: false
			})

			chatData.rollMode = combatant.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : CONST.DICE_ROLL_MODES.PUBLIC
			if (game.settings.get("demonlord", "initMessage")) await ChatMessage.create(chatData)

			// No Fast turn malus -> at the end of the round
			if (combatant.actor.system.maluses.noFastTurn === 1) initValue = 0
			allCombatantUpdates.push({ _id: combatant.id, initiative: initValue })
			if (game.settings.get("demonlord", "initMessage"))
				initMessages.push(await createInitChatMessage(combatant, messageOptions))
		} else {
      //A group member already has initative, we reuse it
			const combatantsInGroup = this.combatants.filter(x => x.flags.group === currentGroup)
			combatantsInGroup.forEach(c => {
				allCombatantUpdates.push({
					_id: c._id,
					initiative: groupInitiative
				})
			})
		}
	}

	// Update multiple combatants
	await this.updateEmbeddedDocuments("Combatant", allCombatantUpdates)
	await this.update({ turn: 0 })
	return this
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
  async rollInitiativeStandard(ids, {formula = null, updateTurn = true, messageOptions = {}} = {}) {
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
      await this.update({ turn: this.turns.findIndex(t => t.id === currentId) });
    }

    // Create multiple chat messages
    await ChatMessage.implementation.create(initMessages);
    return this;
  }

  /**
   * Begin the combat encounter, advancing to round 1 and turn 0
   * @returns {Promise<Combat>}
   * @override
   */
  async startCombat() {
    if (game.settings.get('demonlord', 'optionalRuleInitiativeMode') === 's') this.combatants.forEach(combatant => this.setInitiative(combatant.id, this.getInitiativeValue(combatant)))
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
    let initiativeMethod = game.settings.get('demonlord', 'optionalRuleInitiativeMode')
    if (initiativeMethod !== 's' &&  game.settings.get('demonlord', 'optionalRuleRollInitEachRound')) {
        await game.combat.resetAll({
            messageOptions: {
                rollMode: CONST.DICE_ROLL_MODES.PRIVATE
            }
        })
    }
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
          : false
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
  return foundry.utils.mergeObject(messageOptions, {
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
  // const activeGMs = game.users.filter(u => u.isGM && u.active);
  // const sortedGMs = activeGMs.sort((a, b) => a.id.localeCompare(b.id));
  if (game.userId !== _userId) return;

  // Here we select the actors that are either in the CURRENT SCENE or in the CURRENT COMBAT
  let currentActors
  const inCombat = Boolean(game.combat)
  if (inCombat)
    currentActors = game.combat.combatants.map(c => c.actor)
  else
    currentActors = game.scenes.current.tokens.map(t => t.actor)

  for await (let actor of currentActors) {
    let updateData = []
    let deleteIds = []

    await deleteSurroundedStatus(actor)

    // For each actor, select effects that are enabled and have a duration (either rounds or secs)
    // const enabledEffects = actor.effects.filter(e => !e.disabled && !e.isSuppressed)
    const enabledEffects = actor.effects
    const tempEffects = enabledEffects.filter(e => e.duration?.rounds > 0 || e.duration?.seconds > 0)
    tempEffects.forEach(e => {
      // Ignore effects with specialDuration
      if (inCombat) {
        let specialDuration = foundry.utils.getProperty(e, 'flags.specialDuration')
        if (specialDuration !== 'None' && specialDuration !== undefined) return
      }
      const eType = e.flags?.sourceType
      const isSpell1Round = eType === 'spell' && e.duration.rounds === 1

      // If in combat, handle the duration in rounds, otherwise handle the duration in seconds
      let disabled = false
      if (inCombat)
        disabled = calcEffectRemainingRounds(e, game.combat.round) <= (isSpell1Round ? -1 : 0)
      else
        disabled = calcEffectRemainingSeconds(e, worldTime) <= 0

      // Delete effects that come from spells, talents, characters or afflictions
      if (autoDelete && disabled && ['spell', 'talent', 'character', 'affliction'].includes(eType))
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
  if (game.settings.get('demonlord', 'optionalRuleInitiativeMode') === 's')
      await combatant.updateSource({initiative: game.combat.getInitiativeValue(combatant)})
    else
      await combatant.updateSource({initiative: null})
})

// Delete Effects with specialDuration
async function deleteSpecialdurationEffects(combatant) {
  let actor = fromUuidSync(`Scene.${combatant.sceneId}.Token.${combatant.tokenId}.Actor.${combatant.actorId}`)
  for (let effect of actor.appliedEffects) {
      const specialDuration = foundry.utils.getProperty(effect, "flags.specialDuration")
      if (!(specialDuration?.length > 0)) continue
      if (specialDuration !== "None" && specialDuration !== undefined && specialDuration !== 'RestComplete') await effect?.delete()
  }
}

// Delete surrounded effects only where duration set
async function deleteSurroundedStatus(combatant) {
  let actor = (combatant instanceof Actor) ? combatant : fromUuidSync(`Scene.${combatant.sceneId}.Token.${combatant.tokenId}.Actor.${combatant.actorId}`)
  let effect = actor.effects.find(e => e.statuses?.has('surrounded') && e.duration.duration !== null)
  await effect?.delete()
}

Hooks.on('deleteCombat', async (combat) => {
	for (let turn of combat.turns) {
		let actor = turn.actor
		if (!actor) continue
		for (let effect of actor.appliedEffects) {
			const specialDuration = foundry.utils.getProperty(effect, "flags.specialDuration")
			if (!(specialDuration?.length > 0)) continue
			if (specialDuration !== "None" && specialDuration !== undefined && specialDuration !== 'RestComplete') await effect?.delete()
		}
    await deleteSurroundedStatus(actor)
	}
})

async function setCombatantGroup(combatant) {
  if (combatant.actor.system.isPC) await combatant.update({flags: {group : 2}})
    else if (combatant.actor.system.isPC === undefined) await combatant.update({flags: {group : 0}})
      else await combatant.update({flags: {group : 1}})
}

async function getNumberOfSurrounders(target, targetSize)
{
  let allyDispositionArray = []
  let optionalRuleSurroundingDispositions = await game.settings.get('demonlord', 'optionalRuleSurroundingDispositions')

  switch (optionalRuleSurroundingDispositions) {
      case 'b':
          allyDispositionArray.push(CONST.TOKEN_DISPOSITIONS.NEUTRAL)
          allyDispositionArray.push(CONST.TOKEN_DISPOSITIONS.SECRET)
          break;
      case 'n':
          allyDispositionArray.push(CONST.TOKEN_DISPOSITIONS.NEUTRAL)
          break;
      case 's':
          allyDispositionArray.push(CONST.TOKEN_DISPOSITIONS.SECRET)
          break;
  }

  let targetDisposition = target.document.disposition

  switch (targetDisposition) {
      case CONST.TOKEN_DISPOSITIONS.HOSTILE:
          allyDispositionArray.push(CONST.TOKEN_DISPOSITIONS.FRIENDLY)
          break;
      case CONST.TOKEN_DISPOSITIONS.FRIENDLY:
          allyDispositionArray.push(CONST.TOKEN_DISPOSITIONS.HOSTILE)
          break;
      default:
          allyDispositionArray.push(CONST.TOKEN_DISPOSITIONS.HOSTILE)
          //allyDispositionArray.push(CONST.TOKEN_DISPOSITIONS.FRIENDLY)
  }
  const tokensInRange = canvas.tokens.placeables.filter(e => (allyDispositionArray.find(x => x === e.document.disposition) !== undefined) && e.id !== target.id && canvas.grid.measurePath([e.center, target.center]).distance <= targetSize).map(e => (e))
  
  let tokensWOAfflictions = 0

  tokensInRange.forEach((token) => {
    if (!token.actor.effects.find(e => e.statuses?.has('unconscious') || e.statuses?.has('stunned') || e.statuses?.has('prone')  || e.statuses?.has('defenseless') ||  e.statuses?.has('dazed')  || e.statuses?.has('compelled'))) tokensWOAfflictions++
  });

  if (game.settings.get('demonlord', 'optionalRuleSurroundingExcludeTokens'))
    return tokensWOAfflictions
  else
    return tokensInRange.length
}

Hooks.on('targetToken', async (user, target, isTargeted) => {
  if (game.userId !== user._id) return
  let optionalRuleSurroundingMode = game.settings.get('demonlord', 'optionalRuleSurroundingMode')
  if (optionalRuleSurroundingMode === 'd' || (optionalRuleSurroundingMode === 'c' && target.document.actor.type !== 'creature')) return
  if (optionalRuleSurroundingMode === 'n' && target.document.actor.system?.isPC) return

  let effects = target.actor?.effects.filter(e => e.statuses?.has('surrounded'))
  if (!isTargeted && effects.length !== 0) {

      if (game.user.isGM)
          await target.actor.deleteEmbeddedDocuments("ActiveEffect", effects.map(e => e.id))
      else
          game.socket.emit('system.demonlord', {
              request: "deleteEffect",
              tokenuuid: target.document.uuid,
              effectData: effects.map(e => e.id)
          })
      return
  }

  let changes = ["weapon"].map(s => ({
      key: `system.bonuses.defense.boons.${s}`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: -1
  }))

  const effectData = {
      changes: changes,
      icon: 'systems/demonlord/assets/icons/effects/surrounded.svg',
      label: 'Surrounded',
      disabled: false,
      description: game.i18n.localize("DL.AfflictionsSurrounded"),
      duration: {
          turns: 1
      },
      statuses: ['surrounded'],
  }

  let targetSize = Math.max(target.document.width, target.document.height)
  let numberOfSurrounders = await getNumberOfSurrounders(target, targetSize)

  if (effects.length === 0 && numberOfSurrounders >= targetSize + 1) {
      if (game.user.isGM)
          await target.actor.createEmbeddedDocuments("ActiveEffect", [effectData])
      else
          game.socket.emit('system.demonlord', {
              request: "createEffect",
              tokenuuid: target.document.uuid,
              effectData: effectData
          })
  }
})


Hooks.on("createCombatant", async combatant => {
	await deleteSpecialdurationEffects(combatant)
	let optionalRuleInitiative = game.settings.get("demonlord", "optionalRuleInitiativeMode")
	if (optionalRuleInitiative === "s") return
  await setCombatantGroup(combatant)
  // Check if a combatant within a group has initiative, if yes new combatant use the same initiative
	let currentGroup = combatant.flags.group
	if (currentGroup !== undefined && game.settings.get("demonlord", "optionalRuleInitiativeMode") === "h") {
		let groupInitiative = game.combat.combatants.find(x => x.flags.group === currentGroup && x.initiative !=null )?.initiative
		if (groupInitiative) await combatant.update({ initiative: groupInitiative })
	}
  // No Fast turn malus -> at the end of the round
	if (combatant.actor.system.maluses.noFastTurn === 1 && game.combat.current.turn !== null)
		switch (optionalRuleInitiative) {
			case "i":
				await combatant.update({ initiative: -5 })
				break
			case "h":
				await combatant.update({ initiative: 0 })
				break
		}
})

Hooks.on('deleteCombatant', async (combatant) => {
          await deleteSpecialdurationEffects(combatant)
          await deleteSurroundedStatus(combatant)
})

Hooks.on('updateCombat', async (combat) => {
  if (!game.users.activeGM?.isSelf) return
  if (combat.current.combatantId === null) return
  // SOURCE type expirations
  for (let turn of combat.turns) {
    let actor = turn.actor
    if (!actor) continue
    for (let effect of actor.appliedEffects) {
      const specialDuration = foundry.utils.getProperty(effect, 'flags.specialDuration')
      if (!(specialDuration?.length > 0)) continue
      if (
        effect.origin?.startsWith(combat.turns.find(x => x._id === combat.previous.combatantId)?.actor.uuid) &&
        specialDuration === 'TurnEndSource'
      ) {
        console.warn(
          `Effect "${effect.name}" deleted on ${actor.name}, reason: ${
            combat.turns.find(x => x._id === combat.previous.combatantId).actor.name
          } ending its turn.`,
        )
        // Do not delete effects which are created in the same turn and round.
        if (game.combat.current.round === effect.duration.startRound && game.combat.current.turn === effect.duration.startTurn+1 || game.combat.current.round === effect.duration.startRound+1 && game.combat.current.turn ===0) continue
        await effect?.delete()
        continue
      }
      if (
        effect.origin?.startsWith(combat.turns.find(x => x._id === combat.current.combatantId).actor.uuid) &&
        specialDuration === 'TurnStartSource'
      ) {
        console.warn(
          `Effect "${effect.name}" deleted on ${actor.name}, reason: ${
            combat.turns.find(x => x._id === combat.current.combatantId).actor.name
          } starting its turn.`,
        )
        await effect?.delete()
        continue
      }
    }
  }

  // TARGET type expirations
  let currentActor = combat.turns.find(x => x._id === combat.current.combatantId).actor
  let previousActor = combat.turns.find(x => x._id === combat.previous.combatantId)?.actor

  for (let effect of currentActor.allApplicableEffects()) {
    const specialDuration = foundry.utils.getProperty(effect, 'flags.specialDuration')
    if (specialDuration?.length > 0) {
      if (specialDuration === 'TurnStart') {
        console.warn(
          `Effect "${effect.name}" deleted on ${currentActor.name}, reason: ${currentActor.name} starting its turn.`,
        )
        await effect?.delete()
        continue
      }
    }
  }

  if (previousActor !== undefined) {
    for (let effect of previousActor.allApplicableEffects()) {
      const specialDuration = foundry.utils.getProperty(effect, 'flags.specialDuration')
      if (specialDuration?.length > 0) {
        if (specialDuration === 'TurnEnd') {
          // Do not delete effects which are created in the same turn and round. PreviousActor startTurn+1!
            if (game.combat.current.round === effect.duration.startRound && game.combat.current.turn === effect.duration.startTurn+1 || game.combat.current.round === effect.duration.startRound+1 && game.combat.current.turn ===0) continue
          console.warn(
            `Effect "${effect.name}" deleted on ${previousActor.name}, reason: ${previousActor.name} ending its turn.`,
          )
          await effect?.delete()
          continue
        }
      }
    }
  }
})