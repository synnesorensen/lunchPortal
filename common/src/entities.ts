import type { Nok } from "./money.js";

/** Catalog row: one sellable thing (replaces legacy “delivery” as a product). */
export interface ItemDefinition {
  readonly itemId: string;
  readonly name: string;
  /** Price when tied to subscription / prepaid rules. */
  readonly subscriberPriceNok: Nok;
  /** Price for ad hoc orders (post-pay or invoiced). */
  readonly adHocPriceNok: Nok;
  /** Weekday availability etc. — expand when modeling schedules. */
  readonly availableWeekdayIndexes: readonly number[];
}

/** Single line on a customer’s financial journal (admin + customer views derive from this). */
export interface LedgerEntry {
  readonly entryId: string;
  readonly userId: string;
  readonly createdAtIso: string;
  readonly amountNok: Nok;
  readonly memo: string;
}

/** Placed order / reservation — details TBD when porting flows from legacy. */
export interface Order {
  readonly orderId: string;
  readonly userId: string;
  readonly createdAtIso: string;
}
