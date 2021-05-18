import { onManageActiveEffect, prepareActiveEffectCategories } from '../../active-effects/effects';
import { DL } from '../../config';
import { DamageType, PathLevelItem } from '../pathlevel';

export default class DLBaseItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['demonlord2', 'sheet', 'item'],
      width: 600,
      height: 520,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'attributes',
        },
      ],
      scrollY: ['.tab.paths', '.tab.active'],
    });
  }

  /** @override */
  get template() {
    const path = 'systems/demonlord08/templates/item';
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find('.sheet-body');
    const bodyHeight = position.height - 125;
    sheetBody.css('height', bodyHeight);
    return position;
  }

  /* -------------------------------------------- */
  /*  Data                                        */
  /* -------------------------------------------- */

  /** @override */
  getData(options) {
    const data = super.getData(options);
    const itemData = data.data;
    data.isGM = game.user.isGM;
    data.lockAncestry = game.settings.get('demonlord08', 'lockAncestry');
    data.config = DL;
    data.item = itemData;
    data.data = itemData.data;
    data.effects =
      this.document.effects.size > 0 || !data.document.isEmbedded
        ? prepareActiveEffectCategories(this.document.effects, !data.document.isEmbedded)
        : null;

    if (data.item.type === 'weapon' || data.item.type === 'spell') this._prepareDamageTypes(data);
    else if (data.item.type === 'talent') this._prepareDamageTypes(data, true);

    return data;
  }

  /**
   * Handles the damage types updates
   * @override */
  async _updateObject(event, formData) {
    const item = this.object;
    const updateData = expandObject(formData);
    let altdamage, altdamagetype;

    if (item.type === 'talent') {
      altdamage = updateData?.altdamagevs || [];
      altdamagetype = updateData?.altdamagetypevs || [];
      updateData['data.vs.damagetypes'] = altdamage.map((damage, index) => ({
        damage: damage,
        damagetype: altdamagetype[index],
      }));
      // If a Talent has no uses it's always active
      updateData['data.addtonextroll'] = !updateData.data?.uses?.max;
    } else if (item.type === 'weapon' || item.type === 'spell') {
      altdamage = updateData?.altdamage || [];
      altdamagetype = updateData?.altdamagetype || [];
      updateData['data.action.damagetypes'] = altdamage.map((damage, index) => ({
        damage: damage,
        damagetype: altdamagetype[index],
      }));
    }
    return this.object.update(updateData);
  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */
  /* -------------------------------------------- */

  _prepareDamageTypes(data, isVs = false) {
    data.item.damagetypes = data.item.data?.action?.damagetypes;
    if (isVs) data.item.vsdamagetypes = data.item.data?.vs?.damagetypes;
  }

  _onManageDamageType(ev, actionKey, options = {}) {
    ev.preventDefault();
    const a = ev.currentTarget;
    const damageTypes = this.object.data.data[actionKey].damagetypes;
    const updKey = `data.${actionKey}.damagetypes`;

    if (a.dataset.action === 'create') damageTypes.push(new DamageType());
    else if (a.dataset.action === 'delete') damageTypes.splice(a.dataset.id, 1);
    this.object.update({ [updKey]: damageTypes }, { ...options, parent: this.actor }).then((_) => this.render());
  }

  /* -------------------------------------------- */

  _onDragOver = (ev) => $(ev.originalEvent.target).addClass('drop-hover');

  _onDragLeave = (ev) => $(ev.originalEvent.target).removeClass('drop-hover');

  _onDrop = (ev) => {
    const $dropTarget = $(ev.originalEvent.target);
    try {
      const data = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'));
      if (data.type === 'Item') {
        const group = $dropTarget.data('group');
        $dropTarget.removeClass('drop-hover');
        this._addItem(data, group);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  /* -------------------------------------------- */

  _addItem(data, group) {
    throw { name: 'NotImplementedError', message: 'Cannot drag items into base sheets' };
  }

  _deleteItem(itemIndex, itemGroup) {
    throw { name: 'NotImplementedError', message: 'Cannot delete items from base sheets' };
  }

  async _getIncorporatedItem(incorporatedData) {
    if (incorporatedData.pack) {
      const pack = game.packs.get(incorporatedData.pack);
      if (pack.metadata.entity !== 'Item') return;
      return await pack.getEntity(incorporatedData.id);
    } else if (incorporatedData.data) return incorporatedData;
    return game.items.get(incorporatedData.id);
  }

  /* -------------------------------------------- */
  /*  Listeners                                   */
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
    if (this.isEditable) {
      const inputs = html.find('input');
      inputs.focus((ev) => ev.currentTarget.select());
    }

    // Active effects edit
    html.find('.effect-control').click((ev) => onManageActiveEffect(ev, this.document));

    // Damage types
    html.find('.damagetype-control').click((ev) => this._onManageDamageType(ev, 'action'));
    html.find('.vsdamagetype-control').click((ev) => this._onManageDamageType(ev, 'vs', { diff: false }));

    // Add drag events.
    html
      .find('.drop-area')
      .on('dragover', this._onDragOver.bind(this))
      .on('dragleave', this._onDragLeave.bind(this))
      .on('drop', this._onDrop.bind(this));

    // Transfer talents (used by both Ancestry and Path)
    html.find('.transfer-talent').click((ev) => this.showTransferDialog(ev));
    html.find('.transfer-talents').click((ev) => this.showTransferDialog(ev));
  }

  /* -------------------------------------------- */
  /*  Transfer Dialog                             */
  /* -------------------------------------------- */

  showTransferDialog(ev) {
    const d = new Dialog({
      title: game.i18n.localize('DL.PathsDialogTransferTalents'),
      content: game.i18n.localize('DL.PathsDialogTransferTalentsText'),
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize('DL.DialogYes'),
          callback: (_) => this.transferItem(ev),
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

  transferItem(ev) {
    throw { name: 'NotImplementedError' };
  }
}
