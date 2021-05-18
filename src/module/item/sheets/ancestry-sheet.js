import DLBaseItemSheet from './base-item-sheet';
import { PathLevelItem } from '../pathlevel';

export default class DLAncestrySheet extends DLBaseItemSheet {
  /* -------------------------------------------- */
  /*  Data                                        */
  /* -------------------------------------------- */

  /** @override */
  getData(options) {
    const data = super.getData(options);
    data.item.editAncestry = false;
    return data;
  }

  /**
   * Sets actor's spell uses when power changes
   * @override */
  async _updateObject(event, formData) {
    const updateData = expandObject(formData);
    if (this.item.actor && updateData.data?.characteristics?.power) this.item.actor.setUsesOnSpells();
    return this.object.update(updateData);
  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */
  /* -------------------------------------------- */

  /** @override */
  async _addItem(data, group) {
    const itemId = data.id;
    const levelItem = new PathLevelItem();
    const itemData = duplicate(this.item.data);
    let item = await this._getIncorporatedItem(data);
    let type = item.type;

    if (!item || !(type === item.data.type)) return;

    levelItem.id = item.id;
    levelItem.name = item.name;
    levelItem.description = item.data.data.description;
    levelItem.pack = data.pack ? data.pack : '';

    if (type === 'talent' && group === 'talent') itemData.data.talents.push(levelItem);
    else if (type === 'talent') itemData.data.level4.talent.push(levelItem);
    else if (type === 'language') itemData.data.languagelist.push(levelItem);
    else return;
    this.item.update(itemData, { diff: false }).then((_) => this.render);
  }

  /** @override */
  async _deleteItem(itemIndex, itemGroup) {
    const itemData = duplicate(this.item.data);
    if (itemGroup === 'talent') itemData.data.talents.splice(itemIndex, 1);
    else if (itemGroup === 'talent4') itemData.data.level4.talent.splice(itemIndex, 1);
    else if (itemGroup === 'language') itemData.data.languagelist.splice(itemIndex, 1);
    Item.updateDocuments([itemData], { parent: this.actor }).then((_) => this.render());
  }

  /** @override */
  transferItem(event) {
    event.preventDefault();
    // Transfer all talents
    if (event.currentTarget.className.indexOf('transfer-talents')) {
      const itemGroup = event.currentTarget.getAttribute('data-group');
      let obj = itemGroup === 'talent' ? this.object.data.data.talents : this.object.data.data.level4.talent;
      // FIXME: why does it only look at game.items and not also packs?
      if (!obj) return;
      this.actor.createEmbeddedDocuments(
        'Item',
        obj
          .map((t) => game.items.get(t.id))
          .filter((i) => !!i)
          .map((i) => i.data),
      );
    }
    // Transfer single Item
    else {
      const itemIndex = event.currentTarget.getAttribute('data-item-id');
      const itemGroup = event.currentTarget.parentElement.parentElement.getAttribute('data-group');
      let selectedLevelItem =
        itemGroup === 'talent'
          ? this.object.data.data.talents[itemIndex]
          : this.object.data.data.level4.talent[itemIndex];
      if (!selectedLevelItem) return;
      let item = game.items.get(selectedLevelItem.id); // FIXME also here it looks at game.items
      if (!item) return;
      this.actor.createEmbeddedDocuments('Item', [item.data]);
    }
  }

  /* -------------------------------------------- */
  /*  Listeners                                   */
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.options.editable) return;

    // Radio buttons
    html.find('.radiotrue').click((_) => this.item.update({ 'data.level4.option1': true }));
    html.find('.radiofalse').click((_) => this.item.update({ 'data.level4.option1': false }));

    // Edit ancestry talents
    html
      .find('.edit-ancestrytalents')
      .click((_) =>
        this.item.update({ 'data.editTalents': !this.item.data.data.editTalents }).then((_) => this.render()),
      );

    // Delete ancestry item
    html.find('.delete-ancestryitem').click((ev) => {
      const itemGroup = ev.currentTarget.parentElement.parentElement.parentElement.getAttribute('data-group');
      const itemIndex = ev.currentTarget.parentElement.getAttribute('data-item-id');
      this._deleteItem(itemIndex, itemGroup);
    });
  }
}
