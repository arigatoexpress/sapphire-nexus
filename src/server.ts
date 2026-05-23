import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { resolveServerConfig } from "./server-config.js";

const { host, port } = resolveServerConfig();

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
