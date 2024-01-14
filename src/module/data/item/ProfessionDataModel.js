import { makeHtmlField } from '../helpers.js'

export default class ProfessionDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
    }
  }
}