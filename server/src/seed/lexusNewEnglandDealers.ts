export type DealerSeedInput = {
  name: string;
  brand: string;
  address?: string;
  city: string;
  state: string;
  zip?: string;
  phone?: string;
  websiteUrl?: string;
  inventoryUrl?: string;
  latitude?: number;
  longitude?: number;
  source: string;
  lastVerifiedAt?: Date;
  needsVerification?: boolean;
};

const verifiedAt = new Date("2026-07-08T00:00:00.000Z");

export const lexusNewEnglandDealers: DealerSeedInput[] = [
  {
    name: "Berlin City Lexus of Portland",
    brand: "Lexus",
    address: "191 Riverside St",
    city: "Portland",
    state: "ME",
    zip: "04103",
    phone: "207-774-6318",
    websiteUrl: "https://www.berlincitylexusme.com/",
    inventoryUrl: "https://www.berlincitylexusme.com/new-vehicles/",
    latitude: 43.6867,
    longitude: -70.3266,
    source: "Official dealer website URL; details and coordinates need manual verification",
    lastVerifiedAt: verifiedAt,
    needsVerification: true
  },
  {
    name: "Ira Lexus of Manchester",
    brand: "Lexus",
    address: "18 Kilton Rd",
    city: "Bedford",
    state: "NH",
    zip: "03110",
    phone: "603-218-3500",
    websiteUrl: "https://www.iralexusofmanchester.com/",
    inventoryUrl: "https://www.iralexusofmanchester.com/new-vehicles/",
    latitude: 42.946,
    longitude: -71.471,
    source: "Official dealer website URL; details and coordinates need manual verification",
    lastVerifiedAt: verifiedAt,
    needsVerification: true
  },
  {
    name: "Lexus of Northborough",
    brand: "Lexus",
    address: "14 Belmont St. (Route 9)",
    city: "Northborough",
    state: "MA",
    zip: "01532",
    phone: "508-501-1794",
    websiteUrl: "https://www.lexusofnorthborough.com/",
    inventoryUrl: "https://www.lexusofnorthborough.com/new-vehicles/",
    latitude: 42.282396,
    longitude: -71.662039,
    source: "Dealer website contact page",
    lastVerifiedAt: verifiedAt,
    needsVerification: false
  },
  {
    name: "Lexus of Watertown",
    brand: "Lexus",
    address: "330 Arsenal St",
    city: "Watertown",
    state: "MA",
    zip: "02472",
    phone: "617-393-1000",
    websiteUrl: "https://www.lexusofwatertown.com/",
    inventoryUrl: "https://www.lexusofwatertown.com/new-vehicles/",
    latitude: 42.3634,
    longitude: -71.1664,
    source: "Official dealer website URL; details and coordinates need manual verification",
    lastVerifiedAt: verifiedAt,
    needsVerification: true
  },
  {
    name: "Herb Chambers Lexus of Sharon",
    brand: "Lexus",
    address: "25 Providence Hwy",
    city: "Sharon",
    state: "MA",
    zip: "02067",
    phone: "781-784-1000",
    websiteUrl: "https://www.herbchamberslexusofsharon.com/",
    inventoryUrl: "https://www.herbchamberslexusofsharon.com/new-vehicles/",
    latitude: 42.1137,
    longitude: -71.1839,
    source: "Official dealer website URL; details and coordinates need manual verification",
    lastVerifiedAt: verifiedAt,
    needsVerification: true
  },
  {
    name: "Herb Chambers Lexus of Hingham",
    brand: "Lexus",
    address: "141 Derby St",
    city: "Hingham",
    state: "MA",
    zip: "02043",
    phone: "781-210-5200",
    websiteUrl: "https://www.herbchamberslexusofhingham.com/",
    inventoryUrl: "https://www.herbchamberslexusofhingham.com/new-vehicles/",
    latitude: 42.1784,
    longitude: -70.9089,
    source: "Official dealer website URL; details and coordinates need manual verification",
    lastVerifiedAt: verifiedAt,
    needsVerification: true
  },
  {
    name: "Lexus of Warwick",
    brand: "Lexus",
    address: "1515 Bald Hill Rd",
    city: "Warwick",
    state: "RI",
    zip: "02886",
    phone: "401-821-1510",
    websiteUrl: "https://www.lexusofwarwick.com/",
    inventoryUrl: "https://www.lexusofwarwick.com/new-vehicles/",
    latitude: 41.711,
    longitude: -71.4805,
    source: "Official dealer website URL; details and coordinates need manual verification",
    lastVerifiedAt: verifiedAt,
    needsVerification: true
  },
  {
    name: "New Country Lexus of Westport",
    brand: "Lexus",
    address: "1317 Post Rd E",
    city: "Westport",
    state: "CT",
    zip: "06880",
    phone: "203-255-1531",
    websiteUrl: "https://www.newcountrylexusofwestport.com/",
    inventoryUrl: "https://www.newcountrylexusofwestport.com/new-vehicles/",
    latitude: 41.1388,
    longitude: -73.329,
    source: "Official dealer website URL; details and coordinates need manual verification",
    lastVerifiedAt: verifiedAt,
    needsVerification: true
  },
  {
    name: "Lexus of North Haven",
    brand: "Lexus",
    address: "655 Washington Ave",
    city: "North Haven",
    state: "CT",
    zip: "06473",
    phone: "203-466-9999",
    websiteUrl: "https://www.lexusofnorthhaven.com/",
    inventoryUrl: "https://www.lexusofnorthhaven.com/new-vehicles/",
    latitude: 41.4142,
    longitude: -72.8414,
    source: "Official dealer website URL; details and coordinates need manual verification",
    lastVerifiedAt: verifiedAt,
    needsVerification: true
  }
];
