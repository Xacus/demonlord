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
      magic: makeBoolField(false),
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

    // Move attributes and characteristics into a new level 0
    if (source.attributes && (!source.levels || source.levels?.filter(l => l.level === '0').length === 0)) {
      if (!source.levels) source.levels = []

      source.levels = [{
        level: '0',
        attributes: source.attributes,
        characteristics: {
          health: source.characteristics.healthmodifier,
          healingRate: source.characteristics.healingratemodifier,
          size: source.characteristics.size,
          defense: source.characteristics.defensemodifier,
          perception: source.characteristics.perceptionmodifier,
          speed: source.characteristics.speed,
          power: source.characteristics.power,
          insanity: source.characteristics.insanity,
          corruption: source.characteristics.corruption
        },
        talents: source.talents,
        talentspick: [],
        spells: [],
        languages: source.languagelist
      }, ...source.levels]
    }

    // Update from level4 to any number of levels
    if (source.level4 && (!source.levels || source.levels?.filter(l => l.level === '4').length === 0)) {
      if (!source.levels) source.levels = []

      source.levels = source.levels.concat([
        {
          level: '4',
          attributeSelect: '',
          characteristics: {
            health: source.level4.healthbonus,
          },
          // option1 is not in use
          // option1text is not in use, but let's add it anyways
          optionsText: source.level4.option1text,
          talents: source.level4.talent,
          spells: source.level4.spells,
          talentsSelected: source.level4.pickedTalents,
          talentspick: source.level4.pickedTalents,
          languages: []
          // picks is not in use
        }
      ])
    }

    // Move separate attribute and characteristics properties into their respective objects
    if (source.levels?.length > 0 && source.levels[source.levels.length - 1].attributeStrength != undefined) {
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
