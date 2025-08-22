import { makeBoolField, makeHtmlField } from '../helpers.js'

export default class LanguageDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      source: makeHtmlField(),
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
    source: makeHtmlField(),
    description: makeHtmlField(),
    enrichedDescription: makeHtmlField(),
    read: makeBoolField(),
    write: makeBoolField(),
    speak: makeBoolField(true)
  })
}