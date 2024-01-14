import { makeBoolField, makeHtmlField, makeIntField, makeStringField } from '../helpers.js'
import { makeLanguageSchema } from './LanguageDataModel.js'
import { makeSpellSchema } from './SpellDataModel.js'
import { makeTalentSchema } from './TalentDataModel.js'

export default class PathDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      type: makeStringField('novice'),
      levels: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
        level: makeStringField('1'),
        attributeSelect: makeStringField('choosetwo'),
        attributeSelectIsChooseTwo: makeBoolField(true),
        attributeSelectIsChooseThree: makeBoolField(false),
        attributeSelectIsFixed: makeBoolField(false),
        attributeSelectIsTwoSet: makeBoolField(false),
        attributeSelectTwoSet1: makeStringField(),
        attributeSelectTwoSet2: makeStringField(),
        attributeSelectTwoSet3: makeStringField(),
        attributeSelectTwoSet4: makeStringField(),
        attributeSelectTwoSet1Label: makeStringField('DL.Attribute'),
        attributeSelectTwoSet2Label: makeStringField('DL.Attribute'),
        attributeSelectTwoSet3Label: makeStringField('DL.Attribute'),
        attributeSelectTwoSet4Label: makeStringField('DL.Attribute'),
        attributeSelectTwoSetValue1: makeIntField(),
        attributeSelectTwoSetValue2: makeIntField(),
        attributeSelectTwoSetSelectedValue1: makeBoolField(true),
        attributeSelectTwoSetSelectedValue2: makeBoolField(true),
        attributeStrength: makeIntField(1),
        attributeAgility: makeIntField(),
        attributeIntellect: makeIntField(1),
        attributeWill: makeIntField(),
        attributeStrengthSelected: makeBoolField(false),
        attributeAgilitySelected: makeBoolField(false),
        attributeIntellectSelected: makeBoolField(false),
        attributeWillSelected: makeBoolField(false),
        characteristicsPerception: makeIntField(),
        characteristicsDefense: makeIntField(),
        characteristicsPower: makeIntField(),
        characteristicsSpeed: makeIntField(),
        characteristicsHealth: makeIntField(),
        characteristicsCorruption: makeIntField(),
        characteristicsInsanity: makeIntField(),
        languagesText: makeStringField(),
        equipmentText: makeStringField(),
        magicText: makeStringField(),
        talentsSelect: makeStringField(),
        talentsChooseOne: makeBoolField(false),
        talentsSelected: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
          system: makeTalentSchema(),
          description: makeStringField(),
          id: makeStringField(),
          name: makeStringField(),
          pack: makeStringField(),
          selected: makeBoolField(),
          uuid: makeStringField()
        })),
        talents: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
          system: makeTalentSchema(),
          description: makeStringField(),
          id: makeStringField(),
          name: makeStringField(),
          pack: makeStringField(),
          selected: makeBoolField(),
          uuid: makeStringField()
        })),
        spells: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
          system: makeSpellSchema(),
          description: makeStringField(),
          id: makeStringField(),
          name: makeStringField(),
          pack: makeStringField(),
          selected: makeBoolField(),
          uuid: makeStringField()
        })),
        talentspick: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
          system: makeTalentSchema(),
          description: makeStringField(),
          id: makeStringField(),
          name: makeStringField(),
          pack: makeStringField(),
          selected: makeBoolField(),
          uuid: makeStringField()
        })),
        languages: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
          system: makeLanguageSchema(),
          description: makeStringField(),
          id: makeStringField(),
          name: makeStringField(),
          pack: makeStringField(),
          selected: makeBoolField(),
          uuid: makeStringField()
        }))
      })),
      editPath: makeBoolField(true)
    }
  }
}