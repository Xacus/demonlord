/**
 * Modified version of the awesome https://gitlab.com/mkahvi/fvtt-micro-modules/-/tree/master/reorder-initiative
 * Big thanks to Mana
 */


/**
 * Called when tracker activates listeners. It injects the draggable class and events to the combatant listings
 * @param html          combat tracker jquery html
 * @param combattracker the Combattracker
 */
export function injectDraggable(html, combattracker) {
  // For each combatant in the list, add the attributes "type" and "fastturn" for faster handling
  const currentCombat = combattracker.getCurrentCombat()
  html.find('li.combatant').each((_, el) => {
    const id = el.dataset.combatantId
    if (!id) return
    const combatant = currentCombat.combatants.get(id)
    if (!combatant) throw "Combatant not found in draggable injection"
    el.setAttribute('data-combatant-type', combatant.actor.type)
    el.setAttribute('data-combatant-fast', combatant.actor.system.fastturn)
  })

  // If GM, everything is draggable, for players only controlled combatants
  if (game.user.isGM)
    html.find('li.combatant').addClass('draggable').attr('draggable', true);
  else {
    const ownedIds = currentCombat.combatants.filter(c => c.isOwner).map(c => c._id)
    html.find('li.combatant')
      .filter((_, el) => ownedIds.includes(el.dataset.combatantId))
      .addClass('draggable').attr('draggable', true)
  }

  // Add the drag event listeners
  const listing = html.find('.directory-list').get(0);
  if (!listing) return console.error('User listing not found in combat tracker');
  listing.addEventListener('dragover', dragOverEvent, { passive: true });
  listing.addEventListener('dragleave', dragLeaveEvent, { passive: true });
  listing.addEventListener('dragenter', activeDragEvent, { passive: true });
  listing.addEventListener('drop', dropEvent, { passive: true });
  listing.addEventListener('dragstart', dragStartEvent, { passive: true });
}

/* -------------------------------------------- */
/*  Event Handlers                              */
/* -------------------------------------------- */

/**
 * Demonlord code: check if there is a mismatch in droppedCombatant and targetCombatant initiative speeds.
 * I.E. check if the actors are of the same type and same initiative speed
 * @param droppedCombatant
 * @param targetCombatant
 */
function areCombatantsCompatible(droppedCombatant, targetCombatant) {
  const droppedActor = droppedCombatant.actor
  const targetActor = targetCombatant.actor
  return droppedActor.type === targetActor.type && droppedActor.system.fastturn === targetActor.system.fastturn
}

/**
 * Demonlord code: check if there is a mismatch in current and target elements, by looking at their DOM attributes.
 * @param {Element} el the element
 */
function isElementCompatible(el) {
  return (currentType === el.dataset.combatantType && currentFast === el.dataset.combatantFast)
}

const combatantMatch = '.directory-list .directory-item[data-combatant-id]';

let dragId, currentId, currentValidEl, entered = false;
let currentType, currentFast = false

function altEventHandler(ev) {
  const alt = ev.altKey;
  currentValidEl?.classList.remove(alt ? 'drag-hover-over' : 'drag-hover-under');
  currentValidEl?.classList.add('drag-hover', alt ? 'drag-hover-under' : 'drag-hover-over');
}



async function updateCombatant(combatantId, initiative, { diff = 0 } = {}) {
  // if (!game.user.isGM) return;
  const combat = game.combat
  const turn = combat.turn
  const activeTurn = combat.combatant?.id === combatantId;

  if (!activeTurn) return combat.updateEmbeddedDocuments('Combatant', [{ _id: combatantId, initiative }]);

  const newTurn = diff < 0 ? Math.clamped(turn + 1, 0, combat.turns.length - 1) : turn;

  await combat.update({
    turn: newTurn,
    combatants: [{ _id: combatantId, initiative }]
  });
}

/**
 * @param {Event} ev
 */
function dragStartEvent(ev) {
  const el = ev.target;
  /** @type {Element} */
  const c = el.matches(combatantMatch) ? el : el.closest(combatantMatch);
  if (!c) return false;

  const d = c.dataset;
  dragId = d.combatantId;
  currentId = d.combatantId;
  currentType = d.combatantType
  currentFast = d.combatantFast

  ev.stopPropagation(); // Dragging from image doesn't work without this for some reason.

  ev.dataTransfer.setData('text/plain', JSON.stringify(d));
  ev.dataTransfer.effectAllowed = 'move';

  ev.dataTransfer.setDragImage(c, c.clientLeft + 60, c.clientTop + 30);
  // ev.dataTransfer.setDragImage(c, c.offsetX + 60, c.offsetY + 30);

  c.classList.add('drag-source-active');

  document.body.addEventListener('dragend', () => {
    currentId = dragId = undefined;
    c.classList.remove('drag-source-active');
  }, { passive: true, once: true });

  return true;
}

function dragOverEvent(ev) {
  if (!dragId) return;

  const el = ev.target,
    c = el.matches(combatantMatch) ? el : el.closest(combatantMatch);

  if (!c) return false;
  // Check if the target c is compatible
  if (!isElementCompatible(c)) return false

  currentValidEl = c;
  altEventHandler(ev);
}

/**
 * Purely for the bling
 *
 * @param {DragEvent} ev
 */
function activeDragEvent(ev) {
  if (!dragId) return;

  let curEl = ev.target;
  if (!curEl.matches(combatantMatch)) {
    const childEl = curEl.closest(combatantMatch);
    if (!childEl) {
      currentId = undefined;
      return;
    }
    curEl = childEl;
  }

  currentValidEl = curEl;
  entered = true;

  const targetId = curEl.dataset.combatantId;
  const allowed = dragId !== targetId && isElementCompatible(currentValidEl);

  ev.dataTransfer.dropEffect = allowed ? 'move' : 'none';
  if (!isElementCompatible(curEl)) return false
  if (currentId === targetId) return;
  currentId = targetId;

  altEventHandler(ev);
}

/**
 * Purely for the bling
 *
 * @param {DragEvent} ev
 */
function dragLeaveEvent(ev) {
  if (!dragId) return;

  let curEl = ev.target;
  if (!curEl.matches(combatantMatch)) {
    const childEl = curEl.closest(combatantMatch);
    if (!childEl) return;
    curEl = childEl;
  }

  if (entered) currentValidEl = null;
  entered = false;

  const targetId = curEl.dataset.combatantId;

  if (currentId !== targetId || !this.contains(ev.relatedTarget))
    curEl.classList.remove('drag-hover', 'drag-hover-under', 'drag-hover-over');
}

/**
 * @param {DragEvent} ev
 */
function dropEvent(ev) {
  if (!dragId) return;

  const recordedId = dragId;
  dragId = undefined;

  const dropEl = ev.target,
    targetEl = dropEl.matches(combatantMatch) ? dropEl : dropEl.closest(combatantMatch),
    combatantId = targetEl?.dataset.combatantId;

  const alt = ev.altKey;
  targetEl.classList.remove('drag-hover', 'drag-hover-under', 'drag-hover-over');
  if (!combatantId) return;

  const combat = game.combat;
  if (!combat) return;

  let dropped;
  try {
    dropped = JSON.parse(ev.dataTransfer.getData('text/plain'));
  }
  catch (err) {
    return;
  }

  if (recordedId !== dropped?.combatantId) return; // Record of drop item mismatch

  const droppedCombatant = game.combat.combatants.get(dropped?.combatantId),
    targetCombatant = game.combat.combatants.get(combatantId);
  if (!droppedCombatant || !targetCombatant) return;
  if (droppedCombatant.id === targetCombatant.id) return; // dropped onto itself

  const adjacentCombatantEl = alt ? targetEl.nextElementSibling : targetEl.previousElementSibling,
    adjacentCombatant = game.combat.combatants.get(adjacentCombatantEl?.dataset?.combatantId);
  if (adjacentCombatant && droppedCombatant.id === adjacentCombatant.id) return; // drop shift into its original spot

  // TODO: Add broader support to different initiative rules
  if (!areCombatantsCompatible(droppedCombatant, targetCombatant)) return
  let initDiff = adjacentCombatant?.initiative !== undefined ? adjacentCombatant.initiative - targetCombatant.initiative : 0;

  if (initDiff > 0)
    initDiff = Math.min(1, initDiff / 2);
  else if (initDiff < 0)
    initDiff = Math.max(-1, initDiff / 2);
  else
    initDiff = alt ? -1 : 1;

  updateCombatant(droppedCombatant.id, targetCombatant.initiative + initDiff, { diff: initDiff });
}
