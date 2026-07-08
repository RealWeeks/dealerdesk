type CarSearchLike = {
  get(path: string): unknown;
};

type DealerLike = {
  get(path: string): unknown;
};

type VehicleLike = {
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

// A specific inventory unit rendered for a buyer: "2026 Lexus RX 350h Premium AWD
// (stock #L24-8891, VIN JTH...)". Falls back to whatever fields exist.
export function vehicleDescriptor(vehicle: VehicleLike) {
  const base = [vehicle.get("year"), vehicle.get("make"), vehicle.get("model"), vehicle.get("trim")].filter(Boolean).join(" ");
  const details: string[] = [];
  const stockNumber = vehicle.get("stockNumber");
  const vin = vehicle.get("vin");
  if (stockNumber) details.push(`stock #${stockNumber}`);
  if (vin) details.push(`VIN ${vin}`);
  return details.length ? `${base} (${details.join(", ")})`.trim() : base;
}

export function renderTemplateBody(body: string, search: CarSearchLike, dealer?: DealerLike, vehicle?: VehicleLike) {
  const listedPrice = vehicle?.get("listedPrice");
  const variables: Record<string, string> = {
    year: stringValue(search.get("year")),
    make: stringValue(search.get("make")),
    model: stringValue(search.get("model")),
    trim: stringValue(search.get("trim")),
    buyerZip: stringValue(search.get("zipCode")),
    dealerName: stringValue(dealer?.get("name")),
    vin: stringValue(vehicle?.get("vin")),
    stockNumber: stringValue(vehicle?.get("stockNumber")),
    exteriorColor: stringValue(vehicle?.get("exteriorColor")),
    listedPrice: typeof listedPrice === "number" ? listedPrice.toLocaleString() : stringValue(listedPrice),
    vehicleDescriptor: vehicle ? vehicleDescriptor(vehicle) : vehicleLabel(search)
  };
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => variables[key] ?? "");
}

export function buildInitialOutreachMessage(search: CarSearchLike, vehicle?: VehicleLike) {
  const targetOtdPrice = search.get("targetOtdPrice");
  const targetLine = typeof targetOtdPrice === "number"
    ? `I am targeting a competitive itemized out-the-door number around $${targetOtdPrice.toLocaleString()}.`
    : "I am comparing itemized out-the-door numbers across several dealers.";

  // When anchored to a specific unit, ask about *that* car rather than a generic
  // "do you have anything matching" inquiry.
  let openingLine: string;
  if (vehicle) {
    const listedPrice = vehicle.get("listedPrice");
    const priceNote = typeof listedPrice === "number" ? `, listed at $${listedPrice.toLocaleString()}` : "";
    openingLine = `I am a serious buyer interested in a specific vehicle you have listed: ${vehicleDescriptor(vehicle)}${priceNote}. Is it still available?`;
  } else {
    openingLine = `I am a serious buyer looking for a ${vehicleLabel(search)}. Do you have any in-stock or incoming units that match or are close to that configuration?`;
  }

  const messageText = [
    "Hi,",
    "",
    openingLine,
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
    strategyNotes: vehicle
      ? "Anchored to a specific inventory unit. Keeps financing and trade-in separate and asks for a comparable itemized OTD quote."
      : "Friendly, concise initial outreach. Keeps financing and trade-in separate and asks for a comparable itemized OTD quote."
  };
}
