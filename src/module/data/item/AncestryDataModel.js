import {
  makeIntField,
  makeStringField,
  makeHtmlField,
  makeBoolField
} from '../helpers.js'
import SpellDataModel from './SpellDataModel.js'
import TalentDataModel from './TalentDataModel.js'

export default class AncestryDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      attributes: new foundry.data.fields.SchemaField({
        strength: new foundry.data.fields.SchemaField({
          value: makeIntField(10),
          min: makeIntField(),
          max: makeIntField(20)
        }),
        agility: new foundry.data.fields.SchemaField({
          value: makeIntField(10),
          min: makeIntField(),
          max: makeIntField(20)
        }),
        intellect: new foundry.data.fields.SchemaField({
          value: makeIntField(10),
          min: makeIntField(),
          max: makeIntField(20)
        }),
        will: new foundry.data.fields.SchemaField({
          value: makeIntField(10),
          min: makeIntField(),
          max: makeIntField(20)
        }),
      }),
      charactaristics: new foundry.data.fields.SchemaField({
        perceptionmodifier: makeIntField(),
        healthmodifier: makeIntField(),
        defensemodifier: makeIntField(),
        healingratemodifier: makeIntField(),
        size: makeStringField('1'),
        speed: makeIntField(10),
        power: makeIntField(),
        insanity: makeIntField(),
        corruption: makeIntField()
      }),
      level4: new foundry.data.fields.SchemaField({
        healthbonuse: makeIntField(),
        option1: makeBoolField(true),
        option1text: makeStringField(),
        talent: new foundry.data.fields.ArrayField(TalentDataModel.schema),
        spells: new foundry.data.fields.ArrayField(SpellDataModel.schema),
        pickedTalents: new foundry.data.fields.ArrayField(TalentDataModel.schema),
        picks: makeIntField(1)
      }),
      languages: makeStringField(),
      talents: new foundry.data.fields.ArrayField(TalentDataModel.schema),
      languagelist: new foundry.data.fields.ArrayField(makeStringField()),
      editTalents: makeBoolField(),
      editAncestry: makeBoolField(true)
    }
  }
}