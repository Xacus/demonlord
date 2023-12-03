import {
    makeIntField,
    makeStringField,
    makeHtmlField,
    makeBoolField
  } from '../helpers.js'
  
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
        charactaristics: new foundry.data.fields.SchemaField({
          perceptionmodifier: makeIntField(),
          healthmodifier: makeIntField(),
          defensemodifier: makeIntField(),
          healingratemodifier: makeIntField(),
          size: makeStringField(),
          speed: makeIntField(10),
          power: makeIntField(),
          insanity: makeIntField(),
          corruption: makeIntField(),
          difficulty: makeIntField()
        }),
        frightening: makeBoolField(),
        horrifying: makeBoolField(),
        talents: new foundry.data.fields.ArrayField(makeStringField()),
        specialActions: new foundry.data.fields.ArrayField(makeStringField()),
        weapons: new foundry.data.fields.ArrayField(makeStringField()),
        spells: new foundry.data.fields.ArrayField(makeStringField()),
        endOfRound: new foundry.data.fields.ArrayField(makeStringField()),
        editTalents: makeBoolField(),
        editRole: makeBoolField(true)
      }
    }
  }