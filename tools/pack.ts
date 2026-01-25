import { copySync } from "jsr:@std/fs@1.0.21/copy";
import version from "../version.txt" with { type: "text" };

// clean dist
Deno.removeSync("./dist", { recursive: true });

// create dist and dist/msix
Deno.mkdirSync("./dist/msix", { recursive: true });

// copy msix asset to dist
copySync("./msix_assets", "./dist/msix", { overwrite: true });
copySync("./tak.exe", "./dist/msix/tak.exe", { overwrite: true });

// replace version in appxmanifest
const appxmanifest = Deno.readTextFileSync("./dist/msix/appxmanifest.xml");
appxmanifest.replace(
  'Version="0.0.0.0"',
  `Version="${version.replace("v", "")}"`,
);
