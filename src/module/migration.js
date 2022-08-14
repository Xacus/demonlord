export async function handleMigrations() {
  // Determine whether a system migration is required and feasible
  if (!game.user.isGM) return
  const currentVersion = game.settings.get('demonlord', 'systemMigrationVersion')
  if (!currentVersion) {
    // If no version is saved, no need to migrate
    return game.settings.set('demonlord', 'systemMigrationVersion', game.system.data.version)
  }

  // Compatibility warning
  const COMPATIBLE_MIGRATION_VERSION = 0.8
  if (currentVersion && isNewerVersion(COMPATIBLE_MIGRATION_VERSION, currentVersion) && !game.data.release?.generation) {
    const warning =
      'Your Demonlord system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.'
    ui.notifications.error(warning, { permanent: true })
  }

  // 1.7.7 migration
  if (isNewerVersion('1.7.7', currentVersion) && !game.data.release?.generation) await migrateWorld_1_7_7()

  // 2.0.0 migration
  if (isNewerVersion('2.0.0', currentVersion) && !game.data.release?.generation) await migrateWorld_2_0_0()

  // Migration completed
  return game.settings.set('demonlord', 'systemMigrationVersion', game.system.data.version)
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
  for (let item of game.items.values()) {
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
  for (let actor of game.actors.values()) {
    try {
      const actUpd = actor.data.toObject()
      // Migrate actor icon and religion
      console.log('Migrating actor', actor)
      const newActorIcon = _getNewImgPath(actor.img)
      const newReligionIcon = _getNewImgPath(actor.data.data?.religion?.image)
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
  for (const a of game.actors.entities) {
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
  for (const i of game.items.entities) {
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
  updateData.data = mergeObject(actor.data, model, {
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
      return mergeObject(i, itemUpdate, { enforceTypes: false, inplace: false })
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
 * in order to let the mergeObject function replace these values.
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

/* -------------------------------------------- */

const _migrationStartInfo = () =>
  ui.notifications.info(
    `Applying Demonlord System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`,
    { permanent: true },
  )

const _migrationSuccessInfo = () =>
  ui.notifications.info(`Demonlord System Migration to version ${game.system.data.version} completed!`, {
    permanent: true,
  })

const _migrationErrorInfo = () =>
  ui.notifications.error(`Demonlord System Migration to version ${game.system.data.version} error`, {
    permanent: true,
  })
