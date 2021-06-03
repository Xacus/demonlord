import { plusify } from '../utils/utils'

export const addEffect = (key, value) => ({
  key: key,
  value: plusify(value),
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
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

export const overrideEffect = (key, value) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
})

export const upgradeEffect = (key, value) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
})

export const downgradeEffect = (key, value) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.DOWNGRADE,
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
    const toDel = doc.getEmbeddedCollection('ActiveEffect').filter(effect => effect.data?.origin?.includes(originID))

    const promises = []
    for (const e of toDel) {
      promises.push(await e.delete({ parent: doc }))
    }
    return Promise.all(promises)
  }

  /* -------------------------------------------- */

  static async embedActiveEffects(actor, doc, operation = 'create') {
    let effectDataList = []
    switch (doc.data.type) {
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
      default:
        return Promise.resolve(0)
    }

    return await DLActiveEffects.addUpdateEffectsToActor(actor, effectDataList, operation)
  }

  static async addUpdateEffectsToActor(actor, effectDataList, operation) {
    if (operation === 'create') {
      effectDataList = effectDataList.filter(effectData => effectData.changes.length > 0)
      await actor.createEmbeddedDocuments('ActiveEffect', effectDataList)
    } else if (operation === 'update' && effectDataList.length > 0) {
      const currentEffects = actor.effects.filter(e => e.data?.origin === effectDataList[0]?.origin)
      const effectsToAdd = []
      const effectsToUpd = []
      const effectsToDel = []

      for (const effectData of effectDataList) {
        const u = currentEffects.find(ce => ce.data.label === effectData?.label)
        if (u) {
          effectData._id = u.data._id
          if (effectData.changes.length > 0) effectsToUpd.push(effectData)
          else effectsToDel.push(effectData._id)
        } else if (effectData.changes.length > 0) effectsToAdd.push(effectData)
      }

      if (effectsToAdd.length > 0) await actor.createEmbeddedDocuments('ActiveEffect', effectsToAdd)
      if (effectsToUpd.length > 0) await actor.updateEmbeddedDocuments('ActiveEffect', effectsToUpd)
      if (effectsToDel.length > 0) await actor.deleteEmbeddedDocuments('ActiveEffect', effectsToDel)
    }
    return Promise.resolve()
  }

  /* -------------------------------------------- */

  static generateEffectDataFromAncestry(item, actor = null) {
    const dataL0 = item.data.data

    const effectDataL0 = {
      label: `${item.name} (${game.i18n.localize('DL.CharLevel')} 0)`,
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
        addEffect('data.characteristics.speed', dataL0.characteristics.speed - 10),
        {
          key: 'data.characteristics.size',
          value: dataL0.characteristics.size,
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          priority: 0,
        },
      ].filter(falsyChangeFilter),
    }

    const dataL4 = item.data.data.level4
    const effectDataL4 = {
      label: `${item.name} (${game.i18n.localize('DL.CharLevel')} 4)`,
      icon: item.img,
      origin: item.uuid,
      disabled: actor.data.data.level < 4,
      transfer: false,
      duration: { startTime: 0 },
      flags: {
        sourceType: 'ancestry',
        levelRequired: 4,
        permanent: true,
        notDeletable: true,
        notEditable: true,
        notToggleable: true,
      },
      changes: [addEffect('data.characteristics.health.max', dataL4.healthbonus)].filter(falsyChangeFilter),
    }
    return [effectDataL0, effectDataL4]
  }

  /* -------------------------------------------- */

  static generateEffectDataFromPath(item, actor = null) {
    const pathdata = item.data.data
    const effectDataList = []

    pathdata.levels.forEach(pathLevel => {
      const levelEffectData = {
        label: `${item.name} (${game.i18n.localize('DL.CharLevel')} ${pathLevel.level})`,
        icon: item.img,
        origin: item.uuid,
        disabled: actor.data.data.level < pathLevel.level,
        transfer: false,
        duration: { startTime: 0 },
        flags: {
          sourceType: 'path',
          levelRequired: parseInt(pathLevel.level),
          permanent: true,
          notDeletable: true,
          notEditable: true,
          notToggleable: true,
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
          addEffect(
            'data.attributes.strength.value',
            pathLevel.attributeStrength * (pathLevel.attributeStrengthSelected || pathLevel.attributeSelectIsFixed),
          ),
          addEffect(
            'data.attributes.agility.value',
            pathLevel.attributeAgility * (pathLevel.attributeAgilitySelected || pathLevel.attributeSelectIsFixed),
          ),
          addEffect(
            'data.attributes.intellect.value',
            pathLevel.attributeIntellect * (pathLevel.attributeIntellectSelected || pathLevel.attributeSelectIsFixed),
          ),
          addEffect(
            'data.attributes.will.value',
            pathLevel.attributeWill * (pathLevel.attributeWillSelected || pathLevel.attributeSelectIsFixed),
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
            addEffect(`data.attributes.${attributeOne}.value`, pathLevel.attributeSelectTwoSetValue1),
            addEffect(`data.attributes.${attributeTwo}.value`, pathLevel.attributeSelectTwoSetValue2),
          ].filter(falsyChangeFilter),
        )
      }

      effectDataList.push(levelEffectData)
    })

    return effectDataList
  }

  /* -------------------------------------------- */

  static generateEffectDataFromTalent(item) {
    const talentData = item.data.data
    const effectData = {
      label: item.name,
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
      },
      changes: [
        // Bonuses - Characteristics
        addEffect('data.characteristics.defense', talentData.bonuses.defense),
        addEffect('data.characteristics.health.max', talentData.bonuses.health),
        addEffect('data.characteristics.power', talentData.bonuses.power),
        addEffect('data.characteristics.speed', talentData.bonuses.speed),
      ].filter(falsyChangeFilter),
    }
    // --- Attack
    const action = talentData.action
    const attackChanges = [
      addEffect('data.bonuses.attack.boons.strength', action.boonsbanes * action.strengthboonsbanesselect),
      addEffect('data.bonuses.attack.boons.agility', action.boonsbanes * action.agilityboonsbanesselect),
      addEffect('data.bonuses.attack.boons.intellect', action.boonsbanes * action.intellectboonsbanesselect),
      addEffect('data.bonuses.attack.boons.will', action.boonsbanes * action.willboonsbanesselect),
      concatDiceEffect('data.bonuses.attack.damage', action.damage),
      concatDiceEffect('data.bonuses.attack.plus20Damage', action.plus20),
      concatString('data.bonuses.attack.extraEffect', action.extraeffect, '\n'),
    ].filter(falsyChangeFilter)

    if (attackChanges.length > 0) effectData.changes = effectData.changes.concat(attackChanges)

    // --- Challenge
    const challenge = talentData.challenge
    const challengeChanges = [
      addEffect('data.bonuses.challenge.boons.strength', challenge.boonsbanes * challenge.strengthboonsbanesselect),
      addEffect('data.bonuses.challenge.boons.agility', challenge.boonsbanes * challenge.agilityboonsbanesselect),
      addEffect('data.bonuses.challenge.boons.intellect', challenge.boonsbanes * challenge.intellectboonsbanesselect),
      addEffect('data.bonuses.challenge.boons.will', challenge.boonsbanes * challenge.willboonsbanesselect),
      addEffect('data.bonuses.challenge.boons.perception', challenge.boonsbanes * challenge.perceptionboonsbanesselect),
    ].filter(falsyChangeFilter)

    if (challengeChanges.length > 0) effectData.changes = effectData.changes.concat(challengeChanges)

    return [effectData]
  }

  /* -------------------------------------------- */

  static generateEffectDataFromArmor(item) {
    const armorData = item.data.data
    const effectData = {
      label: item.name,
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
      },
      changes: [
        addEffect('data.bonuses.armor.agility', armorData.agility),
        addEffect('data.bonuses.armor.defense', armorData.defense),
        upgradeEffect('data.bonuses.armor.fixed', armorData.fixed),
      ].filter(falsyChangeFilter),
    }
    return [effectData]
  }

  /* -------------------------------------------- */

  /**
   * Toggles the activation of an active effect based on its level requirements and current activation
   * @param actor
   */
  static toggleEffectsByActorRequirements(actor) {
    const notMetEffectsData = actor.effects
      .filter(
        effect =>
          (effect.data.flags?.levelRequired > actor.data.data.level && !effect.data.disabled) ||
          (effect.data.flags?.levelRequired <= actor.data.data.level && effect.data.disabled),
      )
      .map(effect => ({
        _id: effect.data._id,
        disabled: !effect.data.disabled,
      }))
    if (notMetEffectsData.length > 0) return actor.updateEmbeddedDocuments('ActiveEffect', notMetEffectsData)
  }

  /* -------------------------------------------- */

  static addEncumbrance(actor, itemNames) {
    let effectLabel =
      game.i18n.localize('DL.encumbered') +
      ' (' +
      (itemNames[0] || '') +
      itemNames.slice(1).reduce((acc, itemName) => acc + ', ' + itemName, '') +
      ')'

    const n = -itemNames.length
    const oldEffect = actor.effects.find(e => e.data.origin === 'encumbrance')
    if (!oldEffect && !n) return

    const effectData = {
      label: effectLabel,
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
        notToggleable: true,
      },
      changes: [
        addEffect('data.bonuses.attack.boons.strength', n),
        addEffect('data.bonuses.attack.boons.agility', n),
        addEffect('data.bonuses.challenge.boons.strength', n),
        addEffect('data.bonuses.challenge.boons.agility', n),
        addEffect('data.characteristics.speed', n * 2),
      ],
    }

    if (!oldEffect) return ActiveEffect.create(effectData, { parent: actor })
    else if (n !== 0) oldEffect.update(effectData, { parent: actor })
    else oldEffect.delete({ parent: actor })
  }

  /* -------------------------------------------- */

  static async addHomebrew(actor, homebrewObject) {
    console.log(homebrewObject)
    const effectData = {
      label: game.i18n.localize('DL.Homebrew'),
      icon: actor.img,
      origin: 'homebrew',
      transfer: false,
      flags: {
        sourceType: 'homebrew',
        permanent: true,
        notDeletable: true,
        notEditable: true,
        notToggleable: true,
      },
      changes: [
        overrideEffect('data.attributes.strength.value', homebrewObject.strength),
        overrideEffect('data.attributes.agility.value', homebrewObject.agility),
        overrideEffect('data.attributes.intellect.value', homebrewObject.intellect),
        overrideEffect('data.attributes.will.value', homebrewObject.will),
        overrideEffect('data.attributes.perception.value', homebrewObject.perception),
      ]
    }
    effectData.changes.forEach(c => c.priority = 1000)
    return DLActiveEffects.addUpdateEffectsToActor(actor, [effectData], 'update')
  }
}
