import * as path from "path";
import versionData from "../version.txt" with { type: "text" };
import publisherId from "../publisherId.txt" with { type: "text" };

export const version = versionData;

export const isDev = Deno.env.get("DEV") === "true";
const isAppx = Deno.args.includes("--appx") && Deno.build.os === "windows";

let _rootStoragefolder = "./.tak";

if (!isDev) {
  if (Deno.build.os === "windows") {
    // set root to appData only on appx for now.
    if (isAppx) {
      _rootStoragefolder = path.join(Deno.env.get("LOCALAPPDATA")!, "tak");
    }
  } else {
    // set root to home
    _rootStoragefolder = path.join("HOME", "tak");
  }
}

export const rootStoragefolder = _rootStoragefolder;
export const logsFolderPath = path.join(rootStoragefolder, "logs");
export const logsFilePath = path.join(logsFolderPath, "log.txt");
export const dbPath = path.join(rootStoragefolder, "db");

export const exportsFolderPath = path.join(rootStoragefolder, "exports");

export const appxRealExportsFolderPath = isAppx
  ? path.join(
    Deno.env.get("LOCALAPPDATA")!,
    `Packages/tak_${publisherId}/LocalCache/Local/tak/exports`,
  )
  : exportsFolderPath;
