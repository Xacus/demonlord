import { makeBoolField, makeIntField, makeStringField, makeObjectField, makeAttribute, makeHealth, makeInsanity, makeCorruption } from './helpers.js'

export function attributes() {
  return new foundry.data.fields.SchemaField({
    strength: makeAttribute('strength'),
    agility: makeAttribute('agility'),
    intellect: makeAttribute('intellect'),
    will: makeAttribute('will'),
    perception: makeAttribute('perception', 25)
  })
}

export function characteristics(actorType) {
  switch (actorType) {
    case 'character':
      return new foundry.data.fields.SchemaField({
        defense: makeIntField(),
        health: makeHealth(),
        insanity: makeInsanity(),
        corruption: makeCorruption(),
        power: makeIntField(),
        size: makeStringField('1'),
        speed: makeIntField(10),
        fortune: makeIntField()
      })
    case 'creature':
      return new foundry.data.fields.SchemaField({
        defense: makeIntField(),
        defenseBase: makeIntField(),
        health: makeHealth(),
        insanity: makeInsanity(),
        corruption: makeCorruption(),
        power: makeIntField(),
        powerBase: makeIntField(),
        size: makeStringField('1'),
        sizeBase: makeStringField('1'),
        speed: makeIntField(10),
        speedBase: makeIntField(10)
      })
    case 'vehicle':
      return new foundry.data.fields.SchemaField({
        defense: makeIntField(),
        defenseBase: makeIntField(),
        health: makeHealth(),
        size: makeStringField('1'),
        sizeBase: makeStringField('1'),
        speed: makeIntField(10),
        speedBase: makeIntField(10)
    })
  }
}

export function action() {
  return new foundry.data.fields.SchemaField({
    active: makeBoolField(true),
    attack: makeStringField(),
    against: makeStringField(),
    damageactive: makeBoolField(true),
    damage: makeStringField(),
    damagetype: makeStringField(),
    boonsbanesactive: makeBoolField(true),
    boonsbanes: makeStringField(),
    rollbonus: makeStringField(),
    plus20active: makeBoolField(true),
    plus20: makeStringField(),
    plus20damage: makeStringField(),
    defense: makeStringField(),
    defenseboonsbanes: makeStringField(),
    damagetypes: new foundry.data.fields.ArrayField(new foundry.data.fields.ObjectField({
      damage: makeStringField(),
      damagetype: makeStringField()
    })),
    strengthboonsbanesselect: makeBoolField(),
    agilityboonsbanesselect: makeBoolField(),
    intellectboonsbanesselect: makeBoolField(),
    willboonsbanesselect: makeBoolField(),
    perceptionboonsbanesselect: makeBoolField(),
    extraboonsbanes: makeStringField(),
    extradamage: makeStringField(),
    extraplus20damage: makeStringField(),
    extraEffect: makeStringField(),
    extraEffect20: makeStringField()
  })
}

export function activatedEffect() {
  return new foundry.data.fields.SchemaField({
    activation: new foundry.data.fields.SchemaField({
      type: makeStringField(),
      cost: makeIntField()
    }),
    duration: new foundry.data.fields.SchemaField({
      value: makeIntField(),
      type: makeStringField()
    }),
    target: new foundry.data.fields.SchemaField({
      value: makeStringField(),
      type: makeStringField()
    }),
    texture: makeStringField(),
    range: makeStringField(),
    uses: new foundry.data.fields.SchemaField({
      value: makeIntField(),
      max: makeIntField(),
      per: makeStringField()
    })
  })
}

export function wealth() {
  return new foundry.data.fields.SchemaField({
    edit: makeBoolField(),
    lifestyle: makeStringField(),
    description: makeStringField(),
    bits: makeIntField(),
    cp: makeIntField(),
    ss: makeIntField(),
    gc: makeIntField()
  })
}

export function enchantment() {
  return new foundry.data.fields.SchemaField({
    attackbonus: makeIntField(),
    challengebonus: makeIntField(),
    damage: makeStringField(),
    defense: makeIntField(),
    speed: makeIntField(),
    perception: makeIntField(),
    effect: makeStringField(),
    uses: new foundry.data.fields.SchemaField({
      value: makeIntField(),
      max: makeIntField()
    })
  })
}

export function contents() {
  return new foundry.data.fields.ArrayField(makeObjectField())
}

export function levelItem(makeDataSchema) {
  return new foundry.data.fields.SchemaField({
    system: makeDataSchema(),
    description: makeStringField(),
    id: makeStringField(),
    name: makeStringField(),
    pack: makeStringField(),
    selected: makeBoolField(),
    uuid: new foundry.data.fields.DocumentUUIDField(),
    img: makeStringField()
  })
}
