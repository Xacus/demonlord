import {collectBoonSources, escapeSource} from '../rolls/boon-sources'
import {TokenManager} from '../pixi/token-manager'
import {calcEffectRemainingRounds, calcEffectRemainingSeconds} from '../combat/combat.js'
export default async function launchDialog(actor, dialogTitle, callback, withAttributeSelect = false, rollContext = null) {
const tokenManager = new TokenManager()  
const targets = tokenManager.targets
let content = withAttributeSelect ? `
        <div class="challengedialog">
          <select name="defense" id="defense">
            <option value="strength">${game.i18n.localize('DL.AttributeStrength')}</option>
            <option value="agility">${game.i18n.localize('DL.AttributeAgility')}</option>
            <option value="intellect">${game.i18n.localize('DL.AttributeIntellect')}</option>
            <option value="will">${game.i18n.localize('DL.AttributeWill')}</option>
            <option value="perception">${game.i18n.localize('DL.AttributePerception')}</option>
          </select>
          <b>${game.i18n.localize('DL.DialogDefense')}</b>
        </div>
        ` : ''

  content +=`<div class="challengedialog">
              <button type="button" class="num-btn" data-target="boonsbanes" data-delta="-1">−</button>
              <input id='boonsbanes' style='width: 50px;margin: 5px;text-align: center' type='number' value=0 data-dtype='Number'/>
              <button type="button" class="num-btn" data-target="boonsbanes" data-delta="1">+</button>
              <b>${game.i18n.localize('DL.DialogAddBonesAndBanes')}</b>
            </div>
            <div class="challengedialog">
              <button type="button" class="num-btn" data-target="modifier" data-delta="-1">−</button>
              <input id='modifier' style='width: 50px;margin: 5px;text-align: center' type='number' value=0 data-dtype='Number'/>
              <button type="button" class="num-btn" data-target="modifier" data-delta="1">+</button>
              <b>${game.i18n.localize('DL.ModsAdd')}</b>
            </div>`

function prepareReminderHTML(text)
{
  return `<fieldset><div style="color: orange;text-align: center;"><b>${text}</b></div></fieldset>`
}

if (game.settings.get('demonlord', 'launchDialogReminder')) {
  if (targets.length === 1 && (targets[0]?.actor.system.horrifying || targets[0]?.actor.system.frightening)) {
    if (actor.isFrightenedFrom(targets[0]?.actor)) content += `<fieldset><div style="color: orange; text-align: center;"><b>${game.i18n.localize('DL.YouAreAttackingSoureceOfFrightenedAffliction')}</b></div></fieldset>`
    else if (actor.isFearRollCompleted(targets[0]?.actor)) {
      if (game.settings.get('demonlord', 'optionalRuleTraitMode2025'))
        {
        const immuneArray = actor.appliedEffects.filter(x => x.name === game.i18n.format('DL.FearRollAgainst', {
          creature: targets[0].actor.name
        }))
        let effect
        for (const e of immuneArray) {
          if (foundry.utils.getProperty(e, 'flags.demonlord.immuneToActoruuid') === targets[0].actor.uuid) effect = e
        }
        if (game.combat) {
          const remainingRounds = calcEffectRemainingRounds(effect, game.combat.round)
          const immuneText = (remainingRounds === 1) ? game.i18n.localize('DL.FearRollLastsUntilTheEndOfNextRound') : (remainingRounds === 0) ? game.i18n.localize('DL.FearRollLastsUntilTheEndOfTheRound') : game.i18n.format('DL.FearRollLastsRounds', {
            rounds: remainingRounds
          })
          content += prepareReminderHTML(immuneText)
        } else {
          content += prepareReminderHTML(game.i18n.format('DL.FearRollLastsSeconds', {
            seconds: calcEffectRemainingSeconds(effect, game.time.worldTime)
          }))
        }
      }
    }

    const ignoreLevelDependentBane = (game.settings.get('demonlord', 'optionalRuleLevelDependentBane') && ((actor.system?.level >= 3 && actor.system?.level <= 6 && targets[0]?.actor.system?.difficulty <= 25) || (actor.system?.level >= 7 && targets[0]?.actor.system?.difficulty <= 50))) ? false : true
    if (!actor.isFrightenedFrom(targets[0]?.actor) && !actor.isFearRollCompleted(targets[0]?.actor) && !actor.isImmuneToAffliction('frightened') && ignoreLevelDependentBane) {
      if (game.settings.get('demonlord', 'optionalRuleTraitMode2025') && targets[0]?.actor.system.horrifying)
        content += prepareReminderHTML(game.i18n.localize('DL.YouHaventMadeWillChallengeRollAgainstTarget'))
      else if (
        (!game.settings.get('demonlord', 'optionalRuleTraitMode2025') && targets[0]?.actor.system.horrifying) ||
        (!game.settings.get('demonlord', 'optionalRuleTraitMode2025') && targets[0]?.actor.system.frightening)
      )
        content += prepareReminderHTML(game.i18n.localize('DL.YouHaventMadeWillChallengeRollAgainstTarget'))
    }
  }
}

  let displayedSources = []
  const disabled = new Set()
  if (rollContext) content += `<fieldset class="boon-sources"><legend>${game.i18n.localize('DL.ModsListBoonsBanes')}</legend><div class="boon-source-list"></div></fieldset>`
  await foundry.applications.api.DialogV2.wait({
    window: { title: dialogTitle },
    position: { width: 420 },
    content: content,
    buttons: [
      {
        action: 'roll',
        icon: 'fas fa-check',
        label: game.i18n.localize('DL.DialogRoll'),
        default: true,
        callback: (event, button, dialog) => {
          const form = button.form || dialog?.element?.querySelector('form')
          form?.querySelectorAll('[data-boon-source]').forEach(input => {
            if (input.checked) disabled.delete(input.dataset.boonSource)
            else disabled.add(input.dataset.boonSource)
          })
          return callback(event, button, {disabled: Array.from(disabled)})
        },
      },
      {
        action: 'cancel',
        icon: 'fas fa-times',
        label: game.i18n.localize('DL.DialogCancel'),
        //callback: () => { },
      },
    ],
    render: (event, dialog) => {
      const element = dialog.element
      if (rollContext) {
        const refreshSources = () => {
          element.querySelectorAll('[data-boon-source]').forEach(input => {
            if (input.checked) disabled.delete(input.dataset.boonSource)
            else disabled.add(input.dataset.boonSource)
          })
          let attribute = rollContext.attribute || rollContext.item?.system.action?.attack?.toLowerCase()
          if (!attribute && rollContext.category === 'weapon' && game.settings.get('demonlord', 'finesseAutoSelect') && rollContext.item?.system.properties?.toLowerCase().includes('finesse'))
            attribute = actor.system.attributes.strength.value > actor.system.attributes.agility.value ? 'strength' : 'agility'
          const defense = element.querySelector('[name="defense"]')?.value || rollContext.item?.system.action?.against?.toLowerCase()
          const rollTargets = rollContext.targets || []
          const applicable = rollContext.singleTarget && rollTargets.length !== 1 ? [] : rollTargets
          displayedSources = Array.from(new Map((applicable.length ? applicable : [null]).flatMap(target =>
            collectBoonSources(actor, {...rollContext, attribute, defense, target: target?.actor})
          ).map(source => [source.id, source])).values())
          element.querySelector('.boon-source-list').innerHTML = displayedSources.map(source => {
            const label = source.hidden && !game.user.isGM ? game.i18n.localize('DL.OtherUnknown') : source.label
            return `<label style="display:flex;align-items:center;gap:8px"><input type="checkbox" data-boon-source="${escapeSource(source.id)}" ${disabled.has(source.id) ? '' : 'checked'}><span>${source.value > 0 ? '+' : ''}${source.value} ${escapeSource(label)}</span></label>`
          }).join('') || '—'
        }
        refreshSources()
        element.querySelector('[name="defense"]')?.addEventListener('change', refreshSources)
      }
      const buttons = element.querySelectorAll('.num-btn')
      buttons.forEach(btn => {
        btn.onclick = function (e) {
          e.preventDefault()
          e.stopPropagation()

          const targetId = this.dataset.target
          const delta = parseInt(this.dataset.delta)

          const input = element.querySelector(`#${targetId}`)
          if (input) {
            let val = parseInt(input.value) || 0
            input.value = val + delta
          }
        }
      })
    }
  })
}
