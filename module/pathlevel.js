export class PathLevel {
  constructor (obj) {
    if (obj === undefined) {
      obj = {}
    }
    if (typeof obj === 'string') {
      obj = JSON.parse(obj)
    }

    this.level = obj.level || 0
    this.attributeSelect = obj.attributeSelect || ''
    this.attributeSelectIsChooseTwo = obj.attributeSelectIsChooseTwo || false
    this.attributeSelectIsChooseThree =
      obj.attributeSelectIsChooseThree || false
    this.attributeSelectIsFixed = obj.attributeSelectIsFixed || false
    this.attributeSelectIsTwoSet = obj.attributeSelectIsTwoSet || false

    this.attributeSelectTwoSet1 = obj.attributeSelectTwoSet1 || ''
    this.attributeSelectTwoSet2 = obj.attributeSelectTwoSet2 || ''
    this.attributeSelectTwoSet3 = obj.attributeSelectTwoSet3 || ''
    this.attributeSelectTwoSet4 = obj.attributeSelectTwoSet4 || ''
    this.attributeSelectTwoSet1Label = obj.attributeSelectTwoSet1Label || ''
    this.attributeSelectTwoSet2Label = obj.attributeSelectTwoSet2Label || ''
    this.attributeSelectTwoSet3Label = obj.attributeSelectTwoSet3Label || ''
    this.attributeSelectTwoSet4Label = obj.attributeSelectTwoSet4Label || ''

    this.attributeSelectTwoSetValue1 = obj.attributeSelectTwoSetValue1 || 0
    this.attributeSelectTwoSetValue2 = obj.attributeSelectTwoSetValue2 || 0
    this.attributeSelectTwoSetSelectedValue1 =
      obj.attributeSelectTwoSetSelectedValue1 || true
    this.attributeSelectTwoSetSelectedValue2 =
      obj.attributeSelectTwoSetSelectedValue2 || true

    this.attributeStrength = obj.attributeStrength || 0
    this.attributeAgility = obj.attributeAgility || 0
    this.attributeIntellect = obj.attributeIntellect || 0
    this.attributeWill = obj.attributeWill || 0
    this.attributeStrengthSelected = obj.attributeStrengthSelected || false
    this.attributeAgilitySelected = obj.attributeAgilitySelected || false
    this.attributeIntellectSelected = obj.attributeIntellectSelected || false
    this.attributeWillSelected = obj.attributeWillSelected || false

    this.characteristicsPerception = obj.characteristicsPerception || 0
    this.characteristicsDefense = obj.characteristicsDefense || 0
    this.characteristicsPower = obj.characteristicsPower || 0
    this.characteristicsSpeed = obj.characteristicsSpeed || 0
    this.characteristicsHealth = obj.characteristicsHealth || 0
    this.characteristicsCorruption = obj.characteristicsCorruption || 0

    this.languagesText = obj.languagesText || ''
    this.equipmentText = obj.equipmentText || ''
    this.magicText = obj.magicText || ''

    this.talentsSelect = obj.talentsSelect || ''
    this.talentsChooseOne = obj.talentsChooseOne || false
    this.talentsSelected = obj.talentsSelected || []
    this.talents = obj.talents || []
    this.spells = obj.spells || []
    this.talentspick = obj.talents || []
  }
}

export class PathLevelItem {
  constructor (obj) {
    if (obj === undefined) {
      obj = {}
    }
    if (typeof obj === 'string') {
      obj = JSON.parse(obj)
    }

    this.id = obj.id || ''
    this.name = obj.name || ''
    this.description = obj.description || ''
  }
}

export class DamageType {
  constructor (obj) {
    if (obj === undefined) {
      obj = {}
    }
    if (typeof obj === 'string') {
      obj = JSON.parse(obj)
    }

    this.damage = obj.damage || ''
    this.damagetype = obj.damagetype || ''
  }
}
