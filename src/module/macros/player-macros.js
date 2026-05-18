
const { DialogV2 } = foundry.applications.api

export function makeChallengeRollMacro() {
  // Player Tool
// Lets you choose with attributes you want to make challenge roll for and add bones/banes.

  async function makeRoll(attributeName, boonsbanes) {
    var selected = canvas.tokens.controlled;
    if (selected.length === 0) {
      ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'));
    }
    else {
      await Promise.all(selected.forEach(async s => {
        const a = s.actor
        await a.rollAttributeChallenge(a.getAttribute(attributeName), boonsbanes, 0)
      }))
    }
  }

  new DialogV2({
    window: {
      title: game.i18n.localize('DL.MacroMakeChallengeRollTitle'),
    },
    content: `
    <form>
      <div class="form-group">
        <label>` + game.i18n.localize('DL.MacroChallengeChoose') + `</label>
        <select id="attribute-type" name="attribute-type">
          <option value="Strength">` + game.i18n.localize('DL.AttributeStrength') + `</option>
          <option value="Agility">` + game.i18n.localize('DL.AttributeAgility') + `</option>
          <option value="Intellect">` + game.i18n.localize('DL.AttributeIntellect') + `</option>
          <option value="Will">` + game.i18n.localize('DL.AttributeWill') + `</option>
          <option value="Perception">` + game.i18n.localize('DL.AttributePerception') + `</option>
        </select>
      </div>
      <div class="form-group">
        <label>` + game.i18n.localize('DL.WeaponBoonsBanes') + `:</label>
        <input type="text" name="boonsbanes" value="0"/>
      </div>
    </form>
    `,
    buttons: [
      {
        action: 'yes',
        icon: 'fas fa-check',
        label: game.i18n.localize('DL.MacroMakeChallengeRollRoll'),
        callback: (event, button, dialog) => dialog.element,
        default: true
      },
      {
        action: 'no',
        icon: 'fas fa-times',
        label: game.i18n.localize('DL.MacroCancel'),
        callback: () => close()
      },
    ],
    submit: async result => {
      let attribute = result.querySelector('[name="attribute-type"]').value || "none";
      let boonsbanes = result.querySelector('[name="boonsbanes"]').value || "none";

      await makeRoll(attribute, boonsbanes);
    }
  }).render(true);
}
