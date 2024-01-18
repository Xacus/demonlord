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
          max: makeIntField(20),
          formula: makeStringField(),
          immune: makeBoolField()
        }),
        agility: new foundry.data.fields.SchemaField({
          value: makeIntField(10),
          min: makeIntField(),
          max: makeIntField(20),
          formula: makeStringField(),
          immune: makeBoolField()
        }),
        intellect: new foundry.data.fields.SchemaField({
          value: makeIntField(10),
          min: makeIntField(),
          max: makeIntField(20),
          formula: makeStringField(),
          immune: makeBoolField()
        }),
        will: new foundry.data.fields.SchemaField({
          value: makeIntField(10),
          min: makeIntField(),
          max: makeIntField(20),
          formula: makeStringField(),
          immune: makeBoolField()
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
        insanity: new foundry.data.fields.SchemaField({
          value: makeIntField(),
          formula: makeStringField(),
          immune: makeBoolField()
        }),
        corruption: new foundry.data.fields.SchemaField({
          value: makeIntField(),
          formula: makeStringField(),
          immune: makeBoolField()
        })
      }),
      level4: new foundry.data.fields.SchemaField({
        healthbonus: makeIntField(),
        option1: makeBoolField(true),
        option1text: makeStringField(),
        talent: new foundry.data.fields.ArrayField(levelItem(makeTalentSchema)),
        spells: new foundry.data.fields.ArrayField(levelItem(makeSpellSchema)),
        pickedTalents: new foundry.data.fields.ArrayField(new foundry.data.fields.ArrayField(levelItem(makeTalentSchema))),
        picks: makeIntField(1)
      }),
      languages: makeStringField(),
      talents: new foundry.data.fields.ArrayField(levelItem(makeTalentSchema)),
      languagelist: new foundry.data.fields.ArrayField(levelItem(makeLanguageSchema)),
      editTalents: makeBoolField(),
      editAncestry: makeBoolField(true)
    }
  }

  static migrateData(source) {
    if (parseInt(source.characteristics?.insanity)) {
      const insanity = parseInt(source.characteristics.insanity)
      source.characteristics.insanity = {
        value: insanity,
        formula: '',
        immune: false
      }

      const corruption = parseInt(source.characteristics?.corruption)
      source.characteristics.corruption = {
        value: corruption,
        formula: '',
        immune: false
      }
    }

    return super.migrateData(source)
  }
}