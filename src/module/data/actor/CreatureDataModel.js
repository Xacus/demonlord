import {
  attributes,
  characteristics,
  wealth
} from '../common.js'

import {
  makeIntField,
  makeBoolField,
  makeStringField,
  makeHtmlField
} from '../helpers.js'

import {
  getRanges,
  getCanFly
} from '../../utils/token-ruler.js'

export default class CreatureDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const type = 'creature'

    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      attributes: attributes(),
      characteristics: characteristics(type),
      fastturn: makeBoolField(),
      difficulty: makeIntField(),
      difficultyBase: makeIntField(),
      frightening: makeBoolField(),
      horrifying: makeBoolField(),
      willChallengeRollBanes:  makeIntField(),
      horrifyingInsanityFormula:  makeStringField(),
      perceptionsenses: makeStringField(),
      speedtraits: makeStringField(),
      armor: makeStringField(),
      wealth: wealth(),
      roles: new foundry.data.fields.ArrayField(makeStringField()) // ?
    }
  }

  get type() {
    return 'creature'
  }

  get ranges() {
    return getRanges(this)
  }

  get canFly() {
    return getCanFly(this)
  }

  prepareDerivedData() {
    super.prepareDerivedData()
    this.isMagic = this.parent.paths.some(p => p.isMagic) // Any of the paths is magic
    || this.parent.ancestry.some(p => p.isMagic) // Any of the ancestries is magic
    || this.parent.spells?.length > 0 // Has any spells
    || this.parent.system.characteristics.power > 0 // Has power
  }

  static migrateData(source) {
    // Copy current attributes and characteristics values to their respective base
    if (source.difficultyBase == null ) { // Null or undefined
      source.attributes.strength.base = source.attributes.strength.value
      source.attributes.agility.base = source.attributes.agility.value
      source.attributes.intellect.base = source.attributes.intellect.value
      source.attributes.will.base = source.attributes.will.value
      source.attributes.perception.base = source.attributes.perception.value

      source.characteristics.defenseBase = source.characteristics.defense
      source.characteristics.health.maxBase = source.characteristics.health.max
      source.characteristics.powerBase = source.characteristics.power
      source.characteristics.sizeBase = source.characteristics.size
      source.characteristics.speedBase = source.characteristics.speed

      source.difficultyBase =  source.difficulty
    }

    return super.migrateData(source)
  }
}
