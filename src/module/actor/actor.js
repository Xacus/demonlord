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
} from '../chat/roll-messages'
import {handleCreateAncestry, handleCreatePath} from '../item/nested-objects'
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
    }

    setProperty(system, 'bonuses', {
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
      armor: {fixed: 0, agility: 0, defense: 0, override: 0},
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

    setProperty(system, 'maluses', {
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
      halfSpeed: 0,
      noFastTurn: 0,
    })

    // Bound attribute value
    system.attributes.perception.max = 25
    for (const [key, attribute] of Object.entries(system.attributes)) {
      attribute.min = 0
      attribute.value = Math.min(attribute.max, Math.max(attribute.min, attribute.value))
      attribute.label = game.i18n.localize(`DL.Attribute${capitalize(key)}`)
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
    const effectChanges = this.effects.reduce((changes, e) => {
      if (e.disabled || e.isSuppressed) return changes
      return changes.concat(e.changes.map(c => {
        c = foundry.utils.duplicate(c)
        c.effect = e
        c.priority = c.priority ?? (c.mode * 10)
        return c
      }))
    }, []).filter(e => e.key.startsWith("data.attributes") || e.key.startsWith("data.characteristics"))
    effectChanges.sort((a, b) => a.priority - b.priority)
    // effectChanges now contains active effects for attributes and characteristics sorted by priority


    // Clamp attribute values and calculate modifiers
    for (const attribute of Object.values(system.attributes)) {
      attribute.value = Math.min(attribute.max, Math.max(attribute.min, attribute.value))
      attribute.modifier = attribute.value - 10
    }

    // Maluses
    if (system.maluses.halfSpeed) system.characteristics.speed = Math.floor(system.characteristics.speed / 2)

    // --- Character specific data ---
    if (this.type === 'character') {
      // Override Perception value
      system.attributes.perception.value += system.attributes.intellect.modifier
      system.attributes.perception.value = Math.min(system.attributes.perception.max,
        Math.max(system.attributes.perception.min, system.attributes.perception.value))
      system.attributes.perception.modifier = system.attributes.perception.value - 10

      // Health and Healing Rate
      system.characteristics.health.max += system.attributes.strength.value
      system.characteristics.health.healingrate += Math.floor(system.characteristics.health.max / 4)
      // Insanity
      system.characteristics.insanity.max += system.attributes.will.value

      // Armor
      system.characteristics.defense = (system.bonuses.armor.fixed || system.attributes.agility.value + system.bonuses.armor.agility) + system.characteristics.defense
    }
    // --- Creature specific data ---
    else {
      system.characteristics.defense = system.characteristics.defense || system.bonuses.armor.fixed || system.attributes.agility.value + system.bonuses.armor.agility
    }
    // Final armor computation
    system.characteristics.defense += system.bonuses.armor.defense
    system.characteristics.defense = system.bonuses.armor.override || system.characteristics.defense
    for (let change of effectChanges.filter(e => e.key.includes("defense"))) {
      const result = change.effect.apply(this, change)
      if (result !== null) this.overrides[change.key] = result
    }
  }

  /* -------------------------------------------- */
  /*  _onOperations                                */

  /* -------------------------------------------- */

  /** @override */
  _onUpdate(changed, options, user) {
    super._onUpdate(changed, options, user)
    if (changed?.level || changed?.system?.level) {
      this._handleEmbeddedDocuments({debugCaller: '_onUpdate'})
    }
    if (changed.system?.characteristics?.health) this.handleIncapacitated()
  }

  async _handleEmbeddedDocuments(options = {}) {
    //TODO: Remove logs when stable
    console.log(`DEMONLORD | Calling _handleEmbeddedDocuments from ${options?.debugCaller || '??'}`)
    await DLActiveEffects.toggleEffectsByActorRequirements(this)
    await this.setUsesOnSpells()
    await this.setEncumbrance()
    return Promise.resolve()
  }

  /* -------------------------------------------- */

  _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    super._onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId)
    if (embeddedName === 'Item' && userId === game.userId)
      this._handleOnCreateEmbedded(documents).then(_ => this.sheet.render())
  }

  async _handleOnCreateEmbedded(documents) {
    console.log('DEMONLORD | Calling _handleOnCreateEmbedded', documents)
    for (const doc of documents) {
      // Ancestry and path creations
      if (doc.type === 'ancestry') {
        await handleCreateAncestry(this, doc)
      } else if (doc.type === 'path') {
        await handleCreatePath(this, doc)
      }

      await DLActiveEffects.embedActiveEffects(this, doc, 'create')
    }
    await this._handleEmbeddedDocuments({debugCaller: `_handleOnCreateEmbedded [${documents.length}]`})
    return Promise.resolve()
  }

  /* -------------------------------------------- */

  _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    super._onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId)

    // Check if only the flag has changed. If so, we can skip the handling
    const keys = new Set(result.reduce((prev, r) => prev.concat(Object.keys(r)), []))
    if (keys.size <= 2 && keys.has('flags')) {
      // Maybe check if the changed flag is 'levelRequired'?
      return
    }

    if (embeddedName === 'Item' && userId === game.userId && !options.noEmbedEffects)
      this._handleOnUpdateEmbedded(documents).then(_ => this.sheet.render())
  }

  async _handleOnUpdateEmbedded(documents) {
    console.log('DEMONLORD | Calling _handleOnUpdateEmbedded', documents)
    for (const doc of documents) await DLActiveEffects.embedActiveEffects(this, doc, 'update')
    await this._handleEmbeddedDocuments({debugCaller: `_handleOnUpdateEmbedded [${documents.length}]`})
    return Promise.resolve()
  }

  /**
   * Get actor attribute by localized name
   * @param attributeName                    Localized name
   */
  getAttribute(attributeName) {
    const attributes = {
      [game.i18n.localize("DL.AttributeStrength").toLowerCase()]: "strength",
      [game.i18n.localize("DL.AttributeAgility").toLowerCase()]: "agility",
      [game.i18n.localize("DL.AttributeIntellect").toLowerCase()]: "intellect",
      [game.i18n.localize("DL.AttributeWill").toLowerCase()]: "will",
      [game.i18n.localize("DL.AttributePerception").toLowerCase()]: "perception",
    }
    const normalizedName = attributes[attributeName.toLowerCase()] || attributeName.toLowerCase()
    return getProperty(this.system, `attributes.${normalizedName}`, this.system[attributeName])
  }

  /* -------------------------------------------- */
  /*  Rolls and Actions                           */

  /* -------------------------------------------- */
  rollFormula(mod, boba, bobaRerolls) {
    let rollFormula = '1d20' + plusify(mod)
    if (boba > 0 && bobaRerolls) rollFormula += `+${boba}d6r1kh`
    else if (boba) rollFormula += plusify(boba) + 'd6r1kh'
    console.log(rollFormula)
    return rollFormula
  }

  /**
   * Rolls an attack using an Item
   * @param item                    Weapon / Spell / Talent used for attacking
   * @param inputBoons              Number of boons/banes from the user dialog
   * @param inputModifier           Attack modifier from the user dialog
   */
  rollAttack(item, inputBoons = 0, inputModifier = 0) {
    const attacker = this
    const defendersTokens = tokenManager.targets
    const defender = defendersTokens[0]?.actor

    // Get attacker attribute and defender attribute name
    const attackAttribute = item.system.action?.attack?.toLowerCase()
    const defenseAttribute = item.system.action?.against?.toLowerCase()

    // If no attack mod selected, warn user
    if (!attackAttribute) {
      ui.notifications.error(game.i18n.localize('DL.DialogWarningWeaponAttackModifier'))
      return
    }
    // if !target -> ui.notifications.warn(Please select target) ??

    // Attack modifier and Boons/Banes
    const modifier =
      (attacker.system?.attributes[attackAttribute]?.modifier || 0) + (parseInt(inputModifier) || 0)
    let boons =
      (parseInt(item.system.action.boonsbanes) || 0) +
      (parseInt(inputBoons) || 0) +
      (attacker.system.bonuses.attack.boons[attackAttribute] || 0) +
      (attacker.system.bonuses.attack.boons.weapon || 0)

    // The defender banes apply only if the defender is one target
    if (defendersTokens.length === 1)
      boons -=
        (defender?.system.bonuses.defense.boons[defenseAttribute] || 0) +
        (defender?.system.bonuses.defense.boons.weapon || 0)

    // Check if requirements met
    if (item.system.wear && parseInt(item.system.strengthmin) > attacker.getAttribute("strength").value)
      boons--
    const boonsReroll = parseInt(this.system.bonuses.rerollBoon1Dice)

    // Roll the attack
    const attackRoll = new Roll(this.rollFormula(modifier, boons, boonsReroll), {})
    attackRoll.evaluate({async: false})

    postAttackToChat(attacker, defender, item, attackRoll, attackAttribute, defenseAttribute)

    const hitTargets = defendersTokens.filter(d => {
      const targetNumber =
        defenseAttribute === 'defense'
          ? d.actor?.system.characteristics.defense
          : d.actor?.system.attributes[defenseAttribute]?.value || ''
      return attackRoll?.total >= targetNumber
    })

    Hooks.call('DL.RollAttack', {
      sourceToken: attacker.token || tokenManager.getTokenByActorId(attacker.id),
      targets: defendersTokens,
      itemId: item.id,
      hitTargets: hitTargets,
    })
  }

  /**
   * Roll an attack using a weapon, calling a dialog for the user to input boons and modifiers
   * @param itemID          The id of the item
   * @param _options         Additional options
   */
  rollWeaponAttack(itemID, _options = {event: null}) {
    const item = this.getEmbeddedDocument('Item', itemID)

    // If no attribute to roll, roll without modifiers and boons
    const attribute = item.system.action?.attack
    if (!attribute) {
      this.rollAttack(item, 0, 0)
      return
    }

    // Check if actor is blocked by an affliction
    if (!DLAfflictions.isActorBlocked(this, 'action', attribute))
      launchRollDialog(game.i18n.localize('DL.DialogAttackRoll') + game.i18n.localize(item.name), html =>
        this.rollAttack(item, html.find('[id="boonsbanes"]').val(), html.find('[id="modifier"]').val()),
      )
  }

  /* -------------------------------------------- */

  rollAttribute(attribute, inputBoons, inputModifier) {
    attribute = attribute.label.toLowerCase()
    const modifier = parseInt(inputModifier) + (this.getAttribute(attribute)?.modifier || 0)
    const boons = parseInt(inputBoons) + (this.system.bonuses.challenge.boons[attribute] || 0)
    const boonsReroll = parseInt(this.system.bonuses.rerollBoon1Dice)

    const challengeRoll = new Roll(this.rollFormula(modifier, boons, boonsReroll), {})
    challengeRoll.evaluate({async: false})
    postAttributeToChat(this, attribute, challengeRoll)
  }

  rollChallenge(attribute) {
    if (typeof attribute === 'string' || attribute instanceof String) attribute = this.getAttribute(attribute)

    if (!DLAfflictions.isActorBlocked(this, 'challenge', attribute.label))
      launchRollDialog(this.name + ': ' + game.i18n.localize('DL.DialogChallengeRoll').slice(0, -2), html =>
        this.rollAttribute(attribute, html.find('[id="boonsbanes"]').val(), html.find('[id="modifier"]').val()),
      )
  }

  /* -------------------------------------------- */

  rollTalent(itemID, _options = {event: null}) {
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

    if (item.system?.vs?.attribute)
      launchRollDialog(game.i18n.localize('DL.TalentVSRoll') + game.i18n.localize(item.name), html =>
        this.useTalent(item, html.find('[id="boonsbanes"]').val(), html.find('[id="modifier"]').val()),
      )
    else this.useTalent(item, 0, 0)
  }

  async useTalent(talent, inputBoons, inputModifier) {
    const talentData = talent.system
    const targets = tokenManager.targets
    const target = targets[0]
    let attackRoll = null

    if (!talentData?.vs?.attribute) {
      await this.activateTalent(talent, true)
    } else {
      await this.activateTalent(talent, Boolean(talentData.vs?.damageActive))

      const attackAttribute = talentData.vs.attribute.toLowerCase()
      const defenseAttribute = talentData.vs?.against?.toLowerCase()

      let modifier = parseInt(inputModifier) + (this.getAttribute(attackAttribute)?.modifier || 0)

      let boons =
        parseInt(inputBoons) +
        (this.system.bonuses.attack[attackAttribute] || 0) + // FIXME: is it a challenge or an attack?
        parseInt(talentData.vs?.boonsbanes || 0)
      if (targets.length > 0) boons -= target?.actor?.system.bonuses.defense[defenseAttribute] || 0
      const boonsReroll = parseInt(this.system.bonuses.rerollBoon1Dice)

      attackRoll = new Roll(this.rollFormula(modifier, boons, boonsReroll), {})
      attackRoll.evaluate({async: false})
    }

    Hooks.call('DL.UseTalent', {
      sourceToken: this.token || tokenManager.getTokenByActorId(this.id),
      targets: targets,
      itemId: talent.id,
    })

    postTalentToChat(this, talent, attackRoll, target?.actor)
  }

  /* -------------------------------------------- */

  async rollSpell(itemID, _options = {event: null}) {
    const item = this.items.get(itemID)
    const isAttack = item.system.spelltype === game.i18n.localize('DL.SpellTypeAttack')
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

    if (isAttack && attackAttribute)
      launchRollDialog(game.i18n.localize('DL.DialogSpellRoll') + game.i18n.localize(item.name), html =>
        this.useSpell(item, html.find('[id="boonsbanes"]').val(), html.find('[id="modifier"]').val()),
      )
    else this.useSpell(item, 0, 0)
  }

  async useSpell(spell, inputBoons, inputModifier) {
    const targets = tokenManager.targets
    const target = targets[0]
    const spellData = spell.system

    const attackAttribute = spellData?.action?.attack?.toLowerCase()
    const defenseAttribute = spellData?.action?.against?.toLowerCase()

    let attackRoll
    if (attackAttribute) {
      let boons =
        (parseInt(inputBoons) || 0) +
        (parseInt(spellData.action.boonsbanes) || 0) +
        (this.system.bonuses.attack.boons[attackAttribute] || 0) +
        (this.system.bonuses.attack.boons.spell || 0)

      if (targets.length > 0)
        boons -=
          (target?.actor?.system.bonuses.defense.boons[defenseAttribute] || 0) +
          (target?.actor?.system.bonuses.defense.boons.spell || 0)

      const modifier = (parseInt(inputModifier) || 0) + this.getAttribute(attackAttribute).modifier || 0
      const boonsReroll = parseInt(this.system.bonuses.rerollBoon1Dice)

      attackRoll = new Roll(this.rollFormula(modifier, boons, boonsReroll), {})
      attackRoll.evaluate({async: false})
    }

    Hooks.call('DL.UseSpell', {
      sourceToken: this.token || tokenManager.getTokenByActorId(this.id),
      targets: targets,
      itemId: spell.id,
    })

    postSpellToChat(this, spell, attackRoll, target?.actor)
  }

  /* -------------------------------------------- */

  async useItem(itemID) {
    const item = duplicate(this.items.get(itemID))
    if (item.type !== 'item') return postItemToChat(this, item)
    if (item.system.quantity < 1) {
      ui.notifications.warn(game.i18n.localize('DL.ItemMaxUsesReached'))
      return
    }
    item.system.quantity--
    await Item.updateDocuments([item], {parent: this})
    postItemToChat(this, item)
  }

  /* -------------------------------------------- */

  rollCorruption() {
    const corruptionRoll = new Roll('1d20')
    corruptionRoll.evaluate({async: false})
    postCorruptionToChat(this, corruptionRoll)
  }

  /* -------------------------------------------- */

  async createItemCreate(event) {
    event.preventDefault()

    const header = event.currentTarget
    // Get the type of item to create.
    const type = header.dataset.type
    // Grab any data associated with this control.
    const data = duplicate(header.dataset)
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
    const uses = parseInt(item.system?.enchantment?.uses?.value)
    const usesmax = parseInt(item.system?.enchantment?.uses?.max)

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

    const template = 'systems/demonlord/templates/chat/enchantment.html'
    renderTemplate(template, templateData).then(content => {
      chatData.content = content
      ChatMessage.create(chatData)
    })
  }

  getTargetNumber(item) {
    let tagetNumber
    game.user.targets.forEach(async target => {
      const targetActor = target.actor
      if (targetActor) {
        let againstSelectedAttribute = item.system.action?.against?.toLowerCase()

        if (againstSelectedAttribute == undefined) {
          againstSelectedAttribute = item.system.action?.against?.toLowerCase()
        }

        if (againstSelectedAttribute == 'defense') {
          tagetNumber = targetActor.system?.characteristics?.defense
        } else {
          tagetNumber = targetActor.system?.attributes[againstSelectedAttribute]?.value
        }
      }
    })

    return tagetNumber
  }

  getVSTargetNumber(talent) {
    let tagetNumber

    game.user.targets.forEach(async target => {
      const targetActor = target.actor
      if (targetActor) {
        const againstSelectedAttribute = talent.system.vs.against.toLowerCase()

        if (againstSelectedAttribute == 'defense') {
          tagetNumber = targetActor.system.characteristics.defense
        } else {
          tagetNumber = targetActor.getAttribute(againstSelectedAttribute).value
        }
      }
    })

    return tagetNumber
  }

  /* -------------------------------------------- */

  async activateTalent(talent, setActive) {
    let uses = talent.system.uses?.value || 0
    const usesmax = talent.system.uses?.max || 0
    if (usesmax > 0 && uses < usesmax)
      return talent.update({'data.uses.value': ++uses, 'data.addtonextroll': setActive}, {parent: this})
  }

  async deactivateTalent(talent, decrement = 0, onlyTemporary = false) {
    if (onlyTemporary && !talent.system.uses?.max) return
    let uses = talent.system.uses?.value || 0
    uses = Math.max(0, uses - decrement)
    return talent.update({'data.uses.value': uses, 'data.addtonextroll': false}, {parent: this})
  }

  /* -------------------------------------------- */

  async addDamageToTarget(damage) {
    game.user.targets.forEach(target => {
      const currentDamage = parseInt(target.actor.system.characteristics.health.value)
      target?.actor.update({
        'data.characteristics.health.value': currentDamage + damage,
      })
    })
  }

  async restActor() {
    // Reset talent and spell uses
    const talentData = this.items.filter(i => i.type === 'talent').map(t => ({_id: t.id, 'data.uses.value': 0}))
    const spellData = this.items.filter(i => i.type === 'spell').map(s => ({_id: s.id, 'data.castings.value': 0}))

    await this.updateEmbeddedDocuments('Item', [...talentData, ...spellData])
    await this.applyHealing(true)

    var templateData = {actor: this}

    const chatData = {
      user: game.user.id,
      speaker: {actor: this.id, token: this.token, alias: this.name},
    }

    const template = 'systems/demonlord/templates/chat/rest.html'
    renderTemplate(template, templateData).then(content => {
      chatData.content = content
      ChatMessage.create(chatData)
    })
  }

  async applyHealing(fullHealingRate) {
    let rate = this.system.characteristics.health?.healingrate || 0
    rate = fullHealingRate ? rate : rate / 2
    return this.increaseDamage(-rate)
  }

  async increaseDamage(increment) {
    const health = this.system.characteristics.health
    const newHp = Math.max(0, Math.min(health.max, Math.floor(health.value + increment)))
    return this.update({'data.characteristics.health.value': newHp})
  }

  async setUsesOnSpells() {
    const power = this.system.characteristics.power
    const diff = []
    this.items
      .filter(i => i.type === 'spell')
      .map(s => {
        const rank = s.system.rank
        const currentMax = s.system.castings.max
        const newMax = CONFIG.DL.spelluses[power]?.[rank] ?? 0
        if (currentMax !== newMax) diff.push({_id: s.id, 'data.castings.max': newMax})
      })
    if (diff.length > 0) return this.updateEmbeddedDocuments('Item', diff)
  }

  async setEncumbrance() {
    const armors = this.items.filter(i => i.type === 'armor')
    const notMetItemNames = armors
      .map(a => a.system)
      .filter(a => a.strengthmin > this.getAttribute("strength").value && a.wear)
      .map(a => a.name)
    return await DLActiveEffects.addEncumbrance(this, notMetItemNames)
  }

  async handleIncapacitated() {
    if (this.type !== 'character') return
    const hp = this.system.characteristics.health
    if (hp.value >= hp.max) findAddEffect(this, 'incapacitated')
    else findDeleteEffect(this, 'incapacitated')
  }
}
