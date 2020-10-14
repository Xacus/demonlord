export class CharacterBuff {
    constructor(obj) {
        if (obj === undefined) {
            obj = {};
        }
        if (typeof (obj) === "string") {
            obj = JSON.parse(obj);
        }
        this.attackbonus = obj.attackbonus || 0;
        this.attackdamagebonus = obj.attackdamagebonus || "";
        this.attack20plusdamagebonus = obj.attack20plusdamagebonus || "";
        this.attackeffects = obj.attackeffects || "";
        this.challengebonus = obj.challengebonus || 0;
        this.challengeeffects = obj.challengeeffects || "";
        this.defensebonus = obj.defensebonus || 0;
        this.healthbonus = obj.healthbonus || 0;
        this.powerbonus = obj.powerbonus || 0;
        this.speedbonus = obj.speedactive || 0;
        this.healing = obj.healing || 0;
        this.strength = obj.strength || 0;
        this.agility = obj.agility || 0;
        this.intellect = obj.intellect || 0;
        this.will = obj.will || 0;
        this.perception = obj.perception || 0;
    }
}
