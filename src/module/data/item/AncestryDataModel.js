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

export default class AncestryDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      source: makeHtmlField(),
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      levels: new foundry.data.fields.ArrayField(new foundry.data.fields.ObjectField({
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
        attributes: new foundry.data.fields.SchemaField({
          strength: new foundry.data.fields.SchemaField({
            value: makeIntField(0, 20, 0),
            formula: makeStringField(),
            immune: makeBoolField(),
            selected: makeBoolField(),
          }),
          agility: new foundry.data.fields.SchemaField({
            value: makeIntField(0, 20, 0),
            formula: makeStringField(),
            immune: makeBoolField(),
            selected: makeBoolField(),
          }),
          intellect: new foundry.data.fields.SchemaField({
            value: makeIntField(0, 20, 0),
            formula: makeStringField(),
            immune: makeBoolField(),
            selected: makeBoolField(),
          }),
          will: new foundry.data.fields.SchemaField({
            value: makeIntField(0, 20, 0),
            formula: makeStringField(),
            immune: makeBoolField(),
            selected: makeBoolField(),
          }),
        }),
        characteristics: new foundry.data.fields.SchemaField({
          health: makeIntField(),
          healingRate: makeIntField(),
          size: makeStringField(),
          defense: makeIntField(),
          perception: makeIntField(),
          speed: makeIntField(),
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
        languagesText: makeStringField(),
        equipmentText: makeStringField(),
        magicText: makeStringField(),
        optionsText: makeStringField(),
        talentsSelect: makeStringField(),
        talentsChooseOne: makeBoolField(false),
        talentsSelected: new foundry.data.fields.ArrayField(levelItem(makeTalentSchema)),
        talents: new foundry.data.fields.ArrayField(levelItem(makeTalentSchema)),
        spells: new foundry.data.fields.ArrayField(levelItem(makeSpellSchema)),
        talentspick: new foundry.data.fields.ArrayField(levelItem(makeTalentSchema)),
        languages: new foundry.data.fields.ArrayField(levelItem(makeLanguageSchema))
      })),
      editTalents: makeBoolField(),
      editAncestry: makeBoolField(true)
    }
  }

  // static migrateData(source) { }
}