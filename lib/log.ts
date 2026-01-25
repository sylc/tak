import { isDev, logsFilePath, version } from "./config.ts";

export function log(msg: unknown) {
  if (isDev) console.log(msg);
  else {
    Deno.writeTextFileSync(
      logsFilePath,
      // deno-lint-ignore no-explicit-any
      `${Date.now()} - ${version} - ${(msg as any).toString()}\n`,
      {
        append: true,
      },
    );
  }
}
