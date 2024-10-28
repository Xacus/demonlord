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
        attributeAgility: makeIntField(1),
        attributeIntellect: makeIntField(1),
        attributeWill: makeIntField(1),
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
        optionsText: makeStringField(),
        talentsSelect: makeStringField(),
        talentsChooseOne: makeBoolField(false),
        talentsSelected: new foundry.data.fields.ArrayField(levelItem(makeTalentSchema)),
        talents: new foundry.data.fields.ArrayField(levelItem(makeTalentSchema)),
        spells: new foundry.data.fields.ArrayField(levelItem(makeSpellSchema)),
        talentspick: new foundry.data.fields.ArrayField(levelItem(makeTalentSchema)),
        languages: new foundry.data.fields.ArrayField(levelItem(makeLanguageSchema))
      })),
      languages: makeStringField(),
      talents: new foundry.data.fields.ArrayField(levelItem(makeTalentSchema)),
      languagelist: new foundry.data.fields.ArrayField(levelItem(makeLanguageSchema)),
      equipment: makeStringField(),
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

    // Update from level4 to any number of levels
    if (source.level4 && !source.levels) {

      if (!source.levels) source.levels = []

      source.levels = source.levels.concat([
        {
          level: '4',
          attributeselect: '',
          characteristicsHealth: source.level4.healthbonus,
          // option1 is not in use
          // option1text is not in use, but let's add it anyways
          optionsText: source.option1text,
          talents: source.level4.talent,
          spells: source.level4.spells,
          talentsSelected: source.level4.pickedTalents,
          // picks is not in use
        }
      ])
    }

    return super.migrateData(source)
  }
}