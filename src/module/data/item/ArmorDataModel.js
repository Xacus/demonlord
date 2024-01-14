import { enchantment } from '../common.js'

import {
  makeIntField,
  makeStringField,
  makeHtmlField,
  makeBoolField
} from '../helpers.js'

export default class ArmorDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      enchantment: enchantment(),
      properties: makeStringField(),
      defense: makeStringField(),
      agility: makeStringField(),
      fixed: makeStringField(),
      requirement: new foundry.data.fields.SchemaField({
        attribute: makeStringField(),
        minvalue: makeIntField()
      }),
      wear: makeBoolField(true),
      isShield: makeBoolField(),
      quantity: makeIntField(1),
      availability: makeStringField(),
      value: makeStringField()
    }
  }
}