import { copySync } from "jsr:@std/fs@1.0.21/copy";
import version from "../version.txt" with { type: "text" };

// clean dist
try {
  Deno.removeSync("./dist", { recursive: true });
} catch {}

// create dist and dist/msix
Deno.mkdirSync("./dist/msix", { recursive: true });

// copy msix asset to dist
copySync("./msix_assets", "./dist/msix", { overwrite: true });
copySync("./tak.exe", "./dist/msix/tak.exe", { overwrite: true });

// replace version in appxmanifest
let appxmanifest = Deno.readTextFileSync("./dist/msix/appxmanifest.xml");
appxmanifest = appxmanifest.replace(
  'Version="0.0.0.0"',
  `Version="${version.replace("v", "").trim()}.0"`,
);
Deno.writeTextFileSync("./dist/msix/appxmanifest.xml", appxmanifest);
