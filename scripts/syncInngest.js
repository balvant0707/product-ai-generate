// Registers this container's Inngest functions with the Inngest server.
//
// The SDK does not self-register: until something sends a PUT to the serve
// endpoint, Inngest accepts events but has no function to run them against, so
// jobs sit in "pending" forever. Every new container needs its own sync, which
// is why this runs from docker-start rather than as a deploy-time step.
//
// Runs in the background while the server boots, so it polls until the port is
// accepting connections. Failures are logged and never crash the app — a
// missing sync degrades bulk generation, it shouldn't take the storefront down.

const PORT = process.env.PORT || 3000;
const ENDPOINT = `http://127.0.0.1:${PORT}/api/inngest`;

const MAX_ATTEMPTS = 30;
const RETRY_DELAY_MS = 2000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isNotListeningYet(err) {
  const message = `${err?.message ?? ""} ${err?.cause?.code ?? ""}`;
  return /ECONNREFUSED|ECONNRESET|socket hang up|fetch failed/i.test(message);
}

async function sync() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(ENDPOINT, { method: "PUT" });
      const body = await res.text();

      if (res.ok) {
        console.log(`[inngest-sync] registered functions — ${body.trim()}`);
        return;
      }

      // The server is up and answering, so a bad status is a real problem
      // (wrong signing key, Inngest unreachable) rather than a timing issue.
      console.error(
        `[inngest-sync] PUT ${ENDPOINT} returned ${res.status}: ${body.trim()}`
      );
      if (attempt >= 3) return;
    } catch (err) {
      if (!isNotListeningYet(err)) {
        console.error(`[inngest-sync] failed: ${err.message}`);
        return;
      }
      // Server still starting up — keep waiting.
    }

    await sleep(RETRY_DELAY_MS);
  }

  console.error(
    `[inngest-sync] gave up after ${MAX_ATTEMPTS} attempts; bulk generation will not run until a PUT to /api/inngest succeeds`
  );
}

sync();
