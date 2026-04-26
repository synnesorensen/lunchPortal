/** Whole kroner only (no øre, no floats in the type system). */
declare const nokBrand: unique symbol;

export type Nok = number & { readonly [nokBrand]: "Nok" };

export function assertNok(value: number): Nok {
  if (!Number.isInteger(value)) {
    throw new Error(`Nok must be a whole integer NOK, got: ${String(value)}`);
  }
  return value as Nok;
}
