export const DEFAULT_CATEGORIES = ["Airtime", "Transport", "POS Charges", "Food"] as const
export type Category = (typeof DEFAULT_CATEGORIES)[number]
