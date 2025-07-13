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
    const pathsData = actor.items.filter(i => i.type === 'path').map(p => p.system)
    const path =
      pathsData.find(p => p.type === 'novice')?.parent.name ||
      pathsData.find(p => p.type === 'expert')?.parent.name ||
      pathsData.find(p => p.type === 'master')?.parent.name ||
      pathsData.find(p => p.type === 'legendary')?.parent.name ||
      ''
    info = ancestry + (path ? ', ' + path : '')
  } else {
    const size = game.i18n.localize('DL.CreatureSize') + ' ' + actor.system.characteristics.size
    const desc = actor.system.descriptor
    const frig = actor.system.frightening ? ', ' + game.i18n.localize('DL.CreatureFrightening') : ''
    const horr = actor.system.horrifying ? ', ' + game.i18n.localize('DL.CreatureHorrifying') : ''
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
      if ([3, 4, 6, 8, 10, 12, 20].indexOf(faces) > -1) {
        img = `../icons/svg/d${faces}-grey.svg`
        if (faces === 3) img = `../icons/svg/d6-grey.svg`
      }
      _diceData.dice.push({
        img: img,
        result: total,
        dice: true,
        color: color,
      })
    }

    for (let i = 0; i < diceRoll.terms.length; i++) {
      if (diceRoll.terms[i] instanceof foundry.dice.terms.Die) {
        let pool = diceRoll.terms[i].results
        let faces = diceRoll.terms[i].faces

        pool.forEach(pooldie => {
          if (pooldie.discarded) {
            pushDice(diceData, pooldie.result, faces, '#777')
          } else {
            let color = 'white'
            if (((diceRoll._formula.includes('d6kh') || diceRoll._formula.includes('d6r1kh')) && faces === 6) || ((diceRoll._formula.includes('d3kh') || diceRoll._formula.includes('d3r1kh')) && faces === 3)) {
              let operator = diceRoll.terms[diceRoll.terms.length - 2].operator
              if (operator === '+') color = '#006400'
              if (operator === '-') color = '#a22223'
            }
            pushDice(diceData, pooldie.result, faces, color)
          }
        })
        // eslint-disable-next-line no-undef
      } else if (diceRoll.terms[i] instanceof foundry.dice.terms.OperatorTerm) {
        const operatorTerm = diceRoll.terms[i]
        diceData.dice.push({
          img: null,
          result: operatorTerm.operator,
          dice: false,
        })
        // eslint-disable-next-line no-undef
      } else if (diceRoll.terms[i] instanceof foundry.dice.terms.NumericTerm) {
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
