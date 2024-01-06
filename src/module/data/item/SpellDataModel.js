import { action, activatedEffect } from '../common.js'
import { makeBoolField, makeHtmlField, makeIntField, makeStringField } from '../helpers.js'

export default class SpellDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      action: action(),
      activatedEffect: activatedEffect(),
      edit: makeBoolField(),
      tradition: makeStringField(),
      spelltype: makeStringField(),
      rank: makeIntField(),
      attribute: makeStringField(),
      effectdice: makeStringField(),
      castings: new foundry.data.fields.SchemaField({
        value: makeStringField(),
        max: makeStringField(),
        ignoreCalculation: makeBoolField()
      }),
      duration: makeStringField(),
      target: makeStringField(),
      area: makeStringField(),
      requirements: makeStringField(),
      sacrifice: makeStringField(),
      permanence: makeStringField(),
      aftereffect: makeStringField(),
      special: makeStringField(),
      triggered: makeStringField(),
      roundsleft: makeIntField(),
      healing: new foundry.data.fields.SchemaField({
        healingactive: makeBoolField(true),
        healing: makeBoolField(),
        rate: makeStringField()
      }),
      quantity: makeIntField(1)
    }
  }
}

export const makeSpellSchema = () => new foundry.data.fields.SchemaField({
  description: makeHtmlField(),
  enrichedDescription: makeHtmlField(),
  action: action(),
  activatedEffect: activatedEffect(),
  edit: makeBoolField(),
  tradition: makeStringField(),
  spelltype: makeStringField(),
  rank: makeIntField(),
  attribute: makeStringField(),
  effectdice: makeStringField(),
  castings: new foundry.data.fields.SchemaField({
    value: makeStringField(),
    max: makeStringField(),
    ignoreCalculation: makeBoolField()
  }),
  duration: makeStringField(),
  target: makeStringField(),
  area: makeStringField(),
  requirements: makeStringField(),
  sacrifice: makeStringField(),
  permanence: makeStringField(),
  aftereffect: makeStringField(),
  special: makeStringField(),
  triggered: makeStringField(),
  roundsleft: makeIntField(),
  healing: new foundry.data.fields.SchemaField({
    healingactive: makeBoolField(true),
    healing: makeBoolField(),
    rate: makeStringField()
  }),
  quantity: makeIntField(1)
})