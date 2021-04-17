import {FormatDice} from "../dice";
import {ActorAfflictions} from "./actor-afflictions";

export class ActorRolls {

  static launchRollDialog = (dialogTitle, callback) => {
    const d = new Dialog({
      title: dialogTitle,
      content:
        '<div class="challengedialog"><b>' +
        game.i18n.localize('DL.DialogAddBonesAndBanes') +
        "</b><input id='boonsbanes' style='width: 50px;margin-left: 5px;text-align: center' type='number' value=0 data-dtype='Number'/>" +
        '</div><br/><div class="challengedialog"><b>' +
        game.i18n.localize('DL.ModsAdd') +
        "<input id='modifier' style='width: 50px;margin-left: 5px;text-align: center' type='number' value=0 data-dtype='Number'/>" +
        '</b></div><br/>',
      buttons: {
        roll: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogRoll'),
          callback: callback
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('DL.DialogCancel'),
          callback: () => {
          }
        }
      },
      default: 'roll',
      close: () => {
      }
    })
    d.render(true)
  }

  static rollAttribute = (actor, attribute, boonsbanes, modifier) => {
    const rollMode = game.settings.get('core', 'rollMode')
    const buffs = actor.generateCharacterBuffs('')
    let attributeName = capitalize(attribute.label)
    if (!attribute.label && isNaN(attributeName)) {
      attributeName = capitalize(attribute)
    }

    // Roll
    let diceformular = '1d20'
    if (attribute && attribute.modifier !== 0) {
      diceformular =
        diceformular +
        (attribute.modifier > 0 ? '+' + attribute.modifier : attribute.modifier)
    }
    // Add boonsbanes to Strength rolls
    if (
      attribute.label === 'STRENGTH' &&
      parseInt(buffs?.challengestrengthbonus) != 0
    ) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengestrengthbonus)
    }
    // Add boonsbanes to Agility rolls
    if (
      attribute.label === 'AGILITY' &&
      parseInt(buffs?.challengeagilitybonus) != 0
    ) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengeagilitybonus)
    }
    // Add boonsbanes to Intellect rolls
    if (
      attribute.label === 'INTELLECT' &&
      parseInt(buffs?.challengeintellectbonus) != 0
    ) {
      boonsbanes =
        parseInt(boonsbanes) + parseInt(buffs.challengeintellectbonus)
    }
    // Add boonsbanes to Will rolls
    if (
      attribute.label === 'WILL' &&
      parseInt(buffs?.challengewillbonus) != 0
    ) {
      boonsbanes = parseInt(boonsbanes) + parseInt(buffs.challengewillbonus)
    }
    // Add boonsbanes to Perception rolls
    if (
      attribute.label === 'PERCEPTION' &&
      parseInt(buffs?.challengeperceptionbonus) != 0
    ) {
      boonsbanes =
        parseInt(boonsbanes) + parseInt(buffs.challengeperceptionbonus)
    }

    if (boonsbanes != undefined && !isNaN(boonsbanes) && boonsbanes != 0) {
      diceformular = diceformular + '+' + boonsbanes + 'd6kh'
    }

    if (modifier != 0) {
      diceformular = diceformular + '+' + parseInt(modifier)
    }

    const r = new Roll(diceformular, {})
    r.evaluate()

    let diceTotal = r != null ? r.total : ''
    let resultText =
      r.total >= 10
        ? game.i18n.localize('DL.DiceResultSuccess')
        : game.i18n.localize('DL.DiceResultFailure')

    if (['blindroll'].includes(rollMode)) {
      diceTotal = '?'
      resultText = ''
    }

    // Format Dice
    const diceData = FormatDice(r)

    var templateData = {
      actor: actor,
      item: {
        name: attributeName.toUpperCase()
      },
      data: {
        diceTotal: {
          value: diceTotal
        },
        diceTotalGM: {
          value: r.total
        },
        resultText: {
          value: resultText
        },
        resultTextGM: {
          value:
            r.total >= 10
              ? game.i18n.localize('DL.DiceResultSuccess')
              : game.i18n.localize('DL.DiceResultFailure')
        },
        isCreature: {
          value: actor.data.type == 'creature'
        },
        afflictionEffects: {
          value: actor.buildAfflictionsEffects('CHALLENGE')
        },
        actionEffects: {value: actor.buildActionEffects('CHALLENGE')},
        ifBlindedRoll: ['blindroll'].includes(rollMode)
      },
      diceData
    }

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: document.id,
        token: actor.token,
        alias: actor.name
      }
    }

    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }
    if (
      actor.data.type === 'creature' &&
      game.settings.get('demonlord', 'rollCreaturesToGM')
    ) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }

    const template = 'systems/demonlord08/templates/chat/challenge.html'
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content
      if (game.dice3d) {
        game.dice3d
          .showForRoll(r, game.user, true, chatData.whisper, chatData.blind)
          .then((displayed) => ChatMessage.create(chatData))
      } else {
        chatData.sound = CONFIG.sounds.dice
        ChatMessage.create(chatData)
      }
    });
  }

  static rollWeaponAttack = (actor, itemId, options = {event: null}) => {

    if (ActorAfflictions.checkRollBlockingAfflictions(actor,
      ['dazed', 'surprised', 'stunned', 'unconscious'])
    ) return

    const item = actor.getEmbeddedDocument('Item', itemId)
    const attackAttribute = item.data.data.action?.attack
    const characterbuffs = actor.generateCharacterBuffs('ATTACK')

    if (attackAttribute) {
      ActorRolls.launchRollDialog(
        game.i18n.localize('DL.DialogAttackRoll') + game.i18n.localize(item.name),
        (html) => actor.rollAttack(
          item,
          html.find('[id="boonsbanes"]').val(),
          characterbuffs,
          html.find('[id="modifier"]').val())
      )
    } else {
      actor.rollAttack(item, 0, characterbuffs, 0)
    }
  }

  static rollChallenge = (actor, attribute) => {
    if (typeof attribute === 'string' || attribute instanceof String) {
      attribute = actor.data.data.attributes[attribute]
    }

    let attLabel = capitalize(attribute.label)
    if (!attribute.label && isNaN(attLabel)) {
      attLabel = capitalize(attribute)
    }

    if (ActorAfflictions.checkRollBlockingAfflictions(actor,
      ['unconscious', 'stunned', 'surprised']) ||
      ActorAfflictions.checkConditionalRollBlockingAffliction('defenseless', attLabel !== 'Perception') ||
      ActorAfflictions.checkConditionalRollBlockingAffliction('blinded', attLabel === 'Perception')
    ) return

    ActorRolls.launchRollDialog(
      actor.name + ': ' + game.i18n.localize('DL.DialogChallengeRoll').slice(0, -2),
      (html) =>
        actor.rollAttribute(
          attribute,
          html.find('[id="boonsbanes"]').val(),
          html.find('[id="modifier"]').val()
        ))
  }

  static rollTalent = (actor, itemId, options = { event: null }) => {
    if (ActorAfflictions.checkRollBlockingAfflictions(
      actor,
      ['dazed', 'surprised', 'stunned', 'unconscious']
    )) return

    const item = duplicate(actor.items.get(itemId))
    const uses = parseInt(item.data?.uses?.value)
    const usesmax = parseInt(item.data?.uses?.max)

    if ((uses == 0 && usesmax == 0) || uses != usesmax) {
      if (item.data?.vs?.attribute) {
        ActorRolls.launchRollDialog(
          game.i18n.localize('DL.TalentVSRoll') + game.i18n.localize(item.name),
          (html) =>
            actor.useTalent(
              item,
              html.find('[id="boonsbanes"]').val(),
              html.find('[id="modifier"]').val()
            ))
      } else {
        actor.useTalent(item, null, 0)
      }
    } else
      ui.notifications.warn(game.i18n.localize('DL.TalentMaxUsesReached'))
  }

  static rollSpell = (actor, itemId, options = {event: null}) => {

    if (ActorAfflictions.checkRollBlockingAfflictions(
      actor,
      ['dazed', 'defenseless', 'surprised', 'stunned', 'unconscious'])
    ) return

    const item = duplicate(actor.items.get(itemId))
    const attackAttribute = item.data?.action?.attack
    const uses = parseInt(item.data?.castings?.value)
    const usesmax = parseInt(item.data?.castings?.max)
    const characterbuffs = actor.generateCharacterBuffs('SPELL')

    if ((uses == 0 && usesmax == 0) || uses != usesmax) {
      if (attackAttribute) {
        if (item.data.spelltype == game.i18n.localize('DL.SpellTypeAttack')) {
          ActorRolls.launchRollDialog(
            game.i18n.localize('DL.DialogSpellRoll') + game.i18n.localize(item.name),
            (html) =>
              actor.useSpell(
                item,
                html.find('[id="boonsbanes"]').val(),
                characterbuffs,
                html.find('[id="modifier"]').val()
              ))
        } else {
          actor.useSpell(item, 0, characterbuffs, 0)
        }
      } else {
        actor.useSpell(item, 0, characterbuffs, 0)
      }
    } else {
      ui.notifications.warn(game.i18n.localize('DL.SpellMaxUsesReached'))
    }
  }

  static rollCorruption = (actor) => {
    const corruptionRoll = new Roll('1d20 - @corruption', {corruption: actor.data.data.characteristics.corruption})
    corruptionRoll.evaluate()

    // Format Dice
    const diceData = FormatDice(corruptionRoll)

    var templateData = {
      actor: actor,
      data: {
        diceTotal: {
          value: corruptionRoll.total
        },
        tagetValueText: {
          value: game.i18n.localize('DL.CharCorruption').toUpperCase()
        },
        targetValue: {
          value: actor.data.data.characteristics.corruption
        },
        resultText: {
          value:
            corruptionRoll.total >= actor.data.data.characteristics.corruption
              ? game.i18n.localize('DL.DiceResultSuccess')
              : game.i18n.localize('DL.DiceResultFailure')
        },
        failureText: {
          value:
            corruptionRoll.total >= actor.data.data.characteristics.corruption
              ? ''
              : game.i18n.localize('DL.CharRolCorruptionResult')
        }
      },
      diceData
    }

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: actor.id,
        token: actor.token,
        alias: actor.name
      }
    }

    const rollMode = game.settings.get('core', 'rollMode')
    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }
    if (rollMode === 'selfroll') chatData.whisper = [game.user.id]
    if (rollMode === 'blindroll') chatData.blind = true

    const template = 'systems/demonlord08/templates/chat/corruption.html'
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content
      if (game.dice3d) {
        game.dice3d
          .showForRoll(
            corruptionRoll,
            game.user,
            true,
            chatData.whisper,
            chatData.blind
          )
          .then((displayed) =>
            ChatMessage.create(chatData).then((msg) => {
              if (
                corruptionRoll.total <
                actor.data.data.characteristics.corruption
              ) {
                ;(async () => {
                  const compRollTabels = await game.packs
                    .get('demonlord.sotdl roll tabels')
                    .getContent()
                  const tableMarkOfDarkness = compRollTabels.find(
                    (i) => i.name === 'Mark of Darkness'
                  )

                  const result = tableMarkOfDarkness.draw()
                  let resultText = ''
                  const actor = actor

                  result.then(function (result) {
                    resultText = result.results[0].text

                    actor.createItem({
                      name: 'Mark of Darkness',
                      type: 'feature',
                      data: {
                        description: resultText
                      }
                    })
                  })
                  // tableMarkOfDarkness.roll().results[0].text
                })()
              }
            })
          )
      } else {
        chatData.sound = CONFIG.sounds.dice
        ChatMessage.create(chatData)
      }
    })
  }

  static rollAttack = (actor, weapon, boonsbanes, buffs, modifier) => {
    const rollMode = game.settings.get('core', 'rollMode')
    const target = actor.getTarget()
    let diceformular = '1d20'
    let attackRoll = null

    // Roll Against Target
    const targetNumber = actor.getTargetNumber(weapon)

    // Add Attribute modifer to roll
    const attackAttribute = weapon.data.data.action?.attack
    const attribute = actor.data.data?.attributes[attackAttribute.toLowerCase()]

    if (attackAttribute) {
      // Roll for Attack
      if (attribute && attribute.modifier != 0) {
        diceformular =
          diceformular +
          (attribute.modifier > 0
            ? '+' + attribute.modifier
            : attribute.modifier)
      }

      // Add weapon boonsbanes
      if (weapon.data.data.action.boonsbanes != 0) {
        boonsbanes =
          parseInt(boonsbanes) + parseInt(weapon.data.data.action.boonsbanes)
      }

      // Add buffs from Talents
      if (attackAttribute === 'Strength' && buffs.attackstrengthbonus != 0) {
        boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackstrengthbonus)
      }
      if (attackAttribute === 'Agility' && buffs.attackagilitybonus != 0) {
        boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackagilitybonus)
      }
      if (attackAttribute === 'Intellect' && buffs.attackintellectbonus != 0) {
        boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackintellectbonus)
      }
      if (attackAttribute === 'Will' && buffs.attackwillbonus != 0) {
        boonsbanes = parseInt(boonsbanes) + parseInt(buffs.attackwillbonus)
      }
      if (
        attackAttribute === 'Perception' &&
        buffs.attackperceptionbonus != 0
      ) {
        boonsbanes =
          parseInt(boonsbanes) + parseInt(buffs.attackperceptionbonus)
      }

      // If you wear a weapon and do not meet or exceed its requirements: -1 Bane
      if (weapon.data.data.wear) {
        if (
          weapon.data.data.strengthmin != '' &&
          parseInt(weapon.data.data.strengthmin) >
          parseInt(actor.data.data?.attributes?.strength?.value)
        ) {
          boonsbanes--
        }
      }

      if (boonsbanes == undefined || isNaN(boonsbanes) || boonsbanes == 0) {
        boonsbanes = 0
      } else {
        diceformular += '+' + boonsbanes + 'd6kh'
      }

      if (modifier != 0) {
        diceformular = diceformular + '+' + parseInt(modifier)
      }

      attackRoll = new Roll(diceformular, {})
      attackRoll.evaluate()
    } else {
      ui.notifications.error(
        game.i18n.localize('DL.DialogWarningWeaponAttackModifier')
      )
    }

    // Format Dice
    const diceData = FormatDice(attackRoll)

    // Plus20 roll
    let plus20 = false
    if (targetNumber != undefined && attackRoll != null) {
      plus20 = !!(
        attackRoll.total >= 20 &&
        attackRoll.total >= parseInt(targetNumber) + 5
      )
    }

    let resultText =
      attackRoll != null &&
      targetNumber != undefined &&
      attackRoll.total >= parseInt(targetNumber)
        ? game.i18n.localize('DL.DiceResultSuccess')
        : game.i18n.localize('DL.DiceResultFailure')
    let diceTotal = attackRoll != null ? attackRoll.total : ''
    if (
      actor.data.type === 'creature' &&
      !game.settings.get('demonlord', 'attackShowAttack')
    ) {
      diceTotal = '?'
      resultText = ''
    }
    if (['blindroll'].includes(rollMode)) {
      diceTotal = '?'
      resultText = ''
    }

    const againstNumber =
      (target != null && target.actor.data.type == 'character') ||
      (game.settings.get('demonlord', 'attackShowDefense') &&
        targetNumber != undefined)
        ? targetNumber
        : '?'

    var templateData = {
      actor: actor,
      item: {
        data: weapon,
        name: weapon.name
      },
      data: {
        diceTotal: {
          value: diceTotal
        },
        diceTotalGM: {
          value: attackRoll != null ? attackRoll.total : ''
        },
        resultText: {
          value: resultText
        },
        didHit: {
          value: !!(
            targetNumber == undefined ||
            (attackRoll != null && attackRoll.total >= targetNumber)
          )
        },
        attack: {
          value: attackAttribute
            ? game.i18n.localize(
              CONFIG.DL.attributes[
                attackAttribute.toLowerCase()
                ].toUpperCase()
            )
            : ''
        },
        against: {
          value: weapon.data?.data?.action?.against
            ? game.i18n.localize(
              CONFIG.DL.attributes[
                weapon.data?.data?.action?.against.toLowerCase()
                ].toUpperCase()
            )
            : ''
        },
        againstNumber: {
          value: againstNumber
        },
        againstNumberGM: {
          value: againstNumber == '?' ? targetNumber : againstNumber
        },
        damageFormular: {
          value: weapon.data.data.action.damage + buffs.attackdamagebonus
        },
        damageType: {
          value: weapon.data.data.action.damagetype
        },
        damageTypes: {
          value: weapon.data.data.action.damagetypes
        },
        damageExtra20plusFormular: {
          value:
            buffs.attack20plusdamagebonus.charAt(0) == '+'
              ? buffs.attack20plusdamagebonus.substr(1)
              : buffs.attack20plusdamagebonus
        },
        description: {
          value: weapon.data.data.description
        },
        targetname: {
          value: target != null ? target.name : ''
        },
        effects: {
          value: buffs.attackeffects
        },
        armorEffects: {
          value: actor.buildArmorEffects(!buffs.armorRequirementMeet)
        },
        afflictionEffects: {
          value: actor.buildAfflictionsEffects('ATTACK')
        },
        isCreature: {
          value: actor.data.type == 'creature'
        },
        isPlus20Roll: {
          value: plus20
        },
        hasTarget: {
          value: targetNumber != undefined
        },
        actionEffects: {value: actor.buildActionEffects('ATTACK')},
        ifBlindedRoll: ['blindroll'].includes(rollMode)
      },
      diceData
    }

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: actor.id,
        token: actor.token,
        alias: actor.name
      }
    }

    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }
    if (rollMode === 'selfroll') chatData.whisper = [game.user.id]
    if (rollMode === 'blindroll') chatData.blind = true

    const template = 'systems/demonlord08/templates/chat/combat.html'
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content

      if (game.dice3d && attackRoll != null) {
        if (
          actor.data.type === 'creature' &&
          !game.settings.get('demonlord', 'attackShowAttack')
        ) {
          if (attackRoll != null) chatData.sound = CONFIG.sounds.dice
          ChatMessage.create(chatData)
        } else {
          game.dice3d
            .showForRoll(
              attackRoll,
              game.user,
              true,
              chatData.whisper,
              chatData.blind
            )
            .then((displayed) => ChatMessage.create(chatData))
        }
      } else {
        if (attackRoll != null) chatData.sound = CONFIG.sounds.dice
        ChatMessage.create(chatData)
      }
    })
  }

}
