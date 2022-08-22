import {capitalize, enrichHTMLUnrolled, i18n} from "./utils";
import {handlebarsBuildEditor} from "./editor";

export function registerHandlebarsHelpers() {

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function () {
    var outStr = ''
    for (var arg in arguments) {
      if (typeof arguments[arg] !== 'object') {
        outStr += arguments[arg]
      }
    }
    return outStr
  })

  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase()
  })

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

  Handlebars.registerHelper('plusify', x => (!x ? "0" : (x > 0 ? '+'+x : x)))

  Handlebars.registerHelper('defaultValue', function (a, b) {
    return a ? a : b;
  });

  Handlebars.registerHelper('enrichHTMLUnrolled', (x) => enrichHTMLUnrolled(x))

  Handlebars.registerHelper('lookupAttributeModifier', (attributeName, actorData) =>
    actorData?.data?.attributes[attributeName.toLowerCase()]?.modifier
  )

  Handlebars.registerHelper('dlRadioBoxes', (groupName, checkedKey) => _buildRadioBoxes(groupName, checkedKey))
  Handlebars.registerHelper('dlDropdown', (groupName, checkedKey) => _buildDropdownItem(groupName, checkedKey))

  Handlebars.registerHelper('dlEditor',  (options) => handlebarsBuildEditor(options))
}

// ----------------------------------------------------

function _getAttributes(groupName) {
  let attributes = []
  if (groupName === 'data.action.attack' || groupName === 'data.action.defense') {
    attributes = ['', 'strength', 'agility', 'intellect', 'will', 'perception']
  } else if (groupName === 'data.action.against') {
    attributes = ['', 'defense', 'strength', 'agility', 'intellect', 'will', 'perception']
  } else if (groupName === 'data.attribute') {
    attributes = ['', 'intellect', 'will']
  }
  console.log(attributes)
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
    html += `
<div class="dl-new-project-radio ${checked}" data-tippy-content="${tooltip}">
    <input type="radio" name="${groupName}" value="${value}" ${checked}/>
    <i class="dl-icon-${attribute}"></i>
</div>
`
  }
  return new Handlebars.SafeString(html)
}

// ----------------------------------------------------

function _buildDropdownItem(groupName, checkedKey) {
  let attributes = _getAttributes(groupName)
  let html = ""
  checkedKey = checkedKey === 'null' ? '' : checkedKey
  for (let attribute of attributes) {
    const value = capitalize(attribute)
    const checked = value === checkedKey ? 'checked' : ''
    if (!checked) continue
    const label = value ? i18n(`DL.Attribute${value}`) : i18n('DL.None')
    const icon = value ? `dl-icon-${attribute}` : 'dl-icon-nothing'
    html += `
<div class="dl-new-project-2 dropdown" name="${groupName}" value="${value}">
    <i class="${icon}"></i>
    <span class="sep"></span>
    <span>${label}</span>
</div>`
    break
  }
  return new Handlebars.SafeString(html)
}

export function buildDropdownList(groupName, checkedKey) {
  let attributes = _getAttributes(groupName)

  let html = `<div class="dl-new-project-2-dropdown">`
  for (let attribute of attributes) {
    const value = capitalize(attribute)
    const checked = value === checkedKey ? 'checked' : ''
    const label = value ? i18n(`DL.Attribute${value}`) : i18n('DL.None')
    const icon = value ? `dl-icon-${attribute}` : 'dl-icon-nothing'
    html += `
<div class="${checked}">
    <input type="radio" name="${groupName}" value="${value}" ${checked}/>
    <i class="${icon}"></i>
    <span class="sep"></span>
    <span>${label}</span>
</div>`
  }
  html += `</div>`
  return new Handlebars.SafeString(html)
}

// ----------------------------------------------------
