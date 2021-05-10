export class DLActiveEffectConfig extends ActiveEffectConfig {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sheet", "active-effect-sheet"],
      template: "systems/demonlord08/templates/item/active-effect-config.html",
      width: 560,
      height: "auto",
      tabs: [{navSelector: ".tabs", contentSelector: "form", initial: "details"}]
    });
  }

  /** @override */
  getData(options) {
    const effect = foundry.utils.deepClone(this.object.data);
    return {
      effect: effect, // Backwards compatibility
      data: foundry.utils.deepClone(this.object.data),
      isActorEffect: this.object.parent.entity === "Actor",
      isItemEffect: this.object.parent.entity === "Item",
      submitText: "EFFECT.Submit",
      availableChangeKeys: DLActiveEffectConfig._availableChangeKeys,
      modes: Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
        obj[e[1]] = game.i18n.localize("EFFECT.MODE_" + e[0]);
        return obj;
      }, {})
    };
  }

  static _availableChangeKeys = {
    // <key> : <label>
    // TODO: localization
    // No change
    '': '-',
    // Attributes
    'data.attributes.strength.value': 'data.attributes.strength.value',
    'data.attributes.agility.value': 'data.attributes.agility.value',
    'data.attributes.intellect.value': 'data.attributes.intellect.value',
    'data.attributes.will.value': 'data.attributes.will.value',
    'data.attributes.perception.value': 'data.attributes.perception.value',
    // Characteristics
    'data.characteristics.speed': 'data.characteristics.speed',
    'data.characteristics.defense': 'data.characteristics.defense',
    'data.characteristics.power': 'data.characteristics.power',
    'data.characteristics.size': 'data.characteristics.size',
    'data.characteristics.health.max': 'data.characteristics.health.max',
    'data.characteristics.health.healingrate': 'data.characteristics.health.healingrate',
    'data.characteristics.health.insanity.max': 'data.characteristics.health.insanity.max',
    // Attack bonuses
    'data.bonuses.attack.boons.strength': 'data.bonuses.attack.boons.strength',
    'data.bonuses.attack.boons.agility': 'data.bonuses.attack.boons.agility',
    'data.bonuses.attack.boons.intellect': 'data.bonuses.attack.boons.intellect',
    'data.bonuses.attack.boons.will': 'data.bonuses.attack.boons.will',
    'data.bonuses.attack.boons.perception': 'data.bonuses.attack.boons.perception',
    'data.bonuses.attack.damage': 'data.bonuses.attack.damage',
    'data.bonuses.attack.plus20Damage': 'data.bonuses.attack.plus20Damage',
    'data.bonuses.attack.extraEffect': 'data.bonuses.attack.extraEffect',
    // Challenge bonuses
    'data.bonuses.challenge.boons.strength': 'data.bonuses.challenge.boons.strength',
    'data.bonuses.challenge.boons.agility': 'data.bonuses.challenge.boons.agility',
    'data.bonuses.challenge.boons.intellect': 'data.bonuses.challenge.boons.intellect',
    'data.bonuses.challenge.boons.will': 'data.bonuses.challenge.boons.will',
    'data.bonuses.challenge.boons.perception': 'data.bonuses.challenge.boons.perception',
    // Armor bonuses
    'data.bonuses.armor.fixed': 'data.bonuses.armor.fixed',
    'data.bonuses.armor.agility': 'data.bonuses.armor.agility',
    'data.bonuses.armor.defense': 'data.bonuses.armor.defense',
    'data.bonuses.armor.override': 'data.bonuses.armor.override',
    // Defense
    'data.bonuses.defense.spell': 'data.bonuses.defense.spell',
    'data.bonuses.defense.defense': 'data.bonuses.defense.defense',
    'data.bonuses.defense.strength': 'data.bonuses.defense.strength',
    'data.bonuses.defense.agility': 'data.bonuses.defense.agility',
    'data.bonuses.defense.intellect': 'data.bonuses.defense.intellect',
    'data.bonuses.defense.will': 'data.bonuses.defense.will',
    'data.bonuses.defense.perception': 'data.bonuses.defense.perception',
    // AutoFail challenge malus
    'data.maluses.autoFail.challenge.strength': 'data.maluses.autoFail.challenge.strength',
    'data.maluses.autoFail.challenge.agility': 'data.maluses.autoFail.challenge.agility',
    'data.maluses.autoFail.challenge.intellect': 'data.maluses.autoFail.challenge.intellect',
    'data.maluses.autoFail.challenge.will': 'data.maluses.autoFail.challenge.will',
    'data.maluses.autoFail.challenge.perception': 'data.maluses.autoFail.challenge.perception',
    // AutoFail action malus
    'data.maluses.autoFail.action.strength': 'data.maluses.autoFail.action.strength',
    'data.maluses.autoFail.action.agility': 'data.maluses.autoFail.action.agility',
    'data.maluses.autoFail.action.intellect': 'data.maluses.autoFail.action.intellect',
    'data.maluses.autoFail.action.will': 'data.maluses.autoFail.action.will',
    'data.maluses.autoFail.action.perception': 'data.maluses.autoFail.action.perception',
  }
}
