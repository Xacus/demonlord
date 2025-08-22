import DLBaseActorSheetV2 from './base-actor-sheet-v2'
import { prepareActiveEffectCategories } from '../../active-effects/effects'
import { handleLevelChange } from '../../item/nested-objects'
import launchRestDialog from '../../dialog/rest-dialog'

export default class DLCharacterSheetV2 extends DLBaseActorSheetV2 {
  static DEFAULT_OPTIONS = mergeObject(super.DEFAULT_OPTIONS, {
    // All from base
    actions: {
      rollCorruption: this.onRollCorruption,
      editStatBar: this.onEditStatBar,
      editLanguages: this.onEditLanguages,
      //editReligion: this.onEditReligion // Unused?

      editAncestry: this.onEditAncestry,
      editPath: this.onEditPath,
      editRole: this.onEditRole,
      editRelic: this.onEditRelic,

      restCharacter: this.onRestCharacter,

    }
  })

  static PARTS = {
    // All from base
    sidebar: { template: 'systems/demonlord/templates/actor/parts/character-sheet-sidemenu.hbs' },
    header: { template: 'systems/demonlord/templates/actor/parts/character-sheet-header.hbs' },
    tabs: { template: 'systems/demonlord/templates/generic/tab-navigation.hbs' },

    // Tabs
    character: { template: 'systems/demonlord/templates/actor/tabs/character.hbs' },
    combat: { template: 'systems/demonlord/templates/actor/tabs/combat.hbs' },
    talents: { template: 'systems/demonlord/templates/actor/tabs/talents.hbs' },
    magic: { template: 'systems/demonlord/templates/actor/tabs/magic.hbs' },
    inventory: { template: 'systems/demonlord/templates/actor/tabs/item.hbs' },
    background: { template: 'systems/demonlord/templates/actor/tabs/background.hbs' },
    afflictions: { template: 'systems/demonlord/templates/actor/tabs/afflictions.hbs' },
    effects: { template: 'systems/demonlord/templates/actor/tabs/effects.hbs' }
  }

  /* -------------------------------------------- */
  /*  Data preparation                            */
  /* -------------------------------------------- */
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options)

    // Effects categories
    context.ancestryEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.demonlord?.sourceType === 'ancestry'),
    )
    delete context.ancestryEffects.temporary

    context.pathEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.demonlord?.sourceType === 'path'),
    )
    delete context.pathEffects.temporary

    context.talentEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.demonlord?.sourceType === 'talent'),
    )
    context.spellEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.demonlord?.sourceType === 'spell'),
    )
    context.itemEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => ['armor', 'weapon', 'item'].indexOf(effect.flags?.demonlord?.sourceType) >= 0),
    )
    context.itemEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.demonlord?.sourceType === 'creaturerole'),
    )
    context.itemEffects = prepareActiveEffectCategories(
      Array.from(this.actor.allApplicableEffects()).filter(effect => effect.flags?.demonlord?.sourceType === 'relic'),
    )
    this._prepareItems(context)
    context['fortuneAwardPrevented']  = (game.settings.get('demonlord', 'fortuneAwardPrevented') && !game.user.isGM && !this.actor.system.characteristics.fortune) ? true : false
    return context
  }

  /* -------------------------------------------- */

  /** @override */
  _prepareItems(sheetData) {
    super._prepareItems(sheetData)
    const m = sheetData._itemsByType
    const actorData = sheetData.actor
    actorData.gear = m.get('item') || []
    actorData.relics = m.get('relic') || []
    actorData.armor = m.get('armor') || []
    actorData.ammo = m.get('ammo') || []
    actorData.ancestry = m.get('ancestry') || []
    actorData.professions = m.get('profession') || []
    actorData.languages = m.get('language') || ''
    actorData.paths = m.get('path') || []
    actorData.talentbook = this._prepareBook(actorData.talents, 'groupname', 'talents')
    actorData.roles = m.get('creaturerole') || []

    // Sort paths
    actorData.paths = [
      ...actorData.paths.filter(p => p.system.type === 'novice'),
      ...actorData.paths.filter(p => p.system.type === 'expert'),
      ...actorData.paths.filter(p => p.system.type === 'master'),
      ...actorData.paths.filter(p => p.system.type === 'legendary')
    ]
  }

  /* -------------------------------------------- */
  /** @override */
  async checkDroppedItem(itemData) {
    const type = itemData.type
    if (['specialaction', 'endoftheround', 'creaturerole'].includes(type)) return false

    if (type === 'ancestry') {
      const currentAncestriesIds = this.actor.items.filter(i => i.type === 'ancestry').map(i => i._id)
      if (currentAncestriesIds?.length > 0) await this.actor.deleteEmbeddedDocuments('Item', currentAncestriesIds)
      return true
    } else if (type === 'path' && this.actor.system.paths?.length >= 3) return false

    return true
  }

  /**
   * @override
   * @param {DemonlordItem} item 
   */
  async postDropItemCreate (item) {     
    if (item.type === 'ancestry') {

      // Add insanity and corruption values
      const insanityImmune = this.actor.system.characteristics.insanity.immune || item.system.levels.filter(l => l.characteristics.insanity.immune).length > 0
      const corruptionImmune = this.actor.system.characteristics.corruption.immune || item.system.levels.filter(l => l.characteristics.corruption.immune).length > 0
      const newInsanity = this.actor.system.characteristics.insanity.value + item.system.levels.reduce((s, l) => s + l.characteristics.insanity.value, 0)
      const newCorruption = this.actor.system.characteristics.corruption.value + item.system.levels.reduce((s, l) => s + l.characteristics.corruption.value, 0)

      await this.actor.update({
        'system.characteristics': {
          insanity: {
            value: insanityImmune ? 0 : newInsanity
          },
          corruption: {
            value: corruptionImmune ? 0 : newCorruption
          }
        }
      })
    }
  }

  /* -------------------------------------------- */
  /*  Auxiliary functions                         */
  /* -------------------------------------------- */
  
  async _updateObject(event, formData) {
    const newLevel = formData['system.level']
    if (newLevel !== this.document.system.level) await handleLevelChange(this.document, newLevel)
    return await this.document.update(formData)
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  static async onRollCorruption() {
    return await this.actor.rollCorruption()
  }

  /** Edit HealthBar, Insanity and Corruption */
  static async onEditStatBar() {   
    const actor = this.actor
    const showEdit = actor.system.characteristics.editbar
    actor.system.characteristics.editbar = !showEdit

    await actor.update({ 'system.characteristics.editbar': actor.system.characteristics.editbar })
    await this.render({parts: ['sidebar']})
  }

  static async onEditLanguages() {
    await this.actor.update({ 'system.languages.edit': !this.actor.system.languages.edit, }).then(() => this.render())
  }

  /* Unused ?
  static async onEditReligion() {
    await this.actor.update({ 'system.religion.edit': !this.actor.system.religion.edit }).then(() => this.render())
  }*/

  static async onRestCharacter() {
    launchRestDialog(game.i18n.localize('DL.DialogRestTitle'), (dHtml, restTime) => {
      this.actor.restActor(
        restTime,
        !dHtml.currentTarget.querySelector("input[id='noMagicRecovery']").checked,
        !dHtml.currentTarget.querySelector("input[id='noTalentRecovery']").checked,
        !dHtml.currentTarget.querySelector("input[id='noHealing']").checked,
      )
    })
  }

  static async onEditAncestry(ev) {
    const div = $(ev.currentTarget)
    const ancestry = this.actor.getEmbeddedDocument('Item', div.data('itemId'))

    if (ev.button == 0) ancestry.sheet.render(true)
    else if (ev.button == 2) {
      if (this.actor.system.level > 0 && game.settings.get('demonlord', 'confirmAncestryPathRemoval')) {
          await this.showDeleteDialog(game.i18n.localize('DL.DialogAreYouSure'), game.i18n.localize('DL.DialogDeleteAncestryText'), div)
      } else {
        await ancestry.delete({ parent: this.actor })
      }
    }
  }

  static async onEditPath(ev) {
    const div = $(ev.currentTarget)
    const path = this.actor.getEmbeddedDocument('Item', div.data('itemId'))

    if (ev.button == 0) path.sheet.render(true)
    else if (ev.button == 2) {
      if (this.actor.system.level > 0 && game.settings.get('demonlord', 'confirmAncestryPathRemoval')) {
        await this.showDeleteDialog(game.i18n.localize('DL.DialogAreYouSure'), game.i18n.localize('DL.DialogDeletePathText'), div)
      } else {
        await path.delete({ parent: this.actor })
      }
    }
  }
  
  static async onEditRole(ev) {
    const div = $(ev.currentTarget)
    const role = this.actor.getEmbeddedDocument('Item', div.data('itemId'))
    
    if (ev.button == 0) role.sheet.render(true)
    else if (ev.button == 2) await role.delete({ parent: this.actor })
  }

  static async onEditRelic(ev) {
    const div = $(ev.currentTarget)
    const role = this.actor.getEmbeddedDocument('Item', div.data('itemId'))

    if (ev.button == 0) role.sheet.render(true)
    else if (ev.button == 2) await role.delete({ parent: this.actor })
  }

  /* -------------------------------------------- */

  /* -------------------------------------------- */
  /*  Listeners                                   */
  /* -------------------------------------------- */

  /** @override */
  async _onRender(context, options) {
    super._onRender(context, options)

    if (!this.options.editable) return

    let e = this.element

    // Health bar clicks
    e.querySelector('.addDamage')?.addEventListener('mousedown', ev => {
      if (ev.button == 0) this.actor.increaseDamage(+1)
      // Increase damage
      else if (ev.button == 2) this.actor.increaseDamage(-1) // Decrease damage
    })

    // Insanity bar click
    e.querySelector('.addInsanity')?.addEventListener('mousedown', async ev => {
      let value = parseInt(this.actor.system.characteristics.insanity.value)
      const max = parseInt(this.actor.system.characteristics.insanity.max)
      if (ev.button == 0) {
        if (value >= max) value = 0
        else value++
      } else if (ev.button == 2) {
        if (value <= 0) value = 0
        else value--
      }
      await this.actor.update({ 'system.characteristics.insanity.value': value })
    })

    // Corruption bar click
    e.querySelector('.addCorruption')?.addEventListener('mousedown', async ev => {
      let value = parseInt(this.actor.system.characteristics.corruption.value)
      const max = parseInt(20)
      if (ev.button == 0) {
        if (value >= max) value = 0
        else value++
      } else if (ev.button == 2) {
        if (value <= 0) value = 0
        else value--
      }
      await this.actor.update({ 'system.characteristics.corruption.value': value })
    })

    // Fortune click
    e.querySelector('.fortune').addEventListener('mousedown', async () => {
      // Expending fortune always possible.
      if (game.settings.get('demonlord', 'fortuneAwardPrevented') && !game.user.isGM && !this.actor.system.characteristics.fortune) return
      let value = parseInt(this.actor.system.characteristics.fortune)
      if (value) await this.actor.expendFortune(false)
      else this.actor.expendFortune(true)
    })

    // Health bar fill
    const healthbar = e.querySelector('.healthbar-fill')
    if (healthbar) {
      const health = this.actor.system.characteristics.health
      healthbar.style.width = Math.floor((+health.value / +health.max) * 100) + '%'
    }

    // Insanity bar fill
    const insanitybar = e.querySelector('.insanity-fill')
    if (insanitybar) {
      const insanity = this.actor.system.characteristics.insanity
      insanitybar.style.width = Math.floor((+insanity.value / +insanity.max) * 100) + '%'
    }

    // Corruption bar fill
    const corruptionbar = e.querySelector('.corruption-fill')
    if (corruptionbar) {
      const corruption = this.actor.system.characteristics.corruption.value
      corruptionbar.style.width = Math.floor((+corruption / 20) * 100) + '%'
    }

    // // Ancestry edit
    // e.querySelector('.ancestry-edit')?.addEventListener('mousedown', async ev => await this._onAncestryEdit(ev))

    // // Path edit
    // e.querySelectorAll('.path-edit')?.forEach(p => p.addEventListener('mousedown', async ev => await this._onPathEdit(ev)))

    // // Role edit
    // e.querySelectorAll('.role-edit')?.forEach(p => p.addEventListener('mousedown', '.role-edit', async ev => await this._onRoleEdit(ev)))

    // // Relic edit
    // e.querySelectorAll('.relic-edit')?.forEach(p => p.addEventListener('mousedown', async ev => await this._onRelicEdit(ev)))
    
    // Languages CRUD
    const _toggleLang = async (ev, key) => {
      const dev = ev.currentTarget.closest('.language')
      const item = this.actor.items.get(dev.dataset.itemId)
      await item.update({[`system.${key}`]: !item.system[key] }, { parent: this.actor })
    }
    e.querySelectorAll('.language-delete')?.forEach(el => el.addEventListener('click', ev => this._onItemDelete(ev, '.language')))
    e.querySelectorAll('.language-toggle-r')?.forEach(el => el.addEventListener('click', ev => _toggleLang(ev, 'read')))
    e.querySelectorAll('.language-toggle-w')?.forEach(el => el.addEventListener('click', ev => _toggleLang(ev, 'write')))
    e.querySelectorAll('.language-toggle-s')?.forEach(el => el.addEventListener('click', ev => _toggleLang(ev, 'speak')))

    // Ammo uses
    e.querySelector('.ammo-amount')?.forEach(el => el.addEventListener('mousedown', async ev => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      const item = foundry.utils.duplicate(this.actor.items.get(id))
      const amount = item.system.quantity
      if (ev.button == 0 && amount >= 0) item.system.quantity = +amount + 1
      else if (ev.button == 2 && amount > 0) item.system.quantity = +amount - 1
      await Item.updateDocuments([item], { parent: this.actor })
    }))

    // Item uses
    e.querySelector('.item-uses')?.forEach(el => el.addEventListener('mousedown', async ev => {
      const id = $(ev.currentTarget).closest('[data-item-id]').data('itemId')
      const item = foundry.utils.duplicate(this.actor.items.get(id))
      if (ev.button == 0) {
        item.system.quantity++
      } else if (ev.button == 2) {
        if (item.system.quantity > 0) {
          item.system.quantity--
        }
      }
      await Item.updateDocuments([item], { parent: this.actor })
    }))

    // Healing Rate button
    e.querySelector('.healingratebox').addEventListener('mousedown', async ev => await this.actor.applyHealing(ev.button === 0))

    // Talent: Options
    e.querySelector('input[type=checkbox][id^="option"]')?.forEach(el => el.addEventListener('click', async ev => {
      const div = ev.currentTarget.closest('.option')
      const field = ev.currentTarget.name
      const update = {
        id: div.dataset.itemId,
        [field]: ev.currentTarget.checked,
      }

      await Item.updateDocuments(update, { parent: this.actor })
    }))
  }
}
