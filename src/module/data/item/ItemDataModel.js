import {
  action,
  activatedEffect,
  enchantment,
  contents
} from '../common.js'

import {
  makeBoolField,
  makeHtmlField,
  makeIntField,
  makeStringField
} from '../helpers.js'

export default class ItemDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      source: makeHtmlField(),
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      action: action(),
      activatedEffect: activatedEffect(),
      enchantment: enchantment(),
      contents: contents(),
      quantity: makeIntField(1),
      availability: makeStringField(),
      value: makeStringField(),
      wear: makeBoolField(true),
      healingoption: makeBoolField(),
      autoDestroy :  makeBoolField(false),
      consumabletype: makeStringField()
    }
  }
}