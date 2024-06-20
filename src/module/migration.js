export async function handleMigrations() {
  // Determine whether a system migration is required and feasible
  if (!game.user.isGM) return
  const currentVersion = game.settings.get('demonlord', 'systemMigrationVersion')
  if (!currentVersion) {
    // If no version is saved, no need to migrate
    return game.settings.set('demonlord', 'systemMigrationVersion', game.system.version)
  }

  // Compatibility warning
  const COMPATIBLE_MIGRATION_VERSION = 0.8
  if (currentVersion && foundry.utils.isNewerVersion(COMPATIBLE_MIGRATION_VERSION, currentVersion) && !game.data.release?.generation) {
    const warning =
      'Your Demonlord system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.'
    ui.notifications.error(warning, { permanent: true })
  }

  // 1.7.7 migration
  if (foundry.utils.isNewerVersion('1.7.7', currentVersion) && !game.data.release?.generation) await migrateWorld_1_7_7()

  // 2.0.0 migration
  if (foundry.utils.isNewerVersion('2.0.0', currentVersion) && !game.data.release?.generation) await migrateWorld_2_0_0()

  // 3.1.0 migration
  if (foundry.utils.isNewerVersion('3.1.0', currentVersion)) await migrateWorld_3_1_0()

  // 3.2.0 migration
  if (foundry.utils.isNewerVersion('3.2.0', currentVersion)) await migrateWorld_3_2_0()

  // 4.1.0 migration
  if (foundry.utils.isNewerVersion('4.1.0', currentVersion)) await migrateWorld_4_1_0()

  // Migration completed
  return game.settings.set('demonlord', 'systemMigrationVersion', game.system.version)
}

/* -------------------------------------------- */
/*  4.1.0                                       */
/* -------------------------------------------- */
export const migrateWorld_4_1_0 = async () => {
  const dryRun = false
  let errorsInMigration = false

  /**
   * Move from single type of extra damage an 20 plus damage to granular options:
   * 
   * system.bonuses.attack.damage -> system.bonuses.attack.damage.all
   * system.bonuses.attack.plus20Damage -> system.bonuses.attack.plus20Damage.all
   */
  _migrationStartInfo()

  const itemEffects = []
  const actorEffects = []
  const actorItemEffects = []
  const compendiaItemEffects = []
  const compendiaActorEffects = []
  const compendiaActorItemEffects = []

  async function updateEffect(e) {
    const matchingChanges = e.changes.filter(c => ['system.bonuses.attack.damage', 'system.bonuses.attack.plus20Damage'].includes(c.key))

    if (!matchingChanges.length) return null

    const changes = matchingChanges.map(c => {
      c.key = c.key.replace('system.bonuses.attack.damage', 'system.bonuses.attack.damage.all').replace('system.bonuses.attack.plus20Damage', 'system.bonuses.attack.plus20Damage.all')
      return c
    })

    if (!changes?.length) return null

    const update = {
      _id: e._id,
      changes: changes
    }

    if (dryRun) {
      console.log("Dry Migration: ", update)
    } else { 
      console.log('Migrating active effects of', e.parent)
      return e.update(update)
    }
  }

  // Non-embedded items
  try {
    for (let item of game.items.values()) {
      itemEffects.push(item.effects.map(updateEffect).filter(Boolean))
    }
    itemEffects.flat(Infinity).filter(Boolean)
  } catch (e) {
    errorsInMigration = true
    console.log('Error migrating active effects in items', e)
  }

  // Actors and embedded items)
  try {
    for (let actor of game.actors.values()) {
      for (const item of actor.getEmbeddedCollection('Item')) {
        actorItemEffects.push(item.effects.map(updateEffect).filter(Boolean))
      }

      actorEffects.push(actor.getEmbeddedCollection('ActiveEffect').map(updateEffect).filter(Boolean))
    }

    actorItemEffects.flat(Infinity).filter(Boolean)
    actorEffects.flat(Infinity).filter(Boolean)
  } catch (e) {
    errorsInMigration = true
    console.log('Error migrating active effects in actors and embedded items', e)
  }

  // Items in compendia
  try {
    for await (const compendium of game.packs.filter(p => !p.locked && p.metadata.type === 'Item')) {
      for await (const itemEntry of compendium.index.values()) {
        const item = await compendium.getDocument(itemEntry._id)
        compendiaItemEffects.push(item.effects.map(updateEffect).filter(Boolean))
      }
    }

    compendiaItemEffects.flat(Infinity).filter(Boolean)
  } catch (e) {
    errorsInMigration = true
    console.log('Error migrating active effects in items in compendia', e)
  }

  // Actors and embedded items in compendia
  try {
    for await (const compendium of game.packs.filter(p => !p.locked && p.metadata.type === 'Actor')) {
      for await (const actorEntry of compendium.index.values()) {
        const actor = await compendium.getDocument(actorEntry._id)

        for (const item of actor.getEmbeddedCollection('Item')) {
          compendiaActorItemEffects.push(item.effects.map(updateEffect).filter(Boolean))
        }

        compendiaActorEffects.push(actor.effects.map(updateEffect).filter(Boolean))
      }
    } 

    compendiaActorEffects.flat(Infinity).filter(Boolean)
    compendiaActorItemEffects.flat(Infinity).filter(Boolean)
  } catch (e) {
    errorsInMigration = true
    console.log('Error migrating active effects in actors and embedded items in compendia', e)
  }

  await Promise.allSettled([
    Promise.all(itemEffects)
    .then(_ => {
      console.log('Migration of active effects in items completed')
    })
    .catch(e => {
      console.log('Error migrating active effects in items', e)
    }),
    Promise.all(actorItemEffects)
    .then(_ => {
      console.log('Migration of active effects in embedded items completed')
    })
    .catch(e => {
      console.log('Error migrating active effects in embedded items', e)
    }),
    Promise.all(actorEffects)
    .then(_ => {
      console.log('Migration of active effects in actors completed')
    })
    .catch(e => {
      console.log('Error migrating active effects in actors', e)
    }),
    Promise.all(compendiaItemEffects)
    .then(_ => {
      console.log('Migration of active effects in items in compendia completed')
    })
    .catch(e => {
      console.log('Error migrating active effects in items in compendia', e)
    }),
    Promise.all(compendiaActorEffects)
    .then(_ => {
      console.log('Migration of active effects in actors in compendia completed')
    })
    .catch(e => {
      console.log('Error migrating active effects in actors in compendia', e)
    }),
    Promise.all(compendiaActorItemEffects)
    .then(_ => {
      console.log('Migration of active effects in embedded items in compendia completed')
    })
    .catch(e => {
      console.log('Error migrating active effects in embedded items in compendia', e)
    })
  ])

  if (!errorsInMigration) _migrationSuccessInfo()
  else _migrationErrorInfo()
}

/* -------------------------------------------- */
/*  3.2.0                                       */
/* -------------------------------------------- */
export const migrateWorld_3_2_0 = async () => {
  const dryRun = false
  let errorsInMigration = false

  /**
   * Combine and standardise talents' system.vs with spells' system.action as follows:
   * (the direction of the arrow indicates direction of transformation, e.g. A => B means A becomes B)
   * 
   * vs.attribute 	 	 => action.attack
   * vs.against 	 		 => action.against
   * vs.boonsbanes 	 	 => action.boonsbanes
   * vs.damage 	 		   => action.damage
   * vs.damagetype 	 	 => action.damagetype
   * vs.damagetypes  	 => action.damagetypes
   * vs.plus20damage 	 => action.plus20damage
   * 
   * action.defense 	 ==
   * defenseboonsbanes <= action.defenseboonsbanes
   * 
   * healing.healing 	 ==
   * 
   * Additionally, rename the following existing talent properties:
   * 
   * system.action.boonsbanes => system.action.extraboonsbanes
   * system.action.damage => system.action.extradamage
   * system.action.plus20damage => system.action.extraplus20damage
   */
  _migrationStartInfo()

  // Non-embedded items
  const itemUpdates = []

  try {
    for await (let item of game.items.values()) {
      console.log('Migrating item', item)
      if (item.type === 'talent') {
        itemUpdates.push({
          _id: item._id,
          system: {
            action: {
              extraboonsbanes: item.system.action.boonsbanes,
              extradamage: item.system.action.damage,
              extraplus20damage: item.system.action.plus20damage,
              attack: item.system.vs.attribute,
              against: item.system.vs.against,
              boonsbanes: item.system.vs.boonsbanes,
              damage: item.system.vs.damage,
              damagetype: item.system.vs.damagetype,
              damagetypes: item.system.vs.damagetypes,
              plus20damage: item.system.vs.plus20damage,
            },
            vs: undefined
          }
        })
      } else if (item.type === 'spell') {
        itemUpdates.push({
          _id: item._id,
          system: {
            action: {
              defenseboonsbanes: item.system.defenseboonsbanes
            },
            defenseboonsbanes: undefined
          }
        })
      }
    }
    if (itemUpdates.length > 0) {
      if (dryRun) {
        console.log("Dry Migration: ", itemUpdates)
      } else {
        await Item.updateDocuments(itemUpdates)
      }
    }
  } catch (e) {
    errorsInMigration = true
    console.log('Error migrating items', e)
  }

  // Embedded items in actors
  try {
    for await (let actor of game.actors.values()) {
      const embeddedUpdateData = []
      for await (const item of actor.getEmbeddedCollection('Item')) {
        console.log('Migrating item', item)
        if (item.type === 'talent') {
          embeddedUpdateData.push({
            _id: item._id,
            system: {
              action: {
                extraboonsbanes: item.system.action.boonsbanes,
                extradamage: item.system.action.damage,
                extraplus20damage: item.system.action.plus20damage,
                attack: item.system.vs.attribute,
                against: item.system.vs.against,
                boonsbanes: item.system.vs.boonsbanes,
                damage: item.system.vs.damage,
                damagetype: item.system.vs.damagetype,
                damagetypes: item.system.vs.damagetypes,
                plus20damage: item.system.vs.plus20damage,
              },
              vs: undefined
            }
          })
        } else if (item.type === 'spell') {
          embeddedUpdateData.push({
            _id: item._id,
            system: {
              action: {
                defenseboonsbanes: item.system.defenseboonsbanes
              },
              defenseboonsbanes: undefined
            }
          })
        }
      }

      if (embeddedUpdateData.length > 0) {
        if (dryRun) {
          console.log("Dry Migration: ", embeddedUpdateData)
        } else {
          try {
            const u = await actor.updateEmbeddedDocuments('Item', embeddedUpdateData, { noEmbedEffects: true })
            console.log('Embedded item migration complete with result', u)
          } catch (e) {
            errorsInMigration = true
            console.log('Error migrating embedded items in actor', actor, e)
          }
        }
      }
    }
  } catch (e) {
    errorsInMigration = true
    console.log('Error migrating actors', e)
  }

  // Items in compendia
  for await (const compendium of game.packs.filter(p => !p.locked && p.metadata.type === 'Item')) {
    const compendiumUpdates = []
    for await (const itemEntry of compendium.index.values()) {
      if (itemEntry.type === 'talent') {
        const item = await compendium.getDocument(itemEntry._id)
        compendiumUpdates.push({
          _id: item._id,
          system: {
            action: {
              extraboonsbanes: item.system.action.boonsbanes,
              extradamage: item.system.action.damage,
              extraplus20damage: item.system.action.plus20damage,
              attack: item.system.vs.attribute,
              against: item.system.vs.against,
              boonsbanes: item.system.vs.boonsbanes,
              damage: item.system.vs.damage,
              damagetype: item.system.vs.damagetype,
              damagetypes: item.system.vs.damagetypes,
              plus20damage: item.system.vs.plus20damage,
            },
            vs: undefined
          }
        })
      } else if (itemEntry.type === 'spell') {
        const item = await compendium.getDocument(itemEntry._id)
        compendiumUpdates.push({
          _id: item._id,
          system: {
            action: {
              defenseboonsbanes: item.system.defenseboonsbanes
            },
            defenseboonsbanes: undefined
          }
        })
      }
    }

    if (compendiumUpdates.length > 0) {
      if (dryRun) {
        console.log("Dry Migration: ", compendiumUpdates)
      } else {
        try {
          await Item.updateDocuments(compendiumUpdates, { pack: compendium.metadata.id })
        } catch (e) {
          errorsInMigration = true
          console.log('Error migrating items in compendia', e)
        }
      }
    }
  }

  // Embedded items in actors in compendia
  for await (const compendium of game.packs.filter(p => !p.locked && p.metadata.type === 'Actor')) {
    for await (const actorEntry of compendium.index.values()) {
      const embeddedUpdateData = []
      const actor = await compendium.getDocument(actorEntry._id)
      for await (const item of actor.getEmbeddedCollection('Item')) {
        console.log('Migrating item', item)
        if (item.type === 'talent') {
          embeddedUpdateData.push({
            _id: item._id,
            system: {
              action: {
                extraboonsbanes: item.system.action.boonsbanes,
                extradamage: item.system.action.damage,
                extraplus20damage: item.system.action.plus20damage,
                attack: item.system.vs.attribute,
                against: item.system.vs.against,
                boonsbanes: item.system.vs.boonsbanes,
                damage: item.system.vs.damage,
                damagetype: item.system.vs.damagetype,
                damagetypes: item.system.vs.damagetypes,
                plus20damage: item.system.vs.plus20damage,
              },
              vs: undefined
            }
          })
        } else if (item.type === 'spell') {
          embeddedUpdateData.push({
            _id: item._id,
            system: {
              action: {
                defenseboonsbanes: item.system.defenseboonsbanes
              },
              defenseboonsbanes: undefined
            }
          })
        }

        if (embeddedUpdateData.length > 0) {
          if (dryRun) {
            console.log("Dry Migration: ", embeddedUpdateData)
          } else {
            try {
              const u = await actor.updateEmbeddedDocuments('Item', embeddedUpdateData, { pack: compendium.metadata.id, noEmbedEffects: true })
              console.log('Embedded item migration complete with result', u)
            } catch (e) {
              errorsInMigration = true
              console.log('Error migrating embedded items in actor', actor, e)
            }
          }
        }
      }
    }
  }

  if (!errorsInMigration) _migrationSuccessInfo()
  else _migrationErrorInfo()
}

/* -------------------------------------------- */
/*  3.1.0                                       */
/* -------------------------------------------- */

export const migrateWorld_3_1_0 = async () => {
  const dryRun = false
  let errorsInMigration = false

  // Migrate from strengthmin to { requirement: { attribute: "Strength", minvalue: 10 } }
  // Migrate from corruption to { corruption: { value: 0, immune: false }}
  _migrationStartInfo()

  // Non-embedded items
  const itemUpdates = []

  try {
    for await (let item of game.items.values()) {
      console.log('Migrating item', item)
      if (item.system.strengthmin) {
        itemUpdates.push({ _id: item._id, system: { requirement: { attribute: 'Strength', minvalue: item.system.strengthmin } } })
      }
    }
    if (itemUpdates.length > 0) {
      if (dryRun) {
        console.log("Dry Migration: ", itemUpdates)
      } else {
        await Item.updateDocuments(itemUpdates)
      }
    }
  } catch (e) {
    errorsInMigration = true
    console.log('Error migrating items', e)
  }

  // Embedded items
  try {
    for await (let actor of game.actors.values()) {
      const embeddedUpdateData = []
      for await (const item of actor.getEmbeddedCollection('Item')) {
        console.log('Migrating item', item)
        if (item.system.strengthmin) {
          embeddedUpdateData.push({ _id: item._id, system: { requirement: { attribute: 'Strength', minvalue: item.system.strengthmin } } })
        }
      }

      if (embeddedUpdateData.length > 0) {
        if (dryRun) {
          console.log("Dry Migration: ", embeddedUpdateData)
        } else {
          try {
            const u = await actor.updateEmbeddedDocuments('Item', embeddedUpdateData, { noEmbedEffects: true })
            console.log('Embedded item migration complete with result', u)
          } catch (e) {
            errorsInMigration = true
            console.log('Error migrating embedded items in actor', actor, e)
          }
        }
      }
    }
  } catch (e) {
    errorsInMigration = true
    console.log('Error migrating actors', e)
  }

  // Go through all items in compendia and check for strengthmin
  for await (const compendium of game.packs.filter(p => !p.locked && p.metadata.type === 'Item')) {
    await compendium.getIndex({ fields: ['system.strengthmin'] })
    const compendiumUpdates = []
    for await (const item of compendium.index.values()) {
      if (item.system?.strengthmin) {
        compendiumUpdates.push({ _id: item._id, system: { requirement: { attribute: 'Strength', minvalue: item.system.strengthmin } } })
      }
    }

    if (compendiumUpdates.length > 0) {
      if (dryRun) {
        console.log("Dry Migration: ", compendiumUpdates)
      } else {
        try {
          await Item.updateDocuments(compendiumUpdates, { pack: compendium.metadata.id })
        } catch (e) {
          errorsInMigration = true
          console.log('Error migrating items in compendia', e)
        }
      }
    }
  }

  // Convert corruption: 0 to corruption: { value: 0, immune: false }
  const actorUpdates = []
  try {
    for await (const actor of game.actors.values()) {
      if (isNumeric(actor.system.characteristics.corruption)) {
        // Need to convert
        const corruptionValue = actor.system.characteristics.corruption ?? 0
        actorUpdates.push({ _id: actor._id, system: { characteristics: { corruption: { value: corruptionValue, immune: false } } } })
      }

      const embeddedUpdateData = []
      for await (const item of actor.getEmbeddedCollection('Item')) {
        console.log('Migrating item', item)
        if (item.system.strengthmin) {
          embeddedUpdateData.push({ _id: item._id, system: { requirement: { attribute: 'Strength', minvalue: item.system.strengthmin } } })
        }
      }

      if (embeddedUpdateData.length > 0) {
        if (dryRun) {
          console.log("Dry Migration: ", embeddedUpdateData)
        } else {
          try {
            const u = await actor.updateEmbeddedDocuments('Item', embeddedUpdateData, { noEmbedEffects: true })
            console.log('Embedded item migration complete with result', u)
          } catch (e) {
            errorsInMigration = true
            console.log('Error migrating items in actor', actor, e)
          }
        }
      }
    }

    if (actorUpdates.length > 0) {
      if (dryRun) {
        console.log("Dry Migration: ", actorUpdates)
      } else {
        await Actor.updateDocuments(actorUpdates)
      }
    }
  } catch (e) {
    errorsInMigration = true
    console.log('Error migrating actors', e)
  }

  try {
    for await (const compendium of game.packs.filter(p => !p.locked && p.metadata.type === 'Actor')) {
      await compendium.getIndex({ fields: ['system.characteristics.corruption'] })
      const compendiumUpdates = []
      for await (const actorIndexEntry of compendium.index.values()) {
        if (!isNumeric(actorIndexEntry.system.characteristics.corruption)) continue // Already converted
        const actor = await compendium.getDocument(actorIndexEntry._id)

        // Convert corruption
        const corruptionValue = actor.system.characteristics.corruption ?? 0
        compendiumUpdates.push({ _id: actor._id, system: { characteristics: { corruption: { value: corruptionValue, immune: false } } } })

        // While we're at it, update items if strengthmin is present
        const embeddedUpdateData = []
        for await (const item of actor.getEmbeddedCollection('Item')) {
          console.log('Migrating item', item)
          if (item.system.strengthmin) {
            embeddedUpdateData.push({ _id: item._id, system: { requirement: { attribute: 'Strength', minvalue: item.system.strengthmin } } })
          }
        }

        if (embeddedUpdateData.length > 0) {
          if (dryRun) {
            console.log("Dry Migration: ", embeddedUpdateData)
          } else {
            try {
              const u = await actor.updateEmbeddedDocuments('Item', embeddedUpdateData, { noEmbedEffects: true })
              console.log('Embedded item migration complete with result', u)
            } catch (e) {
              errorsInMigration = true
              console.log('Error migrating items in actor', actor, e)
            }
          }
        }

      }

      if (compendiumUpdates.length > 0) {
        await Actor.updateDocuments(compendiumUpdates, { pack: compendium.metadata.id })
      }
    }
  } catch (e) {
    errorsInMigration = true
    console.log('Error migrating actors', e)
  }

  if (!errorsInMigration) _migrationSuccessInfo()
  else _migrationErrorInfo()
}

/* -------------------------------------------- */
/*  2.0.0                                       */
/* -------------------------------------------- */

export const migrateWorld_2_0_0 = async () => {
  let errorsInMigration = false
  let migrateNewIcons = false
  let d = Dialog.confirm({
    title: 'Default icons',
    content:
      'Do you want to migrate current default item icons to the new ones?\nThe new icons will be set only for items that have the "mystery-man" icon.',
    yes: () => (migrateNewIcons = true),
    no: () => (migrateNewIcons = false),
    defaultYes: true,
  })
  await d

  _migrationStartInfo()
  // Migrate not embedded Items icons
  for await (let item of game.items.values()) {
    try {
      console.log('Migrating item', item)
      const newIcon = _getNewImgPath(item.img, migrateNewIcons, item)
      if (newIcon) await item.update({ name: item.name || '', img: newIcon })
    } catch (e) {
      errorsInMigration = true
      console.log('Error migrating item', item, e)
    }
  }

  // Migrate actors
  for await (let actor of game.actors.values()) {
    try {
      const actUpd = actor.data.toObject()
      // Migrate actor icon and religion
      console.log('Migrating actor', actor)
      const newActorIcon = _getNewImgPath(actor.img)
      const newReligionIcon = _getNewImgPath(actor.system?.religion?.image)
      if (newActorIcon) actUpd.img = newActorIcon
      if (newReligionIcon) actUpd.data.religion.image = newReligionIcon

      // Reset character data and update the actor icons
      if (actUpd.type === 'character') _resetActorData(actUpd.data)
      delete actUpd.items
      delete actUpd.effects
      delete actUpd.token
      await actor.update(actUpd)

      // Change embedded items icons
      const embeddedUpdateData = []
      for (const embeddedItem of actor.items.values()) {
        const data = embeddedItem.data.toObject()
        const newItemIcon = _getNewImgPath(data.img, migrateNewIcons, data)
        if (newItemIcon) {
          console.log('Migrating embedded item', embeddedItem)
          data.img = newItemIcon
          data.name = data.name || ''
          embeddedUpdateData.push(data)
        }
      }
      if (embeddedUpdateData.length > 0) {
        const u = await actor.updateEmbeddedDocuments('Item', embeddedUpdateData, { noEmbedEffects: true })
        console.log('Embedded item migration complete with result', u)
      }
      // Embed the effects of the item into the actor
      await actor._handleOnUpdateEmbedded(actor.items)
    } catch (e) {
      errorsInMigration = true
      console.log('Error migrating actor', actor, e)
    }
  }

  if (!errorsInMigration) _migrationSuccessInfo()
  else _migrationErrorInfo()
}

const _getNewImgPath = (img, migrateDefault = false, item = undefined) => {
  if (img && img.includes('systems/demonlord/icons')) {
    img = img.replace('/demonlord/icons', '/demonlord/assets/icons')
    img = img.replace('.png', '.webp')
    return img
  } else if (migrateDefault && img === 'icons/svg/mystery-man.svg' && item) {
    img = CONFIG.DL.defaultItemIcons[item.type]
    if (item.type === 'path') {
      const pathType = item.data?.data?.type ?? item.data.type
      img = CONFIG.DL.defaultItemIcons.path[pathType] || CONFIG.DL.defaultItemIcons.path.novice
    }
    return img
  }
  return undefined
}

const _resetActorData = actData => {
  actData.attributes.strength.value = 10
  actData.attributes.agility.value = 10
  actData.attributes.intellect.value = 10
  actData.attributes.will.value = 10
  actData.attributes.perception.value = 10
  actData.characteristics.health.max = 0
  actData.characteristics.health.healingrate = 0
  actData.characteristics.defense = 0
  actData.characteristics.speed = 10
  actData.characteristics.power = 0
  actData.characteristics.insanity.max = 0
}

/* -------------------------------------------- */
/* 1.7.7                                        */
/* -------------------------------------------- */

/**
 * Perform a system migration for the entire World, applying migrations for Actors, Items, and Compendium packs
 * @return {Promise}      A Promise which resolves once the migration is completed
 */
export const migrateWorld_1_7_7 = async function () {
  _migrationStartInfo()

  // Migrate World Actors
  for await (const a of game.actors.entities) {
    try {
      const updateData = migrateActorData(a.data)
      if (!isObjectEmpty(updateData)) {
        console.log(`Migrating Actor entity ${a.name}`)
        await a.update(updateData, { enforceTypes: false })
      }
    } catch (err) {
      err.message = `Failed Demonlord system migration for Actor ${a.name}: ${err.message}`
      console.error(err)
    }
  }

  // Migrate World Items
  for await (const i of game.items.entities) {
    try {
      const updateData = migrateItemData(i.data)
      if (!isObjectEmpty(updateData)) {
        console.log(`Migrating Item entity ${i.name}`)
        await i.update(updateData, { enforceTypes: false })
      }
    } catch (err) {
      err.message = `Failed Demonlord system migration for Item ${i.name}: ${err.message}`
      console.error(err)
    }
  }
  _migrationSuccessInfo()
}

/* -------------------------------------------- */
/*  Entity Type Migration Helpers               */
/* -------------------------------------------- */

/**
 * Migrate a single Actor entity to incorporate latest data model changes
 * Return an Object of updateData to be applied
 * @param {Actor} actor   The actor to Update
 * @return {Object}       The updateData to apply
 */
export const migrateActorData = function (actor) {
  const updateData = {}

  const model = game.system.model.Actor[actor.type]
  actor.data = _nullToUndefined(actor.data, 5)
  updateData.data = foundry.utils.mergeObject(actor.data, model, {
    insertKeys: true,
    insertValues: true,
    overwrite: false,
    inplace: false,
    enforceTypes: false,
  })

  // Migrate Owned Items
  if (!actor.items) return updateData
  let hasItemUpdates = false
  const items = actor.items.map(i => {
    // Migrate the Owned Item
    const itemUpdate = migrateItemData(i)

    // Update the Owned Item
    if (!isObjectEmpty(itemUpdate)) {
      hasItemUpdates = true
      return foundry.utils.mergeObject(i, itemUpdate, { enforceTypes: false, inplace: false })
    } else return i
  })
  if (hasItemUpdates) updateData.items = items
  return updateData
}

/**
 * Migrate a single Item entity to incorporate latest data model changes
 * @param item
 */
export const migrateItemData = function (item) {
  const updateData = {}
  const itemTypes = ['path', 'ancestry', 'talent']

  if (itemTypes.includes(item.type)) {
    // Pass
  }

  if (!isObjectEmpty(updateData)) {
    updateData.id = item.id
  }

  return updateData
}

/**
 * Converts all properties with value null to value undefined,
 * in order to let the foundry.utils.mergeObject function replace these values.
 * @private
 */

function _nullToUndefined(data, recDepth) {
  Object.entries(data).forEach(ele => {
    if (ele[1] === null) {
      data[ele[0]] = undefined
    } else if (recDepth > 0 && toString.call(ele[1]) === '[object Object]' && Object.keys(ele[1]).length > 0) {
      data[ele[0]] = _nullToUndefined(ele[1], recDepth - 1)
    }
  })
  return data
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n)
}

/* -------------------------------------------- */

const _migrationStartInfo = () =>
  ui.notifications.info(
    `Applying Demonlord System Migration for version ${game.system.version}. Please be patient and do not close your game or shut down your server.`,
    { permanent: true },
  )

const _migrationSuccessInfo = () =>
  ui.notifications.info(`Demonlord System Migration to version ${game.system.version} completed!`, {
    permanent: true,
  })

const _migrationErrorInfo = () =>
  ui.notifications.error(`Demonlord System Migration to version ${game.system.version} error`, {
    permanent: true,
  })
