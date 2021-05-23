export default function launchRollDialog(dialogTitle, callback) {
  const d = new Dialog({
    title: dialogTitle,
    content: `
<div class="challengedialog">
<input id='boonsbanes' style='width: 50px;margin: 5px;text-align: center' type='number' value=0 data-dtype='Number'/>
<b>${game.i18n.localize('DL.DialogAddBonesAndBanes')}</b>
</div>
<div class="challengedialog">
<input id='modifier' style='width: 50px;margin: 5px;text-align: center' type='number' value=0 data-dtype='Number'/>
<b>${game.i18n.localize('DL.ModsAdd')}</b>
</div>
`,
    buttons: {
      roll: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('DL.DialogRoll'),
        callback: callback,
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize('DL.DialogCancel'),
        callback: () => {},
      },
    },
    default: 'roll',
    close: () => {},
  })
  d.render(true)
}
