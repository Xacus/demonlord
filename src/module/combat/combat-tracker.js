import {DLEndOfRound} from '../dialog/endofround.js'
import {i18n} from "../utils/utils";
import {createInitChatMessage} from "./combat";
import {injectDraggable} from "./combat-tracker-draggable";

export class DLCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {
  constructor(options) {
    super(options)
    this.ENCOUNTERDIFFICULTY = [
    {
      Level: 0,
      Average: 4,
      Challenging: 16,
      Hard: 31,
    },
    {
      Level: 1,
      Average: 8,
      Challenging: 21,
      Hard: 41,
    },
    {
      Level: 2,
      Average: 11,
      Challenging: 31,
      Hard: 51,
    },
    {
      Level: 3,
      Average: 16,
      Challenging: 35,
      Hard: 51,
    },
    {
      Level: 4,
      Average: 21,
      Challenging: 41,
      Hard: 89,
    },
    {
      Level: 5,
      Average: 26,
      Challenging: 46,
      Hard: 109,
    },
    {
      Level: 6,
      Average: 31,
      Challenging: 51,
      Hard: 126,
    },
    {
      Level: 7,
      Average: 36,
      Challenging: 70,
      Hard: 145,
    },
    {
      Level: 8,
      Average: 41,
      Challenging: 89,
      Hard: 164,
    },
    {
      Level: 9,
      Average: 46,
      Challenging: 108,
      Hard: 183,
    },
    {
      Level: 10,
      Average: 51,
      Challenging: 126,
      Hard: 201,
    },
  ]
  this.EASY = 0
  this.AVERAGE = 1
  this.CHALLENGING = 2
  this.HARD = 3
  this.initiativeMethod = game.settings.get('demonlord', 'optionalRuleInitiativeMode')
  this.optionalRuleSurroundingDispositions = game.settings.get('demonlord', 'optionalRuleSurroundingDispositions')
  }

  getActorDifficulty(actor) {
  if (actor.system.difficulty !== undefined) return actor.system.difficulty
  else {
    // DemonLord page 266
    if (actor.system.level === 0) return 1
    else if (actor.system.level === 1 || actor.system.level === 2) return 5
    else if (actor.system.level === 3 || actor.system.level === 4) return 10
    else if (actor.system.level === 5 || actor.system.level === 6) return 25
    else if (actor.system.level === 7 || actor.system.level === 8) return 50
    else if (actor.system.level >= 9) return 100
  }
}

calculateEncounterDifficulty(combatants) {
    let allies = 0
    let enemies = 0
    let difficultyTotal = 0
    let partyLevel = 0
    let encounterDifficulty

    for (let combatant of combatants) {
        if (combatant.token.actor.effects.find(e => e.statuses?.has('dead')) || combatant.actor.type === 'vehicle') continue

        if (combatant.actor.type === 'character' && combatant.actor?.system.isPC) {
            allies++
            partyLevel = combatant.actor.system.level
        } else {
            switch (combatant.token.disposition) {
                case CONST.TOKEN_DISPOSITIONS.HOSTILE:
                    enemies++
                    difficultyTotal = difficultyTotal + this.getActorDifficulty(combatant.actor)
                    break
                case CONST.TOKEN_DISPOSITIONS.FRIENDLY:
                    allies++
                    break
                case CONST.TOKEN_DISPOSITIONS.NEUTRAL:
                    switch (this.optionalRuleSurroundingDispositions) {
                        case 'b':
                            allies++
                            break;
                        case 'n':
                            allies++
                            break;
                        default:
                            enemies++
                            difficultyTotal = difficultyTotal + this.getActorDifficulty(combatant.actor)
                    }
                    break
                case CONST.TOKEN_DISPOSITIONS.SECRET:
                    switch (this.optionalRuleSurroundingDispositions) {
                        case 'b':
                            allies++
                            break;
                        case 's':
                            allies++
                            break;
                        default:
                            enemies++
                            difficultyTotal = difficultyTotal + this.getActorDifficulty(combatant.actor)
                    }
                    break
            }
        }
    }

    let difficulty = deepClone(this.ENCOUNTERDIFFICULTY.find(x => x.Level === partyLevel))

    // Demon Lord page 189
    if (allies !== 4) {
        difficulty.Average = Math.ceil((difficulty.Average * allies) / 4)
        difficulty.Challenging = Math.ceil((difficulty.Challenging * allies) / 4)
        difficulty.Hard = Math.ceil((difficulty.Hard * allies) / 4)
    }

    if (difficultyTotal < difficulty.Average) encounterDifficulty = this.EASY
    else if (difficultyTotal < difficulty.Challenging) encounterDifficulty = this.AVERAGE
    else if (difficultyTotal < difficulty.Hard) encounterDifficulty = this.CHALLENGING
    else if (difficultyTotal >= difficulty.Hard) encounterDifficulty = this.HARD

    // Demon Lord page 189
    if (allies * 2 <= enemies && encounterDifficulty != this.HARD) encounterDifficulty++

    return {
        encounterDifficulty: encounterDifficulty,
        difficultyTotal: difficultyTotal
    }
}

  async getData() {
    const context = await super.getData()
    context.turns.forEach(turn => {
      if (turn.initiative >= 0) {turn.initiative = Math.floor(turn.initiative)} else {turn.initiative = Math.ceil(turn.initiative)}
    })
    return context
  }

  /** @override */
  _onRender(_context, _options) {
    let init
    let hasEndOfRoundEffects = false
    const currentCombat = this.getCurrentCombat()
    const combatants = currentCombat?.combatants
    const html = this.element
    let encounterDifficultyText
    let encounterRating

    if (combatants && game.user.isGM) {
      if (game.settings.get('demonlord', 'showEncounterDifficulty'))
        {
          let encounter = this.calculateEncounterDifficulty(combatants)
          if (encounter.difficultyTotal > 0) {
              const el = html.querySelector(".combat-tracker-header")
              switch (encounter.encounterDifficulty) {
                  case this.EASY:
                      encounterDifficultyText = 'DL.EncounterEasy'
                      encounterRating = "easy"
                      break
                  case this.AVERAGE:
                      encounterDifficultyText = 'DL.EncounterAverage'
                      encounterRating = "average"
                      break
                  case this.CHALLENGING:
                      encounterDifficultyText = 'DL.EncounterChallenging'
                      encounterRating = "challenging"
                      break
                  default:
                      encounterDifficultyText = 'DL.EncounterHard'
                      encounterRating = "hard"
              }
            let difficultyText = game.i18n.localize(encounterDifficultyText)
            el.innerHTML = el.innerHTML + `<div class="encounter-controls combat"><strong class="encounter-difficulty" data-rating="${encounterRating}">${difficultyText} – ${encounter.difficultyTotal}</strong></div>`
        }
      }
    }

    html.querySelectorAll('.combatant')?.forEach(el => {
      // For each combatant in the tracker, change the initiative selector
      const combId = el.getAttribute('data-combatant-id')
      const combatant = combatants.get(combId)
      if (!combatant) return

      init = combatant.actor?.system.fastturn
        ? game.i18n.localize('DL.TurnFast')
        : game.i18n.localize('DL.TurnSlow')

      if (this.initiativeMethod === 's') el.getElementsByClassName('token-initiative')[0].innerHTML =
        `<a class="combatant-control dlturnorder" title="${i18n('DL.TurnChangeTurn')}">${init}</a>`

      if (this.initiativeMethod === 'h' && game.user.isGM)
      {
        let groupID = combatant.flags?.demonlord?.group
        switch (groupID) {
          case 2:
            el.style.borderLeft = "thick solid " + '#009E60' //greenish
            break;
          case 0:
            el.style.borderLeft = "thick solid " + '#FFC300 ' //yellow
            break;
          case 1:
            el.style.borderLeft = "thick solid " + '#005a87'  //blueish
            break;
        }
        if (combatant.actor.system.maluses.noFastTurn) {el.style.borderLeft = "thick solid " + '#f93e3e'}
      }

      // Add Tooltip on Status Effects
      // Group actor effects by image
      const imgEffectMap = new Map()
      combatant.actor?.effects
        .filter(e => e.isTemporary && !e.disabled)
        .forEach(e => {
          if (imgEffectMap.has(e.img)) imgEffectMap.get(e.img).push(e)
          else imgEffectMap.set(e.img, [e])
        })

      // Get effects displayed in the combat tracker and add the relevant data to the html,
      const htmlEffectsCollection = el.getElementsByClassName('token-effects')[0].children

      for (let j = 0; j < htmlEffectsCollection.length; j++) {
        const htmlEffect = htmlEffectsCollection[j]
        const img = htmlEffect.attributes.getNamedItem('src').value
        const match = imgEffectMap.get(img)?.pop()
        if (!match) continue

        let tooltiptext = ': ' + game.i18n.localize('DL.Afflictions' + match.name)
        tooltiptext = tooltiptext.indexOf('DL.Afflictions') === -1 ? tooltiptext : ''
        htmlEffect.outerHTML =
          `<div class="tooltipEffect tracker-effect" data-effect-uuid="${match.uuid}">${htmlEffect.outerHTML}
            <span class="tooltiptextEffect">${match.name}${tooltiptext}</span>
           </div>`
        // htmlEffect.addEventListener('click', ev => (ev.button == "2") ? match.delete() : null)
        // ^ does not work, probably the event gets intercepted
      }

      const endofrounds = combatant.actor?.getEmbeddedCollection('Item')?.filter(e => e.type === 'endoftheround') ?? []
      if (endofrounds.length > 0) hasEndOfRoundEffects = true
    })

    html.querySelectorAll('.tracker-effect').forEach(combatTrackerEffect => 
      combatTrackerEffect.addEventListener('click', async ev => {
      ev.stopPropagation()
      ev.preventDefault()
      if (!game.user.isGM) return
      const effectUUID = ev.currentTarget.attributes.getNamedItem('data-effect-uuid').value
      await fromUuid(effectUUID).then(async effect =>
        effect.statuses ? await effect.delete() : await effect.update({disabled: true})
      )
    }))

    html.querySelectorAll('.dlturnorder').forEach(dlTurnorder => 
      dlTurnorder.addEventListener('click', async ev => {
      ev.stopPropagation()
      ev.preventDefault()
      const li = ev.currentTarget.closest('li')
      const combId = li.dataset.combatantId
      const combatant = combatants.get(combId)
      if (!combatant) return
      
      if (game.user.isGM || combatant.actor.isOwner) {
        await combatant.actor.update({'system.fastturn': !combatant.actor.system.fastturn})
        const initChatMessage = await createInitChatMessage(combatant, {})
        if (initChatMessage) ChatMessage.create(initChatMessage)
      }
    }))

    // Add "End of the Round" to the Combat Tracker
    if (hasEndOfRoundEffects && game.user.isGM) {
      html
        .querySelector('.combat-tracker.plain')
        ?.insertAdjacentHTML('beforeend',
          `<li id="combat-endofround" class="combatant actor directory-item flexrow">
             <img class="token-image" src="systems/demonlord/assets/ui/icons/pentragram.webp"/>
             <div class="token-name flexcol"><strong>${i18n("DL.CreatureSpecialEndRound")}</strong></div>
           </li>`,
        )
    }

    // End of the round click
    html.querySelector('#combat-endofround')?.addEventListener('click', _ev => {
      new DLEndOfRound(this.getCurrentCombat(), {
        top: 50,
        right: 700,
      }).render(true)
    })

    // Draggable
    injectDraggable(html, this)
  }

  getCurrentCombat() {
    return this.viewed
  }
}

export async function _onUpdateCombat(combatData, _updateData, _options, _userId) {
  // TODO: DELETE
  // Do this only if the user is GM to avoid multiple operations
  if (!game.user.isGM && game.user.id !== _userId) return

  const isRoundAdvanced = combatData?.current?.round - combatData?.previous?.round > 0
  const actors = combatData.combatants.map(c => c.actor)

  // Todo: maybe add some memory to remember what has been deactivated in last round?
  for (let actor of actors) {
    // Deactivate temporary talents if the round has advanced.
    // If the round is decreased, there is no way to determine what to activate
    if (isRoundAdvanced) {
      await Promise.all(actor.items
        .filter(i => i.type === 'talent')
        .map(async t => await actor.deactivateTalent(t, 0, true)))
    }
  }
}

