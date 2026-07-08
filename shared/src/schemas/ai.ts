import { z } from "zod";

export const aiParsedDealerMessageSchema = z.object({
  dealer: z.object({
    name: z.string().optional(),
    salespersonName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional()
  }).default({}),
  vehicle: z.object({
    year: z.number().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
    trim: z.string().optional(),
    vin: z.string().optional(),
    stockNumber: z.string().optional(),
    msrp: z.number().optional(),
    listedPrice: z.number().optional(),
    exteriorColor: z.string().optional(),
    interiorColor: z.string().optional(),
    packages: z.array(z.string()).optional(),
    listingUrl: z.string().optional()
  }).default({}),
  offer: z.object({
    msrp: z.number().optional(),
    sellingPrice: z.number().optional(),
    dealerDiscount: z.number().optional(),
    incentives: z.number().optional(),
    docFee: z.number().optional(),
    tax: z.number().optional(),
    titleRegistration: z.number().optional(),
    deliveryFee: z.number().optional(),
    addOns: z.array(z.object({ name: z.string(), amount: z.number().optional(), required: z.boolean().optional() })).optional(),
    tradeAllowance: z.number().optional(),
    payoff: z.number().optional(),
    apr: z.number().optional(),
    termMonths: z.number().optional(),
    monthlyPayment: z.number().optional(),
    downPayment: z.number().optional(),
    otdPrice: z.number().optional(),
    quoteCompleteness: z.enum(["complete", "partial", "unclear"])
  }),
  redFlags: z.array(z.string()),
  missingInfo: z.array(z.string()),
  suggestedNextStep: z.string(),
  suggestedReply: z.string(),
  confidence: z.enum(["low", "medium", "high"])
});

export type AIParsedDealerMessage = z.infer<typeof aiParsedDealerMessageSchema>;
