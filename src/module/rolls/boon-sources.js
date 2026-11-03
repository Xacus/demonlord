/** Temporary, per-roll contributions. Existing actor and item data remain authoritative. */
const number = value => parseInt(value) || 0
const localize = key => game.i18n.localize(key)
export const escapeSource = value =>
  String(value ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  )

export function collectBoonSources(actor, { kind = 'attack', attribute, defense, item, target, category } = {}) {
  const sources = []
  const add = (id, label, value, hidden = false) => {
    if (value) sources.push({ id, label, value, enabled: true, hidden })
  }
  const collect = (owner, key, sign = 1, hidden = false) => {
    if (!owner) return
    const total = number(foundry.utils.getProperty(owner, key))
    const changes = Array.from(owner.allApplicableEffects())
      .filter(e => !e.disabled && !e.isSuppressed)
      .flatMap(e => e.changes.map((c, index) => ({ effect: e, change: c, index })))
      .filter(c => c.change.key === key)
    // Only split additive, literal changes when they fully explain the prepared value.
    const safe =
      changes.every(({ change }) => Number(change.mode) === 2 && /^-?\d+$/.test(String(change.value))) &&
      changes.reduce((sum, { change }) => sum + number(change.value), 0) === total
    if (safe)
      changes.forEach(({ effect, change, index }) => {
        const reveal =
          hidden &&
          effect.name?.startsWith(localize('DL.surrounded')) &&
          game.settings.get('demonlord', 'optionalRuleSurroundingRevealChatCard')
        add(
          `${owner.uuid}:${key}:${effect.id}:${index}`,
          `${effect.name}${sign < 0 ? ` [${localize('DL.ActionTarget')}: ${owner.name || ''}]` : ''}`,
          sign * number(change.value),
          hidden && !reveal,
        )
      })
    else
      add(
        `${owner.uuid}:${key}`,
        `${localize('DL.ModsListBoonsBanes')} (${key.split('.').pop()})`,
        sign * total,
        hidden,
      )
  }
  const prefix = `system.bonuses.${kind}.boons`
  for (const key of new Set([attribute, 'all', category].filter(Boolean))) collect(actor, `${prefix}.${key}`)
  if (kind === 'attack') {
    add(`item:${item?.uuid}`, item?.name, number(item?.system.action?.boonsbanes))
    for (const key of new Set([defense, 'all', category].filter(Boolean)))
      collect(target, `system.bonuses.defense.boons.${key}`, -1, true)
    add(
      `target:${target?.uuid}:fear`,
      localize('DL.CreatureHorrifying'),
      -number(actor.getTargetAttackBane(target)),
      !game.settings.get('demonlord', 'optionalRuleRevealHorrifyingBane'),
    )
    if (
      category === 'weapon' &&
      item?.system.wear &&
      number(item.system.requirement?.minvalue) > actor.getAttribute(item.system.requirement?.attribute)?.value
    )
      add(`item:${item.uuid}:requirement`, localize('DL.Requirement'), -1)
  }
  return sources
}

export function applyBoonSelection(sources, legacyTotal, input, selection) {
  const disabled = new Set(selection?.disabled || [])
  const applied = sources.map(source => ({ ...source, enabled: !disabled.has(source.id) }))
  if (number(input))
    applied.push({ id: 'manual', label: localize('DL.DialogInput'), value: number(input), enabled: true })
  // Preserve changes made by macros or modules between opening the dialog and rolling.
  const explained = sources.reduce((sum, source) => sum + source.value, number(input))
  if (legacyTotal !== explained)
    applied.push({ id: 'other', label: localize('DL.OtherUnknown'), value: legacyTotal - explained, enabled: true })
  const total = applied.filter(s => s.enabled).reduce((sum, s) => sum + s.value, 0)
  return { total, sources: applied }
}

export function sourceMessage(sources) {
  if (!sources) return null
  const rows = sources
    .filter(s => s.enabled)
    .map(s => {
      const label = escapeSource(s.label)
      const value = s.value > 0 ? `+${s.value}` : s.value
      return s.hidden
        ? `<div class="gmonly">• ${value} (${label})</div><div class="gmremove">• ${value} (${escapeSource(
            localize('DL.OtherUnknown'),
          )})</div>`
        : `<div>• ${value} (${label})</div>`
    })
    .join('')
  return `<div>${escapeSource(localize('DL.ModsListBoonsBanes'))}${rows}</div>`
}
