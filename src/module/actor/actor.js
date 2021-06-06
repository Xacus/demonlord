/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
import { DLActiveEffects } from '../active-effects/item-effects'
import { DLAfflictions } from '../active-effects/afflictions'
import { plusify } from '../utils/utils'
import launchRollDialog from '../dialog/roll-dialog'
import {
  postAttackToChat,
  postAttributeToChat,
  postCorruptionToChat,
  postSpellToChat,
  postTalentToChat,
} from '../chat/roll-messages'
import { handleCreateAncestry, handleCreatePath } from '../item/nested-objects'

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
  }

  /* -------------------------------------------- */

  /**
   * Prepare actor data that depends on items and effects
   * @override
   */
  prepareDerivedData() {
    const data = this.data.data

    // Bound attribute value and calculate modifiers
    for (const [key, attribute] of Object.entries(data.attributes)) {
      attribute.value = Math.min(attribute.max, Math.max(attribute.min, attribute.value))
      attribute.modifier = attribute.value - 10
      attribute.label = key.toUpperCase()
    }
    // Speed
    data.characteristics.speed = Math.max(0, data.characteristics.speed)

    // Maluses
    if (data.maluses.halfSpeed) data.characteristics.speed = Math.floor(data.characteristics.speed / 2)

    // --- Character specific data ---
    if (this.data.type === 'character') {
      // Override Perception initial value
      data.attributes.perception.value += data.attributes.intellect.value - 10
      data.attributes.perception.modifier = data.attributes.perception.value - 10

      // Health and Healing Rate
      data.characteristics.health.max += data.attributes.strength.value
      data.characteristics.health.healingrate += Math.floor(data.characteristics.health.max / 4)
      // Insanity
      data.characteristics.insanity.max += data.attributes.will.value
      // Armor
      data.characteristics.defense +=
        data.bonuses.armor.fixed || data.attributes.agility.value + data.bonuses.armor.agility
      data.characteristics.defense += data.bonuses.armor.defense
      data.characteristics.defense = data.bonuses.armor.override || data.characteristics.defense
    }
  }

  /* -------------------------------------------- */
  /*  _onOperations                                */
  /* -------------------------------------------- */

  /** @override */
  _onUpdate(changed, options, user) {
    super._onUpdate(changed, options, user)
    this._handleEmbeddedDocuments()
  }

  async _handleEmbeddedDocuments() {
    await DLActiveEffects.toggleEffectsByActorRequirements(this)
    await this.setUsesOnSpells()
    await this.setEncumbrance()
  }

  /* -------------------------------------------- */

  _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    super._onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId)
    if (embeddedName === 'Item' && userId === game.userId)
      this._handleOnCreateEmbedded(documents).then(_ => this.sheet.render())
  }

  async _handleOnCreateEmbedded(documents) {
    for (const doc of documents) {
      // Ancestry an path creations
      if (doc.type === 'ancestry') {
        await handleCreateAncestry(this, doc.data.data)
      } else if (doc.type === 'path') {
        await handleCreatePath(this, doc.data.data)
      }

      await DLActiveEffects.embedActiveEffects(this, doc, 'create')
    }
    await this._handleEmbeddedDocuments()
    return Promise.resolve()
  }

  /* -------------------------------------------- */

  _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    super._onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId)
    if (embeddedName === 'Item' && userId === game.userId && !options.noEmbedEffects)
      this._handleOnUpdateEmbedded(documents).then(_ => this.sheet.render())
  }

  async _handleOnUpdateEmbedded(documents) {
    for (const doc of documents) await DLActiveEffects.embedActiveEffects(this, doc, 'update')
    await this._handleEmbeddedDocuments()
    return Promise.resolve()
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
    const defender = attacker.getTarget()
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
      (attacker.data.data.bonuses.attack.boons[attackAttribute] || 0) -
      (defender?.data.data.bonuses.defense.boons[defenseAttribute] || 0)

    // Check if requirements met
    if (item.data.data.wear && parseInt(item.data.data.strengthmin) > attacker.data.data.attributes.strength.value)
      attackBOBA--

    // Roll the attack
    let diceFormula = '1d20' + (plusify(attackModifier) || '')
    if (attackBOBA) diceFormula += plusify(attackBOBA) + 'd6kh'

    const attackRoll = new Roll(diceFormula, {})
    attackRoll.evaluate()

    postAttackToChat(attacker, defender, item, attackRoll, attackAttribute, defenseAttribute)
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
    const modifier = parseInt(inputModifier) + (this.data.data.attributes[attribute]?.modifier || 0)
    const boons = parseInt(inputBoons) + (this.data.data.bonuses.challenge.boons[attribute] || 0)

    let diceFormula = '1d20' + (plusify(modifier) || '')
    if (boons) diceFormula += plusify(boons) + 'd6kh'

    const challengeRoll = new Roll(diceFormula, {})
    challengeRoll.evaluate()
    postAttributeToChat(this, attribute, challengeRoll)
  }

  rollChallenge(attribute) {
    if (typeof attribute === 'string' || attribute instanceof String) attribute = this.data.data.attributes[attribute]

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
    const target = this.getTarget()
    let attackRoll = null

    if (!talentData?.vs?.attribute) await this.activateTalent(talent, true)
    else {
      await this.activateTalent(talent, Boolean(talentData.vs?.damageActive))

      const attackAttribute = talentData.vs.attribute.toLowerCase()
      const defenseAttribute = talentData.vs?.against?.toLowerCase()

      let modifier = parseInt(inputModifier) + (this.data.data.attributes[attackAttribute]?.modifier || 0)
      let boons =
        parseInt(inputBoons) +
        (this.data.data.bonuses.attack[attackAttribute] || 0) + // FIXME: is it a challenge or an attack?
        parseInt(talentData.vs?.boonsbanes || 0) -
        (target?.data.data.bonuses.defense[defenseAttribute] || 0)

      let attackRollFormula = '1d20' + plusify(modifier) + (boons ? plusify(boons) + 'd6kh' : '')
      attackRoll = new Roll(attackRollFormula, {})
      attackRoll.evaluate()
    }
    postTalentToChat(this, talent, attackRoll, target)
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
    const target = this.getTarget()
    const spellData = spell.data.data

    const attackAttribute = spellData?.action?.attack?.toLowerCase()
    const defenseAttribute = spellData?.action?.against?.toLowerCase()

    let attackRoll
    if (attackAttribute) {
      const attackBoons =
        (parseInt(inputBoons) || 0) +
        (parseInt(spellData.action.boonsbanes) || 0) +
        (this.data.data.bonuses.attack.boons[attackAttribute] || 0) -
        (target?.data.data.bonuses.defense.boons[defenseAttribute] || 0) -
        (target?.data.data.bonuses.defense.boons.spell || 0)
      const attackModifier = (parseInt(inputModifier) || 0) + this.data.data.attributes[attackAttribute].modifier || 0

      const attackFormula = '1d20' + plusify(attackModifier) + (attackBoons ? plusify(attackBoons) + 'd6kh' : '')
      attackRoll = new Roll(attackFormula, {})
      attackRoll.evaluate()
    }

    postSpellToChat(this, spell, attackRoll, target)
  }

  /* -------------------------------------------- */

  rollCorruption() {
    const corruptionRoll = new Roll('1d20 - @corruption', {
      corruption: this.data.data.characteristics.corruption,
    })
    corruptionRoll.evaluate()
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

  getTarget() {
    let selectedTarget = null
    game.user.targets.forEach(async target => {
      selectedTarget = target.actor
    })

    return selectedTarget
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
          tagetNumber = targetActor.data.data.attributes[againstSelectedAttribute].value
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

  setUsesOnSpells() {
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

  setEncumbrance() {
    const armors = this.data.armor || this.items.filter(i => i.type === 'armor').map(a => a.data)
    const notMetItemNames = armors
      .filter(a => a.data.strengthmin > this.data.data.attributes.strength.value && a.data.wear)
      .map(a => a.name)
    return DLActiveEffects.addEncumbrance(this, notMetItemNames)
  }
}
