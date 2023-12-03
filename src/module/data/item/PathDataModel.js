import { makeBoolField, makeHtmlField, makeStringField } from '../helpers.js'

export default class PathDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      type: makeStringField('novice'),
      levels: new foundry.data.fields.ArrayField(makeStringField()),
      editPath: makeBoolField(true)
    }
  }
}