/** Numeric guardrails, independent of shelf capacity and robot count. */
export const MAX_STOCK = 1_000_000_000;
export const MAX_CAPACITY = MAX_STOCK * 10;
export const MAX_ORDER = 1_000_000;
export const safeQuantity = (value:number, maximum=MAX_STOCK) => Number.isSafeInteger(value) && value > 0 && value <= maximum;
