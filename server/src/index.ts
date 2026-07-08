import { createApp } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";

await connectDb();
createApp().listen(env.PORT, () => {
  console.log(`DealDesk API listening on http://localhost:${env.PORT}`);
});
