export default async function launchDialog(dialogTitle, callback, withAttributeSelect = false) {
  await foundry.applications.api.DialogV2.wait({
    window: { title: dialogTitle },
    position: { width: 400 },
    content: `
    ${withAttributeSelect ? `
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
      }
    <div class="challengedialog">
    <input id='boonsbanes' style='width: 50px;margin: 5px;text-align: center' type='number' value=0 data-dtype='Number'/>
    <b>${game.i18n.localize('DL.DialogAddBonesAndBanes')}</b>
    </div>
    <div class="challengedialog">
    <input id='modifier' style='width: 50px;margin: 5px;text-align: center' type='number' value=0 data-dtype='Number'/>
    <b>${game.i18n.localize('DL.ModsAdd')}</b>
    </div>`,
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
  })
}
