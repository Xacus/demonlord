/**
 * Perform a system migration for the entire World, applying migrations for Actors, Items, and Compendium packs
 * @return {Promise}      A Promise which resolves once the migration is completed
 */
export const migrateWorld = async function () {
  ui.notifications.info(
    `Applying Demonlord System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`,
    { permanent: true }
  )

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

  // Set the migration as complete
  game.settings.set(
    'demonlord',
    'systemMigrationVersion',
    game.system.data.version
  )

  ui.notifications.info(
    `Demonlord System Migration to version ${game.system.data.version} completed!`,
    { permanent: true }
  )
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
    enforceTypes: false
  })

  // Migrate Owned Items
  if (!actor.items) return updateData
  let hasItemUpdates = false
  const items = actor.items.map((i) => {
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
  const itemTypes = ['weapon', 'talent', 'spell']

  if (itemTypes.includes(item.type)) {
    updateData['data.damagetypes'] = undefined

    if (item.type === 'talent') updateData['data.vs.damagetypes'] = undefined
  }

  if (!isObjectEmpty(updateData)) {
    updateData._id = item._id
  }

  return updateData
}

/**
 * Converts all properties with value null to value undefined,
 * in order to let the mergeObject function replace these values.
 * @private
 */

function _nullToUndefined (data, recDepth) {
  Object.entries(data).forEach((ele) => {
    if (ele[1] === null) {
      data[ele[0]] = undefined
    } else if (
      recDepth > 0 &&
      toString.call(ele[1]) == '[object Object]' &&
      Object.keys(ele[1]).length > 0
    ) {
      data[ele[0]] = _nullToUndefined(ele[1], recDepth - 1)
    }
  })
  return data
}
