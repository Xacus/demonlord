/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
import {DLActiveEffects} from '../active-effects/item-effects';
import {DLAfflictions} from "../active-effects/afflictions";
import {plusify} from "../utils/utils";
import launchRollDialog from "../dialog/roll-dialog"
import {
  postAttackToChat,
  postAttributeToChat,
  postCorruptionToChat,
  postSpellToChat,
  postTalentToChat
} from "../chat/roll-messages";

export class DemonlordActor extends Actor {

  /* -------------------------------------------- */
  /*  Data preparation                            */

  /* -------------------------------------------- */

  /** @override */
  prepareData() {
    if (!this.data.img) this.data.img = CONST.DEFAULT_TOKEN;
    if (!this.data.name) this.data.name = 'New ' + this.entity;
    DLActiveEffects.toggleEffectsByActorRequirements(this);
    this.prepareBaseData();
    this.prepareEmbeddedEntities();
    // this.applyActiveEffects()  call already present in prepareEmbeddedEntities as of 0.8.1
    this.prepareDerivedData();
  }

  /* -------------------------------------------- */

  /**
   * Prepare actor data that doesn't depend on effects or derived from items
   * @override
   */
  prepareBaseData() {
    const data = this.data.data;

    data.attributes.strength.value = 10;
    data.attributes.agility.value = 10;
    data.attributes.intellect.value = 10;
    data.attributes.will.value = 10;
    data.characteristics.speed = 10;

    // Zero-values
    data.attributes.strength.modifier = 0;
    data.attributes.agility.modifier = 0;
    data.attributes.intellect.modifier = 0;
    data.attributes.will.modifier = 0;
    data.attributes.perception.value = 0; // override perception value, since it's derived from will
    data.attributes.perception.modifier = 0;
    data.characteristics.health.max = 0;
    data.characteristics.health.healingrate = 0;
    data.characteristics.defense = 0;
    data.characteristics.insanity.max = 0;
    data.characteristics.power = 0;
    data.characteristics.size = '1';

    // Custom properties
    setProperty(data, 'bonuses', {
      attack: {
        sources: [],
        boons: {strength: 0, agility: 0, intellect: 0, will: 0, perception: 0},
        damage: '',
        plus20Damage: '',
        extraEffect: '',
      },
      challenge: {
        sources: [],
        boons: {strength: 0, agility: 0, intellect: 0, will: 0, perception: 0},
      },
      armor: {fixed: 0, agility: 0, defense: 0, override: 0},
      defense: {
        sources: [],
        boons: {spell: 0, strength: 0, agility: 0, intellect: 0, will: 0, defense: 0, perception: 0},
        noFastTurn: 0,
      },
    });

    setProperty(data, 'maluses', {
      autoFail: {
        challenge: {strength: 0, agility: 0, intellect: 0, will: 0, perception: 0},
        action: {strength: 0, agility: 0, intellect: 0, will: 0, perception: 0},
        halfSpeed: 0,
      },
    });
  }

  /* -------------------------------------------- */

  /**
   * Prepare actor data that depends on items and effects
   * @override
   */
  prepareDerivedData() {
    const data = this.data.data;

    // Override Perception initial value
    data.attributes.perception.value += data.attributes.will.value;

    // Bound attribute value and calculate modifiers
    for (const [key, attribute] of Object.entries(data.attributes)) {
      attribute.value = Math.min(attribute.max, Math.max(attribute.min, attribute.value));
      attribute.modifier += attribute.value - 10;
      attribute.label = key.toUpperCase();
    }

    // Health and Healing Rate
    data.characteristics.health.max += data.attributes.strength.value;
    data.characteristics.health.healingrate += Math.floor(data.characteristics.health.max / 4);

    // Insanity
    data.characteristics.insanity.max += data.attributes.will.value;

    // Armor
    data.characteristics.defense +=
      data.bonuses.armor.fixed || data.attributes.agility.value + data.bonuses.armor.agility;
    data.characteristics.defense += data.bonuses.armor.defense;
    data.characteristics.defense = data.bonuses.armor.override || data.characteristics.defense;

    // Speed
    data.characteristics.speed = Math.max(0, data.characteristics.speed);
    if (data.maluses.halfSpeed) data.characteristics.speed = Math.floor(data.characteristics.speed / 2);
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
    console.log(defender)
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
    const attackModifier
      = (attacker.data.data?.attributes[attackAttribute]?.modifier || 0)
      + (parseInt(inputModifier) || 0)
    let attackBOBA
      = (parseInt(item.data.data.action.boonsbanes) || 0)
      + (parseInt(inputBoons) || 0)
      + (attacker.data.data.bonuses.attack.boons[attackAttribute] || 0)
      - (defender?.data.data.bonuses.defense.boons[defenseAttribute] || 0)

    // Check if requirements met
    if (item.data.data.wear &&
      parseInt(item.data.data.strengthmin) > attacker.data.data.attributes.strength.value)
      attackBOBA--

    // Roll the attack
    let diceFormula = '1d20' + (plusify(attackModifier) || '')
    if (attackBOBA)
      diceFormula += plusify(attackBOBA) + 'd6kh'

    const attackRoll = new Roll(diceFormula, {})
    attackRoll.evaluate()

    postAttackToChat(attacker, defender, item, attackRoll, attackAttribute, defenseAttribute)
  }


  /**
   * Roll an attack using a weapon, calling a dialog for the user to input boons and modifiers
   * @param itemID          The id of the item
   * @param options         Additional options
   */
  rollWeaponAttack(itemID, options = {event: null}) {
    const item = this.getEmbeddedDocument('Item', itemID)

    // If no attribute to roll, roll without modifiers and boons
    const attribute = item.data.data.action?.attack
    if (!attribute) {
      this.rollAttack(item, 0, 0)
      return
    }

    // Check if actor is blocked by an affliction
    if (!DLAfflictions.isActorBlocked(this, 'action', attribute))
      launchRollDialog(
        game.i18n.localize('DL.DialogAttackRoll') + game.i18n.localize(item.name), (html) =>
          this.rollAttack(
            item,
            html.find('[id="boonsbanes"]').val(),
            html.find('[id="modifier"]').val()))
  }

  /* -------------------------------------------- */

  rollAttribute(attribute, inputBoons, inputModifier) {
    attribute = attribute.label.toLowerCase()
    const modifier = parseInt(inputModifier) + (this.data.data.attributes[attribute]?.modifier || 0)
    const boons = parseInt(inputBoons) + (this.data.data.bonuses.challenge.boons[attribute] || 0)

    let diceFormula = '1d20' + (plusify(modifier) || '')
    if (boons)
      diceFormula += plusify(boons) + 'd6kh'

    const challengeRoll = new Roll(diceFormula, {})
    challengeRoll.evaluate()
    postAttributeToChat(this, attribute, challengeRoll)
  }

  rollChallenge(attribute) {
    if (typeof attribute === 'string' || attribute instanceof String)
      attribute = this.data.data.attributes[attribute]

    if (!DLAfflictions.isActorBlocked(this, 'challenge', attribute.label))
      launchRollDialog(
        this.name + ': ' + game.i18n.localize('DL.DialogChallengeRoll').slice(0, -2),
        (html) =>
          this.rollAttribute(
            attribute,
            html.find('[id="boonsbanes"]').val(),
            html.find('[id="modifier"]').val()
          ))
  }

  /* -------------------------------------------- */

  rollTalent(itemID, options = {event: null}) {
    if (DLAfflictions.isActorBlocked(this, 'challenge', 'strength'))  //FIXME
      return

    const item = this.items.get(itemID)
    const uses = parseInt(item.data?.uses?.value) || 0
    const usesMax = parseInt(item.data?.uses?.max) || 0
    if (usesMax !== 0 && uses >= usesMax) {
      ui.notifications.warn(game.i18n.localize('DL.TalentMaxUsesReached'))
      return;
    }

    if (item.data?.vs?.attribute)
      launchRollDialog(
        game.i18n.localize('DL.TalentVSRoll') + game.i18n.localize(item.name),
        (html) =>
          this.useTalent(
            item,
            html.find('[id="boonsbanes"]').val(),
            html.find('[id="modifier"]').val()
          ))
    else
      this.useTalent(item, 0, 0)
  }

  useTalent(talent, inputBoons, inputModifier) {
    const talentData = talent.data.data
    const target = this.getTarget()
    let attackRoll = null;

    if (!talentData?.vs?.attribute)
      this.activateTalent(talent, true)
    else {
      this.activateTalent(talent, Boolean(talentData.vs?.damageActive));

      const attackAttribute = talentData.vs.attribute.toLowerCase()
      const defenseAttribute = talentData.vs?.against?.toLowerCase()

      let modifier = parseInt(inputModifier)
        + (this.data.data.attributes[attackAttribute]?.modifier || 0)
      let boons = parseInt(inputBoons)
        + (this.data.data.bonuses.attack[attackAttribute] || 0) // FIXME: is it a challenge or an attack?
        + parseInt(talentData.vs?.boonsbanes || 0)
        - (target?.data.data.bonuses.defense[defenseAttribute] || 0)

      let attackRollFormula = '1d20' + plusify(modifier) + (boons ? plusify(boons) + 'd6kh' : '')
      attackRoll = new Roll(attackRollFormula, {})
      attackRoll.evaluate()
    }
    postTalentToChat(this, talent, attackRoll, target)
  }

  /* -------------------------------------------- */

  rollSpell(itemID, options = {event: null}) {
    const item = this.items.get(itemID)
    console.log(item)
    const isAttack = item.data.spelltype === game.i18n.localize('DL.SpellTypeAttack')
    const attackAttribute = item.data.data?.action?.attack?.toLowerCase()
    const challengeAttribute = item.data.data?.attribute?.toLowerCase()

    // Check if actor is blocked
    // If it has an attack attribute, check action attack else if it has a challenge attribute, check action challenge
    if (isAttack && attackAttribute && DLAfflictions.isActorBlocked(this, 'attack', attackAttribute))
      return
    else if (challengeAttribute && DLAfflictions.isActorBlocked(this, 'challenge', challengeAttribute))
      return

    // Check uses
    const uses = parseInt(item.data?.castings?.value)
    const usesMax = parseInt(item.data?.castings?.max)
    // TODO: if usesmax == 0 -> auto generate max uses?

    if (usesMax !== 0 && uses >= usesMax) {
      ui.notifications.warn(game.i18n.localize('DL.TalentMaxUsesReached'))
      return;
    }

    if (isAttack && attackAttribute)
      launchRollDialog(
        game.i18n.localize('DL.DialogSpellRoll') + game.i18n.localize(item.name),
        (html) =>
          this.useSpell(
            item,
            html.find('[id="boonsbanes"]').val(),
            html.find('[id="modifier"]').val()
          ))
    else
      this.useSpell(item, 0, 0)
  }

  useSpell(spell, inputBoons, inputModifier) {
    const target = this.getTarget()
    const spellData = spell.data.data

    const attackAttribute = spellData?.action?.attack?.toLowerCase()
    const defenseAttribute = spellData?.action?.against?.toLowerCase()
    const challengeAttribute = spellData?.attribute?.toLowerCase()

    let attackRoll
    if (attackAttribute) {
      const attackBoons
        = (parseInt(inputBoons) || 0)
        + (parseInt(spellData.action.boonsbanes) || 0)
        + (this.data.data.bonuses.attack.boons[attackAttribute] || 0)
        - (target?.data.data.bonuses.defense.boons[defenseAttribute] || 0)
        - (target?.data.data.bonuses.defense.boons.spell || 0)
      const attackModifier
        = (parseInt(inputModifier) || 0)
        + this.data.data.attributes[attackAttribute].modifier || 0

      const attackFormula =
        '1d20' + plusify(attackModifier) + (attackBoons ? plusify(attackBoons) + 'd6kh' : '')
      attackRoll = new Roll(attackFormula, {})
      attackRoll.evaluate()
    }

    postSpellToChat(this, spell, attackRoll, target)
  }

  /* -------------------------------------------- */

  rollCorruption() {
    const corruptionRoll = new Roll('1d20 - @corruption', {corruption: this.data.data.characteristics.corruption})
    corruptionRoll.evaluate()
    postCorruptionToChat(this, corruptionRoll)
  }

  /* -------------------------------------------- */

  async createItemCreate(event) {
    event.preventDefault();

    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data,
    };

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data.type;

    // Finally, create the item!
    return await this.createItem(itemData);
  }


  showItemInfo(item) {
    const uses = parseInt(item.data?.data?.enchantment?.uses?.value);
    const usesmax = parseInt(item.data?.data?.enchantment?.uses?.max);

    const usesText = game.i18n.localize('DL.SpellCastingsUses') + ': ' + uses + ' / ' + usesmax;

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
    };

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: this.id,
        token: this.token,
        alias: this.name,
      },
    };

    const rollMode = game.settings.get('core', 'rollMode');
    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM');
    }

    const template = 'systems/demonlord08/templates/chat/enchantment.html';
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content;
      ChatMessage.create(chatData);
    });
  }

  getTarget() {
    let selectedTarget = null;
    game.user.targets.forEach(async (target) => {
      selectedTarget = target.actor;
    });

    return selectedTarget;
  }

  getTargetNumber(item) {
    let tagetNumber;
    game.user.targets.forEach(async (target) => {
      const targetActor = target.actor;
      if (targetActor) {
        let againstSelectedAttribute = item.data.data?.action?.against?.toLowerCase();

        if (againstSelectedAttribute == undefined) {
          againstSelectedAttribute = item.data.action?.against?.toLowerCase();
        }

        if (againstSelectedAttribute == 'defense') {
          tagetNumber = targetActor.data.data?.characteristics?.defense;
        } else {
          tagetNumber = targetActor.data.data?.attributes[againstSelectedAttribute]?.value;
        }
      }
    });

    return tagetNumber;
  }

  getVSTargetNumber(talent) {
    let tagetNumber;

    game.user.targets.forEach(async (target) => {
      const targetActor = target.actor;
      if (targetActor) {
        const againstSelectedAttribute = talent.data.data.vs.against.toLowerCase();

        if (againstSelectedAttribute == 'defense') {
          tagetNumber = targetActor.data.data.characteristics.defense;
        } else {
          tagetNumber = targetActor.data.data.attributes[againstSelectedAttribute].value;
        }
      }
    });

    return tagetNumber;
  }

  async activateTalent(talent, setActive) {
    const uses = talent.data.uses?.value;
    const usesmax = talent.data.uses?.max;

    if (parseInt(uses) >= 0) {
      if (uses < usesmax) {
        talent.data.uses.value = Number(uses) + 1;
        talent.data.addtonextroll = setActive;
      } else {
        talent.data.uses.value = 0;
        talent.data.addtonextroll = false;
      }
      await Item.updateDocuments([talent], {parent: this});
    }
  }

  async deactivateTalent(talent) {
    const item = this.getEmbeddedDocument('Item', talent.id);
    const that = this;
    await item
      .update({
        'data.addtonextroll': false,
      })
      .then((item) => {
        that.render();
      });
  }

  async addDamageToTarget(damage) {
    game.user.targets.forEach(async (target) => {
      const targetActor = target.actor;
      const currentDamage = parseInt(targetActor.data.data.characteristics.health.value);
      if (game.settings.get('demonlord08', 'reverseDamage')) {
        if (currentDamage - damage <= 0) {
          await targetActor.update({
            'data.characteristics.health.value': 0,
          });
        } else {
          await targetActor.update({
            'data.characteristics.health.value': currentDamage - damage,
          });
        }
      } else {
        await targetActor.update({
          'data.characteristics.health.value': currentDamage + damage,
        });
      }
    });
  }

  async updateCharacterMods(modItem) {
    const mod = duplicate(modItem);

    let roundsleft = parseInt(mod.data.roundsleft);
    if (roundsleft > 0) {
      roundsleft--;
      mod.data.roundsleft = roundsleft;
      if (roundsleft == 0) {
        mod.data.roundsleft = mod.data.rounds;
        mod.data.active = false;
      }
      await this.updateEmbeddedDocuments('Item', mod.data);
    }
  }

  async restActor(token) {
    // Talents
    const talents = this.getEmbeddedCollection('Item').filter((e) => e.type === 'talent');
    for (const talent of talents) {
      const item = duplicate(this.items.get(talent.id));
      item.data.uses.value = 0;

      await this.updateEmbeddedDocuments('Item', item.data);
    }

    // Spells
    const spells = this.getEmbeddedCollection('Item').filter((e) => e.type === 'spell');

    for (const spell of spells) {
      const item = duplicate(this.items.get(spell.id));

      item.data.castings.value = 0;

      await this.updateEmbeddedDocuments('Item', item.data);
    }

    this.applyHealing(token, true);

    var templateData = {
      actor: this,
    };

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: this.id,
        token: this.token,
        alias: this.name,
      },
    };

    const template = 'systems/demonlord08/templates/chat/rest.html';
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content;
      ChatMessage.create(chatData);
    });
  }

  async applyHealing(token, fullHealingRate) {
    if (token.actor.data.type === 'character') {
      if (token.data.actorData.data?.characteristics != undefined) {
        const tokenData = duplicate(token.data);
        const hp = tokenData.actorData?.data?.characteristics?.health;
        const rate = tokenData.actorData?.data?.characteristics?.health?.healingrate;

        if (game.settings.get('demonlord08', 'reverseDamage')) {
          let newdamage = parseInt(hp.value) + (fullHealingRate ? parseInt(rate) : parseInt(rate / 2));
          if (newdamage > hp.max) newdamage = parseInt(hp.max);

          hp.value = newdamage;
        } else {
          let newdamage = parseInt(hp.value) - (fullHealingRate ? parseInt(rate) : parseInt(rate / 2));
          if (newdamage < 0) newdamage = 0;

          hp.value = newdamage;
        }

        await token.update(tokenData);
      } else {
        const actorData = duplicate(token.actor.data);
        const hp = actorData.data.characteristics.health;
        const rate = actorData.data.characteristics.health.healingrate;

        if (game.settings.get('demonlord08', 'reverseDamage')) {
          let newdamage = parseInt(hp.value) + (fullHealingRate ? parseInt(rate) : parseInt(rate / 2));
          if (newdamage > hp.max) newdamage = parseInt(hp.max);

          hp.value = newdamage;
        } else {
          let newdamage = parseInt(hp.value) - (fullHealingRate ? parseInt(rate) : parseInt(rate / 2));
          if (newdamage < 0) newdamage = 0;

          hp.value = newdamage;
        }

        await token.actor.update(actorData);
      }
    }
  }

  async setUsesOnSpells(data) {
    const power = data.data.characteristics.power;

    for (let rank = 0; rank <= power; rank++) {
      const spells = this.getEmbeddedCollection('Item').filter(
        (e) => e.type === 'spell' && parseInt(e.data.rank) === rank,
      );
      spells.forEach((spell) => {
        spell = duplicate(spell);
        const rank = spell.data.rank;
        const usesMax = CONFIG.DL.spelluses[power].split(',')[rank];

        if (spell.data.castings.value === '') {
          spell.data.castings.value = '0';
        }
        spell.data.castings.max = usesMax;

        this.updateEmbeddedDocuments('Item', spell.data);
      });
    }
  }
}
