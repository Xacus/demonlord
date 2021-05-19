import {PathLevel} from './nested-objects.js';
import {FormatDice} from '../dice.js';
import {DLActiveEffects} from "../active-effects/item-effects";


export class DemonlordItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // Get the Item's data
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const data = itemData.data;
  }

  /** @override */
  async update(updateData) {
    // Set spell uses
    if (this.type === 'spell' && this.parent) {
      const power = +this.parent.data?.data?.characteristics.power || 0
      const rank = updateData?.data?.rank ?? +this.data.data.rank
      updateData['data.castings.max'] = CONFIG.DL.spelluses[power]?.[rank] ?? updateData?.data?.castings?.max ?? 0
    }

    await super.update(updateData)
    await this.embedActiveEffects()
    return this
  }

  /** @override */
  static async create(data, options={}) {
    // Add default image
    if (!data?.img && game.settings.get('demonlord08', 'replaceIcons'))
      data.img = CONFIG.DL.defaultItemIcons[data.type] || 'icons/svg/item-bag.svg'
    return super.create(data, options);
  }

  /** @override */
  _onCreate(data, options, user) {
    this.embedActiveEffects()
    if (!this.parent && !this.folder)
      this.sheet.render(true)
  }

  async embedActiveEffects() {
    if (!this.parent)
      return 0
    let effectDataList = []
    const actor = this.parent
    switch (this.data.type) {
      case 'ancestry':
        effectDataList = DLActiveEffects.generateEffectDataFromAncestry(this, actor)
        break
      case 'path':
        effectDataList = DLActiveEffects.generateEffectDataFromPath(this, actor)
        break
      case 'talent':
        effectDataList = DLActiveEffects.generateEffectDataFromTalent(this, actor)
        break
      case 'armor':
        effectDataList = DLActiveEffects.generateEffectDataFromArmor(this, actor)
        break
      default:
        return 0
    }
    return  DLActiveEffects.addUpdateEffectsToActor(actor, effectDataList)
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
  }

  /* -------------------------------------------- */
  /*  Chat methods                                */
  /* -------------------------------------------- */

  static chatListeners(html) {
    html.on('click', '.roll-healing', this._onChatApplyHealing.bind(this));
    html.on('click', '.roll-damage', this._onChatRollDamage.bind(this));
    html.on('click', '.apply-damage', this._onChatApplyDamage.bind(this));
    html.on('click', '.apply-effect', this._onChatApplyEffect.bind(this));
    html.on('click', '.use-talent', this._onChatUseTalent.bind(this));
    html.on('click', '.place-template', this._onChatPlaceTemplate.bind(this));
    html.on('click', '.request-challengeroll', this._onChatRequestChallengeRoll.bind(this));
    html.on('click', '.make-challengeroll', this._onChatMakeChallengeRoll.bind(this));
    html.on('click', '.request-initroll', this._onChatRequestInitRoll.bind(this));
    html.on('click', '.make-initroll', this._onChatMakeInitRoll.bind(this));
  }

  static async _onChatApplyHealing(event) {
    event.preventDefault();
    const li = event.currentTarget;
    const item = li.children[0];
    const isFullRate = +item.dataset.healing === 1;

    var selected = Array.from(game.user.targets);
    if (selected.length === 0) {
      ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'));
      return
    }

    selected.forEach(token => token.actor.applyHealing(isFullRate));

    const actor = this._getChatCardActor(li.closest('.demonlord'));
    const sourceToken = canvas.tokens.placeables.find((token) => token.actor.id === actor.id);
    const itemId = li.children[0].dataset.itemId;
    Hooks.call('DL.ApplyHealing', {
      sourceToken,
      targets: selected,
      itemId,
      event,
      healing: isFullRate,
    });
  }

  static async _onChatRollDamage(event) {
    event.preventDefault();
    const rollMode = game.settings.get('core', 'rollMode');
    const li = event.currentTarget;
    const token = li.closest('.demonlord');
    const actor = this._getChatCardActor(token);
    const item = li.children[0];
    const damageformular = item.dataset.damage;
    const damagetype = item.dataset.damagetype;
    let totalDamage = '';
    let totalDamageGM = '';

    const damageRoll = new Roll(damageformular, {});
    damageRoll.evaluate();

    const diceData = FormatDice(damageRoll);

    if (['blindroll'].includes(rollMode)) {
      totalDamage = '?';
      totalDamageGM = damageRoll.total;
    } else {
      totalDamage = damageRoll.total;
    }

    var templateData = {
      actor: actor,
      item: {_id: item.dataset.itemId || li.closest('.demonlord').dataset.itemId},
      data: {
        damageTotal: {
          value: totalDamage,
        },
        damageTotalGM: {
          value: totalDamageGM,
        },
        damageDouble: {
          value: parseInt(damageRoll.total) * 2,
        },
        damageHalf: {
          value: Math.floor(parseInt(damageRoll.total) / 2),
        },
        isCreature: {
          value: actor.data.type == 'creature',
        },
        damagetype: {
          value: damagetype,
        },
      },
      diceData,
    };

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: actor.id,
        token: actor.token,
        alias: actor.name,
      },
    };

    if (['gmroll', 'blindroll'].includes(rollMode)) {
      chatData.whisper = ChatMessage.getWhisperRecipients('GM');
    }
    if (rollMode === 'selfroll') chatData.whisper = [game.user._id];
    if (rollMode === 'blindroll') chatData.blind = true;

    const template = 'systems/demonlord08/templates/chat/damage.html';
    renderTemplate(template, templateData).then((content) => {
      chatData.content = content;
      if (game.dice3d) {
        game.dice3d
          .showForRoll(damageRoll, game.user, true, chatData.whisper, chatData.blind)
          .then((displayed) => ChatMessage.create(chatData));
      } else {
        chatData.sound = CONFIG.sounds.dice;
        ChatMessage.create(chatData);
      }
    });
  }

  static async _onChatApplyDamage(event) {
    event.preventDefault();
    const li = event.currentTarget;
    const item = li.children[0];
    const damage = parseInt(item.dataset.damage);

    var selected = Array.from(game.user.targets);
    if (selected.length == 0) {
      ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'));
      return
    }

    selected.forEach(token => token.actor.increaseDamage(+damage))

    const actor = this._getChatCardActor(li.closest('.demonlord'));
    const sourceToken = canvas.tokens.placeables.find((token) => token.actor.id === actor.id);
    const itemId = li.closest('.demonlord').dataset.itemId;
    Hooks.call('DL.ApplyDamage', {
      sourceToken,
      targets: selected,
      itemId,
      event,
      damage,
    });
  }

  static async _onChatApplyEffect(event) {
    event.preventDefault()
    const htmlTarget = event.currentTarget
    const htmlParent = htmlTarget.parentElement

    const actorId = htmlParent.attributes.getNamedItem('data-actor-id').value
    const itemId = htmlParent.attributes.getNamedItem('data-item-id').value
    const effectId = htmlTarget.attributes.getNamedItem('data-effect-id').value


    const activeEffect = game
      .actors.get(actorId)
      .items.get(itemId)
      .effects.get(effectId)

    if (!activeEffect) {
      console.warn("Demonlord | _onChatApplyEffect | Effect not found!")
      return
    }

    game.user.targets.forEach(target => {
      ActiveEffect.create(activeEffect.data, {parent: target.actor})
        .then(e => ui.notifications.info(`Added "${e.data.label}" to "${target.actor.name}"`))
      //TODO: localization
    })

  }

  static async _onChatUseTalent(event) {
    const token = event.currentTarget.closest('.demonlord');
    const actor = this._getChatCardActor(token);
    if (!actor) return;

    const div = event.currentTarget.children[0];
    const talentId = div.dataset.itemId;
    actor.rollTalent(talentId);
  }

  static async _onChatRequestChallengeRoll(event) {
    event.preventDefault();
    const li = event.currentTarget;
    const item = li.children[0];
    const attribute = item.dataset.attribute;

    const start = li.closest('.request-challengeroll');
    let boonsbanes = start.children[0].value;
    if (boonsbanes == undefined) boonsbanes = parseInt(item.dataset.boba);
    if (isNaN(boonsbanes)) boonsbanes = 0;

    var selected = Array.from(game.user.targets);
    if (selected.length == 0) {
      ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'));
    }

    let boonsbanestext = '';
    if (boonsbanes == 1) {
      boonsbanestext = boonsbanes + ' ' + game.i18n.localize('DL.DialogBoon');
    }
    if (boonsbanes > 1) {
      boonsbanestext = boonsbanes + ' ' + game.i18n.localize('DL.DialogBoons');
    }
    if (boonsbanes == -1) {
      boonsbanestext = boonsbanes.toString().replace('-', '') + ' ' + game.i18n.localize('DL.DialogBane');
    }
    if (boonsbanes < -1) {
      boonsbanestext = boonsbanes.toString().replace('-', '') + ' ' + game.i18n.localize('DL.DialogBanes');
    }

    selected.forEach((token) => {
      const actor = token.actor;

      var templateData = {
        actor: actor,
        data: {
          attribute: {
            value: game.i18n.localize(CONFIG.DL.attributes[attribute.toLowerCase()]),
          },
          boonsbanes: {
            value: boonsbanes,
          },
          boonsbanestext: {
            value: boonsbanestext,
          },
        },
      };

      const chatData = {
        user: game.user.id,
        speaker: {
          actor: actor.id,
          token: actor.token,
          alias: actor.name,
        },
      };

      chatData.whisper = ChatMessage.getWhisperRecipients(actor.name);

      const template = 'systems/demonlord08/templates/chat/makechallengeroll.html';
      renderTemplate(template, templateData).then((content) => {
        chatData.content = content;
        ChatMessage.create(chatData);
      });
    });
  }

  static async _onChatMakeChallengeRoll(event) {
    event.preventDefault();
    const li = event.currentTarget;
    const item = li.children[0];
    const attributeName = item.dataset.attribute;
    const boonsbanes = item.dataset.boonsbanes;
    const actorId = item.dataset.actorid;
    const actor = game.actors.get(actorId);
    const attribute = actor.data.data.attributes[attributeName.toLowerCase()];
    const start = li.closest('.demonlord');
    const boonsbanesEntered = start.children[1].children[0].children[0].children[1]?.value;

    actor.rollAttribute(attribute, parseInt(boonsbanes) + parseInt(boonsbanesEntered), 0);
  }

  static async _onChatRequestInitRoll(event) {
    event.preventDefault();
    const li = event.currentTarget;
    const item = li.children[0];
    const attribute = item.dataset.attribute;
    const start = li.closest('.demonlord');

    var selected = canvas.tokens.controlled;
    if (selected.length == 0) {
      ui.notifications.info(game.i18n.localize('DL.DialogWarningActorsNotSelected'));
    }

    selected.forEach((token) => {
      const actor = token.actor;

      var templateData = {
        actor: this.actor,
        token: canvas.tokens.controlled[0]?.data,
        data: {},
      };

      const chatData = {
        user: game.user.id,
        speaker: {
          actor: actor.id,
          token: actor.token,
          alias: actor.name,
        },
      };

      chatData.whisper = ChatMessage.getWhisperRecipients(actor.name);

      const template = 'systems/demonlord08/templates/chat/makeinitroll.html';
      renderTemplate(template, templateData).then((content) => {
        chatData.content = content;
        ChatMessage.create(chatData);
      });
    });
  }

  static async _onChatMakeInitRoll(event) {
    event.preventDefault();
    const li = event.currentTarget;
    const item = li.children[0];
    const actorId = item.dataset.actorid;
    const actor = game.actors.get(actorId);
    let combatantFound = null;

    for (const combatant of game.combat.combatants) {
      if (combatant.actor?._id == actor._id) {
        combatantFound = combatant;
      }
    }

    if (combatantFound) {
      game.combat.rollInitiative(combatantFound._id);
    }
  }

  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Actor|null}         The Actor entity or null
   * @private
   */
  static _getChatCardActor(card) {
    // Case 1 - a synthetic actor from a Token
    const tokenKey = card.dataset.tokenId;
    if (tokenKey) {
      const [sceneId, tokenId] = tokenKey.split('.');
      const scene = game.scenes.get(sceneId);
      if (!scene) return null;
      const tokenData = scene.items.get(tokenId);
      if (!tokenData) return null;
      const token = new Token(tokenData);
      return token.actor;
    }

    // Case 2 - use Actor ID directory
    const actorId = card.dataset.actorId;
    return game.actors.get(actorId) || null;
  }

  /**
   * Get the Actor which is the target of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Array.<Actor>}      An Array of Actor entities, if any
   * @private
   */
  static _getChatCardTargets(card) {
    const character = game.user.character;
    const controlled = canvas.tokens.controlled;
    const targets = controlled.reduce((arr, t) => (t.actor ? arr.concat([t.actor]) : arr), []);
    if (character && controlled.length === 0) targets.push(character);
    return targets;
  }

  static async _onChatPlaceTemplate(event) {
    event.preventDefault();
    const li = event.currentTarget;
    const metadata = li.closest('.demonlord').dataset;
    const itemId = metadata.itemId;
    const actor = game.actors.get(metadata.actorId);
    const item = actor.items.get(itemId);

    const template = game.demonlord.canvas.ActionTemplate.fromItem(item);
    if (template) {
      template.drawPreview();
    }
  }
}
