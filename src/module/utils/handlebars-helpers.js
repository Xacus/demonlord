/* global fromUuidSync */
import {capitalize, enrichHTMLUnrolled, i18n} from "./utils";

export function registerHandlebarsHelpers() {

  Handlebars.registerHelper('concat', function () {
    var outStr = ''
    for (var arg in arguments) {
      if (typeof arguments[arg] !== 'object') {
        outStr += arguments[arg]
      }
    }
    return outStr
  })
  Handlebars.registerHelper('toLowerCase', str => str.toLowerCase())
  Handlebars.registerHelper('toUpperCase', str => str.toUpperCase())
  Handlebars.registerHelper('capitalize', str => capitalize(str))
  Handlebars.registerHelper('readonly', val => (val ? 'readonly' : ''))
  Handlebars.registerHelper('notreadonly', val => (val ? '' : 'readonly'))
  Handlebars.registerHelper('json', JSON.stringify)
  Handlebars.registerHelper('not', val => !val)
  Handlebars.registerHelper('hideIf', val => (val ? 'style="display:none";' : ''))
  Handlebars.registerHelper('replaceNewline', val =>
    val.split('\n').reduce((acc, v) => acc + v.trim() + '&#13;&#10;', ''),
  )
  Handlebars.registerHelper('hiddenEffect', val =>
    val && game.user.isGM && !game.settings.get('demonlord', 'gmEffectsControls') ? 'visibility: hidden;' : '',
  )

  Handlebars.registerHelper('isBadgeImg', img => game.settings.get('demonlord', 'convertIntoBadge') ? img.includes('/demonlord/assets/icons/badges') : true);
  Handlebars.registerHelper('plusify', x => (!x ? "0" : (x > 0 ? '+' + x : x)))
  Handlebars.registerHelper('defaultValue', function (a, b) {
    return a ? a : b;
  });

  Handlebars.registerHelper('enrichHTMLUnrolled', (x) => enrichHTMLUnrolled(x))
  Handlebars.registerHelper('lookupAttributeModifier', (attributeName, actorData) =>
    actorData?.system?.attributes[attributeName.toLowerCase()]?.modifier
  )

  Handlebars.registerHelper('dlRadioBoxes', (groupName, checkedKey) => _buildRadioBoxes(groupName, checkedKey))
  Handlebars.registerHelper('dlDropdown', (groupName, checkedKey) => _buildDropdownItem(groupName, checkedKey))
  Handlebars.registerHelper('dlDropdownValue', (groupName, checkedKey, valueName, valueKey) => _buildDropdownItemWithValue(groupName, checkedKey, valueName, valueKey))
  Handlebars.registerHelper('dlCheckboxes', (groupName, checkedKey, data) => _buildCheckboxes(groupName, checkedKey, data))
  Handlebars.registerHelper('dlBOBAButton', (_name, value, loc = undefined) => _buildBOBAButton(_name, value, loc))
  Handlebars.registerHelper('dlPathAttributeTwoSet', (groupName, checkedKey) => _buildPathAttributeTwoSetDropdown(groupName, checkedKey))
  Handlebars.registerHelper('dlPathAttributeTwoSetViewSelector', (attributeName, isSelected, selectedName, selectedValue, idx) =>
    _buildPathAttributeTwoSetViewSelector(attributeName, isSelected, selectedName, selectedValue, idx)
  )
  Handlebars.registerHelper('dlAvailabilityDropdown', (groupName, checkedKey) => _buildAvailabilityDropdownItem(groupName, checkedKey))
  Handlebars.registerHelper('dlConsumableDropdown', (groupName, checkedKey) => _buildConsumableDropdownItem(groupName, checkedKey))
  Handlebars.registerHelper('dlAmmoDropdown', (groupName, checkedKey, weapon) => _buildAmmoDropdownItem(groupName, checkedKey, weapon))
  Handlebars.registerHelper('dlCheckItemOnActor', (data) => _CheckItemOnActor(data))  
  Handlebars.registerHelper('dlCheckCharacteristicsIsNull', (actorData) => _CheckCharacteristicsIsNull(actorData))
  Handlebars.registerHelper('dlIsNestedItem', (item) => _IsNestedItem(item))
  Handlebars.registerHelper('dlGetNestedItemSource', (item) => _GetNestedItemSource(item))

  // New Handlebars helpers
  Handlebars.registerHelper('Dropdown', (groupName, checkedKey, loc) => _buildDropdown(groupName, checkedKey, loc))
  Handlebars.registerHelper('BOBAButton', (_name, value, loc = undefined) => _buildBOBA(_name, value, loc))
  Handlebars.registerHelper('Checkboxes', (groupName, checkedKey, data) => _buildCheckboxesV2(groupName, checkedKey, data))
  Handlebars.registerHelper('AvailabilityDropdown', (groupName, checkedKey) => _buildAvailabilityDropdown(groupName, checkedKey))
  Handlebars.registerHelper('DropdownValue', (groupName, checkedKey, valueName, valueKey) => _buildDropdownWithValue(groupName, checkedKey, valueName, valueKey))
  Handlebars.registerHelper('ConsumableDropdown', (groupName, checkedKey) => _buildConsumableDropdown(groupName, checkedKey))
  Handlebars.registerHelper('AmmoDropdown', (groupName, checkedKey, weapon) => _buildAmmoDropdown(groupName, checkedKey, weapon))
  Handlebars.registerHelper('PathDropdown', (groupName, checkedKey, weapon) => _buildPathDropdown(groupName, checkedKey, weapon))
  Handlebars.registerHelper('AttributeSelectDropdown', (groupName, checkedKey) => _buildPathAttributeSelectDropdown(groupName, checkedKey))
  Handlebars.registerHelper('LevelAttributeTwoSet', (groupName, checkedKey) => _buildLevelAttributeTwoSetDropdown(groupName, checkedKey))
}

// ----------------------------------------------------

function _getAttributes(groupName) {
  let attributes = []
  if (groupName === 'system.action.attack' || groupName === 'system.action.defense') {
    attributes = ['', 'strength', 'agility', 'intellect', 'will', 'perception']
  } else if (groupName === 'system.action.against') {
    attributes = ['', 'defense', 'strength', 'agility', 'intellect', 'will', 'perception']
  } else if (groupName === 'system.attribute') {
    attributes = ['', 'intellect', 'will']
  } else if (groupName === 'system.hands') {
    attributes = ['', 'one', 'two', 'off']
  } else if (groupName === 'system.availability') {
    attributes = ['', 'C', 'U', 'R', 'E']
  } else if (groupName === 'system.requirement.attribute') {
    attributes = ['', 'strength', 'agility', 'intellect', 'will', 'perception']
  } else if (groupName === 'system.consumabletype') {
    attributes = ['', 'D', 'F', 'P', 'V', 'T']
  } else if (groupName === 'level.attributeSelect') {
    attributes = ['', 'choosetwo', 'choosethree', 'fixed', 'twosets']
  }
  return attributes
}

// ----------------------------------------------------


function _buildRadioBoxes(groupName, checkedKey) {
  let html = ""
  let attributes = _getAttributes(groupName)

  for (let attribute of attributes) {
    const value = capitalize(attribute)
    const checked = value === checkedKey ? 'checked' : ''
    const tooltip = i18n(`DL.Attribute${value}`)
    html += `<div class="dl-new-project-radio ${checked}" data-tippy-content="${tooltip}">
                <input type="radio" name="${groupName}" value="${value}" ${checked}/>
                <i class="dl-icon-${attribute}"></i>
            </div>`
  }
  return new Handlebars.SafeString(html)
}

// ----------------------------------------------------

function _IsNestedItem(item) {
  return item?.getFlag('demonlord', 'parentItemId') && item?.getFlag('demonlord', 'nestedItemId')
}

function _GetNestedItemSource(item) {
  let itemUuid = item.uuid
  let parentItemId = item.getFlag('demonlord', 'parentItemId')
  let tokenActor = fromUuidSync(itemUuid.substr(0, itemUuid.search('.Item.')))
  let pItem = tokenActor.items.find(x => x._id === parentItemId)
  let stringName

  switch (pItem?.type) {
    case 'creaturerole':
      stringName = 'DL.RoleNestedItem'
      break
    case 'path':
      stringName = 'DL.PathNestedItem'
      break
    case 'ancestry':
      stringName = 'DL.AncestryNestedItem'
      break
    default:
      stringName = 'DL.DefaultNestedItem'
  }

  return game.i18n.format(stringName, { itemName: pItem?.name })

}

function _CheckCharacteristicsIsNull(actorData) {
  if (actorData === null) {
    return true
  } else {
    return false
  }
}

function _CheckItemOnActor(data) {
  if (data.indexOf('Actor.') === -1) {
    return false
  } else {
    return true
  }
}

function _buildDropdownItem(groupName, checkedKey) {
  let attributes = _getAttributes(groupName)
  let html = ""
  checkedKey = checkedKey === 'null' ? '' : checkedKey

  for (let attribute of attributes) {
    const value = capitalize(attribute)
    const checked = value === checkedKey ? 'checked' : ''
    if (!checked) continue
    if (value === '') {
      html += `<div class="dl-new-project-2 dropdown" name="${groupName}" value="">
                  <span style="margin-left: 4px;">${i18n('DL.None')}</span>
               </div>`
      continue
    }

    const label = i18n(`DL.Attribute${value}`)
    const icon = `dl-icon-${attribute}`
    html += `<div class="dl-new-project-2 dropdown" name="${groupName}" value="${value}">
                <i class="${icon}"></i>
                <span class="sep"></span>
                <span>${label}</span>
            </div>`
    break
  }
  if (html === '') html =
    `<div class="dl-new-project-2 dropdown" name="${groupName}" value="">
        <span style="margin-left: 4px;">${i18n('DL.None')}</span>
    </div>`

  return new Handlebars.SafeString(html)
}

function _buildDropdownItemWithValue(groupName, checkedKey, valueName, valueKey) {
  let attributes = _getAttributes(groupName)
  let html = ""
  checkedKey = checkedKey === 'null' ? '' : checkedKey

  for (let attribute of attributes) {
    const attributeLabel = capitalize(attribute)
    const checked = attributeLabel === checkedKey ? 'checked' : ''
    if (!checked) continue
    if (attributeLabel === '') {
      html += `<div class="dl-new-project-2 dropdown" name="${groupName}" value="">
                  <span style="margin-left: 4px;">${i18n('DL.None')}</span>
               </div>`
      continue
    }

    const label = i18n(`DL.Attribute${attributeLabel}`)
    const icon = `dl-icon-${attribute}`
    html += `<div class="dl-new-project-2 dropdown" name="${groupName}" value="${attributeLabel}">
                <i class="${icon}"></i>
                <span class="sep"></span>
                <span>${label}</span>
                <span class="sep"></span>
                <input type="number" name="${valueName}" value="${valueKey}" placeholder="-" autosize/>
            </div>`
    break
  }
  if (html === '') html =
    `<div class="dl-new-project-2 dropdown" name="${groupName}" value="">
        <span style="margin-left: 4px;">${i18n('DL.None')}</span>
    </div>`

  return new Handlebars.SafeString(html)
}


export function buildDropdownList(groupName, checkedKey, data) {
  let labelPrefix = 'DL.Attribute'
  let iconPrefix = 'dl-icon-'
  let useIcon = true

  if (groupName === 'path-type') return _buildPathTypeDropdownList(checkedKey)
  if (groupName === 'level.attributeSelect') return _buildPathAttributeSelectDropdownList(checkedKey)
  if (groupName.startsWith('level.attributeSelectTwoSet')) return _buildPathAttributeTwoSetDropdownList(groupName, checkedKey)
  if (groupName === 'system.consume.ammoitemid') return _buildAmmoDropdownList (groupName, checkedKey, data.document)  
  if (groupName === 'system.hands') {labelPrefix = 'DL.WeaponHands'; useIcon = false}
  if (groupName === 'system.consumabletype') {labelPrefix = 'DL.ConsumableType'; useIcon = false}
  if (groupName === 'system.availability') {labelPrefix = 'DL.Availability', iconPrefix = 'dl-icon-availability-'}
  let attributes = _getAttributes(groupName)

  let html = `<div class="dl-new-project-2-dropdown">`
  for (let attribute of attributes) {
    const value = capitalize(attribute)
    const checked = value === checkedKey ? 'checked' : ''
    const label = value ? i18n(`${labelPrefix}${value}`) : i18n('DL.None')
    const icon = value ? `${iconPrefix}${attribute}` : 'dl-icon-minus'
    const iconHtml = useIcon ? `<i class="${icon}"></i><span class="sep"></span>` : ''
    html += `<div class="${checked}">
                <input type="radio" name="${groupName}" value="${value}" ${checked}/>${iconHtml}
                <span>${label}</span>
            </div>`
  }
  html += `</div>`
  return new Handlebars.SafeString(html)
}

// New for ApplicationV2
export function buildDropdownListHover(groupName, checkedKey, data) {
  let labelPrefix = 'DL.Attribute'
  let iconPrefix = 'icon-'
  let useIcon = true
  let useCapitalize = true

  if (groupName === 'system.type') return _buildPathTypeDropdownList(checkedKey)
  //if (groupName === 'level.attributeSelect') return _buildPathAttributeSelectDropdownList(checkedKey)
  if (groupName === 'level.attributeSelect') {labelPrefix = 'DL.PathsLevelAttributes'; useIcon = false; useCapitalize = false}
  if (groupName.startsWith('level.attributeSelectTwoSet')) return _buildPathAttributeTwoSetDropdownList(groupName, checkedKey)
  if (groupName === 'system.consume.ammoitemid') return _buildAmmoDropdownList(groupName, checkedKey, data)  
  if (groupName === 'system.hands') {labelPrefix = 'DL.WeaponHands'; useIcon = false}
  if (groupName === 'system.consumabletype') {labelPrefix = 'DL.ConsumableType'; iconPrefix = 'icon-consumable-'}
  if (groupName === 'system.availability') {labelPrefix = 'DL.Availability', iconPrefix = 'icon-availability-'}
  let attributes = _getAttributes(groupName)

  let html = `<div class="dl-new-project-2-dropdown">`
  for (let attribute of attributes) {
    const value = useCapitalize ? capitalize(attribute) : attribute
    const checked = value === checkedKey ? 'checked' : ''
    const label = value ? i18n(`${labelPrefix}${capitalize(attribute)}`) : i18n('DL.None')
    const icon = value ? `${iconPrefix}${attribute}` : 'icon-minus'
    const iconHtml = useIcon ? `<i class="${icon}"></i><span class="sep"></span>` : ''
    html += `<div class="${checked}">
                <input type="radio" name="${groupName}" value="${value}" ${checked}/>${iconHtml}
                <span>${label}</span>
            </div>`
  }
  html += `</div>`
  return new Handlebars.SafeString(html)
}

// ----------------------------------------------------

function _buildCheckboxes(groupName, checkedKey, data) {
  let html = ''
  if (groupName === 'talent-action-bonus') {
    const attributes = ['strength', 'agility', 'intellect', 'will', 'perception']
    for (let attribute of attributes) {
      const label = i18n(`DL.Attribute${capitalize(attribute)}`)
      const _name = `${attribute}boonsbanesselect`
      const checked = data.action[_name] ? 'checked' : ''
      html += `<div class="dl-new-project-radio ${checked}" data-tippy-content="${label}">
                <input type="checkbox" name="system.action.${_name}" ${checked}/>
                <i class="dl-icon-${attribute}"></i>
              </div>`

    }
  } else if (groupName === 'talent-challenge-bonus') {
    const attributes = ['strength', 'agility', 'intellect', 'will', 'perception']
    for (let attribute of attributes) {
      const label = i18n(`DL.Attribute${capitalize(attribute)}`)
      const _name = `${attribute}boonsbanesselect`
      const checked = data.challenge[_name] ? 'checked' : ''
      html += `<div class="dl-new-project-radio ${checked}" data-tippy-content="${label}">
                <input type="checkbox" name="system.challenge.${_name}" ${checked}/>
                <i class="dl-icon-${attribute}"></i>
              </div>`

    }
  }
  return new Handlebars.SafeString(html)
}

// ----------------------------------------------------

function _buildBOBAButton(_name, value, loc) {
  loc = loc || "DL.WeaponBoonsBanes"
  const html = `
    <div class="dl-new-project-2 nohover" data-tippy-content="${i18n(loc)}">
      <i class="dl-icon-d6 ${value ? '' : 'gray'}"></i>
      <span class="sep"></span>
      <input type="number" name="${_name}" value="${value || 0}"/>
    </div>`
  return new Handlebars.SafeString(html)
}

// ----------------------------------------------------

function _buildPathTypeDropdownList(checkedKey) {
  let html = `<div class="dl-new-project-2-dropdown">`
  for (let type of ['novice', 'expert', 'master', 'legendary']) {
    const checked = type === checkedKey ? 'checked' : ''
    const label = i18n(`DL.CharPath${capitalize(type)}`)
    html += `<div class="${checked}">
                <input type="radio" name="system.type" value="${type}" ${checked}/>
                <span style="margin-left: 4px">${label}</span>
            </div>`
  }
  html += `</div>`
  return new Handlebars.SafeString(html)
}

function _buildPathAttributeSelectDropdownList(checkedKey) {
  let html = `<div class="dl-new-project-2-dropdown">`
  for (let type of ['-', 'choosetwo', 'choosethree', 'fixed', 'twosets']) {
    const checked = type === checkedKey ? 'checked' : ''
    const label = type !== '-' ? i18n(`DL.PathsLevelAttributes${capitalize(type)}`) : i18n('DL.None')
    html += `<div class="${checked}">
                <input type="radio" name="level.attributeSelect" value="${type}" ${checked}/>
                <span style="margin-left: 4px">${label}</span>
            </div>`
  }
  html += `</div>`
  return new Handlebars.SafeString(html)
}


function _buildPathAttributeTwoSetDropdown(groupName, checkedKey) {
  const attributes = ['strength', 'agility', 'intellect', 'will']
  let html = ""
  checkedKey = checkedKey || 'strength'

  for (let attribute of attributes) {
    const checked = attribute === checkedKey ? 'checked' : ''
    if (!checked) continue
    const label = i18n(`DL.Attribute${capitalize(attribute)}`)
    html += `<div class="dl-new-project-2 dropdown" name="${groupName}" value="${attribute}">
                <i class="dl-icon-${attribute}"></i>
                <span class="sep"></span>
                <span style="text-align: center">${label}</span>
            </div>`
    break
  }
  return new Handlebars.SafeString(html)
}


function _buildPathAttributeTwoSetDropdownList(groupName, checkedKey) {
  const attributes = ['strength', 'agility', 'intellect', 'will']
  let html = `<div class="dl-new-project-2-dropdown">`
  checkedKey = checkedKey || 'strength'

  for (let attribute of attributes) {
    const value = capitalize(attribute)
    const checked = attribute === checkedKey ? 'checked' : ''
    const label = value ? i18n(`DL.Attribute${value}`) : i18n('DL.None')
    const icon = value ? `dl-icon-${attribute}` : 'dl-icon-minus'
    html += `<div class="${checked}">
                <input type="radio" name="${groupName}" value="${attribute}" ${checked}/>
                <i class="${icon}"></i>
                <span class="sep"></span>
                <span>${label}</span>
            </div>`
  }
  html += '</div>'
  return new Handlebars.SafeString(html)
}


function _buildPathAttributeTwoSetViewSelector(attributeName, isSelected, selectedName, selectedValue, idx) {
  isSelected = isSelected ?? false
  attributeName = attributeName || "None"
  const label = i18n(`DL.Attribute${capitalize(attributeName)}`)
  let html =
    `<div class="dl-new-project-2 selectable ${isSelected ? 'selected': ''}">
        <input type="radio" name="${selectedName}" value="${selectedValue}" name="${selectedName}"
            id="${selectedName}.${isSelected}${idx}" ${isSelected ? 'checked' : ''}>
        <i class="dl-icon-${attributeName}"></i>
        <span class="sep"></span>
        <span style="width: 64px; text-align: center; text-overflow: ellipsis">${label}</span>
     </div>`
  return new Handlebars.SafeString(html)
}

function _buildAmmoDropdownList(groupName, checkedKey, data) {
  let attributes = [{ id: '', name: i18n('DL.None') }]
  let html = `<div class="dl-new-project-2-dropdown">`
  if (!data) return ''
  let baseItemUuid = data.uuid
  let actor = fromUuidSync(baseItemUuid.substr(0, baseItemUuid.search('.Item.')))
  actor.items.forEach(item => {
    if (item.type === 'ammo') attributes.push({ id: item._id, name: item.name })
  })
  for (let attribute of attributes) {
    const value = attribute.id
    const checked = value === checkedKey ? 'checked' : ''
    const label = value ? attribute.name : i18n('DL.None')
    html += `<div class="${checked}">
                <input type="radio" name="${groupName}" value="${value}" ${checked}/>
                <span>${label}</span>
            </div>`
  }
  html += `</div>`
  return new Handlebars.SafeString(html)
}

// ----------------------------------------------------

function _buildAvailabilityDropdownItem(groupName, checkedKey) {
  const attributes = ['', 'C', 'U', 'R', 'E']
  for (let attribute of attributes) {
    if (checkedKey != attribute) continue
    const label = !attribute ? i18n("DL.None") : i18n(`DL.Availability${attribute}`)
    let html =
      `<div class="dl-new-project-2 dropdown" name="${groupName}" value="${checkedKey}">
            <i class="dl-icon-availability-${attribute}"></i>
            <span class="sep"></span>
            <span style="width: 64px; text-align: center; text-overflow: ellipsis">${label}</span>
       </div>`
    return new Handlebars.SafeString(html)
  }
}


function _buildConsumableDropdownItem(groupName, checkedKey) {
  const attributes = ['', 'D', 'F', 'P', 'V', 'T']
  for (let attribute of attributes) {
    if (checkedKey != attribute) continue
    const label = !attribute ? i18n('DL.ConsumableNone') : i18n(`DL.ConsumableType${attribute}`)
    let html = `<div class="dl-new-project-2 dropdown" name="${groupName}" value="${checkedKey}">
            <span style="width: 120px; text-align: center; text-overflow: ellipsis">${label} </span>
       </div>`
    return new Handlebars.SafeString(html)
  }
}

function _buildAmmoDropdownItem(groupName, checkedKey, weapon) {
  let actorUuid = weapon.parent.uuid
  let actor = fromUuidSync(actorUuid.substr(0, actorUuid.search('.Item.')))
  let attributes = [{ id: '', name: '' }]

  actor.items.forEach(item => {
    if (item.type === 'ammo') attributes.push({ id: item._id, name: item.name })
  })

  if (!attributes.find(x => x.id === checkedKey)) checkedKey = ''

  for (let attribute of attributes) {
    if (checkedKey != attribute.id) continue
    const label = attribute.id === '' ? i18n('DL.None') : attribute.name
    let html = `<div class="dl-new-project-2 dropdown" name="${groupName}" value="${checkedKey}">
            <span style="width: 200px; text-align: center; overflow: hidden; text-overflow: ellipsis;">${label} </span>
       </div>`
    return new Handlebars.SafeString(html)
  }
}

// New Handlebars helpers
function _buildDropdown(groupName, checkedKey, loc) {
  let attributes = _getAttributes(groupName)
  let html = ""
  checkedKey = checkedKey === 'null' ? '' : checkedKey

  for (let attribute of attributes) {
    const value = capitalize(attribute)
    const checked = value === checkedKey ? 'checked' : ''
    if (!checked) continue
    if (value === '') {
      html += `<div class="item-group-dropdown dropdown-group" name="${groupName}" value="">
                <div class="input-group" data-tippy-content="${i18n(loc)}">
                  <span class="text">${i18n('DL.None')}</span>
                </div>
               </div>`
      continue
    }

    const label = i18n(`DL.Attribute${value}`)
    const icon = `icon-${attribute}`
    html += `<div class="item-group-dropdown dropdown-group" name="${groupName}" value="${value}">
                <div class="input-group" data-tippy-content="${i18n(loc)}">
                  <i class="${icon} themed-icon"></i>
                  <span class="sep"></span>
                  <span class="text">${label}</span>
                </div>
            </div>`
    break
  }
  if (html === '') html =
    `<div class="item-group-dropdown dropdown-group" name="${groupName}" value="">
        <div class="input-group" data-tippy-content="${i18n(loc)}">
          <span class="text">${i18n('DL.None')}</span>
        </div>
    </div>`

  return new Handlebars.SafeString(html)
}


function _buildBOBA(_name, value, loc) {
  loc = loc || "DL.WeaponBoonsBanes"
  const html = `
    <div class="item-group-boba">
      <div class="input-group" data-tippy-content="${i18n(loc)}">
        <i class="icon-d6 ${value ? '' : 'inactive'} themed-icon"></i>
        <span class="sep"></span>
        <input type="number" class="input-group-textbox" name="${_name}" value="${value}" placeholder="0"/>
      </div>
    </div>`
  return new Handlebars.SafeString(html)
}

function _buildCheckboxesV2(groupName, checkedKey, data) {
  let html = ''
  if (groupName === 'talent-action-bonus') {
    const attributes = ['strength', 'agility', 'intellect', 'will', 'perception']
    for (let attribute of attributes) {
      const label = i18n(`DL.Attribute${capitalize(attribute)}`)
      const _name = `${attribute}boonsbanesselect`
      const checked = data.action[_name] ? 'checked' : ''
      html += `<div class="item-group-checkbox checkable" data-action="toggleAttackBonus" data-attribute="${attribute}" data-tippy-content="${label}">
                <input type="checkbox" name="system.action.${_name}" ${checked}/>
                <i class="icon-${attribute} themed-icon"></i>
              </div>`
    }
  } else if (groupName === 'talent-challenge-bonus') {
    const attributes = ['strength', 'agility', 'intellect', 'will', 'perception']
    for (let attribute of attributes) {
      const label = i18n(`DL.Attribute${capitalize(attribute)}`)
      const _name = `${attribute}boonsbanesselect`
      const checked = data.challenge[_name] ? 'checked' : ''
      html += `<div class="item-group-checkbox checkable" data-action="toggleChallengeBonus" data-attribute="${attribute}" data-tippy-content="${label}">
                <input type="checkbox" name="system.challenge.${_name}" ${checked}/>
                <i class="icon-${attribute} themed-icon"></i>
              </div>`
    }
  }
  return new Handlebars.SafeString(html)
}

function _buildAvailabilityDropdown(groupName, checkedKey) {
  const attributes = ['', 'C', 'U', 'R', 'E']
  for (let attribute of attributes) {
    if (checkedKey != attribute) continue
    const label = !attribute ? i18n("DL.None") : i18n(`DL.Availability${attribute}`)
    const icon = `icon-availability-${attribute}`
    let html =
      `<div class="item-group-availability dropdown-group" name="${groupName}" value="${checkedKey}">
        <div class="input-group" data-tippy-content="${i18n('DL.Availability')}">
          <i class="${icon} themed-icon"></i>
          <span class="sep"></span>
          <span class="text">${label}</span>
        </div>
      </div>`
    return new Handlebars.SafeString(html)
  }
}

function _buildDropdownWithValue(groupName, checkedKey, valueName, valueKey) {
  let attributes = _getAttributes(groupName)
  let html = ""
  checkedKey = checkedKey === 'null' ? '' : checkedKey

  for (let attribute of attributes) {
    const attributeLabel = capitalize(attribute)
    const checked = attributeLabel === checkedKey ? 'checked' : ''
    if (!checked) continue
    if (attributeLabel === '') {
      html += `<div class="item-group-dropdown dropdown-group" name="${groupName}" value="">
                <div class="input-group" data-tippy-content="${i18n('DL.None')}">
                  <span class="text">${i18n('DL.None')}</span>
                </div>
              </div>`
      continue
    }

    const label = i18n(`DL.Attribute${attributeLabel}`)
    const icon = `icon-${attribute}`
    html += `<div class="item-group-dropdown dropdown-group" name="${groupName}" value="${attributeLabel}">
              <div class="input-group" data-tippy-content="${label}">
                <i class="${icon} themed-icon"></i>
                <span class="sep"></span>
                <input class="input-group-textbox" type="number" name="${valueName}" value="${valueKey}" placeholder="-"/>
              </div>
            </div>`
    break
  }
  if (html === '') html =
    `<div class="item-group-dropdown dropdown-group" name="${groupName}" value="">
      <div class="input-group" data-tippy-content="${i18n('DL.None')}">
        <span class="text">${i18n('DL.None')}</span>
      </div>
    </div>`

  return new Handlebars.SafeString(html)
}

function _buildConsumableDropdown(groupName, checkedKey) {
  const attributes = ['', 'D', 'F', 'P', 'V', 'T']
  for (let attribute of attributes) {
    if (checkedKey != attribute) continue
    const label = !attribute ? i18n('DL.ConsumableNone') : i18n(`DL.ConsumableType${attribute}`)
    const icon = `icon-consumable-${attribute}`
    let html =
    `<div class="item-group-consumable-type dropdown-group" name="${groupName}" value="${checkedKey}">
      <div class="input-group">
        <i class="${icon} themed-icon"></i>
        <span class="sep"></span>
        <span class="text">${label}</span>
      </div>
    </div>`

    return new Handlebars.SafeString(html)
  }
}

function _buildAmmoDropdown(groupName, checkedKey, weapon) {
  let actorUuid = weapon.parent.uuid
  let actor = fromUuidSync(actorUuid.substr(0, actorUuid.search('.Item.')))
  let attributes = [{ id: '', name: '' }]

  actor.items.forEach(item => {
    if (item.type === 'ammo') attributes.push({ id: item._id, name: item.name })
  })

  if (!attributes.find(x => x.id === checkedKey)) checkedKey = ''

  for (let attribute of attributes) {
    if (checkedKey != attribute.id) continue
    const label = attribute.id === '' ? i18n('DL.None') : attribute.name
    let html = `<div class="item-group-dropdown dropdown-group" name="${groupName}" value="${checkedKey}">
                  <span class="text">${label} </span>
                </div>`
    return new Handlebars.SafeString(html)
  }
}

function _buildPathDropdown(groupName, checkedKey) {
  const attributes = ['', 'novice', 'expert', 'master', 'legendary']
  for (let attribute of attributes) {
    if (checkedKey != attribute) continue
    const label = !attribute ? i18n('DL.None') : i18n(`DL.CharPath${capitalize(attribute)}`)
    let html =
    `<div class="item-group-path-type dropdown-group" name="${groupName}" value="${checkedKey}">
      <div class="input-group">
        <span class="text">${label}</span>
      </div>
    </div>`

    return new Handlebars.SafeString(html)
  }
}

function _buildPathAttributeSelectDropdown(groupName, checkedKey) {
  const attributes = ['', 'choosetwo', 'choosethree', 'fixed', 'twosets']
  for (let attribute of attributes) {
    if (checkedKey != attribute) continue
    const label = !attribute ? i18n('DL.None') : i18n(`DL.PathsLevelAttributes${capitalize(attribute)}`)
    let html =
    `<div class="item-group-attribute-select dropdown-group" name="${groupName}" value="${checkedKey}">
      <div class="input-group">
        <span class="text">${label}</span>
      </div>
    </div>`

    return new Handlebars.SafeString(html)
  }
}

function _buildLevelAttributeTwoSetDropdown(groupName, checkedKey) {
  const attributes = ['strength', 'agility', 'intellect', 'will']
  let html = ''
  checkedKey = checkedKey || 'strength'

  for (let attribute of attributes) {
    const checked = attribute === checkedKey ? 'checked' : ''
    const tooltip = i18n(`DL.Attribute${capitalize(attribute)}`)
    if (!checked) continue
    html += 
    `<div class="item-group-icon-dropdown dropdown-group" name="${groupName}" value="${attribute}">
      <i class="icon-${attribute} themed-icon" data-tippy-content="${tooltip}"></i>
    </div>`
    break
  }
  return new Handlebars.SafeString(html)
}