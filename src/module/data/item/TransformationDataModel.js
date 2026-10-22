import {
  makeIntField,
  makeStringField,
  makeHtmlField,
  makeBoolField,
  makeInsanity,
  makeCorruption,
} from '../helpers.js'
import { levelItem } from '../common.js'
import { makeLanguageSchema } from './LanguageDataModel.js'
import { makeProfessionSchema } from './ProfessionDataModel.js'
import { makeSpellSchema } from './SpellDataModel.js'

export default class TransformationDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      source: makeHtmlField(),
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      attributes: new foundry.data.fields.SchemaField({
        strength: makeIntField(),
        strengthImmune: makeBoolField(),
        agility: makeIntField(),
        agilityImmune: makeBoolField(),
        intellect: makeIntField(),
        intellectImmune: makeBoolField(),
        will: makeIntField(),
        willImmune: makeBoolField(),
      }),
      characteristics: new foundry.data.fields.SchemaField({
        perception: makeIntField(),
        health: makeIntField(),
        defense: makeIntField(),
        healingRate: makeIntField(),
        size: makeStringField(),
        speed: makeIntField(),
        power: makeIntField(),
        insanity: makeInsanity(),
        corruption: makeCorruption(),
      }),
      frightening: makeBoolField(),
      horrifying: makeBoolField(),
      languages: new foundry.data.fields.ArrayField(levelItem(makeLanguageSchema)),
      professions: new foundry.data.fields.ArrayField(levelItem(makeProfessionSchema)),
      spells: new foundry.data.fields.ArrayField(levelItem(makeSpellSchema)),
      editTransformation: makeBoolField(false),
    }
  }
}
