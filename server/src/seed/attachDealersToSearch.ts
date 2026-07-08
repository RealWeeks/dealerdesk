import { connectDb, disconnectDb } from "../config/db";
import { attachSeededDealers } from "./dealerSeedService";

function arg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const email = arg("--email");
if (!email) {
  console.error("Missing required --email argument.");
  process.exit(1);
}

const radius = arg("--radius");
const brand = arg("--brand") ?? "Lexus";
const dryRun = process.argv.includes("--dry-run");

await connectDb();
try {
  const report = await attachSeededDealers({ email, brand, radius: radius ? Number(radius) : undefined, dryRun });
  console.log(JSON.stringify({ dryRun, email, brand, radius: radius ? Number(radius) : undefined, ...report }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await disconnectDb();
}
