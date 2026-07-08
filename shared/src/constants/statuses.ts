export const carSearchStatuses = ["active", "paused", "purchased"] as const;
export const tradeInStrategies = ["separate", "included", "none"] as const;
export const financingStrategies = ["separate", "included", "cash"] as const;
export const dealerStatuses = [
  "not_contacted",
  "contacted",
  "needs_reply",
  "quoted",
  "negotiating",
  "rejected",
  "finalist",
  "purchased_from"
] as const;
export const priorities = ["low", "medium", "high"] as const;
export const quoteCompleteness = ["complete", "partial", "unclear"] as const;
export const confidenceLevels = ["low", "medium", "high"] as const;
