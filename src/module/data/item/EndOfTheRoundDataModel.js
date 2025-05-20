
import { action, activatedEffect } from '../common.js'

import {
  makeHtmlField,
} from '../helpers.js'

export default class EndOfTheRoundDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      source: makeHtmlField(),
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      action: action(),
      activatedEffect: activatedEffect(),
    }
  }
}

export function makeEndOfTheRoundSchema() {
  return new foundry.data.fields.SchemaField({
    source: makeHtmlField(),
    description: makeHtmlField(),
    enrichedDescription: makeHtmlField(),
    action: action(),
    activatedEffect: activatedEffect(),
  })
}