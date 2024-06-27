export function requestInitiativeRollMacro() {
  function requestInitRoll(token) {
    const actor = token.actor;
    let users = game.users.filter(user => user.active);

    var targets = [];
    for (let user of users) {
      if (actor.ownership[user.id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
        targets.push(user.id);
    }

    var templateData = {
      actor: actor
    };

    let chatData = {
      user: targets[0],
      speaker: {
        actor: actor._id,
        token: actor.token,
        alias: actor.name
      }
    };

    chatData["whisper"] = targets;

    let template = 'systems/demonlord/templates/chat/makeinitroll.hbs';
    renderTemplate(template, templateData).then(content => {
      chatData.content = content;
      ChatMessage.create(chatData);
    });
  }

  for (let token of canvas.tokens.controlled) {
    requestInitRoll(token);
  }
}


export function requestChallengeRollMacro() {
  // GM Tool
  // Lets you request a challenge roll from the select tokens. Each token owner gets a whisper message asking them to make a roll.

  function requestRoll(token, attribute, boonsbanes) {
    const actor = token.actor;
    let users = game.users.filter(user => user.active);

    var targets = [];
    for (let user of users) {
      if (actor.ownership[user.id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
        targets.push(user.id);
    }

    let boonsbanestext = "";
    if (boonsbanes == 1)
      boonsbanestext = boonsbanes + " " + game.i18n.localize('DL.DialogBoon');
    if (boonsbanes > 1)
      boonsbanestext = boonsbanes + " " + game.i18n.localize('DL.DialogBoons');
    if (boonsbanes == -1)
      boonsbanestext = boonsbanes.replace("-", "") + " " + game.i18n.localize('DL.DialogBane');
    if (boonsbanes < -1)
      boonsbanestext = boonsbanes.replace("-", "") + " " + game.i18n.localize('DL.DialogBanes');

    var templateData = {
      actor: actor,
      data: {
        attribute: {
          value: CONFIG.DL.attributes[attribute.toLowerCase()]
        },
        boonsbanes: {
          value: boonsbanes
        },
        boonsbanestext: {
          value: boonsbanestext
        }
      }
    };

    let chatData = {
      user: targets[0],
      speaker: {
        actor: actor._id,
        token: actor.token,
        alias: actor.name
      }
    };

    chatData["whisper"] = targets;

    let template = 'systems/demonlord/templates/chat/makechallengeroll.hbs';
    renderTemplate(template, templateData).then(content => {
      chatData.content = content;
      ChatMessage.create(chatData);
    });
  }

  let applyChanges = false;
  new Dialog({
    title: game.i18n.localize('DL.MacroChallengeTitle'),
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
        label: game.i18n.localize('DL.MacroChallengeRequestRoll'),
        callback: () => applyChanges = true
      },
      no: {
        icon: "<i class='fas fa-times'></i>",
        label: game.i18n.localize('DL.MacroCancel')
      },
    },
    default: "yes",
    close: html => {
      if (applyChanges) {
        for (let token of canvas.tokens.controlled) {
          let attribute = html.find('[name="attribute-type"]')[0].value || "none";
          let boonsbanes = html.find('[name="boonsbanes"]')[0].value || "none";

          requestRoll(token, attribute, boonsbanes);
        }
      }
    }
  }).render(true);
}


export function wealthManagerMacro() {

  main();

  function main() {
    let playersNames = []
    let players = game.users.filter(p => p.role !== 4)
    players.forEach((p) => {
      const actor = p.character
      if (actor) playersNames.push(actor.name);
    });

    let playerNameList;
    let currentWealthList = '';
    playerNameList = `<option value="everyone" selected>` + game.i18n.localize('DL.MacroWealthManager.Everyone') + `</option>`;
    playersNames.forEach((el) => {
      playerNameList += `<option value="${el}">${el}</option>`;
    });

    let currentWealth = checkWealth();
    for (let i = 0; i < currentWealth.length; i++) {
      currentWealthList += '<li style="margin-bottom: 5px"><b>' + currentWealth[i][0] + ' [' + currentWealth[i][1] + ']</b><br/><b>GC:</b> ' + currentWealth[i][2] + ', <b>SS:</b> ' + currentWealth[i][3] + ', <b>CP:</b> ' + currentWealth[i][4] + ', <b>Bits:</b> ' + currentWealth[i][5] + '</li>';
    }

    let template = `
  <h2>` + game.i18n.localize('DL.MacroWealthManager.Choose') + `</h2>
  <p><b>` + game.i18n.localize('DL.MacroWealthManager.Character') + `</b> <select id="playerName" style="width: 200px">${playerNameList}</select></p>
  <p>
    <b>` + game.i18n.localize('DL.MacroWealthManager.AddSubtract') + `</b><br/>
<label for="gc">` + game.i18n.localize('DL.MacroWealthManager.CoinsGC') + `</label>
<input id="gc" type="number" min="-10" max="10" style="width: 40px; box-sizing: border-box;border: none;background-color: rgba(0, 0, 0, 0.1);color: black; text-align: center; margin-right:10px" value=0>
<label for="ss">` + game.i18n.localize('DL.MacroWealthManager.CoinsSS') + `</label>
<input id="ss" type="number" min="-10" max="10" style="width: 40px; box-sizing: border-box;border: none;background-color: rgba(0, 0, 0, 0.1);color: black; text-align: center; margin-right:10px" value=0>
<label for="cp">` + game.i18n.localize('DL.MacroWealthManager.CoinsCP') + `</label>
<input id="cp" type="number" min="-10" max="10" style="width: 40px; box-sizing: border-box;border: none;background-color: rgba(0, 0, 0, 0.1);color: black; text-align: center; margin-right:10px" value=0>
<label for="bits">` + game.i18n.localize('DL.MacroWealthManager.CoinsBits') + `</label>
<input id="bits" type="number" min="-10" max="10" style="width: 40px; box-sizing: border-box;border: none;background-color: rgba(0, 0, 0, 0.1);color: black; text-align: center; " value=0>
  </p>
<br/>
  <h2>` + game.i18n.localize('DL.MacroWealthManager.CurrentWealth') + `</h2>
  <ul>
    ${currentWealthList}
  </ul>
  `;

    new Dialog({
      title: game.i18n.localize('DL.MacroWealthManager.DialogTitle'),
      content: template,
      buttons: {
        ok: {
          label: game.i18n.localize('DL.MacroWealthManager.ButtonApply'),
          callback: async (html) => {
            coinmanager(html);
          },
        },
        cancel: {
          label: game.i18n.localize('DL.MacroWealthManager.ButtonCancel'),
        },
      },
    }).render(true);
  }

  async function coinmanager(html) {
    let playerName = html.find("#playerName")[0].value;
    let gc = html.find("#gc")[0].value;
    let ss = html.find("#ss")[0].value;
    let cp = html.find("#cp")[0].value;
    let bits = html.find("#bits")[0].value;
    if (playerName == 'everyone') {
      await updateAllWealth(gc, ss, cp, bits);
    } else {
      await updateWealth(playerName, gc, ss, cp, bits);
    }
  }

  async function updateWealth(playerName, gc, ss, cp, bits) {
    let actors = [];
    let players = game.users.filter((t) => t.role != 4);
    players.forEach((p) => {
      const actor = p.character
      if (!actor) return
      if (actor.name === playerName)
        actors.push(actor);
    });

    let currentGC = parseInt(actors[0].system.wealth.gc);
    let currentSS = parseInt(actors[0].system.wealth.ss);
    let currentCP = parseInt(actors[0].system.wealth.cp);
    let currentBits = parseInt(actors[0].system.wealth.bits);

    await actors[0].update(
      {
        'system.wealth.gc': currentGC + parseInt(gc),
        'system.wealth.ss': currentSS + parseInt(ss),
        'system.wealth.cp': currentCP + parseInt(cp),
        'system.wealth.bits': currentBits + parseInt(bits)
      });
    expMessage(actors[0].name, gc, ss, cp, bits);
  }

  async function updateAllWealth(gc, ss, cp, bits) {
    let players = game.users.filter((t) => t.role !== 4);
    await Promise.all(players.forEach(async (p) => {
      const actor = p.character
      if (!actor) return

      let currentGC = parseInt(actor.system.wealth.gc);
      let currentSS = parseInt(actor.system.wealth.ss);
      let currentCP = parseInt(actor.system.wealth.cp);
      let currentBits = parseInt(actor.system.wealth.bits);

      await actor.update(
        {
          'system.wealth.gc': currentGC + parseInt(gc),
          'system.wealth.ss': currentSS + parseInt(ss),
          'system.wealth.cp': currentCP + parseInt(cp),
          'system.wealth.bits': currentBits + parseInt(bits)
        });

      expMessage(actor.name, gc, ss, cp, bits);
    }));
  }

  function checkWealth() {
    let wealth = [];
    let characters = game.users.filter((t) => t.role !== 4)
    characters.forEach((c) => {
      const actor = c.character
      if (!actor) return
      wealth.push([c.name, actor.name, actor.system.wealth.gc, actor.system.wealth.ss, actor.system.wealth.cp, actor.system.wealth.bits]);
    });
    return wealth;
  }

  function expMessage(player, gc, ss, cp, bits) {
    let message = `<h2>${player}</h2>`;
    message += `
  <div>

    <span><h4>Wealth Update:</h4>
<b>${gc}</b> GC</b><br/>
<b>${ss}</b> SS</b><br/>
<b>${cp}</b> CP</b><br/>
<b>${bits}</b> Bits</b><br/>
</span>
  </div>
  `;
    let chatData = {
      user: game.user._id,
      speaker: ChatMessage.getSpeaker(),
      content: message
    };
    ChatMessage.create(chatData, {});
  }
}

export function applyVisionMacro() {
  if (!canvas.tokens.controlled?.length) {
    ui.notifications.warn('No token selected.')
    return
  }

  let d = new Dialog({
    title: "Change token vision type",
    buttons: {
      basic: {
        label: "Basic",
        callback: () => applyVisionToSelectedTokens('basic')
      },
      shadowsight: {
        label: "Shadowsight",
        callback: () => applyVisionToSelectedTokens('shadowsight')
      },
      darksight: {
        label: "Darksight",
        callback: () => applyVisionToSelectedTokens('darksight')
      },
      sightless: {
        label: "Sightless",
        callback: () => applyVisionToSelectedTokens('sightless')
      },
      truesight: {
        label: "Truesight",
        callback: () => applyVisionToSelectedTokens('truesight')
      }
    },
    default: "basic",
  });
  d.render(true);


  async function applyVisionToSelectedTokens(visionType) {
    const controlled = canvas.tokens.controlled
    if (!controlled?.length) {
      ui.notifications.warn('No token selected.')
      return
    }
    await Promise.all(controlled.map(async t => await game.demonlord.macros.applyVisionType(t, visionType))).then(_ =>
      ui.notifications.info(`Successfully applied ${visionType} to ${controlled.length} token${controlled.length > 1 ? 's' : ''}.`)
    )
  }
}


export async function applyVisionType(token, visionType = undefined, _otherData = undefined) {
  if (!token) return
  visionType = visionType?.toLowerCase() ?? 'basic'

  let updateData = {
    sight: {
      enabled: true,
      angle: 360,
      range: 0,
      visionMode: 'basic',
    },
    detectionModes: [{
      id: 'basicSight',
      enabled: true,
      range: 0
    }]
  }
  if (visionType === 'darksight') {
    updateData.sight.range = 20
    updateData.sight.visionMode = 'darksight'
    updateData.detectionModes[0].range = 20
  } else if (visionType === 'shadowsight') {
    updateData.sight.range = 0
    updateData.sight.visionMode = 'shadowsight'
    updateData.detectionModes[0].range = 0
  } else if (visionType === 'sightless') {
    updateData.sight.range = 100
    updateData.sight.visionMode = 'sightless'
    updateData.detectionModes[0].enabled = false
    updateData.detectionModes.push({
      id: 'senseAll',
      enabled: true,
      range: 100,
    })

  } else if (visionType === 'truesight') {
    updateData.sight.range = null
    updateData.detectionModes[0].enabled = false
    updateData.sight.visionMode = 'truesight'
    updateData.detectionModes.push({
      id: 'seeAll',
      enabled: true,
      range: 100,
    })
  }

  // Update the token and the prototype
  const promises = [
    token.document.update(updateData),
    token.actor?.prototypeToken?.update(updateData)
  ]

  const actorUuid = token.actor.flags?.core?.sourceId
  const actorSource = await fromUuid(actorUuid)
  if (actorSource) promises.push(actorSource.prototypeToken.update(updateData))
  return await Promise.all(promises)

}
