export function FormatDice(diceRoll) {
    let diceData = { dice: [] };

    if (diceRoll != null) {
        let pushDice = (diceData, total, faces, color) => {
            let img = null;
            if ([4, 6, 8, 10, 12, 20].indexOf(faces) > -1) {
                img = `../icons/svg/d${faces}-grey.svg`;
            }
            diceData.dice.push({
                img: img,
                result: total,
                dice: true,
                color: color
            });
        };

        for (let i = 0; i < diceRoll.terms.length; i++) {
            if (diceRoll.terms[i] instanceof Die) {
                let pool = diceRoll.terms[i].results;
                let faces = diceRoll.terms[i].faces;

                pool.forEach((pooldie) => {
                    if (pooldie.discarded) {
                        pushDice(diceData, pooldie.result, faces, "#777");
                    } else {
                        pushDice(diceData, pooldie.result, faces, "white");
                    }

                });
            } else if (typeof diceRoll.terms[i] == 'string') {
                const parsed = parseInt(diceRoll.terms[i]);
                if (!isNaN(parsed)) {
                    diceData.dice.push({
                        img: null,
                        result: parsed,
                        dice: false,
                        color: 'white'
                    });
                } else {
                    diceData.dice.push({
                        img: null,
                        result: diceRoll.terms[i],
                        dice: false
                    });
                }
            }
            else if (typeof diceRoll.terms[i] == 'number') {
                const parsed = parseInt(diceRoll.terms[i]);
                if (!isNaN(parsed)) {
                    diceData.dice.push({
                        img: null,
                        result: parsed,
                        dice: false,
                        color: 'white'
                    });
                } else {
                    diceData.dice.push({
                        img: null,
                        result: diceRoll.terms[i],
                        dice: false
                    });
                }
            }
        }
    }

    return diceData;
}

export function FormatDiceOld(diceRoll) {
    let diceData = { dice: [] };

    if (diceRoll != null) {
        let pushDice = (diceData, total, faces, color) => {
            let img = null;
            if ([4, 6, 8, 10, 12, 20].indexOf(faces) > -1) {
                img = `../icons/svg/d${faces}-grey.svg`;
            }
            diceData.dice.push({
                img: img,
                result: total,
                dice: true,
                color: color
            });
        };

        for (let i = 0; i < diceRoll.terms.length; i++) {
            if (diceRoll.terms[i] instanceof Die) {
                let pool = diceRoll.parts[i].results;
                let faces = diceRoll.parts[i].faces;

                pool.forEach((pooldie) => {
                    if (pooldie.discarded) {
                        pushDice(diceData, pooldie.roll, faces, "#777");
                    } else {
                        pushDice(diceData, pooldie.roll, faces, "white");
                    }

                });
            } else if (typeof diceRoll.parts[i] == 'string') {
                const parsed = parseInt(diceRoll.parts[i]);
                if (!isNaN(parsed)) {
                    diceData.dice.push({
                        img: null,
                        result: parsed,
                        dice: false,
                        color: 'white'
                    });
                } else {
                    diceData.dice.push({
                        img: null,
                        result: diceRoll.terms[i],
                        dice: false
                    });
                }
            }
            else if (typeof diceRoll.terms[i] == 'number') {
                const parsed = parseInt(diceRoll.terms[i]);
                if (!isNaN(parsed)) {
                    diceData.dice.push({
                        img: null,
                        result: parsed,
                        dice: false,
                        color: 'white'
                    });
                } else {
                    diceData.dice.push({
                        img: null,
                        result: diceRoll.parts[i],
                        dice: false
                    });
                }
            }
        }
    }

    return diceData;
}