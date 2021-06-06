import { DLEndOfRound } from './dialog/endofround.js'

export default class extends CombatTracker {
  constructor(options) {
    super(options)
  }

  async getData() {
    return await super.getData()
  }

  /** @override */
  activateListeners(html) {
    let init
    let hasEndOfRoundEffects = false
    html.find('.combatant').each((i, el) => {
      const currentCombat = this.getCurrentCombat()

      const combId = el.getAttribute('data-combatant-id')
      const combatant = currentCombat.combatants.find(c => c.id == combId)

      init = combatant.actor?.data?.data?.fastturn
        ? game.i18n.localize('DL.TurnFast')
        : game.i18n.localize('DL.TurnSlow')
      el.getElementsByClassName('token-initiative')[0].innerHTML =
        '<a class="combatant-control dlturnorder" title="' +
        game.i18n.localize('DL.TurnChangeTurn') +
        '">' +
        init +
        '</a>'

      // Tooltip on Status Effects
      // Group actor effects by image
      const imgEffectMap = new Map()
      combatant.actor.effects
        .filter(e => e.isTemporary && !e.data.disabled)
        .forEach(e => {
          if (imgEffectMap.has(e.data.icon)) imgEffectMap.get(e.data.icon).push(e)
          else imgEffectMap.set(e.data.icon, [e])
        })

      // Get effects displayed in the combat tracker and add the relevant data to the html,
      const htmlEffectsCollection = el.getElementsByClassName('token-effects')[0].children

      for (let j = 0; j < htmlEffectsCollection.length; j++) {
        const htmlEffect = htmlEffectsCollection[j]
        const img = htmlEffect.attributes.getNamedItem('src').value
        const match = imgEffectMap.get(img)?.pop()
        if (!match) continue

        let tooltiptext = ': ' + game.i18n.localize('DL.Afflictions' + match.data.label)
        tooltiptext = tooltiptext.indexOf('DL.Afflictions') === -1 ? tooltiptext : ''

        const tooltip = `<div class="tooltipEffect tracker-effect" data-effect-uuid="${match.uuid}">${htmlEffect.outerHTML}<span class="tooltiptextEffect">${match.data.label}${tooltiptext}</span></div>`
        htmlEffect.outerHTML = tooltip
        // htmlEffect.addEventListener('click', ev => (ev.button == "2") ? match.delete() : null)
        // ^ does not work, probably the event gets intercepted
      }

      const endofrounds =
        combatant.actor != null
          ? combatant?.actor.getEmbeddedCollection('Item').filter(e => e.type === 'endoftheround')
          : ''
      if (endofrounds.length > 0) hasEndOfRoundEffects = true
    })

    html.find('.tracker-effect').click(ev => {
      if (!game.user.isGM) return
      const effectUUID = ev.currentTarget.attributes.getNamedItem('data-effect-uuid').value
      fromUuid(effectUUID).then(effect =>
        effect.getFlag('core', 'statusId') ? effect.delete() : effect.update({ disabled: true }),
      )
    })

    super.activateListeners(html)

    html.find('.dlturnorder').click(ev => {
      const li = ev.currentTarget.closest('li')
      const combId = li.dataset.combatantId
      const currentCombat = this.getCurrentCombat()
      const combatant = currentCombat.combatants.find(c => c.id == combId)
      // const initMessages = []

      if (game.user.isGM || combatant.actor.isOwner) {
        if (game.settings.get('demonlord', 'initMessage')) {
          var templateData = {
            actor: combatant.actor,
            item: {
              name: game.i18n.localize('DL.DialogInitiative'),
            },
            data: {
              turn: {
                value: combatant.actor.data?.data?.fastturn
                  ? game.i18n.localize('DL.DialogTurnSlow')
                  : game.i18n.localize('DL.DialogTurnFast'),
              },
            },
          }

          const chatData = {
            user: game.user.id,
            speaker: {
              actor: combatant.actor.id,
              token: combatant.actor.token,
              alias: combatant.actor.name,
            },
          }

          const template = 'systems/demonlord/templates/chat/init.html'
          renderTemplate(template, templateData).then(content => {
            chatData.content = content
            ChatMessage.create(chatData)
          })
        }

        this.updateActorsFastturn(combatant.actor)
      }
    })

    // Add "End of the Round" to the Combat Tracker
    if (hasEndOfRoundEffects && game.user.isGM) {
      html
        .find('#combat-tracker')
        .append(
          '<li id="combat-endofround" class="combatant actor directory-item flexrow"><img class="token-image" title="Hag" src="systems/demonlord/assets/ui/icons/pentragram.webp"/><div class="token-name flexcol"><h4>End of the Round</h4></div></li>',
        )
    }

    html.find('#combat-endofround').click(_ev => {
      new DLEndOfRound(this.getCurrentCombat(), {
        top: 50,
        right: 700,
      }).render(true)
    })
  }

  getCurrentCombat() {
    const combat = this.viewed
    const combats = combat.scene ? game.combats.contents.filter(c => c.data.scene === combat.scene.id) : []
    const currentIdx = combats.findIndex(c => c === this.viewed)
    return combats[currentIdx]
  }

  async updateActorsFastturn(actor) {
    await actor.update({
      'data.fastturn': !actor.data?.data?.fastturn,
    })

    if (game.combat) {
      for (const combatant of game.combat.combatants) {
        let init = 0

        if (combatant.actor == actor) {
          if (actor.data.type == 'character') {
            init = actor.data?.data.fastturn ? 70 : 30
          } else {
            init = actor.data?.data.fastturn ? 50 : 10
          }

          game.combat.setInitiative(combatant.id, init)
        }
      }
    }
  }
}

export function _onUpdateCombat(combatData, _updateData, _options, _userId) {
  // Do this only if the user is GM to avoid multiple operations; FIXME: does not handle multiple GMs
  if (!game.user.isGM) return

  const isRoundAdvanced = combatData?.current?.round - combatData?.previous?.round > 0
  if (isRoundAdvanced) {
    const actors = combatData.data.combatants.map(c => c.actor)
    console.log('combatData')
    // Deactivate temporary talents
    actors.forEach(a => a.items.filter(i => i.data.type === 'talent').forEach(t => a.deactivateTalent(t, 0, true)))
    // Decrease duration of effects
    actors.forEach(a => {
      const aeToUpd = a.effects
        .filter(e => e.data?.duration?.rounds > 0)
        .map(e => ({
          _id: e.id,
          'duration.rounds': e.data.duration.rounds - 1,
        }))
      if (aeToUpd.length > 0) a.updateEmbeddedDocuments('ActiveEffect', aeToUpd)
    })
  }
}
