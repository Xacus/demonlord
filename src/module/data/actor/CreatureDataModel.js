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
      difficulty: makeIntField(),
      frightening: makeBoolField(),
      horrifying: makeBoolField(),
      descriptor: makeStringField(),
      perceptionsenses: makeStringField(),
      speedtraits: makeStringField(),
      armor: makeStringField(),
      wealth: new foundry.data.fields.SchemaField({
        edit: makeBoolField(),
        bits: makeIntField(),
        cp: makeIntField(),
        ss: makeIntField(),
        gc: makeIntField()
      }),      
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
}