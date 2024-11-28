import { makeBoolField, makeHtmlField, makeIntField, makeStringField } from '../helpers.js'
import { makeLanguageSchema } from './LanguageDataModel.js'
import { makeSpellSchema } from './SpellDataModel.js'
import { makeTalentSchema } from './TalentDataModel.js'
import { levelItem } from '../common.js'

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
        attributes: new foundry.data.fields.SchemaField({
          strength: new foundry.data.fields.SchemaField({
            value: makeIntField(1, 20, 0),
            formula: makeStringField(),
            immune: makeBoolField(),
            selected: makeBoolField(),
          }),
          agility: new foundry.data.fields.SchemaField({
            value: makeIntField(1, 20, 0),
            formula: makeStringField(),
            immune: makeBoolField(),
            selected: makeBoolField(),
          }),
          intellect: new foundry.data.fields.SchemaField({
            value: makeIntField(1, 20, 0),
            formula: makeStringField(),
            immune: makeBoolField(),
            selected: makeBoolField(),
          }),
          will: new foundry.data.fields.SchemaField({
            value: makeIntField(1, 20, 0),
            formula: makeStringField(),
            immune: makeBoolField(),
            selected: makeBoolField(),
          }),
        }),
        characteristics: new foundry.data.fields.SchemaField({
          health: makeIntField(),
          healingrate: makeIntField(),
          size: makeStringField('1'),
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
        languages: new foundry.data.fields.ArrayField(levelItem(makeLanguageSchema)),
      })),
      editPath: makeBoolField(true)
    }
  }

  static migrateData(source) {
  // Move separate attribute and characteristics properties into their respective objects
  if (source.levels?.length > 0 && source.levels[0].attributeStrength != undefined) {
    for (const level of source.levels) {
      level.attributes = {
        strength: {
          value: level.attributes?.strength?.value ?? level.attributeStrength,
          formula: level.attributes?.strength.formula,
          selected: level.attributes?.strength?.selected ?? level.attributeStrengthSelected
        },
        agility: {
          value: level.attributes?.agility?.value ?? level.attributeAgility,
          formula: level.attributes?.agility.formula,
          selected: level.attributes?.agility?.selected ?? level.attributeAgilitySelected
        },
        intellect: {
          value: level.attributes?.intellect?.value ?? level.attributeIntellect,
          formula: level.attributes?.intellect.formula,
          selected: level.attributes?.intellect?.selected ?? level.attributeIntellectSelected
        },
        will: {
          value: level.attributes?.will?.value ?? level.attributeWill,
          formula: level.attributes?.will.formula,
          selected: level.attributes?.will?.selected ?? level.attributeWillSelected
        }
      }

      level.characteristics = {
        health: level.characteristics?.health ?? level.characteristicsHealth,
        defense: level.characteristics?.defense ?? level.characteristicsDefense,
        perception: level.characteristics?.perception ?? level.characteristicsPerception,
        speed: level.characteristics?.speed ?? level.characteristicsSpeed,
        power: level.characteristics?.power ?? level.characteristicsPower,
        insanity: {
          value: level.characteristics?.insanity?.value ?? level.characteristicsInsanity,
          immune: level.characteristics?.insanity?.immune,
          formula: level.characteristics?.insanity?.formula
        },
        corruption: {
          value: level.characteristics?.corruption?.value ?? level.characteristicsCorruption,
          immune: level.characteristics?.corruption?.immune,
          formula: level.characteristics?.corruption?.formula
        }
      }
    }
  }

  return super.migrateData(source)
  }
}