const addEffect = (key, value) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
  priority: 0
})


const overrideEffect = (key, value) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
  priority: 0
})

const falsyChangeFilter = (change) => Boolean(change.value)

export class DLActiveEffects {

  static removeEffects(document) {
    const ids = document.effects.map((effect) => effect._id)
    return document.deleteEmbeddedDocuments('ActiveEffect', ids)
  }

  static generateEffectDataFromAncestry(demonlordItem) {
    const dataL0 = demonlordItem.data.data
    console.log("Demonlord | fromAncestry | ancestryItemData", demonlordItem)

    const effectDataL0 = {
      label: demonlordItem.name + " level 0",
      icon: demonlordItem.img,
      origin: demonlordItem.uuid,
      transfer: true,
      flags: {
        sourceType: 'ancestry',
        levelRequired: 0,
        permanent: true
      },
      changes: [
        addEffect('data.attributes.strength.value', dataL0.attributes.strength.value - 10),
        addEffect('data.attributes.agility.value', dataL0.attributes.agility.value - 10),
        addEffect('data.attributes.intellect.value', dataL0.attributes.intellect.value - 10),
        addEffect('data.attributes.will.value', dataL0.attributes.will.value - 10),
        addEffect('data.attributes.perception.value', dataL0.characteristics.perception),
        addEffect('data.characteristics.defense', dataL0.characteristics.defensemodifier),
        addEffect('data.characteristics.health.max', dataL0.characteristics.healthmodifier),
        addEffect('data.characteristics.health.healingrate', dataL0.characteristics.healingratemodifier),
        addEffect('data.characteristics.power', dataL0.characteristics.power),
        overrideEffect('data.characteristics.size', dataL0.characteristics.size),
        overrideEffect('data.characteristics.speed', dataL0.characteristics.speed),
      ].filter(falsyChangeFilter)
    }

    const dataL4 = demonlordItem.data.data.level4
    const effectDataL4 = {
      label: demonlordItem.name + " level 4",
      icon: demonlordItem.img,
      origin: demonlordItem.uuid,
      transfer: true,
      flags: {
        sourceType: 'ancestry',
        levelRequired: 4,
        permanent: true
      },
      changes: [
        addEffect('data.characteristics.health.max', dataL4.healthbonus),
      ].filter(falsyChangeFilter)
    }
    return [effectDataL0, effectDataL4]
    // demonlordItem.createEmbeddedDocuments('ActiveEffect', [effectDataL0, effectDataL4])
  }

  /**
   * Toggles the activation of an active effect based on its level requirements and current activation
   * @param actor
   */
  static async toggleEffectsByActorRequirements(actor) {
    const notMetEffectsData = actor.effects
      .filter((effect) =>
        effect.data.flags?.levelRequired > actor.data.data.level && !effect.data.disabled ||
        effect.data.flags?.levelRequired <= actor.data.data.level && effect.data.disabled
      )
      .map((effect) => ({
          _id: effect.data._id,
          disabled: !effect.data.disabled
        })
      )
    return await actor.updateEmbeddedDocuments('ActiveEffect', notMetEffectsData)
  }
}
