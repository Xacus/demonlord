import {
  makeIntField,
  makeStringField,
  makeHtmlField,
  makeBoolField,
} from '../helpers.js'
import { levelItem } from '../common.js'
import { makeLanguageSchema } from './LanguageDataModel.js'
import { makeSpellSchema } from './SpellDataModel.js'
import { makeTalentSchema } from './TalentDataModel.js'

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
      characteristics: new foundry.data.fields.SchemaField({
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
        healthbonuses: makeIntField(),
        option1: makeBoolField(true),
        option1text: makeStringField(),
        talent: new foundry.data.fields.ArrayField(levelItem(makeTalentSchema)),
        spells: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
          system: makeSpellSchema(),
          description: new foundry.data.fields.SchemaField({
            value: makeStringField()
          }),
          id: makeStringField(),
          name: makeStringField(),
          pack: makeStringField(),
          selected: makeBoolField(),
          uuid: makeStringField()
        })),
        pickedTalents: new foundry.data.fields.ArrayField(new foundry.data.fields.ArrayField(levelItem(makeTalentSchema))),
        picks: makeIntField(1)
      }),
      languages: makeStringField(),
      talents: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
        system: makeTalentSchema(),
        description: new foundry.data.fields.SchemaField({
          value: makeStringField()
        }),
        id: makeStringField(),
        name: makeStringField(),
        pack: makeStringField(),
        selected: makeBoolField(),
        uuid: makeStringField()
      })),
      languagelist: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
        system: makeLanguageSchema(),
        description: new foundry.data.fields.SchemaField({
          value: makeStringField()
        }),
        id: makeStringField(),
        name: makeStringField(),
        pack: makeStringField(),
        selected: makeBoolField(),
        uuid: makeStringField()
      })),
      editTalents: makeBoolField(),
      editAncestry: makeBoolField(true)
    }
  }
}