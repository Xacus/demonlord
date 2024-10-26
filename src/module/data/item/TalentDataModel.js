import { action, activatedEffect } from '../common.js'
import { makeBoolField, makeHtmlField, makeStringField } from '../helpers.js'

export default class TalentDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      action: action(),
      activatedEffect: activatedEffect(),
      addtonextroll: makeBoolField(),
      multipleoptions: makeBoolField(),
      uses: new foundry.data.fields.SchemaField({
        value: makeStringField(),
        max: makeStringField()
      }),
      challenge: new foundry.data.fields.SchemaField({
        active: makeBoolField(true),
        attribute: makeStringField(),
        boonsbanesactive: makeBoolField(true),
        boonsbanesselect: makeStringField(),
        boonsbanes: makeStringField(),
        strengthboonsbanesselect: makeBoolField(),
        agilityboonsbanesselect: makeBoolField(),
        intellectboonsbanesselect: makeBoolField(),
        willboonsbanesselect: makeBoolField(),
        perceptionboonsbanesselect: makeBoolField(),
      }),
      healing: new foundry.data.fields.SchemaField({
        healactive: makeBoolField(true),
        healing: makeBoolField(),
        rate: makeStringField()
      }),
      damage: makeStringField(),
      damagetype: makeStringField(),
      bonuses: new foundry.data.fields.SchemaField({
        defenseactive: makeBoolField(true),
        defense: makeStringField(),
        healthactive: makeBoolField(true),
        health: makeStringField(),
        speedactive: makeBoolField(true),
        speed: makeStringField(),
        poweractive: makeBoolField(true),
        power: makeStringField()
      }),
      groupname: makeStringField(),
      isActive: makeBoolField()
    }
  }
}

export function makeTalentSchema() {
  return new foundry.data.fields.SchemaField({
    description: makeHtmlField(),
    enrichedDescription: makeHtmlField(),
    action: action(),
    activatedEffect: activatedEffect(),
    addtonextroll: makeBoolField(),
    multipleoptions: makeBoolField(),
    uses: new foundry.data.fields.SchemaField({
      value: makeStringField(),
      max: makeStringField()
    }),
    challenge: new foundry.data.fields.SchemaField({
      active: makeBoolField(true),
      attribute: makeStringField(),
      boonsbanesactive: makeBoolField(true),
      boonsbanesselect: makeStringField(),
      boonsbanes: makeStringField(),
      strengthboonsbanesselect: makeBoolField(),
      agilityboonsbanesselect: makeBoolField(),
      intellectboonsbanesselect: makeBoolField(),
      willboonsbanesselect: makeBoolField(),
      perceptionboonsbanesselect: makeBoolField(),
    }),
    healing: new foundry.data.fields.SchemaField({
      healactive: makeBoolField(true),
      healing: makeBoolField(),
      rate: makeStringField()
    }),
    damage: makeStringField(),
    damagetype: makeStringField(),
    extraeffect: makeStringField(),
    bonuses: new foundry.data.fields.SchemaField({
      defenseactive: makeBoolField(true),
      defense: makeStringField(),
      healthactive: makeBoolField(true),
      health: makeStringField(),
      speedactive: makeBoolField(true),
      speed: makeStringField(),
      poweractive: makeBoolField(true),
      power: makeStringField()
    }),
    groupname: makeStringField(),
    isActive: makeBoolField()
  })
}