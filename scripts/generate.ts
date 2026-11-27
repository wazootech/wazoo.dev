import { writeFileSync } from "node:fs";
import { buildArtifacts } from "./artifacts.ts";

const root = new URL("../", import.meta.url);

for (const [path, content] of buildArtifacts(root)) {
  writeFileSync(new URL(path, root), content);
  console.log(`wrote ${path}`);
}
