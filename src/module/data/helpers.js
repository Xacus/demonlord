import { capitalize } from "../utils/utils"

export function makeBoolField(init = false) {
  return new foundry.data.fields.BooleanField({
    initial: init
  })
}

export function makeNumberField(init = 1, max, min) {
  return new foundry.data.fields.NumberField({
    required: true,
    initial: init,
    //positive: true
    min: min,
    max: max,
  })
}

export function makeIntField(init = 0, max, min) {
  return new foundry.data.fields.NumberField({
    required: true,
    initial: init,
    min: min,
    max: max,
    integer: true
  })
}

export function makeStringField(init = '', blank = true) {
  return new foundry.data.fields.StringField({
    initial: init,
    blank: blank
  })
}

export function makeHtmlField(init = '') {
  return new foundry.data.fields.HTMLField({
    initial: init,
    textSearch: true // Allow it to be searched in the Search Bar
  })
}

export function makeObjectField() {
  return new foundry.data.fields.ObjectField({

  })
}

export function makeAttribute(attribute, max = 20) {
  return new foundry.data.fields.SchemaField({
    key: makeStringField(attribute),
    label: makeStringField(game.i18n.localize(`DL.Attribute${capitalize(attribute)}`)),
    value: makeIntField(10, max, 1),
    modifier: makeIntField(),
    min: makeIntField(),
    max: makeIntField(max),
    immune: makeBoolField()
  })
}

export function makeHealth() {
  return new foundry.data.fields.SchemaField({
    max: makeIntField(),
    value: makeIntField(0),
    injured: makeBoolField(),
    healingrate: makeIntField()
  })
}

export function makeInsanity() {
  return new foundry.data.fields.SchemaField({
    min: makeIntField(),
    max: makeIntField(),
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
