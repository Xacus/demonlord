/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
import { FormatDice } from '../dice.js';
import { ActorRolls } from './actor-rolls';
import { ActorAfflictionsEffects } from './actor-afflictions-effects';
import { DLActiveEffects } from '../active-effects/active-effect';

export class DemonlordActor extends Actor {
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
        boons: { strength: 0, agility: 0, intellect: 0, will: 0, perception: 0 },
        damage: '',
        plus20Damage: '',
        extraEffect: '',
      },
      challenge: {
        sources: [],
        boons: { strength: 0, agility: 0, intellect: 0, will: 0, perception: 0 },
      },
      vsRoll: [], // Data description in DLActiveEffects.generateEffectDataFromTalent
      armor: { fixed: 0, agility: 0, defense: 0, override: 0 },
      defense: {
        sources: [],
        boons: { strength: 0, agility: 0, intellect: 0, will: 0, defense: 0, perception: 0 },
        noFastTurn: 0,
      },
    });

    setProperty(data, 'maluses', {
      autoFail: {
        challenge: { strength: 0, agility: 0, intellect: 0, will: 0, perception: 0 },
        action: { strength: 0, agility: 0, intellect: 0, will: 0, perception: 0 },
        halfSpeed: 0,
      },
    });
  }

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

    // De-serialize vsRoll
    data.bonuses.vsRoll = data.bonuses.vsRoll
      .filter((v) => Boolean(v))
      .map((v) => {
        try {
          return JSON.parse(v);
        } catch (e) {
          console.warn('Demonlord | Deserialization error | Talent vsRoll', v);
        }
      });

    // Armor
    data.characteristics.defense +=
      data.bonuses.armor.fixed || data.attributes.agility.value + data.bonuses.armor.agility;
    data.characteristics.defense += data.bonuses.armor.defense;
    data.characteristics.defense = data.bonuses.armor.override || data.characteristics.defense;

    // Speed
    data.characteristics.speed = Math.max(0, data.characteristics.speed);
    if (data.maluses.halfSpeed) data.characteristics.speed = Math.floor(data.characteristics.speed / 2);
  }

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

  rollChallenge(attribute) {
    ActorRolls.rollChallenge(this, attribute);
  }

  rollAttribute(attribute, boonsbanes, modifier) {
    ActorRolls.rollAttribute(this, attribute, boonsbanes, modifier);
  }

  rollWeaponAttackMacro(itemId, boonsbanes, damagebonus) {
    ActorRolls.rollWeaponAttackMacro(this, itemId, boonsbanes, damagebonus);
  }

  async rollWeaponAttack(itemId, options = { event: null }) {
    ActorRolls.rollWeaponAttack(this, itemId, options);
  }

  async rollAttack(weapon, boonsbanes, buffs, modifier) {
    ActorRolls.rollAttack(this, weapon, boonsbanes, buffs, modifier);
  }

  rollTalent(itemId, options = { event: null }) {
    ActorRolls.rollTalent(this, itemId, options);
  }

  rollSpell(itemId, options = { event: null }) {
    ActorRolls.rollSpell(this, itemId, options);
  }

  rollCorruption() {
    ActorRolls.rollCorruption(this);
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
      selectedTarget = target;
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
        const againstSelectedAttribute = talent.data.vs.against.toLowerCase();

        if (againstSelectedAttribute == 'defense') {
          tagetNumber = targetActor.data.data.characteristics.defense;
        } else {
          tagetNumber = targetActor.data.data.attributes[againstSelectedAttribute].value;
        }
      }
    });

    return tagetNumber;
  }

  generateCharacterBuffs(type) {
    const characterbuffs = new CharacterBuff();
    characterbuffs.challengestrengthbonus = 0;
    characterbuffs.challengeagilitybonus = 0;
    characterbuffs.challengeintellectbonus = 0;
    characterbuffs.challengewillbonus = 0;
    characterbuffs.challengeperceptionbonus = 0;
    characterbuffs.attackstrengthbonus = 0;
    characterbuffs.attackagilitybonus = 0;
    characterbuffs.attackintellectbonus = 0;
    characterbuffs.attackwillbonus = 0;
    characterbuffs.attackperceptionbonus = 0;

    if (this.data.data.actions.prepare) {
      characterbuffs.challengestrengthbonus++;
      characterbuffs.challengeagilitybonus++;
      characterbuffs.challengeintellectbonus++;
      characterbuffs.challengewillbonus++;
      characterbuffs.challengeperceptionbonus++;
      characterbuffs.attackstrengthbonus++;
      characterbuffs.attackagilitybonus++;
      characterbuffs.attackintellectbonus++;
      characterbuffs.attackwillbonus++;
      characterbuffs.attackperceptionbonus++;
    }

    const talents = this.items.filter((e) => e.type === 'talent');
    for (const talent of talents) {
      if (talent.data.data.addtonextroll) {
        // console.log(talent.name)
        if (talent.data.data.action?.boonsbanesactive) {
          characterbuffs.attackbonus =
            parseInt(characterbuffs.attackbonus) + parseInt(talent.data.data.action?.boonsbanes);

          if (talent.data.data.action.strengthboonsbanesselect) {
            characterbuffs.attackstrengthbonus += parseInt(talent.data.data.action?.boonsbanes);
          }
          if (talent.data.data.action.agilityboonsbanesselect) {
            characterbuffs.attackagilitybonus += parseInt(talent.data.data.action?.boonsbanes);
          }
          if (talent.data.data.action.intellectboonsbanesselect) {
            characterbuffs.attackintellectbonus += parseInt(talent.data.data.action?.boonsbanes);
          }
          if (talent.data.data.action.willboonsbanesselect) {
            characterbuffs.attackwillbonus += parseInt(talent.data.data.action?.boonsbanes);
          }
          if (talent.data.data.action.perceptionboonsbanesselect) {
            characterbuffs.attackperceptionbonus += parseInt(talent.data.data.action?.boonsbanes);
          }
        }
        if (talent.data.action?.damageactive && talent.data.action?.damage != '') {
          characterbuffs.attackdamagebonus += '+' + talent.data.action?.damage;
        }
        if (talent.data.action?.plus20active && talent.data.action?.plus20 != '') {
          characterbuffs.attack20plusdamagebonus += '+' + talent.data.action?.plus20;
        }

        if (type === 'ATTACK') {
          characterbuffs.attackeffects += this.buildTalentEffects(talent, true, type);
        } else if (type === 'SPELL') {
          characterbuffs.attackeffects += this.buildTalentEffects(talent, true, type);
        }

        if (talent.data.data?.challenge?.boonsbanesactive) {
          characterbuffs.challengebonus =
            parseInt(characterbuffs.challengebonus) + parseInt(talent.data.data.challenge?.boonsbanes);

          if (talent.data.data.challenge?.strengthboonsbanesselect) {
            characterbuffs.challengestrengthbonus += parseInt(talent.data.data.challenge?.boonsbanes);
            characterbuffs.challengeeffects += this.buildTalentEffects(talent, true, type);
          }
          if (talent.data.data.challenge?.agilityboonsbanesselect) {
            characterbuffs.challengeagilitybonus += parseInt(talent.data.data.challenge?.boonsbanes);
            characterbuffs.challengeeffects += this.buildTalentEffects(talent, true, type);
          }
          if (talent.data.data.challenge?.intellectboonsbanesselect) {
            characterbuffs.challengeintellectbonus += parseInt(talent.data.data.challenge?.boonsbanes);
            characterbuffs.challengeeffects += this.buildTalentEffects(talent, true, type);
          }
          if (talent.data.data.challenge?.willboonsbanesselect) {
            characterbuffs.challengewillbonus += parseInt(talent.data.data.challenge?.boonsbanes);
            characterbuffs.challengeeffects += this.buildTalentEffects(talent, true, type);
          }
          if (talent.data.data.challenge?.perceptionboonsbanesselect) {
            characterbuffs.challengeperceptionbonus += parseInt(talent.data.data.challenge?.boonsbanes);
            characterbuffs.challengeeffects += this.buildTalentEffects(talent, true, type);
          }
        }
        if (talent.data.data.bonuses?.defenseactive && talent.data.data.bonuses?.defense > 0) {
          characterbuffs.defensebonus += parseInt(talent.data.data.bonuses.defense);
        }
        if (talent.data.data.bonuses?.healthactive && talent.data.data.bonuses?.health > 0) {
          characterbuffs.healthbonus += parseInt(talent.data.data.bonuses.health);
        }
        if (talent.data.data.bonuses?.speedactive && talent.data.data.bonuses?.speed > 0) {
          characterbuffs.speedbonus += parseInt(talent.data.data.bonuses.speed);
        }
        if (talent.data.data.bonuses?.poweractive && talent.data.data.bonuses?.power > 0) {
          characterbuffs.powerbonus += parseInt(talent.data.data.bonuses.power);
        }
        if (talent.data.data.healing?.healactive && talent.data.data.healing?.rate > 0) {
          characterbuffs.healing += parseInt(talent.data.data.healing.rate);
        }
      }
    }

    const items = this.items.filter((e) => e.type === 'item');
    let itemAttackbonus = 0;
    let itemChallengebonus = 0;
    let itemDamageBonus = '';
    let itemDefenseBonus = 0;
    let itemSpeedBonus = 0;
    let itemPerceptionBonus = 0;

    for (const item of items) {
      if (item.data.data.wear) {
        if (item.data.data.enchantment?.attackbonus != null) {
          itemAttackbonus += parseInt(item.data.data.enchantment?.attackbonus);
        }
        if (item.data.data.enchantment?.challengebonus != null) {
          itemChallengebonus += parseInt(item.data.data.enchantment?.challengebonus);
        }
        if (item.data.data.enchantment?.damage != '') {
          itemDamageBonus += '+' + item.data.data.enchantment?.damage;
        }
        if (item.data.data.enchantment?.defense != null) {
          itemDefenseBonus += parseInt(item.data.data.enchantment?.defense);
        }
        if (item.data.data.enchantment?.speed != null) {
          itemSpeedBonus += parseInt(item.data.data.enchantment?.speed);
        }
        if (item.data.data.enchantment?.perception != null) {
          itemPerceptionBonus += parseInt(item.data.data.enchantment?.perception);
        }
      }
    }
    characterbuffs.attackbonus += itemAttackbonus;
    characterbuffs.challengebonus += itemChallengebonus;
    characterbuffs.attackdamagebonus += itemDamageBonus;
    characterbuffs.defensebonus += itemDefenseBonus;
    characterbuffs.speedbonus += itemSpeedBonus;
    characterbuffs.perception += itemPerceptionBonus;

    // If you wear armor and do not meet or exceed its requirements: -1 Bane
    const armors = this.items.filter((e) => e.type === 'armor');
    let armorAttackbonus = 0;
    for (const armor of armors) {
      if (armor.data.data?.wear && !armor.data.data?.isShield) {
        if (
          armor.data.data?.strengthmin != '' &&
          parseInt(armor.data.data.strengthmin) > parseInt(this.data.data?.attributes?.strength?.value)
        ) {
          armorAttackbonus = -1;
          characterbuffs.armorRequirementMeet = false;
        }
      }
    }
    characterbuffs.attackbonus += armorAttackbonus;

    const mods = this.items.filter((e) => e.type === 'mod');
    let modAttackbonus = 0;
    let modChallengebonus = 0;
    let modDamageBonus = '';
    let modDefenseBonus = 0;
    let modHealingBonus = 0;
    let modSpeedBonus = 0;
    for (const mod of mods) {
      if (mod.data.data.active) {
        if (mod.data.data.modtype == game.i18n.localize('DL.TalentAttackBoonsBanes')) {
          modAttackbonus += parseInt(mod.data.data.modifier);
        }
        if (mod.data.data.modtype == game.i18n.localize('DL.TalentChallengeBoonsBanes')) {
          modChallengebonus += parseInt(mod.data.data.modifier);
        }
        if (mod.data.data.modtype == game.i18n.localize('DL.ModsListDamage')) {
          modDamageBonus += '+' + mod.data.data.modifier;
        }
        if (mod.data.data.modtype == game.i18n.localize('DL.ItemDefenseModifier')) {
          modDefenseBonus += parseInt(mod.data.data.modifier);
        }
        if (mod.data.data.modtype == game.i18n.localize('DL.ModsListHealth')) {
          modHealingBonus += parseInt(mod.data.data.modifier);
        }
        if (mod.data.data.modtype == game.i18n.localize('DL.ModsListSpeed')) {
          modSpeedBonus += parseInt(mod.data.data.modifier);
        }
      }
    }
    characterbuffs.attackbonus += modAttackbonus;
    characterbuffs.challengebonus += modChallengebonus;
    characterbuffs.attackdamagebonus += modDamageBonus;
    characterbuffs.defensebonus += modDefenseBonus;
    characterbuffs.healthbonus += modHealingBonus;
    characterbuffs.speedbonus += modSpeedBonus;

    // Afflictions
    if (this.data.data.afflictions?.diseased) {
      characterbuffs.attackbonus += -1;
      characterbuffs.attackstrengthbonus += -1;
      characterbuffs.attackagilitybonus += -1;
      characterbuffs.attackintellectbonus += -1;
      characterbuffs.attackwillbonus += -1;
      characterbuffs.attackperceptionbonus += -1;

      characterbuffs.challengebonus += -1;
      characterbuffs.challengestrengthbonus += -1;
      characterbuffs.challengeagilitybonus += -1;
      characterbuffs.challengeintellectbonus += -1;
      characterbuffs.challengewillbonus += -1;
      characterbuffs.challengeperceptionbonus += -1;
    }
    if (this.data.data.afflictions?.frightened) {
      characterbuffs.attackbonus += -1;
      characterbuffs.attackstrengthbonus += -1;
      characterbuffs.attackagilitybonus += -1;
      characterbuffs.attackintellectbonus += -1;
      characterbuffs.attackwillbonus += -1;
      characterbuffs.attackperceptionbonus += -1;

      characterbuffs.challengebonus += -1;
      characterbuffs.challengestrengthbonus += -1;
      characterbuffs.challengeagilitybonus += -1;
      characterbuffs.challengeintellectbonus += -1;
      characterbuffs.challengewillbonus += -1;
      characterbuffs.challengeperceptionbonus += -1;
    }
    if (this.data.data.afflictions?.horrified) {
      characterbuffs.attackbonus += -3;
      characterbuffs.attackstrengthbonus += -3;
      characterbuffs.attackagilitybonus += -3;
      characterbuffs.attackintellectbonus += -3;
      characterbuffs.attackwillbonus += -3;
      characterbuffs.attackperceptionbonus += -3;

      characterbuffs.challengebonus += -3;
      characterbuffs.challengestrengthbonus += -3;
      characterbuffs.challengeagilitybonus += -3;
      characterbuffs.challengeintellectbonus += -3;
      characterbuffs.challengewillbonus += -3;
      characterbuffs.challengeperceptionbonus += -3;
    }
    if (this.data.data.afflictions?.fatigued) {
      characterbuffs.attackbonus += -1;
      characterbuffs.attackstrengthbonus += -1;
      characterbuffs.attackagilitybonus += -1;
      characterbuffs.attackintellectbonus += -1;
      characterbuffs.attackwillbonus += -1;
      characterbuffs.attackperceptionbonus += -1;

      characterbuffs.challengebonus += -1;
      characterbuffs.challengestrengthbonus += -1;
      characterbuffs.challengeagilitybonus += -1;
      characterbuffs.challengeintellectbonus += -1;
      characterbuffs.challengewillbonus += -1;
      characterbuffs.challengeperceptionbonus += -1;
    }
    if (this.data.data.afflictions?.impaired) {
      characterbuffs.attackbonus += -1;
      characterbuffs.attackstrengthbonus += -1;
      characterbuffs.attackagilitybonus += -1;
      characterbuffs.attackintellectbonus += -1;
      characterbuffs.attackwillbonus += -1;
      characterbuffs.attackperceptionbonus += -1;

      characterbuffs.challengebonus += -1;
      characterbuffs.challengestrengthbonus += -1;
      characterbuffs.challengeagilitybonus += -1;
      characterbuffs.challengeintellectbonus += -1;
      characterbuffs.challengewillbonus += -1;
      characterbuffs.challengeperceptionbonus += -1;
    }
    if (this.data.data.afflictions?.poisoned) {
      characterbuffs.attackbonus += -1;
      characterbuffs.attackstrengthbonus += -1;
      characterbuffs.attackagilitybonus += -1;
      characterbuffs.attackintellectbonus += -1;
      characterbuffs.attackwillbonus += -1;
      characterbuffs.attackperceptionbonus += -1;

      characterbuffs.challengebonus += -1;
      characterbuffs.challengestrengthbonus += -1;
      characterbuffs.challengeagilitybonus += -1;
      characterbuffs.challengeintellectbonus += -1;
      characterbuffs.challengewillbonus += -1;
      characterbuffs.challengeperceptionbonus += -1;
    }

    /*
    console.log('attackstrengthbonus = ' + characterbuffs.attackstrengthbonus);
    console.log('attackagilitybonus = ' + characterbuffs.attackagilitybonus);
    console.log('attackintellectbonus = ' + characterbuffs.attackintellectbonus);
    console.log('attackwillbonus = ' + characterbuffs.attackwillbonus);
    console.log('attackperceptionbonus = ' + characterbuffs.attackperceptionbonus);
    console.log('challengestrengthbonus = ' + characterbuffs.challengestrengthbonus);
    console.log('challengeagilitybonus = ' + characterbuffs.challengeagilitybonus);
    console.log('challengeintellectbonus = ' + characterbuffs.challengeintellectbonus);
    console.log('challengewillbonus = ' + characterbuffs.challengewillbonus);
    console.log('challengeperceptionbonus = ' + characterbuffs.challengeperceptionbonus);
    */

    return characterbuffs;
  }

  buildTalentEffects(talent, showTalentName, type) {
    return ActorAfflictionsEffects.buildTalentEffects(this, talent, showTalentName, type);
  }

  buildArmorEffects(armorRequirementsNotMeet) {
    return armorRequirementsNotMeet
      ? `&nbsp;&nbsp;&nbsp;• ${game.i18n.localize(DL.TalentAttackBoonsBanes)}: -1 <br>`
      : '';
  }

  buildActionEffects(type) {
    return ActorAfflictionsEffects.buildAfflictionsEffects(this, type, ['prepare'], 1);
  }

  buildAfflictionsEffects(type) {
    return ActorAfflictionsEffects.buildAfflictionsEffects(
      this,
      type,
      ['diseased', 'fatigued', 'impaired', 'poisoned'],
      -1,
    );
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
      await Item.updateDocuments([talent], { parent: this });
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
