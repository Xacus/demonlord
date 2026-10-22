import { makeHtmlField } from '../helpers.js'

export default class ProfessionDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      source: makeHtmlField(),
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
    }
  }
}

export function makeProfessionSchema() {
  return new foundry.data.fields.SchemaField({
      source: makeHtmlField(),
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
  })
}