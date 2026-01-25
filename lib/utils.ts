import { isDev } from "./config.ts";
import { log } from "./log.ts";

export function sliceIntoBatches<T>(arr: T[], batchSize: number) {
  const batches = [];
  for (let i = 0; i < arr.length; i += batchSize) {
    const batch = arr.slice(i, i + batchSize);
    batches.push(batch);
  }
  return batches;
}

let port = 0;
// get a port from the OS
export async function getPort() {
  if (isDev) port = 8082;
  if (!port) {
    const server = Deno.serve(
      { port: 0 },
      (_req) => new Response("Hello, world"),
    );
    port = server.addr.port;
    await server.shutdown();
    log(`listening on port ${port}`);
  }
  return port;
}
