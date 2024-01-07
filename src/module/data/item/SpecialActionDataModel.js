import { makeHtmlField } from '../helpers.js'

export default class SpecialActionDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
    }
  }
}