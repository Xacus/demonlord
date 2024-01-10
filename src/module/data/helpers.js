import { capitalize } from "../utils/utils"

export const makeBoolField = (init = false) => new foundry.data.fields.BooleanField({
  initial: init
})

export const makeNumberField = (init = 1, max = 20, min = 0) => new foundry.data.fields.NumberField({
  required: true,
  initial: init,
  //positive: true
  min: min,
  max: max,
})

export const makeIntField = (init = 0, max = 20, min = 0) => new foundry.data.fields.NumberField({
  required: true,
  initial: init,
  min: min,
  max: max,
  integer: true
})

export const makeStringField = (init = '', blank = true) => new foundry.data.fields.StringField({
  initial: init,
  blank: blank
})

export const makeHtmlField = (init = '') => new foundry.data.fields.HTMLField({
  initial: init,
  textSearch: true // Allow it to be searched in the Search Bar
})

export function makeAttribute(attribute) {
  return new foundry.data.fields.SchemaField({
    key: makeStringField(attribute),
    label: makeStringField(game.i18n.localize(`DL.Attribute${capitalize(attribute)}`)),
    value: makeIntField(10),
    modifier: makeIntField(),
    min: makeIntField(),
    max: makeIntField(20),
    immune: makeBoolField()
  })
}

export function makeHealth() {
  return new foundry.data.fields.SchemaField({
    max: makeIntField(),
    value: makeIntField(),
    injured: makeBoolField(),
    healingrate: makeIntField()
  })
}

export function makeInsanity() {
  return new foundry.data.fields.SchemaField({
    min: makeIntField(),
    max: makeIntField(20),
    value: makeIntField(),
    immune: makeBoolField()
  })
}

export function makeCorruption() {
  return new foundry.data.fields.SchemaField({
    min: makeIntField(),
    value: makeIntField(),
    immune: makeBoolField()
  })
}
