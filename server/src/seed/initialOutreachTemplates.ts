export const initialOutreachVariables = ["year", "make", "model", "trim", "dealerName", "buyerZip"];

const bodies = [
  "Hi — I’m shopping for a {{year}} {{make}} {{model}} {{trim}} and reaching out to a few {{make}} dealers. Do you have anything in stock or incoming that matches? If so, could you send an itemized out-the-door quote with selling price, doc fee, taxes, registration, any required add-ons, and final OTD? I’m keeping trade-in and financing separate for now so I can compare apples to apples. Thanks.",
  "Hello, I’m looking for a {{year}} {{make}} {{model}} {{trim}} near {{buyerZip}}. If you have one available or incoming, can you send over the full itemized OTD price? I’m trying to compare selling price, doc fee, taxes, registration, required add-ons, and final OTD separately from financing or trade-in. Thanks.",
  "Hi {{dealerName}}, I’m interested in a {{year}} {{make}} {{model}} {{trim}}. Do you have any matching units on the ground or allocated soon? If yes, I’d appreciate an itemized out-the-door quote with all fees, taxes, registration, add-ons, and final OTD. I’m keeping trade and financing separate while I compare options.",
  "Hi, I’m a serious buyer for a {{year}} {{make}} {{model}} {{trim}} and wanted to check availability. Could you let me know what you have in stock or incoming, and send an itemized OTD quote if there’s a match? I’m comparing vehicle pricing only for now, separate from trade-in and financing.",
  "Hello — I’m shopping for a {{year}} {{make}} {{model}} {{trim}}. If you have one available or arriving soon, could you share the selling price and a complete out-the-door breakdown including doc fee, tax, title/registration, required add-ons, and final OTD? Trade-in and financing are separate for now.",
  "Hi, do you currently have or expect a {{year}} {{make}} {{model}} {{trim}}? If so, can you send a clear itemized OTD quote? I’m trying to keep comparisons simple: selling price, fees, taxes, registration, add-ons, and final OTD only.",
  "Good morning, I’m looking for a {{year}} {{make}} {{model}} {{trim}} and comparing a few options. Could you tell me if you have a matching unit in stock or incoming, plus an itemized out-the-door number? I’m keeping trade-in and financing out of the quote for now.",
  "Hi there — I’m interested in a {{year}} {{make}} {{model}} {{trim}}. If you have one available or inbound, could you send the full OTD breakdown with selling price, doc fee, taxes, registration, required add-ons, and final total? I’m comparing offers without trade or financing included.",
  "Hello, I’m ready to move forward on the right {{year}} {{make}} {{model}} {{trim}}. Do you have anything matching in stock or incoming? If yes, please send an itemized OTD quote so I can compare cleanly. Trade-in and financing are separate for now.",
  "Hi — checking on availability for a {{year}} {{make}} {{model}} {{trim}}. If you have a match, could you send over the selling price and full out-the-door breakdown? I’m looking for doc fee, taxes, title/registration, any required add-ons, and final OTD.",
  "Hello {{dealerName}}, I’m shopping from {{buyerZip}} for a {{year}} {{make}} {{model}} {{trim}}. Could you let me know what you have available or incoming? If there’s a match, please send an itemized OTD quote. I’m keeping financing and trade-in separate to compare fairly.",
  "Hi, I’m comparing availability on a {{year}} {{make}} {{model}} {{trim}}. If you have one or one coming in, can you send the itemized out-the-door price? I’d like to see selling price, doc fee, taxes, registration, required add-ons, and the final total.",
  "Hi — I’m looking for a straightforward quote on a {{year}} {{make}} {{model}} {{trim}} if you have one available or incoming. Could you send the full itemized OTD breakdown? I’m not including trade-in or financing in the comparison right now.",
  "Hello, I wanted to ask about a {{year}} {{make}} {{model}} {{trim}}. If you have one in stock or allocated, could you send an itemized out-the-door quote with all required fees and add-ons shown separately? I’m comparing the vehicle price only at this stage.",
  "Hi there, I’m shopping for a {{year}} {{make}} {{model}} {{trim}} and trying to keep quotes easy to compare. Do you have a matching unit available or incoming? If so, please send selling price, doc fee, taxes, registration, required add-ons, and final OTD.",
  "Hello — I’m interested in buying a {{year}} {{make}} {{model}} {{trim}}. Could you confirm whether you have one available or incoming, and send an itemized OTD quote if so? I’m keeping trade and financing separate until I compare the numbers.",
  "Hi, I’m checking with local/regional dealers on a {{year}} {{make}} {{model}} {{trim}}. If you have one that matches, can you share the complete OTD quote, broken out by selling price, fees, taxes, registration, add-ons, and final total?",
  "Good afternoon, I’m looking for a {{year}} {{make}} {{model}} {{trim}} near {{buyerZip}}. Do you have anything that matches or is incoming? If yes, I’d appreciate a complete itemized out-the-door quote. Trade-in and financing are separate for comparison.",
  "Hi {{dealerName}}, I’m interested in a {{year}} {{make}} {{model}} {{trim}} and would like to compare clean OTD numbers. Can you let me know availability and send the itemized final price including fees, taxes, registration, and required add-ons?",
  "Hello, I’m shopping for a {{year}} {{make}} {{model}} {{trim}} and wanted to see what you have available or allocated. If there’s a fit, could you send a full itemized OTD quote? I’m keeping any trade-in or financing discussion separate for now. Thanks."
];

export const builtInInitialOutreachTemplates = bodies.map((body, index) => ({
  name: `Friendly OTD Ask #${index + 1}`,
  category: "initial_outreach" as const,
  tone: index % 4 === 0 ? "casual" as const : "friendly" as const,
  body,
  variables: initialOutreachVariables,
  isBuiltIn: true,
  isActive: true
}));
