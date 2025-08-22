export const DL = {}

DL.attributes = {
  strength: 'DL.AttributeStrength',
  agility: 'DL.AttributeAgility',
  intellect: 'DL.AttributeIntellect',
  will: 'DL.AttributeWill',
  perception: 'DL.AttributePerception',
  defense: 'DL.AttributeDefense',
}

DL.pathType = {
  novice: 'DL.CharPathNovice',
  expert: 'DL.CharPathExpert',
  master: 'DL.CharPathMaster',
  legendary: 'DL.CharPathLegendary'
}

// [powerLevel][spellLevel] -> maxCastings
DL.spellUses = {
  0: { 0: 1, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
  1: { 0: 2, 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
  2: { 0: 3, 1: 2, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
  3: { 0: 4, 1: 2, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
  4: { 0: 5, 1: 2, 2: 2, 3: 1, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
  5: { 0: 6, 1: 3, 2: 2, 3: 2, 4: 1, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
  6: { 0: 7, 1: 3, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1, 7: 0, 8: 0, 9: 0, 10: 0 },
  7: { 0: 8, 1: 3, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 0, 9: 0, 10: 0 },
  8: { 0: 9, 1: 3, 2: 3, 3: 2, 4: 2, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0, 10: 0 },
  9: { 0: 10, 1: 3, 2: 3, 3: 3, 4: 2, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1, 10: 0 },
  10: { 0: 11, 1: 3, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1 },
}

DL.spellTypes = {
  Attack: 'DL.SpellTypeAttack',
  Utility: 'DL.SpellTypeUtility'
}

DL.actionActivationTypes = {
  action: 'DL.Action',
  triggeredaction: 'DL.TriggeredAction',
  actiontriggeredaction: 'DL.ActionTriggeredAction',
}

DL.actionRange = {
  reach: 'DL.ActionRangeReach',
  short: 'DL.ActionRangeShort',
  medium: 'DL.ActionRangeMedium',
  long: 'DL.ActionRangeLong',
  extreme: 'DL.ActionRangeExtreme',
  sight: 'DL.ActionRangeSight',
}

DL.actionAreaShape = {
  circle: 'circle',
  cone: 'cone',
  cube: 'rect',
  cylinder: 'circle',
  hemisphere: 'circle',
  line: 'ray',
  sphere: 'circle',
  square: 'rect',
}

DL.actionDuration = {
  rounds: 'DL.ActionDurationRounds',
  minutes: 'DL.ActionDurationMinutes',
  hours: 'DL.ActionDurationHours',
  days: 'DL.ActionDurationDays',
  months: 'DL.ActionDurationMonths',
  years: 'DL.ActionDurationYears',
}

DL.actionLimitedUsePeriods = {
  rest: 'DL.ActionLimitedUseRest',
  uses: 'DL.ActionLimitedUseUses',
}

DL.actionTargetTypes = {
  self: 'DL.ActionTargetTypesSelf',
  creature: 'DL.ActionTargetTypesCreature',
  object: 'DL.ActionTargetTypesObject',
  creatureobject: 'DL.ActionTargetTypesCreatureObject',
  circle: 'DL.ActionTargetTypesCircle',
  cone: 'DL.ActionTargetTypesCone',
  cube: 'DL.ActionTargetTypesCube',
  cylinder: 'DL.ActionTargetTypesCylinder',
  hemisphere: 'DL.ActionTargetTypesHemisphere',
  line: 'DL.ActionTargetTypesLine',
  sphere: 'DL.ActionTargetTypesSphere',
  square: 'DL.ActionTargetTypesSquare',
}

DL.weaponHandsTypes = {
  one: 'DL.WeaponHandsOne',
  two: 'DL.WeaponHandsTwo',
  off: 'DL.WeaponHandsOff'
}

DL.activeEffectsMenuTypes = {
  NONE: 0,
  TOGGLE: 1,
  EDIT: 2,
  ALL: 3,
}

DL.defaultItemIcons = {
  ammo: 'systems/demonlord/assets/icons/ammunition/arrows/arrows7.webp',
  item: 'icons/containers/bags/sack-cloth-tan.webp',
  armor: 'systems/demonlord/assets/icons/armor/soft%20leather.webp',
  feature: 'icons/skills/social/intimidation-impressing.webp',
  spell: 'systems/demonlord/assets/icons/skills/spellbook.webp',
  talent: 'systems/demonlord/assets/icons/skills/fist.webp',
  weapon: 'icons/magic/light/explosion-impact-purple.webp',
  specialaction: 'systems/demonlord/assets/icons/skills/fist.webp',
  endoftheround: 'icons/commodities/tech/watch.webp',
  profession: 'icons/tools/hand/hammer-and-nail.webp',
  language: 'systems/demonlord/assets/icons/other/books/book2.webp',
  ancestry: 'systems/demonlord/assets/icons/badges/dwarf-01.webp',
  path: {
    novice: 'systems/demonlord/assets/icons/badges/sword-01.webp',
    expert: 'systems/demonlord/assets/icons/badges/axe-01.webp',
    master: 'systems/demonlord/assets/icons/badges/helm-01.webp',
  },
  creaturerole: 'icons/equipment/back/cape-layered-blue-accent.webp',
  relic: 'icons/commodities/treasure/sceptre-jeweled-gold.webp'
}
