import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const host = process.env.SAPPHIRE_NEXUS_HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.SAPPHIRE_NEXUS_PORT ?? "4420", 10);

serve(
  {
    fetch: createApp().fetch,
    hostname: host,
    port,
  },
  (info) => {
    console.log(`Sapphire Nexus listening on http://${info.address}:${info.port}`);
  },
);

