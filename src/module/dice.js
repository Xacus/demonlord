export function FormatDice(diceRoll) {
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
