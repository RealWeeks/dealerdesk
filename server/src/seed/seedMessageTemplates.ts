import { connectDb, disconnectDb } from "../config/db";
import { seedBuiltInMessageTemplates } from "./messageTemplateService";

async function main() {
  await connectDb();
  const dryRun = process.argv.includes("--dry-run");
  try {
    const result = await seedBuiltInMessageTemplates({ dryRun });
    console.log(JSON.stringify({
      dryRun,
      inserted: result.inserted.length,
      updated: result.updated.length,
      total: result.total
    }, null, 2));
  } finally {
    await disconnectDb();
  }
}

void main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
