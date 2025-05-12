import {capitalize} from '../utils/utils'

/* -------------------------------------------- */
/*  Class Models                                */

/* -------------------------------------------- */

export class PathLevel {
  constructor(obj) {
    if (obj === undefined) obj = {}
    if (typeof obj === 'string') obj = JSON.parse(obj)

    const locAtt = s => game.i18n.localize('DL.Attribute' + capitalize(s))

    this.level = obj.level || 1
    this.attributeSelect = obj.attributeSelect || ''
    this.attributeSelectIsChooseTwo = obj.attributeSelectIsChooseTwo || obj.attributeSelect === 'choosetwo' || false
    this.attributeSelectIsChooseThree = obj.attributeSelectIsChooseThree || obj.attributeSelect === 'choosethree' || false
    this.attributeSelectIsFixed = obj.attributeSelectIsFixed || obj.attributeSelect === 'fixed' || false
    this.attributeSelectIsTwoSet = obj.attributeSelectIsTwoSet || obj.attributeSelect === 'twosets' || false

    this.attributeSelectTwoSet1 = obj.attributeSelectTwoSet1 || ''
    this.attributeSelectTwoSet2 = obj.attributeSelectTwoSet2 || ''
    this.attributeSelectTwoSet3 = obj.attributeSelectTwoSet3 || ''
    this.attributeSelectTwoSet4 = obj.attributeSelectTwoSet4 || ''

    this.attributeSelectTwoSet1Label = obj.attributeSelectTwoSet1Label || locAtt(this.attributeSelectTwoSet1) || ''
    this.attributeSelectTwoSet2Label = obj.attributeSelectTwoSet2Label || locAtt(this.attributeSelectTwoSet2) || ''
    this.attributeSelectTwoSet3Label = obj.attributeSelectTwoSet3Label || locAtt(this.attributeSelectTwoSet3) || ''
    this.attributeSelectTwoSet4Label = obj.attributeSelectTwoSet4Label || locAtt(this.attributeSelectTwoSet4) || ''

    this.attributeSelectTwoSetValue1 = +obj.attributeSelectTwoSetValue1 || 0
    this.attributeSelectTwoSetValue2 = +obj.attributeSelectTwoSetValue2 || 0
    this.attributeSelectTwoSetSelectedValue1 = +obj.attributeSelectTwoSetSelectedValue1 || true
    this.attributeSelectTwoSetSelectedValue2 = +obj.attributeSelectTwoSetSelectedValue2 || true

    this.attributes = {
      strength: {
        value: +obj.attributes?.strength?.value || 0,
        formula: obj.attributes?.strength?.formula || '',
        immune: obj.attributes?.strength?.immune || false,
        selected: +obj.attributes?.strength?.selected || false,
      },
      agility: {
        value: +obj.attributes?.agility?.value || 0,
        formula: obj.attributes?.agility?.formula || '',
        immune: obj.attributes?.agility?.immune || false,
        selected: +obj.attributes?.agility?.selected || false,
      },
      intellect: {
        value: +obj.attributes?.intellect?.value || 0,
        formula: obj.attributes?.intellect?.formula || '',
        immune: obj.attributes?.intellect?.immune || false,
        selected: +obj.attributes?.intellect?.selected || false,
      },
      will: {
        value: +obj.attributes?.will?.value || 0,
        formula: obj.attributes?.will?.formula || '',
        immune: obj.attributes?.will?.immune || false,
        selected: +obj.attributes?.will?.selected || false,
      }
    }

    this.characteristics = {
      health: +obj.characteristics?.health || 0,
      healingRate: +obj.characteristics?.healingRate || 0,
      size: obj.characteristics?.size || '1',
      defense: +obj.characteristics?.defense || 0,
      perception: +obj.characteristics?.perception || 0,
      speed: +obj.characteristics?.speed || 0,
      power: +obj.characteristics?.power || 0,
      insanity: {
        value: +obj.characteristics?.insanity?.value || 0,
        formula: obj.characteristics?.insanity?.formula || '',
        immune: obj.characteristics?.insanity?.immune || false,
      },
      corruption: {
        value: +obj.characteristics?.corruption?.value || 0,
        formula: obj.characteristics?.corruption?.formula || '',
        immune: obj.characteristics?.corruption?.immune || false,
      }
    }

    this.languagesText = obj.languagesText || ''
    this.equipmentText = obj.equipmentText || ''
    this.magicText = obj.magicText || ''
    this.optionsText = obj.optionsText || ''

    this.talentsSelect = obj.talentsSelect || ''
    this.talentsChooseOne = obj.talentsChooseOne || false
    this.talentsSelected = obj.talentsSelected || []
    this.talents = obj.talents || []
    this.spells = obj.spells || []
    this.talentspick = obj.talents || []
    this.languages = obj.languages || []
  }
}

Handlebars.registerHelper('hasCharacteristics', level => {
  return (
    level.characteristics.perception ||
    level.characteristics.defense ||
    level.characteristics.power ||
    level.characteristics.speed ||
    level.characteristics.health ||
    (level.characteristics.corruption.value || level.characteristics.corruption.formula) ||
    (level.characteristics.insanity.value || level.characteristics.insanity.formula)
  )
})

export class PathLevelItem {
  constructor(obj) {
    if (obj === undefined) obj = {}
    if (typeof obj === 'string') obj = JSON.parse(obj)

    this.id = obj.id || ''
    this.name = obj.name || ''
    this.description = obj.description || ''
    this.pack = obj.pack || ''
    this.selected = Boolean(obj.selected) || false
    this.img = obj.img
  }
}

export class DamageType {
  constructor(obj) {
    if (obj === undefined) obj = {}
    if (typeof obj === 'string') obj = JSON.parse(obj)

    this.damage = obj.damage || ''
    this.damagetype = obj.damagetype || ''
  }
}

/* -------------------------------------------- */
/*  Transfer functions                          */

/* -------------------------------------------- */

export async function getNestedDocument(nestedData) {
  let entity
  let method // <- Used to print how the item was fetched
  const id = nestedData.id ?? nestedData._id ?? nestedData?.data?._id

  // First, try using the uuid
  if (nestedData.uuid) {
    entity = await fromUuid(nestedData.uuid)
    method = 'UUID'
  }

  // Look into packs, then into the game items by ID
  if (!entity?.sheet) {
    if (nestedData.pack) {
      const pack = game.packs.get(nestedData.pack)
      if (pack.documentName !== 'Item') return
      entity = await pack.getDocument(id)
      method = 'PACK'
    } else if (id) {
      entity = game.items.get(id)
      method = 'ITEMS'
    }
  }

  // -- Fallbacks
  // Look for talents with same name inside items
  if (!entity?.sheet) {
    entity = game.items.find(i => i.name === nestedData.name)
    method = entity ? 'FB-ITEMS' : method
  }
  // Look for talents with same id or name inside ALL packs
  if (!entity?.sheet) {
    // First id
    let pack = game.packs.find(p => p.index.find(i => i._id === id))
    entity = await pack?.getDocument(id)

    // Then name
    if (!entity?.sheet) {
      pack = game.packs.find(p => p.index.find(i => i.name.toLowerCase() === nestedData.name.toLowerCase()))
      entity = await pack?.getDocument(pack.index.find(i => i.name.toLowerCase() === nestedData.name.toLowerCase())?._id)
    }
    method = entity ? 'FB-PACKS' : method
  }

  // Item is not in the game, just return the embedded data
  if (!entity?.sheet) {
    entity = nestedData
    method = 'DATA-OBJ'
  }

  if (!entity) {
    console.error('DEMONLORD | Nested object not found', nestedData)
    return null
  }
  console.log(`DEMONLORD | Nested object fetched using ${method}`)
  return entity
}

export async function getNestedItemData(nestedData) {
  const entity = await getNestedDocument(nestedData)

  // Get the item data OBJECT. If the item is not an item, then it has been retreived using the data saved in the nested
  let itemData = undefined
  if (entity instanceof Item) {
    itemData = entity.toObject() 
    // Add some things that may come useful later
    itemData.uuid = itemData.uuid ?? nestedData.uuid
    itemData._id = itemData._id ?? nestedData._id
  } else {
    // Here we have an entity which is fetched using fallback methods, so we must construct it properly to v10 specs
    const ed = entity.system ?? entity.data ?? entity
    const sys = entity.system ?? ed.system ?? ed
    itemData = {
      uuid: entity.uuid || ed.uuid || nestedData.uuid,
      _id: entity._id || ed._id,
      type: entity.type || ed.type,
      name: entity.name || ed.name,
      img: entity.img || ed.img,
      description: entity.description || sys.description,
      pack: entity.pack,
      system: sys || ed,
    }
  }

  // Remember user selection & enrich description
  itemData.selected = nestedData.selected
  itemData.system.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(itemData?.system?.description, {
  aync: true})

  itemData.system.enrichedDescriptionUnrolled = await foundry.applications.ux.TextEditor.implementation.enrichHTML(itemData?.system?.description, { unrolled: true })

  // Keep the quantity previously stored, if any
  itemData.system.quantity = nestedData?.system?.quantity ?? itemData.system.quantity
  
  // Return only the data
  // Warning: here the implicit assertion is that entity is an Item and not an Actor or something else
  return itemData
}

export async function getNestedItemsDataList(nestedDataList) {
  const p = []
  await Promise.all(nestedDataList.map(async nd => {
    p.push(await getNestedItemData(nd))
  }))
  return p.filter(Boolean)
}

/* -------------------------------------------- */

function _getLevelItemsToTransfer(level) {
  let nestedItems = [...level.talents, ...level.languages]
  const selectedItems = [...level.spells, ...level.talentspick].filter(i => Boolean(i.selected))
  nestedItems = [...nestedItems, ...selectedItems]
  return nestedItems
}

export async function handleCreatePath(actor, pathItem) {
  const actorLevel = parseInt(actor.system.level)
  const pathData = pathItem.system
  const leqLevels = pathData.levels.filter(l => +l.level <= +actorLevel)

  // For each level that is <= actor level, add all talents and *selected* nested items
  for await (let level of leqLevels) {
    await createActorNestedItems(actor, _getLevelItemsToTransfer(level), pathItem.id, level.level)
  }
  return await Promise.resolve()
}

export async function handleCreateRole(actor, roleItem) {
  const roleData = roleItem.system

  await createActorNestedItems(actor, roleData.talents.concat(roleData.weapons, roleData.spells, roleData.specialActions, roleData.endOfRound), roleItem.id)
  return await Promise.resolve()
}

export async function handleCreateRelic(actor, relicItem) {
  const relicData = relicItem.system
  const talents = await Promise.all(relicData.contents.map(t => {
    return fromUuid(t.uuid)
  }))
  await createActorNestedItems(actor, talents, relicItem.id)
  return await Promise.resolve()
}

export async function handleLevelChange(actor, newLevel, curLevel = undefined) {
  curLevel = parseInt(curLevel ?? actor.system.level)
  newLevel = parseInt(newLevel)
  if (newLevel === curLevel) return
  const actorItems = actor.getEmbeddedCollection('Item')
  const paths = actorItems.filter(i => i.type === 'path')
  const ancestry = actorItems.find(i => i.type === 'ancestry')

  // If the new level is greater than the old, add stuff
  if (newLevel > curLevel) {
    // Create relevant path levels' nested items
    for await (let path of paths) {
      await Promise.all(path.system.levels
        .filter(l => +l.level > curLevel && +l.level <= newLevel)
        .map(async level => await createActorNestedItems(actor, _getLevelItemsToTransfer(level), path.id, level.level)))
    }

    // Also ancestry levels' nested items
    if (ancestry) {
      await Promise.all(ancestry.system.levels
        .filter(l => +l.level > curLevel && +l.level <= newLevel)
        .map(async level => await createActorNestedItems(actor, _getLevelItemsToTransfer(level), ancestry.id, level.level)))
    }
  }
  // Otherwise delete items with levelRequired > newLevel
  else {
    const ids = actorItems.filter(i => i.flags?.demonlord?.levelRequired > newLevel).map(i => i.id)
    if (ids.length) await actor.deleteEmbeddedDocuments('Item', ids)
  }
  return await Promise.resolve()
}

/* -------------------------------------------- */

export async function handleCreateAncestry(actor, ancestryItem) {
  const actorLevel = parseInt(actor.system.level)
  const ancestryData = ancestryItem.system
  const leqLevels = ancestryData.levels.filter(l => +l.level <= +actorLevel)

  // For each level that is <= actor level, add all talents and *selected* nested items
  for await (let level of leqLevels) {
    await createActorNestedItems(actor, _getLevelItemsToTransfer(level), ancestryItem.id, level.level)
  }
  return await Promise.resolve()
}

/* -------------------------------------------- */

/**
 * Creates nested items inside an Actor, using a collection of ItemData.
 * @param actor Target DemonlordActor to contain the item
 * @param nestedItems Nested items list. Important, it doesn't contain ItemData, but the custom nestedItemData (PathLevelItem)
 * @param parentItemId ID of the parent of the nested item
 * @returns {Promise<Item>} The created item list
 */
export async function createActorNestedItems(actor, nestedItems, parentItemId, levelRequired = 0) {
  let itemDataList = await getNestedItemsDataList(nestedItems)
  // Set the flags
  itemDataList = itemDataList.map((itemData, i) => {
    if (!itemData.flags) itemData.flags = {}
    itemData.flags.demonlord = {
      nestedItemId: nestedItems[i]?._id ?? nestedItems[i]?.id,
      parentItemId: parentItemId,
      levelRequired: levelRequired
    }
    return itemData
  })

  return await actor.createEmbeddedDocuments('Item', itemDataList)
}


/**
 * Deletes nested items from an actor using one of two methods:
 * - By parentItemId lookup, deleting items which match the flag 'demonlord.parentItemId'
 * - By nestedItemId lookup, deleting items which match the flag 'demonlord.nestedItemId'
 * The first can be used to delete all items from a parent, for example when deleting an ancestry we want to delete all
 * of its nested items from the actor.
 * The latter is used to delete all items from a single nested item. For example when the user de-selects a choosable
 * talent inside an ancestry
 * @param actor
 * @param parentItemId
 * @param nestedItemId
 * @returns {Promise<void>}
 */
export async function deleteActorNestedItems(actor, parentItemId = undefined, nestedItemId = undefined) {
  const actorItems = actor.getEmbeddedCollection('Item')
  let ids = []
  if (parentItemId) {
    ids = actorItems.filter(i => i.flags?.demonlord?.parentItemId === parentItemId).map(i => i.id)
  } else if (nestedItemId) {
    ids = actorItems.filter(i => i.flags?.demonlord?.nestedItemId === nestedItemId).map(i => i.id)
  }
  if (ids.length) await actor.deleteEmbeddedDocuments('Item', ids)
}
