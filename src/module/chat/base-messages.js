/**
 * Builds the base chat data based on settings, actor and user
 * @param actor
 * @param rollMode
 * @returns ChatData
 * @private
 */
export function getChatBaseData(actor, rollMode) {
  return {
    user: game.user.id,
    speaker: {
      actor: actor.id,
      token: actor.token,
      alias: actor.name,
    },
    blind: rollMode === 'blindroll',
    whisper:
      rollMode === 'selfroll'
        ? [game.user.id]
        : rollMode === 'gmroll' || rollMode === 'blindroll'
        ? ChatMessage.getWhisperRecipients('GM')
        : [],
  }
}

/* -------------------------------------------- */

export function buildActorInfo(actor) {
  let info = ''
  if (actor.type === 'character') {
    const ancestry = actor.items.find(i => i.type === 'ancestry')?.name || ''
    const paths = actor.data.paths || actor.items.filter(i => i.type === 'path').map(p => p.data)
    const path =
      paths.find(p => p.data.type === 'master')?.name ||
      paths.find(p => p.data.type === 'expert')?.name ||
      paths.find(p => p.data.type === 'novice')?.name ||
      ''
    info = ancestry + (path ? ', ' + path : '')
  } else {
    const size = game.i18n.localize('DL.CreatureSize') + ' ' + actor.data.data.characteristics.size
    const desc = actor.data.data.descriptor
    const frig = actor.data.data.frightening ? ', ' + game.i18n.localize('DL.CreatureFrightening') : ''
    const horr = actor.data.data.horrifying ? ', ' + game.i18n.localize('DL.CreatureHorrifying') : ''
    info = size + ' ' + desc + frig + horr
  }
  return info
}

/* -------------------------------------------- */

export function formatDice(diceRoll) {
  let diceData = { dice: [] }

  if (diceRoll != null) {
    let pushDice = (_diceData, total, faces, color) => {
      let img = null
      if ([4, 6, 8, 10, 12, 20].indexOf(faces) > -1) {
        img = `../icons/svg/d${faces}-grey.svg`
      }
      _diceData.dice.push({
        img: img,
        result: total,
        dice: true,
        color: color,
      })
    }

    for (let i = 0; i < diceRoll.terms.length; i++) {
      if (diceRoll.terms[i] instanceof Die) {
        let pool = diceRoll.terms[i].results
        let faces = diceRoll.terms[i].faces

        pool.forEach(pooldie => {
          if (pooldie.discarded) {
            pushDice(diceData, pooldie.result, faces, '#777')
          } else {
            pushDice(diceData, pooldie.result, faces, 'white')
          }
        })
        // eslint-disable-next-line no-undef
      } else if (diceRoll.terms[i] instanceof OperatorTerm) {
        const operatorTerm = diceRoll.terms[i]
        diceData.dice.push({
          img: null,
          result: operatorTerm.operator,
          dice: false,
        })
        // eslint-disable-next-line no-undef
      } else if (diceRoll.terms[i] instanceof NumericTerm) {
        const numericTerm = diceRoll.terms[i]
        diceData.dice.push({
          img: null,
          result: numericTerm.number,
          dice: false,
        })
      }
    }
  }

  return diceData
}
