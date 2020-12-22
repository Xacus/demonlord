export class CharacterBuff {
  constructor (obj) {
    if (obj === undefined) {
      obj = {}
    }
    if (typeof obj === 'string') {
      obj = JSON.parse(obj)
    }
    this.attackbonus = obj.attackbonus || 0
    this.attackdamagebonus = obj.attackdamagebonus || ''
    this.attackstrengthbonus = obj.attackstrengthbonus || 0
    this.attackagilitybonus = obj.attackagilitybonus || 0
    this.attackintellectbonus = obj.attackintellectbonus || 0
    this.attackwillbonus = obj.attackwillbonus || 0
    this.attackperceptionbonus = obj.attackperceptionbonus || 0
    this.attack20plusdamagebonus = obj.attack20plusdamagebonus || ''
    this.attackeffects = obj.attackeffects || ''
    this.challengebonus = obj.challengebonus || 0
    this.challengestrengthbonus = obj.challengestrengthbonus || 0
    this.challengeagilitybonus = obj.challengeagilitybonus || 0
    this.challengeintellectbonus = obj.challengeintellectbonus || 0
    this.challengewillbonus = obj.challengewillbonus || 0
    this.challengeperceptionbonus = obj.challengeperceptionbonus || 0
    this.challengeeffects = obj.challengeeffects || ''
    this.defensebonus = obj.defensebonus || 0
    this.healthbonus = obj.healthbonus || 0
    this.speedbonus = obj.speedbonus || 0
    this.powerbonus = obj.powerbonus || 0
    this.healing = obj.healing || 0
    this.strength = obj.strength || 0
    this.agility = obj.agility || 0
    this.intellect = obj.intellect || 0
    this.will = obj.will || 0
    this.perception = obj.perception || 0
    this.armorRequirementMeet = obj.armorRequirementMeet || true
  }
}
