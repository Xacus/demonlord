import { DemonlordActor } from '../actor/actor'
import { plusify } from '../utils/utils'

export const multiplyEffect = (key, value, priority) => ({
  key: key,
  value: parseFloat(value),
  mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
  priority: priority
})

export const addEffect = (key, value, priority) => ({
  key: key,
  value: plusify(value),
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
  priority: priority
})

export const concatDiceEffect = (key, value) => ({
  key: key,
  value: value ? '+' + String(value) : null,
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
})

export const concatString = (key, value, separator = '') => ({
  key: key,
  value: value ? value + separator : null,
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
})

export const overrideEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
  priority: priority
})

export const overrideValue = (key, value, priority) => ({
  key: key,
  value: value,
  mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
  priority: priority
})

export const upgradeEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
  priority: priority
})

export const downgradeEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.DOWNGRADE,
  priority: priority
})

export const addObject = (key, value) => ({
  key: key,
  value: JSON.stringify(value),
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
})

const falsyChangeFilter = change => Boolean(change.value)

/* -------------------------------------------- */

export class DLActiveEffects {
  static async removeEffectsByOrigin(doc, originID) {
    const toDel = (doc instanceof DemonlordActor ? Array.from(doc.allApplicableEffects()) : doc.effects).filter(effect => effect?.origin?.includes(originID))

    const promises = []
    for await (const e of toDel) {
      promises.push(await e.delete({ parent: doc }))
    }
    return Promise.all(promises)
  }

  /* -------------------------------------------- */

  static async embedActiveEffects(actor, doc, operation = 'create') {
    let effectDataList = []
    switch (doc.type) {
      case 'ancestry':
        effectDataList = DLActiveEffects.generateEffectDataFromAncestry(doc, actor)
        break
      case 'path':
        effectDataList = DLActiveEffects.generateEffectDataFromPath(doc, actor)
        break
      case 'talent':
        effectDataList = DLActiveEffects.generateEffectDataFromTalent(doc, actor)
        break
      case 'armor':
        effectDataList = DLActiveEffects.generateEffectDataFromArmor(doc, actor)
        break
      case 'creaturerole':
        effectDataList = DLActiveEffects.generateEffectDataFromRole(doc)
        break
      default:
        return await Promise.resolve(0)
    }

    return await DLActiveEffects.addUpdateEffectsToActor(actor, effectDataList, operation)
  }

  static async addUpdateEffectsToActor(actor, effectDataList, operation) {
    if (operation === 'create') {
      effectDataList = effectDataList.filter(effectData => effectData.changes.length > 0)
      if (effectDataList.length > 0) await actor.createEmbeddedDocuments('ActiveEffect', effectDataList)
    } else if (operation === 'update' && effectDataList.length > 0) {
      const currentEffects = actor.effects.filter(e => e.origin === effectDataList[0]?.origin)
      const effectsToAdd = []
      const effectsToUpd = []
      const effectsToDel = []

      for (const effectData of effectDataList) {
        const u = currentEffects.find(ce => ce.flags?.slug === effectData?.flags?.slug)
        if (u) {
          effectData._id = u._id
          if (effectData.changes.length > 0) effectsToUpd.push(effectData)
          else effectsToDel.push(effectData._id)
        } else if (effectData.changes.length > 0) effectsToAdd.push(effectData)
      }

      if (effectsToAdd.length > 0) await actor.createEmbeddedDocuments('ActiveEffect', effectsToAdd)
      if (effectsToUpd.length > 0) await actor.updateEmbeddedDocuments('ActiveEffect', effectsToUpd)
      if (effectsToDel.length > 0) await actor.deleteEmbeddedDocuments('ActiveEffect', effectsToDel)
    }
    return await Promise.resolve()
  }

  /* -------------------------------------------- */

  static generateEffectDataFromAncestry(item, actor = null) {
    const priority = 1
    const ancestryData = item.system

    const effectDataList = [{
      name: `${item.name} (${game.i18n.localize('DL.CharLevel')} 0)`,
      icon: item.img,
      origin: item.uuid,
      disabled: false,
      transfer: false,
      duration: { startTime: 0 },
      flags: {
        sourceType: 'ancestry',
        levelRequired: 0,
        notDeletable: true,
        notEditable: true,
        notToggleable: true,
        permanent: true,
        slug: `ancestry-${item.name.toLowerCase()}-L0`,
      },
      changes: [
        addEffect('system.attributes.strength.value', ancestryData.attributes.strength.value - 10, priority),
        addEffect('system.attributes.agility.value', ancestryData.attributes.agility.value - 10, priority),
        addEffect('system.attributes.intellect.value', ancestryData.attributes.intellect.value - 10, priority),
        addEffect('system.attributes.will.value', ancestryData.attributes.will.value - 10, priority),
        addEffect('system.attributes.perception.value', ancestryData.characteristics.perceptionmodifier, priority),
        addEffect('system.attributes.strength.immune', ancestryData.attributes.strength.immune, priority),
        addEffect('system.attributes.agility.immune', ancestryData.attributes.agility.immune, priority),
        addEffect('system.attributes.intellect.immune', ancestryData.attributes.intellect.immune, priority),
        addEffect('system.attributes.will.immune', ancestryData.attributes.will.immune, priority),

        //addEffect('system.characteristics.insanity.value', ancestryData.characteristics.insanity.value, priority),
        //addEffect('system.characteristics.corruption.value', ancestryData.characteristics.corruption.value, priority),
        addEffect('system.characteristics.insanity.immune', ancestryData.characteristics.insanity.immune, priority),
        addEffect('system.characteristics.corruption.immune', ancestryData.characteristics.corruption.immune, priority),
        addEffect('system.characteristics.defense', ancestryData.characteristics.defensemodifier, priority),
        addEffect('system.characteristics.health.max', ancestryData.characteristics.healthmodifier, priority),
        addEffect('system.characteristics.health.healingrate', ancestryData.characteristics.healingratemodifier, priority),
        addEffect('system.characteristics.power', ancestryData.characteristics.power, priority),
        addEffect('system.characteristics.speed', ancestryData.characteristics.speed - 10, priority),
        {
          key: 'system.characteristics.size',
          value: ancestryData.characteristics.size,
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: priority,
        },
        // overrideEffect('system.characteristics.size', dataL0.characteristics.size, priority)
      ].filter(falsyChangeFilter),
    }]

    ancestryData.levels.forEach(ancestryLevel => {
      const levelEffectData = {
        name: `${item.name} (${game.i18n.localize('DL.CharLevel')} ${ancestryLevel.level})`,
        icon: item.img,
        origin: item.uuid,
        disabled: actor.system.level < ancestryLevel.level,
        transfer: false,
        duration: { startTime: 0 },
        flags: {
          sourceType: 'ancestry',
          levelRequired: parseInt(ancestryLevel.level),
          permanent: true,
          notDeletable: true,
          notEditable: true,
          notToggleable: true,
          slug: `ancestry-${item.name.toLowerCase()}-L${ancestryLevel.level}`,
        },
        changes: [
          // Characteristics
          addEffect('system.characteristics.health.max', ancestryLevel.characteristicsHealth, priority),
          addEffect('system.characteristics.power', ancestryLevel.characteristicsPower, priority),
          addEffect('system.attributes.perception.value', ancestryLevel.characteristicsPerception, priority),
          addEffect('system.characteristics.speed', ancestryLevel.characteristicsSpeed, priority),
          addEffect('system.characteristics.defense', ancestryLevel.characteristicsDefense, priority),

          // FIXME
          // addEffect('system.characteristics.insanityModifier', pathLevel.characteristicsInsanity, priority),
          // addEffect('system.characteristics.corruptionModifier', pathLevel.characteristicsCorruption, priority),

          // Selected checkbox (select two, three, fixed)
          addEffect(
            'system.attributes.strength.value',
            ancestryLevel.attributeStrength * (ancestryLevel.attributeStrengthSelected || ancestryLevel.attributeSelectIsFixed),
            priority
          ),
          addEffect(
            'system.attributes.agility.value',
            ancestryLevel.attributeAgility * (ancestryLevel.attributeAgilitySelected || ancestryLevel.attributeSelectIsFixed),
            priority
          ),
          addEffect(
            'system.attributes.intellect.value',
            ancestryLevel.attributeIntellect * (ancestryLevel.attributeIntellectSelected || ancestryLevel.attributeSelectIsFixed),
            priority
          ),
          addEffect(
            'system.attributes.will.value',
            ancestryLevel.attributeWill * (ancestryLevel.attributeWillSelected || ancestryLevel.attributeSelectIsFixed),
            priority
          ),
        ].filter(falsyChangeFilter),
      }

      // Two set attributes
      if (ancestryLevel.attributeSelectIsTwoSet) {
        const attributeOne = ancestryLevel.attributeSelectTwoSetSelectedValue1
          ? ancestryLevel.attributeSelectTwoSet1
          : ancestryLevel.attributeSelectTwoSet2
        const attributeTwo = ancestryLevel.attributeSelectTwoSetSelectedValue2
          ? ancestryLevel.attributeSelectTwoSet3
          : ancestryLevel.attributeSelectTwoSet4

        levelEffectData.changes = levelEffectData.changes.concat(
          [
            addEffect(`system.attributes.${attributeOne}.value`, ancestryLevel.attributeSelectTwoSetValue1, priority),
            addEffect(`system.attributes.${attributeTwo}.value`, ancestryLevel.attributeSelectTwoSetValue2, priority),
          ].filter(falsyChangeFilter),
        )
      }

      effectDataList.push(levelEffectData)
    })

    return effectDataList
  }

  /* -------------------------------------------- */

  static generateEffectDataFromPath(item, actor = null) {
    const priority = 2
    const pathdata = item.system
    const effectDataList = []

    pathdata.levels.forEach(pathLevel => {
      const levelEffectData = {
        name: `${item.name} (${game.i18n.localize('DL.CharLevel')} ${pathLevel.level})`,
        icon: item.img,
        origin: item.uuid,
        disabled: actor.system.level < pathLevel.level,
        transfer: false,
        duration: { startTime: 0 },
        flags: {
          sourceType: 'path',
          levelRequired: parseInt(pathLevel.level),
          permanent: true,
          notDeletable: true,
          notEditable: true,
          notToggleable: true,
          slug: `path-${item.name.toLowerCase()}-L${pathLevel.level}`,
        },
        changes: [
          // Characteristics
          addEffect('system.characteristics.health.max', pathLevel.characteristicsHealth, priority),
          addEffect('system.characteristics.power', pathLevel.characteristicsPower, priority),
          addEffect('system.attributes.perception.value', pathLevel.characteristicsPerception, priority),
          addEffect('system.characteristics.speed', pathLevel.characteristicsSpeed, priority),
          addEffect('system.characteristics.defense', pathLevel.characteristicsDefense, priority),

          // FIXME
          // addEffect('system.characteristics.insanityModifier', pathLevel.characteristicsInsanity, priority),
          // addEffect('system.characteristics.corruptionModifier', pathLevel.characteristicsCorruption, priority),

          // Selected checkbox (select two, three, fixed)
          addEffect(
            'system.attributes.strength.value',
            pathLevel.attributeStrength * (pathLevel.attributeStrengthSelected || pathLevel.attributeSelectIsFixed),
            priority
          ),
          addEffect(
            'system.attributes.agility.value',
            pathLevel.attributeAgility * (pathLevel.attributeAgilitySelected || pathLevel.attributeSelectIsFixed),
            priority
          ),
          addEffect(
            'system.attributes.intellect.value',
            pathLevel.attributeIntellect * (pathLevel.attributeIntellectSelected || pathLevel.attributeSelectIsFixed),
            priority
          ),
          addEffect(
            'system.attributes.will.value',
            pathLevel.attributeWill * (pathLevel.attributeWillSelected || pathLevel.attributeSelectIsFixed),
            priority
          ),
        ].filter(falsyChangeFilter),
      }

      // Two set attributes
      if (pathLevel.attributeSelectIsTwoSet) {
        const attributeOne = pathLevel.attributeSelectTwoSetSelectedValue1
          ? pathLevel.attributeSelectTwoSet1
          : pathLevel.attributeSelectTwoSet2
        const attributeTwo = pathLevel.attributeSelectTwoSetSelectedValue2
          ? pathLevel.attributeSelectTwoSet3
          : pathLevel.attributeSelectTwoSet4

        levelEffectData.changes = levelEffectData.changes.concat(
          [
            addEffect(`system.attributes.${attributeOne}.value`, pathLevel.attributeSelectTwoSetValue1, priority),
            addEffect(`system.attributes.${attributeTwo}.value`, pathLevel.attributeSelectTwoSetValue2, priority),
          ].filter(falsyChangeFilter),
        )
      }

      effectDataList.push(levelEffectData)
    })

    return effectDataList
  }

  /* -------------------------------------------- */

  static generateEffectDataFromRole(item) {
    const priority = 5
    const data = item.system

    const effectData = {
      name: item.name,
      icon: item.img,
      origin: item.uuid,
      disabled: false,
      transfer: false,
      duration: { startTime: 0 },
      flags: {
        sourceType: 'creaturerole',
        levelRequired: 0,
        notDeletable: true,
        notEditable: true,
        notToggleable: true,
        permanent: true,
        slug: `role-${item.name.toLowerCase()}`,
      },
      changes: [
        addEffect('system.attributes.strength.value', data.attributes.strength, priority),
        addEffect('system.attributes.strength.immune', data.attributes.strengthImmune, priority),
        addEffect('system.attributes.agility.value', data.attributes.agility, priority),
        addEffect('system.attributes.agility.immune', data.attributes.agilityImmune, priority),
        addEffect('system.attributes.intellect.value', data.attributes.intellect, priority),
        addEffect('system.attributes.intellect.immune', data.attributes.intellectImmune, priority),
        addEffect('system.attributes.will.value', data.attributes.will, priority),
        addEffect('system.attributes.will.immune', data.attributes.willImmune, priority),
        addEffect('system.attributes.perception.value', data.characteristics.perceptionmodifier, priority),
        addEffect('system.characteristics.defense', data.characteristics.defensemodifier, priority),
        addEffect('system.characteristics.health.max', data.characteristics.healthmodifier, priority),
        addEffect('system.characteristics.health.healingrate', data.characteristics.healingratemodifier, priority),
        addEffect('system.characteristics.power', data.characteristics.power, priority),
        addEffect('system.characteristics.speed', data.characteristics.speed, priority),
        addEffect('system.characteristics.corruption', data.characteristics.corruption, priority),
        addEffect('system.characteristics.insanity', data.characteristics.insanity, priority),
        addEffect('system.difficulty', data.difficulty, priority),
        overrideEffect('system.characteristics.size', data.characteristics.size, priority),
        overrideValue('system.frightening', data.frightening, priority),
        overrideValue('system.horrifying', data.horrifying, priority),
      ].filter(falsyChangeFilter),
    }

    return [effectData]
  }

  /* -------------------------------------------- */

  static generateEffectDataFromTalent(item) {
    const priority = 3
    const talentData = item.system
    const effectData = {
      name: item.name,
      icon: item.img,
      origin: item.uuid,
      disabled: !talentData.addtonextroll,
      transfer: false,
      duration: { startTime: 0, rounds: 1 * !!talentData.uses.max },
      flags: {
        sourceType: 'talent',
        // levelRequired: parseInt(pathLevelItem.level), TODO
        permanent: false,
        notDeletable: true,
        notEditable: true,
        notToggleable: false,
        slug: `talent-${item.name.toLowerCase()}`,
      },
      changes: [
        // Bonuses - Characteristics
        addEffect('system.characteristics.defense', talentData.bonuses.defense, priority),
        addEffect('system.characteristics.health.max', talentData.bonuses.health, priority),
        addEffect('system.characteristics.power', talentData.bonuses.power, priority),
        addEffect('system.characteristics.speed', talentData.bonuses.speed, priority),
      ].filter(falsyChangeFilter),
    }
    // --- Attack
    const action = talentData.action
    const attackChanges = [
      addEffect('system.bonuses.attack.boons.strength', action.extraboonsbanes * action.strengthboonsbanesselect, priority),
      addEffect('system.bonuses.attack.boons.agility', action.extraboonsbanes * action.agilityboonsbanesselect, priority),
      addEffect('system.bonuses.attack.boons.intellect', action.extraboonsbanes * action.intellectboonsbanesselect, priority),
      addEffect('system.bonuses.attack.boons.will', action.extraboonsbanes * action.willboonsbanesselect, priority),
      concatDiceEffect('system.bonuses.attack.damage', action.extradamage),
      concatDiceEffect('system.bonuses.attack.plus20Damage', action.extraplus20damage),
      concatString('system.bonuses.attack.extraEffect', action.extraeffect, '\n'),
    ].filter(falsyChangeFilter)

    if (attackChanges.length > 0) effectData.changes = effectData.changes.concat(attackChanges)

    // --- Challenge
    const challenge = talentData.challenge
    const challengeChanges = [
      addEffect('system.bonuses.challenge.boons.strength', challenge.boonsbanes * challenge.strengthboonsbanesselect, priority),
      addEffect('system.bonuses.challenge.boons.agility', challenge.boonsbanes * challenge.agilityboonsbanesselect, priority),
      addEffect('system.bonuses.challenge.boons.intellect', challenge.boonsbanes * challenge.intellectboonsbanesselect, priority),
      addEffect('system.bonuses.challenge.boons.will', challenge.boonsbanes * challenge.willboonsbanesselect, priority),
      addEffect('system.bonuses.challenge.boons.perception', challenge.boonsbanes * challenge.perceptionboonsbanesselect, priority),
    ].filter(falsyChangeFilter)

    if (challengeChanges.length > 0) effectData.changes = effectData.changes.concat(challengeChanges)

    return [effectData]
  }

  /* -------------------------------------------- */

  static generateEffectDataFromArmor(item) {
    const priority = 4
    const armorData = item.system
    const effectData = {
      name: item.name,
      icon: item.img,
      origin: item.uuid,
      transfer: false,
      disabled: !armorData.wear,
      duration: { startTime: 0 },
      flags: {
        sourceType: 'armor',
        //levelRequired: 0,
        permanent: false,
        notDeletable: true,
        notEditable: true,
        notToggleable: true,
        slug: `armor-${item.name.toLowerCase()}`,
      },
      changes: [
        addEffect('system.bonuses.armor.agility', armorData.agility, priority),
        addEffect('system.bonuses.armor.defense', armorData.defense, priority),
        upgradeEffect('system.bonuses.armor.fixed', armorData.fixed, priority),
      ].filter(falsyChangeFilter),
    }
    return [effectData]
  }

  /* -------------------------------------------- */

  /**
   * Toggles the activation of an active effect based on its level requirements and current activation
   * @param actor
   */
  static async toggleEffectsByActorRequirements(actor) {
    const notMetEffectsData = actor.effects
      .filter(
        effect =>
          (effect.flags?.levelRequired > actor.system.level && !effect.disabled) ||
          (effect.flags?.levelRequired <= actor.system.level && effect.disabled),
      )
      .map(effect => ({
        _id: effect._id,
        disabled: !effect.disabled,
      }))
    if (notMetEffectsData.length > 0) await actor.updateEmbeddedDocuments('ActiveEffect', notMetEffectsData)
    return await Promise.resolve()
  }

  /* -------------------------------------------- */

  static async addEncumbrance(actor, itemNames) {
    const priority = 100
    let effectName =
      game.i18n.localize('DL.encumbered') +
      ' (' +
      (itemNames[0] || '') +
      itemNames.slice(1).reduce((acc, itemName) => acc + ', ' + itemName, '') +
      ')'

    const n = -itemNames.length
    const oldEffect = actor.effects.find(e => e.origin === 'encumbrance')
    if (!oldEffect && !n) return

    const effectData = {
      name: effectName,
      icon: 'systems/demonlord/assets/icons/effects/fatigued.svg',
      origin: 'encumbrance',
      transfer: false,
      duration: { startTime: 0 },
      flags: {
        sourceItemsLength: itemNames.length,
        sourceType: 'encumbrance',
        permanent: true,
        notDeletable: true,
        notEditable: true,
        notToggleable: false,
        slug: `encumbrance-${effectName.toLowerCase()}`,
      },
      changes: [
        addEffect('system.bonuses.attack.boons.strength', n, priority),
        addEffect('system.bonuses.attack.boons.agility', n, priority),
        addEffect('system.bonuses.challenge.boons.strength', n, priority),
        addEffect('system.bonuses.challenge.boons.agility', n, priority),
        addEffect('system.characteristics.speed', n * 2, priority),
      ],
    }

    if (!oldEffect) await ActiveEffect.create(effectData, { parent: actor })
    else if (n !== 0) await oldEffect.update(effectData, { parent: actor })
    else await oldEffect.delete({ parent: actor })
    return await Promise.resolve()
  }
}
