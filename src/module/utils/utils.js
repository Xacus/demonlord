
export function capitalize(string) {
  return string?.charAt(0).toUpperCase() + string?.toLowerCase().slice(1)
}

export function plusify (x) {
  return x > 0 ? "+" + x : x
}
