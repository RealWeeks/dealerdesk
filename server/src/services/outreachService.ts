type CarSearchLike = {
  get(path: string): unknown;
};

type DealerLike = {
  get(path: string): unknown;
};

function vehicleLabel(search: CarSearchLike) {
  return [
    search.get("year"),
    search.get("make"),
    search.get("model"),
    search.get("trim")
  ].filter(Boolean).join(" ");
}

function stringValue(value: unknown) {
  return value === undefined || value === null ? "" : String(value);
}

export function renderTemplateBody(body: string, search: CarSearchLike, dealer?: DealerLike) {
  const variables: Record<string, string> = {
    year: stringValue(search.get("year")),
    make: stringValue(search.get("make")),
    model: stringValue(search.get("model")),
    trim: stringValue(search.get("trim")),
    buyerZip: stringValue(search.get("zipCode")),
    dealerName: stringValue(dealer?.get("name"))
  };
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => variables[key] ?? "");
}

export function buildInitialOutreachMessage(search: CarSearchLike) {
  const vehicle = vehicleLabel(search);
  const targetOtdPrice = search.get("targetOtdPrice");
  const targetLine = typeof targetOtdPrice === "number"
    ? `I am targeting a competitive itemized out-the-door number around $${targetOtdPrice.toLocaleString()}.`
    : "I am comparing itemized out-the-door numbers across several dealers.";

  const messageText = [
    "Hi,",
    "",
    `I am a serious buyer looking for a ${vehicle}. Do you have any in-stock or incoming units that match or are close to that configuration?`,
    "",
    targetLine,
    "",
    "Could you please send an itemized out-the-door quote that includes:",
    "- selling price",
    "- dealer/doc fees",
    "- tax",
    "- title/registration",
    "- any required add-ons",
    "- final OTD price",
    "",
    "I am keeping financing and trade-in separate for comparison, so please quote the vehicle on its own.",
    "",
    "Thanks."
  ].join("\n");

  return {
    messageText,
    strategyNotes: "Friendly, concise initial outreach. Keeps financing and trade-in separate and asks for a comparable itemized OTD quote."
  };
}
