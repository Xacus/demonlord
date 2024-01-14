import { makeHtmlField } from '../helpers.js'

export default class FeatureDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: makeHtmlField(),
      enrichedDescription: makeHtmlField(),
    }
  }
}