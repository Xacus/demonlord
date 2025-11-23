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
    ` : ""}
    <div class="challengedialog" style="display:flex;align-items:center;gap:4px;">
      <button type="button" class="num-btn" data-target="boonsbanes" data-delta="-1">−</button>
      <input id="boonsbanes" style="width:50px;text-align:center" type="number" value="0" data-dtype="Number"/>
      <button type="button" class="num-btn" data-target="boonsbanes" data-delta="1">+</button>
      <b style="margin-left:6px;">${game.i18n.localize('DL.DialogAddBonesAndBanes')}</b>
    </div>
    <div class="challengedialog" style="display:flex;align-items:center;gap:4px;">
      <button type="button" class="num-btn" data-target="modifier" data-delta="-1">−</button>
      <input id="modifier" style="width:50px;text-align:center" type="number" value="0" data-dtype="Number"/>
      <button type="button" class="num-btn" data-target="modifier" data-delta="1">+</button>
      <b style="margin-left:6px;">${game.i18n.localize('DL.ModsAdd')}</b>
    </div>
    `,
    buttons: [
      {
        action: "roll",
        icon: "fas fa-check",
        label: game.i18n.localize("DL.DialogRoll"),
        default: true,
        callback
      },
      {
        action: "cancel",
        icon: "fas fa-times",
        label: game.i18n.localize("DL.DialogCancel")
      }
    ],
    render: (event, dialog) => {
      setTimeout(() => {
        try {
          const element = dialog.element;  // Usa directamente el elemento del diálogo (nativo en v13)
          if (!element) {
            console.warn("No se encontró elemento del diálogo");
            return;
          }

          const buttons = element.querySelectorAll(".num-btn");
          console.log(`Encontrados ${buttons.length} botones`);

          buttons.forEach((btn, idx) => {
            btn.onclick = function (e) {
              e.preventDefault();
              e.stopPropagation();

              const targetId = this.dataset.target;
              const delta = parseInt(this.dataset.delta);

              const input = element.querySelector(`#${targetId}`);
              if (input) {
                let val = parseInt(input.value) || 0;
                input.value = val + delta;
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.dispatchEvent(new Event("change", { bubbles: true }));
                console.log(`Botón ${idx}: ${targetId} = ${input.value}`);
              } else {
                console.warn(`No se encontró input con id: ${targetId}`);
              }
            };
          });
        } catch (err) {
          console.error("Error configurando botones:", err);
        }
      }, 100);
    }
  });
}
