import { contents } from '../common.js'

import { makeStringField, makeIntField, makeHtmlField } from '../helpers.js'

export default class RelicDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      contents: contents(),
      requirement: new foundry.data.fields.SchemaField({
        attribute: makeStringField(),
        minvalue: makeIntField()
      }),
    }
  }
}