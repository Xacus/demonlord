import {
  attributes,
  characteristics,
} from '../common.js'

import {
  makeBoolField,
  makeIntField,
  makeStringField,
  makeHtmlField
} from '../helpers.js'

import {
  getRanges,
  getCanFly
} from '../../utils/token-ruler.js'

export default class VehicleDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const type = 'vehicle'

    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      attributes: attributes(),
      characteristics: characteristics(type),
      fastturn: makeBoolField(),
      descriptor: makeStringField(),
      speedtraits: makeStringField(),
      price: makeStringField(),
      cargo: makeIntField(),
      space: makeStringField(),
      maximumspeed: makeStringField(),
      crew: makeStringField()

    }
  }

  get type() {
    return 'vehicle'
  }

  get ranges() {
    return getRanges(this)
  }

  get canFly() {
    return getCanFly(this)
  }
}