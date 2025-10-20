// A better switch case
export function select(selector, cases) {
  let chosen = cases[selector];
  if (chosen === undefined && cases["default"] !== undefined) {
    chosen = cases["default"];
  }
  if (typeof chosen === "function") {
    chosen = chosen();
  }
  return chosen;
}
