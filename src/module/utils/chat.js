/**
 * 
 * @param {[]} a 
 * @param {[]} b 
 */
export function changesMatch(a, b) {
    // Falsy arrays are not equal to each other
    if (!a || !b) return false

    // Check for same reference
    if (a === b) return true

    // Check length
    if (a.length != b.length) return false

    // Check each element (order matters)
    for (let i = 0; i < a.length; i++) {
        if (a[i].key !== b[i].key || a[i].mode !== b[i].mode || a[i].value !== b[i].value) return false
    }

    return true
}