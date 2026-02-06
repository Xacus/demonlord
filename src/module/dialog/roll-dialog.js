import {TokenManager} from '../pixi/token-manager'
import {calcEffectRemainingRounds, calcEffectRemainingSeconds} from '../combat/combat.js'
export default async function launchDialog(actor, dialogTitle, callback, withAttributeSelect = false) {
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
    else if (actor.isImmuneToTarget(targets[0]?.actor)) {
      if (!game.settings.get('demonlord', 'optionalRuleTraitMode2025')) content += prepareReminderHTML(game.i18n.localize('DL.YouCannotBeAffectedUntilYouCompleteARest'))
      else {
        const immuneArray = actor.appliedEffects.filter(x => x.name === game.i18n.format('DL.ImmuneToTarget', {
          creature: targets[0].actor.name
        }))
        let effect
        for (const e of immuneArray) {
          if (foundry.utils.getProperty(e, 'flags.demonlord.immuneToActoruuid') === targets[0].actor.uuid) effect = e
        }
        if (game.combat) {
          const remainingRounds = calcEffectRemainingRounds(effect, game.combat.round)
          const immuneText = (remainingRounds === 1) ? game.i18n.localize('DL.ImmunityLastsUntilTheEndOfNextRound') : (remainingRounds === 0) ? game.i18n.localize('DL.ImmunityLastsUntilTheEndOfTheRound') : game.i18n.format('DL.ImmunityLastsRounds', {
            rounds: remainingRounds
          })
          content += prepareReminderHTML(immuneText)
        } else {
          content += prepareReminderHTML(game.i18n.format('DL.ImmunityLastsSeconds', {
            seconds: calcEffectRemainingSeconds(effect, game.time.worldTime)
          }))
        }
      }
    }

    const ignoreLevelDependentBane = (game.settings.get('demonlord', 'optionalRuleLevelDependentBane') && ((actor.system?.level >= 3 && actor.system?.level <= 6 && targets[0]?.actor.system?.difficulty <= 25) || (actor.system?.level >= 7 && targets[0]?.actor.system?.difficulty <= 50))) ? false : true
    if (!actor.isFrightenedFrom(targets[0]?.actor) && !actor.isImmuneToTarget(targets[0]?.actor) && !actor.isImmuneToAffliction('frightened') && ignoreLevelDependentBane) {
      if (game.settings.get('demonlord', 'optionalRuleTraitMode2025') && targets[0]?.actor.isHorrifying) content += prepareReminderHTML(game.i18n.localize('DL.YouHaventMadeWillChallengeRollAgainstTarget'))
      else if (!game.settings.get('demonlord', 'optionalRuleTraitMode2025') && (targets[0]?.actor.isHorrifying || targets[0]?.actor.isFrightening)) content += prepareReminderHTML(game.i18n.localize('DL.YouHaventMadeWillChallengeRollAgainstTarget'))
    }
  }
}

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
        callback: callback,
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
