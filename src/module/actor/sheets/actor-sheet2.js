import { DLActorModifiers } from '../../dialog/actor-modifiers.js';
import { DLCharacterGenerater } from '../../dialog/actor-generator.js';
import { DL } from '../../config.js';
import { onManageActiveEffect, prepareActiveEffectCategories } from '../../active-effects/effects.js';

export class DemonlordActorSheet2 extends ActorSheet {
  constructor(...args) {
    super(...args);
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['demonlord2', 'sheet', 'actor'],
      width: 742,
      height: 700,
      tabs: [
        {
          navSelector: '.sheet-navigation',
          contentSelector: '.sheet-body',
          initial: 'character',
        },
      ],
      scrollY: ['.tab.active'],
    });
  }

  /** @override */
  get template() {
    if (!game.user.isGM && this.actor.limited) {
      return 'systems/demonlord08/templates/actor/limited-sheet.html';
    }
    return 'systems/demonlord08/templates/actor/actor-sheet2.html';
  }

  /**
   * Extend and override the sheet header buttons
   * @override
   */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    const canConfigure = game.user.isGM || this.actor.isOwner;
    if (this.options.editable && canConfigure) {
      buttons = [
        /* {
          label: game.i18n.localize('DL.CharacterGenerator'),
          class: 'generate-actor',
          icon: 'fas fa-user',
          onclick: (ev) => this._onGenerateActor(ev)
        }, */
        {
          label: game.i18n.localize('DL.ActorMods'),
          class: 'configure-actor',
          icon: 'fas fa-dice',
          onclick: (ev) => this._onConfigureActor(ev),
        },
      ].concat(buttons);
    }
    return buttons;
  }
  /* -------------------------------------------- */

  _onConfigureActor(event) {
    event.preventDefault();
    new DLActorModifiers(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2,
    }).render(true);
  }

  _onGenerateActor(event) {
    event.preventDefault();
    new DLCharacterGenerater(this.actor, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - 400) / 2,
    }).render(true);
  }

  async _updateObject(event, formData) {
    //console.log("FORMDATA", formData)
    return this.document.update(formData);
    const actor = this.object;
    const updateData = expandObject(formData);

    if (updateData.data.level && updateData.data.level != actor.data.data.level) {
      // Create Talents for new level
      const paths = this.actor.getEmbeddedCollection('Item').filter((e) => e.type === 'path');

      var newPower = 0;

      if (updateData.data.level > actor.data.data.level) {
        for (const path of paths) {
          for (const level of path.data.data.levels) {
            if (level.level <= updateData.data.level) {
              newPower += parseInt(level.characteristicsPower);
            }

            if (level.level > actor.data.data.level && level.level <= updateData.data.level) {
              for (const talent of level.talents) {
                let item;
                if (talent.pack) {
                  const pack = game.packs.get(talent.pack);
                  if (pack.metadata.entity !== 'Item') return;
                  item = await pack.getEntity(talent.id);
                } else {
                  item = game.items.get(talent.id);
                }

                await this.actor.createEmbeddedDocuments('Item', item.data);
              }
              for (const spell of level.spells) {
                let item;
                if (spell.pack) {
                  const pack = game.packs.get(spell.pack);
                  if (pack.metadata.entity !== 'Item') return;
                  item = await pack.getEntity(spell.id);
                } else {
                  item = game.items.get(spell.id);
                }

                await this.actor.createEmbeddedDocuments('Item', item.data);
              }
            }
          }
        }
      } else if (updateData.data.level < actor.data.data.level) {
        for (const path of paths) {
          for (const level of path.data.levels) {
            if (level.level <= updateData.data.level) {
              newPower += parseInt(level.characteristicsPower);
            }

            if (level.level <= actor.data.data.level && level.level > updateData.data.level) {
              for (const talent of level.talents) {
                const actorTalent = this.actor
                  .getEmbeddedCollection('Item')
                  .filter((e) => e.type === 'talent' && e.name === talent.name);

                if (actorTalent.length > 0) {
                  await this.actor.deleteEmbeddedDocuments('Item', [actorTalent[0].id]);
                }
              }
              for (const talent of level.talentspick) {
                const actorTalent = this.actor
                  .getEmbeddedCollection('Item')
                  .filter((e) => e.type === 'talent' && e.name === talent.name);

                if (actorTalent.length > 0) {
                  await this.actor.deleteEmbeddedDocuments('Item', [actorTalent[0].id]);
                }
              }
              for (const spell of level.spells) {
                const actorSpell = this.actor
                  .getEmbeddedCollection('Item')
                  .filter((e) => e.type === 'spell' && e.name === spell.name);

                if (actorSpell.length > 0) {
                  await this.actor.deleteEmbeddedDocuments('Item', [actorSpell[0].id]);
                }
              }
            }
          }
        }
      }
      actor.data.data.characteristics.power = newPower;
      this.actor.setUsesOnSpells(actor.data);
    }

    // Update Spell uses when power changes
    if (updateData.data.characteristics.power) {
      this.actor.setUsesOnSpells(actor.data);
    }

    return this.document.update(formData);
  }

  /** @override */
  getData() {
    const data = {
      isGM: game.user.isGM,
      isOwner: this.actor.isOwner,
      isCharacter: this.actor.type === 'character',
      isNPC: this.actor.type === 'character' && !this.actor.data.isPC,
      limited: this.document.limited,
      options: this.options,
      editable: this.isEditable,
      config: CONFIG.DL,
    };

    data.useDemonlordMode = !game.settings.get('demonlord08', 'useHomebrewMode');

    //data.actor = foundry.utils.deepClone(this.actor.data);
    data.actor = this.actor.data;
    data.data = data.actor.data;
    data.items = this.actor.items.map((i) => {
      i.data.labels = i.labels;
      return i.data;
    });
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    for (const attr of Object.entries(data.actor.data.attributes)) {
      attr.isCheckbox = attr.dtype === 'Boolean';
    }

    data.effects = prepareActiveEffectCategories(this.actor.effects);

    // Prepare items
    if (this.actor.data.type == 'character') {
      this._prepareCharacterItems(data);
    }

    return data;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    // Initialize containers.
    const gear = [];
    const features = [];
    const spells = [];
    const weapons = [];
    const armor = [];
    const ammo = [];
    const talents = [];
    const mods = [];
    const ancestry = [];
    const professions = [];
    const pathNovice = [];
    const pathExpert = [];
    const pathMaster = [];
    const languages = [];

    // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (const i of sheetData.items) {
      const item = i.data;
      i.img = i.img || DEFAULT_TOKEN;

      if (i.type === 'item') {
        gear.push(i);
      } else if (i.type === 'feature') {
        features.push(i);
      } else if (i.type === 'spell') {
        spells.push(i);
      } else if (i.type === 'weapon') {
        weapons.push(i);
      } else if (i.type === 'armor') {
        armor.push(i);
      } else if (i.type === 'ammo') {
        ammo.push(i);
      } else if (i.type === 'talent') {
        talents.push(i);
      } else if (i.type === 'mod') {
        mods.push(i);
      } else if (i.type === 'ancestry') {
        ancestry.push(i);
      } else if (i.type === 'profession') {
        professions.push(i);
      } else if (i.type === 'path') {
        switch (i.data.type) {
          case 'novice':
            pathNovice.push(i);
            break;
          case 'expert':
            pathExpert.push(i);
            break;
          case 'master':
            pathMaster.push(i);
            break;
          default:
            break;
        }
      } else if (i.type === 'language') {
        languages.push(i);
      }
    }

    // Assign and return
    actorData.gear = gear;
    actorData.features = features;
    actorData.spells = spells;
    actorData.weapons = weapons;
    actorData.armor = armor;
    actorData.ammo = ammo;
    actorData.talents = talents;
    actorData.mods = mods;
    actorData.ancestry = ancestry;
    actorData.professions = professions;
    actorData.pathNovice = pathNovice;
    actorData.pathExpert = pathExpert;
    actorData.pathMaster = pathMaster;
    actorData.languages = languages;

    actorData.spellbook = this._prepareSpellBook(actorData);
    actorData.talentbook = this._prepareTalentBook(actorData);
  }

  async _onDropItemCreate(itemData) {
    switch (itemData.type) {
      case 'ancestry':
        // Delete existing Talents
        const ancestries = this.actor.data.items.filter((e) => e.type === 'ancestry');

        for (const ancestry of ancestries) {
          for (let index = 0; index < ancestry.data.data.talents.length; index++) {
            const talent = ancestry.data.data.talents[index];
            const actorTalent = this.actor.data.items.filter((e) => e.type === 'talent' && e.name === talent.name);

            if (actorTalent.length > 0) {
              await this.actor.deleteEmbeddedDocuments('Item', [actorTalent[0].id]);
            }
          }
          for (const language of ancestry.data.data.languagelist) {
            const actorLanguage = this.actor.data.items.filter(
              (e) => e.type === 'language' && e.name === language.name,
            );

            if (actorLanguage.length > 0) {
              this.actor.deleteEmbeddedDocuments('Item', [actorLanguage[0].id]);
            }
          }

          await this.actor.deleteEmbeddedDocuments('Item', [ancestry.id]);
        }

        // Create Talents
        for (const talent of itemData.data.talents) {
          let item;
          if (talent.pack) {
            const pack = game.packs.get(talent.pack);
            if (pack.metadata.entity !== 'Item') return;
            item = await pack.getEntity(talent.id);
          } else {
            item = game.items.get(talent.id);
          }

          await this.actor.createEmbeddedDocuments('Item', [item.data]);
        }
        // Create Languages
        for (const language of itemData.data.languagelist) {
          let item;
          if (language.pack) {
            const pack = game.packs.get(language.pack);
            item = await pack.getEntity(language.id);
          } else item = game.items.get(language.id);

          await this.actor.createEmbeddedDocuments('Item', [item.data]);
        }

        break;
      case 'path':
        // Delete existing Talenst
        const paths = this.actor
          .getEmbeddedCollection('Item')
          .filter((e) => e.type === 'path' && itemData.data.type === e.data.type);

        for (const path of paths) {
          for (const level of path.data.levels) {
            for (const talent of level.talents) {
              const actorTalent = this.actor
                .getEmbeddedCollection('Item')
                .filter((e) => e.type === 'talent' && e.name === talent.name);

              if (actorTalent.length > 0) {
                await this.actor.deleteEmbeddedDocuments('Item', [actorTalent[0].id]);
              }
            }
          }
          await this.actor.deleteEmbeddedDocuments('Item', [path.id]);
        }

        // Create Talents
        if (this.actor.data.data.level > 0) {
          for (let i = 1; i <= this.actor.data.data.level; i++) {
            const level = itemData.data.levels.filter((level) => level.level === i);

            if (level[0]) {
              for (const talent of level[0].talents) {
                let item;
                if (talent.pack) {
                  const pack = game.packs.get(talent.pack);
                  if (pack.metadata.entity !== 'Item') return;
                  item = await pack.getEntity(talent.id);
                } else {
                  item = game.items.get(talent.id);
                }

                await this.actor.createEmbeddedDocuments('Item', [item.data]);
              }
            }
          }
        }

        // Delete existing Spells
        for (const path of paths) {
          for (const level of path.data.levels) {
            for (const spell of level.spells) {
              const actorSpell = this.actor
                .getEmbeddedCollection('Item')
                .filter((e) => e.type === 'spell' && e.name === spell.name);

              if (actorSpell.length > 0) {
                await this.actor.deleteEmbeddedDocuments('Item', [actorSpell[0].id]);
              }
            }
          }
          await this.actor.deleteEmbeddedDocuments('Item', [path.id]);
        }

        // Create Spells
        if (this.actor.data.data.level > 0) {
          for (let i = 1; i <= this.actor.data.data.level; i++) {
            const level = itemData.data.levels.filter((level) => level.level === i);

            if (level[0]) {
              for (const spell of level[0].spells) {
                let item;
                if (spell.pack) {
                  const pack = game.packs.get(spell.pack);
                  if (pack.metadata.entity !== 'Item') return;
                  item = await pack.getEntity(spell.id);
                } else {
                  item = game.items.get(spell.id);
                }

                await this.actor.createEmbeddedDocuments('Item', [item.data]);
              }
            }
          }
        }

        break;
      default:
        break;
    }
    return super._onDropItemCreate(itemData);

    // return this.actor.createEmbeddedEntity('Item', itemData)
  }

  /* -------------------------------------------- */
  _prepareSpellBook(actorData) {
    const spellbook = {};
    const registerTradition = (i, label) => {
      spellbook[i] = {
        tradition: label,
        spells: [],
      };
    };

    let s = 0;
    const traditions = [...new Set(actorData.spells.map((spell) => spell.data.tradition))];
    traditions.sort().forEach((tradition) => {
      if (tradition != undefined) {
        registerTradition(s, tradition);

        actorData.spells.forEach((spell) => {
          if (spell.data.tradition == tradition) {
            spellbook[s].spells.push(spell);
          }
        });
        s++;
      }
    });

    return spellbook;
  }

  _prepareTalentBook(actorData) {
    const talentbook = {};
    const registerTalentGroup = (i, label) => {
      talentbook[i] = {
        groupname: label,
        talents: [],
      };
    };

    let s = 0;
    const talentgroups = [...new Set(actorData.talents.map((talent) => talent.data.groupname))];
    talentgroups.sort().forEach((groupname) => {
      if (groupname != undefined) {
        registerTalentGroup(s, groupname);

        actorData.talents.forEach((talent) => {
          if (talent.data.groupname == groupname) {
            talentbook[s].talents.push(talent);
          }
        });
        s++;
      }
    });

    return talentbook;
  }
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    if (this.isEditable) {
      html.find('.effect-control').click((ev) => onManageActiveEffect(ev, this.document));

      const inputs = html.find('input');
      inputs.focus((ev) => ev.currentTarget.select());
    }

    let weaponContextMenu = [];
    weaponContextMenu.push(this.addEditContextMenu(game.i18n.localize('DL.WeaponEdit')));
    weaponContextMenu.push(this.addDeleteContextMenu(game.i18n.localize('DL.WeaponDelete')));
    new ContextMenu(html, '.weapon-controls', weaponContextMenu);

    let armorContextMenu = [];
    armorContextMenu.push(this.addEditContextMenu(game.i18n.localize('DL.ArmorEdit')));
    armorContextMenu.push(this.addDeleteContextMenu(game.i18n.localize('DL.ArmorDelete')));
    new ContextMenu(html, '.armor-controls', armorContextMenu);

    let ammoContextMenu = [];
    ammoContextMenu.push(this.addEditContextMenu(game.i18n.localize('DL.AmmoEdit')));
    ammoContextMenu.push(this.addDeleteContextMenu(game.i18n.localize('DL.AmmoDelete')));
    new ContextMenu(html, '.ammo-controls', ammoContextMenu);

    // Toggle Accordion
    html.find('.toggleAccordion').click((ev) => {
      const div = ev.currentTarget;

      if (div.nextElementSibling.style.display === 'none') {
        div.nextElementSibling.style.display = 'block';
        div.className = 'toggleAccordion change';
      } else {
        div.nextElementSibling.style.display = 'none';
        div.className = 'toggleAccordion';
      }

      switch (div.dataset.type) {
        case 'action':
          Actor.updateDocuments({
            'data.afflictionsTab.hideAction': !this.actor.data.data.afflictionsTab.hideAction,
          });

          break;

        case 'afflictions':
          Actor.updateDocuments({
            'data.afflictionsTab.hideAfflictions': !this.actor.data.data.afflictionsTab.hideAfflictions,
          });

          break;

        case 'damage':
          Actor.updateDocuments({
            'data.afflictionsTab.hideDamageEffects': !this.actor.data.data.afflictionsTab.hideDamageEffects,
          });

          break;
      }
    });

    // Disbale Afflictions
    html.find('.disableafflictions').click((ev) => {
      this.clearAfflictions();
    });

    // Corruption Roll
    html.find('.corruption-roll').click((ev) => {
      this.actor.rollCorruption();
    });

    // Inventory Item - ShowInfo
    html.find('.show-iteminfo').click((ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.getEmbeddedDocument('Item', li.data('itemId'));

      this.actor.showItemInfo(item);
    });

    // Edit HealthBar, Insanity and Corruption
    html.find('.bar-edit').click((ev) => {
      const actor = this.actor;

      const showEdit = actor.data.data.characteristics.editbar;
      if (showEdit) {
        actor.data.data.characteristics.editbar = false;
      } else {
        actor.data.data.characteristics.editbar = true;
      }

      const that = this;
      actor
        .update({
          'data.characteristics.editbar': actor.data.data.characteristics.editbar,
        })
        .then((item) => {
          that.render();
        });
    });

    // Toggle Spell Info
    html.find('.toggleInfo').click((ev) => {
      const div = ev.currentTarget;
      const parent = div.parentElement;
      if (parent.children[6].style.display === 'none') {
        parent.children[6].style.display = 'block';
      } else {
        parent.children[6].style.display = 'none';
      }
    });

    // Toggle Spell Info
    html.find('.toggleTalentInfo').click((ev) => {
      const div = ev.currentTarget;
      const parent = div.parentElement;
      if (parent.children[4].style.display === 'none') {
        parent.children[4].style.display = 'block';
      } else {
        parent.children[4].style.display = 'none';
      }
    });

    // Toggle Item Info
    html.find('.toggleItemInfo').click((ev) => {
      const div = ev.currentTarget;
      const parent = div.parentElement;
      if (parent.children[3].style.display === 'none') {
        parent.children[3].style.display = 'block';
      } else {
        parent.children[3].style.display = 'none';
      }
    });

    const healthbar = html.find('.healthbar-fill');
    if (healthbar.length > 0) {
      healthbar[0].style.width =
        Math.floor(
          (parseInt(this.actor.data.data.characteristics.health.value) /
            parseInt(this.actor.data.data.characteristics.health.max)) *
            100,
        ) + '%';
    }

    html.on('mousedown', '.addDamage', (ev) => {
      let value = parseInt(this.actor.data.data.characteristics.health.value);
      const max = parseInt(this.actor.data.data.characteristics.health.max);

      if (event.button == 0) {
        if (game.settings.get('demonlord08', 'reverseDamage')) {
          if (value <= 0) value = max;
          else value--;
        } else {
          if (value >= max) value = 0;
          else value++;
        }
      } else if (event.button == 2) {
        if (game.settings.get('demonlord08', 'reverseDamage')) {
          if (value <= 0 || value >= max) value = max;
          else value++;
        } else {
          if (value <= 0) value = 0;
          else value--;
        }
      }

      const that = this;
      this.actor
        .update({
          'data.characteristics.health.value': value,
        })
        .then((item) => {
          that.render();
        });
    });

    const insanitybar = html.find('.insanity-fill');
    if (insanitybar.length > 0) {
      insanitybar[0].style.width =
        Math.floor(
          (parseInt(this.actor.data.data.characteristics.insanity.value) /
            parseInt(this.actor.data.data.characteristics.insanity.max)) *
            100,
        ) + '%';
    }

    html.on('mousedown', '.addInsanity', (ev) => {
      let value = parseInt(this.actor.data.data.characteristics.insanity.value);
      const max = parseInt(this.actor.data.data.characteristics.insanity.max);

      if (ev.button == 0) {
        if (value >= max) value = 0;
        else value++;
      } else if (ev.button == 2) {
        if (value <= 0) value = 0;
        else value--;
      }

      const that = this;
      this.actor
        .update({
          'data.characteristics.insanity.value': value,
        })
        .then((item) => {
          that.render();
        });
    });

    const corruptionbar = html.find('.corruption-fill');
    if (corruptionbar.length > 0) {
      corruptionbar[0].style.width =
        Math.floor((parseInt(this.actor.data.data.characteristics.corruption) / parseInt(20)) * 100) + '%';
    }

    html.on('mousedown', '.addCorruption', (ev) => {
      let value = parseInt(this.actor.data.data.characteristics.corruption);
      const max = parseInt(20);

      if (ev.button == 0) {
        if (value >= max) value = 0;
        else value++;
      } else if (ev.button == 2) {
        if (value <= 0) value = 0;
        else value--;
      }

      const that = this;
      this.actor
        .update({
          'data.characteristics.corruption': value,
        })
        .then((item) => {
          that.render();
        });
    });

    // Edit Creature
    html.find('.creature-edit').click((ev) => {
      const actor = this.actor;

      const showEdit = actor.data.data.edit;
      if (showEdit) {
        actor.data.data.edit = false;
      } else {
        actor.data.data.edit = true;
      }

      const that = this;
      actor
        .update({
          'data.edit': actor.data.data.edit,
        })
        .then((item) => {
          that.render();
        });
    });

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click((ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));

      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click((ev) => {
      const li = $(ev.currentTarget).parents('.item');

      this.showDeleteDialog(
        game.i18n.localize('DL.DialogAreYouSure'),
        game.i18n.localize('DL.DialogDeleteItemText'),
        li,
      );
    });

    // Update Inventory Item
    html.find('.item-wear').click((ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = duplicate(this.actor.items.get(li.data('itemId')));

      item.data.wear = false;
      Item.updateDocuments([item], { parent: this.actor });
    });
    html.find('.item-wearoff').click((ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = duplicate(this.actor.items.get(li.data('itemId')));
      item.data.wear = true;
      Item.updateDocuments([item], { parent: this.actor });
    });

    html.find('.wearitem').each((i, el) => {
      const itemId = el.getAttribute('data-item-id');
      const item = this.actor.items.get(itemId);

      if (item.data.data.wear) {
        if (
          item.data.data.strengthmin != '' &&
          parseInt(item.data.data.strengthmin) > parseInt(this.actor.data.data.attributes.strength.value)
        ) {
          const controls = el.getElementsByClassName('item-control');
          controls[0].className += ' itemred';
        }
      }
    });

    // Update Feature Item
    html.find('.feature-edit').click((ev) => {
      const actor = this.actor;

      const showEdit = actor.data.data.features.edit;
      if (showEdit) {
        actor.data.data.features.edit = false;
      } else {
        actor.data.data.features.edit = true;
      }

      const that = this;
      actor
        .update({
          'data.features.edit': actor.data.data.features.edit,
        })
        .then((item) => {
          that.render();
        });
    });

    // Delete Feature Item
    html.find('.feature-delete').click((ev) => {
      const li = $(ev.currentTarget).parents('.feature');

      this.showDeleteDialog(
        game.i18n.localize('DL.DialogAreYouSure'),
        game.i18n.localize('DL.DialogDeleteFeatureText'),
        li,
      );
    });

    html.find('.editfeature').change((ev) => {
      const id = $(ev.currentTarget).attr('data-item-id');
      const namevalue = ev.currentTarget.children[1].value;
      const descriptionvalue = ev.currentTarget.children[2].value;

      const item = this.actor.getEmbeddedDocument('Item', id);
      item.update({
        name: namevalue,
        'data.description': descriptionvalue,
      });
    });

    // Ancestry
    html.on('mousedown', '.ancestry-edit', (ev) => {
      const div = $(ev.currentTarget).parents('.item');
      const item = this.actor.getEmbeddedDocument('Item', div.data('itemId'));

      if (ev.button == 0) {
        item.sheet.render(true);
      } else if (ev.button == 2) {
        const ancestries = this.actor.getEmbeddedCollection('Item').filter((e) => e.type === 'ancestry');

        for (const ancestry of ancestries) {
          for (const talent of ancestry.data.data.talents) {
            const actorTalent = this.actor
              .getEmbeddedCollection('Item')
              .filter((e) => e.type === 'talent' && e.name === talent.name);

            if (actorTalent.length > 0) {
              this.actor.deleteEmbeddedDocuments('Item', [actorTalent[0].id]);
            }
          }
          for (const talent of ancestry.data.data.level4.talent) {
            const actorTalent = this.actor
              .getEmbeddedCollection('Item')
              .filter((e) => e.type === 'talent' && e.name === talent.name);

            if (actorTalent.length > 0) {
              this.actor.deleteEmbeddedDocuments('Item', [actorTalent[0].id]);
            }
          }
          for (const language of ancestry.data.data.languagelist) {
            const actorLanguage = this.actor
              .getEmbeddedCollection('Item')
              .filter((e) => e.type === 'language' && e.name === language.name);

            if (actorLanguage.length > 0) {
              this.actor.deleteEmbeddedDocuments('Item', [actorLanguage[0].id]);
            }
          }
        }

        this.actor.deleteEmbeddedDocuments('Item', [item.id]);
      }
    });

    html.on('mousedown', '.ancestry-create', (ev) => {
      this.createAncestry(ev);
    });

    // Paths
    html.on('mousedown', '.path-edit', (ev) => {
      const div = $(ev.currentTarget).parents('.path');
      const item = this.actor.getEmbeddedDocument('Item', div.data('itemId'));

      if (ev.button == 0) {
        item.sheet.render(true);
      } else if (ev.button == 2) {
        const paths = this.actor.getEmbeddedCollection('Item').filter((e) => e.type === 'path');

        for (const path of paths) {
          for (const level of path.data.data.levels) {
            for (const talent of level.talents) {
              const actorTalent = this.actor
                .getEmbeddedCollection('Item')
                .filter((e) => e.type === 'talent' && e.name === talent.name);

              if (actorTalent.length > 0) {
                this.actor.deleteEmbeddedDocuments('Item', [actorTalent[0].id]);
              }
            }
            for (const talent of level.talentspick) {
              const actorTalent = this.actor
                .getEmbeddedCollection('Item')
                .filter((e) => e.type === 'talent' && e.name === talent.name);

              if (actorTalent.length > 0) {
                this.actor.deleteEmbeddedDocuments('Item', [actorTalent[0].id]);
              }
            }
            for (const spell of level.spells) {
              const actorSpell = this.actor
                .getEmbeddedCollection('Item')
                .filter((e) => e.type === 'spell' && e.name === spell.name);

              if (actorSpell.length > 0) {
                this.actor.deleteEmbeddedDocuments('Item', [actorSpell[0].id]);
              }
            }
          }
        }

        this.actor.deleteEmbeddedDocuments('Item', [item.id]);
      }
    });

    // Wealth
    html.find('.wealth-edit').click((ev) => {
      const actor = this.actor;

      actor.data.data.wealth.edit = !actor.data.data.wealth.edit;

      const that = this;
      actor
        .update({
          'data.wealth.edit': actor.data.data.wealth.edit,
        })
        .then((item) => {
          that.render();
        });
    });

    // Paths
    html.find('.paths-edit').click((ev) => {
      const actor = this.actor;

      actor.data.data.paths.edit = !actor.data.data.paths.edit;

      const that = this;
      actor
        .update({
          'data.paths.edit': actor.data.data.paths.edit,
        })
        .then((item) => {
          that.render();
        });
    });

    // Languages - Edit
    html.find('.languages-edit').click((ev) => {
      const actor = this.actor;

      actor.data.data.languages.edit = !actor.data.data.languages.edit;

      const that = this;
      actor
        .update({
          'data.languages.edit': actor.data.data.languages.edit,
        })
        .then((item) => {
          that.render();
        });
    });

    // Languages - Delete
    html.find('.language-delete').click((ev) => {
      const li = $(ev.currentTarget).parents('.language');

      this.showDeleteDialog(
        game.i18n.localize('DL.DialogAreYouSure'),
        game.i18n.localize('DL.DialogDeleteLanguageText'),
        li,
      );
    });
    // Language - Toogle Read
    html.find('.language-toggle-r').click((ev) => {
      const dev = ev.currentTarget.closest('.language');
      const item = duplicate(this.actor.items.get(dev.dataset.itemId));

      item.data.read = !item.data.read;
      Item.updateDocuments([item], { parent: this.actor });
    });
    // Language - Toogle Write
    html.find('.language-toggle-w').click((ev) => {
      const dev = ev.currentTarget.closest('.language');
      const item = duplicate(this.actor.items.get(dev.dataset.itemId));

      item.data.write = !item.data.write;
      Item.updateDocuments([item], { parent: this.actor });
    });
    // Language - Toogle Speak
    html.find('.language-toggle-s').click((ev) => {
      const dev = ev.currentTarget.closest('.language');
      const item = duplicate(this.actor.items.get(dev.dataset.itemId));

      item.data.speak = !item.data.speak;
      Item.updateDocuments([item], { parent: this.actor });
    });

    // Profession
    html.find('.profession-edit').click((ev) => {
      const actor = this.actor;

      actor.data.data.professions.edit = !actor.data.data.professions.edit;

      const that = this;
      actor
        .update({
          'data.professions.edit': actor.data.data.professions.edit,
        })
        .then((item) => {
          that.render();
        });
    });

    html.find('.editprofession').change((ev) => {
      const id = $(ev.currentTarget).attr('data-item-id');
      const namevalue = ev.currentTarget.children[1].value;
      const descriptionvalue = ev.currentTarget.children[2].value;

      const item = this.actor.items.get(id);
      item.update({
        name: namevalue,
        'data.description': descriptionvalue,
      });
    });

    // Religion
    html.find('.religion-edit').click((ev) => {
      const actor = this.actor;

      actor.data.data.religion.edit = !actor.data.data.religion.edit;

      const that = this;
      actor
        .update({
          'data.religion.edit': actor.data.data.religion.edit,
        })
        .then((item) => {
          that.render();
        });
    });

    // Add Spell Item
    html.find('.spell-create').click(this._onSpellCreate.bind(this));

    html.find('.spell-edit').click((ev) => {
      const liSpell = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(liSpell.data('itemId'));

      item.sheet.render(true);
    });

    html.find('.spell-delete').click((ev) => {
      const li = $(ev.currentTarget).parents('.item');

      this.showDeleteDialog(
        game.i18n.localize('DL.DialogAreYouSure'),
        game.i18n.localize('DL.DialogDeleteSpellText'),
        li,
      );
    });

    // Rollable
    html.find('.rollable').click(this._onRoll.bind(this));

    // Attibute Checks
    html.find('.ability-name').click((ev) => {
      const abl = ev.currentTarget.parentElement.getAttribute('data-ability');
      this.actor.rollAbility(abl);
    });

    html.on('mousedown', '.ammo-amount', (ev) => {
      const li = ev.currentTarget.closest('.item');
      const item = duplicate(this.actor.items.get(li.dataset.itemId));
      const amount = item.data.quantity;

      if (ev.button == 0) {
        if (amount >= 0) {
          item.data.quantity = Number(amount) + 1;
        }
      } else if (ev.button == 2) {
        if (amount > 0) {
          item.data.quantity = Number(amount) - 1;
        }
      }

      Item.updateDocuments([item], { parent: this.actor });
    });

    html.on('mousedown', '.talent-uses', (ev) => {
      const li = ev.currentTarget.closest('.item');
      const item = duplicate(this.actor.items.get(li.dataset.itemId));
      const uses = item.data.uses.value;
      const usesmax = item.data.uses.max;

      if (ev.button == 0) {
        if (uses == 0 && usesmax == 0) {
          item.data.addtonextroll = true;
        } else if (uses < usesmax) {
          item.data.uses.value = Number(uses) + 1;
          item.data.addtonextroll = true;
        } else {
          item.data.uses.value = 0;
          item.data.addtonextroll = false;
        }
      } else if (ev.button == 2) {
        if (uses == 0 && usesmax == 0) {
          item.data.addtonextroll = true;
        } else if (uses > 0 && uses <= usesmax) {
          item.data.uses.value = Number(uses) - 1;
          if (Number(uses) - 1 == 0) item.data.addtonextroll = false;
          else item.data.addtonextroll = true;
        } else {
          item.data.uses.value = 0;
          item.data.addtonextroll = false;
        }
      }

      Item.updateDocuments([item], { parent: this.actor });
    });

    html.on('mousedown', '.spell-uses', (ev) => {
      const li = ev.currentTarget.closest('.item');
      const item = duplicate(this.actor.items.get(li.dataset.itemId));
      const uses = item.data.castings.value;
      const usesmax = item.data.castings.max;

      if (ev.button == 0) {
        if (uses < usesmax) {
          item.data.castings.value = Number(uses) + 1;
        } else {
          item.data.castings.value = 0;
        }
      } else if (ev.button == 2) {
        if (uses > 0 && uses <= usesmax) {
          item.data.castings.value = Number(uses) - 1;
          if (Number(uses) - 1 == 0) item.data.addtonextroll = false;
          else item.data.addtonextroll = true;
        } else {
          item.data.castings.value = 0;
        }
      }

      Item.updateDocuments([item], { parent: this.actor });
    });

    html.on('mousedown', '.item-uses', (ev) => {
      const li = ev.currentTarget.closest('.item');
      const item = duplicate(this.actor.items.get(li.dataset.itemId));

      if (ev.button == 0) {
        item.data.quantity++;
      } else if (ev.button == 2) {
        if (item.data.quantity > 0) item.data.quantity--;
      }

      Item.updateDocuments([item], { parent: this.actor });
    });

    // Rollable Attributes
    html.find('.attribute-roll').click((ev) => {
      const div = $(ev.currentTarget);
      const attributeName = div.data('key');
      const attribute = this.actor.data.data.attributes[attributeName];
      this.actor.rollChallenge(attribute);
    });

    // Rollable Attack
    html.find('.attack-roll').click((ev) => {
      const li = event.currentTarget.closest('.item');
      this.actor.rollWeaponAttack(li.dataset.itemId, {
        event: event,
      });
    });

    // Rollable Talent
    html.find('.talent-roll').click((ev) => {
      const li = event.currentTarget.closest('.item');
      this.actor.rollTalent(li.dataset.itemId, {
        event: event,
      });
    });

    // Rollable Attack Spell
    html.find('.magic-roll').click((ev) => {
      const li = event.currentTarget.closest('.item');
      this.actor.rollSpell(li.dataset.itemId, {
        event: event,
      });
    });

    html.find('.rest-char').click((ev) => {
      // Talents
      const talents = this.actor.getEmbeddedCollection('Item').filter((e) => e.type === 'talent');

      for (const talent of talents) {
        const item = duplicate(this.actor.items.get(talent.id));
        item.data.uses.value = 0;

        Item.updateDocuments([item], { parent: this.actor });
      }

      // Spells
      const spells = this.actor.getEmbeddedCollection('Item').filter((e) => e.type === 'spell');

      for (const spell of spells) {
        const item = duplicate(this.actor.items.get(spell.id));

        item.data.castings.value = 0;

        Item.updateDocuments([item], { parent: this.actor });
      }
    });

    // Talent: Options
    html.find('input[type=checkbox][id^="option"]').click((ev) => {
      const div = ev.currentTarget.closest('.option');
      const field = ev.currentTarget.name;
      const update = {
        id: div.dataset.itemId,
        [field]: ev.currentTarget.checked,
      };

      Item.updateDocuments(update, { parent: this.actor });
    });

    // Drag events for macros.
    if (this.actor.isOwner) {
      const handler = (ev) => this._onDragStart(ev);

      html.find('li.dropitem').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
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
    return Item.create(itemData, { parent: this.actor });
  }

  _onTraditionCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = 'New Tradition';
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data,
    };

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data.type;
    return Item.create(itemData, { parent: this.actor });
  }

  _onSpellCreate(event) {
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

    return Item.create(itemData, { parent: this.actor });
  }

  deleteItem(item) {
    Item.deleteDocuments([item.data('itemId')], { parent: this.actor });
    item.slideUp(200, () => this.render(false));
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (dataset.roll) {
      const roll = new Roll(dataset.roll, this.actor.data.data);
      const label = dataset.label ? `Rolling ${dataset.label}` : '';
      roll.roll().toMessage({
        speaker: ChatMessage.getSpeaker({
          actor: this.actor,
        }),
        flavor: label,
      });
    }
  }

  showDeleteDialog(title, content, item) {
    const d = new Dialog({
      title: title,
      content: content,
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogYes'),
          callback: (html) => this.deleteItem(item),
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('DL.DialogNo'),
          callback: () => {},
        },
      },
      default: 'no',
      close: () => {},
    });
    d.render(true);
  }

  async createAncestry(ev) {
    const data = { name: 'New ancestry', type: 'ancestry' };
    const talentToCreate = await this.actor.createEmbeddedDocument('Item', data);
    await Actor.updateDocuments(talentToCreate);
  }

  async clearAfflictions() {
    await Actor.update({
      'data.afflictions.asleep': false,
      'data.afflictions.blinded': false,
      'data.afflictions.charmed': false,
      'data.afflictions.compelled': false,
      'data.afflictions.dazed': false,
      'data.afflictions.deafened': false,
      'data.afflictions.defenseless': false,
      'data.afflictions.diseased': false,
      'data.afflictions.fatigued': false,
      'data.afflictions.frightened': false,
      'data.afflictions.horrified': false,
      'data.afflictions.grabbed': false,
      'data.afflictions.immobilized': false,
      'data.afflictions.impaired': false,
      'data.afflictions.poisoned': false,
      'data.afflictions.prone': false,
      'data.afflictions.slowed': false,
      'data.afflictions.stunned': false,
      'data.afflictions.surprised': false,
      'data.afflictions.unconscious': false,
    });
  }

  addEditContextMenu(menutitle) {
    return {
      name: menutitle,
      icon: '<i class="fas fa-edit"></i>',
      callback: (element) => {
        const item = this.actor.items.get(element.data('item-id'));
        item.sheet.render(true);
      },
    };
  }

  addDeleteContextMenu(menutitle) {
    return {
      name: menutitle,
      icon: '<i class="fas fa-trash"></i>',
      callback: (element) => {
        Item.deleteDocuments([element.data('item-id')], { parent: this.actor });
      },
    };
  }
}
