import { connectDb, disconnectDb } from "../config/db";
import { seedDealerSeeds } from "./dealerSeedService";

const dryRun = process.argv.includes("--dry-run");

await connectDb();
try {
  const report = await seedDealerSeeds({ dryRun });
  console.log(JSON.stringify({ dryRun, ...report }, null, 2));
} finally {
  await disconnectDb();
}
