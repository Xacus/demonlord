export default async function launchDialog(dialogTitle, callback, withAttributeSelect = false) {
  await foundry.applications.api.DialogV2.wait({
    window: { title: dialogTitle },
    position: { width: 420 },
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
