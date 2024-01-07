
import {
  makeIntField,
  makeStringField,
  makeHtmlField,
} from '../helpers.js'

export default class AmmoDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      properties: makeStringField(),
      quantity: makeIntField(5),
      availability: makeStringField(),
      value: makeStringField()
    }
  }
}