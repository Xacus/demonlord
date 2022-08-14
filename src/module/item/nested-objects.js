import { capitalize } from '../utils/utils'

/* -------------------------------------------- */
/*  Class Models                                */
/* -------------------------------------------- */

export class PathLevel {
  constructor(obj) {
    if (obj === undefined) obj = {}
    if (typeof obj === 'string') obj = JSON.parse(obj)

    const locAtt = s => game.i18n.localize('DL.Attribute' + capitalize(s))

    this.level = obj.level || 0
    this.attributeSelect = obj.attributeSelect || ''
    this.attributeSelectIsChooseTwo = obj.attributeSelectIsChooseTwo || obj.attributeSelect === 'choosetwo' || false
    this.attributeSelectIsChooseThree =
      obj.attributeSelectIsChooseThree || obj.attributeSelect === 'choosethree' || false
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

    this.attributeStrength = +obj.attributeStrength || 0
    this.attributeAgility = +obj.attributeAgility || 0
    this.attributeIntellect = +obj.attributeIntellect || 0
    this.attributeWill = +obj.attributeWill || 0
    this.attributeStrengthSelected = +obj.attributeStrengthSelected || false
    this.attributeAgilitySelected = +obj.attributeAgilitySelected || false
    this.attributeIntellectSelected = +obj.attributeIntellectSelected || false
    this.attributeWillSelected = +obj.attributeWillSelected || false

    this.characteristicsPerception = +obj.characteristicsPerception || 0
    this.characteristicsDefense = +obj.characteristicsDefense || 0
    this.characteristicsPower = +obj.characteristicsPower || 0
    this.characteristicsSpeed = +obj.characteristicsSpeed || 0
    this.characteristicsHealth = +obj.characteristicsHealth || 0
    this.characteristicsCorruption = +obj.characteristicsCorruption || 0
    this.characteristicsInsanity = +obj.characteristicsInsanity || 0

    this.languagesText = obj.languagesText || ''
    this.equipmentText = obj.equipmentText || ''
    this.magicText = obj.magicText || ''

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
    level.characteristicsPerception ||
    level.characteristicsDefense ||
    level.characteristicsPower ||
    level.characteristicsSpeed ||
    level.characteristicsHealth ||
    level.characteristicsCorruption ||
    level.characteristicsInsanity
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

export async function getNestedItem(nestedData) {
  let entity
  let method // <- Used to print how the item was fetched
  if (nestedData.pack) {
    const pack = game.packs.get(nestedData.pack)
    if (pack.documentName !== 'Item') return
    entity = await pack.getDocument(nestedData.id)
    method = 'PACK'
  } else if (nestedData.data) {
    entity = nestedData
    method = 'DATA-OBJ'
  } else {
    entity = game.items.get(nestedData.id)
    method = entity ? 'ITEMS' : 'FALLBACK'
  }

  // -- Fallbacks
  // Look for talents with same name inside items
  if (!entity) {
    entity = game.items.find(i => i.name === nestedData.name)
    method = entity ? 'FB-ITEMS' : method
  }
  // Look for talents with same id or name inside ALL packs
  if (!entity) {
    for (const pack of game.packs) {
      entity = (await pack.getDocument(nestedData.id)) || (await pack.getDocuments({ name: nestedData.name }))[0]
      if (entity) break
    }
    method = entity ? 'FB-PACKS' : method
  }

  if (!entity) {
    console.error('DEMONLORD | Nested object not found', nestedData)
    return null
  }
  console.log(`DEMONLORD | Nested object fetched using ${method}`, nestedData, entity) // TODO: Remove when stable

  // Return only the data
  // Warning: here the implicit assertion is that entity is an Item and not an Actor or something else
  if (entity instanceof Item) return entity.data
  else if (entity?.data?.data) return entity.data
  return entity
}

export async function getNestedItemsDataList(nestedDataList) {
  const p = []
  for (const nd of nestedDataList) p.push(await getNestedItem(nd))
  return p.filter(Boolean)
}

/* -------------------------------------------- */

export async function handleCreatePath(actor, pathData) {
  const actorLevel = parseInt(actor.data.data.level)
  const leqLevels = pathData.levels.filter(l => +l.level <= +actorLevel)

  let nestedItems = []
  leqLevels.forEach(l => (nestedItems = [...nestedItems, ...l.spells, ...l.talents, ...l.languages]))
  let itemsData = await getNestedItemsDataList(nestedItems)
  if (itemsData.length > 0) await actor.createEmbeddedDocuments('Item', itemsData)
  return Promise.resolve()
}

export async function handleLevelChange(actor, newLevel, curLevel = undefined) {
  curLevel = parseInt(curLevel ?? actor.data.data.level)
  newLevel = parseInt(newLevel)
  const paths = actor.items.filter(i => i.type === 'path')

  const start = Math.min(curLevel, newLevel)
  const end = Math.max(curLevel, newLevel)
  const levels = []
  for (const p of paths) {
    p.data.data.levels.filter(l => l.level > start && l.level <= end).forEach(l => levels.push(l))
  }

  let nestedItems = []
  if (newLevel > curLevel) {
    // Get spells, talents and languages and add them to the actor
    levels.forEach(l => (nestedItems = [...nestedItems, ...l.spells, ...l.talents, ...l.languages]))
    let itemsData = await getNestedItemsDataList(nestedItems)
    if (itemsData.length > 0) await actor.createEmbeddedDocuments('Item', itemsData)
  } else {
    // Delete ALL items from the difference of levels
    const idsToDel = getPathItemsToDel(actor, levels)
    if (idsToDel.length > 0) await actor.deleteEmbeddedDocuments('Item', idsToDel)
  }
  return Promise.resolve()
}

/* -------------------------------------------- */

export function getPathItemsToDel(actor, pathLevels) {
  let nestedItems = []
  pathLevels.forEach(l => (nestedItems = [...nestedItems, ...l.spells, ...l.talents, ...l.languages, ...l.talentspick]))
  return _getIdsToRemove(actor, nestedItems)
}

export function getAncestryItemsToDel(actor, ancestryData) {
  let nestedItems = [...ancestryData.talents, ...ancestryData.languagelist, ...ancestryData.level4.talent]
  return _getIdsToRemove(actor, nestedItems)
}

function _getIdsToRemove(actor, nestedItems) {
  // Gets the ids to remove, handling items with duplicate names
  const actorItemsIds = actor.items.map(i => ({ name: i.name, id: i.id }))
  return nestedItems
    .map(ni => {
      const index = actorItemsIds.findIndex(ai => ai.name === ni.name)
      if (index >= 0) return actorItemsIds.splice(index, 1)[0].id
    })
    .filter(id => Boolean(id))
}
/* -------------------------------------------- */

export async function handleCreateAncestry(actor, ancestryData) {
  let nestedItems = [...ancestryData.talents, ...ancestryData.languagelist]
  // Do not add level 4, user has to pick it
  // if (actor.data.data.level >= 4)
  //   nestedItems = [...nestedItems, ...ancestryData.level4.talent]
  let itemsData = await getNestedItemsDataList(nestedItems)
  await actor.createEmbeddedDocuments('Item', itemsData)
  return Promise.resolve()
}
