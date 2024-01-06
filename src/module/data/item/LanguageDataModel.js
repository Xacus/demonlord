import { makeBoolField, makeHtmlField } from '../helpers.js'

export default class LanguageDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
      read: makeBoolField(),
      write: makeBoolField(),
      speak: makeBoolField(true)
    }
  }
}

export function makeLanguageSchema() {
  return new foundry.data.fields.SchemaField({
    description: makeHtmlField(),
    enrichedDescription: makeHtmlField(),
    read: makeBoolField(),
    write: makeBoolField(),
    speak: makeBoolField(true)
  })
}