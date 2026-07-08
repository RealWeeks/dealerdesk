export type User = {
  id: string;
  email: string;
};

export type CarSearch = {
  _id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  zipCode: string;
  searchRadiusMiles: number;
  targetSellingPrice?: number;
  targetOtdPrice?: number;
  willingToTravel?: boolean;
  willingToShip?: boolean;
  tradeInStrategy?: "separate" | "included" | "none";
  financingStrategy?: "separate" | "included" | "cash";
  status: "active" | "paused" | "purchased";
};

export type DealerSeed = {
  _id: string;
  name: string;
  brand: string;
  city: string;
  state: string;
  phone?: string;
  websiteUrl?: string;
  inventoryUrl?: string;
  distanceMiles: number;
};

export type SearchDealer = {
  _id: string;
  carSearchId: string;
  dealerSeedId: string;
  name: string;
  brand: string;
  city: string;
  state: string;
  phone?: string;
  websiteUrl?: string;
  inventoryUrl?: string;
  distanceMiles?: number;
  status: string;
  priority: "low" | "medium" | "high";
  lastContactedAt?: string;
  nextFollowUpAt?: string;
};

export type Offer = {
  _id: string;
  dealerId: string;
  vehicleId?: string;
  msrp?: number;
  sellingPrice?: number;
  dealerDiscount?: number;
  incentives?: number;
  docFee?: number;
  tax?: number;
  titleRegistration?: number;
  deliveryFee?: number;
  otdPrice?: number;
  tradeAllowance?: number;
  payoff?: number;
  apr?: number;
  termMonths?: number;
  monthlyPayment?: number;
  downPayment?: number;
  addOns?: { name: string; amount?: number; required?: boolean }[];
  quoteCompleteness: "complete" | "partial" | "unclear";
  redFlags?: string[];
  missingInfo?: string[];
  confidence?: "low" | "medium" | "high";
  sourceType?: "manual" | "paste" | "screenshot" | "dictation";
  sourceText?: string;
};

export type Interaction = {
  _id: string;
  dealerId?: string;
  offerId?: string;
  type: "email" | "text" | "phone" | "in_person" | "note";
  direction: "inbound" | "outbound" | "internal";
  rawContent: string;
  aiSummary?: string;
  aiSuggestedNextStep?: string;
  createdAt?: string;
};

export type Task = {
  _id: string;
  dealerId?: string;
  title: string;
  dueAt?: string;
  status: "open" | "done";
};

export type GeneratedReply = {
  replyText: string;
  strategyNotes: string;
  suggestedFollowUpTitle: string;
  suggestedFollowUpDueAt?: string;
};

export type InitialOutreachMessage = {
  templateId?: string;
  templateName?: string;
  category?: string;
  tone?: string;
  messageText: string;
  strategyNotes: string;
  usedWithThisDealer?: boolean;
  lastUsedAt?: string;
};

export type MessageTemplate = {
  _id: string;
  name: string;
  category: "initial_outreach" | "follow_up" | "otd_request" | "add_on_removal" | "beat_offer" | "final_offer" | "polite_decline";
  tone: "casual" | "friendly" | "firm" | "concise";
  body: string;
  variables: string[];
  isBuiltIn: boolean;
  isActive: boolean;
  usedWithThisDealer?: boolean;
  lastUsedAt?: string;
};

export type TimelineItem = {
  id: string;
  type: "interaction" | "offer" | "task" | "ai_extraction" | "template_usage" | "dealer_status";
  occurredAt: string;
  title: string;
  summary: string;
  metadata: Record<string, unknown>;
};

export type AIExtraction = {
  extractionId: string;
  dealer: Record<string, string | undefined>;
  vehicle: Record<string, string | number | string[] | undefined>;
  offer: {
    msrp?: number;
    sellingPrice?: number;
    otdPrice?: number;
    quoteCompleteness: "complete" | "partial" | "unclear";
  };
  redFlags: string[];
  missingInfo: string[];
  suggestedNextStep: string;
  suggestedReply: string;
  confidence: "low" | "medium" | "high";
};
