/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
import {DLActiveEffects} from '../active-effects/item-effects'
import {DLAfflictions} from '../active-effects/afflictions'
import {capitalize, plusify} from '../utils/utils'
import launchRollDialog from '../dialog/roll-dialog'
import {
  postAttackToChat,
  postAttributeToChat,
  postCorruptionToChat,
  postItemToChat,
  postSpellToChat,
  postTalentToChat,
  postFortuneToChat,
  postRestToChat
} from '../chat/roll-messages'
import {handleCreateAncestry, handleCreatePath, handleCreateRole, handleCreateRelic } from '../item/nested-objects'
import {TokenManager} from '../pixi/token-manager'
import {findAddEffect, findDeleteEffect} from "../demonlord";

const tokenManager = new TokenManager()

export class DemonlordActor extends Actor {
  /* -------------------------------------------- */
  /*  Data preparation                            */

  /* -------------------------------------------- */

  /** @override */
  prepareData() {
    super.prepareData()
  }

  /* -------------------------------------------- */

  /**
   * Prepare actor data that doesn't depend on effects or derived from items
   * @override
   */
  prepareBaseData() {
    const system = this.system
    // Set the base perception equal to intellect
    if (this.type === 'character') {
      system.attributes.perception.value = system.attributes.intellect.value || 10
      system.characteristics.defense = 0  // assume defense = agility
      system.characteristics.health.max = 0
      system.characteristics.insanity.max = 0 // Set base insanity max
    } else if (this.type === 'creature' || this.type === 'vehicle') {
      // Set values to base
      for (const attribute of Object.values(system.attributes)) {
        attribute.value = attribute.base
      }

      system.characteristics.defense = system.characteristics.defenseBase
      system.characteristics.health.max = system.characteristics.health.maxBase
      system.characteristics.speed = system.characteristics.speedBase
      system.characteristics.size = system.characteristics.sizeBase
      this._source.system.characteristics.size = system.characteristics.sizeBase // Do source size to allow calculation in prepareDerivedData

      if (this.type === 'creature') {
        system.difficulty = system.difficultyBase
        system.characteristics.power = system.characteristics.powerBase
      }
    }

    foundry.utils.setProperty(system, 'bonuses', {
      attack: {
        boons: {
          strength: 0,
          agility: 0,
          intellect: 0,
          will: 0,
          perception: 0,
        },
        damage: '',
        plus20Damage: '',
        extraEffect: '',
      },
      challenge: {
        boons: {
          strength: 0,
          agility: 0,
          intellect: 0,
          will: 0,
          perception: 0,
        },
      },
      armor: {fixed: 0, agility: 0, defense: 0, override: 0},  // TODO: Remove override for v12
      defense: {
        boons: {
          spell: 0,
          weapon: 0,
          strength: 0,
          agility: 0,
          intellect: 0,
          will: 0,
          defense: 0,
          perception: 0,
        },
      },
    })

    foundry.utils.setProperty(system, 'maluses', {
      autoFail: {
        challenge: {
          strength: 0,
          agility: 0,
          intellect: 0,
          will: 0,
          perception: 0,
        },
        action: {
          strength: 0,
          agility: 0,
          intellect: 0,
          will: 0,
          perception: 0,
        },
      },
      halfSpeed: 0,  // TODO: Remove for v12
      noFastTurn: 0,
    })

    // Bound attribute value
    system.attributes.perception.max = 25
    for (const [key, attribute] of Object.entries(system.attributes)) {
      attribute.min = 0
      attribute.value = Math.min(attribute.max, Math.max(attribute.min, attribute.value))
      attribute.label = game.i18n.localize(`DL.Attribute${capitalize(key)}`)
      attribute.key = key
    }
    system.attributes.perception.label = game.i18n.localize(`DL.AttributePerception`)

    // Speed
    system.characteristics.speed = Math.max(0, system.characteristics.speed)
  }

  /* -------------------------------------------- */

  /**
   * Prepare actor data that depends on items and effects
   * @override
   */
  prepareDerivedData() {
    const system = this.system

    // We can reapply some active effects if we know they happened
    // We're copying what it's done in applyActiveEffects
    const effectChanges = Array.from(this.allApplicableEffects()).reduce((changes, e) => {
      if (e.disabled || e.isSuppressed) return changes
      return changes.concat(e.changes.map(c => {
        c = foundry.utils.duplicate(c)
        c.effect = e
        c.priority = c.priority ?? (c.mode * 10)
        return c
      }))
    }, []).filter(e => e.key.startsWith("system.attributes") || e.key.startsWith("system.characteristics"))
    effectChanges.sort((a, b) => a.priority - b.priority)
    // effectChanges now contains active effects for attributes and characteristics sorted by priority


    // Clamp attribute values and calculate modifiers
    for (const attribute of Object.values(system.attributes)) {
      attribute.value = Math.min(attribute.max, Math.max(attribute.min, attribute.value))
      attribute.modifier = attribute.value - 10
    }

    // Maluses
    if (system.maluses.halfSpeed) system.characteristics.speed = Math.floor(system.characteristics.speed / 2)  // TODO: Remove for v12

    // --- Character specific data ---
    if (this.type === 'character') {
      // Override Perception value
      system.attributes.perception.value += system.attributes.intellect.modifier
      system.attributes.perception.value = Math.min(system.attributes.perception.max,
        Math.max(system.attributes.perception.min, system.attributes.perception.value))
      system.attributes.perception.modifier = system.attributes.perception.value - 10

      // Health and Healing Rate
      system.characteristics.health.max += system.attributes.strength.value
      system.characteristics.health.healingrate = system.characteristics.health.max / 4

      // Reapply healingrate from ActiveEffects
      for (let change of effectChanges.filter(e => e.key.includes("healingrate"))) {
        const result = change.effect.apply(this, change)
        if (result !== null) this.overrides[change.key] = result
      }

      // And then round down
      system.characteristics.health.healingrate = Math.floor(system.characteristics.health.healingrate)

      // Insanity
      system.characteristics.insanity.max += system.attributes.will.value

      // Armor
      system.characteristics.defense = (system.bonuses.armor.fixed || system.attributes.agility.value + system.bonuses.armor.agility) // + system.characteristics.defense // Applied as ActiveEffect further down
    }
    // --- Creature specific data ---
    else {
      system.characteristics.defense = system.characteristics.defense || system.bonuses.armor.fixed || system.attributes.agility.value + system.bonuses.armor.agility
    }

    // Final armor computation
    system.characteristics.defense += system.bonuses.armor.defense
    system.characteristics.defense = system.bonuses.armor.override || system.characteristics.defense // TODO: Remove for v12
    for (let change of effectChanges.filter(e => e.key.includes("defense") && (this.type === 'character' ? e.key.startsWith("system.characteristics") : false))) {
      const result = change.effect.apply(this, change)
      if (result !== null) this.overrides[change.key] = result
    }

    // Adjust size here
    const originalSize = this._source.system.characteristics.size
    let modifiedSize = 0
    let newSize = originalSize
    modifiedSize = this.getSizeFromString(originalSize)

    for (let change of effectChanges.filter(e => e.key.includes("size"))) {
      let sizeMod = 0

      sizeMod = this.getSizeFromString(change.value)

      switch (change.mode) {
        case 0: // CUSTOM
          break
        case 1: // MULTIPLY
          modifiedSize *= sizeMod
          break
        case 2: // ADD
          modifiedSize += sizeMod
          break
        case 3: // DOWNGRADE
          modifiedSize = Math.min(modifiedSize, sizeMod)
          break
        case 4: // UPGRADE
          modifiedSize = Math.max(modifiedSize, sizeMod)
          break
        case 5: // OVERRIDE
          modifiedSize = sizeMod
          break
      }

      // Round to avoid inconsistent sizees
      if (modifiedSize > 1) {
        modifiedSize = Math.floor(modifiedSize)
      }

      newSize = this.getSizeFromNumber(modifiedSize)
    }

    this.system.characteristics.size = newSize

    // Trigger token update, so that changes are reflected
    if (game.ready && this.isOwner && game.settings.get('demonlord', 'autoSizeTokens')) {
      for (const token of this.getActiveTokens(true, true)) {

        let scale = Math.max(modifiedSize, 0.5) // Foundry can't handle token scales smaller than 0.5, so we need to adjust the texture scale further
        let textureScale = 1

        if (modifiedSize < 0.5) {
            textureScale = modifiedSize * 2;
        }

        token.resize({width: scale, height: scale}, { animate: true })
        token.update({ texture: { scaleX: textureScale, scaleY: textureScale }})
        //token.prepareDerivedData()
        //token.object?.refresh()
      }
    }
  }

  /* -------------------------------------------- */
  /*  _onOperations                                */

  /* -------------------------------------------- */

  /** @override */
  async toggleStatusEffect(statusId, options) {
    // Check we're not immune to this condition
    if (this.isImmuneToAffliction(statusId)) {
      ui.notifications.warn(game.i18n.localize('DL.DialogWarningActorImmune'));
      return false;
    } else {
      return await super.toggleStatusEffect(statusId, options)
    }
  }

  /** @override */
  async _onUpdate(changed, options, user) {
    await super._onUpdate(changed, options, user)
    if (user !== game.userId) return
    if (changed?.level != null || changed?.system?.level != null) {
      await this._handleDescendantDocuments(changed, {debugCaller: '_onUpdate'})
    }
    if (changed.system?.characteristics?.health) await this.handleHealthChange()
  }

  async _handleDescendantDocuments(changed, options = {}) {
    //TODO: Remove logs when stable
    console.log(`DEMONLORD | Calling _handleDescendantDocuments from ${options?.debugCaller || '??'}`)
    await DLActiveEffects.toggleEffectsByActorRequirements(this)
    await this.setUsesOnSpells()
    await this.setEncumbrance()
    return await Promise.resolve()
  }

  /* -------------------------------------------- */

  async _onCreateDescendantDocuments(documentParent, collection, documents, data, options, userId) {
    await super._onCreateDescendantDocuments(documentParent, collection, documents, data, options, userId)
    if (collection === 'items' && userId === game.userId)
      await this._handleOnCreateDescendant(documents).then(_ => this.sheet.render())
  }

  async _handleOnCreateDescendant(documents) {
    console.log('DEMONLORD | Calling _handleOnCreateDescendant', documents)
    for await (const doc of documents) {
      // Ancestry and path creations
      if (doc.type === 'ancestry') {
        await handleCreateAncestry(this, doc)
      } else if (doc.type === 'path') {
        await handleCreatePath(this, doc)
      } else if (doc.type === 'creaturerole') {
        await handleCreateRole(this, doc)
      } else if (doc.type === 'relic') {
        await handleCreateRelic(this, doc)
      }

      await DLActiveEffects.embedActiveEffects(this, doc, 'create')
    }
    // No need to update if nothing was changed
    if (documents.length > 0) {
      await this._handleDescendantDocuments(documents[0].parent, {debugCaller: `_handleOnCreateDescendant [${documents.length}]`})
    }
    return await Promise.resolve()
  }

  /* -------------------------------------------- */

  async _onUpdateDescendantDocuments(documentParent, collection, documents, data, options, userId) {
    await super._onUpdateDescendantDocuments(documentParent, collection, documents, data, options, userId)

    // Check if only the flag has changed. If so, we can skip the handling
    const keys = new Set(data.reduce((prev, r) => prev.concat(Object.keys(r)), []))
    if (keys.size <= 2 && keys.has('flags')) {
      // Maybe check if the changed flag is 'levelRequired'?
      return
    }

    // Don't need to update anything if the only change is the edit item state
    const isNameChange = documents.length === 1 && data[0].name !== undefined

    if ((collection === 'items' || collection === 'effects') && userId === game.userId && !options.noEmbedEffects)
      await this._handleOnUpdateDescendant(documents, isNameChange).then(_ => this.sheet.render())
  }

  async _handleOnUpdateDescendant(documents, isNameChange) {
    console.log('DEMONLORD | Calling _handleOnUpdateDescendant', documents)

    // Delete all effects created by this item and re-add them
    const effectsToDelete = []

    for await (const doc of documents) {
      effectsToDelete.push(...doc.parent.effects.filter(e => e.origin === doc.uuid).map(e => e.id))
      await DLActiveEffects.embedActiveEffects(this, doc, 'update')
    }

    if (isNameChange) {
      await this.deleteEmbeddedDocuments('ActiveEffect', effectsToDelete)
    }

    // No need to update if nothing was changed
    if (documents.length > 0) {
      await this._handleDescendantDocuments(documents[0].parent, {debugCaller: `_handleOnUpdateDescendant [${documents.length}]`})
    }
    return await Promise.resolve()
  }

  /**
   * Get actor attribute by localized name
   * @param attributeName                    Localized name
   */
  getAttribute(attributeName) {
    if (!attributeName) return ""
    const attributes = {
      [game.i18n.localize("DL.AttributeStrength").toLowerCase()]: "strength",
      [game.i18n.localize("DL.AttributeAgility").toLowerCase()]: "agility",
      [game.i18n.localize("DL.AttributeIntellect").toLowerCase()]: "intellect",
      [game.i18n.localize("DL.AttributeWill").toLowerCase()]: "will",
      [game.i18n.localize("DL.AttributePerception").toLowerCase()]: "perception",
    }
    const normalizedName = attributes[attributeName.toLowerCase()] || attributeName.toLowerCase()
    return foundry.utils.getProperty(this.system, `attributes.${normalizedName}`, this.system[attributeName])
  }

  /* -------------------------------------------- */
  /*  Rolls and Actions                           */

  /* -------------------------------------------- */
  rollFormula(mods, boba, bobaRerolls) {
    let rollFormula = '1d20'
    for (const mod of mods) {
      rollFormula += plusify(mod)
    }
    if (boba > 0 && parseInt(bobaRerolls) > 0) rollFormula += `+${boba}d6r1kh`
    else if (boba) rollFormula += plusify(boba) + 'd6kh'

    if (boba !== 0 && game.settings.get('demonlord', 'optionalRuleDieRollsMode') === 's') {
      let staticBoonsAndBanes = 2 + Math.abs(boba)
      if (staticBoonsAndBanes > 5) staticBoonsAndBanes = 5
      rollFormula = '1d20'
      if (boba > 0) {
        rollFormula += plusify(staticBoonsAndBanes)
      } else {
        rollFormula += `-${staticBoonsAndBanes}`
      }
      for (const mod of mods) {
        rollFormula += plusify(mod)
      }
    }

    if (game.settings.get('demonlord', 'optionalRuleDieRollsMode') === 'b') {
      rollFormula = rollFormula.replace('d6r1kh', 'd3r1kh')
      rollFormula = rollFormula.replace('d6kh', 'd3kh')
      rollFormula = rollFormula.replace('1d20', '3d6')
    }

    console.log(rollFormula)
    return rollFormula
  }

  /**
   * Rolls an attack using an Item
   * @param item                    Weapon / Spell / Talent used for attacking
   * @param inputBoons              Number of boons/banes from the user dialog
   * @param inputModifier           Attack modifier from the user dialog
   */
  async rollItemAttack(item, inputBoons = 0, inputModifier = 0, token = null) {
    const attacker = this
    const defender = token ? token.actor : null
    let defenderToken = []
    if (token) defenderToken.push(token)

    // Get attacker attribute and defender attribute name
    const attackAttribute = item.system.action?.attack?.toLowerCase()
    const defenseAttribute = item.system.action?.against?.toLowerCase()

    // If no attack mod selected, warn user
    // Actually, there's a valid reason to not set the attack mod, especially for vehicles
    /*if (!attackAttribute) {
      ui.notifications.error(game.i18n.localize('DL.DialogWarningWeaponAttackModifier'))
      return
    }*/
    // if !target -> ui.notifications.warn(Please select target) ??

    // Attack modifier and Boons/Banes
    const modifiers = [
      item.system.action?.rollbonus || 0,
      attacker.system?.attributes[attackAttribute]?.modifier || 0,
      attacker.system?.bonuses.attack.modifier?.[attackAttribute] || 0,
      attacker.system?.bonuses.attack.modifier?.all || 0,
      attacker.system?.bonuses.attack.modifier?.weapon || 0,
      parseInt(inputModifier) || 0,
    ]

    let boons =
      (parseInt(item.system.action.boonsbanes) || 0) +
      (parseInt(inputBoons) || 0) +
      (attacker.system.bonuses.attack.boons[attackAttribute] || 0) +
      (attacker.system.bonuses.attack.boons.all || 0) +
      (attacker.system.bonuses.attack.boons.weapon || 0)

    const horrifyingBane = game.settings.get('demonlord', 'horrifyingBane')
    const ignoreLevelDependentBane = (game.settings.get('demonlord', 'optionalRuleLevelDependentBane') && ((attacker.system?.level >=3 && attacker.system?.level <=6 && defender?.system?.difficulty <= 25) || (attacker.system?.level >=7 && defender?.system?.difficulty <= 50))) ? false : true
      boons -=
        (defender?.system.bonuses.defense.boons[defenseAttribute] || 0) +
        (defender?.system.bonuses.defense.boons.all || 0) +
        (defender?.system.bonuses.defense.boons.weapon || 0) +
        (horrifyingBane && ignoreLevelDependentBane && !attacker.system.horrifying && !attacker.system.frightening && defender?.system.horrifying && 1 || 0)

    // Check if requirements met
    if (item.system.wear && parseInt(item.system.requirement?.minvalue) > attacker.getAttribute(item.system.requirement?.attribute)?.value)
      boons--
    const boonsReroll = parseInt(this.system.bonuses.rerollBoon1Dice)

    // Roll the attack
    const attackRoll = new Roll(this.rollFormula(modifiers, boons, boonsReroll), attacker.system)
    await attackRoll.evaluate()

    postAttackToChat(attacker, defender, item, attackRoll, attackAttribute, defenseAttribute, parseInt(inputBoons) || 0, parseInt(inputModifier) || 0)

    const targetNumber =
      defenseAttribute === 'defense'
        ? defender?.system.characteristics.defense
        : defender?.system.attributes[defenseAttribute]?.value || ''

    const hitTarget = (defender && attackRoll?.total >= targetNumber) ? defenderToken : []

    for (let effect of this.appliedEffects) {
      const specialDuration = foundry.utils.getProperty(effect, `flags.${game.system.id}.specialDuration`)
        if (specialDuration === 'NextD20Roll' || specialDuration === 'NextAttackRoll') await effect?.delete()
    }

    Hooks.call('DL.RollAttack', {
      sourceToken: attacker.token || tokenManager.getTokenByActorId(attacker.id),
      targets: defenderToken,
      itemId: item.id,
      hitTargets: hitTarget,
      attackRoll: attackRoll
    })
  }

  /**
   * Roll an attack using a weapon, calling a dialog for the user to input boons and modifiers
   * @param itemID          The id of the item
   * @param _options         Additional options
   */
  async rollWeaponAttack(itemID, _options = {event: null}) {
    const targets = tokenManager.targets
    const item = this.getEmbeddedDocument('Item', itemID)
    let ammoItem

    // Check if there is an ammo for weapon
    if (item.system.consume.ammorequired) {
      ammoItem = await this.items.find(x => x.id === item.system.consume.ammoitemid)
      if (ammoItem) {
        if (ammoItem.system.quantity === 0) {
          return ui.notifications.warn(
            game.i18n.format('DL.WeaponRunOutOfAmmo', {
              weaponName: item.name,
            }),
          )
        }
      } else {
        return ui.notifications.warn(
          game.i18n.format('DL.WeaponNoAmmo', {
            weaponName: item.name,
          }),
        )
      }
    }

    // If no attribute to roll, roll without modifiers and boons
    const attribute = item.system.action?.attack
    /*if (!attribute) {
      this.rollItemAttack(item, 0, 0)
      return
    }*/

    // Check if actor is blocked by an affliction
    if (!DLAfflictions.isActorBlocked(this, 'action', attribute))
      launchRollDialog(game.i18n.localize('DL.DialogAttackRoll') + game.i18n.localize(item.name), async (event, html) => {
        for (const target of targets) {
          await this.rollItemAttack(item, html.form.elements.boonsbanes.value, html.form.elements.modifier.value, target)
        }
        if (targets.length === 0 ) this.rollItemAttack(item, html.form.elements.boonsbanes.value, html.form.elements.modifier.value)
        // Decrease ammo quantity
        if (item.system.consume.ammorequired) {
          await ammoItem.update({
            'system.quantity': ammoItem.system.quantity - item.system.consume.amount,
          })
        }
      })
  }
  /* -------------------------------------------- */

  async rollAttributeChallenge(attribute, inputBoons, inputModifier) {
    const modifiers = [parseInt(inputModifier), this.getAttribute(attribute.key)?.modifier || 0]
    const boons = (parseInt(inputBoons) || 0) + (this.system.bonuses.challenge.boons[attribute.key] || 0) + (this.system.bonuses.challenge.boons.all || 0)
    const boonsReroll = parseInt(this.system.bonuses.rerollBoon1Dice)

    const challengeRoll = new Roll(this.rollFormula(modifiers, boons, boonsReroll), this.system)
    await challengeRoll.evaluate()
    postAttributeToChat(this, attribute.key, challengeRoll, parseInt(inputBoons) || 0, parseInt(inputModifier) || 0)

    for (let effect of this.appliedEffects) {
      const specialDuration = foundry.utils.getProperty(effect, `flags.${game.system.id}.specialDuration`)
      if (specialDuration === 'NextD20Roll' || specialDuration === 'NextChallengeRoll') await effect?.delete()
    }

    return challengeRoll
  }

  rollChallenge(attribute) {
    if (typeof attribute === 'string' || attribute instanceof String) attribute = this.getAttribute(attribute)

    if (!DLAfflictions.isActorBlocked(this, 'challenge', attribute.key))
      launchRollDialog(this.name + ' - ' + game.i18n.localize('DL.DialogChallengeRoll') + attribute.label, async (event, html) =>
        await this.rollAttributeChallenge(attribute, html.form.elements.boonsbanes.value, html.form.elements.modifier.value),
      )
  }

  /* -------------------------------------------- */

  async rollAttributeAttack(attribute, defense, inputBoons, inputModifier) {

    const attacker = this
    const defendersTokens = tokenManager.targets
    const defender = defendersTokens[0]?.actor
    const horrifyingBane = game.settings.get('demonlord', 'horrifyingBane')
    const ignoreLevelDependentBane = (game.settings.get('demonlord', 'optionalRuleLevelDependentBane') && ((attacker.system?.level >=3 && attacker.system?.level <=6 && defender?.system?.difficulty <= 25) || (attacker.system?.level >=7 && defender?.system?.difficulty <= 50))) ? false : true

    const modifiers = [
      parseInt(inputModifier),
      attacker.system?.attributes[attribute.key]?.modifier || 0,
      attacker.system?.bonuses?.attack?.modifier?.[attribute.key] || 0,
      attacker.system?.bonuses?.attack?.modifier?.all || 0,
    ]

    let boons =
      (parseInt(inputBoons) || 0) +
      (attacker.system.bonuses.attack.boons?.[attribute.key] || 0) +
      (attacker.system.bonuses.attack.boons?.all || 0)

    if (defendersTokens.length === 1) boons -= (defender?.system.bonuses.defense.boons[defense] || 0) + (defender?.system.bonuses.defense.boons.all || 0) +
       (horrifyingBane && ignoreLevelDependentBane && !attacker.system.horrifying && !attacker.system.frightening && defender?.system.horrifying && 1 || 0)

    const boonsReroll = parseInt(this.system.bonuses.rerollBoon1Dice)

    // We're sending this to postAttackToChat. Fix at some point
    const fakeItem = {
      name: game.i18n.localize('DL.AttributeAttack'),
      img: this.img,
      type: 'attribute',
      system: {
        action: { }
      }
    }

    const attackRoll = new Roll(this.rollFormula(modifiers, boons, boonsReroll), this.system)
    await attackRoll.evaluate()
    postAttackToChat(this, tokenManager.targets[0].actor, fakeItem, attackRoll, attribute.key, defense, parseInt(inputBoons) || 0, parseInt(inputModifier) || 0)

    for (let effect of this.appliedEffects) {
      const specialDuration = foundry.utils.getProperty(effect, `flags.${game.system.id}.specialDuration`)
      if (specialDuration === 'NextD20Roll' || specialDuration === 'NextAttackRoll') await effect?.delete()
    }

    return attackRoll
  }

  rollAttack(attribute) {
    if (typeof attribute === 'string' || attribute instanceof String) attribute = this.getAttribute(attribute)

    if (!DLAfflictions.isActorBlocked(this, 'attack', attribute.key))
      launchRollDialog(this.name + ' - ' + game.i18n.localize('DL.DialogAttackRoll') + attribute.label, async (event, html) =>
        await this.rollAttributeAttack(attribute, html.form.elements.defense.value, html.form.elements.boonsbanes.value, html.form.elements.modifier.value),
      true
    )
  }

  /* -------------------------------------------- */

  async rollTalent(itemID, _options = {event: null}) {
    if (DLAfflictions.isActorBlocked(this, 'challenge', 'strength'))
      //FIXME
      return

    const item = this.items.get(itemID)
    const uses = parseInt(item.system?.uses?.value) || 0
    const usesMax = parseInt(item.system?.uses?.max) || 0

    if (usesMax !== 0 && uses >= usesMax) {
      ui.notifications.warn(game.i18n.localize('DL.TalentMaxUsesReached'))
      return
    }

    if (item.system?.action?.attack) {
      launchRollDialog(game.i18n.localize('DL.TalentVSRoll') + game.i18n.localize(item.name), async (event, html) =>
        await this.useTalent(item, html.form.elements.boonsbanes.value, html.form.elements.modifier.value),
      )
    } else {
      await this.useTalent(item, 0, 0)
    }
  }

  async useTalent(talent, inputBoons, inputModifier) {
    const talentData = talent.system
    const targets = tokenManager.targets
    const target = targets[0]
    let attackRoll = null

    if (!talentData?.action?.attack) {
      await this.activateTalent(talent, true)
    } else {
      await this.activateTalent(talent, Boolean(talentData.action?.damageActive))

      const attackAttribute = talentData.action.attack.toLowerCase()
      const defenseAttribute = talentData.action?.attack?.toLowerCase()
      const attacker = this

      const modifiers = [
        talentData.action?.rollbonus || 0,
        attacker.system?.attributes[attackAttribute]?.modifier || 0,
        attacker.system?.bonuses.attack.modifier?.[attackAttribute] || 0,
        attacker.system?.bonuses.attack.modifier?.all || 0,
        parseInt(inputModifier) || 0,
      ]

      let boons =
        (parseInt(inputBoons) || 0) +
        (this.system.bonuses.attack.boons[attackAttribute] || 0) +
        (this.system.bonuses.attack.boons.all || 0) +
        parseInt(talentData.action?.boonsbanes || 0)

      const horrifyingBane = game.settings.get('demonlord', 'horrifyingBane')
      const ignoreLevelDependentBane = (game.settings.get('demonlord', 'optionalRuleLevelDependentBane') && ((this.system?.level >=3 && this.system?.level <=6 && target?.actor?.system?.difficulty <= 25) || (this.system?.level >=7 && target?.actor?.system?.difficulty <= 50))) ? false : true

      if (targets.length === 1)
        boons -= (
          (target?.actor?.system.bonuses.defense.boons[defenseAttribute] || 0) +
          (target?.actor?.system.bonuses.defense.boons.all || 0) +
          (horrifyingBane && ignoreLevelDependentBane && !this.system.horrifying && !this.system.frightening && target?.actor?.system.horrifying && 1 || 0))
      const boonsReroll = parseInt(this.system.bonuses.rerollBoon1Dice)

      attackRoll = new Roll(this.rollFormula(modifiers, boons, boonsReroll), this.system)
      await attackRoll.evaluate()

      for (let effect of this.appliedEffects) {
        const specialDuration = foundry.utils.getProperty(effect, `flags.${game.system.id}.specialDuration`)
        if (specialDuration === 'NextD20Roll' || specialDuration === 'NextAttackRoll') await effect?.delete()
      }

    }

    Hooks.call('DL.UseTalent', {
      sourceToken: this.token || tokenManager.getTokenByActorId(this.id),
      targets: targets,
      itemId: talent.id,
      attackRoll: attackRoll
    })

    postTalentToChat(this, talent, attackRoll, target?.actor, parseInt(inputBoons) || 0, parseInt(inputModifier) || 0)
    return attackRoll
  }

  /* -------------------------------------------- */

  async rollSpell(itemID, _options = {event: null}) {
    const targets = tokenManager.targets
    const item = this.items.get(itemID)
    const isAttack = item.system.spelltype === 'Attack'
    const attackAttribute = item.system?.action?.attack?.toLowerCase()
    const challengeAttribute = item.system?.attribute?.toLowerCase()

    // Check if actor is blocked
    // If it has an attack attribute, check action attack else if it has a challenge attribute, check action challenge
    if (isAttack && attackAttribute && DLAfflictions.isActorBlocked(this, 'attack', attackAttribute)) return
    else if (challengeAttribute && DLAfflictions.isActorBlocked(this, 'challenge', challengeAttribute)) return

    // Check uses
    const uses = parseInt(item.system?.castings?.value) || 0
    const usesMax = parseInt(item.system?.castings?.max) || 0

    if (usesMax !== 0 && uses >= usesMax) {
      ui.notifications.warn(game.i18n.localize('DL.SpellMaxUsesReached'))
      return
    } else await item.update({'system.castings.value': uses + 1}, {parent: this})

    if (isAttack && attackAttribute) {
      launchRollDialog(game.i18n.localize('DL.DialogSpellRoll') + game.i18n.localize(item.name), async (event, html) => {
        for (const target of targets) {
          await this.useSpell(item, html.form.elements.boonsbanes.value, html.form.elements.modifier.value, [target])
        }
        if (targets.length === 0 )  await this.useSpell(item,html.form.elements.boonsbanes.value, html.form.elements.modifier.value)
      })
    } else {
      await this.useSpell(item, 0, 0)
    }
  }

  async useSpell(spell, inputBoons, inputModifier, target = []) {
    const spellData = spell.system
    const attackAttribute = spellData?.action?.attack?.toLowerCase()
    const defenseAttribute = spellData?.action?.against?.toLowerCase()

    let attackRoll
    if (attackAttribute) {
      const attacker = this

      const modifiers = [
        spellData.action?.rollbonus || 0,
        attacker.system?.attributes[attackAttribute]?.modifier || 0,
        attacker.system?.bonuses.attack.modifier?.[attackAttribute] || 0,
        attacker.system?.bonuses.attack.modifier?.all || 0,
        attacker.system?.bonuses.attack.modifier?.spell || 0,
        parseInt(inputModifier) || 0,
      ]

      let boons =
        (parseInt(inputBoons) || 0) +
        (parseInt(spellData.action?.boonsbanes) || 0) +
        (this.system.bonuses.attack.boons[attackAttribute] || 0) +
        (this.system.bonuses.attack.boons.all || 0) +
        (this.system.bonuses.attack.boons.spell || 0)

      const horrifyingBane = game.settings.get('demonlord', 'horrifyingBane')
      const ignoreLevelDependentBane = (game.settings.get('demonlord', 'optionalRuleLevelDependentBane') && ((this.system?.level >=3 && this.system?.level <=6 && target?.actor?.system?.difficulty <= 25) || (this.system?.level >=7 && target?.actor?.system?.difficulty <= 50))) ? false : true

      if (target)
        boons -=
          (target?.actor?.system.bonuses.defense.boons[defenseAttribute] || 0) +
          (target?.actor?.system.bonuses.defense.boons.all || 0) +
          (target?.actor?.system.bonuses.defense.boons.spell || 0) +
          (horrifyingBane && ignoreLevelDependentBane && !this.system.horrifying && !this.system.frightening && target?.actor?.system.horrifying && 1 || 0)

      const boonsReroll = parseInt(this.system.bonuses.rerollBoon1Dice)

      attackRoll = new Roll(this.rollFormula(modifiers, boons, boonsReroll), this.system)
      await attackRoll.evaluate()
    }

    Hooks.call('DL.UseSpell', {
      sourceToken: this.token || tokenManager.getTokenByActorId(this.id),
      targets: target,
      itemId: spell.id,
      attackRoll: attackRoll
    })

    postSpellToChat(this, spell, attackRoll, target?.actor, parseInt(inputBoons) || 0, parseInt(inputModifier) || 0)

    for (let effect of this.appliedEffects) {
      const specialDuration = foundry.utils.getProperty(effect, `flags.${game.system.id}.specialDuration`)
      if (specialDuration === 'NextD20Roll' || specialDuration === 'NextAttackRoll') await effect?.delete()
    }

    // Add concentration if it's in the spell duration
    const concentrate = CONFIG.statusEffects.find(e => e.id === 'concentrate')
    if (
      spell.system.duration.toLowerCase().includes('concentration') &&
      this.effects.find(e => e.statuses?.has('concentrate')) === undefined &&
      game.settings.get("demonlord", "concentrationEffect")
    ) {
      let result = spell.system.duration.match(/\d+/)
      if (result) {
        if (spell.system.duration.toLowerCase().includes('minute')) {
          concentrate['duration.rounds'] = result[0] * 6
          concentrate['duration.seconds'] = result[0] * 60
        } // hour
        else {
          concentrate['duration.rounds'] = result[0] * 360
          concentrate['duration.seconds'] = result[0] * 3600
        }
      }
      concentrate['statuses'] = [concentrate.id]
      ActiveEffect.create(concentrate, {parent: this})
    }
    return attackRoll
  }

  /* -------------------------------------------- */

  async rollItem(itemID, _options = {event: null}) {
    const item = this.items.get(itemID)
    let deleteItem = false

    if (item.system.quantity != null && item.system.consumabletype) {
      if (item.system.quantity === 1 && item.system.autoDestroy) {
        deleteItem = true
      }

      if (item.system.quantity < 1 ) {
        if (item.system.autoDestroy) {
          return await item.delete()
        } else {
          return ui.notifications.warn(game.i18n.localize('DL.ItemMaxUsesReached'))
        }
      }

      await item.update({'system.quantity': --item.system.quantity}, {parent: this})
    }

    if (item.system?.action?.attack) {
      launchRollDialog(game.i18n.localize('DL.ItemVSRoll') + game.i18n.localize(item.name), async (event, html) =>
        await this.useItem(item, html.form.elements.boonsbanes.value, html.form.elements.modifier.value),
      )
    } else {
      await this.useItem(item, 0, 0)
    }

    if (deleteItem) await item.delete()

  }

  async useItem(item, inputBoons, inputModifier) {
    const itemData = item.system
    const targets = tokenManager.targets
    const target = targets[0]
    let attackRoll = null

    if (!itemData?.action?.attack) {
      postItemToChat(this, item, null, null, null)
      return
    } else {
      const attackAttribute = itemData.action.attack.toLowerCase()
      const defenseAttribute = itemData.action?.attack?.toLowerCase()
      const attacker = this

      const modifiers = [
        item.system.action.rollbonus || 0,
        attacker.system?.attributes[attackAttribute]?.modifier || 0,
        attacker.system?.bonuses.attack.modifier?.[attackAttribute] || 0,
        attacker.system?.bonuses.attack.modifier?.all || 0,
        parseInt(inputModifier) || 0,
      ]

      let boons =
        (parseInt(inputBoons) || 0) +
        (this.system.bonuses.attack.boons[attackAttribute] || 0) +
        (this.system.bonuses.attack.boons.all || 0) +
        parseInt(itemData.action?.boonsbanes || 0)

      const horrifyingBane = game.settings.get('demonlord', 'horrifyingBane')
      const ignoreLevelDependentBane = (game.settings.get('demonlord', 'optionalRuleLevelDependentBane') && ((this.system?.level >=3 && this.system?.level <=6 && target?.actor?.system?.difficulty <= 25) || (this.system?.level >=7 && target?.actor?.system?.difficulty <= 50))) ? false : true

      if (targets.length === 1)
        boons -= (
          (target?.actor?.system.bonuses.defense.boons[defenseAttribute] || 0) +
          (target?.actor?.system.bonuses.defense.boons.all || 0) +
          (horrifyingBane && ignoreLevelDependentBane && !this.system.horrifying && !this.system.frightening && target?.actor?.system.horrifying && 1 || 0))
      const boonsReroll = parseInt(this.system.bonuses.rerollBoon1Dice)

      attackRoll = new Roll(this.rollFormula(modifiers, boons, boonsReroll), this.system)
      await attackRoll.evaluate()

      for (let effect of this.appliedEffects) {
        const specialDuration = foundry.utils.getProperty(effect, `flags.${game.system.id}.specialDuration`)
        if (specialDuration === 'NextD20Roll' || specialDuration === 'NextAttackRoll') await effect?.delete()
      }
    }
    postItemToChat(this, item, attackRoll, target?.actor, parseInt(inputBoons) || 0)
    return attackRoll
  }

  /* -------------------------------------------- */

  async rollCorruption() {
    const corruptionRoll = new Roll('1d20')
    await corruptionRoll.evaluate()
    postCorruptionToChat(this, corruptionRoll)
  }

  /* -------------------------------------------- */

  async createItemCreate(event) {
    event.preventDefault()

    const header = event.currentTarget
    // Get the type of item to create.
    const type = header.dataset.type
    // Grab any data associated with this control.
    const data = foundry.utils.duplicate(header.dataset)
    // Prepare the item object.
    const itemData = {
      name: `New ${type.capitalize()}`,
      type: type,
      data: data,
    }

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.type

    // Finally, create the item!
    return await this.createItem(itemData)
  }

  showItemInfo(item) {
    const uses = parseInt(item.system?.enchantment?.uses?.value) || 0
    const usesmax = parseInt(item.system?.enchantment?.uses?.max) || 0

    const usesText = game.i18n.localize('DL.SpellCastingsUses') + ': ' + uses + ' / ' + usesmax

    var templateData = {
      actor: this,
      item: {
        data: item,
        name: item.name,
      },
      data: {
        uses: {
          value: usesText,
        },
        healing: {
          value: item.system?.healingoption,
        },
      },
    }

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: this.id,
        token: this.token,
        alias: this.name,
      },
    }

    const rollMode = game.settings.get('core', 'rollMode')
    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM')
    }

    const template = 'systems/demonlord/templates/chat/enchantment.hbs'
    foundry.applications.handlebars.renderTemplate(template, templateData).then(async content => {
      chatData.content = content
      await ChatMessage.create(chatData)
    })
  }

  getTargetNumber(item) {
    let targetNumber
    game.user.targets.forEach(async target => {
      const targetActor = target.actor
      if (targetActor) {
        let againstSelectedAttribute = item.system.action?.against?.toLowerCase()

        if (againstSelectedAttribute == undefined) {
          againstSelectedAttribute = item.system.action?.against?.toLowerCase()
        }

        if (againstSelectedAttribute == 'defense') {
          targetNumber = targetActor.system?.characteristics?.defense
        } else {
          targetNumber = targetActor.system?.attributes[againstSelectedAttribute]?.value
        }
      }
    })

    return targetNumber
  }

  /* -------------------------------------------- */

  async activateTalent(talent, setActive) {
    let uses = parseInt(talent.system.uses?.value) || 0
    const usesmax = parseInt(talent.system.uses?.max) || 0

    if (usesmax > 0 && uses < usesmax)
      return await talent.update({'system.uses.value': ++uses, 'system.addtonextroll': setActive}, {parent: this})
  }

  async deactivateTalent(talent, decrement = 0, onlyTemporary = false) {
    if (onlyTemporary && !talent.system.uses?.max) return
    let uses = talent.system.uses?.value || 0
    uses = Math.max(0, uses - decrement)
    return await talent.update({'system.uses.value': uses, 'system.addtonextroll': false}, {parent: this})
  }

  /* -------------------------------------------- */

  async addDamageToTarget(damage) {
    await Promise.all(game.user.targets.map(async target => {
      const currentDamage = parseInt(target.actor.system.characteristics.health.value)
      await target?.actor.update({
        'system.characteristics.health.value': currentDamage + damage,
      })
    }))
  }

  async expendFortune(awarded = false) {
    postFortuneToChat(this, awarded)
  }

  async restActor(restTime, magicRecovery, talentRecovery, healing) {
    // Reset talent and spell uses
    let talentData = this.items.filter(i => i.type === 'talent')
    let spellData = this.items.filter(i => i.type === 'spell')
    if(talentRecovery) talentData = talentData.map(t => ({_id: t.id, 'system.uses.value': 0}))
    if(magicRecovery) spellData = spellData.map(s => ({_id: s.id, 'system.castings.value': 0}))
    await this.updateEmbeddedDocuments('Item', [...talentData, ...spellData])

    if(healing) {
      await this.applyHealing(true)
      if (restTime === 24) this.applyHealing(true)
    }

		for (let effect of this.appliedEffects) {
			const specialDuration = foundry.utils.getProperty(effect, `flags.${game.system.id}.specialDuration`)
			// if (!(specialDuration?.length > 0)) continue
			if (specialDuration === 'RestComplete') await effect?.delete()
		}
    postRestToChat(this, restTime, magicRecovery, talentRecovery, healing)
  }

  async applyHealing(fullHealingRate) {
    let rate = this.system.characteristics.health?.healingrate || 0
    rate = fullHealingRate ? rate : rate / 2
    return await this.increaseDamage(-rate)
  }

  async increaseDamage(increment) {
    const health = this.system.characteristics.health
    const newHp = Math.max(0, Math.min(health.max, Math.floor(health.value + increment)))

    if (increment > 0) {
      // Check if hit is an instant death
      if (increment >= health.max) {
        await findAddEffect(this, 'dead', true)
      }

      // If character is incapacitated, die
      else if (this.effects.find(e => e.statuses.has("incapacitated"))) {
        await findAddEffect(this, 'dead', true)
      }
    }

    return this.update({
      'system.characteristics.health.value': newHp
    })
  }

  async setUsesOnSpells() {
    const power = this.system.characteristics.power
    const diff = []
    this.items
      .filter(i => i.type === 'spell')
      .map(s => {
        // The castings on this spell have been set by the user, skip the calculation
        if (s.system.castings.ignoreCalculation) return
        const rank = s.system.rank
        const currentMax = s.system.castings.max
        const newMax = CONFIG.DL.spellUses[power]?.[rank] ?? 0
        if (currentMax !== newMax) diff.push({_id: s.id, 'system.castings.max': newMax})
      })
    if (diff.length > 0) return await this.updateEmbeddedDocuments('Item', diff)
  }

  async setEncumbrance() {
    if (game.settings.get('demonlord', 'ignoreEncumbrance')) return
    const armors = this.items.filter(i => i.type === 'armor')
    const notMetItemNames = armors
      .map(a => a.system)
      .filter(a => a.requirement?.minvalue > (this.getAttribute(a.requirement?.attribute)?.value + this.getAttribute(a.requirement?.attribute)?.requirementModifier) && a.wear)
      .map(a => a.name)
    return await DLActiveEffects.addEncumbrance(this, notMetItemNames)
  }

  async handleHealthChange() {
    if (this.type === 'vehicle') return // Ignore vehicles
    if (this.effects.find(e => e.statuses.has("dead"))) return // Character is dead
    const hp = this.system.characteristics.health

    // Incapacitated
    if (hp.value >= hp.max) await findAddEffect(this, 'incapacitated')
    else await findDeleteEffect(this, 'incapacitated')

    // Injured
    if (hp.value >= (hp.max / 2)) {
      await findAddEffect(this, 'injured')
      await this.update({ 'system.characteristics.health.injured': true})
    } else {
      await findDeleteEffect(this, 'injured')
      await this.update({ 'system.characteristics.health.injured': false})
    }
  }

  isImmuneToAffliction(affliction) {
    return this.appliedEffects.filter(e => !e.disabled).some(e => e.changes.some(c => c.key == 'system.bonuses.immune.affliction' && c.value == affliction))
  }

  getSizeFromString(sizeString) {
    let result = 0
    if (sizeString.includes("/")) {
      const [numerator, denominator] = sizeString.split("/")
      result = parseInt(numerator) / parseInt(denominator)
    } else if (['½', '¼', '⅛'].includes(sizeString)) {
      switch (sizeString) {
        case '½':
          result = 0.5
          break
        case '¼':
          result = 0.25
          break
          case '⅛':
            result = 0.125
          break
      }
    } else {
      result = parseFloat(sizeString)
    }

    return result
  }

  getSizeFromNumber(sizeNumber) {
    // Calculate string if fraction
    if (sizeNumber >= 1) {
      return Math.floor(sizeNumber).toString()
    } else if (sizeNumber >= 0.5) {
      return "1/2";
    } else if (sizeNumber >= 0.25) {
      return "1/4";
    } else if (sizeNumber >= 0.125) {
      return "1/8";
    } else if (sizeNumber >= 0.0625) {
      return "1/16";
    } else if (sizeNumber >= 0.03125) {
      return "1/32";
    }
  }
}
