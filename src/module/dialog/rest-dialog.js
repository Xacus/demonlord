export default function launchRestDialog(dialogTitle, callback) {
    const d = new Dialog({
      title: dialogTitle,
      content: `
  <div class="restdialog">
    <div class="inputContainer">
      <input id='noTalentRecovery' type='checkbox' data-dtype='Boolean'/>
      <label for='noTalentRecovery'><b>${game.i18n.localize('DL.DialogRestNoTalent')}</b></label>
    </div>
    <div class="inputContainer">
      <input id='noMagicRecovery' type='checkbox' data-dtype='Boolean'/>
      <label for='noMagicRecovery'><b>${game.i18n.localize('DL.DialogRestNoMagic')}</b></label>
    </div>
    <div class="inputContainer">
      <input id='noHealing' type='checkbox' data-dtype='Boolean'/>
      <label for='noHealing'><b>${game.i18n.localize('DL.DialogRestNoHealing')}</b></label>
    </div>
  </div>
  `,
      buttons: {
        rest8h: {
          label: game.i18n.localize('DL.DialogRest8hrs'),
          callback: html => callback(html, 8),
        },
        rest24h: {
          label: game.i18n.localize('DL.DialogRest24hrs'),
          callback: html => callback(html, 24),
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('DL.DialogCancel'),
          callback: () => {},
        },
      },
      default: 'rest8h',
      close: () => {},
    })
    d.render(true)
  }