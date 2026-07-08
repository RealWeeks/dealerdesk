import type { AIExtraction, CarSearch, DealerSeed, GeneratedReply, InitialOutreachMessage, Interaction, MessageTemplate, Offer, SearchDealer, Task, TimelineItem, User } from "../types/domain";

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function apiFetch<T>(path: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // Keep the status-based fallback when the server does not return JSON.
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  register: (body: { email: string; password: string }) =>
    apiFetch<{ token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    apiFetch<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: (token: string) => apiFetch<{ user: User }>("/me", { token }),
  activeSearch: (token: string) => apiFetch<CarSearch | null>("/car-searches/active", { token }),
  createSearch: (token: string, body: Omit<CarSearch, "_id">) =>
    apiFetch<CarSearch>("/car-searches", { method: "POST", token, body: JSON.stringify(body) }),
  updateSearch: (token: string, carSearchId: string, body: Partial<Omit<CarSearch, "_id">>) =>
    apiFetch<CarSearch>(`/car-searches/${carSearchId}`, { method: "PATCH", token, body: JSON.stringify(body) }),
  searchDealerSeeds: (params: { brand: string; zip: string; radius: number }) =>
    apiFetch<DealerSeed[]>(`/dealer-seeds/search?brand=${encodeURIComponent(params.brand)}&zip=${encodeURIComponent(params.zip)}&radius=${params.radius}`),
  addDealer: (token: string, carSearchId: string, dealerSeedId: string) =>
    apiFetch<SearchDealer>(`/car-searches/${carSearchId}/dealers`, { method: "POST", token, body: JSON.stringify({ dealerSeedId }) }),
  searchDealers: (token: string, carSearchId: string) =>
    apiFetch<SearchDealer[]>(`/car-searches/${carSearchId}/dealers`, { token }),
  dealer: (token: string, dealerId: string) => apiFetch<SearchDealer>(`/dealers/${dealerId}`, { token }),
  updateDealer: (token: string, dealerId: string, body: Partial<Pick<SearchDealer, "status" | "priority">> & { lastContactedAt?: string; nextFollowUpAt?: string }) =>
    apiFetch<SearchDealer>(`/dealers/${dealerId}`, { method: "PATCH", token, body: JSON.stringify(body) }),
  offers: (token: string, carSearchId: string) => apiFetch<Offer[]>(`/car-searches/${carSearchId}/offers`, { token }),
  createOffer: (token: string, carSearchId: string, body: Omit<Offer, "_id">) =>
    apiFetch<Offer>(`/car-searches/${carSearchId}/offers`, { method: "POST", token, body: JSON.stringify(body) }),
  dealerInteractions: (token: string, dealerId: string) => apiFetch<Interaction[]>(`/dealers/${dealerId}/interactions`, { token }),
  createInteraction: (token: string, carSearchId: string, body: Omit<Interaction, "_id" | "createdAt">) =>
    apiFetch<Interaction>(`/car-searches/${carSearchId}/interactions`, { method: "POST", token, body: JSON.stringify(body) }),
  createTask: (token: string, carSearchId: string, body: Pick<Task, "title" | "dealerId" | "dueAt">) =>
    apiFetch<Task>(`/car-searches/${carSearchId}/tasks`, { method: "POST", token, body: JSON.stringify(body) }),
  messageTemplates: (token: string, params: { category?: string; dealerId?: string; includeUsed?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.set("category", params.category);
    if (params.dealerId) query.set("dealerId", params.dealerId);
    if (params.includeUsed !== undefined) query.set("includeUsed", String(params.includeUsed));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<MessageTemplate[]>(`/message-templates${suffix}`, { token });
  },
  dealerTimeline: (token: string, dealerId: string) =>
    apiFetch<{ items: TimelineItem[] }>(`/dealers/${dealerId}/timeline`, { token }),
  initialOutreachMessage: (token: string, body: { carSearchId: string; dealerId?: string; templateId?: string; tone?: "friendly" | "firm" | "concise" }) =>
    apiFetch<InitialOutreachMessage>("/outreach/initial-message", { method: "POST", token, body: JSON.stringify(body) }),
  markOutreachContacted: (token: string, body: { carSearchId: string; dealerIds: string[]; messageText: string; templateId?: string; createFollowUp: boolean; followUpDueAt?: string }) =>
    apiFetch<{ dealers: SearchDealer[]; interactions: Interaction[]; tasks: Task[]; templateUsages?: unknown[] }>("/outreach/mark-contacted", { method: "POST", token, body: JSON.stringify(body) }),
  parseDealerMessage: (token: string, body: { carSearchId: string; dealerId: string; rawText: string }) =>
    apiFetch<AIExtraction>("/ai/parse-dealer-message", { method: "POST", token, body: JSON.stringify(body) }),
  generateReply: (token: string, body: { carSearchId: string; dealerId: string; offerId?: string; tone?: "friendly" | "firm" | "concise"; userGoal?: string }) =>
    apiFetch<GeneratedReply>("/ai/generate-reply", { method: "POST", token, body: JSON.stringify(body) }),
  confirmExtraction: (token: string, extractionId: string) =>
    apiFetch<{ extraction: unknown; offer: Offer | null; interaction: unknown }>(`/ai-extractions/${extractionId}/confirm`, { method: "POST", token })
};
