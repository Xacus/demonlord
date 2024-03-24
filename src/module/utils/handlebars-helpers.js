import {capitalize, enrichHTMLUnrolled, i18n} from "./utils";
import {handlebarsBuildEditor} from "./editor";

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

  Handlebars.registerHelper('isBadgeImg', img => img.includes('/demonlord/assets/icons/badges'))
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
  Handlebars.registerHelper('dlEditor', (options) => handlebarsBuildEditor(options))
  Handlebars.registerHelper('dlPathAttributeTwoSet', (groupName, checkedKey) => _buildPathAttributeTwoSetDropdown(groupName, checkedKey))
  Handlebars.registerHelper('dlPathAttributeTwoSetViewSelector', (attributeName, isSelected, selectedName, selectedValue, idx) =>
    _buildPathAttributeTwoSetViewSelector(attributeName, isSelected, selectedName, selectedValue, idx)
  )
  Handlebars.registerHelper('dlAvailabilityDropdown', (groupName, checkedKey) => _buildAvailabilityDropdownItem(groupName, checkedKey))
  Handlebars.registerHelper('dlConsumableDropdown', (groupName, checkedKey) => _buildConsumableDropdownItem(groupName, checkedKey))
  Handlebars.registerHelper('dlCheckCharacteristicsIsNull', (actorData) => _CheckCharacteristicsIsNull(actorData));  
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
  }
  else if (groupName === 'system.consumabletype') {
    attributes = ['', 'D', 'F', 'P', 'V', 'T']
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

function _CheckCharacteristicsIsNull(actorData) {
    if (actorData === null) {
        return true
    } else {
        return false
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


export function buildDropdownList(groupName, checkedKey) {
  let labelPrefix = 'DL.Attribute'
  let iconPrefix = 'dl-icon-'
  let useIcon = true

  if (groupName === 'path-type') return _buildPathTypeDropdownList(checkedKey)
  if (groupName === 'level.attributeSelect') return _buildPathAttributeSelectDropdownList(checkedKey)
  if (groupName.startsWith('level.attributeSelectTwoSet')) return _buildPathAttributeTwoSetDropdownList(groupName, checkedKey)
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

// ----------------------------------------------------

function _buildAvailabilityDropdownItem(groupName, checkedKey) {
  const attributes = ['', 'C', 'U', 'R', 'E']
  for (let attribute of attributes) {
    if (checkedKey != attribute) continue
    const label = attribute === '' ? i18n("DL.None") : i18n(`DL.Availability${attribute}`)
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
    const label = attribute === '' ? i18n("DL.ConsumableNone") : i18n(`DL.ConsumableType${attribute}`)
    let html =
      `<div class="dl-new-project-2 dropdown" name="${groupName}" value="${checkedKey}">
            <span style="width: 120px; text-align: center; text-overflow: ellipsis">${label} </span>
       </div>`
    return new Handlebars.SafeString(html)
  }
}
