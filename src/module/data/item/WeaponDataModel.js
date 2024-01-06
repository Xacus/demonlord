import { makeBoolField, makeHtmlField, makeIntField, makeStringField } from '../helpers.js'

export default class WeaponDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      hands: makeStringField(),
      properties: makeStringField(),
      requirement: new foundry.data.fields.SchemaField({
        attribute: makeStringField(),
        minvalue: makeIntField()
      }),
      wear: makeBoolField(true),
      quantity: makeIntField(1),
      availability: makeStringField(),
      value: makeStringField()
    }
  }
}

export function makeWeaponSchema() {
  return new foundry.data.fields.SchemaField({
    description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      hands: makeStringField(),
      properties: makeStringField(),
      requirement: new foundry.data.fields.SchemaField({
        attribute: makeStringField(),
        minvalue: makeIntField()
      }),
      wear: makeBoolField(true),
      quantity: makeIntField(1),
      availability: makeStringField(),
      value: makeStringField()
  })
}