import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";
import { DealerSeed } from "../models/DealerSeed";
import { AIExtraction } from "../models/AIExtraction";
import { Interaction } from "../models/Interaction";
import { MessageTemplate } from "../models/MessageTemplate";
import { MessageTemplateUsage } from "../models/MessageTemplateUsage";
import { Offer } from "../models/Offer";
import { SearchDealer } from "../models/SearchDealer";
import { Task } from "../models/Task";
import { User } from "../models/User";
import { attachSeededDealers, seedDealerSeeds } from "../seed/dealerSeedService";
import { seedBuiltInMessageTemplates } from "../seed/messageTemplateService";
import { setAIClient } from "../services/aiService";
import { haversineMiles } from "../utils/haversine";
import { seedDealers } from "../utils/seedDealers";

const app = createApp();

async function auth(email = "buyer@example.com") {
  const res = await request(app).post("/auth/register").send({ email, password: "password123" });
  return res.body.token as string;
}

async function createSearch(token: string) {
  const res = await request(app)
    .post("/car-searches")
    .set("Authorization", `Bearer ${token}`)
    .send({
      year: 2026,
      make: "Lexus",
      model: "RX 350h",
      trim: "Premium AWD",
      zipCode: "04101",
      searchRadiusMiles: 150,
      targetOtdPrice: 62000,
      willingToTravel: true,
      willingToShip: false,
      tradeInStrategy: "separate",
      financingStrategy: "separate",
      status: "active"
    });
  return res.body;
}

async function addDealer(token: string, searchId: string) {
  await seedDealers();
  const seed = await DealerSeed.findOne({ name: "Berlin City Lexus of Portland" });
  const res = await request(app)
    .post(`/car-searches/${searchId}/dealers`)
    .set("Authorization", `Bearer ${token}`)
    .send({ dealerSeedId: seed!.id, priority: "high" });
  return { dealer: res.body, seed };
}

describe("DealDesk API", () => {
  it("serves health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("registers, rejects duplicate email, logs in, rejects invalid login, and returns /me", async () => {
    const register = await request(app).post("/auth/register").send({ email: "a@example.com", password: "password123" });
    expect(register.status).toBe(201);
    expect(register.body.token).toBeTruthy();

    const duplicate = await request(app).post("/auth/register").send({ email: "a@example.com", password: "password123" });
    expect(duplicate.status).toBe(409);

    const login = await request(app).post("/auth/login").send({ email: "a@example.com", password: "password123" });
    expect(login.status).toBe(200);

    const invalid = await request(app).post("/auth/login").send({ email: "a@example.com", password: "wrongpass" });
    expect(invalid.status).toBe(401);

    const me = await request(app).get("/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("a@example.com");

    const noToken = await request(app).get("/me");
    expect(noToken.status).toBe(401);
  });

  it("creates car searches and scopes access by user", async () => {
    const token = await auth("one@example.com");
    const other = await auth("two@example.com");
    const search = await createSearch(token);
    expect(search.make).toBe("Lexus");

    const blocked = await request(app).get(`/car-searches/${search._id}`).set("Authorization", `Bearer ${other}`);
    expect(blocked.status).toBe(404);
  });

  it("searches seeded dealers by radius and calculates Haversine distance", async () => {
    await seedDealers();
    await DealerSeed.create({ name: "Honda of Portland", brand: "Honda", city: "Portland", state: "ME", latitude: 43.6615, longitude: -70.2553 });
    await DealerSeed.create({ name: "Broken Lexus", brand: "Lexus", city: "Nowhere", state: "ME" });
    expect(Math.round(haversineMiles({ latitude: 43.6615, longitude: -70.2553 }, { latitude: 42.9956, longitude: -71.4548 }))).toBe(76);
    const res = await request(app).get("/dealer-seeds/search?brand=Lexus&zip=04101&radius=150");
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe("Berlin City Lexus of Portland");
    expect(res.body.every((dealer: { distanceMiles: number }) => dealer.distanceMiles <= 150)).toBe(true);
    expect(res.body.some((dealer: { brand: string }) => dealer.brand === "Honda")).toBe(false);
    expect(res.body.some((dealer: { name: string }) => dealer.name === "Broken Lexus")).toBe(false);
    const close = await request(app).get("/dealer-seeds/search?brand=Lexus&zip=04101&radius=10");
    expect(close.body).toHaveLength(1);
    const badZip = await request(app).get("/dealer-seeds/search?brand=Lexus&zip=99999&radius=10");
    expect(badZip.status).toBe(400);
  });

  it("adds dealers, prevents duplicates, and blocks adding to another user's search", async () => {
    const token = await auth("dealer1@example.com");
    const other = await auth("dealer2@example.com");
    const search = await createSearch(token);
    await seedDealers();
    const seed = await DealerSeed.findOne({ name: "Berlin City Lexus of Portland" });

    const added = await request(app).post(`/car-searches/${search._id}/dealers`).set("Authorization", `Bearer ${token}`).send({ dealerSeedId: seed!.id });
    expect(added.status).toBe(201);

    const duplicate = await request(app).post(`/car-searches/${search._id}/dealers`).set("Authorization", `Bearer ${token}`).send({ dealerSeedId: seed!.id });
    expect(duplicate.status).toBe(409);

    const blocked = await request(app).post(`/car-searches/${search._id}/dealers`).set("Authorization", `Bearer ${other}`).send({ dealerSeedId: seed!.id });
    expect(blocked.status).toBe(404);
  });

  it("upserts real dealer seeds without duplicate DealerSeed records", async () => {
    const dealer = {
      name: "Real Lexus Test Dealer",
      brand: "Lexus",
      address: "1 Main St",
      city: "Portland",
      state: "ME",
      zip: "04101",
      latitude: 43.6615,
      longitude: -70.2553,
      source: "test",
      lastVerifiedAt: new Date("2026-07-08"),
      needsVerification: true
    };
    await seedDealerSeeds({ dealers: [dealer] });
    await seedDealerSeeds({ dealers: [{ ...dealer, phone: "207-555-0199" }] });

    expect(await DealerSeed.countDocuments()).toBe(1);
    const saved = await DealerSeed.findOne({ name: dealer.name });
    expect(saved!.get("phone")).toBe("207-555-0199");
  });

  it("attaches seeded dealers to one user's active search idempotently without creating offers", async () => {
    const token = await auth("attach-a@example.com");
    const search = await createSearch(token);
    const dealer = {
      name: "Attach Lexus Dealer",
      brand: "Lexus",
      city: "Portland",
      state: "ME",
      zip: "04101",
      phone: "207-555-0100",
      latitude: 43.6615,
      longitude: -70.2553,
      source: "test",
      lastVerifiedAt: new Date("2026-07-08")
    };
    await seedDealerSeeds({ dealers: [dealer] });

    const first = await attachSeededDealers({ email: "attach-a@example.com", brand: "Lexus", radius: 150 });
    const second = await attachSeededDealers({ email: "attach-a@example.com", brand: "Lexus", radius: 150 });

    expect(first.attached).toHaveLength(1);
    expect(second.alreadyAttached).toHaveLength(1);
    expect(await SearchDealer.countDocuments({ carSearchId: search._id })).toBe(1);
    expect(await Offer.countDocuments()).toBe(0);
  });

  it("attach seeded dealers fails clearly without an active search", async () => {
    await auth("no-search@example.com");
    await expect(attachSeededDealers({ email: "no-search@example.com", brand: "Lexus", radius: 150 }))
      .rejects.toThrow(/No active car search/);
  });

  it("attach seeded dealers does not attach dealers to the wrong user", async () => {
    const token = await auth("attach-owner@example.com");
    await createSearch(token);
    await auth("attach-other@example.com");
    const otherUser = await User.findOne({ email: "attach-other@example.com" });
    await seedDealerSeeds({
      dealers: [{
        name: "Owner Only Lexus Dealer",
        brand: "Lexus",
        city: "Portland",
        state: "ME",
        latitude: 43.6615,
        longitude: -70.2553,
        source: "test"
      }]
    });

    await attachSeededDealers({ email: "attach-owner@example.com", brand: "Lexus", radius: 150 });

    expect(await SearchDealer.countDocuments({ userId: otherUser!._id })).toBe(0);
  });

  it("creates interactions and blocks another user's dealer interactions", async () => {
    const token = await auth("int1@example.com");
    const other = await auth("int2@example.com");
    const search = await createSearch(token);
    const { dealer } = await addDealer(token, search._id);

    const created = await request(app)
      .post(`/car-searches/${search._id}/interactions`)
      .set("Authorization", `Bearer ${token}`)
      .send({ dealerId: dealer._id, type: "email", direction: "inbound", rawContent: "We can do 61k OTD." });
    expect(created.status).toBe(201);

    const blocked = await request(app).get(`/dealers/${dealer._id}/interactions`).set("Authorization", `Bearer ${other}`);
    expect(blocked.status).toBe(404);
  });

  it("creates partial offers, sorts by OTD, handles incomplete offers, and scopes offers", async () => {
    const token = await auth("offer1@example.com");
    const other = await auth("offer2@example.com");
    const search = await createSearch(token);
    const { dealer } = await addDealer(token, search._id);

    const partial = await request(app).post(`/car-searches/${search._id}/offers`).set("Authorization", `Bearer ${token}`).send({ dealerId: dealer._id, sellingPrice: 59000, quoteCompleteness: "partial" });
    expect(partial.status).toBe(201);

    await request(app).post(`/car-searches/${search._id}/offers`).set("Authorization", `Bearer ${token}`).send({ dealerId: dealer._id, otdPrice: 62000, quoteCompleteness: "complete", addOns: [{ name: "Nitrogen", amount: 299, required: true }], redFlags: ["Required add-on"] });
    await request(app).post(`/car-searches/${search._id}/offers`).set("Authorization", `Bearer ${token}`).send({ dealerId: dealer._id, otdPrice: 61000, quoteCompleteness: "complete" });

    const list = await request(app).get(`/car-searches/${search._id}/offers`).set("Authorization", `Bearer ${token}`);
    expect(list.body.map((offer: { otdPrice?: number }) => offer.otdPrice)).toEqual([61000, 62000, undefined]);
    expect(list.body[1].addOns[0].name).toBe("Nitrogen");
    expect(list.body[1].redFlags).toContain("Required add-on");

    const blocked = await request(app).get(`/offers/${partial.body._id}`).set("Authorization", `Bearer ${other}`);
    expect(blocked.status).toBe(404);
  });

  it("creates manual quotes, preserves partial entries and add-ons, and denies cross-user dealer links", async () => {
    const token = await auth("manual-a@example.com");
    const other = await auth("manual-b@example.com");
    const search = await createSearch(token);
    const otherSearch = await createSearch(other);
    const { dealer } = await addDealer(token, search._id);

    const completeManual = await request(app)
      .post(`/car-searches/${search._id}/offers`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        dealerId: dealer._id,
        msrp: 64000,
        sellingPrice: 59000,
        dealerDiscount: 2500,
        incentives: 1000,
        docFee: 499,
        tax: 3500,
        titleRegistration: 350,
        deliveryFee: 0,
        addOns: [{ name: "All-weather mats", amount: 299, required: false }],
        tradeAllowance: 18000,
        payoff: 12000,
        apr: 4.9,
        termMonths: 60,
        monthlyPayment: 720,
        downPayment: 5000,
        otdPrice: 61848,
        quoteCompleteness: "complete",
        sourceType: "manual",
        sourceText: "Manual quote from dealer email"
      });
    expect(completeManual.status).toBe(201);
    expect(completeManual.body.sourceType).toBe("manual");
    expect(completeManual.body.addOns[0]).toMatchObject({ name: "All-weather mats", amount: 299, required: false });
    expect(completeManual.body.quoteCompleteness).toBe("complete");

    const partialManual = await request(app)
      .post(`/car-searches/${search._id}/offers`)
      .set("Authorization", `Bearer ${token}`)
      .send({ dealerId: dealer._id, sellingPrice: 60000, quoteCompleteness: "partial", sourceType: "manual" });
    expect(partialManual.status).toBe(201);
    expect(partialManual.body.quoteCompleteness).toBe("partial");
    expect(partialManual.body.otdPrice).toBeUndefined();

    const crossUserDealer = await request(app)
      .post(`/car-searches/${otherSearch._id}/offers`)
      .set("Authorization", `Bearer ${other}`)
      .send({ dealerId: dealer._id, otdPrice: 1, quoteCompleteness: "complete", sourceType: "manual" });
    expect(crossUserDealer.status).toBe(404);
  });

  it("rejects invalid ids with controlled errors", async () => {
    const token = await auth("invalid-id@example.com");
    const res = await request(app).get("/car-searches/not-an-id").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid/);
  });

  it("blocks cross-user and wrong-parent mutations for child records", async () => {
    const token = await auth("scope-a@example.com");
    const other = await auth("scope-b@example.com");
    const search = await createSearch(token);
    const otherSearch = await createSearch(other);
    const { dealer } = await addDealer(token, search._id);

    const otherOffer = await request(app).post(`/car-searches/${otherSearch._id}/offers`).set("Authorization", `Bearer ${other}`).send({ dealerId: dealer._id, otdPrice: 60000, quoteCompleteness: "complete" });
    expect(otherOffer.status).toBe(404);

    const offer = await request(app).post(`/car-searches/${search._id}/offers`).set("Authorization", `Bearer ${token}`).send({ dealerId: dealer._id, otdPrice: 62000, quoteCompleteness: "complete" });
    const patchByOther = await request(app).patch(`/offers/${offer.body._id}`).set("Authorization", `Bearer ${other}`).send({ otdPrice: 1 });
    expect(patchByOther.status).toBe(404);

    const task = await request(app).post(`/car-searches/${search._id}/tasks`).set("Authorization", `Bearer ${token}`).send({ title: "Follow up", dealerId: dealer._id });
    const taskByOther = await request(app).patch(`/tasks/${task.body._id}`).set("Authorization", `Bearer ${other}`).send({ status: "done" });
    expect(taskByOther.status).toBe(404);
  });

  it("requires auth for AI parse, validates mocked AI output, handles bad AI output, and keeps extractions reviewable", async () => {
    const unauth = await request(app).post("/ai/parse-dealer-message").send({ carSearchId: "x", rawText: "hello" });
    expect(unauth.status).toBe(401);

    const token = await auth("ai@example.com");
    const search = await createSearch(token);
    const { dealer } = await addDealer(token, search._id);

    setAIClient({
      async parseDealerMessage() {
        return {
          dealer: { name: "Lexus of Portland" },
          vehicle: { year: 2026, make: "Lexus" },
          offer: { otdPrice: 61000, quoteCompleteness: "partial" },
          redFlags: ["Missing tax breakdown"],
          missingInfo: ["titleRegistration"],
          suggestedNextStep: "Ask for itemization",
          suggestedReply: "Can you itemize the OTD?",
          confidence: "high"
        };
      },
      async generateReply() {
        return { replyText: "Reply", strategyNotes: "Notes", suggestedFollowUpTitle: "Follow up", suggestedFollowUpDueAt: new Date().toISOString() };
      }
    });

    const parsed = await request(app)
      .post("/ai/parse-dealer-message")
      .set("Authorization", `Bearer ${token}`)
      .send({ carSearchId: search._id, dealerId: dealer._id, rawText: "Quote is 61k OTD" });
    expect(parsed.status).toBe(200);
    expect(parsed.body.extractionId).toBeTruthy();
    expect(parsed.body.offer.otdPrice).toBe(61000);

    const extraction = await AIExtraction.findById(parsed.body.extractionId);
    expect(extraction!.get("userConfirmed")).toBe(false);

    const offersBeforeConfirm = await request(app).get(`/car-searches/${search._id}/offers`).set("Authorization", `Bearer ${token}`);
    expect(offersBeforeConfirm.body).toHaveLength(0);

    const otherToken = await auth("ai-other@example.com");
    const crossUserConfirm = await request(app).post(`/ai-extractions/${parsed.body.extractionId}/confirm`).set("Authorization", `Bearer ${otherToken}`);
    expect(crossUserConfirm.status).toBe(404);

    const confirmed = await request(app).post(`/ai-extractions/${parsed.body.extractionId}/confirm`).set("Authorization", `Bearer ${token}`);
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.offer.otdPrice).toBe(61000);
    expect(confirmed.body.interaction.rawContent).toBe("Quote is 61k OTD");

    const offersAfterConfirm = await request(app).get(`/car-searches/${search._id}/offers`).set("Authorization", `Bearer ${token}`);
    expect(offersAfterConfirm.body).toHaveLength(1);
    expect(await Offer.countDocuments()).toBe(1);
    expect(await Interaction.countDocuments()).toBe(1);

    const duplicateConfirm = await request(app).post(`/ai-extractions/${parsed.body.extractionId}/confirm`).set("Authorization", `Bearer ${token}`);
    expect(duplicateConfirm.status).toBe(409);
    expect(await Offer.countDocuments()).toBe(1);
    expect(await Interaction.countDocuments()).toBe(1);

    setAIClient({
      async parseDealerMessage() {
        return { nope: true };
      },
      async generateReply() {
        return { replyText: "Reply", strategyNotes: "Notes", suggestedFollowUpTitle: "Follow up", suggestedFollowUpDueAt: new Date().toISOString() };
      }
    });
    const bad = await request(app)
      .post("/ai/parse-dealer-message")
      .set("Authorization", `Bearer ${token}`)
      .send({ carSearchId: search._id, rawText: "bad" });
    expect(bad.status).toBe(502);
  });

  it("generates replies, saves outbound interaction, marks contacted, and creates follow-up tasks with user scoping", async () => {
    const unauth = await request(app).post("/ai/generate-reply").send({ carSearchId: "x", dealerId: "y" });
    expect(unauth.status).toBe(401);

    const token = await auth("reply-a@example.com");
    const other = await auth("reply-b@example.com");
    const search = await createSearch(token);
    const otherSearch = await createSearch(other);
    const { dealer } = await addDealer(token, search._id);
    const { dealer: otherDealer } = await addDealer(other, otherSearch._id);
    const offer = await request(app).post(`/car-searches/${search._id}/offers`).set("Authorization", `Bearer ${token}`).send({ dealerId: dealer._id, otdPrice: 61000, quoteCompleteness: "complete" });

    setAIClient({
      async parseDealerMessage() {
        return { nope: true };
      },
      async generateReply() {
        return {
          replyText: "Thanks, please confirm the itemized OTD.",
          strategyNotes: "Keep trade and financing separate.",
          suggestedFollowUpTitle: "Follow up on OTD quote",
          suggestedFollowUpDueAt: "2026-07-09T12:00:00.000Z"
        };
      }
    });

    const crossDealer = await request(app).post("/ai/generate-reply").set("Authorization", `Bearer ${token}`).send({ carSearchId: search._id, dealerId: otherDealer._id });
    expect(crossDealer.status).toBe(404);

    const crossOffer = await request(app).post("/ai/generate-reply").set("Authorization", `Bearer ${other}`).send({ carSearchId: otherSearch._id, dealerId: otherDealer._id, offerId: offer.body._id });
    expect(crossOffer.status).toBe(404);

    const generated = await request(app).post("/ai/generate-reply").set("Authorization", `Bearer ${token}`).send({ carSearchId: search._id, dealerId: dealer._id, offerId: offer.body._id, tone: "friendly" });
    expect(generated.status).toBe(200);
    expect(generated.body.replyText).toContain("itemized OTD");
    expect(generated.body.suggestedFollowUpTitle).toBe("Follow up on OTD quote");

    const outbound = await request(app)
      .post(`/car-searches/${search._id}/interactions`)
      .set("Authorization", `Bearer ${token}`)
      .send({ dealerId: dealer._id, offerId: offer.body._id, type: "email", direction: "outbound", rawContent: generated.body.replyText, aiSummary: generated.body.strategyNotes });
    expect(outbound.status).toBe(201);
    expect(outbound.body.direction).toBe("outbound");

    const marked = await request(app).patch(`/dealers/${dealer._id}`).set("Authorization", `Bearer ${token}`).send({ status: "contacted", lastContactedAt: "2026-07-07T12:00:00.000Z" });
    expect(marked.status).toBe(200);
    expect(marked.body.status).toBe("contacted");
    expect(marked.body.lastContactedAt).toBeTruthy();

    const task = await request(app)
      .post(`/car-searches/${search._id}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ dealerId: dealer._id, title: generated.body.suggestedFollowUpTitle, dueAt: generated.body.suggestedFollowUpDueAt });
    expect(task.status).toBe(201);
    expect(task.body.title).toBe("Follow up on OTD quote");
    expect(task.body.dealerId).toBe(dealer._id);
  });

  it("generates initial outreach messages from active search details and requires auth", async () => {
    const unauth = await request(app).post("/outreach/initial-message").send({ carSearchId: "x" });
    expect(unauth.status).toBe(401);

    const token = await auth("outreach-message@example.com");
    const search = await createSearch(token);
    const { dealer } = await addDealer(token, search._id);

    const res = await request(app)
      .post("/outreach/initial-message")
      .set("Authorization", `Bearer ${token}`)
      .send({ carSearchId: search._id, dealerId: dealer._id });

    expect(res.status).toBe(200);
    expect(res.body.messageText).toContain("2026 Lexus RX 350h Premium AWD");
    expect(res.body.messageText).toContain("itemized out-the-door quote");
    expect(res.body.messageText).toContain("financing and trade-in separate");
    expect(res.body.messageText).not.toMatch(/down payment|monthly payment|trade-in amount/i);
  });

  it("marks selected dealers contacted, creates outbound interactions and follow-up tasks, and creates no offers", async () => {
    const unauth = await request(app).post("/outreach/mark-contacted").send({ carSearchId: "x", dealerIds: ["y"], messageText: "hello" });
    expect(unauth.status).toBe(401);

    const token = await auth("outreach-a@example.com");
    const other = await auth("outreach-b@example.com");
    const search = await createSearch(token);
    const otherSearch = await createSearch(other);
    const { dealer } = await addDealer(token, search._id);
    const { dealer: otherDealer } = await addDealer(other, otherSearch._id);
    const messageText = "Hi, please send an itemized OTD quote.";

    const crossUser = await request(app)
      .post("/outreach/mark-contacted")
      .set("Authorization", `Bearer ${token}`)
      .send({ carSearchId: search._id, dealerIds: [otherDealer._id], messageText, createFollowUp: true });
    expect(crossUser.status).toBe(404);

    const marked = await request(app)
      .post("/outreach/mark-contacted")
      .set("Authorization", `Bearer ${token}`)
      .send({ carSearchId: search._id, dealerIds: [dealer._id], messageText, createFollowUp: true });

    expect(marked.status).toBe(200);
    expect(marked.body.dealers[0].status).toBe("contacted");
    expect(marked.body.dealers[0].lastContactedAt).toBeTruthy();
    expect(marked.body.interactions[0]).toMatchObject({ dealerId: dealer._id, direction: "outbound", rawContent: messageText });
    expect(marked.body.tasks[0]).toMatchObject({ dealerId: dealer._id, title: "Follow up with Berlin City Lexus of Portland", status: "open" });
    expect(await Offer.countDocuments()).toBe(0);

    const duplicate = await request(app)
      .post("/outreach/mark-contacted")
      .set("Authorization", `Bearer ${token}`)
      .send({ carSearchId: search._id, dealerIds: [dealer._id], messageText, createFollowUp: true });

    expect(duplicate.status).toBe(200);
    expect(await Interaction.countDocuments({ dealerId: dealer._id, rawContent: messageText })).toBe(1);
    expect(await Task.countDocuments({ dealerId: dealer._id, status: "open" })).toBe(1);
  });

  it("returns controlled errors for invalid outreach dealer ids", async () => {
    const token = await auth("outreach-invalid@example.com");
    const search = await createSearch(token);
    const res = await request(app)
      .post("/outreach/mark-contacted")
      .set("Authorization", `Bearer ${token}`)
      .send({ carSearchId: search._id, dealerIds: ["not-an-id"], messageText: "hello", createFollowUp: false });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid dealerId/);
  });

  it("seeds built-in message templates idempotently and supports template management permissions", async () => {
    await seedBuiltInMessageTemplates();
    await seedBuiltInMessageTemplates();
    expect(await MessageTemplate.countDocuments({ isBuiltIn: true, category: "initial_outreach" })).toBe(20);

    const token = await auth("templates@example.com");
    const list = await request(app).get("/message-templates?category=initial_outreach").set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(20);

    const builtIn = list.body[0];
    const blockedEdit = await request(app).patch(`/message-templates/${builtIn._id}`).set("Authorization", `Bearer ${token}`).send({ name: "Edited" });
    expect(blockedEdit.status).toBe(404);

    const custom = await request(app)
      .post("/message-templates")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "My opener", category: "initial_outreach", tone: "friendly", body: "Hi {{dealerName}} about {{year}} {{make}}.", variables: ["dealerName", "year", "make"] });
    expect(custom.status).toBe(201);
    expect(custom.body.isBuiltIn).toBe(false);

    const duplicate = await request(app).post(`/message-templates/${builtIn._id}/duplicate`).set("Authorization", `Bearer ${token}`);
    expect(duplicate.status).toBe(201);
    expect(duplicate.body.userId).toBeTruthy();
  });

  it("uses unused templates first, records edited usage, sorts used templates later, and creates no offers", async () => {
    await seedBuiltInMessageTemplates();
    const token = await auth("template-outreach@example.com");
    const search = await createSearch(token);
    const { dealer } = await addDealer(token, search._id);

    const generated = await request(app)
      .post("/outreach/initial-message")
      .set("Authorization", `Bearer ${token}`)
      .send({ carSearchId: search._id, dealerId: dealer._id });
    expect(generated.status).toBe(200);
    expect(generated.body.templateId).toBeTruthy();
    expect(generated.body.usedWithThisDealer).toBe(false);
    expect(generated.body.messageText).toContain("2026 Lexus RX 350h Premium AWD");

    const editedText = `${generated.body.messageText}\nPlease reply by email if possible.`;
    const marked = await request(app)
      .post("/outreach/mark-contacted")
      .set("Authorization", `Bearer ${token}`)
      .send({ carSearchId: search._id, dealerIds: [dealer._id], messageText: editedText, templateId: generated.body.templateId, createFollowUp: true });

    expect(marked.status).toBe(200);
    expect(marked.body.interactions[0].rawContent).toBe(editedText);
    expect(marked.body.templateUsages[0].usedBody).toBe(editedText);
    expect(await MessageTemplateUsage.countDocuments({ dealerId: dealer._id, templateId: generated.body.templateId })).toBe(1);
    expect(await Offer.countDocuments()).toBe(0);

    const templates = await request(app).get(`/message-templates?category=initial_outreach&dealerId=${dealer._id}`).set("Authorization", `Bearer ${token}`);
    expect(templates.status).toBe(200);
    expect(templates.body.find((template: { _id: string }) => template._id === generated.body.templateId).usedWithThisDealer).toBe(true);
    expect(templates.body[0].usedWithThisDealer).toBe(false);
  });

  it("scopes template usage and dealer timeline by user and includes dealer events newest first", async () => {
    await seedBuiltInMessageTemplates();
    const token = await auth("timeline-a@example.com");
    const other = await auth("timeline-b@example.com");
    const search = await createSearch(token);
    const { dealer } = await addDealer(token, search._id);
    const generated = await request(app).post("/outreach/initial-message").set("Authorization", `Bearer ${token}`).send({ carSearchId: search._id, dealerId: dealer._id });
    await request(app)
      .post("/outreach/mark-contacted")
      .set("Authorization", `Bearer ${token}`)
      .send({ carSearchId: search._id, dealerIds: [dealer._id], messageText: "Edited message", templateId: generated.body.templateId, createFollowUp: true });
    await request(app).post(`/car-searches/${search._id}/offers`).set("Authorization", `Bearer ${token}`).send({ dealerId: dealer._id, otdPrice: 63700, quoteCompleteness: "complete" });
    await AIExtraction.create({
      userId: (await User.findOne({ email: "timeline-a@example.com" }))!._id,
      carSearchId: search._id,
      dealerId: dealer._id,
      inputType: "dealer_message",
      rawInput: "Dealer reply",
      extractedJson: {},
      suggestedNextStep: "Review quote"
    });

    const blocked = await request(app).get(`/dealers/${dealer._id}/timeline`).set("Authorization", `Bearer ${other}`);
    expect(blocked.status).toBe(404);

    const timeline = await request(app).get(`/dealers/${dealer._id}/timeline`).set("Authorization", `Bearer ${token}`);
    expect(timeline.status).toBe(200);
    const types = timeline.body.items.map((item: { type: string }) => item.type);
    expect(types).toEqual(expect.arrayContaining(["interaction", "offer", "task", "ai_extraction", "template_usage", "dealer_status"]));
    const times = timeline.body.items.map((item: { occurredAt: string }) => new Date(item.occurredAt).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));

    const otherView = await request(app).get(`/message-templates?category=initial_outreach&dealerId=${dealer._id}`).set("Authorization", `Bearer ${other}`);
    expect(otherView.status).toBe(404);
  });
});
