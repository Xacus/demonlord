
import {
  makeIntField,
  makeStringField,
  makeHtmlField,
} from '../helpers.js'

export default class AmmoDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      source: makeHtmlField(),
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      properties: makeStringField(),
      quantity: makeIntField(5),
      availability: makeStringField(),
      value: makeStringField()
    }
  }
}