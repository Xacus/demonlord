const { DialogV2 } = foundry.applications.api

export default function launchFrightenedDialog(callback) {
  const d = new DialogV2({
    window: {
      title:  game.i18n.localize('DL.LookOutCreatures'),
    },
    options : { closeOnSubmit: true},
    position: {
      width: 500,
    },
    content: `
  <div class="frighteneddialog">
    <div class="inputContainer">
      <input id='fourOrMore' type='checkbox' data-dtype='Boolean'/>
      <label for='fourOrMore'><b>${game.i18n.localize('DL.FourOrMoreCreatures')}</b></label>
    </div>
  </div>
  `,
    buttons: [
      {
        action: 'f',
        label: game.i18n.localize('DL.CreatureFrightening'),
        callback: html => callback(html, 'f'),
      },
      {
        action: 'h',
        label: game.i18n.localize('DL.CreatureHorrifying'),
        callback: html => callback(html, 'h'),
      },
      {
        action: 'fh',
        label: `${game.i18n.localize('DL.CreatureFrightening')}/${game.i18n.localize('DL.CreatureHorrifying')}`,
        callback: html => callback(html, 'fh'),
      },
    ],
    close: () => {},
  })
  d.render(true)
}