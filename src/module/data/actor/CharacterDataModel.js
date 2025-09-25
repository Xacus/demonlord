import {
  attributes,
  characteristics,
  wealth
} from '../common.js'

import {
  makeIntField,
  makeBoolField,
  makeStringField,
  makeHtmlField
} from '../helpers.js'

import {
  getRanges,
  getCanFly
} from '../../utils/token-ruler.js'

export default class CharacterDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const type = 'character'

    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      attributes: attributes(),
      characteristics: characteristics(type),
      isPC: makeBoolField(true),
      fastturn: makeBoolField(),
      level: makeIntField(),
      ancestry: makeStringField(), // Unused
      religion: new foundry.data.fields.SchemaField({
        edit: makeBoolField(),
        value: makeStringField(),
        image: makeStringField('systems/demonlord/assets/icons/bird.webp')
      }),
      languages: new foundry.data.fields.SchemaField({
        edit: makeBoolField(),
        value: makeStringField()
      }),
      wealth: wealth(),
      // Unused
      professions: new foundry.data.fields.SchemaField({
        edit: makeBoolField(),
        value: makeStringField()
      }),
      // Unused
      features: new foundry.data.fields.SchemaField({
        edit: makeBoolField()
      }),
      // Unused
      paths: new foundry.data.fields.SchemaField({
        edit: makeBoolField(),
        novice: makeStringField(),
        expert: makeStringField(),
        master: makeStringField(),
        legendary: makeStringField()
      }),
      appearance: new foundry.data.fields.SchemaField({
        age: makeStringField(),
        sex: makeStringField(),
        eyes: makeStringField(),
        hair: makeStringField(),
        height: makeStringField(),
        weight: makeStringField(),
        feature: makeStringField(),
      }),
      gmnote: makeStringField(),
      gmnoteedit: makeBoolField(),
    }
  }

  get type() {
    return 'character'
  }

  get ranges() {
    return getRanges(this)
  }

  get canFly() {
    return getCanFly(this)
  }
}
