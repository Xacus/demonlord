export const DL = {}

DL.attributes = {
  strength: 'DL.AttributeStrength',
  agility: 'DL.AttributeAgility',
  intellect: 'DL.AttributeIntellect',
  will: 'DL.AttributeWill',
  perception: 'DL.CharPerception',
  defense: 'DL.CharDefense'
}

DL.statusIcons = {
  asleep: 'icons/svg/sleep.svg',
  blinded: 'icons/svg/blind.svg',
  charmed: 'systems/demonlord/icons/effects/charmed.svg',
  compelled: 'systems/demonlord/icons/effects/compelled.svg',
  dazed: 'icons/svg/daze.svg',
  deafened: 'icons/svg/deaf.svg',
  defenseless: 'systems/demonlord/icons/effects/defenseless.svg',
  diseased: 'systems/demonlord/icons/effects/diseased.svg',
  fatigued: 'systems/demonlord/icons/effects/fatigued.svg',
  frightened: 'icons/svg/terror.svg',
  horrified: 'systems/demonlord/icons/effects/horrified.svg',
  grabbed: 'systems/demonlord/icons/effects/grabbed.svg',
  immobilized: 'systems/demonlord/icons/effects/immobilized.svg',
  impaired: 'systems/demonlord/icons/effects/impaired.svg',
  poisoned: 'icons/svg/poison.svg',
  prone: 'icons/svg/falling.svg',
  slowed: 'systems/demonlord/icons/effects/slowed.svg',
  stunned: 'icons/svg/stoned.svg',
  surprised: 'systems/demonlord/icons/effects/surprised.svg',
  unconscious: 'icons/svg/unconscious.svg',
  concentrate: 'systems/demonlord/icons/effects/concentrate.svg',
  defend: 'systems/demonlord/icons/effects/defend.svg',
  help: 'systems/demonlord/icons/effects/help.svg',
  prepare: 'systems/demonlord/icons/effects/prepare.svg',
  reload: 'systems/demonlord/icons/effects/reload.svg',
  retreat: 'systems/demonlord/icons/effects/retreat.svg',
  rush: 'systems/demonlord/icons/effects/rush.svg',
  stabilize: 'systems/demonlord/icons/effects/stabilize.svg',
  injured: 'icons/svg/blood.svg'
}

DL.pathtype = {
  novice: 'DL.CharPathNovice',
  expert: 'DL.CharPathExpert',
  master: 'DL.CharPathMaster'
}

DL.spelluses = {
  0: '1,0,0,0,0,0,0,0,0,0,0',
  1: '2,1,0,0,0,0,0,0,0,0,0',
  2: '3,2,1,0,0,0,0,0,0,0,0',
  3: '4,2,1,1,0,0,0,0,0,0,0',
  4: '5,2,2,1,1,0,0,0,0,0,0',
  5: '6,3,2,2,1,1,0,0,0,0,0',
  6: '7,3,2,2,2,1,1,0,0,0,0',
  7: '8,3,2,2,2,1,1,1,0,0,0',
  8: '9,3,3,2,2,2,1,1,1,0,0',
  9: '10,3,3,3,2,2,1,1,1,1,0',
  10: '11,3,3,3,3,2,1,1,1,1,1'
}

DL.actionActivationTypes = {
  "action": "DL.Action",
  "triggeredaction": "DL.TriggeredAction",
  "actiontriggeredaction": "DL.ActionTriggeredAction",
}

DL.actionRange = {
  "reach": "DL.ActionRangeReach",
  "short": "DL.ActionRangeShort",
  "medium": "DL.ActionRangeMedium",
  "long": "DL.ActionRangeLong",
  "extreme": "DL.ActionRangeExtreme",
  "sight": "DL.ActionRangeSight",
}

DL.actionAreaShape = {
  "circle": "circle",
  "cone": "cone",
  "cube": "rect",
  "cylinder": "circle",
  "hemisphere": "circle",
  "line": "ray",
  "sphere": "circle",
  "square": "react"
}

DL.actionDuration = {
  "rounds": "DL.ActionDurationRounds",
  "minutes": "DL.ActionDurationMinutes",
  "hours": "DL.ActionDurationHours",
  "days": "DL.ActionDurationDays",
  "months": "DL.ActionDurationMonths",
  "years": "DL.ActionDurationYears",
}

DL.actionLimitedUsePeriods = {
  "rest": "DL.ActionLimitedUseRest",
  "uses": "DL.ActionLimitedUseUses",
}

DL.actionTargetTypes = {
  "self": "DL.ActionTargetTypesSelf",
  "creature": "DL.ActionTargetTypesCreature",
  "object": "DL.ActionTargetTypesObject",
  "creatureobject": "DL.ActionTargetTypesCreatureObject",
  "circle": "DL.ActionTargetTypesCircle",
  "cone": "DL.ActionTargetTypesCone",
  "cube": "DL.ActionTargetTypesCube",
  "cylinder": "DL.ActionTargetTypesCylinder",
  "hemisphere": "DL.ActionTargetTypesHemisphere",
  "line": "DL.ActionTargetTypesLine",
  "sphere": "DL.ActionTargetTypesSphere",
  "square": "DL.ActionTargetTypesSquare",
}
