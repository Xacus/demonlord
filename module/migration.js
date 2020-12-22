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
  const itemTypes = ['path', 'ancestry', 'talent']

  if (itemTypes.includes(item.type)) {
    if (item.type === 'ancestry') {
      if (!item.data.languagelist) updateData['data.languagelist'] = []
      if (item.data.talents) {
        const newTalents = []
        for (const talent of item.data.talents) {
          const getItem = game.items.get(talent.id)
          if (getItem != null) {
            talent.description = getItem.data.data.description
          }

          newTalents.push(talent)
        }

        updateData['data.talents'] = newTalents
      }

      if (item.data.level4.talent) {
        const newTalents = []
        for (const talent of item.data.level4.talent) {
          const getItem = game.items.get(talent.id)
          if (getItem != null) {
            talent.description = getItem.data.data.description
          }

          newTalents.push(talent)
        }

        updateData['data.level4.talent'] = newTalents
      }
    }

    if (item.type === 'path') {
      const newLevels = []
      for (const level of item.data.levels) {
        level.languages = []

        if (level.talents) {
          for (const talent of level.talents) {
            const getItem = game.items.get(talent.id)
            if (getItem != null) {
              talent.description = getItem.data.data.description
            }
          }
        } else level.talents = []

        if (level.talentspick) {
          for (const talent of level.talentspick) {
            const getItem = game.items.get(talent.id)
            if (getItem != null) {
              talent.description = getItem.data.data.description
            }
          }
        } else level.talentspick = []

        if (level.spells) {
          for (const spell of level.spells) {
            const getItem = game.items.get(spell.id)
            if (getItem != null) {
              spell.description = getItem.data.data.description
            }
          }
        } else level.spells = []

        newLevels.push(level)
      }

      updateData['data.levels'] = newLevels
    }

    if (item.type === 'talent') {
      if (item.data.action.boonsbanes) {
        updateData['data.action.strengthboonsbanesselect'] = true
        updateData['data.action.agilityboonsbanesselect'] = true
      }

      switch (item.data.challenge.boonsbanesselect) {
        case 'all':
          updateData['data.challenge.strengthboonsbanesselect'] = true
          updateData['data.challenge.agilityboonsbanesselect'] = true
          updateData['data.challenge.intellectboonsbanesselect'] = true
          updateData['data.challenge.willboonsbanesselect'] = true
          updateData['data.challenge.perceptionboonsbanesselect'] = true
          break

        case 'strength':
          updateData['data.challenge.strengthboonsbanesselect'] = true
          break

        case 'agility':
          updateData['data.challenge.agilityboonsbanesselect'] = true
          break

        case 'intellect':
          updateData['data.challenge.intellectboonsbanesselect'] = true
          break

        case 'will':
          updateData['data.challenge.willboonsbanesselect'] = true
          break

        case 'perception':
          updateData['data.challenge.perceptionboonsbanesselect'] = true
          break

        default:
          break
      }
    }
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
