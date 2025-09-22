import {
  attributes,
  characteristics,
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
      difficulty: new foundry.data.fields.SchemaField({
        value: makeIntField(),
        base: makeIntField()
      }),
      frightening: makeBoolField(),
      horrifying: makeBoolField(),
      descriptor: makeStringField(),
      perceptionsenses: makeStringField(),
      speedtraits: makeStringField(),
      armor: makeStringField(),
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

  static migrateData(source) {
    // Copy current attributes and characteristics values to their respective base
    if (Number.isNumeric(source.difficulty)) {
      source.attributes.strength.base = source.attributes.strength.value
      source.attributes.agility.base = source.attributes.agility.value
      source.attributes.intellect.base = source.attributes.intellect.value
      source.attributes.will.base = source.attributes.will.value
      source.attributes.perception.base = source.attributes.perception.value

      source.characteristics.health.maxBase = source.characteristics.health.max
      source.characteristics.powerBase = source.characteristics.power
      source.characteristics.sizeBase = source.characteristics.size
      source.characteristics.speedBase = source.characteristics.speed

      source.difficulty = {
        base: source.difficulty,
        value: source.difficulty
      }
    }

    return super.migrateData(source)
  }
}
