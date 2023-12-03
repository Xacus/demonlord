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

export default class CreatureDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const type = 'creature'

    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      attributes: attributes(),
      characteristics: characteristics(type),

      difficulty: makeIntField(),
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
}