import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { api } from "../api/client";
import { clearStoredToken, getStoredToken, storeToken } from "../api/tokenStore";
import type { AIExtraction, CarSearch, DealerSeed, GeneratedReply, InitialOutreachMessage, Interaction, MessageTemplate, Offer, SearchDealer, Task, TimelineItem, User } from "../types/domain";

export type AppContextValue = {
  token: string | null;
  user: User | null;
  activeSearch: CarSearch | null;
  dealers: SearchDealer[];
  offers: Offer[];
  selectedDealer: SearchDealer | null;
  pendingExtraction: AIExtraction | null;
  generatedReply: GeneratedReply | null;
  initialOutreach: InitialOutreachMessage | null;
  interactions: Interaction[];
  tasks: Task[];
  messageTemplates: MessageTemplate[];
  timeline: TimelineItem[];
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createDefaultSearch: () => Promise<void>;
  saveSearch: (search: Omit<CarSearch, "_id">) => Promise<boolean>;
  searchDealerSeeds: (brand: string, zip: string, radius: number) => Promise<DealerSeed[]>;
  addDealer: (dealerSeedId: string) => Promise<void>;
  saveManualQuote: (offer: Omit<Offer, "_id" | "dealerId" | "sourceType">) => Promise<boolean>;
  selectDealer: (dealer: SearchDealer | null) => void;
  parseDealerMessage: (rawText: string) => Promise<void>;
  confirmPendingExtraction: () => Promise<void>;
  generateReply: () => Promise<void>;
  saveGeneratedReply: (replyText: string) => Promise<void>;
  createSuggestedFollowUp: () => Promise<void>;
  loadMessageTemplates: (dealerId?: string) => Promise<void>;
  generateInitialOutreach: (dealerId?: string, templateId?: string) => Promise<InitialOutreachMessage | null>;
  markOutreachContacted: (dealerIds: string[], messageText: string, createFollowUp?: boolean, templateId?: string) => Promise<void>;
  markSelectedDealerContacted: () => Promise<void>;
  refresh: () => Promise<void>;
};

const DealDeskContext = createContext<AppContextValue | undefined>(undefined);

export function DealDeskProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeSearch, setActiveSearch] = useState<CarSearch | null>(null);
  const [dealers, setDealers] = useState<SearchDealer[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<SearchDealer | null>(null);
  const [pendingExtraction, setPendingExtraction] = useState<AIExtraction | null>(null);
  const [generatedReply, setGeneratedReply] = useState<GeneratedReply | null>(null);
  const [initialOutreach, setInitialOutreach] = useState<InitialOutreachMessage | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadForToken = useCallback(async (nextToken: string) => {
    const [me, search] = await Promise.all([api.me(nextToken), api.activeSearch(nextToken)]);
    setUser(me.user);
    setActiveSearch(search);
    if (search?._id) {
      const [nextDealers, nextOffers] = await Promise.all([api.searchDealers(nextToken, search._id), api.offers(nextToken, search._id)]);
      setDealers(nextDealers);
      setOffers(nextOffers);
      setSelectedDealer((current) => nextDealers.find((dealer) => dealer._id === current?._id) ?? nextDealers[0] ?? null);
    } else {
      setDealers([]);
      setOffers([]);
      setSelectedDealer(null);
      setInteractions([]);
      setTimeline([]);
    }
  }, []);

  const run = useCallback(async (task: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await task();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run(async () => {
      const stored = await getStoredToken();
      if (stored) {
        try {
          setToken(stored);
          await loadForToken(stored);
        } catch {
          await clearStoredToken();
          setToken(null);
          setUser(null);
          setActiveSearch(null);
          setDealers([]);
          setOffers([]);
          setSelectedDealer(null);
          setPendingExtraction(null);
          setGeneratedReply(null);
          setInitialOutreach(null);
          setInteractions([]);
          setTasks([]);
          setMessageTemplates([]);
          setTimeline([]);
        }
      }
    });
  }, [loadForToken, run]);

  const authenticate = useCallback(async (mode: "login" | "register", email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = mode === "login" ? await api.login({ email, password }) : await api.register({ email, password });
      await storeToken(result.token);
      setToken(result.token);
      setUser(result.user);
      await loadForToken(result.token);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed");
      throw caught;
    } finally {
      setLoading(false);
    }
  }, [loadForToken, run]);

  const refresh = useCallback(async () => {
    if (!token) return;
    await run(() => loadForToken(token));
  }, [loadForToken, run, token]);

  const value = useMemo<AppContextValue>(() => ({
    token,
    user,
    activeSearch,
    dealers,
    offers,
    selectedDealer,
    pendingExtraction,
    generatedReply,
    initialOutreach,
    interactions,
    tasks,
    messageTemplates,
    timeline,
    loading,
    error,
    login: (email, password) => authenticate("login", email, password),
    register: (email, password) => authenticate("register", email, password),
    logout: async () => {
      await clearStoredToken();
      setToken(null);
      setUser(null);
      setActiveSearch(null);
      setDealers([]);
      setOffers([]);
      setSelectedDealer(null);
      setPendingExtraction(null);
      setGeneratedReply(null);
      setInitialOutreach(null);
      setInteractions([]);
      setTasks([]);
      setMessageTemplates([]);
      setTimeline([]);
    },
    createDefaultSearch: async () => {
      if (!token) return;
      await run(async () => {
        const search = await api.createSearch(token, {
          year: 2026,
          make: "Lexus",
          model: "RX 350h",
          trim: "Premium AWD",
          zipCode: "04101",
          searchRadiusMiles: 150,
          targetOtdPrice: 62000,
          status: "active"
        });
        setActiveSearch(search);
        setDealers([]);
        setOffers([]);
        setInteractions([]);
        setTasks([]);
        setMessageTemplates([]);
        setTimeline([]);
      });
    },
    saveSearch: async (searchInput) => {
      if (!token) return false;
      return run(async () => {
        const search = activeSearch?._id
          ? await api.updateSearch(token, activeSearch._id, searchInput)
          : await api.createSearch(token, searchInput);
        setActiveSearch(search);
        if (search._id) {
          const [nextDealers, nextOffers] = await Promise.all([api.searchDealers(token, search._id), api.offers(token, search._id)]);
          setDealers(nextDealers);
          setOffers(nextOffers);
          setSelectedDealer((current) => nextDealers.find((dealer) => dealer._id === current?._id) ?? nextDealers[0] ?? null);
        }
      });
    },
    searchDealerSeeds: async (brand, zip, radius) => {
      try {
        setError(null);
        return await api.searchDealerSeeds({ brand, zip, radius });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Dealer search failed");
        return [];
      }
    },
    addDealer: async (dealerSeedId) => {
      if (!token || !activeSearch) return;
      await run(async () => {
        const dealer = await api.addDealer(token, activeSearch._id, dealerSeedId);
        const nextDealers = await api.searchDealers(token, activeSearch._id);
        setDealers(nextDealers);
        setSelectedDealer(dealer);
      });
    },
    saveManualQuote: async (offerInput) => {
      if (!token || !activeSearch || !selectedDealer) return false;
      return run(async () => {
        await api.createOffer(token, activeSearch._id, { ...offerInput, dealerId: selectedDealer._id, sourceType: "manual" });
        setOffers(await api.offers(token, activeSearch._id));
      });
    },
    selectDealer: (dealer) => {
      setSelectedDealer(dealer);
      setGeneratedReply(null);
      setInitialOutreach(null);
      if (!token || !dealer) {
        setInteractions([]);
        setTimeline([]);
        return;
      }
      void run(async () => {
        const [nextInteractions, nextTimeline, nextTemplates] = await Promise.all([
          api.dealerInteractions(token, dealer._id),
          api.dealerTimeline(token, dealer._id),
          api.messageTemplates(token, { category: "initial_outreach", dealerId: dealer._id })
        ]);
        setInteractions(nextInteractions);
        setTimeline(nextTimeline.items);
        setMessageTemplates(nextTemplates);
      });
    },
    parseDealerMessage: async (rawText) => {
      if (!token || !activeSearch || !selectedDealer) return;
      await run(async () => {
        const extraction = await api.parseDealerMessage(token, { carSearchId: activeSearch._id, dealerId: selectedDealer._id, rawText });
        setPendingExtraction(extraction);
      });
    },
    confirmPendingExtraction: async () => {
      if (!token || !activeSearch || !pendingExtraction) return;
      await run(async () => {
        await api.confirmExtraction(token, pendingExtraction.extractionId);
        setPendingExtraction(null);
        const [nextDealers, nextOffers] = await Promise.all([api.searchDealers(token, activeSearch._id), api.offers(token, activeSearch._id)]);
        setDealers(nextDealers);
        setOffers(nextOffers);
      });
    },
    generateReply: async () => {
      if (!token || !activeSearch || !selectedDealer) return;
      await run(async () => {
        const offer = offers.find((candidate) => candidate.dealerId === selectedDealer._id);
        setGeneratedReply(await api.generateReply(token, { carSearchId: activeSearch._id, dealerId: selectedDealer._id, offerId: offer?._id, tone: "friendly" }));
      });
    },
    saveGeneratedReply: async (replyText) => {
      if (!token || !activeSearch || !selectedDealer || !generatedReply) return;
      await run(async () => {
        const offer = offers.find((candidate) => candidate.dealerId === selectedDealer._id);
        const interaction = await api.createInteraction(token, activeSearch._id, {
          dealerId: selectedDealer._id,
          offerId: offer?._id,
          type: "email",
          direction: "outbound",
          rawContent: replyText,
          aiSummary: generatedReply.strategyNotes,
          aiSuggestedNextStep: generatedReply.suggestedFollowUpTitle
        });
        setInteractions((current) => [interaction, ...current]);
      });
    },
    createSuggestedFollowUp: async () => {
      if (!token || !activeSearch || !selectedDealer) return;
      await run(async () => {
        const task = await api.createTask(token, activeSearch._id, {
          dealerId: selectedDealer._id,
          title: generatedReply?.suggestedFollowUpTitle ?? `Follow up with ${selectedDealer.name}`,
          dueAt: generatedReply?.suggestedFollowUpDueAt
        });
        setTasks((current) => [task, ...current]);
      });
    },
    loadMessageTemplates: async (dealerId) => {
      if (!token) return;
      await run(async () => {
        setMessageTemplates(await api.messageTemplates(token, { category: "initial_outreach", dealerId }));
      });
    },
    generateInitialOutreach: async (dealerId, templateId) => {
      if (!token || !activeSearch) return null;
      let message: InitialOutreachMessage | null = null;
      const ok = await run(async () => {
        message = await api.initialOutreachMessage(token, { carSearchId: activeSearch._id, dealerId, templateId, tone: "friendly" });
        setInitialOutreach(message);
        if (dealerId) setMessageTemplates(await api.messageTemplates(token, { category: "initial_outreach", dealerId }));
      });
      return ok ? message : null;
    },
    markOutreachContacted: async (dealerIds, messageText, createFollowUp = true, templateId) => {
      if (!token || !activeSearch || !dealerIds.length) return;
      await run(async () => {
        const result = await api.markOutreachContacted(token, { carSearchId: activeSearch._id, dealerIds, messageText, templateId, createFollowUp });
        setDealers((current) => current.map((dealer) => result.dealers.find((updated) => updated._id === dealer._id) ?? dealer));
        setSelectedDealer((current) => result.dealers.find((updated) => updated._id === current?._id) ?? current);
        setInteractions((current) => [...result.interactions, ...current.filter((interaction) => !result.interactions.some((created) => created._id === interaction._id))]);
        setTasks((current) => [...result.tasks, ...current.filter((task) => !result.tasks.some((created) => created._id === task._id))]);
        if (selectedDealer) setTimeline((await api.dealerTimeline(token, selectedDealer._id)).items);
      });
    },
    markSelectedDealerContacted: async () => {
      if (!token || !selectedDealer) return;
      await run(async () => {
        const updated = await api.updateDealer(token, selectedDealer._id, { status: "contacted", lastContactedAt: new Date().toISOString() });
        setSelectedDealer(updated);
        setDealers((current) => current.map((dealer) => dealer._id === updated._id ? updated : dealer));
      });
    },
    refresh
  }), [activeSearch, authenticate, dealers, error, generatedReply, initialOutreach, interactions, loading, messageTemplates, offers, pendingExtraction, refresh, run, selectedDealer, tasks, timeline, token, user]);

  return <DealDeskContext.Provider value={value}>{children}</DealDeskContext.Provider>;
}

export function useDealDeskApp() {
  const context = useContext(DealDeskContext);
  if (!context) throw new Error("useDealDeskApp must be used within DealDeskProvider");
  return context;
}
