import {
  attributes,
  characteristics,
} from '../common.js'

import {
  makeIntField,
  makeStringField,
  makeHtmlField
} from '../helpers.js'

export default class VehicleDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const type = 'vehicle'

    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      attributes: attributes(),
      characteristics: characteristics(type),

      descriptor: makeStringField(),
      speedtraits: makeStringField(),
      price: makeStringField(),
      cargo: makeIntField()
    }
  }

  get type() {
    return 'vehicle'
  }
}