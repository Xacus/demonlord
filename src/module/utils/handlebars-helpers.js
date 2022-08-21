import {capitalize, enrichHTMLUnrolled, i18n} from "./utils";

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

  Handlebars.registerHelper('plusify', x => (x >= 0 ? '+' + x : x))

  Handlebars.registerHelper('defaultValue', function (a, b) {
    return a ? a : b;
  });

  Handlebars.registerHelper('enrichHTMLUnrolled', (x) => enrichHTMLUnrolled(x))

  Handlebars.registerHelper('lookupAttributeModifier', (attributeName, actorData) =>
    actorData?.data?.attributes[attributeName.toLowerCase()]?.modifier
  )

  Handlebars.registerHelper('dlRadioBoxes', (groupName, checkedKey) => _buildRadioBoxes(groupName, checkedKey))
}

// ----------------------------------------------------

function _buildRadioBoxes(groupName, checkedKey) {
  let html = ""
  let attributes = []
  if (groupName === 'data.action.attack') {
    attributes = ['strength', 'agility', 'intellect', 'will', 'perception']
  } else if (groupName === 'data.action.against') {
    attributes = ['defense', 'strength', 'agility', 'intellect', 'will', 'perception']
  }

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
