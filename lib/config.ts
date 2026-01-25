import path from "path";
import versionData from "../version.txt" with { type: "text" };
export const version = versionData;

export const isDev = Deno.env.get("DEV") === "true";

let _rootStoragefolder = "./.tak";

if (!isDev) {
  if (Deno.build.os === "windows") {
    // set root to appData
    _rootStoragefolder = path.join(Deno.env.get("LOCALAPPDATA")!, "tak");
  } else {
    // set root to home
    _rootStoragefolder = path.join("HOME", "tak");
  }
}

export const rootStoragefolder = _rootStoragefolder;
export const logsFilePath = path.join(rootStoragefolder, "logs", "log.txt");
export const dbPath = path.join(rootStoragefolder, "db");
