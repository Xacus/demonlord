export const i18n = s => game.i18n.localize(s)

export function capitalize(string) {
  return string?.charAt(0).toUpperCase() + string?.toLowerCase().slice(1)
}

export function plusify(x) {
  if (typeof x === 'string' || x instanceof String) {
    return x[0] === '+' ? x : '+' + x
  }
  if (x == 0) return ''
  return x > 0 ? '+' + x : x
}

/**
 * Variant of TextEditor._createInlineRoll for creating unrolled inline rolls.
 * src: https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1/-/merge_requests/360/diffs
 */
export function createInlineFormula(_match, _command, formula, closing, label, ...args) {
  const rollData = args.pop();
  if (closing.length === 3) formula += "]"; // What does this even do?

  const e_formula = Roll.replaceFormulaData(formula, rollData, { missing: 0, warn: true });
  const cls = ["inline-preroll", "inline-formula"];
  label = label ? `${label}: ${e_formula}` : e_formula;

  // Format return value
  const a = document.createElement("a");
  a.classList.add(...cls);
  a.title = formula;
  a.innerHTML = `<i class="fas fa-dice-d20"></i> ${label}`;
  return a;
}

/**
 * enrichHTML but with inline rolls not rolled
 * src: https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1/-/merge_requests/360/diffs
 */
export async function enrichHTMLUnrolled(content, {rollData, secrets, rolls, entities} = {}) {
  let pcontent = await TextEditor.enrichHTML(content, {secrets, rolls, entities, rollData, async:true});

  if (!rolls) {
    const html = document.createElement("div");
    html.innerHTML = String(pcontent);
    const text = await TextEditor._getTextNodes(html);
    const rgx = /\[\[(\/[a-zA-Z]+\s)?(.*?)([\]]{2,3})(?:{([^}]+)})?/gi;
    await TextEditor._replaceTextContent(text, rgx, (...args) => createInlineFormula(...args, rollData));
    pcontent = html.innerHTML;
  }

  return pcontent;
}

/** Maps a number from a given range to an equivalent number of another range */
export function MapRange(num, inMin, inMax, outMin, outMax) {
    if (inMin === inMax || outMin === outMax)
        return 0;
    const mapped = ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    return Math.clamp(mapped, outMin, outMax);
}


// -----------------------------------------------


