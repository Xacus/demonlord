
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

  let applyChanges = false;
  new Dialog({
    title: game.i18n.localize('DL.MacroMakeChallengeRollTitle'),
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
    buttons: {
      yes: {
        icon: "<i class='fas fa-check'></i>",
        label: game.i18n.localize('DL.MacroMakeChallengeRollRoll'),
        callback: () => applyChanges = true
      },
      no: {
        icon: "<i class='fas fa-times'></i>",
        label: game.i18n.localize('DL.MacroCancel')
      },
    },
    default: "yes",
    close: async html => {
      if (applyChanges) {
        let attribute = html.find('[name="attribute-type"]')[0].value || "none";
        let boonsbanes = html.find('[name="boonsbanes"]')[0].value || "none";

        await makeRoll(attribute, boonsbanes);
      }
    }
  }).render(true);
}
