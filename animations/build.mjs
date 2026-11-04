// Bundles the player and copies the authored document into ../motion/.
import { build } from "esbuild";
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("../motion", { recursive: true });
await build({
  entryPoints: ["player.ts"],
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2022",
  outfile: "../motion/player.js",
});
copyFileSync("out/world.json", "../motion/world.json");
