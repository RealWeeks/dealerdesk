import { connectDb, disconnectDb } from "../config/db";
import { seedDealerSeeds } from "../seed/dealerSeedService";

export async function seedDealers() {
  await seedDealerSeeds();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await connectDb();
  await seedDealers();
  await disconnectDb();
}
