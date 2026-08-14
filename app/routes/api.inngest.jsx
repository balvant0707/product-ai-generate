import { serve } from "inngest/remix";
import { inngest } from "../inngest/client";
import { bulkGenerateFunction } from "../inngest/bulkGenerate";

// serveHost must be pinned: the SDK otherwise derives the callback URL from
// whatever host the registration request arrived on. The startup sync PUTs
// 127.0.0.1, which would register a URL Inngest can never reach — it would call
// itself, and runs would sit pending with no error on our side.
const serveHost = (process.env.SHOPIFY_APP_URL || "").replace(/\/+$/, "");

const handler = serve({
  client: inngest,
  functions: [bulkGenerateFunction],
  ...(serveHost ? { serveHost } : {}),
});

export const loader = handler;
export const action = handler;
