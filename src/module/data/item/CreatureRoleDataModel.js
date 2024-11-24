import {
  makeIntField,
  makeStringField,
  makeHtmlField,
  makeBoolField,
  makeInsanity,
  makeCorruption
} from '../helpers.js'
import { levelItem } from '../common.js'
import { makeTalentSchema } from './TalentDataModel.js'
import { makeSpellSchema } from './SpellDataModel.js'
import { makeWeaponSchema } from './WeaponDataModel.js'
import { makeEndOfTheRoundSchema } from './EndOfTheRoundDataModel.js'
  
  export default class CreatureRoleDataModel extends foundry.abstract.DataModel {
    static defineSchema() {
      return {
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
          speed: makeIntField(10),
          power: makeIntField(),
          insanity: makeInsanity(),
          corruption: makeCorruption(),
          difficulty: makeIntField()
        }),
        frightening: makeBoolField(),
        horrifying: makeBoolField(),
        talents: new foundry.data.fields.ArrayField(levelItem(makeTalentSchema)),
        specialActions: new foundry.data.fields.ArrayField(levelItem(makeTalentSchema)),
        weapons: new foundry.data.fields.ArrayField(levelItem(makeWeaponSchema)),
        spells: new foundry.data.fields.ArrayField(levelItem(makeSpellSchema)),
        endOfRound: new foundry.data.fields.ArrayField(levelItem(makeEndOfTheRoundSchema)),
        editTalents: makeBoolField(),
        editRole: makeBoolField(true)
      }
    }
  }