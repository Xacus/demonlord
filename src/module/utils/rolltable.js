/**
 * Modified version of the awesome https://github.com/saif-ellafi/foundryvtt-rolltable-from-sidebar
 * Big thanks to Saif Addin
 */

export function _renderRollTableDirectory(html) {
  if (!game.settings.get('demonlord', 'enableQuickDraw')) return
  const tables = $(html).find('.directory-item.document')
  tables.each(k => {
    let rollIcon = document.createElement('dl')
    enrichRollTableSidebar(rollIcon, tables, k)
    rollIcon.addEventListener('click', rollTableFromSidebar)
  })
}

export function _renderCompendium(html, data) {
  if (!game.settings.get('demonlord', 'enableQuickDraw')) return
  if (data.collection.metadata.type !== 'RollTable') return
  const tables = $(html).find('.directory-item.document')
  tables.each(k => {
    let rollIcon = document.createElement('dl')
    enrichRollTableSidebar(rollIcon, tables, k)
    rollIcon.addEventListener('click', event =>
      rollTableFromCompendium(event, `${data.collection.metadata.packageName}.${data.collection.metadata.name}`),
    )
  })
}

export function _renderDLSheet(jn, element) {
  if (!game.settings.get('demonlord', 'enableQuickDraw')) return
  $(element)
    .find('.content-link')
    .contextmenu(elem => {
      linkContextDraw(elem.currentTarget)
    })
}

function linkContextDraw(target) {
  if (target.getAttribute('data-pack')) {
    const pack = game.packs.get(target.getAttribute('data-pack'))
    if (pack?.metadata.type === 'RollTable') {
      pack.getDocuments().then(contents => {
        contents.find(t => t.id === target.getAttribute('data-id')).draw()
      })
    }
  } else if (target.getAttribute('data-type') === 'RollTable')
    game.tables.contents.find(t => t.id === target.getAttribute('data-id')).draw()
}

function enrichRollTableSidebar(rollIcon, tables, k) {
  rollIcon.classList.add('roll-table')
  rollIcon.setAttribute('data-action', 'roll-table')
  rollIcon.setAttribute('title', game.i18n.localize('TABLE.ACTIONS.DrawResult'))
  let die = document.createElement('i')
  die.classList.add('fas')
  die.classList.add('fa-dice')
  rollIcon.appendChild(die)
  tables[k].appendChild(rollIcon)
}

function rollTableFromSidebar(event) {
  const tableId = event.currentTarget.parentElement.dataset['entryId']
  const table = game.tables.get(tableId)
  table.draw()
}

function rollTableFromCompendium(event, pack) {
  const tableId = event.currentTarget.parentElement.dataset['entryId']
  game.packs
    .get(pack)
    .getDocument(tableId)
    .then(table => {
      table.draw()
    })
}
