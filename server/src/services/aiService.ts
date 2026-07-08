import OpenAI from "openai";
import { aiParsedDealerMessageSchema, type AIParsedDealerMessage } from "@dealdesk/shared";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

export interface AIClient {
  parseDealerMessage(input: { rawText: string }): Promise<unknown>;
  generateReply(input: { tone?: string; userGoal?: string }): Promise<{ replyText: string; strategyNotes: string; suggestedFollowUpTitle: string; suggestedFollowUpDueAt?: string }>;
}

class OpenAIClient implements AIClient {
  private client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : undefined;

  async parseDealerMessage(input: { rawText: string }) {
    if (!this.client) return devFallbackParse(input.rawText);
    const response = await this.client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: "Extract car dealer quote details as strict JSON. Keep trade and financing separate unless explicit." },
        { role: "user", content: input.rawText }
      ],
      text: { format: { type: "json_object" } }
    });
    try {
      return JSON.parse(response.output_text);
    } catch {
      throw new HttpError(502, "AI response was not valid JSON");
    }
  }

  async generateReply(input: { tone?: string; userGoal?: string }) {
    const dueAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    return {
      replyText: `Thanks for the details. Please send an itemized out-the-door price with taxes, title, registration, doc fee, incentives, and any required add-ons separated. ${input.userGoal ?? ""}`.trim(),
      strategyNotes: `Use a ${input.tone ?? "friendly"} tone and keep financing/trade-in separate.`,
      suggestedFollowUpTitle: "Follow up on itemized out-the-door quote",
      suggestedFollowUpDueAt: dueAt
    };
  }
}

let client: AIClient = new OpenAIClient();

export function setAIClient(nextClient: AIClient) {
  client = nextClient;
}

export async function parseDealerMessage(rawText: string): Promise<AIParsedDealerMessage> {
  const parsed = aiParsedDealerMessageSchema.safeParse(await client.parseDealerMessage({ rawText }));
  if (!parsed.success) throw new HttpError(502, "AI response failed validation");
  return parsed.data;
}

export async function generateReply(input: { tone?: string; userGoal?: string }) {
  return client.generateReply(input);
}

function devFallbackParse(rawText: string): AIParsedDealerMessage {
  const otd = rawText.match(/\$?([0-9]{2,3},?[0-9]{3})\s*(?:otd|out-the-door)/i)?.[1];
  const selling = rawText.match(/selling(?: price)?\D+\$?([0-9]{2,3},?[0-9]{3})/i)?.[1];
  return {
    dealer: {},
    vehicle: {},
    offer: {
      sellingPrice: selling ? Number(selling.replace(",", "")) : undefined,
      otdPrice: otd ? Number(otd.replace(",", "")) : undefined,
      quoteCompleteness: otd ? "partial" : "unclear"
    },
    redFlags: otd ? [] : ["Missing itemized out-the-door price"],
    missingInfo: ["tax", "titleRegistration"],
    suggestedNextStep: "Ask for an itemized out-the-door quote.",
    suggestedReply: "Thanks. Can you send the full itemized out-the-door price with all fees and required add-ons separated?",
    confidence: "medium"
  };
}
