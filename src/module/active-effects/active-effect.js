export const addEffect = (key, value) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
  priority: 0
})

export const concatDiceEffect = (key, value) => ({
  key: key,
  value: value ? "+" + String(value) : null,
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
  priority: 0
})

export const concatString = (key, value, separator = '') => ({
  key: key,
  value: value ? value + separator : null,
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
  priority: 0
})


export const overrideEffect = (key, value) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
  priority: 0
})

export const upgradeEffect = (key, value) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
  priority: 0
})

export const downgradeEffect = (key, value) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.DOWNGRADE,
  priority: 0
})

export const addObject = (key, value) => ({
  key: key,
  value: JSON.stringify(value),
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
  priority: 0
})

const falsyChangeFilter = (change) => Boolean(change.value)

/* -------------------------------------------- */

export class DLActiveEffects {

  static removeAllEffects(document) {
    const ids = document.effects.map((effect) => effect._id)
    return document.deleteEmbeddedDocuments('ActiveEffect', ids)
  }

  static removeEffectsByOrigin(document, effectOrigin) {
    const originID = effectOrigin.uuid
    const ids = document.getEmbeddedCollection('ActiveEffect')
      .filter((effect) => effect.data.origin.includes(originID))
      .map((effect) => effect._id)
    return document.deleteEmbeddedDocuments('ActiveEffect', ids)
  }

  static addUpdateEffectsToDocument(document, effectDataList) {
    const effectsToAdd = []
    const effectsToUpd = []
    // Inject the _id of already present effects (that have the same name and source)
    // into the effectDataList for updating the document's effect list with the new values
    effectDataList.forEach((effectData) => {
      for (let embeddedEffect of document.effects)
        if (embeddedEffect.data.label === effectData.label && embeddedEffect.data.origin === effectData.origin) {
          effectData._id = embeddedEffect.data._id
          effectsToUpd.push(effectData)
          return
        }
      effectsToAdd.push(effectData)
    })

    // Update or add the effects
    document.updateEmbeddedDocuments('ActiveEffect', effectsToUpd, {diff: false})
    document.createEmbeddedDocuments('ActiveEffect', effectsToAdd)
  }

  static generateEffectDataFromAncestry(demonlordItem) {
    const dataL0 = demonlordItem.data.data
    //console.log("Demonlord | fromAncestry | ancestryItemData", demonlordItem)

    const effectDataL0 = {
      label: demonlordItem.name + " level 0",
      icon: demonlordItem.img,
      origin: demonlordItem.uuid,
      transfer: true,
      duration: {},
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
        addEffect('data.attributes.perception.value', dataL0.characteristics.perceptionmodifier),
        addEffect('data.characteristics.defense', dataL0.characteristics.defensemodifier),
        addEffect('data.characteristics.health.max', dataL0.characteristics.healthmodifier),
        addEffect('data.characteristics.health.healingrate', dataL0.characteristics.healingratemodifier),
        addEffect('data.characteristics.power', dataL0.characteristics.power),
        overrideEffect('data.characteristics.size', dataL0.characteristics.size),
        addEffect('data.characteristics.speed', dataL0.characteristics.speed - 10),
      ].filter(falsyChangeFilter)
    }

    const dataL4 = demonlordItem.data.data.level4
    const effectDataL4 = {
      label: demonlordItem.name + " level 4",
      icon: demonlordItem.img,
      origin: demonlordItem.uuid,
      transfer: true,
      duration: {},
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
  }

  static generateEffectDataFromPath(demonlordItem) {
    const pathdata = demonlordItem.data.data
    const effectDataList = []

    pathdata.levels.forEach(pathLevel => {
      const levelEffectData = {
        label: demonlordItem.name + " level " + pathLevel.level,
        icon: demonlordItem.img,
        origin: demonlordItem.uuid,
        transfer: true,
        duration: {},
        flags: {
          sourceType: 'path',
          levelRequired: parseInt(pathLevel.level),
          permanent: true
        },
        changes: [
          // Characteristics
          addEffect('data.characteristics.health.max', pathLevel.characteristicsHealth),
          addEffect('data.characteristics.power', pathLevel.characteristicsPower),
          addEffect('data.attributes.perception.value', pathLevel.characteristicsPerception),
          addEffect('data.characteristics.speed', pathLevel.characteristicsSpeed),
          addEffect('data.characteristics.defense', pathLevel.characteristicsDefense),

          // FIXME
          // addEffect('data.characteristics.insanityModifier', pathLevel.characteristicsInsanity),
          // addEffect('data.characteristics.corruptionModifier', pathLevel.characteristicsCorruption),

          // Selected checkbox (select two, three, fixed)
          addEffect('data.attributes.strength.value',
            pathLevel.attributeStrength * (pathLevel.attributeStrengthSelected || pathLevel.attributeSelectIsFixed)),
          addEffect('data.attributes.agility.value',
            pathLevel.attributeAgility * (pathLevel.attributeAgilitySelected || pathLevel.attributeSelectIsFixed)),
          addEffect('data.attributes.intellect.value',
            pathLevel.attributeIntellect * (pathLevel.attributeIntellectSelected || pathLevel.attributeSelectIsFixed)),
          addEffect('data.attributes.will.value',
            pathLevel.attributeWill * (pathLevel.attributeWillSelected || pathLevel.attributeSelectIsFixed)),
        ].filter(falsyChangeFilter)
      }

      // Two set attributes
      if (pathLevel.attributeSelectIsTwoSet) {

        const attributeOne = pathLevel.attributeSelectTwoSetSelectedValue1 ?
          pathLevel.attributeSelectTwoSet1 : pathLevel.attributeSelectTwoSet2
        const attributeTwo = pathLevel.attributeSelectTwoSetSelectedValue2 ?
          pathLevel.attributeSelectTwoSet3 : pathLevel.attributeSelectTwoSet4

        levelEffectData.changes.concat([
            addEffect(`data.attributes.${attributeOne}.value`, pathLevel.attributeSelectTwoSetValue1),
            addEffect(`data.attributes.${attributeTwo}.value`, pathLevel.attributeSelectTwoSetValue2),
          ].filter(falsyChangeFilter)
        )
      }

      effectDataList.push(levelEffectData)
    })

    console.log("Demonlord | fromAncestry | pathItemData", demonlordItem)
    return effectDataList
  }

  static generateEffectDataFromTalent(talentItem, pathLevelItem = {}) {
    const talentData = talentItem.data.data
    const effectData = {
      label: talentItem.name,
      icon: talentItem.img,
      origin: talentItem.uuid,
      disabled: ! (talentData.addtonextroll || talentData.isActive), //TODO: better enabled detection
      transfer: true,
      duration: {},
      flags: {
        sourceType: 'talent',
        // levelRequired: parseInt(pathLevelItem.level), TODO
        permanent: false
      },
      changes: [
        // Bonuses - Characteristics
        addEffect('data.characteristics.defense', talentData.bonuses.defense),
        addEffect('data.characteristics.health.max', talentData.bonuses.health),
        addEffect('data.characteristics.power', talentData.bonuses.power),
        addEffect('data.characteristics.speed', talentData.bonuses.speed),
      ].filter(falsyChangeFilter)
    }

    // --- Attack
    const action = talentData.action
    const attackChanges = [
      addEffect('data.bonuses.attack.boons.strength', action.boonsbanes * action.strengthboonsbanesselect),
      addEffect('data.bonuses.attack.boons.agility', action.boonsbanes * action.agilityboonsbanesselect),
      addEffect('data.bonuses.attack.boons.intellect', action.boonsbanes * action.intellectboonsbanesselect),
      addEffect('data.bonuses.attack.boons.will', action.boonsbanes * action.willboonsbanesselect),
      concatDiceEffect('data.bonuses.attack.damage', action.damage),
      concatDiceEffect('data.bonuses.attack.plus20Damage', action.plus20damage),
      concatString('data.bonuses.attack.extraEffect', action.extraEffect, '\n'),
    ].filter(falsyChangeFilter)

    if (attackChanges.length > 0) {
      attackChanges.push(addObject('data.bonuses.attack.sources', talentItem.uuid))
      effectData.changes = effectData.changes.concat(attackChanges)
    }

    // --- Challenge
    const challenge = talentData.challenge
    const challengeChanges = [
      addEffect('data.bonuses.challenge.boons.strength', challenge.boonsbanes * challenge.strengthboonsbanesselect),
      addEffect('data.bonuses.challenge.boons.agility', challenge.boonsbanes * challenge.agilityboonsbanesselect),
      addEffect('data.bonuses.challenge.boons.intellect', challenge.boonsbanes * challenge.intellectboonsbanesselect),
      addEffect('data.bonuses.challenge.boons.will', challenge.boonsbanes * challenge.willboonsbanesselect),
      addEffect('data.bonuses.challenge.boons.perception', challenge.boonsbanes * challenge.perceptionboonsbanesselect),
    ].filter(falsyChangeFilter)

    if (challengeChanges.length > 0) {
      challengeChanges.push(addObject('data.bonuses.challenge.sources', talentItem.uuid))
      effectData.changes = effectData.changes.concat(challengeChanges)
    }

    // -- VS Roll
    const vsRoll = talentData.vs
    const vsRollData = {
      attackModifier: vsRoll.attribute,
      defenseModifier: vsRoll.against,
      boons: vsRoll.boonsbanes,
      damages:
        [{damage: vsRoll.damage, type: vsRoll.damagetype}]
        .concat(vsRoll.damagetypes
          .filter(d => Boolean(d.damage))
          .map(d => ({damage: d.damage, type: d.damagetype}))
        )
    }
    if (Object.values(vsRollData).filter(val => Boolean(val)).length > 0){
      vsRollData.source = talentItem.uuid
      const vsRollChanges = addObject('data.bonuses.vsRoll', vsRollData)
      effectData.changes.push(vsRollChanges)
    }

    console.log(talentData)
    return [effectData]
  }

  static generateEffectDataFromArmor(armorItem) {
    const armorData = armorItem.data.data
    console.log(armorData)
    const effectData = {
      label: armorItem.name,
      icon: armorItem.img,
      origin: armorItem.uuid,
      transfer: true,
      duration: {},
      flags: {
        sourceType: 'armor',
        levelRequired: 0,
        permanent: false
      },
      changes: [
        addEffect('data.bonuses.armor.agility', armorData.agility),
        addEffect('data.bonuses.armor.defense', armorData.defense),
        upgradeEffect('data.bonuses.armor.fixed', armorData.fixed),
      ].filter(falsyChangeFilter)
    }
    // TODO FIXME: Armor requirements not met (-1 banes to rolls)
    return [effectData]
  }

  /**
   * Toggles the activation of an active effect based on its level requirements and current activation
   * @param actor
   */
  static toggleEffectsByActorRequirements(actor) {
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
    return actor.updateEmbeddedDocuments('ActiveEffect', notMetEffectsData)
  }
}
