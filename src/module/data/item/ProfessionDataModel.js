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