/** Runs once when a server instance starts (Next.js instrumentation hook). */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportProductionEnv } = await import("./lib/env-check");
    reportProductionEnv();
  }
}
