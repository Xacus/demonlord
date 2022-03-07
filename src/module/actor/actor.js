/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
import { DLActiveEffects } from '../active-effects/item-effects'
import { DLAfflictions } from '../active-effects/afflictions'
import { capitalize, plusify } from '../utils/utils'
import launchRollDialog from '../dialog/roll-dialog'
import {
  postAttackToChat,
  postAttributeToChat,
  postCorruptionToChat,
  postItemToChat,
  postSpellToChat,
  postTalentToChat,
} from '../chat/roll-messages'
import { handleCreateAncestry, handleCreatePath } from '../item/nested-objects'
import { TokenManager } from '../pixi/token-manager'

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
    const data = this.data.data
    // Set the base perception equal to intellect
    if (this.data.type === 'character') data.attributes.perception.value = data.attributes.intellect.value || 10

    setProperty(data, 'bonuses', {
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
      armor: { fixed: 0, agility: 0, defense: 0, override: 0 },
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

    setProperty(data, 'maluses', {
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
      for (const [key, attribute] of Object.entries(data.attributes)) {
        attribute.value = Math.min(attribute.max, Math.max(attribute.min, attribute.value))
        attribute.label = game.i18n.localize(`DL.Attribute${capitalize(key)}`)
      }
      data.attributes.perception.label = game.i18n.localize(`DL.CharPerception`)
  
      // Speed
      data.characteristics.speed = Math.max(0, data.characteristics.speed)

      // Defense (assume it's agility)
      data.characteristics.defense = 0
  }

  /* -------------------------------------------- */

  /**
   * Prepare actor data that depends on items and effects
   * @override
   */
  prepareDerivedData() {
    const data = this.data.data
    
    // We can reapply some active effects if we know they happened
    // We're copying what it's done in applyActiveEffects
    const effectChanges = this.effects.reduce((changes, e) => {
      if ( e.data.disabled || e.isSuppressed ) return changes
      return changes.concat(e.data.changes.map(c => {
        c = foundry.utils.duplicate(c)
        c.effect = e
        c.priority = c.priority ?? (c.mode * 10)
        return c
      }))
    }, []).filter(e => e.key.startsWith("data.attributes") || e.key.startsWith("data.characteristics"))
    effectChanges.sort((a, b) => a.priority - b.priority)
    // effectChanges now contains active effects for attributes and characteristics sorted by priority
    

    // Clamp attribute values and calculate modifiers
    for (const attribute of Object.values(data.attributes)) {
      attribute.value = Math.min(attribute.max, Math.max(attribute.min, attribute.value))
      attribute.modifier = attribute.value - 10
    }

    // Maluses
    if (data.maluses.halfSpeed) data.characteristics.speed = Math.floor(data.characteristics.speed / 2)

    // --- Character specific data ---
    if (this.data.type === 'character') {
      // Override Perception value
      data.attributes.perception.value += data.attributes.intellect.modifier
      data.attributes.perception.value = Math.min(data.attributes.perception.max,
        Math.max(data.attributes.perception.min, data.attributes.perception.value))
      for (let change of effectChanges.filter(e => e.key.includes("perception"))) {
        const result = change.effect.apply(this, change)
        if ( result !== null ) this.overrides[change.key] = result
      }
      data.attributes.perception.modifier = data.attributes.perception.value - 10

      // Health and Healing Rate
      data.characteristics.health.max = data.attributes.strength.value
      data.characteristics.health.healingrate = Math.floor(data.characteristics.health.max / 4)
      for (let change of effectChanges.filter(e => e.key.includes("health"))) {
        const result = change.effect.apply(this, change)
        if ( result !== null ) this.overrides[change.key] = result
      }
      // Insanity
      data.characteristics.insanity.max += data.attributes.will.value
      
      // Armor
      data.characteristics.defense = data.bonuses.armor.fixed || data.attributes.agility.value + data.bonuses.armor.agility
      data.characteristics.defense += data.bonuses.armor.defense
      data.characteristics.defense = data.bonuses.armor.override || data.characteristics.defense
      for (let change of effectChanges.filter(e => e.key.includes("defense"))) {
        const result = change.effect.apply(this, change)
        if ( result !== null ) this.overrides[change.key] = result
      }
    }
  }

  /* -------------------------------------------- */
  /*  _onOperations                                */
  /* -------------------------------------------- */

  /** @override */
  _onUpdate(changed, options, user) {
    super._onUpdate(changed, options, user)
    if (changed?.data?.level) {
      this._handleEmbeddedDocuments({ debugCaller: '_onUpdate' })
    }
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
      // Ancestry an path creations
      if (doc.type === 'ancestry') {
        await handleCreateAncestry(this, doc.data.data)
      } else if (doc.type === 'path') {
        await handleCreatePath(this, doc.data.data)
      }

      await DLActiveEffects.embedActiveEffects(this, doc, 'create')
    }
    await this._handleEmbeddedDocuments({ debugCaller: `_handleOnCreateEmbedded [${documents.length}]` })
    return Promise.resolve()
  }

  /* -------------------------------------------- */

  _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    super._onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId)
    if (embeddedName === 'Item' && userId === game.userId && !options.noEmbedEffects)
      this._handleOnUpdateEmbedded(documents).then(_ => this.sheet.render())
  }

  async _handleOnUpdateEmbedded(documents) {
    console.log('DEMONLORD | Calling _handleOnUpdateEmbedded', documents)
    for (const doc of documents) await DLActiveEffects.embedActiveEffects(this, doc, 'update')
    await this._handleEmbeddedDocuments({ debugCaller: `_handleOnUpdateEmbedded [${documents.length}]` })
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
      [game.i18n.localize("DL.CharPerception").toLowerCase()]: "perception",
    }
    const normalizedName = attributes[attributeName.toLowerCase()] || attributeName.toLowerCase()
    return getProperty(this.data.data, `attributes.${normalizedName}`, this.data.data[attributeName])
  }

  /* -------------------------------------------- */
  /*  Rolls and Actions                           */
  /* -------------------------------------------- */

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
    const attackAttribute = item.data.data.action?.attack?.toLowerCase()
    const defenseAttribute = item.data.data?.action?.against?.toLowerCase() || item.data.action?.against?.toLowerCase()

    // If no attack mod selected, warn user
    if (!attackAttribute) {
      ui.notifications.error(game.i18n.localize('DL.DialogWarningWeaponAttackModifier'))
      return
    }
    // if !target -> ui.notifications.warn(Please select target) ??

    // Attack modifier and Boons/Banes
    const attackModifier =
      (attacker.data.data?.attributes[attackAttribute]?.modifier || 0) + (parseInt(inputModifier) || 0)
    let attackBOBA =
      (parseInt(item.data.data.action.boonsbanes) || 0) +
      (parseInt(inputBoons) || 0) +
      (attacker.data.data.bonuses.attack.boons[attackAttribute] || 0)

    // The defender banes apply only if the defender is one target
    if (defendersTokens.length === 1)
      attackBOBA -=
        (defender?.data.data.bonuses.defense.boons[defenseAttribute] || 0) +
        (defender?.data.data.bonuses.defense.boons.weapon || 0)

    // Check if requirements met
    if (item.data.data.wear && parseInt(item.data.data.strengthmin) > attacker.getAttribute("strength").value)
      attackBOBA--

    // Roll the attack
    let diceFormula = '1d20' + (plusify(attackModifier) || '')
    if (attackBOBA) diceFormula += plusify(attackBOBA) + 'd6kh'

    const attackRoll = new Roll(diceFormula, {})
    attackRoll.evaluate({async: false})

    postAttackToChat(attacker, defender, item, attackRoll, attackAttribute, defenseAttribute)

    const hitTargets = defendersTokens.filter(d => {
      const targetNumber =
        defenseAttribute === 'defense'
          ? d.actor?.data.data.characteristics.defense
          : d.actor?.data.data.attributes[defenseAttribute]?.value || ''
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
  rollWeaponAttack(itemID, _options = { event: null }) {
    const item = this.getEmbeddedDocument('Item', itemID)

    // If no attribute to roll, roll without modifiers and boons
    const attribute = item.data.data.action?.attack
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
    const boons = parseInt(inputBoons) + (this.data.data.bonuses.challenge.boons[attribute] || 0)

    let diceFormula = '1d20' + (plusify(modifier) || '')
    if (boons) diceFormula += plusify(boons) + 'd6kh'

    const challengeRoll = new Roll(diceFormula, {})
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

  rollTalent(itemID, _options = { event: null }) {
    if (DLAfflictions.isActorBlocked(this, 'challenge', 'strength'))
      //FIXME
      return

    const item = this.items.get(itemID)
    const uses = parseInt(item.data.data?.uses?.value) || 0
    const usesMax = parseInt(item.data.data?.uses?.max) || 0
    if (usesMax !== 0 && uses >= usesMax) {
      ui.notifications.warn(game.i18n.localize('DL.TalentMaxUsesReached'))
      return
    }

    if (item.data?.vs?.attribute)
      launchRollDialog(game.i18n.localize('DL.TalentVSRoll') + game.i18n.localize(item.name), html =>
        this.useTalent(item, html.find('[id="boonsbanes"]').val(), html.find('[id="modifier"]').val()),
      )
    else this.useTalent(item, 0, 0)
  }

  async useTalent(talent, inputBoons, inputModifier) {
    const talentData = talent.data.data
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
        (this.data.data.bonuses.attack[attackAttribute] || 0) + // FIXME: is it a challenge or an attack?
        parseInt(talentData.vs?.boonsbanes || 0)
      if (targets.length > 0) boons -= target?.actor?.data.data.bonuses.defense[defenseAttribute] || 0

      let attackRollFormula = '1d20' + plusify(modifier) + (boons ? plusify(boons) + 'd6kh' : '')
      attackRoll = new Roll(attackRollFormula, {})
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

  async rollSpell(itemID, _options = { event: null }) {
    const item = this.items.get(itemID)
    const isAttack = item.data.spelltype === game.i18n.localize('DL.SpellTypeAttack')
    const attackAttribute = item.data.data?.action?.attack?.toLowerCase()
    const challengeAttribute = item.data.data?.attribute?.toLowerCase()

    // Check if actor is blocked
    // If it has an attack attribute, check action attack else if it has a challenge attribute, check action challenge
    if (isAttack && attackAttribute && DLAfflictions.isActorBlocked(this, 'attack', attackAttribute)) return
    else if (challengeAttribute && DLAfflictions.isActorBlocked(this, 'challenge', challengeAttribute)) return

    // Check uses
    const uses = parseInt(item.data.data?.castings?.value) || 0
    const usesMax = parseInt(item.data.data?.castings?.max) || 0

    if (usesMax !== 0 && uses >= usesMax) {
      ui.notifications.warn(game.i18n.localize('DL.TalentMaxUsesReached'))
      return
    } else await item.update({ 'data.castings.value': uses + 1 }, { parent: this })

    if (isAttack && attackAttribute)
      launchRollDialog(game.i18n.localize('DL.DialogSpellRoll') + game.i18n.localize(item.name), html =>
        this.useSpell(item, html.find('[id="boonsbanes"]').val(), html.find('[id="modifier"]').val()),
      )
    else this.useSpell(item, 0, 0)
  }

  async useSpell(spell, inputBoons, inputModifier) {
    const targets = tokenManager.targets
    const target = targets[0]
    const spellData = spell.data.data

    const attackAttribute = spellData?.action?.attack?.toLowerCase()
    const defenseAttribute = spellData?.action?.against?.toLowerCase()

    let attackRoll
    if (attackAttribute) {
      let attackBoons =
        (parseInt(inputBoons) || 0) +
        (parseInt(spellData.action.boonsbanes) || 0) +
        (this.data.data.bonuses.attack.boons[attackAttribute] || 0)

      if (targets.length > 0)
        attackBoons -=
          (target?.actor?.data.data.bonuses.defense.boons[defenseAttribute] || 0) +
          (target?.actor?.data.data.bonuses.defense.boons.spell || 0)

      const attackModifier = (parseInt(inputModifier) || 0) + this.getAttribute(attackAttribute).modifier || 0

      const attackFormula = '1d20' + plusify(attackModifier) + (attackBoons ? plusify(attackBoons) + 'd6kh' : '')
      attackRoll = new Roll(attackFormula, {})
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
    if (item.data.quantity < 1) {
      ui.notifications.warn(game.i18n.localize('DL.ItemMaxUsesReached'))
      return
    }
    item.data.quantity--
    await Item.updateDocuments([item], { parent: this })
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
    delete itemData.data.type

    // Finally, create the item!
    return await this.createItem(itemData)
  }

  showItemInfo(item) {
    const uses = parseInt(item.data?.data?.enchantment?.uses?.value)
    const usesmax = parseInt(item.data?.data?.enchantment?.uses?.max)

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
          value: item.data?.data?.healingoption,
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
        let againstSelectedAttribute = item.data.data?.action?.against?.toLowerCase()

        if (againstSelectedAttribute == undefined) {
          againstSelectedAttribute = item.data.action?.against?.toLowerCase()
        }

        if (againstSelectedAttribute == 'defense') {
          tagetNumber = targetActor.data.data?.characteristics?.defense
        } else {
          tagetNumber = targetActor.data.data?.attributes[againstSelectedAttribute]?.value
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
        const againstSelectedAttribute = talent.data.data.vs.against.toLowerCase()

        if (againstSelectedAttribute == 'defense') {
          tagetNumber = targetActor.data.data.characteristics.defense
        } else {
          tagetNumber = targetActor.getAttribute(againstSelectedAttribute).value
        }
      }
    })

    return tagetNumber
  }

  /* -------------------------------------------- */

  async activateTalent(talent, setActive) {
    let uses = talent.data.data.uses?.value || 0
    const usesmax = talent.data.data.uses?.max || 0
    if (usesmax > 0 && uses < usesmax)
      return talent.update({ 'data.uses.value': ++uses, 'data.addtonextroll': setActive }, { parent: this })
  }

  async deactivateTalent(talent, decrement = 0, onlyTemporary = false) {
    if (onlyTemporary && !talent.data.data.uses?.max) return
    let uses = talent.data.data.uses?.value || 0
    uses = Math.max(0, uses - decrement)
    talent.update({ 'data.uses.value': uses, 'data.addtonextroll': false }, { parent: this })
  }

  /* -------------------------------------------- */

  async addDamageToTarget(damage) {
    game.user.targets.forEach(target => {
      const currentDamage = parseInt(target.actor.data.data.characteristics.health.value)
      target?.actor.update({
        'data.characteristics.health.value': currentDamage + damage,
      })
    })
  }

  async restActor() {
    // Reset talent and spell uses
    const talentData = this.items.filter(i => i.type === 'talent').map(t => ({ _id: t.id, 'data.uses.value': 0 }))
    const spellData = this.items.filter(i => i.type === 'spell').map(s => ({ _id: s.id, 'data.castings.value': 0 }))

    await this.updateEmbeddedDocuments('Item', [...talentData, ...spellData])
    await this.applyHealing(true)

    var templateData = { actor: this }

    const chatData = {
      user: game.user.id,
      speaker: { actor: this.id, token: this.token, alias: this.name },
    }

    const template = 'systems/demonlord/templates/chat/rest.html'
    renderTemplate(template, templateData).then(content => {
      chatData.content = content
      ChatMessage.create(chatData)
    })
  }

  async applyHealing(fullHealingRate) {
    let rate = this.data.data.characteristics.health?.healingrate || 0
    rate = fullHealingRate ? rate : rate / 2
    return this.increaseDamage(-rate)
  }

  async increaseDamage(increment) {
    const health = this.data.data.characteristics.health
    const newHp = Math.max(0, Math.min(+health.max, Math.floor(+health.value + +increment)))
    return this.update({ 'data.characteristics.health.value': newHp })
  }

  async setUsesOnSpells() {
    const power = this.data.data.characteristics.power
    const diff = []
    this.data.items
      .filter(i => i.type === 'spell')
      .map(s => {
        const rank = s.data.data.rank
        const currentMax = s.data.data.castings.max
        const newMax = CONFIG.DL.spelluses[power]?.[rank] ?? 0
        if (currentMax !== newMax) diff.push({ _id: s.id, 'data.castings.max': newMax })
      })
    if (diff.length > 0) return this.updateEmbeddedDocuments('Item', diff)
  }

  async setEncumbrance() {
    const armors = this.data.armor || this.items.filter(i => i.type === 'armor').map(a => a.data)
    const notMetItemNames = armors
      .filter(a => a.data.strengthmin > this.getAttribute("strength").value && a.data.wear)
      .map(a => a.name)
    return await DLActiveEffects.addEncumbrance(this, notMetItemNames)
  }
}
