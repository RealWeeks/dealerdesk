import { fireEvent, render, screen } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddUpdateScreen } from "../screens/AddUpdateScreen";
import { AIReplyScreen } from "../screens/AIReplyScreen";
import { CaptureVehicleScreen } from "../screens/CaptureVehicleScreen";
import { CompareOffersScreen } from "../screens/CompareOffersScreen";
import { DealerDetailScreen } from "../screens/DealerDetailScreen";
import { DealersScreen } from "../screens/DealersScreen";
import { FindDealersScreen } from "../screens/FindDealersScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { ManualQuoteScreen } from "../screens/ManualQuoteScreen";
import { OutreachQueueScreen } from "../screens/OutreachQueueScreen";
import { ReviewAIExtractionScreen } from "../screens/ReviewAIExtractionScreen";
import { SearchSetupScreen } from "../screens/SearchSetupScreen";
import { type AppContextValue, useDealDeskApp } from "../hooks/useDealDeskApp";

vi.mock("../hooks/useDealDeskApp", () => ({
  useDealDeskApp: vi.fn()
}));

const replace = vi.fn();
const push = vi.fn();
vi.mock("expo-router", () => ({
  useRouter: () => ({ replace, push })
}));

vi.mock("expo-clipboard", () => ({
  setStringAsync: vi.fn()
}));

vi.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: vi.fn().mockResolvedValue({ canceled: false, assets: [{ base64: "BASE64DATA" }] }),
  MediaTypeOptions: { Images: "Images" }
}));

vi.mock("expo-linear-gradient", () => ({
  LinearGradient: (props: { children?: unknown }) => props.children ?? null
}));

vi.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

const baseState: AppContextValue = {
  token: "token",
  user: { id: "user1", email: "buyer@example.com" },
  activeSearch: { _id: "search1", year: 2026, make: "Lexus", model: "RX 350h", trim: "Premium AWD", zipCode: "04101", searchRadiusMiles: 150, targetOtdPrice: 62000, status: "active" },
  dealers: [{ _id: "dealer1", carSearchId: "search1", dealerSeedId: "seed1", name: "Lexus of Portland", brand: "Lexus", city: "Portland", state: "ME", status: "needs_reply", priority: "high" }],
  offers: [{ _id: "offer1", dealerId: "dealer1", otdPrice: 61000, sellingPrice: 57500, quoteCompleteness: "partial", addOns: [], redFlags: [] }],
  vehicles: [{ _id: "veh1", dealerId: "dealer1", carSearchId: "search1", year: 2026, make: "Lexus", model: "RX 350h", trim: "Premium AWD", vin: "JTHGP8CA5N1234567", stockNumber: "L24-8891", listedPrice: 61480, status: "interested" }],
  selectedDealer: { _id: "dealer1", carSearchId: "search1", dealerSeedId: "seed1", name: "Lexus of Portland", brand: "Lexus", city: "Portland", state: "ME", status: "needs_reply", priority: "high" },
  pendingExtraction: null,
  pendingVehicleCapture: null,
  generatedReply: { replyText: "Thanks, please confirm itemized OTD.", strategyNotes: "Keep trade separate.", suggestedFollowUpTitle: "Follow up on OTD", suggestedFollowUpDueAt: "2026-07-09T12:00:00.000Z" },
  initialOutreach: null,
  interactions: [{ _id: "int1", dealerId: "dealer1", type: "email", direction: "outbound", rawContent: "Sent reply" }],
  tasks: [],
  messageTemplates: [
    { _id: "template2", name: "Unused Template", category: "initial_outreach", tone: "friendly", body: "Hi about {{year}} {{make}}", variables: ["year", "make"], isBuiltIn: true, isActive: true, usedWithThisDealer: false },
    { _id: "template1", name: "Used Template", category: "initial_outreach", tone: "casual", body: "Hi used", variables: [], isBuiltIn: true, isActive: true, usedWithThisDealer: true, lastUsedAt: "2026-07-08T12:00:00.000Z" }
  ],
  timeline: [
    { id: "tl1", type: "interaction", occurredAt: "2026-07-08T12:00:00.000Z", title: "Outbound message sent", summary: "Sent reply", metadata: {} },
    { id: "tl2", type: "offer", occurredAt: "2026-07-08T11:00:00.000Z", title: "Offer saved: $61,000 OTD", summary: "partial quote", metadata: {} },
    { id: "tl3", type: "task", occurredAt: "2026-07-08T10:00:00.000Z", title: "Follow-up task created", summary: "Follow up", metadata: {} },
    { id: "tl4", type: "template_usage", occurredAt: "2026-07-08T09:00:00.000Z", title: "Initial outreach template used: Used Template", summary: "Hi used", metadata: {} }
  ],
  loading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  createDefaultSearch: vi.fn(),
  saveSearch: vi.fn().mockResolvedValue(true),
  searchDealerSeeds: vi.fn(),
  addDealer: vi.fn(),
  saveManualQuote: vi.fn().mockResolvedValue(true),
  selectDealer: vi.fn(),
  captureVehicleFromUrl: vi.fn().mockResolvedValue(true),
  captureVehicleFromImage: vi.fn().mockResolvedValue(true),
  confirmVehicleCapture: vi.fn().mockResolvedValue(true),
  discardVehicleCapture: vi.fn(),
  setFocusVehicle: vi.fn(),
  parseDealerMessage: vi.fn(),
  confirmPendingExtraction: vi.fn(),
  generateReply: vi.fn(),
  saveGeneratedReply: vi.fn(),
  createSuggestedFollowUp: vi.fn(),
  loadMessageTemplates: vi.fn(),
  generateInitialOutreach: vi.fn().mockResolvedValue({ templateId: "template2", templateName: "Unused Template", category: "initial_outreach", tone: "friendly", messageText: "Initial outreach message", strategyNotes: "Ask for OTD.", usedWithThisDealer: false }),
  markOutreachContacted: vi.fn(),
  markSelectedDealerContacted: vi.fn(),
  refresh: vi.fn()
};

function mockApp(overrides: Partial<AppContextValue> = {}) {
  vi.mocked(useDealDeskApp).mockReturnValue({ ...baseState, ...overrides });
}

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
}

// Flush chained promises (permission -> picker -> capture) including a macrotask.
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("DealDesk connected mobile screens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApp();
  });

  it("login screen calls auth action and enters the app", async () => {
    const login = vi.fn();
    mockApp({ token: null, login });
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByLabelText("Email"), "buyer@example.com");
    fireEvent.changeText(screen.getByLabelText("Password"), "password123");
    fireEvent.press(screen.getAllByText("Log in")[1]);
    expect(login).toHaveBeenCalledWith("buyer@example.com", "password123");
    await Promise.resolve();
    expect(replace).toHaveBeenCalledWith("/home");
  });

  it("home can create an active search when none exists", () => {
    const createDefaultSearch = vi.fn();
    mockApp({ activeSearch: null, dealers: [], offers: [], createDefaultSearch });
    render(<HomeScreen />);
    fireEvent.press(screen.getByText("Create Active Search"));
    expect(createDefaultSearch).toHaveBeenCalled();
  });

  it("home displays friendly API errors", () => {
    mockApp({ error: "Authentication required" });
    render(<HomeScreen />);
    expect(screen.getByText("Authentication required")).toBeTruthy();
  });

  it("home logs out and returns to login", async () => {
    const logout = vi.fn();
    mockApp({ logout });
    render(<HomeScreen />);
    fireEvent.press(screen.getByText("Log out"));
    expect(logout).toHaveBeenCalled();
    await Promise.resolve();
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("home renders outreach queue count", () => {
    mockApp({ dealers: [{ ...baseState.dealers[0], status: "not_contacted" }] });
    render(<HomeScreen />);
    expect(screen.getByText("Outreach queue")).toBeTruthy();
    expect(screen.getByText("1 dealers not contacted")).toBeTruthy();
  });

  it("find dealers searches real dealers and shows their website", async () => {
    const searchDealerSeeds = vi.fn().mockResolvedValue({ dealers: [{ _id: "seed1", name: "Lexus of Portland", brand: "Lexus", city: "Portland", state: "ME", websiteUrl: "https://lexusofportland.example", distanceMiles: 2.1 }], warnings: [] });
    const addDealer = vi.fn();
    mockApp({ searchDealerSeeds, addDealer });
    render(<FindDealersScreen />);
    fireEvent.press(screen.getByText("Search dealers"));
    expect(searchDealerSeeds).toHaveBeenCalledWith("Lexus", "04101", 150);
    await flush();
    expect(screen.getByText("Lexus of Portland")).toBeTruthy();
    expect(screen.getByLabelText("Website for Lexus of Portland")).toBeTruthy();
  });

  it("search setup loads active search values and saves edits", async () => {
    const saveSearch = vi.fn().mockResolvedValue(true);
    mockApp({ saveSearch });
    render(<SearchSetupScreen />);
    expect(screen.getByText("Lexus")).toBeTruthy(); // make dropdown shows current value
    fireEvent.press(screen.getByLabelText("Make")); // open the dropdown
    await settle();
    fireEvent.press(screen.getByLabelText("Toyota")); // pick a make
    await settle();
    fireEvent.changeText(screen.getByLabelText("ZIP"), "90210");
    fireEvent.changeText(screen.getByLabelText("Radius"), "75");
    fireEvent.press(screen.getByText("Save Search"));
    expect(saveSearch).toHaveBeenCalledWith(expect.objectContaining({ make: "Toyota", zipCode: "90210", searchRadiusMiles: 75 }));
    await Promise.resolve();
    expect(replace).toHaveBeenCalledWith("/home");
  });

  it("find dealers shows empty guidance before search", () => {
    render(<FindDealersScreen />);
    expect(screen.getByText(/real dealerships/)).toBeTruthy();
  });

  it("dealers screen opens dealer detail through app state", () => {
    const selectDealer = vi.fn();
    mockApp({ selectedDealer: null, selectDealer });
    render(<DealersScreen />);
    fireEvent.press(screen.getByText("Open"));
    expect(selectDealer).toHaveBeenCalledWith(baseState.dealers[0]);
  });

  it("dealer detail actions generate replies, mark contacted, and add follow-up", () => {
    const generateReply = vi.fn();
    const markSelectedDealerContacted = vi.fn();
    const createSuggestedFollowUp = vi.fn();
    mockApp({ generateReply, markSelectedDealerContacted, createSuggestedFollowUp });
    render(<DealerDetailScreen />);
    fireEvent.press(screen.getByText("Generate Reply"));
    fireEvent.press(screen.getByText("Mark Contacted"));
    fireEvent.press(screen.getByText("Add Follow-up"));
    expect(generateReply).toHaveBeenCalled();
    expect(markSelectedDealerContacted).toHaveBeenCalled();
    expect(createSuggestedFollowUp).toHaveBeenCalled();
  });

  it("dealer detail generates and saves initial outreach", async () => {
    const generateInitialOutreach = vi.fn().mockResolvedValue({ templateId: "template2", templateName: "Unused Template", messageText: "Initial outreach message", strategyNotes: "Ask for OTD." });
    const markOutreachContacted = vi.fn();
    mockApp({ generateInitialOutreach, initialOutreach: { templateId: "template2", templateName: "Unused Template", messageText: "Initial outreach message", strategyNotes: "Ask for OTD." }, markOutreachContacted });
    render(<DealerDetailScreen />);
    fireEvent.press(screen.getByText("Generate Initial Outreach"));
    await settle();
    expect(generateInitialOutreach).toHaveBeenCalledWith("dealer1");
    fireEvent.press(screen.getByText("Save as sent"));
    expect(markOutreachContacted).toHaveBeenCalledWith(["dealer1"], "Initial outreach message", true, "template2");
    expect(screen.getByText("Template: Unused Template")).toBeTruthy();
  });

  it("add update sends pasted text to backend parse action", () => {
    const parseDealerMessage = vi.fn();
    mockApp({ parseDealerMessage });
    render(<AddUpdateScreen />);
    fireEvent.changeText(screen.getByLabelText("Dealer message"), "Dealer says 61k OTD");
    fireEvent.press(screen.getByText("Review AI extraction"));
    expect(parseDealerMessage).toHaveBeenCalledWith("Dealer says 61k OTD");
  });

  it("add update handles no selected dealer without crashing", () => {
    mockApp({ selectedDealer: null });
    render(<AddUpdateScreen />);
    expect(screen.getByText(/Open a dealer/)).toBeTruthy();
  });

  it("review extraction displays backend extraction and confirms it", () => {
    const confirmPendingExtraction = vi.fn();
    mockApp({
      confirmPendingExtraction,
      pendingExtraction: {
        extractionId: "extract1",
        dealer: { name: "Lexus of Portland", salespersonName: "Sam" },
        vehicle: { year: 2026, make: "Lexus", model: "RX 350h", trim: "Premium AWD" },
        offer: { otdPrice: 61000, sellingPrice: 57500, quoteCompleteness: "partial" },
        redFlags: ["Missing tax breakdown"],
        missingInfo: ["titleRegistration"],
        suggestedNextStep: "Ask for itemized OTD.",
        suggestedReply: "Please itemize OTD.",
        confidence: "high"
      }
    });
    render(<ReviewAIExtractionScreen />);
    expect(screen.getByText(/61,000 OTD/)).toBeTruthy();
    fireEvent.press(screen.getByText("Save"));
    expect(confirmPendingExtraction).toHaveBeenCalled();
  });

  it("review extraction handles empty state", () => {
    mockApp({ pendingExtraction: null });
    render(<ReviewAIExtractionScreen />);
    expect(screen.getByText("No extraction is waiting for review.")).toBeTruthy();
  });

  it("compare offers ranks API offers by OTD price", () => {
    mockApp({
      offers: [
        { _id: "offer2", dealerId: "dealer1", otdPrice: 62000, sellingPrice: 58000, quoteCompleteness: "complete", addOns: [], redFlags: [] },
        { _id: "offer1", dealerId: "dealer1", otdPrice: 61000, sellingPrice: 57500, quoteCompleteness: "partial", addOns: [], redFlags: [] }
      ]
    });
    render(<CompareOffersScreen />);
    expect(screen.getByText("1. Lexus of Portland")).toBeTruthy();
    expect(screen.getByText("$61,000 OTD")).toBeTruthy();
  });

  it("compare offers shows empty state", () => {
    mockApp({ offers: [] });
    render(<CompareOffersScreen />);
    expect(screen.getByText(/No confirmed offers yet/)).toBeTruthy();
  });

  it("AI reply screen shows generated reply and exposes copy, save, and follow-up actions", () => {
    const saveGeneratedReply = vi.fn();
    const createSuggestedFollowUp = vi.fn();
    mockApp({ saveGeneratedReply, createSuggestedFollowUp });
    render(<AIReplyScreen />);
    expect(screen.getByLabelText("Reply text")).toBeTruthy();
    expect(screen.getByText("Copy reply")).toBeTruthy();
    fireEvent.press(screen.getByText("Save as sent"));
    fireEvent.press(screen.getByText("Create follow-up task"));
    expect(saveGeneratedReply).toHaveBeenCalledWith("Thanks, please confirm itemized OTD.");
    expect(createSuggestedFollowUp).toHaveBeenCalled();
  });

  it("manual quote screen saves manual offers with add-ons", async () => {
    const saveManualQuote = vi.fn().mockResolvedValue(true);
    mockApp({ saveManualQuote });
    render(<ManualQuoteScreen />);
    fireEvent.changeText(screen.getByLabelText("Selling price"), "59000");
    fireEvent.changeText(screen.getByLabelText("OTD price"), "61848");
    fireEvent.changeText(screen.getByLabelText("Add-on 1 name"), "All-weather mats");
    fireEvent.changeText(screen.getByLabelText("Add-on 1 amount"), "299");
    fireEvent.press(screen.getByText("Opt"));
    fireEvent.changeText(screen.getByLabelText("Quote notes"), "Dealer sent a clean manual quote.");
    fireEvent.press(screen.getByText("Save Manual Quote"));
    expect(saveManualQuote).toHaveBeenCalledWith(expect.objectContaining({
      sellingPrice: 59000,
      otdPrice: 61848,
      quoteCompleteness: "partial",
      sourceText: "Dealer sent a clean manual quote."
    }));
    expect(saveManualQuote.mock.calls[0][0].addOns[0]).toMatchObject({ name: "All-weather mats", amount: 299, required: true });
    await Promise.resolve();
    expect(replace).toHaveBeenCalledWith("/offers");
  });

  it("outreach queue renders not-contacted dealers and supports selection", async () => {
    mockApp({ dealers: [{ ...baseState.dealers[0], status: "not_contacted", phone: "207-555-0100", distanceMiles: 2.4 }] });
    render(<OutreachQueueScreen />);
    expect(screen.getByText("Lexus of Portland")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Select Lexus of Portland"));
    await settle();
    expect(screen.getByText("1 selected")).toBeTruthy();
  });

  it("outreach queue generates a message and exposes copy", async () => {
    const generateInitialOutreach = vi.fn().mockResolvedValue({ templateId: "template2", templateName: "Unused Template", category: "initial_outreach", tone: "friendly", messageText: "Initial outreach message", strategyNotes: "Ask for OTD.", usedWithThisDealer: false });
    mockApp({ dealers: [{ ...baseState.dealers[0], status: "not_contacted" }], generateInitialOutreach });
    render(<OutreachQueueScreen />);
    fireEvent.press(screen.getByLabelText("Select Lexus of Portland"));
    await settle();
    fireEvent.press(screen.getByText("Generate messages"));
    await settle();
    expect(generateInitialOutreach).toHaveBeenCalled();
  });

  it("outreach generated message is editable and saves edited text with template usage", async () => {
    const markOutreachContacted = vi.fn();
    mockApp({
      dealers: [{ ...baseState.dealers[0], status: "not_contacted" }],
      initialOutreach: { templateId: "template2", templateName: "Unused Template", category: "initial_outreach", tone: "friendly", messageText: "Initial outreach message", strategyNotes: "Ask for OTD." },
      markOutreachContacted
    });
    render(<OutreachQueueScreen />);
    fireEvent.changeText(screen.getByLabelText("Initial outreach message"), "Edited outreach text");
    fireEvent.press(screen.getByLabelText("Select Lexus of Portland"));
    await settle();
    fireEvent.press(screen.getByText("Confirm sent and create follow-ups"));
    expect(markOutreachContacted).toHaveBeenCalledWith(["dealer1"], "Edited outreach text", true, "template2");
  });

  it("template picker renders templates with used indicators and unused first", async () => {
    const loadMessageTemplates = vi.fn();
    mockApp({
      dealers: [{ ...baseState.dealers[0], status: "not_contacted" }],
      initialOutreach: { templateId: "template2", templateName: "Unused Template", category: "initial_outreach", tone: "friendly", messageText: "Initial outreach message", strategyNotes: "Ask for OTD." },
      loadMessageTemplates
    });
    render(<OutreachQueueScreen />);
    fireEvent.press(screen.getByText("Choose different template"));
    await settle();
    expect(loadMessageTemplates).toHaveBeenCalled();
    expect(screen.getByText("Unused Template · friendly")).toBeTruthy();
    expect(screen.getByText("Used Template · casual")).toBeTruthy();
    expect(screen.getByText("Used with this dealer")).toBeTruthy();
    expect(screen.getByText("Unused for this dealer")).toBeTruthy();
  });

  it("outreach queue confirms sent outreach through provider", async () => {
    const markOutreachContacted = vi.fn();
    mockApp({
      dealers: [{ ...baseState.dealers[0], status: "not_contacted" }],
      initialOutreach: { templateId: "template2", messageText: "Initial outreach message", strategyNotes: "Ask for OTD." },
      markOutreachContacted
    });
    render(<OutreachQueueScreen />);
    expect(screen.getByText("Copy message")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Select Lexus of Portland"));
    await settle();
    fireEvent.press(screen.getByText("Confirm sent and create follow-ups"));
    expect(markOutreachContacted).toHaveBeenCalledWith(["dealer1"], "Initial outreach message", true, "template2");
  });

  it("dealer detail renders the unified dealer timeline and empty timeline state", () => {
    render(<DealerDetailScreen />);
    expect(screen.getByText("Dealer timeline")).toBeTruthy();
    expect(screen.getByText("Outbound message sent")).toBeTruthy();
    expect(screen.getByText(/Offer saved/)).toBeTruthy();
    expect(screen.getByText(/Follow-up task created/)).toBeTruthy();
    expect(screen.getByText(/Initial outreach template used/)).toBeTruthy();

    mockApp({ timeline: [] });
    render(<DealerDetailScreen />);
    expect(screen.getByText("No timeline yet")).toBeTruthy();
  });

  it("outreach queue renders empty state when no dealers need outreach", () => {
    mockApp({ dealers: [{ ...baseState.dealers[0], status: "contacted" }] });
    render(<OutreachQueueScreen />);
    expect(screen.getByText("No dealers need initial outreach")).toBeTruthy();
  });

  it("capture screen captures a car from a pasted link", () => {
    const captureVehicleFromUrl = vi.fn().mockResolvedValue(true);
    mockApp({ captureVehicleFromUrl });
    render(<CaptureVehicleScreen />);
    fireEvent.changeText(screen.getByLabelText("Listing URL"), "https://dealer.example/inv/abc");
    fireEvent.press(screen.getByText("Capture from link"));
    expect(captureVehicleFromUrl).toHaveBeenCalledWith("https://dealer.example/inv/abc");
  });

  it("capture screen reads a screenshot and captures from the image", async () => {
    const captureVehicleFromImage = vi.fn().mockResolvedValue(true);
    mockApp({ captureVehicleFromImage });
    render(<CaptureVehicleScreen />);
    fireEvent.press(screen.getByText("Choose screenshot"));
    await flush();
    expect(captureVehicleFromImage).toHaveBeenCalledWith("BASE64DATA");
  });

  it("capture screen hands off to the editable review once a car is captured", async () => {
    const confirmVehicleCapture = vi.fn().mockResolvedValue(true);
    mockApp({
      confirmVehicleCapture,
      pendingVehicleCapture: {
        extractionId: "ex1",
        vehicle: { year: 2026, make: "Lexus", model: "RX 350h", trim: "Premium AWD", vin: "JTHGP8CA5N1234567", stockNumber: "L24-8891", listedPrice: 61480 },
        confidence: "medium",
        warnings: ["No listed price detected."]
      }
    });
    render(<CaptureVehicleScreen />);
    expect(screen.getByDisplayValue("Lexus")).toBeTruthy();
    expect(screen.getByDisplayValue("JTHGP8CA5N1234567")).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText("Trim"), "Luxury AWD");
    fireEvent.press(screen.getByText("Save car"));
    expect(confirmVehicleCapture).toHaveBeenCalledWith(expect.objectContaining({ make: "Lexus", model: "RX 350h", trim: "Luxury AWD", vin: "JTHGP8CA5N1234567", listedPrice: 61480 }));
    await flush();
    expect(replace).toHaveBeenCalledWith("/dealers");
  });

  it("dealer detail lists cars, navigates to capture, and sets the focus car", () => {
    const setFocusVehicle = vi.fn();
    mockApp({ setFocusVehicle });
    render(<DealerDetailScreen />);
    fireEvent.press(screen.getByText("Capture car"));
    expect(push).toHaveBeenCalledWith("/capture-vehicle");
    fireEvent.press(screen.getByLabelText("Focus 2026 Lexus RX 350h Premium AWD · #L24-8891"));
    expect(setFocusVehicle).toHaveBeenCalledWith("veh1");
  });

  it("manual quote attaches the selected car to the offer", async () => {
    const saveManualQuote = vi.fn().mockResolvedValue(true);
    mockApp({ saveManualQuote });
    render(<ManualQuoteScreen />);
    fireEvent.press(screen.getByLabelText("Car 2026 Lexus RX 350h"));
    fireEvent.changeText(screen.getByLabelText("Selling price"), "59000");
    fireEvent.press(screen.getByText("Save Manual Quote"));
    expect(saveManualQuote).toHaveBeenCalledWith(expect.objectContaining({ vehicleId: "veh1", sellingPrice: 59000 }));
    await Promise.resolve();
    expect(replace).toHaveBeenCalledWith("/offers");
  });

  it("compare offers labels an offer with its specific car", () => {
    mockApp({
      offers: [{ _id: "offer1", dealerId: "dealer1", vehicleId: "veh1", otdPrice: 61000, sellingPrice: 57500, quoteCompleteness: "complete", addOns: [], redFlags: [] }]
    });
    render(<CompareOffersScreen />);
    expect(screen.getByText(/2026 Lexus RX 350h/)).toBeTruthy();
  });
});
